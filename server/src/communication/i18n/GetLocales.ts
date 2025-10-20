import { Position } from 'vscode-languageserver';
import { ProjectManager } from '../../project/ProjectManager';
import { Communication } from '../Communication';

export class GetLocales extends Communication<{ uri: string }, string[] | null> {
	public channel(): string {
		return "aventus.i18n.getLocales";
	}
	public async run(body: { uri: string }): Promise<string[] | null> {
		if (body.uri) {
			const builds = ProjectManager.getInstance().getMatchingBuildsByUri(body.uri);
			for (let build of builds) {
				const locales = build.buildConfig.i18n?.locales;
				if (locales) return locales;
			}
		}
		return null;
	}

}