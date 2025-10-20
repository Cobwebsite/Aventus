import { TemplateScript } from '../../files/Template';
import { TemplatesByName } from '../../files/TemplateManager';
import { GenericServer } from '../../GenericServer';
import { SelectItem } from '../../IConnection';
import { SettingsManager } from '../../settings/Settings';

export class QuickTemplateEdit {
	static cmd: string = "aventus.template.quick_edit";



	public static async run() {
		let quickNames = SettingsManager.getInstance().settings.quickCreations;
		const items: (SelectItem & { folderPath: string })[] = [];
		const readRecu = (info: TemplateScript | TemplatesByName) => {
			if (info instanceof TemplateScript) {
				if (info.allowQuick) {
					items.push({
						label: info.name,
						detail: info.description,
						picked: quickNames.includes(info.folderPath),
						folderPath: info.folderPath,
					});
				}
			}
			else {
				for (let key in info) {
					readRecu(info[key]);
				}
			}
		}

		let projects = await GenericServer.localProjectManager?.readProjects() ?? { nb: 0, templates: {} };
		readRecu(projects.templates);
		let templates = await GenericServer.localTemplateManager?.readTemplates() ?? { nb: 0, templates: {} };
		readRecu(templates.templates);


		if (items.length == 0) {
			SettingsManager.getInstance().setSettings({ quickCreations: [] }, true)
			GenericServer.showErrorMessage("No template/project allow quick creation");
			return;
		}
		const result = await GenericServer.SelectMultiple(items, { title: "Select quick templates" });
		if (!result) return;

		quickNames = [];
		for (let item of result) {
			const folderPath = items.find(p => p.label == item.label)?.folderPath
			if (folderPath)
				quickNames.push(folderPath)
		}

		SettingsManager.getInstance().setSettings({ quickCreations: quickNames }, true)
	}
}