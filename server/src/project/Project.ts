import { normalize, sep } from 'path';
import { CompletionItem, CompletionList, FormattingOptions, Hover, Position, Range, TextEdit } from 'vscode-languageserver';
import { AventusExtension } from '../definition';
import { AventusFile } from '../files/AventusFile';
import { AventusConfig } from "../language-services/json/definition";
import { AventusJSONLanguageService } from '../language-services/json/LanguageService';
import { Build } from "./Build";
import { Static } from "./Static";
import { AventusGlobalSCSSLanguageService } from '../language-services/scss/GlobalLanguageService';
import { FilesManager } from '../files/FilesManager';
import { AventusGlobalSCSSFile } from '../language-services/scss/GlobalFile';
import { ClassInfo } from '../language-services/ts/parser/ClassInfo';

export class Project {
    private configFile: AventusFile;
    private config: AventusConfig | null = null;
    private builds: Build[] = [];
    private statics: Static[] = [];
    private _isCoreBuild: Boolean = false;

    public scssFiles: { [uri: string]: AventusGlobalSCSSFile } = {}

    private onValidateUUID: string;
    private onSaveUUID: string;
    private onFormattingUUID: string;
    private onCompletionUUID: string;
    private onCompletionResolveUUID: string;
    private onHoverUUID: string;
    private onNewFileUUID: string;
    private onFileDeleteUUIDs: { [uri: string]: string } = {}
    public buildsAllowed?: string[];
    public staticsAllowed?: string[];

    public globalSCSSLanguageService: AventusGlobalSCSSLanguageService;

    public get isCoreBuild() {
        return this._isCoreBuild;
    }
    public getConfigFile() {
        return this.configFile;
    }
    public getConfig() {
        return this.config;
    }
    public resolveAlias(path: string, file: AventusFile);
    public resolveAlias(path: string, currentPath: string);
    public resolveAlias(path: string, currentPath: AventusFile | string) {
        if (path.startsWith("@")) {
            let pathSplitted = path.split("/");
            let alias = pathSplitted[0];
            let value = this.config?.aliases[alias]
            if (value) {
                let basePath = normalize(this.configFile.folderPath + "/" + value);
                if (typeof currentPath !== 'string') {
                    currentPath = currentPath.folderPath;
                }
                let filePath = normalize(currentPath);
                if (basePath.endsWith(sep)) {
                    basePath = basePath.substring(0, basePath.length - 1);
                }
                if (filePath.endsWith(sep)) {
                    filePath = filePath.substring(0, filePath.length - 1);
                }


                let basePathSplitted = basePath.split(sep);
                let filePathSplitted = filePath.split(sep);

                for (let i = 0; i < basePathSplitted.length; i++) {
                    if (filePathSplitted.length > i) {
                        if (basePathSplitted[i] == filePathSplitted[i]) {
                            basePathSplitted.splice(i, 1);
                            filePathSplitted.splice(i, 1);
                            i--;
                        }
                        else {
                            break;
                        }
                    }
                }
                let finalPathToImport = "";
                for (let i = 0; i < filePathSplitted.length; i++) {
                    finalPathToImport += '../';
                }
                if (finalPathToImport == "") {
                    finalPathToImport += "./";
                }
                finalPathToImport += basePathSplitted.join("/");

                pathSplitted.splice(0, 1, finalPathToImport);

                return pathSplitted.join("/").replace(/\/\//g, "/");
            }
        }
        return path;
    }

    public getInternalWebComponentDefinition(path: string, tagName: string): ClassInfo | undefined {
        for (let build of this.builds) {
            if (build.outputPathes.includes(path)) {
                return build.getLocalWebComponentDefinition(tagName);
            }
        }
        return;
    }

    public constructor(configFile: AventusFile, autoLoad: boolean) {
        this.configFile = configFile;
        this.onValidateUUID = this.configFile.onValidate(this.onValidate.bind(this));
        this.onSaveUUID = this.configFile.onSave(this.onConfigSave.bind(this));
        this.onFormattingUUID = this.configFile.onFormatting(this.onFormatting.bind(this));
        this.onCompletionUUID = this.configFile.onCompletion(this.onCompletion.bind(this));
        this.onCompletionResolveUUID = this.configFile.onCompletionResolve(this.onCompletionResolve.bind(this));
        this.onHoverUUID = this.configFile.onHover(this.onHover.bind(this));
        this.onNewFileUUID = FilesManager.getInstance().onNewFile(this.onNewFile.bind(this));
        if (configFile.folderUri.toLowerCase().endsWith("/aventus/base/src")) {
            // it's core project => remove all completions with generic def
            this._isCoreBuild = true;
        }
        this.globalSCSSLanguageService = new AventusGlobalSCSSLanguageService();
        if (autoLoad) {
            this.loadFiles();
        }
        configFile.validate();
    }
    public async init() {
        await this.onConfigSave();
    }
    public async onValidate() {
        return await AventusJSONLanguageService.getInstance().validate(this.configFile);
    }

    //#region config

    public async loadConfig() {
        let newConfig = await AventusJSONLanguageService.getInstance().getConfig(this.configFile);
        if (this.config) {
            let oldConfigTxt = JSON.stringify(this.config);
            let newConfigTxt = "";
            if (newConfig) {
                newConfigTxt = JSON.stringify(newConfig);
            }
            if (oldConfigTxt == newConfigTxt) {
                // no change inside configuration => no need to reload all
                return;
            }
            // remove all old builds
            for (let build of this.builds) {
                build.destroy();
            }
        }
        this.builds = [];
        this.config = newConfig;
    }
    /**
     * Load the new config file and create build
     */
    public async onConfigSave() {
        await this.loadConfig();
        if (this.config) {
            
            for (let build of this.config.build) {
                if (this.buildsAllowed) {
                    if (!this.buildsAllowed.includes(build.name)) {
                        continue;
                    }
                }
                else {
                    // disable only if we don't specify build
                    if (build.disabled) {
                        continue;
                    }
                }
                let newBuild = new Build(this, build);
                this.builds.push(newBuild);
                await newBuild.init()
            }

            if (this.config.static) {
                for (let _static of this.config.static) {
                    if (this.staticsAllowed && !this.staticsAllowed.includes(_static.name)) {
                        continue;
                    }
                    let staticEl = new Static(this, _static);
                    await staticEl.export();
                    this.statics.push(staticEl);
                }
            }
        }
    }

    public async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        return await AventusJSONLanguageService.getInstance().format(document, range, options);
    }
    public async onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
        return await AventusJSONLanguageService.getInstance().doComplete(document, position);
    }
    public async onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
        return await AventusJSONLanguageService.getInstance().doResolve(item);
    }
    public async onHover(document: AventusFile, position: Position): Promise<Hover | null> {
        return await AventusJSONLanguageService.getInstance().doHover(document, position);
    }

    //#endregion

    public getBuildsName(): string[] {
        let result: string[] = [];
        for (let build of this.builds) {
            result.push(build.fullname);
        }
        return result;
    }
    public getBuildsNameWithStory(): string[] {
        let result: string[] = [];
        for (let build of this.builds) {
            if (build.hasStories) {
                result.push(build.fullname);
            }
        }
        return result;
    }
    public getBuild(name: string): Build | undefined {
        for (let build of this.builds) {
            if (build.fullname == name) {
                return build;
            }
        }
        return undefined;
    }
    public getBuilds(): Build[] {
        return this.builds;
    }
    public getMatchingBuildsByUri(uri: string): Build[] {
        let result: Build[] = [];
        for (let build of this.builds) {
            if (build.isFileInside(uri)) {
                result.push(build);
            }
        }
        return result;
    }
    public getStaticsName(): string[] {
        let result: string[] = [];
        for (let build of this.statics) {
            result.push(build.name);
        }
        return result;
    }
    public getStatic(name: string): Static | undefined {
        for (let _static of this.statics) {
            if (_static.name == name) {
                return _static;
            }
        }
        return undefined;
    }

    public loadFiles() {
        let files = FilesManager.getInstance().getFilesWithExtension(AventusExtension.GlobalStyle);
        for (let file of files) {
            this.onNewFile(file);
        }
    }

    /**
     * Trigger when a new file is detected
     * @param file 
     */
    private async onNewFile(file: AventusFile) {
        if (file.path.endsWith(AventusExtension.GlobalStyle)) {
            if (!this.scssFiles[file.uri]) {
                this.scssFiles[file.uri] = new AventusGlobalSCSSFile(file, this);
                this.registerOnFileDelete(file);
            }
        }
    }
    public registerOnFileDelete(file: AventusFile) {
        this.onFileDeleteUUIDs[file.uri] = file.onDelete(this.onFileDelete.bind(this));
    }
    public async onFileDelete(file: AventusFile) {
        file.removeOnDelete(this.onFileDeleteUUIDs[file.uri]);
        delete this.onFileDeleteUUIDs[file.uri];
        // be sure to remove element
        if (file.uri.endsWith(AventusExtension.GlobalStyle)) {
            delete this.scssFiles[file.uri];
        }
    }

    public async onRename(changes: { oldUri: string, newUri: string }[]): Promise<{ [uri: string]: TextEdit[] }> {
        let result: { [uri: string]: TextEdit[] } = {};
        for (let build of this.builds) {
            let temp = await build.onRename(changes);
            for (let uri in temp) {
                if (!result[uri]) {
                    result[uri] = []
                }
                result[uri] = result[uri].concat(temp[uri]);
            }
        }
        return result;
    }

    public destroy() {
        FilesManager.getInstance().removeOnNewFile(this.onNewFileUUID);
        this.configFile.removeOnSave(this.onSaveUUID);
        this.configFile.removeOnValidate(this.onValidateUUID);
        this.configFile.removeOnFormatting(this.onFormattingUUID);
        this.configFile.removeOnCompletion(this.onCompletionUUID);
        this.configFile.removeOnCompletionResolve(this.onCompletionResolveUUID);
        this.configFile.removeOnHover(this.onHoverUUID);

        for (let build of this.builds) {
            build.destroy();
        }
        for (let _static of this.statics) {
            _static.destroy();
        }
    }


}
