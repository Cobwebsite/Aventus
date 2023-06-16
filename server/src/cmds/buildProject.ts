import { ExecuteCommandParams } from "vscode-languageserver/node";
import { ProjectManager } from '../project/ProjectManager';
import { pathToUri } from "../tools";


export class BuildProject {
	static cmd: string = "aventus.compile";
	constructor(params: ExecuteCommandParams) {
		if (params.arguments && params.arguments[0]) {
			let uri: string = pathToUri(params.arguments[0].detail);
			let name: string = params.arguments[0].label;
			ProjectManager.getInstance().getProjectByUri(uri)?.getBuild(name)?.build();
		}
	}
}