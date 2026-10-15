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
		if (items.length === 0) {
			GenericServer.showWarningMessage('No package to build was found.');
			return;
		}

		let result = items.length == 1 ? items[0] : await GenericServer.Select(items, {
			title: 'Package to build'
		})

		if (result && items.some(item => item.label === result.label && item.detail === result.detail)) {
			let uri = result.detail ?? "";
			let name = result.label;
			return await ProjectManager.getInstance().getProjectByUri(uri)?.getBuild(name)?.buildNpm();
		}
	}
}
