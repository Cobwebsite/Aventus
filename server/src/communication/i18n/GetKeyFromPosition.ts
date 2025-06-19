import { Position } from 'vscode-languageserver';
import { ProjectManager } from '../../project/ProjectManager';
import { Communication } from '../Communication';

export class GetKeyFromPosition extends Communication<{ uri: string, range: [Position, Position] }, string | null> {
	public channel(): string {
		return "aventus.i18n.getKeyFromPosition";
	}
	public async run(body: { uri: string, range: [Position, Position] }): Promise<string | null> {
		if (body.uri) {
			const builds = ProjectManager.getInstance().getMatchingBuildsByUri(body.uri);
			for (let build of builds) {
				let result = build.i18nComponentsFiles[body.uri]?.getKeyFromLocation(body.range);
				if (result) return result;
				result = build.tsLanguageService.i18nFiles[body.uri]?.getKeyFromLocation(body.range);
				if (result) return result;
			}
		}
		return null;
	}

}