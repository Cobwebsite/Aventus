import { GenericServer } from '../../GenericServer';
import { SelectItem } from '../../IConnection';
import { ProjectManager } from '../../project/ProjectManager';
import { QueryError, Store } from '../../store/Store';

export class StorePublish {
	static cmd: string = "aventus.store.publish";

	public static async run() {
		if (!Store.isConnected) {
			GenericServer.showErrorMessage("You must connect your account first");
			return;
		}

		let builds = ProjectManager.getInstance().getAllBuilds();

		let items: SelectItem[] = [];
		let result: SelectItem | null = null;
		if (builds.length == 1) {
			result = {
				label: builds[0].name,
				detail: builds[0].uri,
			}
		}
		else {
			for (let build of builds) {
				items.push({
					label: build.name,
					detail: build.uri
				})
				result = await GenericServer.Select(items, {
					placeHolder: 'Project to compile'
				})
			}
		}


		if (result) {
			let uri = result.detail ?? "";
			let name = result.label;
			const build = ProjectManager.getInstance().getProjectByUri(uri)?.getBuild(name);
			if (build) {
				const result = await Store.publishPackage(build);
				if (result instanceof QueryError) {
					for (let error of result.errors) {
						GenericServer.showErrorMessage(error.message);
					}
				}
				else {
					GenericServer.showInformationMessage("Package published");
				}
			}
		}
	}
}