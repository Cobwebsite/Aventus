import { existsSync } from 'fs';
import { GenericServer } from '../../GenericServer';
import { SelectItem } from '../../IConnection';
import { ProjectManager } from '../../project/ProjectManager';
import { QueryError, Store } from '../../store/Store';
import { uriToPath } from '../../tools';
import { TemplateScript } from '../../files/Template';
import { AventusExtension } from '../../definition';

export class StorePublishTemplate {
	static cmd: string = "aventus.store.publish_template";

	public static async run(uri: string) {
		if (!uri) return;

		if (!Store.isConnected) {
			GenericServer.showErrorMessage("You must connect to your account first");
			return;
		}

		const path = uriToPath(uri);
		if (existsSync(path) && path.endsWith(AventusExtension.Template)) {
			let template = TemplateScript.create(path);
			if (template) {
				const result = await Store.publishTemplate(template);
				if (result instanceof QueryError) {
					for (let error of result.errors) {
						GenericServer.showErrorMessage(error.message);
					}
				}
				else {
					GenericServer.showInformationMessage("Template published");
				}
			}
			else {
				GenericServer.showErrorMessage("Your script for the template contains errors");
			}
		}


	}
}