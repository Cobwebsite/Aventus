import { GenericServer } from '../GenericServer';
import { uriToPath } from '../tools';
import { TemplateManager } from './TemplateManager';

export class LocalProjectManager {
	private templateManager: TemplateManager;
	public constructor(templateManager: TemplateManager) {
		this.templateManager = templateManager;
	}
	public async createProject(path: string) {
		let loadedTemplates = this.readProjects()
		const templateResult = await this.templateManager.query(loadedTemplates.templates);
		if (templateResult) {
			await templateResult.init(path);
		}
	}

	public readProjects() {
		let globalProject = this.templateManager.getGeneralProjects();
		let globalProjectLength = this.templateManager.getGeneralProjectsLength();
		let uri = GenericServer.getWorkspaceUri()
		if (uri) {
			let aventusFolder = uriToPath(uri) + '/.aventus/projects';
			return this.templateManager.readTemplates([aventusFolder], globalProject, globalProjectLength);
		}
		return {
			templates: globalProject,
			nb: globalProjectLength
		};
	}
}