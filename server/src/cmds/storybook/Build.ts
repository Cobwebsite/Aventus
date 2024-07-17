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

		let result = await GenericServer.Select(items, {
			placeHolder: 'Story to build'
		})

		if(result) {
			let uri = result.detail ?? "";
			let name = result.label;
			ProjectManager.getInstance().getProjectByUri(uri)?.getBuild(name)?.buildStorybook();
		}
	}
}