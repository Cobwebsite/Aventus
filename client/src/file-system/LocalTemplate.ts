import { QuickPickItem, window, workspace } from 'vscode';
import { Template, TemplateManager } from './Template';

export class LocalTemplateManager {
	private templateManager: TemplateManager;
	public constructor(templateManager: TemplateManager) {
		this.templateManager = templateManager;
	}
	public async createTemplate(path: string) {
		let quickPicksTemplate: Map<QuickPickItem, Template> = new Map();
		let loadedTemplates = this.readTemplates().concat(this.templateManager.getGeneralTemplates());
		if (loadedTemplates.length == 0) {
			let result = await window.showErrorMessage("You have no custom template!!", 'Open documentation');
			if (result == "Open documentation") {
				open("https://aventusjs.com/docs/advanced/template");
			}
			return;
		}
		for (let template of loadedTemplates) {
			let quickPick: QuickPickItem = {
				label: template.config.name,
				detail: template.config.description ?? "",
			}
			quickPicksTemplate.set(quickPick, template);
		}
		const resultFormat = await window.showQuickPick(Array.from(quickPicksTemplate.keys()), {
			placeHolder: 'Choose a template',
			canPickMany: false,
		});
		if (resultFormat) {
			let resultPick = quickPicksTemplate.get(resultFormat);
			if (resultPick) {
				await resultPick.init(path);
			}
		}
	}

	private readTemplates() {
		if (workspace.workspaceFolders) {
			let aventusFolder = workspace.workspaceFolders[0].uri.fsPath + '/.aventus/templates';
			return this.templateManager.readTemplates(aventusFolder);
		}
		return [];
	}
}