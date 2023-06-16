import { readFileSync, writeFileSync } from 'fs';
import { ExecuteCommandParams } from 'vscode-languageserver';
import { AventusConfig } from '../language-services/json/definition';
import { OpenFile } from '../notification/OpenFile';
import { uriToPath } from '../tools';



export class AddConfigSection {
	static cmd: string = "aventus.addConfigSection";
	constructor(params: ExecuteCommandParams) {
		if (params.arguments && params.arguments.length > 1) {
			let uri = params.arguments[0];
			let name: string = params.arguments[1];
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
		}
	}
}