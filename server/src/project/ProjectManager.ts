import { TextEdit } from 'vscode-languageserver';
import { AventusExtension } from "../definition";
import { AventusFile } from '../files/AventusFile';
import { FilesManager } from '../files/FilesManager';
import { Build } from './Build';
import { Project } from "./Project";

export class ProjectManager {
    private static instance: ProjectManager;
    public static getInstance(): ProjectManager {
        if (!this.instance) {
            this.instance = new ProjectManager();
        }
        return this.instance;
    }
    private projects: { [uri: string]: Project } = {};
    private constructor() {
        FilesManager.getInstance().onNewFile(this.onNewFile.bind(this));
    }
    private async onNewFile(file: AventusFile) {
        if (file.documentUser.uri.endsWith(AventusExtension.Config)) {
            // prevent create a project when on template
            let templateFileUri = file.documentUser.uri.replace(AventusExtension.Config, AventusExtension.Template);
            if (FilesManager.getInstance().getByUri(templateFileUri)) {
                return;
            }

            if (!this.projects[file.documentUser.uri]) {
                this.projects[file.documentUser.uri] = new Project(file);
                await this.projects[file.documentUser.uri].init()
                file.onDelete(this.onDeleteFile.bind(this));
            }
            else {
                console.error("a config file with the uri :" + file.documentUser.uri + " is already inside project manager");
            }
        }
    }
    private async onDeleteFile(file: AventusFile) {
        if (this.projects[file.documentUser.uri]) {
            this.projects[file.documentUser.uri].destroy();
            delete this.projects[file.documentUser.uri];
        }
    }

    public getProjectByUri(uri: string): Project | undefined {
        return this.projects[uri];
    }

    public getMatchingBuildsByUri(uri: string): Build[] {
        let result: Build[] = []
        for (let projectUri in this.projects) {
            let project = this.projects[projectUri];
            let resultTemps = project.getMatchingBuildsByUri(uri);
            for (let resultTemp of resultTemps) {
                result.push(resultTemp);
            }
        }
        return result;
    }

    public destroyAll() {
        for (let projectUri in this.projects) {
            this.projects[projectUri].destroy()
        }
    }

    public async onRename(changes: { oldUri: string, newUri: string }[]): Promise<{ [uri: string]: TextEdit[] }> {
        let result: { [uri: string]: TextEdit[] } = {};
        for (let uri in this.projects) {
            let temp = await this.projects[uri].onRename(changes);
            for (let uri in temp) {
                if (!result[uri]) {
                    result[uri] = []
                }
                result[uri] = result[uri].concat(temp[uri]);
            }
        }
        return result;
    }

    public getAllConfigFiles(): string[] {
        let result: string[] = [];
        for (let uri in this.projects) {
            result.push(this.projects[uri].getConfigFile().uri)
        }
        return result;
    }
    public getAllBuilds(): { name: string, uri: string }[] {
        let result: { name: string, uri: string }[] = [];
        for (let uri in this.projects) {
            let project = this.projects[uri];
            let builds = project.getBuildsName();
            for (let build of builds) {
                result.push({
                    name: build,
                    uri: project.getConfigFile().uri
                })
            }
        }
        return result;
    }
    public getAllBuildsWithStory(): { name: string, uri: string }[] {
        let result: { name: string, uri: string }[] = [];
        for (let uri in this.projects) {
            let project = this.projects[uri];
            let builds = project.getBuildsNameWithStory();
            for (let build of builds) {
                result.push({
                    name: build,
                    uri: project.getConfigFile().uri
                })
            }
        }
        return result;
    }
    public getAllStatics(): { name: string, uri: string }[] {
        let result: { name: string, uri: string }[] = [];
        for (let uri in this.projects) {
            let project = this.projects[uri];
            let builds = project.getBuildsName();
            for (let build of builds) {
                result.push({
                    name: build,
                    uri: project.getConfigFile().uri
                })
            }
        }
        return result;
    }
}
