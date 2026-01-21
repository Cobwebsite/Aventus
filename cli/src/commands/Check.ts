import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { resolve, sep } from 'path';
import { LogLevel } from '@server/settings/Settings';
import { DiagnosticSeverity } from 'vscode-css-languageservice';
import { uriToPath } from '../tools';

type CheckOptions = {
	builds?: string[] | false,
	json?: boolean
}

export class Check extends Action<CheckOptions> {
	public get name(): string {
		return "check";
	}
	public get description(): string {
		return "Check an aventus project"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {
		addArg({
			description: "aventus.conf.avt path",
			type: "string",
			typeIsRequired: false
		})
	}
	protected registerOptions(addOption: (option: ActionOption<CheckOptions>) => void) {
		addOption({
			name: "builds",
			description: "Define the build name",
			type: "string",
			typeIsRequired: true,
			typeIsArray: true,
		});
		addOption({
			name: "json",
			type: "boolean",
			typeIsRequired: false,
			description: "Result as json",
		})
	}

	public async run(args: string[], options: CheckOptions) {
		let configPath = args[0];
		if (configPath) {
			configPath = resolve(configPath);
		}
		if (options.builds === false) {
			options.builds = [];
		}
		await Server.load();

		await Server.start({
			noBuild: true,
			loadFiles: true,
			buildOnly: true,
			configPath: configPath,
			builds: options.builds,
			statics: undefined,
			logLevel: LogLevel.Error,
			errorByBuild: true,
			useStats: false
		});

		if (options.json) {
			this.handleResultJson(options);
		}
		else {
			this.handleResult(options);
		}
	}

	private handleResult(options: CheckOptions) {
		const statistics = Server.getStatistics();
		const log = console.log
		log();
		log("Loading all files : Done in " + statistics.loadFileTime + "ms");
		log();
		log("----");
		log();

		const errorsByBuild = Server.getErrors();
		let hasGlobalFailed = false;

		for (let build in errorsByBuild) {
			let hasFailed = false;

			const errors = errorsByBuild[build]
			if (errors) {
				let needSpace = false;
				for (let uri in errors) {
					for (let diagnostic of errors[uri]) {
						let sev = "";
						let write: (msg: string) => void;
						if (diagnostic.severity == DiagnosticSeverity.Error) {
							sev = "\x1b[31m[error]\x1b[0m";
							hasFailed = true;
							write = console.error;
						}
						else if (diagnostic.severity == DiagnosticSeverity.Warning) {
							sev = "\x1b[33m[warning]\x1b[0m";
							write = console.warn;
						}
						else if (diagnostic.severity == DiagnosticSeverity.Information) {
							sev = "\x1b[34m[info]\x1b[0m";
							write = console.info;
						}
						else if (diagnostic.severity == DiagnosticSeverity.Hint) {
							sev = "\x1b[90m[hint]\x1b[0m";
							continue;
						}

						write(`    ${sev} ${uriToPath(uri).replace(/\\/g, '/')}:${diagnostic.range.start.line + 1} : ${diagnostic.message}`);
						needSpace = true;
					}
				}
				if (needSpace)
					log();
			}


			if (!hasFailed) {
				log("    Build has no error")
			}
		}

		if (hasGlobalFailed) {
			process.exit(1);
		}
	}

	private handleResultJson(options: CheckOptions) {
		const result: {
			success: boolean,
			builds: {
				[name: string]: {
					success: boolean,
					diagnostics: {
						[uri: string]: {
							content: string,
							type: 'error' | 'warning' | 'info' | 'hint',
							start: string,
							end: string
						}[]
					}
				}
			}

		} = {
			success: true,
			builds: {},
		};

		const errorsByBuild = Server.getErrors();
		let hasGlobalFailed = false;

		const checkBuild = (build: string) => {
			if (result.builds[build]) return;
			result.builds[build] = {
				diagnostics: {},
				success: true
			}
		}

		for (let build in errorsByBuild) {
			checkBuild(build)

			const errors = errorsByBuild[build]

			if (errors) {
				for (let uri in errors) {
					let path = uriToPath(uri).replace(/\\/g, '/');

					const diags: {
						content: string,
						type: 'error' | 'warning' | 'info' | 'hint',
						start: string,
						end: string
					}[] = [];

					result.builds[build].diagnostics[path] = diags

					for (let diagnostic of errors[uri]) {
						let type: 'error' | 'warning' | 'info' | 'hint';

						if (diagnostic.severity == DiagnosticSeverity.Error) {
							result.builds[build].success = false;
							result.success = false;
							hasGlobalFailed = true;
							type = 'error';
						}
						else if (diagnostic.severity == DiagnosticSeverity.Warning) {
							type = 'warning';
						}
						else if (diagnostic.severity == DiagnosticSeverity.Information) {
							type = 'info';
						}
						else if (diagnostic.severity == DiagnosticSeverity.Hint) {
							type = 'hint';
						}

						diags.push({
							content: diagnostic.message,
							start: diagnostic.range.start.line + 1 + ":" + diagnostic.range.start.character,
							end: diagnostic.range.end.line + 1 + ":" + diagnostic.range.end.character,
							type: type
						})
					}
				}
			}

		}

		console.log(JSON.stringify(result, undefined, 4))

		if (hasGlobalFailed) {
			process.exit(1);
		}
	}
}

