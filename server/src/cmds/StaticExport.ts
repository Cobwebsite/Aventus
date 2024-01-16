import { ProjectManager } from '../project/ProjectManager';
import { SelectItem } from '../IConnection';
import { GenericServer } from '../GenericServer';


export class StaticExport {
	static cmd: string = "aventus.static";
	
	public static async run(){
		let items: SelectItem[] = [];
		let builds = ProjectManager.getInstance().getAllStatics();

		for (let build of builds) {
			items.push({
				label: build.name,
				detail: build.uri
			})
		}

		let result = await GenericServer.Select(items, {
			placeHolder: 'Static to export'
		})

		if(result) {
			let uri = result.detail ?? "";
			let name = result.label;
			ProjectManager.getInstance().getProjectByUri(uri)?.getStatic(name)?.export();
		}
	}
}