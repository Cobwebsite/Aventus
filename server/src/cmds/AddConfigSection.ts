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
				for (let file of configFiles) {
					items.push({
						label: file
					})
				}
				let result = await GenericServer.Select(items, {
					placeHolder: 'Project to compile'
				})
				if (!result) {
					return;
				}
				uri = result.label;
			}
			
			const name = await GenericServer.Input({
				title: "Provide a name for your config section",
			});
			if (!name) {
				return;
			}
			let jsonContent = readFileSync(uriToPath(uri), 'utf8');
			let config: AventusConfig = JSON.parse(jsonContent);
			let nameFile: string = name.replace(/ /g, "-");

			let newBuild: any = {
				"name": name,
				"inputPath": [],
				"outputFile": "./dist/" + nameFile + ".js",
			}

			config.build.push(newBuild);
			writeFileSync(uriToPath(uri), JSON.stringify(config, null, 4))
			OpenFile.send(uri);
		} catch (e) {
			console.error(e);
		}
	}
}