import { GenericServer } from '../GenericServer';
import { uriToPath } from '../tools';
import { TemplateScript } from './Template';
import { TemplateManager } from './TemplateManager';

export class LocalProjectManager {
	private templateManager: TemplateManager;
	public constructor(templateManager: TemplateManager) {
		this.templateManager = templateManager;
	}

	public async createGlobal(path: string) {
		let loadedTemplates = await this.templateManager.readGlobal()
		const templateResult = await this.templateManager.query(path, loadedTemplates.templates, [{
			label: "Init",
			detail: "Create a project"
		}]);
		if (templateResult instanceof TemplateScript) {
			await templateResult.init(path, this.templateManager.findWorkspace(path));
		}
		else if (templateResult) {
			await GenericServer.localProjectManager?.createProject(path);
		}
	}
	public async createProject(path: string) {
		let loadedTemplates = await this.readProjects()
		const templateResult = await this.templateManager.query(path, loadedTemplates.templates);
		if (templateResult) {
			await templateResult.init(path, this.templateManager.findWorkspace(path));
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