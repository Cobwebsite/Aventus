import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { join, normalize, sep } from 'path'

export type Version = `${number}.${number}.${number}`
export interface InputOptions {
	title: string,
	value?: string,
	validations?: { regex: string, message: string }[]
}
export interface SelectOptions {
	placeHolder?: string,
	title?: string,
}

export interface SelectItem {
	label: string,
	detail?: string,
	picked?: boolean,
}
export type WriteInfo = {
	templatePath: string,
	writePath: string,
	relativePath: string,
	rawContent: string,
	content: string,
	isDir: boolean
}
export type WriteCallback = (info: WriteInfo) => void | boolean;

export type ReservedVariables = "module" | "namespace";

export type BlockInfo = {
	before: () => string,
	after: () => string,
	custom: (txt: string) => string
}

export type TemplateInfo = {
	name: string,
	description?: string,
	version?: Version,
	allowQuick?: boolean,
	organization?: string,
	tags?: string[],
	isProject?: boolean,
	installationFolder?: string
}

const trueLog = console.log;

console.log = (message?: any, ...optionalParams: any[]) => {
	trueLog(JSON.stringify({ cmd: "log", config: message }));
}

export function log(message?: any, ...optionalParams: any[]) {
	trueLog(message, ...optionalParams);
}

export const AventusExtension = {
	Base: ".avt",
	Config: "aventus.conf.avt",
	CsharpConfig: "aventus.sharp.avt",
	PhpConfig: "aventus.php.avt",
	ComponentLogic: ".wcl.avt",
	ComponentView: ".wcv.avt",
	ComponentStyle: ".wcs.avt",
	Component: ".wc.avt",
	GlobalStyle: ".gs.avt",
	Data: ".data.avt",
	Lib: ".lib.avt",
	RAM: ".ram.avt",
	State: ".state.avt",
	Static: ".static.avt",
	Definition: ".def.avt",
	DefinitionNpm: ".defnpm.avt",
	Template: "template.avt.ts",
	ConfigTemplate: "!aventus.conf.avt",
	Package: ".package.avt",
	I18n: ".i18n.avt",
} as const;

export abstract class AventusTemplate {
	private basicInfo() {
		const defaultValues = {
			description: "",
			version: "1.0.0"
		}
		const values = { ...defaultValues, ...this.meta() };
		return JSON.stringify(values);
	}
	protected abstract meta(): TemplateInfo;

	protected variables: { [key: string]: string | null | undefined } = {}
	protected blocks: {
		[key: string]: BlockInfo
	} = {}
	protected destination: string = "";
	protected workspacePath: string = "";
	protected templatePath: string = "";
	private _run(templatePath: string, destination: string, workspacePath: string) {
		return new Promise<void>((resolve) => {
			this.destination = destination;
			this.templatePath = templatePath;
			this.workspacePath = workspacePath;
			this.defaultBlocks();
			process.stdin.on("data", (data) => {
				try {
					const txt = data.toString().trim();
					const payload: { cmd: string, result: string | null } = JSON.parse(txt);
					if (payload.result == 'NULL') {
						payload.result = null;
					}
					if (this.waitingResponse[payload.cmd]) {
						this.waitingResponse[payload.cmd](payload.result);
					}
				}
				catch (e) {
					this.runCommand("error", e);
				}
			})
			this.run(destination).then(() => {
				process.exit();
			})
		})
	}

	protected defaultBlocks() {
		this.registerBlock("namespace", {
			before: () => {
				if (this.variables["namespace"]) {
					return `namespace ${this.variables["namespace"]} {`;
				}
				return "";
			},
			after: () => {
				if (this.variables["namespace"]) {
					return `}`;
				}
				return "";
			},
			custom: (v) => {
				if (this.variables["namespace"]) {
					return v;
				}
				v = this.removeIndent(v);
				return v.trim()
			}
		})
	}

	protected abstract run(destination: string): Promise<void>;

	protected async input(config: InputOptions): Promise<string | null> {
		let response = await this.runCommandWithAnswer('input', config);
		return response;
	}

	protected async select(items: SelectItem[], options: SelectOptions): Promise<SelectItem | null> {

		let response = await this.runCommandWithAnswer('select', { items, options });
		if (response == null) return null;
		const temp = JSON.parse(response) as SelectItem;
		for (let item of items) {
			if (item.label == temp.label) {
				return item;
			}
		}
		return null;
	}

	protected async selectMultiple(items: SelectItem[], options: SelectOptions): Promise<SelectItem[] | null> {
		let response = await this.runCommandWithAnswer('selectMultiple', { items, options });
		if (response == null) return null;
		const optionsResult = JSON.parse(response) as SelectItem[];
		const result: SelectItem[] = [];
		for (let item of items) {
			for (let opt of optionsResult) {
				if (item.label == opt.label) {
					result.push(item);
				}
			}
		}
		return result;
	}

	protected waitingResponse: { [cmd: string]: (response: string | null) => void } = {};
	private runCommandWithAnswer(cmd: string, config?: any): Promise<string | null> {
		return new Promise<string | null>((resolve) => {
			this.waitingResponse[cmd] = (response: string | null) => {
				delete this.waitingResponse[cmd];
				resolve(response);
			}
			log(JSON.stringify({ cmd, config }));
		})
	}
	private runCommand(cmd: string, config?: any): void {
		log(JSON.stringify({ cmd, config }));
	}

	protected registerVar<T extends string>(name: T & (T extends ReservedVariables ? never : {}), value: string | null | undefined) {
		this.variables[name] = value;
	}

	protected registerBlock(name: string, block: Partial<BlockInfo>) {
		const defaultBlock: BlockInfo = {
			before: () => "",
			after: () => "",
			custom: (v) => v
		}
		this.blocks[name] = { ...defaultBlock, ...block };
	}

	protected defaultWriteDeny(info: WriteInfo, denyDir?: string[], denyFile?: string[]): boolean {
		if (!denyDir) {
			denyDir = [".git"]
		}
		if (!denyFile) {
			denyFile = [".empty"]
		}
		const deny = info.isDir ? denyDir : denyFile;
		for (let key of deny) {
			if (info.templatePath.endsWith(sep + key))
				return false;
		}

		return true;
	}
	protected async writeFile(cb?: WriteCallback) {
		if (!cb) {
			cb = this.defaultWriteDeny
		}
		let configFiles: { [path: string]: string } = {};
		const configPattern: string[] = [
			AventusExtension.Config,
			AventusExtension.ConfigTemplate
		]
		let filesPath: string[] = [];
		const _internalLoop = async (currentPath) => {
			try {
				let files = readdirSync(currentPath);
				for (let file of files) {
					let templatePath = currentPath + sep + file;
					let relativePath = templatePath.replace(this.templatePath, "");
					let exportPath = templatePath.replace(this.templatePath, this.destination);
					exportPath = this.replaceVariables(exportPath);
					exportPath = normalize(exportPath);


					if (statSync(templatePath).isDirectory()) {
						const writeInfo: WriteInfo = {
							content: '',
							isDir: true,
							rawContent: '',
							templatePath: templatePath,
							writePath: exportPath,
							relativePath: relativePath
						}
						const result = cb(writeInfo)
						if (result === false) continue;
						mkdirSync(exportPath, { recursive: true });
						await _internalLoop(templatePath);
					}
					else {
						if (templatePath == this.templatePath + sep + AventusExtension.Template) {
							continue;
						}
						let rawCtx = readFileSync(templatePath, 'utf-8');
						this.variables["namespace"] = await this.runCommandWithAnswer("getNamespace", exportPath);
						let ctx = this.replaceVariables(rawCtx);
						ctx = this.replaceBlocks(ctx);
						const writeInfo: WriteInfo = {
							content: ctx,
							isDir: false,
							rawContent: rawCtx,
							templatePath: templatePath,
							writePath: exportPath,
							relativePath: relativePath
						}
						const result = cb(writeInfo)

						if (result === false) continue;
						if (!configPattern.includes(file)) {
							writeFileSync(exportPath, writeInfo.content);
							if (exportPath.endsWith(".avt")) {
								filesPath.push(writeInfo.writePath);
							}
						}
						else {
							if (file == AventusExtension.ConfigTemplate) {
								exportPath = exportPath.replace(AventusExtension.ConfigTemplate, AventusExtension.Config)
							}
							configFiles[exportPath] = writeInfo.content;
						}
					}
				}
			} catch (e) {
				console.log(e);
			}
		}

		await _internalLoop(this.templatePath);
		// Force config to be written at the end
		for (let configPath in configFiles) {
			writeFileSync(configPath, configFiles[configPath]);
			filesPath.push(configPath);
		}



		if (filesPath.length > 0) {
			this.runCommand("registerFile", filesPath);
		}
	}
	protected replaceVariables(ctx: string) {
		for (let varName in this.variables) {
			const regex = new RegExp('\\$\\{\\{' + varName + '\\}\\}', 'gm');
			const value = this.variables[varName] ?? ''
			ctx = ctx.replace(regex, value);
		}
		return ctx;
	}
	protected openFile(name: string | string[]) {

		if (!Array.isArray(name)) {
			name = [name];
		}

		const result: string[] = [];
		for (let n of name) {
			result.push(normalize(join(this.destination, n)));
		}

		this.runCommand("openFile", result)

	}



	protected replaceBlocks(ctx: string) {
		for (let blockName in this.blocks) {
			const regex = new RegExp('#\\{\\{' + blockName + '\\}\\}((\\s|\\S)*)#\\{\\{' + blockName + '\\/\\}\\}', 'gm');
			const block = this.blocks[blockName];
			const contentBefore = block.before();
			const contentAfter = block.after();

			let m: RegExpExecArray | null;
			while ((m = regex.exec(ctx)) !== null) {
				// This is necessary to avoid infinite loops with zero-width matches
				if (m.index === regex.lastIndex) {
					regex.lastIndex++;
				}

				let main = m[0];

				const replaceStart = new RegExp('#\\{\\{' + blockName + '\\}\\}', 'gm');
				main = main.replace(replaceStart, contentBefore);

				const replaceEnd = new RegExp('#\\{\\{' + blockName + '\\/\\}\\}', 'gm');
				main = main.replace(replaceEnd, contentAfter);

				main = block.custom(main);
				ctx = ctx.replace(m[0], main);
			}

		}
		return ctx;
	}

	protected addIndent(text: string) {
		text = "\t" + text.split('\n').join("\n\t");
		return text;
	}
	protected removeIndent(text: string) {
		return text.split('\n').map(line => line.startsWith('\t') ? line.slice(1) : line).join('\n');
	}

	protected async exec(cmd: string, asAdmin: boolean = false): Promise<void> {
		if (asAdmin) {
			await this.runCommand("execAdmin", cmd);
		}
		else {
			await this.runCommand("exec", cmd);
		}
	}

	protected async showProgress(txt: string): Promise<string> {
		return await this.runCommandWithAnswer("progressStart", txt);
	}
	protected async hideProgress(uuid: string): Promise<void> {
		await this.runCommand("progressStop", uuid);
	}
	protected async runWithProgress(txt: string, cb: () => Promise<void>) {
		let uuid = await this.showProgress(txt);
		await cb();
		if (uuid) {
			await this.hideProgress(uuid);
		}
	}

	protected sleep(ms: number): Promise<void> {
		return new Promise((resolve) => {
			setTimeout(() => {
				resolve()
			}, ms);
		})
	}
}

(global as any).AventusTemplate = AventusTemplate;
