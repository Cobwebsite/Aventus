import { ProjectManager } from '../project/ProjectManager';
import { GenericServer } from "../GenericServer";
import { SelectItem } from "../IConnection";


export class BuildProject {
	static cmd: string = "aventus.compile";
	
	public static async run() {
		let items: SelectItem[] = [];
		let builds = ProjectManager.getInstance().getAllBuilds();

		for (let build of builds) {
			items.push({
				label: build.name,
				detail: build.uri
			})
		}

		let result = await GenericServer.Select(items, {
			placeHolder: 'Project to compile'
		})

		if(result) {
			let uri = result.detail ?? "";
			let name = result.label;
			ProjectManager.getInstance().getProjectByUri(uri)?.getBuild(name)?.build();
		}
	}
}