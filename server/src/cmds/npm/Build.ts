import { GenericServer } from '../../GenericServer';
import { SelectItem } from '../../IConnection';
import { ProjectManager } from '../../project/ProjectManager';


export class NpmBuild {
	static cmd: string = "aventus.npm.build";

	public static async run() {
		let items: SelectItem[] = [];
		let builds = ProjectManager.getInstance().getAllBuildsWithNpm();

		for (let build of builds) {
			items.push({
				label: build.name,
				detail: build.uri
			})
		}

		let result = items.length == 1 ? items[0] : await GenericServer.Select(items, {
			placeHolder: 'Package to build'
		})

		if (result) {
			let uri = result.detail ?? "";
			let name = result.label;
			ProjectManager.getInstance().getProjectByUri(uri)?.getBuild(name)?.buildNpm();
		}
	}
}