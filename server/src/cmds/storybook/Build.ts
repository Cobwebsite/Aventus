import { GenericServer } from '../../GenericServer';
import { SelectItem } from '../../IConnection';
import { ProjectManager } from '../../project/ProjectManager';


export class StorybookBuild {
	static cmd: string = "aventus.storybook.build";
	
	public static async run(){
		let items: SelectItem[] = [];
		let builds = ProjectManager.getInstance().getAllBuildsWithStory();

		for (let build of builds) {
			items.push({
				label: build.name,
				detail: build.uri
			})
		}
		if (items.length === 0) {
			GenericServer.showWarningMessage('No Storybook build was found.');
			return;
		}

		let result = await GenericServer.Select(items, {
			title: 'Story to build'
		})

		if(result && items.some(item => item.label === result.label && item.detail === result.detail)) {
			let uri = result.detail ?? "";
			let name = result.label;
			return await ProjectManager.getInstance().getProjectByUri(uri)?.getBuild(name)?.buildStorybook();
		}
	}
}
