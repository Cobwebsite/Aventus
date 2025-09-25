import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { dirname, join, normalize, sep } from 'path';
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

export type TemplateScriptConfig = {
	name: string,
	version: string,
	description: string,
	allowQuick?: boolean,
	organization?: string,
	tags?: string[],
	isProject?: boolean,
	installationFolder?: string,
	documentation?: string,
	repository?: string,
}

export class TemplateScript {
	public config: string;
	public folderPath: string;
	public workspacePath: string;

	public name: string = "";
	public version: string = "1.0.0";
	public description: string = "";
	public organization?: string;
	public tags: string[] = [];
	public lastModified: Date;
	public allowQuick: boolean = false;
	public isProject: boolean = false;
	public containsError: boolean = false;
	public installationFolder?: string;
	public documentation?: string;
	public repository?: string;

	private static memory: { [key: string]: TemplateScript } = {}
	public static create(config: string, workspacePath: string): TemplateScript | undefined {
		let folderPath = dirname(config);
		if (this.memory[config]) {
			let lastModified = statSync(config).mtime
			if (lastModified.getTime() > this.memory[config].lastModified.getTime()) {
				const temp = new TemplateScript(config, folderPath, workspacePath);
				if (!temp.containsError) {
					this.memory[config] = temp;
				}
			}
		}
		else {
			const temp = new TemplateScript(config, folderPath, workspacePath);
			if (!temp.containsError) {
				this.memory[config] = temp;
			}
		}
		return this.memory[config];
	}

	private constructor(config: string, folderPath: string, workspacePath: string) {
		this.config = config;
		this.folderPath = folderPath;
		this.workspacePath = workspacePath;
		const basicInfo = this.prepareScript();
		for (let key in basicInfo) {
			if (basicInfo[key]) {
				this[key] = basicInfo[key];
			}
		}
		// this.name = basicInfo.name;
		// this.description = basicInfo.description;
		// this.version = basicInfo.version;
		// this.organization = basicInfo.organization;
		// this.tags = basicInfo.tags ?? [];
		// this.allowQuick = basicInfo.allowQuick ?? false;
		// this.installationFolder = basicInfo.installationFolder;
		// this.isProject = basicInfo.isProject ?? false;
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
				child.stdin.on('error', function () { });

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
							else if (payload.cmd == "selectMultiple") {
								const config: {
									items: SelectItem[],
									options: SelectOptions,
								} = payload.config
								let response = await GenericServer.SelectMultiple(config.items, config.options);
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

	protected prepareScript(): TemplateScriptConfig {
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
		let values: { name: string, version: string, description: string, allowQuick?: boolean } = {
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
			this.containsError = true;
		}
		unlinkSync(scriptPath);
		return values;
	}


}