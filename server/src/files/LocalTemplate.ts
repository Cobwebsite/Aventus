import open = require('open');
import { GenericServer } from '../GenericServer';
import { SelectItem } from '../IConnection';
import { uriToPath } from '../tools';
import { Template } from './Template';
import { TemplateManager } from './TemplateManager';

export class LocalTemplateManager {
	private templateManager: TemplateManager;
	public constructor(templateManager: TemplateManager) {
		this.templateManager = templateManager;
	}
	public async createTemplate(path: string) {
		let quickPicksTemplate: Map<SelectItem, Template> = new Map();
		let loadedTemplates = this.readTemplates().concat(this.templateManager.getGeneralTemplates());
		if (loadedTemplates.length == 0) {
			GenericServer.showErrorMessage("You have no custom template!!");
			let result = await GenericServer.Popup("You have no custom template!!", 'Open documentation');
			if (result == "Open documentation") {
				open("https://aventusjs.com/docs/advanced/template");
			}
			return;
		}
		for (let template of loadedTemplates) {
			let quickPick: SelectItem = {
				label: template.config.name,
				detail: template.config.description ?? "",
			}
			quickPicksTemplate.set(quickPick, template);
		}
		const resultFormat = await GenericServer.Select(Array.from(quickPicksTemplate.keys()), {
			placeHolder: 'Choose a template',
		});
		if (resultFormat) {
			let resultPick = quickPicksTemplate.get(resultFormat);
			if (resultPick) {
				await resultPick.init(path);
			}
		}
	}

	private readTemplates() {
		let uri = GenericServer.getWorkspaceUri()
		if (uri) {
			let aventusFolder = uriToPath(uri) + '/.aventus/templates';
			return this.templateManager.readTemplates([aventusFolder]);
		}
		return [];
	}
}