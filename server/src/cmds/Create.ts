import { uriToPath } from '../tools';
import { ProjectManager } from '../project/ProjectManager';
import { GenericServer } from '../GenericServer';
import { dirname, isAbsolute, normalize, relative, sep } from 'path';


export class Create {
	static cmd: string = "aventus.create";

	public static async run(uri: string) {
		if (!uri) {
			return;
		}
		let path = normalize(uriToPath(uri));

		if (Create.checkIfProject(path)) {
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
			await GenericServer.localProjectManager?.createGlobal(path);
		}
	}

	//#region tools
	private static checkIfProject(path: string) {
		for (const configUri of ProjectManager.getInstance().getAllConfigFiles()) {
			const projectPath = dirname(normalize(uriToPath(configUri)));
			const fromProject = relative(projectPath, path);

			if(fromProject === '') return true;
			if(fromProject !== '..' && !fromProject.startsWith('..' + sep) && !isAbsolute(fromProject)) {
				return true;
			}
		}
		return false;
	}
	//#endregion
}
