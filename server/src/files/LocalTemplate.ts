import * as open from 'open'
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
		let loadedTemplates = this.readTemplates().concat(this.templateManager.getOthersTemplates());
		if (loadedTemplates.length == 0) {
			GenericServer.showErrorMessage("You have no custom template!!");
			let result = await GenericServer.Popup("You have no custom template!!", 'Open documentation');
			if (result == "Open documentation") {
				open("https://aventusjs.com/docs/advanced/template");
			}
			return;
		}

		let root: any = {};

		for (let template of loadedTemplates) {
			let splitted = template.config.name.split(".");
			let current = root;
			for (let i = 0; i < splitted.length - 1; i++) {
				if (!current[splitted[i]]) {
					current[splitted[i]] = {};
				}
				current = current[splitted[i]]
			}
			if (!current['@children']) {
				current['@children'] = [];
			}
			current['@children'].push(template);
		}

		let result = await this.choosePath(root, root);
		if (result && result != 'back') {
			await result.init(path);
		}
	}

	private async choosePath(current: any, root: any): Promise<Template | null | 'back'> {
		if (!current) return null;
		let quickPicksTemplate: Map<SelectItem, Template> = new Map();
		let quickPicks: SelectItem[] = [];
		let backOption: SelectItem = {
			label: "Back",
		}
		if (current != root) {
			quickPicks.push(backOption);
		}
		for (let key in current) {
			if (key != "@children") {
				quickPicks.push({
					label: key,
				});
			}
		}
		if (current["@children"]) {
			for (let child of current["@children"]) {
				let template = child as Template;
				let quickPick: SelectItem = {
					label: template.config.name,
					detail: template.config.description ?? "",
				}
				quickPicksTemplate.set(quickPick, template);
			}
		}

		while (true) {
			const resultFormat = await GenericServer.Select(quickPicks, {
				placeHolder: 'Choose a template',
			});
			if (resultFormat) {
				let resultPick = quickPicksTemplate.get(resultFormat);
				if (resultPick) {
					return resultPick
				}
				else if (resultFormat == backOption) {
					return 'back';
				}
				else {
					const resultTemp = await this.choosePath(current[resultFormat.label], root);
					if (resultTemp != 'back') {
						return resultTemp;
					}
				}
			}
			else {
				return null;
			}
		}
	}

	private readTemplates() {
		let uri = GenericServer.getWorkspaceUri()
		if (uri) {
			let aventusFolder = uriToPath(uri) + '/.aventus/templates';
			return this.templateManager.readTemplates([aventusFolder]).others;
		}
		return [];
	}
}