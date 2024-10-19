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
		let loadedTemplates = this.readTemplates()
		const templateResult = await this.templateManager.query(loadedTemplates.templates);
		if (templateResult) {
			await templateResult.init(path);
		}
	}

	private readTemplates() {
		let globalTemplate = this.templateManager.getGeneralTemplates();
		let globalTemplateLength = this.templateManager.getGeneralTemplatesLength();
		let uri = GenericServer.getWorkspaceUri()
		if (uri) {
			let aventusFolder = uriToPath(uri) + '/.aventus/templates';
			return this.templateManager.readTemplates([aventusFolder], globalTemplate, globalTemplateLength);
		}
		return {
			templates: globalTemplate,
			nb: globalTemplateLength
		};
	}
}