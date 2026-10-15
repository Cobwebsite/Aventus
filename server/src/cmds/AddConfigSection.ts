import { readFileSync, writeFileSync } from 'fs';
import { AventusConfig } from '../language-services/json/definition';
import { OpenFile } from '../notification/OpenFile';
import { uriToPath } from '../tools';
import { GenericServer } from '../GenericServer';
import { ProjectManager } from '../project/ProjectManager';
import { SelectItem } from '../IConnection';



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
					uri = result.label;
				}
				else {
					uri = items[0].label;
				}
			}

			let sectionItems: SelectItem[] = [{ label: "Build" }, { label: "Static" }];
			const sectionType = await GenericServer.Select(sectionItems, { title: "Section type" });

			if (!sectionType) return;
			let jsonContent = readFileSync(uriToPath(uri), 'utf8');
			let config: AventusConfig = JSON.parse(jsonContent);

			if (sectionType.label == "Build") {
				const name = await GenericServer.Input({
					title: "Provide a name for your build section",
				});
				if (!name) return;

				let nameFile: string = name.trim().replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
				let buildName: string = name.trim().replace(/[^a-zA-Z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
				if (!buildName) return;

				let newBuild: any = {
					"name": buildName,
					"src": [],
					"compile": [{
						"output": "./dist/" + nameFile + ".js",
					}]
				}

				config.build.push(newBuild);

			}
			else if (sectionType.label == "Static") {
				const name = await GenericServer.Input({
					title: "Provide a name for your static section",
				});
				if (!name) return;

				let newBuild: any = {
					"name": name,
					"input": "",
					"output": ""
				}

				config.static.push(newBuild);
			}
			writeFileSync(uriToPath(uri), JSON.stringify(config, null, 4))
			OpenFile.send(uri);
		} catch (e) {
			console.error(e);
		}
	}
}
