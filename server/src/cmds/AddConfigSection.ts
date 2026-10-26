import { readFileSync, writeFileSync } from 'fs';
import { AventusConfig } from '../language-services/json/definition';
import { OpenFile } from '../notification/OpenFile';
import { uriToPath } from '../tools';
import { GenericServer } from '../GenericServer';
import { ProjectManager } from '../project/ProjectManager';
import { SelectItem } from '../IConnection';
import { dirname, resolve } from 'path';
import { applyEdits, modify, parse, ParseError } from 'jsonc-parser';



export class AddConfigSection {
	static cmd: string = "aventus.addConfigSection";

	public static async run(uri?: string) {
		try {
			if (!uri) {
				let items: SelectItem[] = [];
				let configFiles = ProjectManager.getInstance().getAllConfigFiles();
				if (configFiles.length === 0) {
					GenericServer.showWarningMessage("No Aventus configuration was found.");
					return;
				}
				for (let file of configFiles) {
					items.push({
						label: file
					})
				}
				if (items.length > 1) {
					let result = await GenericServer.Select(items, {
						title: 'Select a project to add section'
					})
					if (!result) {
						return;
					}
					if (!items.some(item => item.label === result.label)) {
						GenericServer.showErrorMessage("The selected Aventus configuration is no longer available.");
						return;
					}
					uri = result.label;
				}
				else {
					uri = items[0].label;
				}
			}

			let sectionItems: SelectItem[] = [{ label: "Build" }, { label: "Static" }];
			const sectionType = await GenericServer.Select(sectionItems, { title: "Section type" });

			if (!sectionType) return;
			const configPath = uriToPath(uri);
			const readConfig = () => {
				const content = readFileSync(configPath, 'utf8');
				const errors: ParseError[] = [];
				const config = parse(content, errors, { allowTrailingComma: true }) as AventusConfig;
				if (errors.length || !config || typeof config !== 'object' || Array.isArray(config)) {
					throw new SyntaxError('Invalid Aventus configuration');
				}
				return { content, config };
			};
			const initialConfig = readConfig().config;
			let newSection: object;

			if (sectionType.label == "Build") {
				const normalizeName = (value: string) => value.trim().replace(/[^a-zA-Z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
				const existingNames = initialConfig.build.map(build => normalizeName(build.name ?? '')).filter(Boolean);
				const namePattern = (name: string) => [...name].map(character => {
					if (character === '_') return '(?:_|[^A-Za-z0-9_]+)';
					if (/[a-z]/i.test(character)) return `[${character.toLowerCase()}${character.toUpperCase()}]`;
					return character;
				}).join('');
				const edge = '(?:_|[^A-Za-z0-9_])*';
				const usedNames = existingNames.map(namePattern).join('|');
				const name = await GenericServer.Input({
					title: "Provide a name for your build section",
					validations: [{
						message: 'The build name must contain a letter, number or underscore',
						regex: '^[\\s\\S]*[A-Za-z0-9_][\\s\\S]*$',
					}, {
						message: 'A build section with this name already exists',
						regex: usedNames ? `^(?!${edge}(?:${usedNames})${edge}$)[\\s\\S]+$` : '^[\\s\\S]+$',
					}],
				});
				if (!name) return;
				const { content, config } = readConfig();

				let nameFile: string = name.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
				let buildName: string = normalizeName(name);
				if (!buildName) return;
				const output = "./dist/" + nameFile + ".js";
				const configFolder = dirname(configPath);
				const outputPath = resolve(configFolder, output).toLowerCase();
				const outputPaths = (value: unknown): string[] => {
					if (typeof value === 'string') return [value];
					if (Array.isArray(value)) return value.flatMap(outputPaths);
					if (value && typeof value === 'object') return Object.values(value).flatMap(outputPaths);
					return [];
				};

				for (let build of config.build) {
					if (normalizeName(build.name ?? '').toLowerCase() === buildName.toLowerCase()) {
						GenericServer.showErrorMessage(`A build section with the name already exists: ${name}`);
						return;
					}
					for (let compile of build.compile) {
						for (let path of outputPaths(compile.output)) {
							if (resolve(configFolder, path).toLowerCase() === outputPath) {
								GenericServer.showErrorMessage(`A build section with the output already exists: ${outputPath}`);
								return;
							}
						}
					}
				}

				newSection = {
					"name": buildName,
					"src": [],
					"compile": [{
						"output": output,
					}]
				}

				const current = Array.isArray(config.build) ? config.build : [];
				const path = Array.isArray(config.build) ? ['build', current.length] : ['build'];
				const edits = modify(content, path, Array.isArray(config.build) ? newSection : [newSection], {
					formattingOptions: { insertSpaces: !content.includes('\t'), tabSize: 4, eol: content.includes('\r\n') ? '\r\n' : '\n' },
				});
				writeFileSync(configPath, applyEdits(content, edits));

			}
			else if (sectionType.label == "Static") {
				const name = await GenericServer.Input({
					title: "Provide a name for your static section",
				});
				if (!name) return;

				const { content, config } = readConfig();
				newSection = {
					"name": name,
					"input": "",
					"output": ""
				}

				const current = Array.isArray(config.static) ? config.static : [];
				const path = Array.isArray(config.static) ? ['static', current.length] : ['static'];
				const edits = modify(content, path, Array.isArray(config.static) ? newSection : [newSection], {
					formattingOptions: { insertSpaces: !content.includes('\t'), tabSize: 4, eol: content.includes('\r\n') ? '\r\n' : '\n' },
				});
				writeFileSync(configPath, applyEdits(content, edits));
			}
			else return;
			OpenFile.send(uri);
		} catch (e) {
			console.error(e);
		}
	}
}
