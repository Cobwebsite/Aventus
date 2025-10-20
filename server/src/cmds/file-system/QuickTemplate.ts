import { existsSync } from 'fs';
import { TemplateScript } from '../../files/Template';
import { GenericServer } from '../../GenericServer';
import { SettingsManager } from '../../settings/Settings';
import { SelectItem } from '../../IConnection';
import { AventusExtension } from '../../definition';
import { join } from 'path';
import { TemplatesByName } from '../../files/TemplateManager';

export class QuickTemplate {
	static cmd: string = "aventus.template.quick";



	public static async run() {
		let quickNames = SettingsManager.getInstance().settings.quickCreations;

		if (quickNames.length == 0) {
			GenericServer.showErrorMessage("No template/project set as quick creation. Try to edit quick creation first");
			return
		}

		const wks = GenericServer.templateManager?.workspaces ?? [];
		let workspace: string = "";
		if (wks.length == 0) return;
		if (wks.length == 1) {
			workspace = wks[0];
		}
		else {
			const items: SelectItem[] = [];
			for (let wk of wks) {
				items.push({ label: wk });
			}
			const result = await GenericServer.Select(items, { title: "Select workspace" });
			if (!result) return;

			workspace = result.label;
		}

		let templatePath: string = "";
		if (quickNames.length == 1) {
			templatePath = quickNames[0];
		}
		else {
			const items: SelectItem[] = [];
			const templatePathes: { [key: string]: string } = {}

			const templatesByUri: { [uri: string]: TemplateScript } = {};
			const readRecu = (info: TemplateScript | TemplatesByName) => {
				if (info instanceof TemplateScript) {
					if (info.allowQuick) {
						templatesByUri[info.folderPath] = info
					}
				}
				else {
					for (let key in info) {
						readRecu(info[key]);
					}
				}
			}

			let projects = await GenericServer.templateManager?.getGeneralProjects() ?? { nb: 0, templates: {} };
			readRecu(projects.templates);

			for (let quickName of quickNames) {
				if (templatesByUri[quickName]) {
					const template = templatesByUri[quickName];
					items.push({
						label: template.name,
						detail: template.description,
					});
					templatePathes[template.name] = quickName;
				}
				else {

					if (!quickName.endsWith(AventusExtension.Template)) {
						quickName = join(quickName, AventusExtension.Template)
					}
					if (existsSync(quickName)) {
						// check local first
						let template = TemplateScript.create(quickName);
						if (template) {
							items.push({
								label: template.name,
								detail: template.description,
							});
							templatePathes[template.name] = quickName;
						}
					}
				}

			}
			if (items.length == 0) {
				GenericServer.showErrorMessage("No template/project set as quick creation. Try to edit quick creation first");
				return
			}
			const result = await GenericServer.Select(items, { title: "Select quick template" });
			if (!result) return;

			templatePath = templatePathes[result.label]
		}

		if (!templatePath.endsWith(AventusExtension.Template)) {
			let testPath = join(templatePath, AventusExtension.Template)
			if (existsSync(testPath)) {
				templatePath = join(templatePath, AventusExtension.Template);
			}
		}
		if (!existsSync(templatePath)) {
			GenericServer.showErrorMessage("The file doesn't exist : " + templatePath);
			return;
		}
		let template = TemplateScript.create(templatePath);
		if (template) {
			await template.init(workspace, workspace);
		}
	}
}