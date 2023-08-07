import { EOL } from 'os';
import { rollup } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import virtual from '@rollup/plugin-virtual';
import nodeResolve from '@rollup/plugin-node-resolve';
import { minify } from 'terser';
import terser from '@rollup/plugin-terser';
import { GenericServer } from '../GenericServer';

export type NpmDependances = {
	[module_uri: string]: {
		isGlobal?: string,
		parts: {
			[neededPart: string]: string[] // this is the rename part
		}
	}
}

export class BuildNpm {
	public async build(dependances: NpmDependances, rootDir: string): Promise<string> {
		let ordredUris = Object.keys(dependances).sort();
		let finalTxt = "";
		if (ordredUris.length > 0) {
			let toCompileImport = ``;
			let names: string[] = [];
			let toLoad: string[] = [];
			for (let uri of ordredUris) {
				let dep = dependances[uri];
				if (dep.isGlobal) {
					if (!names.includes(dep.isGlobal)) {
						toCompileImport += `import * as ${dep.isGlobal} from "${uri}";` + EOL;
						names.push(dep.isGlobal);
						toLoad.push(`var ${dep.isGlobal} = npmCompilation.${dep.isGlobal}`);
						for (let libName in dep.parts) {
							for (let localName of dep.parts[libName]) {
								toLoad.push(`var ${localName} = ${dep.isGlobal}.${libName}`);
							}
						}
					}
					else {
						GenericServer.showErrorMessage("Something went wrong with the npm export");
					}
				}
				else {
					let parts: string[] = [];
					for (let part in dep.parts) {
						if (!names.includes(part)) {
							parts.push(part);
							names.push(part);
							for (let localName of dep.parts[part]) {
								toLoad.push(`var ${localName} = npmCompilation.${part}`);
							}
						}
						else {
							GenericServer.showErrorMessage("Something went wrong with the npm export");
						}
					}
					toCompileImport += `import { ${Object.values(parts).join(", ")} } from "${uri}";` + EOL;
				}
			}

			toCompileImport += `export default { ${names.join(", ")} }`;

			finalTxt = `var npmCompilation = ` + await this.rollupBuild(toCompileImport, rootDir) + EOL;
			finalTxt += toLoad.join(EOL);

		}
		return finalTxt;
	}


	private async rollupBuild(txt: string, rootDir: string): Promise<string> {
		let resultTxt = "";
		try {
			let res = await rollup({
				input: "index.js",
				output: {
					format: "iife",
				},
				plugins: [
					commonjs({
						// non-CommonJS modules will be ignored, but you can also
						// specifically include/exclude files
						include: [rootDir + "/node_modules/**"], // Default: undefined

						// if true then uses of `global` won't be dealt with by this plugin
						ignoreGlobal: true, // Default: false

						// if false then skip sourceMap generation for CommonJS modules
						sourceMap: false // Default: true
					}),
					virtual({
						"index.js": txt,
					}),

					nodeResolve({
						rootDir: rootDir
					}),
				]
			})
			let result = await res.generate({
				format: 'iife',
			});
			for (let chunk of result.output) {
				resultTxt += chunk['code'];
			}
		} catch (e) {
			//console.log(e);
		}

		var code = {
			"file1.js": resultTxt
		}
		const resultTemp = await minify(code, {
			compress: false,
			format: {
				comments: false,
			}
		})
		return resultTemp.code || '';
		return resultTxt;
	}

}