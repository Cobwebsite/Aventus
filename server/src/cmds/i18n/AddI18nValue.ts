import { basename } from 'path';
import { AventusExtension } from '../../definition';
import { GenericServer } from '../../GenericServer';
import { SelectItem } from '../../IConnection';
import { ProjectManager } from '../../project/ProjectManager';
import { pathToUri, uriToPath } from '../../tools';
import { AventusI18nLanguageService } from '../../language-services/i18n/LanguageService';
import { EditFile } from '../../notification/EditFile';
import { TextEdit } from 'vscode-languageserver';




export class AddI18nValue {
	static cmd: string = "aventus.i18n.add";

	public static async run(uri: string, value: string) {
		try {
			const builds = ProjectManager.getInstance().getMatchingBuildsByUri(uri);
			if (builds.length > 0) {
				const build = builds[0];
				let uriComponent = uri.replace(AventusExtension.ComponentView, AventusExtension.I18n);
				const items: SelectItem[] = []
				if (build.i18nComponentsFiles[uriComponent]) {
					const path = uriToPath(uriComponent)
					items.push({
						label: basename(path),
						detail: path
					})
				}

				for (let uri in build.tsLanguageService.i18nFiles) {
					const path = uriToPath(uri)
					items.push({
						label: basename(path),
						detail: path
					})
				}

				const result = await GenericServer.Select(items, { title: "Where should I insert the transalation?" });
				if (result) {
					const uriResult = pathToUri(result.detail!);
					const file = build.i18nComponentsFiles[uriResult] ?? build.tsLanguageService.i18nFiles[uriResult];
					const newEl = JSON.parse(JSON.stringify(file.parsedSrc));
					newEl[value] = {};
					const locales = file.build.buildConfig.i18n?.locales ?? [];
					const fallback = file.build.buildConfig.i18n?.fallback ?? 'en-GB'
					for (let locale of locales) {
						newEl[value][locale] = locale == fallback ? value : AventusI18nLanguageService.empty;
					}
					const txt = JSON.stringify(AventusI18nLanguageService.sortObj(newEl), null, 4);

					const edit: TextEdit[] = [
						{
							newText: txt,
							range: {
								start: file.file.documentUser.positionAt(0),
								end: file.file.documentUser.positionAt(file.file.documentUser.getText().length)
							}
						}
					]
					EditFile.send(uriResult, [edit])
					setTimeout(async () => {
						let uriTs = uri.replace(AventusExtension.ComponentView, AventusExtension.ComponentLogic);
						const tsfile = build.tsFiles[uriTs]; 
						const htmlfile = build.htmlFiles[uri]; 
						await tsfile?.validate();
						await htmlfile?.validate();
					}, 2000);
				}
			}

		} catch (e) {
			console.error(e);
		}
	}
}