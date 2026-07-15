import { Action, ActionOption, ArgOption } from './Action';
import { Server } from '../server/Server';
import { DiagnosticSeverity, uriToPath } from '../tools';
import type { CliErrors } from '../server/Connection';
import { resolve } from 'path';

type WatchOptions = {
	builds?: string[] | false,
	json?: boolean
}

export class Watch extends Action<WatchOptions> {
	public get name(): string {
		return "watch";
	}
	public get description(): string {
		return "Start the compiler in watch mode"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {
		addArg({
			description: "aventus.conf.avt path",
			type: "string",
			typeIsRequired: false
		})
	}
	protected registerOptions(addOption: (option: ActionOption<WatchOptions>) => void) {
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
	public async run(args: string[], options: WatchOptions) {
		let configPath = args[0];
		if (configPath) {
			configPath = resolve(configPath);
		}
		if (options.builds === false) {
			options.builds = [];
		}

		await Server.load();
		console.clear();
		await Server.start({
			loadFiles: true,
			watchFiles: true,
			useCompilators: true,
			useTemplates: false,
			configPath: configPath,
			builds: options.builds,
			useStats: false
		});

		await this.sleep(2000)

		const errorsByBuild = Server.getErrors();
		const fct = options.json ? this.renderLogJson : this.renderLog

		fct(errorsByBuild);

		Server.subscribeErrors((errors, build) => {
			errorsByBuild[build] = errors;
			fct(errorsByBuild);
		});

		await new Promise<void>(() => {
			process.on('SIGINT', () => {
				process.exit(0);
			});
		});

	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	private renderLog(errorsByBuild: CliErrors) {
		console.clear();
		const log = console.log

		for (let build in errorsByBuild) {
			let hasFailed = false;

			log("Build : " + (build ?? "default"))

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
				log("   No error detected")
			}
		}
	}

	private renderLogJson(errorsByBuild: CliErrors) {
		console.clear();
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


		const checkBuild = (build: string) => {
			if (result.builds[build]) return;
			result.builds[build] = {
				diagnostics: {},
				success: true
			}
		}

		for (let build in errorsByBuild) {
			const errors = errorsByBuild[build]
			build = build == "" ? "default" : build;
			checkBuild(build)

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
							continue
						}

						diags.push({
							content: diagnostic.message,
							start: diagnostic.range.start.line + 1 + ":" + diagnostic.range.start.character,
							end: diagnostic.range.end.line + 1 + ":" + diagnostic.range.end.character,
							type: type
						})
					}

					if (result.builds[build].diagnostics[path].length == 0) {
						delete result.builds[build].diagnostics[path];
					}
				}
			}

		}

		console.log(JSON.stringify(result, undefined, 4))

	}

}