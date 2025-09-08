import { uriToPath } from '../tools';
import { ProjectManager } from '../project/ProjectManager';
import { GenericServer } from '../GenericServer';
import { normalize } from 'path';


export class Create {
	static cmd: string = "aventus.create";

	public static async run(uri: string) {
		if (!uri) {
			return;
		}
		let path = normalize(uriToPath(uri));


		if (Create.checkIfProject(uri)) {
			if (!GenericServer.isIDE) {
				let resultTemp = await GenericServer.SelectFolder("Select where to create", path);
				if (!resultTemp) {
					return;
				}
				uri = resultTemp;
				path = uriToPath(uri);
			}
			await GenericServer.localTemplateManager?.createTemplate(path);
		}
		else {
			const result = await GenericServer.Select([{
				label: "Init",
				detail: "Create a project"
			}], {
				placeHolder: 'What do you want to create?',
			});
			if (result) {
				await GenericServer.localProjectManager?.createProject(path);
				// await GenericServer.templateManager?.createProject(path);
			}
		}
	}

	//#region tools
	private static checkIfProject(uri: string) {
		let uris = ProjectManager.getInstance().getAllConfigFiles();
		let norm = uri.replace(/\\/g, "/");
		for (let uriTemp of uris) {
			if (norm.startsWith(uriTemp.replace("/aventus.conf.avt", ""))) {
				return true;
			}
		}
		return false;
	}
	//#endregion
}