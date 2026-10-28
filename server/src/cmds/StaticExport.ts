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
				label: build.name ?? `Static #${build.index}`,
				detail: build.uri,
				id: String(build.index),
			});
		}
		if (items.length === 0) {
			GenericServer.showWarningMessage('No static export was found.');
			return;
		}

		let result = await GenericServer.Select(items, {
			title: 'Static to export'
		})

		const selectedIndex = result ? items.findIndex(item => item.label === result.label && item.detail === result.detail && item.id === result.id) : -1;
		if (selectedIndex !== -1) {
			const selected = builds[selectedIndex];
			const project = ProjectManager.getInstance().getProjectByUri(selected.uri);
			const target = project?.getStaticAt(selected.index);
			return await target?.export();
		}
	}
}
