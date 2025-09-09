import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { join, normalize, sep } from 'path';
import { pathToFileURL } from 'url';

import { ExecSyncOptionsWithBufferEncoding, execSync, spawn, spawnSync } from 'child_process';
import { pathToUri, uriToPath } from '../tools';
import { ProjectManager } from '../project/ProjectManager';
import { FilesManager } from './FilesManager';
import { GenericServer } from '../GenericServer';
import { exec as execAdmin } from 'sudo-prompt'
import { serverFolder } from '../language-services/ts/libLoader';
import * as md5 from 'md5';
import { InputOptions, SelectItem, SelectOptions } from '../IConnection';
import { ProgressStart } from '../notification/ProgressStart';
import { ProgressStop } from '../notification/ProgressStop';


export interface TemplateConfigVariable {
	question: string,
	type: 'input' | 'choice',
	defaultValue: '',
	list: { [value: string]: string },
	validation?: {
		pattern: string,
		errorMsg?: string,
	}[],
}

export interface TemplateConfig {
	"name": string,
	"description": string,
	"version": string,
	"variables": { [name: string]: TemplateConfigVariable },
	"filesToOpen"?: string[],
	"cmdsAfter"?: string[],
	"cmdsAfterAdmin"?: string[],
}

export class TemplateJSON {
	public config: TemplateConfig;
	public folderPath: string;
	public currentVars: { [name: string]: string } = {};
	public configVars: string[] | undefined;
	public currentConfig: TemplateConfig;
	private filesToOpen: string[] = [];

	public constructor(config: TemplateConfig, folderPath: string) {
		this.config = config;
		this.currentConfig = config;
		this.folderPath = folderPath;
	}

	public async init(path: string) {
		try {
			this.currentVars = {};
			this.loadConfigVars();
			await this.defineDefaultVars(path);
			if (await this.prepareNeededVars()) {
				let uris = this.moveFiles(path);
				await this.runCmds();
				for (let uri of uris) {
					FilesManager.getInstance().onCreatedUri(uri);
				}
				this.openFiles();
			}

		} catch (e) {
			console.log(e);
		}
	}
	private loadConfigVars() {
		if (!this.configVars) {
			this.configVars = [];
			let configTxt = JSON.stringify(this.config);
			const regex = /\$\{\{(.*?)\}\}/gm;
			let match: RegExpExecArray | null;
			while ((match = regex.exec(configTxt)) !== null) {
				if (!this.configVars.includes(match[1])) {
					this.configVars.push(match[1]);
				}
			}
		}
	}
	private async defineDefaultVars(path: string) {
		let folderSplitted = path.split(sep);
		this.setVar('folderName', folderSplitted[folderSplitted.length - 1]);
		this.setVar('path', path);
		const projectInfo = this.getProjectInfo(path);
		this.setVar('namespace', projectInfo.namespace);
		this.setVar('module', projectInfo.module);
	}
	private getProjectInfo(path: string) {
		let result = {
			"namespace": "",
			"module": "",
		}
		let uri: string = pathToUri(path);
		let builds = ProjectManager.getInstance().getMatchingBuildsByUri(uri);
		if (builds.length > 0) {
			result.namespace = builds[0].getNamespaceForUri(uri);
			result.module = builds[0].project.getConfig()?.module ?? "";
		}
		return result;
	}
	private async prepareNeededVars() {
		for (let variableName in this.currentConfig.variables) {
			let currentVar = this.currentConfig.variables[variableName];
			if (currentVar.type == "input") {
				let defaultValue = currentVar.defaultValue ?? '';

				const resultInput = await GenericServer.Input({
					title: currentVar.question,
					value: defaultValue,
					validations: currentVar.validation?.map(p => { return { regex: p.pattern, message: p.errorMsg ?? 'Error' } })
				})

				if (!resultInput) {
					return false;
				}
				this.setVar(variableName, resultInput);
			}
			// else if (currentVar.type == "choice") {
			// 	let quickPicks: QuickPickItem[] = [];
			// 	for (let item in currentVar.list) {
			// 		quickPicks.push({
			// 			label: item,
			// 			detail: currentVar.list[item]
			// 		});
			// 	}
			// 	const resultData = await window.showQuickPick(quickPicks, {
			// 		placeHolder: currentVar.question,
			// 		canPickMany: false,
			// 	});
			// 	if (!resultData) {
			// 		return false;
			// 	}
			// 	this.setVar(variableName, resultData.label);
			// }
		}

		return true;
	}
	private moveFiles(path: string) {
		let filesToOpen: string[] = [];
		let configFiles: { [path: string]: string } = {};
		let filesUri: string[] = []
		const _internalLoop = (currentPath) => {
			let files = readdirSync(currentPath);
			for (let file of files) {
				let templatePath = currentPath + sep + file;
				let exportPath = templatePath.replace(this.folderPath, path);
				for (let varName in this.currentVars) {
					const regex = new RegExp('\\$\\{\\{' + varName + '\\}\\}', 'gm');
					exportPath = exportPath.replace(regex, this.currentVars[varName]);
				}
				exportPath = normalize(exportPath);
				if (statSync(templatePath).isDirectory()) {
					if (file == '.git') continue;
					mkdirSync(exportPath);
					_internalLoop(templatePath);
				}
				else {
					if (file == '.empty') continue;
					if (templatePath == this.folderPath + sep + "template.avt") {
						continue;
					}
					let ctx = readFileSync(templatePath, 'utf-8');
					for (let varName in this.currentVars) {
						const regex = new RegExp('\\$\\{\\{' + varName + '\\}\\}', 'gm');
						ctx = ctx.replace(regex, this.currentVars[varName]);

						const regexLower = new RegExp('\\$\\{\\{' + varName + '\\|lower\\}\\}', 'gm');
						ctx = ctx.replace(regexLower, this.currentVars[varName].toLowerCase());
					}

					if (this.currentConfig.filesToOpen) {
						for (let fileToOpenQuery of this.currentConfig.filesToOpen) {
							if (this.comparePath(exportPath, fileToOpenQuery)) {
								filesToOpen.push(exportPath);
							}
						}
					}
					if (file != "aventus.conf.avt") {
						writeFileSync(exportPath, ctx);
						if (exportPath.endsWith(".avt")) {
							filesUri.push(pathToUri(exportPath));
						}
					}
					else {
						configFiles[exportPath] = ctx;
					}
				}
			}
		}

		_internalLoop(this.folderPath);

		// Force config to be written at the end
		for (let configPath in configFiles) {
			writeFileSync(configPath, configFiles[configPath]);
			filesUri.push(pathToUri(configPath));
		}

		this.filesToOpen = filesToOpen;
		return filesUri;
	}

	private openFiles() {
		for (let path of this.filesToOpen) {
			GenericServer.sendNotification("aventus/openfile", pathToFileURL(path).toString());
		}
	}

	private comparePath(path: string, query: string) {
		let pathsToTest: string[] = [path];
		let workspacePath = uriToPath(GenericServer.getWorkspaceUri());
		let localPath = "." + path.replace(workspacePath, "").replace(/\\/g, "/")
		pathsToTest.push(localPath);

		if (query.match(/\/\S+\/g?m?s?i?x?s?u?/g)) {
			let splitted = query.split("/");
			let reg = new RegExp(splitted[1], splitted[2]);
			for (let pathToTest of pathsToTest) {
				if (pathToTest.match(reg)) {
					return true;
				}
			}
		}
		else {
			if (normalize(path) == normalize(query)) {
				return true;
			}

			if (pathsToTest.length > 1 && normalize(pathsToTest[1]) == normalize(query)) {
				return true;
			}
		}
		return false;
	}

	private setVar(name: string, value: string) {
		if (!this.currentVars[name]) {
			this.currentVars[name] = value;
			if (this.configVars?.includes(name)) {
				const regex = new RegExp('\\$\\{\\{' + name + '\\}\\}', 'gm');
				let safeValue = JSON.stringify(value).slice(1, -1); // prevent \\ and remove "" added by stringify
				let txt = JSON.stringify(this.currentConfig).replace(regex, safeValue);
				this.currentConfig = JSON.parse(txt);
			}
		}
	}

	private runCmds() {
		return new Promise<void>((resolve) => {
			setTimeout(() => {
				let params: ExecSyncOptionsWithBufferEncoding = {};
				let cwd = uriToPath(GenericServer.getWorkspaceUri());
				params.cwd = cwd;
				if (this.currentConfig.cmdsAfter) {
					for (let cmd of this.currentConfig.cmdsAfter) {
						try {
							execSync(cmd, params)
						} catch (e) {
							console.log(e);
							GenericServer.showErrorMessage("The command " + cmd + " failed");
						}
					}
				}
				if (this.currentConfig.cmdsAfterAdmin) {
					for (let cmd of this.currentConfig.cmdsAfterAdmin) {
						try {
							let moveToCwd = `cd /d "${cwd}"`;
							if (process.platform == 'darwin') {
								moveToCwd = `cd "${cwd}"`;
							}
							execAdmin("cd " + cwd + " && " + cmd, (error, stdout, stderr) => {
								if (error) {
									console.log('error: ' + error);
									console.log('stdout: ' + stdout);
									console.log('stderr: ' + stderr);
								}
							})
						} catch (e) {
							console.log(e);
							GenericServer.showErrorMessage("The command " + cmd + " failed");
						}
					}
				}
				resolve();
			}, 500)
		})
	}
}

export class TemplateScript {
	public config: string;
	public folderPath: string;
	public workspacePath: string;

	public name: string;
	public version: string;
	public description: string;
	public lastModified: Date;

	private static memory: { [key: string]: TemplateScript } = {}
	public static create(config: string, folderPath: string, workspacePath: string) {
		if (this.memory[config]) {
			let lastModified = statSync(config).mtime
			if (lastModified.getTime() > this.memory[config].lastModified.getTime()) {
				this.memory[config] = new TemplateScript(config, folderPath, workspacePath);
			}
		}
		else {
			this.memory[config] = new TemplateScript(config, folderPath, workspacePath);
		}
		return this.memory[config];
	}

	private constructor(config: string, folderPath: string, workspacePath: string) {
		this.config = config;
		this.folderPath = folderPath;
		this.workspacePath = workspacePath;
		const basicInfo = this.prepareScript();
		this.name = basicInfo.name;
		this.description = basicInfo.description;
		this.version = basicInfo.version;
		this.lastModified = statSync(this.config).mtime
	}

	public init(path: string) {
		return new Promise<void>((resolve) => {
			try {
				const rootPath = join(serverFolder(), 'lib/templateScript/AventusTemplate.ts').replace(/\\/g, "\\\\");

				const txt = `
					import { AventusTemplate } from 'file://${rootPath}';
					import { Template } from 'file://${this.config.replace(/\\/g, "\\\\")}'

					process.on('uncaughtException', function(err) {
						console.log('Caught exception: ' + err);
					});

					const t = new Template();
					await t._run(\`${this.folderPath.replace(/\\/g, "\\\\")}\`, \`${path.replace(/\\/g, "\\\\")}\`, \`${this.workspacePath.replace(/\\/g, "\\\\")}\`)`;
				let tempPath = join(GenericServer.savePath, "temp");
				if (!existsSync(tempPath)) {
					mkdirSync(tempPath);
				}
				let scriptPath = join(tempPath, md5(this.config) + "_1.ts");
				writeFileSync(scriptPath, txt);

				const child = spawn("node", ["--no-warnings", scriptPath], {
					cwd: this.folderPath,
					detached: true,
				});

				const answer = (cmd: string, result: string | null) => {
					const data = JSON.stringify({ cmd, result: result ?? 'NULL' }) + "\n";
					child.stdin.write(data);
				}

				child.stdout.on("data", async (data) => {
					const txt = data.toString().trim();
					let messages = [txt];
					if (txt.indexOf("}\n{") != -1) {
						messages = txt.split("}\n{");
						for (let i = 1; i < messages.length; i++) {
							messages[i - 1] += "}";
							messages[i] = "{" + messages[i];
						}
					}

					try {
						for (let message of messages) {
							const payload: { cmd: string, config?: any } = JSON.parse(message);
							if (payload.cmd == "input") {
								const config: InputOptions = payload.config
								let response = await GenericServer.Input(config)
								answer(payload.cmd, response)
							}
							else if (payload.cmd == "select") {
								const config: {
									items: SelectItem[],
									options: SelectOptions,
								} = payload.config
								let response = await GenericServer.Select(config.items, config.options);
								if (response == null) {
									answer(payload.cmd, "NULL");
								}
								else {
									answer(payload.cmd, JSON.stringify(response));
								}
							}
							else if (payload.cmd == "registerFile") {
								let config = payload.config as string[];
								for (let path of config) {
									FilesManager.getInstance().onCreatedUri(pathToUri(path));
								}
							}
							else if (payload.cmd == "openFile") {
								let config = payload.config as string[];
								for (let path of config) {
									GenericServer.sendNotification("aventus/openfile", pathToFileURL(path).toString());
								}
							}
							else if (payload.cmd == "getNamespace") {
								let config = payload.config as string;
								let builds = ProjectManager.getInstance().getMatchingBuildsByUri(pathToUri(config));
								if (builds.length > 0) {
									const namespace = builds[0].getNamespaceForUri(pathToUri(config));
									answer(payload.cmd, namespace);
								}
								else {
									answer(payload.cmd, null);
								}
							}
							else if (payload.cmd == "exec") {
								let params: ExecSyncOptionsWithBufferEncoding = {};
								let cwd = uriToPath(GenericServer.getWorkspaceUri());
								params.cwd = cwd;
								let config = payload.config as string
								try {
									execSync(config, params)
								} catch (e) {
									console.log(e);
									GenericServer.showErrorMessage("The command " + config + " failed");
								}
								answer(payload.cmd, "done");
							}
							else if (payload.cmd == "execAdmin") {
								let config = payload.config as string
								let cwd = uriToPath(GenericServer.getWorkspaceUri());

								try {
									let moveToCwd = `cd /d "${cwd}"`;
									if (process.platform == 'darwin') {
										moveToCwd = `cd "${cwd}"`;
									}
									execAdmin("cd " + cwd + " && " + config, (error, stdout, stderr) => {
										if (error) {
											console.log('error: ' + error);
											console.log('stdout: ' + stdout);
											console.log('stderr: ' + stderr);
										}
									})
								} catch (e) {
									console.log(e);
									GenericServer.showErrorMessage("The command " + config + " failed");
								}
								answer(payload.cmd, "done");
							}
							else if (payload.cmd == "progressStart") {
								let txt = payload.config as string;
								let uuid = ProgressStart.send(txt);
								answer(payload.cmd, uuid);
							}
							else if (payload.cmd == "progressStop") {
								let uuid = payload.config as string;
								ProgressStop.send(uuid);
							}
							else if (payload.cmd == "log") {
								console.log(payload.config)
							}
							else if (payload.cmd == "error") {
								console.error(payload.config)
							}
						}
					} catch (e) {
						console.log(e);
						console.log("message " + txt);
						console.log(messages);
					}
				});

				// Lire les erreurs du programme secondaire
				child.stderr.on("data", (data) => {
					console.error(`Erreur with template : ${data.toString().trim()}`);
				});

				child.on("close", (code) => {
					console.log(`Processus enfant terminé avec le code ${code}`);
					unlinkSync(scriptPath);
					resolve();
				});
			} catch (e) {
				resolve();
			}
		})
	}

	protected prepareScript(): { name: string, version: string, description: string } {
		const rootPath = join(serverFolder(), 'lib/templateScript/AventusTemplate.ts').replace(/\\/g, "\\\\");

		const txt = `
					import { AventusTemplate, log } from 'file://${rootPath}';
					import { Template } from 'file://${this.config.replace(/\\/g, "\\\\")}'
					const t = new Template();
					log(t.basicInfo())`;


		let tempPath = join(GenericServer.savePath, "temp");
		if (!existsSync(tempPath)) {
			mkdirSync(tempPath);
		}
		let scriptPath = join(tempPath, md5(this.config) + ".ts");
		writeFileSync(scriptPath, txt);
		let values: { name: string, version: string, description: string } = {
			name: "",
			version: "1.0.0",
			description: ""
		}
		var a: string = "";
		var err: string = "";
		try {
			const sp = spawnSync(`node`, ["--no-warnings", scriptPath], {
				cwd: this.folderPath,
			});
			err = sp.stderr.toString();
			a = sp.stdout.toString();
			const valuesTemp = JSON.parse(a.trim());
			values = { ...values, ...valuesTemp };
		} catch (e) {
			console.log(e);
			console.log(err);
			console.log(a);
		}
		unlinkSync(scriptPath);
		return values;
	}


}