import { Position } from 'vscode-languageserver';
import { ProjectManager } from '../../project/ProjectManager';
import { Communication } from '../Communication';

export class GetLocales extends Communication<{ uri: string }, { locales: string[], fallback: string } | null> {
	public channel(): string {
		return "aventus.i18n.getLocales";
	}
	public async run(body: { uri: string }): Promise<{ locales: string[], fallback: string } | null> {
		if (body.uri) {
			const builds = ProjectManager.getInstance().getMatchingBuildsByUri(body.uri);
			for (let build of builds) {
				const locales = build.buildConfig.i18n?.locales;
				const fallback = build.buildConfig.i18n?.fallback;
				if (locales && fallback) return { fallback, locales };
			}
		}
		return null;
	}

}