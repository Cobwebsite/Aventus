import { ExecuteCommandParams } from 'vscode-languageserver';
import { ProjectManager } from '../project/ProjectManager';
import { pathToUri } from '../tools';


export class GetNamespace {
	static cmd: string = "aventus.getNamespace";
	constructor(params: ExecuteCommandParams) {
		if (params.arguments && params.arguments[0]) {
			let uri: string = pathToUri(params.arguments[0]);
			let builds = ProjectManager.getInstance().getMatchingBuildsByUri(uri);
			if (builds.length > 0) {
				return builds[0].getNamespaceForUri(uri, false);
			}
		}
		return "";
	}
}