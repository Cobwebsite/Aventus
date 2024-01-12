import { EOL } from 'os';
import { rollup } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import virtual from '@rollup/plugin-virtual';
import nodeResolve from '@rollup/plugin-node-resolve';
import { minify } from 'terser';
import * as md5 from 'md5';
import { Build, BuildErrors } from './Build';
import { Compiled } from '../notification/Compiled';
import { DebugFileAdd } from '../notification/DebugFileAdd';


// TODO : check what to do with the package exported and how imported it back
export interface NpmBuilderInfo {
	uri: string,
	libName: string,
	alias?: string
}
export class NpmBuilder {
	private infos: {
		[uri: string]: {
			md5: string,
			all?: {
				internalAlias: string,
				externalAlias: string[]
			},
			part: {
				[libName: string]: {
					internalAlias: string,
					externalAlias: string[]
				}
			}
		}
	} = {}
	private lastInfo: string = "";
	private lastInfoToCompile: string = "";
	private internalNames: string[] = [];
	private build: Build;
	private storedInfo: { [uri: string]: NpmBuilderInfo[] } = {}

	public constructor(build: Build) {
		this.build = build;
	}

	private getInternalName(defaultValue: string) {
		if (defaultValue == "default") {
			defaultValue = "_default"
		}
		if (!this.internalNames.includes(defaultValue)) {
			this.internalNames.push(defaultValue);
			return defaultValue;
		}
		let i = 0;
		let newValue = defaultValue + '_' + i;
		while (this.internalNames.includes(newValue)) {
			i++;
			newValue = defaultValue + '_' + i;
		}
		this.internalNames.push(newValue);
		return newValue;
	}

	public register(uriFrom: string, info: NpmBuilderInfo) {
		if (!this.storedInfo[uriFrom]) {
			this.storedInfo[uriFrom] = [];
		}
		this.storedInfo[uriFrom].push(info);
		this.rebuildInfo();
	}
	public unregister(uriFrom: string) {
		if (this.storedInfo[uriFrom]) {
			delete this.storedInfo[uriFrom];
			this.rebuildInfo();
		}
	}

	public rebuildInfo() {
		if (!this.build.isBuildAllowed) {
			return
		}
		this.infos = {};
		this.internalNames = [];
		for (let uriFrom in this.storedInfo) {
			for (let info of this.storedInfo[uriFrom]) {
				const uri = info.uri;
				if (!this.infos[uri]) {
					this.infos[uri] = {
						md5: md5(uri),
						part: {}
					}
				}

				if (info.libName == "*") {
					if (!info.alias) {
						throw `The lib ${uri} inside the file ${uriFrom} has no alias => impossible`;
					}
					let all = this.infos[uri].all;
					if (!all) {
						all = {
							externalAlias: [],
							internalAlias: this.getInternalName("_default")
						}
						this.infos[uri].all = all;

					}
					if (!all.externalAlias.includes(info.alias)) {
						all.externalAlias.push(info.alias)
					}
				}
				else {
					let part = this.infos[uri].part;
					if (!part[info.libName]) {
						part[info.libName] = {
							externalAlias: [],
							internalAlias: this.getInternalName(info.libName)
						}
					}
					let alias = info.alias ? info.alias : info.libName
					if (!part[info.libName].externalAlias.includes(alias)) {
						part[info.libName].externalAlias.push(alias)
					}

				}
			}
		}
	}

	private npmBuildTxt: string = "";
	private npmDepBuildTxt: { result: string, errors: BuildErrors } = { result: "", errors: [] };
	public async compile(): Promise<{ result: string, errors: BuildErrors }> {

		if (Object.keys(this.infos).length == 0) {
			return {
				result: "",
				errors: []
			};
		}
		let currentInfo = JSON.stringify(this.infos)
		if (this.lastInfo != currentInfo) {
			this.lastInfo = currentInfo
			let toCompile = this.writeFileToCompile()
			if (this.lastInfoToCompile != toCompile.buildTxt) {
				Compiled.part("Compiling node modules");
				this.lastInfoToCompile = toCompile.buildTxt;
				this.npmDepBuildTxt = await this.rollupBuild(this.lastInfoToCompile)
				Compiled.part("Compiling node modules done");
			}

			this.npmBuildTxt = `var npmCompilation;` + EOL;
			this.npmBuildTxt += `(npmCompilation||(npmCompilation = {}));` + EOL;
			this.npmBuildTxt += `(function (npmCompilation) {
	${this.npmDepBuildTxt.result + EOL}
	${toCompile.toExport}
})(npmCompilation);`+ EOL;
		}
		return {
			result: this.npmBuildTxt,
			errors: this.npmDepBuildTxt.errors
		}
	}

	private writeFileToCompile(): { buildTxt: string, toExport: string } {
		let finalTxt = "";
		let exportTxt = "";
		let exportTxtArray: string[] = [];
		let uris = Object.keys(this.infos);
		uris.sort();
		for (let uri of uris) {
			let info = this.infos[uri];
			exportTxt += `npmCompilation['${info.md5}'] = {};` + EOL
			if (info.all) {
				finalTxt += `import * as ${info.all.internalAlias} from "${uri}";` + EOL
				exportTxtArray.push(info.all.internalAlias)
				for (let alias of info.all.externalAlias) {
					exportTxt += `npmCompilation['${info.md5}']['${alias}'] = _['${info.all.internalAlias}'];` + EOL;
				}
				for (let libName in info.part) {
					for (let alias of info.part[libName].externalAlias) {
						exportTxt += `npmCompilation['${info.md5}']['${alias}'] = _['${info.all.internalAlias}'];` + EOL;
					}
				}
			}
			else {
				let parts: string[] = []
				let libNames = Object.keys(info.part);
				libNames.sort();
				for (let libName of libNames) {
					parts.push(`${libName} as ${info.part[libName].internalAlias}`)
					exportTxtArray.push(info.part[libName].internalAlias)
					for (let alias of info.part[libName].externalAlias) {
						exportTxt += `npmCompilation['${info.md5}']['${alias}'] = _['${info.part[libName].internalAlias}'];` + EOL;
					}
				}
				finalTxt += `import {${Object.values(parts).join(", ")}} from "${uri}";` + EOL
			}
		}

		finalTxt += `export default { ${exportTxtArray.join(", ")} }`

		return {
			buildTxt: finalTxt,
			toExport: exportTxt
		};
	}
	private async rollupBuild(txt: string): Promise<{ result: string, errors: BuildErrors }> {
		let resultTxt = "{}";
		let response: { result: string, errors: BuildErrors } = {
			result: "",
			errors: []
		}
		try {
			let res = await rollup({
				input: "index.js",
				onwarn: (message) => {

				},
				output: {
					format: "iife",
					name: "_",
				},
				plugins: [
					commonjs({
						// non-CommonJS modules will be ignored, but you can also
						// specifically include/exclude files
						include: [this.build.nodeModulesDir + "/**"],//[rootDir + "/node_modules/**"], // Default: undefined

						// if true then uses of `global` won't be dealt with by this plugin
						ignoreGlobal: true, // Default: false

						// if false then skip sourceMap generation for CommonJS modules
						sourceMap: false // Default: true
					}),
					virtual({
						"index.js": txt,
					}),

					nodeResolve({
						rootDir: this.build.nodeModulesDir
					}),
				]
			})
			let result = await res.generate({
				format: 'iife',
				name: '_'
			});
			resultTxt = "";
			for (let chunk of result.output) {
				resultTxt += chunk['code'];
			}
		} catch (e) {
			let uri = this.build.fullname + "_npmErrors";
			DebugFileAdd.send(uri, (e + "").replace(/\0/g, ""));
			response.errors.push({
				title: "Npm compilation errors",
				file: uri
			})
		}

		var code = {
			"file1.js": resultTxt
		}
		try {
			const resultTemp = await minify(code, {
				compress: false,
				format: {
					comments: false,
				}
			})
			response.result = resultTemp.code || '';
		} catch (e) {
			let uri = this.build.fullname + "_minifyErrors";
			DebugFileAdd.send(uri, e + "");
			response.errors.push({
				title: "Npm minification errors",
				file: uri
			})
		}
		return response;
	}
}
