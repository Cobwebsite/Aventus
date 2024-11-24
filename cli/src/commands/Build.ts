import { resolve, sep } from 'path';
import { Server } from '../server/Server';
import { Action, ActionOption, ArgOption } from './Action';
import { DiagnosticSeverity } from 'vscode-css-languageservice';

type BuildOptions = {
	builds?: string[] | false,
	statics?: string[] | false,
	verbose?: boolean,
	silent?: boolean,
	'no-builds'?: boolean,
	'no-statics'?: boolean,
}

export class Build extends Action<BuildOptions> {
	public get name(): string {
		return "build";
	}
	public get description(): string {
		return "Build an aventus project"
	}
	protected registerArgs(addArg: (arg: ArgOption) => void) {
		addArg({
			description: "aventus.conf.avt path",
			type: "string",
			typeIsRequired: false
		})
	}
	protected registerOptions(addOption: (option: ActionOption<BuildOptions>) => void) {
		addOption({
			name: "builds",
			description: "Define the build name",
			type: "string",
			typeIsRequired: true,
			typeIsArray: true,
		});
		addOption({
			name: "no-builds",
			description: "No builds",
			type: "boolean",
			typeIsRequired: false,
		});
		addOption({
			name: "statics",
			description: "Define the static files to export",
			type: "string",
			typeIsRequired: true,
			typeIsArray: true,
		})
		addOption({
			name: "no-statics",
			description: "No statics",
			type: "boolean",
			typeIsRequired: false,
		});
		addOption({
			name: "verbose",
			shortName: "v",
			description: "Debug your compilation",
		})
		addOption({
			name: "silent",
			shortName: "s",
			description: "No output",
		})
	}
	public async run(args: string[], options: BuildOptions) {
		let configPath = args[0];
		if (configPath) {
			configPath = resolve(configPath);
		}
		await Server.load();
		if(options.builds === false) {
			options.builds = [];
		}
		if(options.statics === false) {
			options.statics = [];
		}
		await Server.start({
			onlyBuild: true,
			configPath: configPath,
			builds: options.builds,
			statics: options.statics,
			debug: options.verbose,
			errorByBuild: true,
			useStats: options.silent ? false : true
		});

		this.handleResult(options);
	}

	private handleResult(options: BuildOptions) {
		const statistics = Server.getStatistics();
		const log = options.silent ? (msg?: string) => { } : console.log

		log();
		log("Loading all files : Done in " + statistics.loadFileTime + "ms");
		log();
		log("----");
		log();

		const errorsByBuild = Server.getErrors();
		let hasGlobalFailed = false;

		const filesByBuilds: { [build: string]: string[] } = {}
		const filesByStatics: { [name: string]: string[] } = {}

		const parseSize = (size: number) => {
			const k = 1024
			const dm = 2
			const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
			const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(k))

			return `${parseFloat((size / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
		}
		for (let output in statistics.files) {
			const file = statistics.files[output];
			if (file.type == "build" && file.typeName) {
				if (!filesByBuilds[file.typeName]) {
					filesByBuilds[file.typeName] = [];
				}

				const txt = `    ${file.path} - ${parseSize(file.size)}`

				filesByBuilds[file.typeName].push(txt);
			}
			else if (file.type == 'static' && file.typeName) {
				if (!filesByStatics[file.typeName]) {
					filesByStatics[file.typeName] = [];
				}

				const txt = `    ${file.path} - ${parseSize(file.size)}`

				filesByStatics[file.typeName].push(txt);
			}
		}

		let max = Object.keys(statistics.builds).length;
		let maxStatics = Object.keys(statistics.statics).length;
		let i = 0;
		for (let build in statistics.builds) {
			log("Building " + build);
			log();

			let hasFailed = false;
			const errors = errorsByBuild[build]
			const stats = statistics.builds[build];
			const files = filesByBuilds[build];
			if (files) {
				for (let file of files) {
					log(file);
				}
				log();
			}
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

						if (!options.silent) {
							write(`    ${sev} ${uriToPath(uri).replace(/\\/g, '/')}:${diagnostic.range.start.line + 1} : ${diagnostic.message}`);
							needSpace = true;
						}
					}
				}
				if (needSpace)
					log();
			}


			if (hasFailed) {
				log("    Build failed in " + stats.buildTime + "ms");
				hasGlobalFailed = true;
			}
			else {
				log("    Build success in " + stats.buildTime + "ms")
			}

			i++;
			if (i == max && maxStatics == 0) {
				log();
			}
			else {
				log();
				log("----");
				log();
			}
		}

		i = 0;
		for (let name in statistics.statics) {
			log("Export static " + name);
			log();

			const stats = statistics.statics[name];
			const files = filesByStatics[name];

			if (files) {
				for (let file of files) {
					log(file);
				}
				log();
			}

			log("    Exported in " + stats.buildTime + "ms")

			i++;
			if (i == maxStatics) {
				log();
			}
			else {
				log();
				log("----");
				log();
			}
		}

		if (hasGlobalFailed) {
			process.exit(1);
		}
	}
}


function uriToPath(uri: string): string {
    if (sep === "/") {
        // linux system
        return decodeURIComponent(uri.replace("file://", ""));
    }
    return decodeURIComponent(uri.replace("file:///", ""));
}