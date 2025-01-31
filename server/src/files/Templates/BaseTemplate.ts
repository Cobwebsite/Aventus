import { EOL } from 'os';
import { ProjectManager } from '../../project/ProjectManager';

export abstract class BaseTemplate {

	public abstract name(): string;
	public abstract definition(): string;
	public abstract init(path: string): Promise<void>;


	protected addNamespace(text: string, uri: string) {
		let builds = ProjectManager.getInstance().getMatchingBuildsByUri(uri);
		if (builds.length > 0) {
			let namespace = builds[0].getNamespaceForUri(uri);
			if (namespace != "") {
				// add tab
				text = "\t" + text.split('\n').join("\n\t");
				text = `namespace ${namespace} {${EOL}${text}${EOL}}`
			}
		}
		return text;
	}
}