import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { EOL } from "os";
import { join, normalize, sep } from "path";
import { Diagnostic, DiagnosticSeverity, TextEdit } from 'vscode-languageserver';
import { AventusErrorCode, AventusExtension, AventusLanguageId } from "../definition";
import { AventusFile } from '../files/AventusFile';
import { FilesManager } from '../files/FilesManager';
import { FilesWatcher } from '../files/FilesWatcher';
import { AventusHTMLFile } from "../language-services/html/File";
import { HTMLDoc } from '../language-services/html/helper/definition';
import { AventusHTMLLanguageService } from "../language-services/html/LanguageService";
import { AventusConfigBuild } from "../language-services/json/definition";
import { AventusWebSCSSFile } from "../language-services/scss/File";
import { AventusSCSSLanguageService } from "../language-services/scss/LanguageService";
import { AventusWebComponentLogicalFile } from "../language-services/ts/component/File";
import { AventusTsFile } from "../language-services/ts/File";
import { AventusTsFileSelector } from '../language-services/ts/FileSelector';
import { AventusTsLanguageService, CompileTsResult } from "../language-services/ts/LanguageService";
import { ClassInfo } from '../language-services/ts/parser/ClassInfo';
import { HttpServer } from '../live-server/HttpServer';
import { Compiled } from '../notification/Compiled';
import { RegisterBuild } from '../notification/RegisterBuild';
import { UnregisterBuild } from '../notification/UnregisterBuild';
import { createErrorTsPos, getFolder, pathToUri, replaceNotImportAliases, uriToPath } from "../tools";
import { Project } from "./Project";
import { AventusGlobalSCSSLanguageService } from '../language-services/scss/GlobalLanguageService';
import { DependanceManager } from './DependanceManager';
import { AventusPackageFile, AventusPackageTsFileExport, AventusPackageTsFileExportNoCode } from '../language-services/ts/package/File';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AventusGlobalComponentSCSSFile } from '../language-services/scss/GlobalComponentFile';
import { minify } from 'terser';
import { InfoType } from '../language-services/ts/parser/BaseInfo';
import { AventusBaseFile } from '../language-services/BaseFile';
import { GenericServer } from '../GenericServer';
import { NpmBuilder } from './BuildNpm';
import { AventusWebComponentSingleFile } from '../language-services/ts/component/SingleFile';

export type BuildErrors = { file: string, title: string }[]

export class Build {
    public project: Project;
    private buildConfig: AventusConfigBuild;

    private onNewFileUUID: string;
    private onFileDeleteUUIDs: { [uri: string]: string } = {}

    public globalComponentSCSSFiles: { [uri: string]: AventusGlobalComponentSCSSFile } = {}
    public scssFiles: { [uri: string]: AventusWebSCSSFile } = {}
    public tsFiles: { [uri: string]: AventusTsFile } = {}
    public noNamespaceUri: { [uri: string]: boolean } = {};
    public htmlFiles: { [uri: string]: AventusHTMLFile } = {}
    public wcFiles: { [uri: string]: AventusWebComponentSingleFile } = {};

    public namespaces: string[] = [];

    public externalPackageInformation: ExternalPackageInformation = new ExternalPackageInformation();

    private dependanceNeedUris: string[] = [];
    private dependanceFullUris: string[] = [];
    // order uri file to parse inside build
    private dependanceUris: string[] = [];
    public diagnostics: Map<AventusBaseFile, Diagnostic[]> = new Map();


    public tsLanguageService: AventusTsLanguageService;
    public get globalSCSSLanguageService(): AventusGlobalSCSSLanguageService {
        return this.project.globalSCSSLanguageService;
    }
    public scssLanguageService: AventusSCSSLanguageService;
    public htmlLanguageService: AventusHTMLLanguageService;
    private allowBuild: boolean = true;
    private initDone: boolean = false;

    public reloadPage: boolean = false;
    private _outputPathes: string[] = [];

    public readonly npmBuilder: NpmBuilder;

    public get fullname() {
        return this.buildConfig.fullname;
    }
    public get module() {
        return this.buildConfig.module;
    }
    public get isCoreBuild() {
        return this.project.isCoreBuild;
    }
    public get hideWarnings() {
        return this.buildConfig.hideWarnings;
    }
    public get nodeModulesDir(): string {
        return this.buildConfig.nodeModulesDir
    }

    public get outputPathes(): string[] {
        return this._outputPathes;
    }

    public constructor(project: Project, buildConfig: AventusConfigBuild) {
        this.project = project;
        this.buildConfig = buildConfig;
        this.onNewFileUUID = FilesManager.getInstance().onNewFile(this.onNewFile.bind(this));
        this.tsLanguageService = new AventusTsLanguageService(this);
        this.scssLanguageService = new AventusSCSSLanguageService(this);
        this.htmlLanguageService = new AventusHTMLLanguageService(this);

        this._outputPathes = [join(DependanceManager.getInstance().getPath(), "@locals", this.buildConfig.fullname + AventusExtension.Package).replace(/\\/g, '/')];
        for (let outputPackage of buildConfig.outputPackage) {
            this._outputPathes.push(outputPackage.replace(/\\/g, '/'));
        }
        this.npmBuilder = new NpmBuilder(this);
        RegisterBuild.send(project.getConfigFile().path, buildConfig.fullname);
    }
    public async init() {
        await this.loadFiles();
        this.initDone = true;
    }

    public getComponentPrefix() {
        return this.buildConfig.componentPrefix;
    }
    public getAvoidParsingTags() {
        return this.buildConfig.avoidParsingInsideTags;
    }
    public getAliases(): { [alias: string]: string } {
        return this.project.getConfig()?.aliases ?? {};
    }
    public isFileInside(uri: string): boolean {
        return uriToPath(uri).match(this.buildConfig.inputPathRegex) != null;
    }
    public getNamespace(uri: string): string {
        if (this.noNamespaceUri[uri]) {
            return "";
        }
        else if (this.buildConfig.module != "") {
            return this.buildConfig.module + '.';
        }
        return ""
    }

    public enableBuild() {
        this.allowBuild = true;
    }
    public disableBuild() {
        this.allowBuild = false;
    }
    public get isBuildAllowed() {
        return this.allowBuild;
    }
    //#region build
    private timerBuild: NodeJS.Timeout | undefined = undefined;
    public insideRebuildAll: boolean = false;
    public async rebuildAll() {
        this.allowBuild = false;
        this.insideRebuildAll = true;
        // validate
        for (let uri in this.scssFiles) {
            await this.scssFiles[uri].validate();
        }
        for (let uri in this.htmlFiles) {
            await this.htmlFiles[uri].validate();
        }
        for (let uri in this.tsFiles) {
            await this.tsFiles[uri].validate();
        }
        for (let uri in this.wcFiles) {
            await this.wcFiles[uri].validate();
        }

        for (let uri in this.scssFiles) {
            await this.scssFiles[uri].triggerSave();
        }
        for (let uri in this.htmlFiles) {
            await this.htmlFiles[uri].triggerSave();
        }
        for (let uri in this.wcFiles) {
            await this.wcFiles[uri].triggerSave();
        }
        for (let uri in this.tsFiles) {
            await this.tsFiles[uri].triggerSave();
        }
        this.insideRebuildAll = false;
        this.allowBuild = true;
        this.npmBuilder.rebuildInfo();
        if (this.initDone) {
            await this.build();
        }
        else {
            await this._build();
        }
    }
    public async build() {
        if (!this.initDone) {
            return;
        }
        let delay = GenericServer.delayBetweenBuild();
        if (delay == 0) {
            await this._build();
        }
        else {
            if (this.timerBuild) {
                clearTimeout(this.timerBuild);
            }
            this.timerBuild = setTimeout(async () => {
                await this._build();
            }, delay)
        }
    }

    private addDiagnostic(file: AventusTsFile, diagnostic: Diagnostic) {
        if (!this.diagnostics.has(file)) {
            this.diagnostics.set(file, []);
        }
        this.diagnostics.get(file)?.push(diagnostic);
    }
    private clearDiagnostics() {
        for (let [file, errors] of this.diagnostics.entries()) {
            if (file instanceof AventusTsFile) {
                GenericServer.sendDiagnostics({
                    uri: file.file.uri,
                    diagnostics: file.getDiagnostics()
                })
            }
        }
        this.diagnostics.clear();
    }
    private emitDiagnostics() {
        for (let [file, errors] of this.diagnostics.entries()) {
            if (file instanceof AventusTsFile) {
                let finalErrors = [...errors, ...file.getDiagnostics()];
                if (this.hideWarnings) {
                    finalErrors = finalErrors.filter(p => p.severity != DiagnosticSeverity.Warning)
                }
                GenericServer.sendDiagnostics({
                    uri: file.file.uri,
                    diagnostics: finalErrors
                })
            }
        }
    }
    private async _build() {
        if (!this.allowBuild) {
            return
        }
        if (GenericServer.isDebug()) {
            console.log("building " + this.buildConfig.fullname);
        }
        this.clearDiagnostics();
        let buildErrors: BuildErrors = []
        let compilationInfo = await this.buildOrderCompilationInfo();
        let result = await this.buildLocalCode(compilationInfo.toCompile, this.buildConfig.module);

        buildErrors = await this.writeBuildCode(result, compilationInfo.libSrc, this.buildConfig.outputFile);
        let srcInfo = {
            namespace: this.buildConfig.module,
            available: result.codeRenderInJs,
            existing: result.codeNotRenderInJs
        }
        for (let outputPackage of this.buildConfig.outputPackage) {
            this.writeBuildDocumentation(outputPackage, result, srcInfo)
        }

        Compiled.send(this.buildConfig.fullname, buildErrors);
        if (this.reloadPage) {
            this.reloadPage = false;
            HttpServer.getInstance().reload();
        }
        this.emitDiagnostics();
    }
    private _buildStringModule(namespace: string, codeBefore: string[], code: string[], classesName: { [name: string]: { type: InfoType, isExported: boolean, convertibleName: string } }, codeAfter: string[], stylesheets: string[]) {
        let finalTxt = '';
        let splittedNames = namespace.split(".");
        finalTxt += codeBefore.join(EOL) + EOL;
        if (code.length > 0) {
            finalTxt += "var " + splittedNames[0] + ";" + EOL;
            // create intermediate namespace
            let baseName = '';
            for (let i = 0; i < splittedNames.length; i++) {
                if (baseName != "") { baseName += '.' + splittedNames[i]; }
                else { baseName = splittedNames[i] }

                finalTxt += '(' + baseName + '||(' + baseName + ' = {}));' + EOL
            }

            let namespaces: string[] = [];
            let afterCode: string[] = [];
            let subNamespace: string[] = [];
            for (let className in classesName) {
                if (className != "") {
                    let classNameSplitted = className.split(".");
                    let currentNamespace = "";
                    for (let i = 0; i < classNameSplitted.length - 1; i++) {
                        if (currentNamespace.length == 0) {
                            currentNamespace = classNameSplitted[i]
                        }
                        else {
                            currentNamespace += "." + classNameSplitted[i];
                        }
                        if (subNamespace.indexOf(currentNamespace) == -1) {
                            subNamespace.push(currentNamespace);
                            if (currentNamespace.includes(".")) {
                                namespaces.push(`${currentNamespace} = {};`)
                            }
                            else {
                                namespaces.push(`const ${currentNamespace} = {};`)
                            }
                            namespaces.push(`_.${currentNamespace} = {};`)
                        }
                    }
                }
            }

            finalTxt += "(function (" + splittedNames[0] + ") {" + EOL;
            finalTxt += "const moduleName = `" + baseName + "`;" + EOL;
            finalTxt += "const _ = {};" + EOL;
            finalTxt += stylesheets.join(EOL) + EOL;
            finalTxt += namespaces.join(EOL) + EOL;
            finalTxt += 'let _n;' + EOL;
            finalTxt += code.join(EOL) + EOL;
            finalTxt += afterCode.join(EOL) + EOL;
            finalTxt += `for(let key in _) { ${namespace}[key] = _[key] }`
            finalTxt = finalTxt.trim() + EOL;
            finalTxt += "})(" + splittedNames[0] + ");" + EOL;
        }
        finalTxt += codeAfter.join(EOL) + EOL;
        finalTxt = finalTxt.trim() + EOL;
        return finalTxt;
    }

    /**
     * Write the code inside the exported .js
     */
    private async writeBuildCode(localCode: {
        code: string[], codeNoNamespaceBefore: string[], codeNoNamespaceAfter: string[], classesName: { [name: string]: { type: InfoType, isExported: boolean, convertibleName: string } }, stylesheets: { [name: string]: string }
    }, libSrc: string, outputs:string[]): Promise<BuildErrors> {
        let result: BuildErrors = []
        if (outputs && outputs.length > 0) {
            let finalTxt = '';
            let npmResult = await this.npmBuilder.compile();
            result = [...result, ...npmResult.errors];
            finalTxt += npmResult.result;
            finalTxt += libSrc + EOL;
            let stylesheets: string[] = [];
            for (let name in localCode.stylesheets) {
                stylesheets.push(`Aventus.Style.store("${name}", \`${localCode.stylesheets[name]}\`)`)
            }
            finalTxt += this._buildStringModule(
                this.buildConfig.module,
                localCode.codeNoNamespaceBefore,
                localCode.code,
                localCode.classesName,
                localCode.codeNoNamespaceAfter,
                stylesheets
            );

            for (let outputFile of outputs) {
                let folderPath = getFolder(outputFile.replace(/\\/g, "/"));
                if (!existsSync(folderPath)) {
                    mkdirSync(folderPath, { recursive: true });
                }
                if (this.buildConfig.compressed) {
                    try {

                        const resultTemp = await minify({
                            "file1.js": finalTxt
                        }, {
                            compress: false,
                            format: {
                                comments: false,
                            }
                        })
                        finalTxt = resultTemp.code ?? '';
                    } catch (e) {
                        console.log(e);
                    }
                }
                writeFileSync(outputFile, finalTxt);
            }
        }

        return result;
    }
    /**
     * Write the code inside the exported .package.avt
     */
    private writeBuildDocumentation(outputPackage: string, result: {
        doc: string[],
        docNoNamespace: string[],
        docInvisible: string[],
        htmlDoc: HTMLDoc,
        stylesheets: { [name: string]: string }
    }, srcInfo: {
        namespace: string,
        available: AventusPackageTsFileExport[],
        existing: AventusPackageTsFileExportNoCode[]
    }
    ) {


        let finaltxtJs = "";
        finaltxtJs = "declare global {" + EOL;
        finaltxtJs += "\tdeclare namespace " + this.buildConfig.module + "{" + EOL;
        finaltxtJs += result.doc.join(EOL) + EOL;
        finaltxtJs += "\t}";
        result.docNoNamespace.length > 0 ? (finaltxtJs += EOL + result.docNoNamespace.join(EOL) + EOL) : (finaltxtJs += EOL)
        finaltxtJs += "}";
        result.docInvisible.length > 0 ? (finaltxtJs += EOL + result.docInvisible.join(EOL) + EOL) : (finaltxtJs += EOL)

        let finaltxt = "// " + this.buildConfig.fullname + ":" + this.buildConfig.version + EOL;
        finaltxt += "//#region js def //" + EOL + finaltxtJs;
        finaltxt += "//#endregion js def //" + EOL;
        finaltxt += "//#region js src //" + EOL + JSON.stringify(srcInfo) + EOL;
        finaltxt += "//#endregion js src //" + EOL;
        finaltxt += "//#region css def //" + EOL;
        finaltxt += JSON.stringify(this.scssLanguageService.getInternalDocumentation()) + EOL;
        finaltxt += "//#endregion css def //" + EOL;
        finaltxt += "//#region css //" + EOL;
        finaltxt += JSON.stringify(result.stylesheets) + EOL;
        finaltxt += "//#endregion css //" + EOL;
        finaltxt += "//#region html //" + EOL;
        finaltxt += JSON.stringify(result.htmlDoc) + EOL;
        finaltxt += "//#endregion html //" + EOL;
        finaltxt += "//#region dependances //" + EOL;
        finaltxt += JSON.stringify(this.buildConfig.dependances) + EOL;
        finaltxt += "//#endregion dependances //" + EOL;

        if (outputPackage) {
            writeFileSync(outputPackage, finaltxt);
        }
        else if (existsSync(outputPackage)) {
            unlinkSync(outputPackage);
        }

        let pathPackages = join(DependanceManager.getInstance().getPath(), "@locals");
        if (!existsSync(pathPackages)) {
            mkdirSync(pathPackages, { recursive: true });
        }

        writeFileSync(join(pathPackages, this.buildConfig.fullname + AventusExtension.Package), finaltxt);
    }

    /**
     * Build the code for the current project after order
     */
    private async buildLocalCode(toCompile: CompileTsResult[], namespace: string) {
        let result: {
            codeNoNamespaceBefore: string[],
            code: string[],
            codeNoNamespaceAfter: string[],
            doc: string[],
            docNoNamespace: string[],
            docInvisible: string[],
            classesName: { [className: string]: { type: InfoType, isExported: boolean, convertibleName: string } },

            stylesheets: { [name: string]: string },

            codeRenderInJs: AventusPackageTsFileExport[],
            codeNotRenderInJs: AventusPackageTsFileExportNoCode[],

            htmlDoc: HTMLDoc
        } = {
            codeNoNamespaceBefore: [],
            code: [],
            codeNoNamespaceAfter: [],
            doc: [],
            docNoNamespace: [],
            docInvisible: [],
            classesName: {},
            stylesheets: {},
            codeRenderInJs: [],
            codeNotRenderInJs: [],

            htmlDoc: {}
        }

        let renderInJsByFullname: { [fullname: string]: AventusPackageTsFileExport } = {}
        let notRenderInJsByFullname: { [fullname: string]: AventusPackageTsFileExportNoCode } = {}

        let moduleCodeStarted = false;

        let namespaceWithDot = "";
        if (namespace != "") {
            namespaceWithDot = namespace + '.'
        }

        /** Prepare the right dependances for a class (local, external, npm and uri) */
        const prepareDependances = (deps: { fullName: string; uri: string; isStrong: boolean }[], currentUri: string): { fullName: string; isStrong: boolean }[] => {
            let result: { fullName: string; isStrong: boolean }[] = [];
            for (let dep of deps) {
                let depName = "";
                if (dep.uri == "@local") {
                    if (this.noNamespaceUri[currentUri]) {
                        depName = dep.fullName.replace("$namespace$", '');
                    }
                    else {
                        depName = dep.fullName.replace("$namespace$", namespaceWithDot);
                    }
                }
                else if (dep.uri == "@external" || dep.uri == "@npm") {
                    depName = dep.fullName;
                }
                else {
                    if (this.noNamespaceUri[dep.uri]) {
                        depName = (dep.fullName.replace("$namespace$", ''));
                    }
                    else {
                        depName = dep.fullName.replace("$namespace$", namespaceWithDot);
                    }
                }
                result.push({
                    fullName: depName,
                    isStrong: dep.isStrong
                })
            }
            return result;
        }
        /** Prepare the HTML Doc for the webcomponent */
        const addHTMLDoc = (info: CompileTsResult, inside: boolean) => {
            let doc = this.tsFiles[info.uri];
            if (doc instanceof AventusWebComponentLogicalFile) {
                if (doc.compilationResult) {
                    if (inside) {
                        let docToAdd: HTMLDoc = JSON.parse(JSON.stringify(doc.compilationResult.htmlDoc));
                        for (let compName in docToAdd) {
                            docToAdd[compName].class = this.buildConfig.module + '.' + docToAdd[compName].class;
                            result.htmlDoc[compName] = docToAdd[compName];
                        }
                    }
                    else {
                        result.htmlDoc = {
                            ...result.htmlDoc,
                            ...doc.compilationResult.htmlDoc
                        }
                    }
                }
            }
        }

        for (let info of toCompile) {
            if (this.noNamespaceUri[info.uri]) {
                if (info.compiled != "") {
                    if (moduleCodeStarted) {
                        result.codeNoNamespaceAfter.push(info.compiled)
                        if (!renderInJsByFullname[info.classScript]) {
                            renderInJsByFullname[info.classScript] = {
                                code: replaceNotImportAliases(info.compiled, this.project.getConfig()),
                                dependances: prepareDependances(info.dependances, info.uri),
                                fullName: info.classScript,
                                required: info.required,
                                noNamespace: "after",
                                type: info.type,
                                isExported: info.isExported,
                                convertibleName: info.convertibleName,
                            };
                        }
                    }
                    else {
                        result.codeNoNamespaceBefore.push(info.compiled);
                        if (!renderInJsByFullname[info.classScript]) {
                            renderInJsByFullname[info.classScript] = {
                                code: replaceNotImportAliases(info.compiled, this.project.getConfig()),
                                dependances: prepareDependances(info.dependances, info.uri),
                                fullName: info.classScript,
                                required: info.required,
                                noNamespace: "before",
                                type: info.type,
                                isExported: info.isExported,
                                convertibleName: info.convertibleName,
                            }
                        }
                    }
                }
                else {
                    if (info.classScript != "" && !notRenderInJsByFullname[info.classScript] && !info.classScript.startsWith("!staticClass_")) {
                        notRenderInJsByFullname[info.classScript] = {
                            fullName: info.classScript,
                            dependances: prepareDependances(info.dependances, info.uri),
                        }
                    }
                    if (info.classDoc != "" && !notRenderInJsByFullname[info.classDoc] && !info.classDoc.startsWith("!staticClass_")) {
                        notRenderInJsByFullname[info.classDoc] = {
                            fullName: info.classScript,
                            dependances: prepareDependances(info.dependances, info.uri),
                        }
                    }
                }
                if (info.docVisible != "") {
                    result.docNoNamespace.push(info.docVisible);
                }
                if (info.docInvisible != "") {
                    result.doc.push(info.docInvisible);
                }
                addHTMLDoc(info, false);
            }
            else {
                moduleCodeStarted = true;
                if (info.classScript != "" && !info.classScript.startsWith("!staticClass_")) {
                    result.classesName[info.classScript] = {
                        type: info.type,
                        isExported: info.isExported,
                        convertibleName: info.convertibleName
                    }
                }

                if (info.compiled != "") {
                    result.code.push(replaceNotImportAliases(info.compiled, this.project.getConfig()))
                    let exportName = namespaceWithDot + info.classScript;
                    if (!renderInJsByFullname[exportName]) {
                        renderInJsByFullname[exportName] = {
                            code: replaceNotImportAliases(info.compiled, this.project.getConfig()),
                            dependances: prepareDependances(info.dependances, info.uri),
                            fullName: exportName,
                            required: info.required,
                            type: info.type,
                            isExported: info.isExported,
                            convertibleName: info.convertibleName
                        }
                    }
                }
                else {
                    if (info.classScript != "" && !notRenderInJsByFullname[info.classScript] && !info.classScript.startsWith("!staticClass_")) {
                        let exportName = namespaceWithDot + info.classScript;
                        notRenderInJsByFullname[info.classScript] = {
                            fullName: exportName,
                            dependances: prepareDependances(info.dependances, info.uri),
                        }
                    }
                    if (info.classDoc != "" && !notRenderInJsByFullname[info.classDoc] && !info.classDoc.startsWith("!staticClass_")) {
                        let exportName = namespaceWithDot + info.classDoc;
                        notRenderInJsByFullname[info.classDoc] = {
                            fullName: exportName,
                            dependances: prepareDependances(info.dependances, info.uri),
                        }
                    }
                }
                if (info.docVisible != "") {
                    result.doc.push(info.docVisible);
                }
                if (info.docInvisible != "") {
                    result.doc.push(info.docInvisible);
                }
                addHTMLDoc(info, true);
            }
        }

        result.codeRenderInJs = Object.values(renderInJsByFullname);
        result.codeNotRenderInJs = Object.values(notRenderInJsByFullname);

        for (let compStyle of this.buildConfig.componentStyle) {
            if (!compStyle.outputFile && this.globalComponentSCSSFiles[pathToUri(compStyle.path)]) {
                let file = this.globalComponentSCSSFiles[pathToUri(compStyle.path)];
                result.stylesheets[compStyle.name] = file.compileResult;
            }
        }

        return result;
    }

    private async buildOrderCompilationInfo(): Promise<{ toCompile: CompileTsResult[], libSrc: string }> {
        let result: { toCompile: CompileTsResult[], libSrc: string } = { toCompile: [], libSrc: '' };
        // map local information by fullname
        let localClassByFullName: { [fullName: string]: CompileTsResult } = {};
        let localClass: { [name: string]: CompileTsResult } = {};
        for (let fileUri in this.tsFiles) {
            let currentFile = this.tsFiles[fileUri];
            for (let compileInfo of currentFile.compileResult) {
                if (compileInfo.classScript !== "") {
                    if (localClass[compileInfo.classScript]) {
                        let txt = "The name " + compileInfo.classScript + " is registered more than once.";
                        let info = currentFile.fileParsed?.getBaseInfo(compileInfo.classScript);
                        if (info) {
                            this.addDiagnostic(currentFile, createErrorTsPos(currentFile.file.document, txt, info.nameStart, info.nameEnd, AventusErrorCode.SameNameFound));
                        }
                        else {
                            throw 'Please contact the support its an unknow case'
                        }

                        let oldFile = this.tsFiles[localClass[compileInfo.classScript].uri]
                        info = oldFile.fileParsed?.getBaseInfo(compileInfo.classScript);
                        if (info) {
                            this.addDiagnostic(oldFile, createErrorTsPos(oldFile.file.document, txt, info.nameStart, info.nameEnd, AventusErrorCode.SameNameFound));
                        }
                        else {
                            throw 'Please contact the support its an unknow case'
                        }
                    }
                    else {
                        localClassByFullName[compileInfo.classScript] = compileInfo;
                        localClass[compileInfo.classScript] = compileInfo;
                    }
                }
                // in case script and doc are different
                if (compileInfo.classDoc !== "" && !localClassByFullName[compileInfo.classDoc]) {
                    localClassByFullName[compileInfo.classDoc] = compileInfo;
                }
            }
        }

        let allProms: Promise<{ [uri: string]: string }>[] = [];

        // load
        let loadedInfoInternal: string[] = [];
        let loadedInfoExternal: { [uri: string]: string[] } = {};
        let localUri = '@local';
        /**
         * Load information for a class and the dependances needed
         */
        const loadAndOrderInfo = (info: { fullName: string; isStrong: boolean }, isLocal: boolean, indexByUri: { [uri: string]: number }, alreadyLooked: { [name: string]: (() => void)[] }, alreadyLookedStrong: { [name: string]: boolean }): { [uri: string]: number } | Promise<{ [uri: string]: string }> => {
            const fullName = info.fullName.replace("$namespace$", '');
            let uri = "";
            let infoExternal: null | {
                content: AventusPackageTsFileExport | "noCode";
                uri: string;
            } = null;
            if (isLocal) {
                uri = localUri;
            }
            else {
                infoExternal = this.externalPackageInformation.getByFullName(fullName);
                if (!infoExternal) {
                    // it s an error
                    return indexByUri;
                }
                uri = infoExternal.uri;
            }

            if (alreadyLooked[fullName] !== undefined) {

                if (info.isStrong) {
                    // loop on a strong dependance => infinite loop 
                    if (alreadyLookedStrong[fullName] !== undefined) {
                        console.log("error impossible");
                        return indexByUri;
                    }

                    const prom = new Promise<{ [uri: string]: string }>((resolve) => {
                        alreadyLooked[fullName].push(() => {
                            resolve({ [uri]: fullName });
                        })
                    })
                    allProms.push(prom);
                    return prom;
                }
                return indexByUri;
            }
            else {
                alreadyLooked[fullName] = [];
            }
            if (info.isStrong) {
                alreadyLookedStrong[fullName] = true;
            }
            const promises: Promise<{ [uri: string]: string }>[] = [];
            const calculate: () => void = () => {
                if (isLocal) {
                    if (!localClassByFullName[fullName]) {
                        if (indexByUri[uri] === undefined) {
                            indexByUri[uri] = -1;
                        }
                        return;
                    }

                    let previousIndex = loadedInfoInternal.indexOf(fullName);
                    if (previousIndex != -1) {
                        if (indexByUri[uri] === undefined) {
                            indexByUri[uri] = previousIndex + 1;
                        }
                        return;
                    }

                    let infoInternal = localClassByFullName[fullName];
                    let insertIndex = 0;
                    for (let dependance of infoInternal.dependances) {
                        if (dependance.uri == "@npm") {
                            continue;
                        }

                        let cloneBeforeLoop = { ...indexByUri };
                        // load info to force insert before
                        if (dependance.uri == "@external") {
                            const resultTemp = loadAndOrderInfo(dependance, false, indexByUri, alreadyLooked, {});
                            if (resultTemp instanceof Promise) {
                                if (dependance.isStrong) {
                                    promises.push(resultTemp);
                                }
                            }
                            else {
                                indexByUri = resultTemp
                            }
                        }
                        else {
                            if (dependance.isStrong) {
                                let fullNameDep = dependance.fullName.replace("$namespace$", '');
                                if (fullNameDep != fullName) {

                                    const resultTemp = loadAndOrderInfo(dependance, true, indexByUri, alreadyLooked, alreadyLookedStrong);
                                    if (resultTemp instanceof Promise) {
                                        promises.push(resultTemp);
                                    }
                                    else {
                                        indexByUri = resultTemp
                                        if (indexByUri[uri] && indexByUri[uri] >= 0 && indexByUri[uri] > insertIndex) {
                                            insertIndex = indexByUri[uri];
                                        }
                                    }
                                }

                            }
                            else {
                                let oldLength = result.toCompile.length;
                                const resultTemp = loadAndOrderInfo(dependance, true, indexByUri, alreadyLooked, {});
                                if (!(resultTemp instanceof Promise)) {
                                    indexByUri = resultTemp
                                    if (indexByUri[uri] && indexByUri[uri] >= 0 && indexByUri[uri] > insertIndex) {
                                        insertIndex = indexByUri[uri];
                                    }
                                }
                                let newLength = result.toCompile.length;
                                if (indexByUri[uri] && indexByUri[uri] >= 0 && indexByUri[uri] > insertIndex) {
                                    if (insertIndex > 0) {
                                        insertIndex += (newLength - oldLength);
                                    }
                                }

                            }
                        }
                        indexByUri = cloneBeforeLoop;
                    }
                    if (loadedInfoInternal.indexOf(fullName) != -1) {
                        result[uri] = loadedInfoInternal.indexOf(fullName);
                        return;
                    }

                    if (promises.length == 0) {
                        result.toCompile.splice(insertIndex, 0, infoInternal);
                        loadedInfoInternal.splice(insertIndex, 0, fullName);
                        for (const cb of alreadyLooked[fullName]) {
                            cb()
                        }
                        alreadyLooked[fullName] = [];
                    }
                    indexByUri[uri] = result.toCompile.length
                    return;
                }
                else {
                    if (!infoExternal) {
                        // it s an error
                        return;
                    }
                    if (!this.dependanceUris.includes(uri)) {
                        // don't need to load the lib because not include inside build (care change this if want to load dependance of depenande not included)
                        return;
                    }
                    if (!loadedInfoExternal[uri]) {
                        loadedInfoExternal[uri] = [];
                    }
                    let previousIndex = loadedInfoExternal[uri].indexOf(fullName);
                    if (previousIndex != -1) {
                        indexByUri[uri] = previousIndex + 1;
                        return;
                    }

                    let insertIndex = 0;
                    if (infoExternal.content != 'noCode') {
                        for (let dependance of infoExternal.content.dependances) {
                            let cloneBeforeLoop = { ...indexByUri };
                            let strongDep = dependance.isStrong ? alreadyLookedStrong : {};
                            const resultTemp = loadAndOrderInfo(dependance, false, indexByUri, alreadyLooked, strongDep);
                            if (resultTemp instanceof Promise) {
                                if (dependance.isStrong) {
                                    promises.push(resultTemp);
                                }
                            }
                            else {
                                indexByUri = resultTemp;
                                if (indexByUri[uri] && indexByUri[uri] >= 0 && indexByUri[uri] > insertIndex) {
                                    insertIndex = indexByUri[uri];
                                }
                            }
                            indexByUri = cloneBeforeLoop;

                        }
                    }

                    if (loadedInfoExternal[uri].includes(fullName)) {
                        indexByUri[uri] = loadedInfoExternal[uri].indexOf(fullName);
                        return;
                    }

                    if (promises.length == 0) {
                        loadedInfoExternal[uri].splice(insertIndex, 0, fullName);
                        indexByUri[uri] = loadedInfoExternal[uri].length;
                        for (const cb of alreadyLooked[fullName]) {
                            cb()
                        }
                        alreadyLooked[fullName] = [];
                    }
                    return;
                }
            }
            calculate();
            if (info.isStrong) {
                delete alreadyLookedStrong[fullName];
            }

            if (promises.length == 0) {
                if (alreadyLooked[fullName] && alreadyLooked[fullName].length == 0) {
                    delete alreadyLooked[fullName];
                }
                return indexByUri;
            }
            else {
                const prom = new Promise<{ [uri: string]: string }>(async (resolve) => {
                    const asyncResults = await Promise.all(promises);
                    let insertIndex = indexByUri[uri] ?? 0;
                    for (const result of asyncResults) {
                        if (result[uri]) {
                            let fullnameTemp = result[uri];
                            if (isLocal) {
                                let indexTemp = loadedInfoInternal.indexOf(fullnameTemp) + 1
                                if (indexTemp > insertIndex) {
                                    insertIndex = indexTemp;
                                }
                            }
                            else {
                                let indexTemp = loadedInfoExternal[uri].indexOf(fullnameTemp) + 1
                                if (indexTemp > insertIndex) {
                                    insertIndex = indexTemp;
                                }
                            }
                        }
                    }

                    if (isLocal) {
                        let infoInternal = localClassByFullName[fullName];
                        if (!loadedInfoInternal.includes(fullName)) {
                            result.toCompile.splice(insertIndex, 0, infoInternal);
                            loadedInfoInternal.splice(insertIndex, 0, fullName);
                        }
                    }
                    else if (!loadedInfoExternal[uri].includes(fullName)) {
                        loadedInfoExternal[uri].splice(insertIndex, 0, fullName);
                    }
                    for (const cb of alreadyLooked[fullName]) {
                        cb()
                    }
                    delete alreadyLooked[fullName];
                    resolve({ [uri]: fullName });
                });
                allProms.push(prom);
                return prom;
            }

        }

        // load internal file
        for (let fileUri in this.tsFiles) {
            let currentFile = this.tsFiles[fileUri];
            for (let compileInfo of currentFile.compileResult) {
                if (compileInfo.classScript !== "") {
                    loadAndOrderInfo({
                        fullName: compileInfo.classScript,
                        isStrong: true,
                    }, true, {}, {}, {});
                }
                if (compileInfo.classDoc !== "") {
                    loadAndOrderInfo({
                        fullName: compileInfo.classDoc,
                        isStrong: true,
                    }, true, {}, {}, {});
                }
            }
        }
        await Promise.all(allProms);
        allProms = [];
        // add required code for lib
        for (let libUri of this.dependanceNeedUris) {
            let requiredInfos = this.externalPackageInformation.getInformationsRequired(libUri);
            if (!loadedInfoExternal[libUri]) {
                loadedInfoExternal[libUri] = [];
            }
            for (let requiredInfo of requiredInfos) {
                if (!loadedInfoExternal[libUri].includes(requiredInfo.fullName)) {
                    loadAndOrderInfo({
                        fullName: requiredInfo.fullName,
                        isStrong: true
                    }, false, {}, {}, {});
                }
            }
        }

        await Promise.all(allProms);
        allProms = [];

        for (let libUri of this.dependanceFullUris) {
            if (!loadedInfoExternal[libUri]) {
                loadedInfoExternal[libUri] = [];
            }
            let fullInfos = this.externalPackageInformation.getFullInformations(libUri);
            for (let fullInfo of fullInfos) {
                if (!loadedInfoExternal[libUri].includes(fullInfo.fullName)) {
                    loadAndOrderInfo({
                        fullName: fullInfo.fullName,
                        isStrong: true
                    }, false, {}, {}, {});
                }
            }
        }

        await Promise.all(allProms);
        allProms = [];

        // build code for each lib
        let libSrc: string[] = []
        for (let libUri of this.dependanceUris) {
            let libInfo: { namespace: string, code: string[], before: string[], after: string[], classesName: { [name: string]: { type: InfoType, isExported: boolean, convertibleName: string } } } = {
                namespace: this.externalPackageInformation.getNamespaceByUri(libUri),
                before: [],
                code: [],
                after: [],
                classesName: {},
            }
            if (!loadedInfoExternal[libUri]) {
                continue;
            }
            for (let fullname of loadedInfoExternal[libUri]) {
                let infoExternal = this.externalPackageInformation.getByFullName(fullname);
                if (infoExternal.content != 'noCode') {
                    let code = replaceNotImportAliases(infoExternal.content.code, this.project.getConfig());
                    if (!infoExternal.content.noNamespace) {
                        libInfo.code.push(code);
                        let regex = new RegExp('^' + this.externalPackageInformation.getNamespaceByUri(infoExternal.uri) + "\.");
                        let fullNameTemp = infoExternal.content.fullName.replace(regex, "");
                        libInfo.classesName[fullNameTemp] = {
                            type: infoExternal.content.type,
                            isExported: infoExternal.content.isExported,
                            convertibleName: infoExternal.content.convertibleName,
                        }
                    }
                    else if (infoExternal.content.noNamespace == 'before') {
                        libInfo.before.push(code);
                    }
                    else if (infoExternal.content.noNamespace == 'after') {
                        libInfo.after.push(code);
                    }

                }
            }

            let stylesheetsInfo = this.externalPackageInformation.getStyleByUri(libUri);
            let stylesheets: string[] = [];
            for (let name in stylesheetsInfo) {
                stylesheets.push(`Aventus.Style.store("${name}", \`${stylesheetsInfo[name]}\`)`);
            }
            let codeModule = this._buildStringModule(libInfo.namespace, libInfo.before, libInfo.code, libInfo.classesName, libInfo.after, stylesheets);
            libSrc.push(codeModule);

        }

        result.libSrc = libSrc.join(EOL);



        return result;
    }

    private getAllFullnames() {
        let result: { [module: string]: string[] } = {}

        const insert = (fullname:string) => {
            if(fullname.startsWith("!staticClass_")) return;
            let moduleName = fullname.split(".")[0];
            if (!result[moduleName]) {
                result[moduleName] = []
            }
            result[moduleName].push(fullname);

        }

        for (let fileUri in this.tsFiles) {
            let currentFile = this.tsFiles[fileUri];
            for (let compileInfo of currentFile.compileResult) {
                if (compileInfo.classScript !== "") {
                    insert(compileInfo.classScript);
                }
            }
        }

        for (let libUri of this.dependanceNeedUris) {
            let infos = this.externalPackageInformation.getInformationsRequired(libUri);
            for (let info of infos) {
                if (info.code) {
                    insert(info.fullName);
                }
            }
        }

        for (let libUri of this.dependanceFullUris) {
            let infos = this.externalPackageInformation.getFullInformations(libUri);
            for (let info of infos) {
                if (info.code) {
                    insert(info.fullName);
                }
            }
        }
        return result;
    }
    //#endregion

    /**
     * Trigger when a new file is detected
     * @param file 
     */
    private async onNewFile(file: AventusFile) {
        if (this.buildConfig.inputPathRegex) {
            if (file.path.match(this.buildConfig.inputPathRegex)) {
                this.registerFile(file);
            }
        }
        if (this.buildConfig.outsideModulePathRegex) {
            if (file.path.match(this.buildConfig.outsideModulePathRegex)) {
                this.registerFile(file);
                this.noNamespaceUri[file.uri] = true;
            }
        }
    }

    /**
     * Load all aventus file needed for this build
     */
    private async loadFiles() {
        this.allowBuild = false;
        let dependancesInfo = await DependanceManager.getInstance().loadDependancesFromBuild(this.buildConfig, this);
        this.dependanceFullUris = dependancesInfo.dependanceFullUris;
        this.dependanceNeedUris = dependancesInfo.dependanceNeedUris;
        this.dependanceUris = dependancesInfo.dependanceUris;
        this.externalPackageInformation.init(dependancesInfo.files);
        let fileManager = FilesManager.getInstance();
        if (this.buildConfig.inputPathRegex) {
            let files: AventusFile[] = fileManager.getFilesMatching(this.buildConfig.inputPathRegex);
            for (let file of files) {
                this.registerFile(file);
            }
        }
        if (this.buildConfig.outsideModulePathRegex) {
            let files: AventusFile[] = fileManager.getFilesMatching(this.buildConfig.outsideModulePathRegex);
            for (let file of files) {
                this.registerFile(file);
                this.noNamespaceUri[file.uri] = true;
            }
        }

        for (let compStyle of this.buildConfig.componentStyle) {
            let file = fileManager.getByPath(compStyle.path);
            if (!file) {
                let newDoc = TextDocument.create(pathToUri(compStyle.path), AventusLanguageId.SCSS, 0, '');
                await fileManager.registerFile(newDoc);
                file = fileManager.getByPath(compStyle.path);
            }
            if (file && !this.globalComponentSCSSFiles[file.uri]) {
                this.globalComponentSCSSFiles[file.uri] = new AventusGlobalComponentSCSSFile(file, this, compStyle.name, compStyle.outputFile);
                this.registerOnFileDelete(file);
            }
        }

        if (GenericServer.isDebug()) {
            console.log("loaded all files needed");
        }
        this.allowBuild = true;
        await this.rebuildAll();
    }
    /**
     * Register one file inside this build
     * @param file 
     */
    private async registerFile(file: AventusFile) {
        if (file.uri.endsWith(AventusExtension.ComponentStyle)) {
            if (!this.scssFiles[file.uri]) {
                this.scssFiles[file.uri] = new AventusWebSCSSFile(file, this);
                await this.scssFiles[file.uri].init()
                this.registerOnFileDelete(file);
            }
        }
        else if (file.uri.endsWith(AventusExtension.ComponentView)) {
            if (!this.htmlFiles[file.uri]) {
                this.htmlFiles[file.uri] = new AventusHTMLFile(file, this);
                await this.htmlFiles[file.uri].init()
                this.registerOnFileDelete(file);
            }
        }
        else if (file.uri.endsWith(AventusExtension.Component)) {
            if (!this.wcFiles[file.uri]) {
                this.wcFiles[file.uri] = new AventusWebComponentSingleFile(file, this);
                await this.wcFiles[file.uri].init();
                this.registerOnFileDelete(file);
            }
        }
        else {
            if (!this.tsFiles[file.uri]) {
                let fileCreated = AventusTsFileSelector(file, this);
                if (fileCreated) {
                    this.tsFiles[file.uri] = fileCreated;
                    this.registerOnFileDelete(file);
                }
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
        if (file.uri.endsWith(AventusExtension.ComponentStyle)) {
            delete this.scssFiles[file.uri];
        }
        else if (file.uri.endsWith(AventusExtension.ComponentView)) {
            delete this.htmlFiles[file.uri];
        }
        else if (file.uri.endsWith(AventusExtension.Component)) {
            delete this.wcFiles[file.uri];
        }
        else {
            delete this.tsFiles[file.uri];
        }

        await this.rebuildAll();
    }

    public getLocalWebComponentDefinition(tagName: string, searchInsideProject: boolean = false): ClassInfo | undefined {
        let localInfo = this.htmlLanguageService.getInternalDefinition(tagName);
        if (localInfo && localInfo.fileParsed) {
            let compName = localInfo.getComponentName();
            if (compName) {
                let resultLocal = localInfo.fileParsed.classes[compName];
                if (resultLocal) {
                    return resultLocal
                }
            }
        }
        return;
    }
    public getWebComponentDefinition(tagName: string, searchInsideProject: boolean = false): { class: ClassInfo, isLocal: boolean } | undefined {
        let localInfo = this.htmlLanguageService.getInternalDefinition(tagName);
        if (localInfo && localInfo.fileParsed) {
            let compName = localInfo.getComponentName();
            if (compName) {
                let resultLocal = localInfo.fileParsed.classes[compName];
                if (resultLocal) {
                    return {
                        class: resultLocal,
                        isLocal: true
                    }
                }
            }
        }
        let className = this.htmlLanguageService.getClassByTag(tagName);
        if (className) {
            let external = this.externalPackageInformation.getExternalWebComponentDefinition(className);
            if (external) {
                if (searchInsideProject) {
                    let internal = this.project.getInternalWebComponentDefinition(uriToPath(external.fileUri), tagName);
                    if (internal) {
                        return {
                            class: internal,
                            isLocal: false
                        }
                    }
                }
                return {
                    class: external,
                    isLocal: false
                }
            }
        }
        return undefined;
    }
    public getWebComponentDefinitionFile(tagName: string): AventusTsFile | AventusPackageFile | undefined {
        let localInfo = this.htmlLanguageService.getInternalDefinition(tagName);
        if (localInfo) {
            return localInfo;
        }
        let className = this.htmlLanguageService.getClassByTag(tagName);
        if (className) {
            return this.externalPackageInformation.getExternalWebComponentDefinitionFile(className);
        }
        return undefined;
    }

    public getNamespaceForUri(uri: string, removeParentFolder: boolean): string {
        if (this.buildConfig.namespaceStrategy == 'manual') {
            return "";
        }
        else if (this.buildConfig.namespaceStrategy == 'rules') {
            let path = uriToPath(uri);
            for (let namespace in this.buildConfig.namespaceRulesRegex) {
                let regex = this.buildConfig.namespaceRulesRegex[namespace]
                if (path.match(regex)) {
                    return namespace;
                }
            }
        }
        else if (this.buildConfig.namespaceStrategy == "followFolders" || this.buildConfig.namespaceStrategy == "followFoldersCamelCase") {
            let path = uriToPath(uri);
            let splittedPath = path.split("/");
            splittedPath.pop();
            if (removeParentFolder) {
                splittedPath.pop();
            }
            path = splittedPath.join("/") + "/";
            let namespaceTxt = path.replace(this.buildConfig.namespaceRoot, "").replace(/\//g, '.');
            if (namespaceTxt.endsWith(".")) {
                namespaceTxt = namespaceTxt.slice(0, -1);
            }
            if (namespaceTxt.startsWith(".")) {
                namespaceTxt = namespaceTxt.slice(1);
            }
            if (namespaceTxt.includes(":")) {
                // TODO add error
                return "";
            }
            if (this.buildConfig.namespaceStrategy == "followFoldersCamelCase") {
                return namespaceTxt.toLowerCase().replace(/(([-_\.]|^)[a-z])/g, (group) =>
                    group
                        .toUpperCase()
                        .replace('-', '')
                        .replace('_', '')
                );
            }
            return namespaceTxt;
        }

        return "";
    }

    public addNamespace(_namespace: string) {
        if (!this.namespaces.includes(_namespace)) {
            const splitted = _namespace.split(".");
            let current = "";
            for (let split of splitted) {
                current += split;

                if (!this.namespaces.includes(current)) {
                    this.namespaces.push(current);
                }

                current += "."
            }
        }
    }

    public async onRename(changes: { oldUri: string, newUri: string }[]): Promise<{ [uri: string]: TextEdit[] }> {
        for (let change of changes) {
            if (change.oldUri.endsWith(AventusExtension.Component) ||
                change.oldUri.endsWith(AventusExtension.ComponentLogic) ||
                change.oldUri.endsWith(AventusExtension.Data) ||
                change.oldUri.endsWith(AventusExtension.Lib) ||
                change.oldUri.endsWith(AventusExtension.RAM)
            ) {
                return await this.tsLanguageService.onRenameFile(change.oldUri, change.newUri);
            }
        }
        return {};
    }

    public destroy() {
        FilesManager.getInstance().removeOnNewFile(this.onNewFileUUID);
        for (let uri in this.scssFiles) {
            this.scssFiles[uri].removeEvents();
            this.scssFiles[uri].file.removeOnDelete(this.onFileDeleteUUIDs[uri]);
        }
        for (let uri in this.htmlFiles) {
            this.htmlFiles[uri].removeEvents();
            this.htmlFiles[uri].file.removeOnDelete(this.onFileDeleteUUIDs[uri]);
        }
        for (let uri in this.tsFiles) {
            this.tsFiles[uri].removeEvents();
            this.tsFiles[uri].file.removeOnDelete(this.onFileDeleteUUIDs[uri]);
        }
        UnregisterBuild.send(this.project.getConfigFile().path, this.buildConfig.fullname);
    }

}

class ExternalPackageInformation {
    private files: { [uri: string]: AventusPackageFile } = {};
    private informations: { [fullname: string]: { content: AventusPackageTsFileExport | 'noCode', uri: string } } = {};
    private informationsRequired: { [uri: string]: AventusPackageTsFileExport[] } = {};
    private webComponentByName: { [name: string]: ClassInfo } = {}

    public init(files: AventusPackageFile[]) {
        for (let file of files) {
            this.files[file.file.uri] = file;
        }
        this.rebuild();
    }

    public getByFullName(fullName: string) {
        return this.informations[fullName];
    }
    public getNamespaceByUri(uri: string) {
        return this.files[uri].srcInfo.namespace;
    }
    public getInformationsRequired(uri: string) {
        return this.informationsRequired[uri];
    }
    public getFullInformations(uri: string): AventusPackageTsFileExport[] {
        return this.files[uri]?.srcInfo.available || []
    }

    public getStyleByUri(uri: string): { [name: string]: string } {
        if (this.files[uri]) {
            return this.files[uri].externalCSS;
        }
        return {};
    }

    public rebuild() {
        this.informations = {};
        this.webComponentByName = {};
        let errors: Diagnostic[] = [];
        for (let uri in this.files) {
            let defFile = this.files[uri];
            this.informationsRequired[uri] = [];
            for (let available of defFile.srcInfo.available) {
                if (available.required) {
                    this.informationsRequired[uri].push(available);
                }
                if (available.fullName) {
                    if (!this.informations[available.fullName]) {
                        this.informations[available.fullName] = {
                            content: available,
                            uri: uri
                        }
                    }
                    else if (this.informations[available.fullName].uri != uri) {
                        errors.push({
                            range: {
                                start: { line: 0, character: 0 },
                                end: { line: 0, character: 0 }
                            },
                            severity: DiagnosticSeverity.Error,
                            source: AventusLanguageId.TypeScript,
                            message: "The name " + available.fullName + " exist inside " + uri + " and " + this.informations[available.fullName].uri
                        })
                    }
                }
            }

            for (let existing of defFile.srcInfo.existing) {
                if (existing.fullName) {
                    if (!this.informations[existing.fullName]) {
                        this.informations[existing.fullName] = {
                            content: 'noCode',
                            uri: uri
                        }
                    }
                    else if (this.informations[existing.fullName].uri != uri) {
                        errors.push({
                            range: {
                                start: { line: 0, character: 0 },
                                end: { line: 0, character: 0 }
                            },
                            severity: DiagnosticSeverity.Error,
                            source: AventusLanguageId.TypeScript,
                            message: "The name " + existing.fullName + " exist inside " + uri + " and " + this.informations[existing.fullName].uri
                        })
                    }
                }
            }

            this.webComponentByName = {
                ...this.webComponentByName,
                ...defFile.classInfoByName
            }
        }
        GenericServer.sendDiagnostics({ uri: '@Import lib', diagnostics: errors })
    }

    public getExternalWebComponentDefinition(className: string): ClassInfo | undefined {
        return this.webComponentByName[className];
    }
    public getExternalWebComponentDefinitionFile(className: string): AventusPackageFile | undefined {
        let definition = this.webComponentByName[className];
        if (definition) {
            let uri = definition.fileUri;
            let tsDefFile = this.files[uri];
            if (tsDefFile) {
                return tsDefFile;
            }
        }
        return undefined;
    }
}