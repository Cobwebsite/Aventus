import { join, normalize, sep } from "path";
import { ASTNode, Diagnostic, getLanguageService, LanguageService } from "vscode-json-languageservice";
import { CompletionItem, CompletionList, DiagnosticSeverity, FormattingOptions, Hover, Position, Range, TextEdit } from 'vscode-languageserver';
import { AventusErrorCode, AventusExtension } from "../../definition";
import { AventusFile } from '../../files/AventusFile';
import { createErrorTs, escapeRegex, getFolder, uriToPath } from "../../tools";
import { AventusConfig, AventusConfigBuild, AventusConfigBuildCompile, AventusConfigBuildDependance, AventusConfigBuildStories, AventusConfigStatic } from "./definition";
import { AventusConfigSchema, AventusPhpSchema, AventusSharpSchema } from "./schema";
import { env } from 'process';
import { GenericServer } from '../../GenericServer';
import { SettingsManager } from '../../settings/Settings';

export class AventusJSONLanguageService {
    private static instance: AventusJSONLanguageService;
    public static getInstance(): AventusJSONLanguageService {
        if (!this.instance) {
            this.instance = new AventusJSONLanguageService();
        }
        return this.instance;
    }

    private languageService: LanguageService;

    private constructor() {
        this.languageService = getLanguageService({
            schemaRequestService: async (uri) => {
                return JSON.stringify(AventusConfigSchema);
            }
        });
        this.languageService.configure({
            allowComments: true,
            schemas: [
                {
                    fileMatch: ["**" + AventusExtension.Config],
                    uri: AventusConfigSchema.$schema ?? '',
                    schema: AventusConfigSchema
                },
                {
                    fileMatch: ["**" + AventusExtension.CsharpConfig],
                    uri: AventusSharpSchema.$schema ?? '',
                    schema: AventusSharpSchema
                },
                {
                    fileMatch: ["**" + AventusExtension.PhpConfig],
                    uri: AventusPhpSchema.$schema ?? '',
                    schema: AventusPhpSchema
                }
            ]
        });
    }



    public async format(file: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        let document = file.documentUser;
        return await this.languageService.format(document, range, options);
    }
    public async doComplete(file: AventusFile, position: Position): Promise<CompletionList> {
        let document = file.documentUser;
        let jsonDoc = this.languageService.parseJSONDocument(document);
        let result = await this.languageService.doComplete(file.documentUser, position, jsonDoc);
        const node = jsonDoc.getNodeFromOffset(document.offsetAt(position));

        if (this.isKeyOfObject(node, "dependances")) {
            if (!result) {
                result = {
                    isIncomplete: false,
                    items: []
                }
            }
            result?.items.push({
                label: "Aventus@Main",
            }, {
                label: "Aventus@UI"
            }, {
                label: "Aventus@I18n"
            }, {
                label: "Aventus@Sharp"
            }, {
                label: "Aventus@Php"
            });
        }

        if (result) {
            return result;
        }
        return {
            isIncomplete: false,
            items: []
        }
    }
    public async doResolve(item: CompletionItem): Promise<CompletionItem> {
        return await this.languageService.doResolve(item);
    }
    public async doHover(file: AventusFile, position: Position): Promise<Hover | null> {
        let document = file.documentUser;
        let jsonDoc = this.languageService.parseJSONDocument(document);
        return await this.languageService.doHover(document, position, jsonDoc);
    }
    public async validate(file: AventusFile): Promise<Diagnostic[]> {
        let document = file.documentUser;
        let jsonDoc = this.languageService.parseJSONDocument(document);
        let errors = await this.languageService.doValidation(document, jsonDoc);
        if (errors.length == 0) {
            let configTxt = this.removeComments(document.getText());
            try {
                JSON.parse(configTxt);
                return errors;
            }
            catch (e) {
                errors.push(createErrorTs(document, "Can't parse the json", AventusErrorCode.ConfigJsonError))
            }
        }
        for (let error of errors) {
            error.severity = DiagnosticSeverity.Error;
        }
        return errors;
    }

    private isKeyOfObject(node: ASTNode | undefined, objectName: string): boolean {
        const p1 = node?.parent;
        if (p1?.type == "property" && p1.keyNode == node) {
            const pDep = node?.parent?.parent?.parent;
            if (pDep?.type == "property" && pDep.keyNode.value == objectName) {
                return true;
            }
        }
        return false;
    }
    private isValueOfObject(node: ASTNode | undefined, objectName: string): boolean {
        const p1 = node?.parent;
        if (p1?.type == "property" && p1.valueNode == node) {
            const pDep = node?.parent?.parent?.parent;
            if (pDep?.type == "property" && pDep.keyNode.value == objectName) {
                return true;
            }
        }
        return false;
    }

    //#region config
    public async getConfig(file: AventusFile): Promise<AventusConfig | null> {
        let document = file.documentUser;
        let jsonDoc = this.languageService.parseJSONDocument(document);
        let errors = await this.languageService.doValidation(document, jsonDoc, undefined, AventusConfigSchema);
        if (errors.length == 0) {
            let configTxt = this.removeComments(document.getText());
            try {
                let resultConfig: AventusConfig = JSON.parse(configTxt);
                resultConfig = this.prepareConfigFile(document.uri, resultConfig);
                return resultConfig;
            }
            catch (e) {
                errors.push(createErrorTs(document, "Can't parse the json", AventusErrorCode.ConfigJsonError))
            }
        }
        return null;
    }

    private prepareConfigFile(uri: string, config: AventusConfig): AventusConfig {
        config = {
            ...this.defaultConfigValue(),
            ...config
        };
        if (config.componentPrefix == "") {
            let splittedName = config.module.match(/([A-Z][a-z]*)|([0-9][a-z]*)/g);
            if (splittedName) {
                config.componentPrefix = splittedName.join("-").toLowerCase()
            }
            else {
                config.componentPrefix = 'av';
            }
        }
        let builds: AventusConfigBuild[] = [];
        for (let build of config.build) {
            builds.push(this.prepareBuild(uri, build, config));
        }
        config.build = builds;
        if (config.static) {
            let statics: AventusConfigStatic[] = []
            for (let _static of config.static) {
                statics.push(this.prepareStatic(uri, _static));
            }
            config.static = statics;
        }
        return config;
    }
    private replaceEnvVar(txt: string, baseDir: string): string {
        if (!txt) return txt;
        if (txt.startsWith("@")) return txt;
        if (txt.startsWith("Aventus@")) return txt;

        let regexEnvVar = /%(.*?)%/gm;
        let result: RegExpExecArray | null;
        while (result = regexEnvVar.exec(txt)) {
            let varName = result[1];
            let varValue = env[varName] ?? 'undefined';
            txt = txt.replace(result[0], varValue);
        }
        if (/^https?:\/\/.*/.exec(txt)) {
            return txt;
        }
        let windowDisk = /^[a-zA-Z]:/gm
        if (!txt.startsWith("/") && !windowDisk.test(txt)) {
            txt = "/" + txt;
            txt = normalize(uriToPath(baseDir) + txt);
        }
        else {
            txt = normalize(txt);
        }
        return txt;
    }
    private prepareBuild(configUri: string, build: AventusConfigBuild, config: AventusConfig): AventusConfigBuild {
        let baseDir = getFolder(configUri);
        build = {
            ...this.defaultConfigBuildValue(config),
            ...build
        }
        if (build.name) {
            build.fullname = build.module + "@" + build.name;
        }
        else {
            build.fullname = build.module;
        }

        const replaceEnvVar = (txt: string): string => {
            return this.replaceEnvVar(txt, baseDir);
        }

        let compiles = build.compile as Partial<AventusConfigBuildCompile>[];
        // compile
        for (let compile of compiles) {
            // input
            if (!compile.input) {
                compile.inputPathRegex = new RegExp(".*");
            }
            else {

                if (!Array.isArray(compile.input)) {
                    compile.input = [compile.input];
                }
                let regexs: string[] = [];
                for (let inputPath of compile.input) {
                    let slash = "";
                    inputPath = inputPath.replace(/\\/g, '/');
                    if (!inputPath.startsWith("/")) {
                        slash = "/";
                    }
                    let splitedInput = inputPath.split("/");
                    if (splitedInput[splitedInput.length - 1] == "" || splitedInput[splitedInput.length - 1] == "*") {
                        splitedInput[splitedInput.length - 1] = "*"
                    }
                    else if (splitedInput[splitedInput.length - 1].indexOf(".") == -1) {
                        // its a folder but without end slash
                        splitedInput.push("*");
                    }
                    inputPath = splitedInput.join("/");
                    let regTemp = normalize(uriToPath(baseDir) + slash + inputPath).replace(/\\/g, '/');
                    regTemp = escapeRegex(regTemp, true).replace("*", ".*");
                    regexs.push("(^" + regTemp + "$)");
                }
                let regexJoin = regexs.join("|");
                if (regexJoin == "") {
                    regexJoin = "(?!)";
                }
                compile.inputPathRegex = new RegExp(regexJoin);
            }

            // output
            if (!compile.output) {
                compile.output = [];
            }
            else {
                if (!Array.isArray(compile.output)) {
                    compile.output = [compile.output];
                }
                for (let i = 0; i < compile.output.length; i++) {
                    compile.output[i] = compile.output[i].trim();
                    if (compile.output[i].length > 0) {
                        compile.output[i] = replaceEnvVar(compile.output[i]);
                    }
                }
            }

            // output npm
            if (!compile.outputNpm) {
                compile.outputNpm = {
                    path: [],
                    packageJson: false,
                    npmName: '',
                    live: false,
                };
            }
            else {
                if (typeof compile.outputNpm == "string") {
                    compile.outputNpm = {
                        path: [compile.outputNpm],
                        packageJson: true,
                        npmName: '',
                        manifest: {},
                        live: false,
                    };
                }
                else if (Array.isArray(compile.outputNpm)) {
                    compile.outputNpm = {
                        path: compile.outputNpm,
                        packageJson: true,
                        npmName: '',
                        manifest: {},
                        live: false,
                    };
                }

                if (!Array.isArray(compile.outputNpm.path)) {
                    compile.outputNpm.path = [compile.outputNpm.path];
                }

                if (compile.outputNpm.packageJson === undefined) {
                    compile.outputNpm.packageJson = true;
                }
                if (compile.outputNpm.manifest === undefined) {
                    compile.outputNpm.manifest = {};
                }
                if (compile.outputNpm.npmName === undefined) {
                    compile.outputNpm.npmName = '';
                }
                if (compile.outputNpm.live === undefined) {
                    compile.outputNpm.live = false;
                }


                for (let i = 0; i < compile.outputNpm.path.length; i++) {
                    let outputPath = replaceEnvVar(compile.outputNpm.path[i]);

                    if (outputPath.endsWith("*")) {
                        outputPath = outputPath.slice(0, -1);
                    }
                    if (outputPath.endsWith("/")) {
                        outputPath = outputPath.slice(0, -1);
                    }

                    outputPath = outputPath.replace(/\\/g, '/');
                    compile.outputNpm.path[i] = outputPath;
                }
            }

            // package
            if (!compile.package) {
                compile.package = [];
            }
            else {
                if (!Array.isArray(compile.package)) {
                    compile.package = [compile.package];
                }
                for (let i = 0; i < compile.package.length; i++) {
                    compile.package[i] = compile.package[i].trim();
                    if (compile.package[i].length > 0) {
                        compile.package[i] = replaceEnvVar(compile.package[i]);
                    }
                }
            }

            if (build.i18n) {
                if (!compile.i18n) {
                    compile.i18n = []
                    for (let output of compile.output) {
                        const splitted = output.split(sep);
                        splitted.pop();
                        const outputPath = splitted.join(sep);
                        const final = join(outputPath, "locales");
                        const root = normalize(uriToPath(GenericServer.getWorkspaceUri()));
                        let mount = final.replace(root, "").replace(/\\/g, "/");
                        if (mount.startsWith("/dist")) {
                            mount = mount.replace("/dist", "");
                        }
                        compile.i18n.push({
                            output: final,
                            mount: mount,
                            mode: 'singleFile',
                        });

                    }
                }
                else {
                    if (!Array.isArray(compile.i18n)) {
                        compile.i18n = [{
                            output: compile.i18n,
                            mount: '',
                            mode: 'singleFile'
                        }];
                    }
                    for (let i = 0; i < compile.i18n.length; i++) {
                        if (compile.i18n[i].output.endsWith("/")) {
                            compile.i18n[i].output = compile.i18n[i].output.slice(0, -1)
                        }
                        compile.i18n[i].output = compile.i18n[i].output.trim();
                        if (compile.i18n[i].output.length > 0) {
                            compile.i18n[i].output = replaceEnvVar(compile.i18n[i].output);
                        }

                        if (!compile.i18n[i].mount) {
                            const root = normalize(uriToPath(GenericServer.getWorkspaceUri()));
                            let mount = compile.i18n[i].output.replace(root, "").replace(/\\/g, "/");
                            if (mount.startsWith("/dist")) {
                                mount = mount.replace("/dist", "");
                            }
                            compile.i18n[i].mount = mount
                        }
                        if (compile.i18n[i].mount.endsWith("/")) {
                            compile.i18n[i].mount = compile.i18n[i].mount.slice(0, -1)
                        }
                    }
                }
            }
        }
        // src
        let regexsSrc: string[] = [];
        for (let srcPath of build.src) {
            let slash = "";
            srcPath = srcPath.replace(/\\/g, '/');
            if (!srcPath.startsWith("/")) {
                slash = "/";
            }
            let splitedInput = srcPath.split("/");
            if (splitedInput[splitedInput.length - 1] == "" || splitedInput[splitedInput.length - 1] == "*") {
                splitedInput[splitedInput.length - 1] = "*"
            }
            else if (splitedInput[splitedInput.length - 1].indexOf(".") == -1) {
                // its a folder but without end slash
                splitedInput.push("*");
            }
            srcPath = splitedInput.join("/");
            let regTemp = normalize(uriToPath(baseDir) + slash + srcPath).replace(/\\/g, '/');
            let srcPathSaved = regTemp.replace("*", "");
            if (srcPathSaved.endsWith("/")) {
                srcPathSaved = srcPathSaved.slice(0, -1)
            }
            build.srcPath.push(srcPathSaved);
            regTemp = escapeRegex(regTemp, true).replace("*", ".*");
            regexsSrc.push("(^" + regTemp + "$)");
        }
        // stories
        if (build.stories) {
            build.stories = {
                ...this.defaultConfigBuildStories(baseDir, config),
                ...build.stories
            }
            let outputPath = replaceEnvVar(build.stories.output);

            if (outputPath.endsWith("*")) {
                outputPath = outputPath.slice(0, -1);
            }
            if (outputPath.endsWith("/")) {
                outputPath = outputPath.slice(0, -1);
            }

            outputPath = outputPath.replace(/\\/g, '/');
            build.stories.output = outputPath;
        }

        let regexSrcJoin = regexsSrc.join("|");
        if (regexSrcJoin == "") {
            regexSrcJoin = "(?!)";
        }
        build.srcPathRegex = new RegExp(regexSrcJoin);



        // node_modules
        build.nodeModulesDir = build.nodeModulesDir.trim();

        if (build.nodeModulesDir == "") {
            build.nodeModulesDir = normalize(uriToPath(baseDir) + "/node_modules");
        }
        else {
            build.nodeModulesDir = replaceEnvVar(build.nodeModulesDir);
        }

        // dependances
        let mergeDependances: { [name: string]: AventusConfigBuildDependance } = {};
        build.rawDependances = JSON.parse(JSON.stringify(build.dependances));
        for (let name in build.dependances) {
            let dependance = build.dependances[name];
            if (typeof dependance == "string") {
                dependance = {
                    version: dependance
                }
            }
            mergeDependances[name] = {
                ...this.defaultConfigBuildDependanceValue(dependance),
                ...dependance
            }
            const lastDep = mergeDependances[name];
            if (!lastDep.subDependancesInclude) {
                lastDep.subDependancesInclude = {};
            }
            if (!lastDep.subDependancesInclude["*"]) {
                lastDep.subDependancesInclude["*"] = dependance.include ?? 'need';
            }
            if (lastDep.uri)
                lastDep.uri = replaceEnvVar(lastDep.uri);
        }
        build.dependances = mergeDependances;

        // no namespace
        if (build.outsideModule) {
            let regexsOutside: string[] = [];
            for (let noNamespacePath of build.outsideModule) {
                let slash = "";
                noNamespacePath = noNamespacePath.replace(/\\/g, '/');
                if (!noNamespacePath.startsWith("/")) {
                    slash = "/";
                }
                let splitedInput = noNamespacePath.split("/");
                if (splitedInput[splitedInput.length - 1] == "" || splitedInput[splitedInput.length - 1] == "*") {
                    splitedInput[splitedInput.length - 1] = "*"
                }
                else if (splitedInput[splitedInput.length - 1].indexOf(".") == -1) {
                    // its a folder but without end slash
                    splitedInput.push("*");
                }
                noNamespacePath = splitedInput.join("/");
                let regTemp = normalize(uriToPath(baseDir) + slash + noNamespacePath).replace(/\\/g, '/');
                regTemp = escapeRegex(regTemp, true).replace("*", ".*");
                regexsOutside.push("(^" + regTemp + "$)");
            }
            let regexOutsideJoin = regexsOutside.join("|");
            if (regexOutsideJoin == "") {
                regexOutsideJoin = "(?!)";
            }
            build.outsideModulePathRegex = new RegExp(regexOutsideJoin);
        }

        // namespace rules
        if (build.namespaceStrategy == "rules") {

            for (let namespace in build.namespaceRules) {
                let regexsRules: string[] = [];
                let rules = build.namespaceRules[namespace];
                for (let rule of rules) {
                    let slash = "";
                    rule = rule.replace(/\\/g, '/');
                    if (!rule.startsWith("/")) {
                        slash = "/";
                    }
                    let splitedInput = rule.split("/");
                    if (splitedInput[splitedInput.length - 1] == "" || splitedInput[splitedInput.length - 1] == "*") {
                        splitedInput[splitedInput.length - 1] = "*"
                    }
                    else if (splitedInput[splitedInput.length - 1].indexOf(".") == -1) {
                        // its a folder but without end slash
                        splitedInput.push("*");
                    }
                    rule = splitedInput.join("/");
                    let regTemp = normalize(uriToPath(baseDir) + slash + rule).replace(/\\/g, '/');
                    regTemp = escapeRegex(regTemp, true).replace("*", ".*");
                    regexsRules.push("(^" + regTemp + "$)");
                }
                let regexRulesJoin = regexsRules.join("|");
                if (regexRulesJoin == "") {
                    regexRulesJoin = "(?!)";
                }
                build.namespaceRulesRegex[namespace] = new RegExp(regexRulesJoin);
            }
        }
        else if (build.namespaceStrategy == "followFolders" || build.namespaceStrategy == "followFoldersCamelCase") {
            let slash = "";
            if (!build.namespaceRoot.startsWith("/")) {
                slash = "/";
            }
            build.namespaceRoot = normalize(uriToPath(baseDir) + slash + build.namespaceRoot).replace(/\\/g, '/');
        }

        // i18n
        if (build.i18n) {

        }

        return build;
    }

    private prepareStatic(configUri: string, _static: AventusConfigStatic): AventusConfigStatic {
        let baseDir = getFolder(configUri);
        let slash = "";
        if (!_static.input.startsWith("/")) {
            slash = "/";
        }
        if (_static.input.endsWith("*")) {
            _static.input = _static.input.slice(0, -1);
        }
        if (_static.input.endsWith("/")) {
            _static.input = _static.input.slice(0, -1);
        }
        _static.inputPathFolder = normalize(uriToPath(baseDir) + slash + _static.input);
        _static.inputPathFolder = _static.inputPathFolder.replace(/\\/g, '/')

        slash = "";
        if (!Array.isArray(_static.output)) {
            _static.output = [_static.output];
        }
        _static.outputPathFolder = [];

        for (let outputPath of _static.output) {
            outputPath = this.replaceEnvVar(outputPath, baseDir);
            if (outputPath.endsWith("*")) {
                outputPath = outputPath.slice(0, -1);
            }
            if (outputPath.endsWith("/")) {
                outputPath = outputPath.slice(0, -1);
            }

            outputPath = outputPath.replace(/\\/g, '/');
            _static.outputPathFolder.push(outputPath);
        }

        return _static;
    }

    private defaultConfigValue(): AventusConfig {
        return {
            module: '',
            hideWarnings: SettingsManager.getInstance().settings.defaultHideWarnings,
            version: '1.0.0',
            componentPrefix: '',
            tags: [],
            dependances: {},
            build: [],
            static: [],
            avoidParsingInsideTags: [],
            aliases: {},
            namespaceRules: {},
            namespaceRulesRegex: {},
            namespaceStrategy: 'manual',
            namespaceRoot: './'
        }
    }
    private defaultConfigBuildValue(config: AventusConfig): AventusConfigBuild {
        return {
            fullname: '',
            name: '',
            tags: config.tags,
            version: config.version,
            organization: config.organization,
            description: config.description,
            readme: config.readme,
            disabled: false,
            hideWarnings: config.hideWarnings,
            src: [],
            srcPath: [],
            stories: undefined,
            compile: [],
            srcPathRegex: new RegExp('(?!)'),
            outsideModule: [],
            outsideModulePathRegex: new RegExp('(?!)'),
            module: config.module,
            componentPrefix: config.componentPrefix,
            namespaceStrategy: config.namespaceStrategy,
            namespaceRules: { ...config.namespaceRules },
            namespaceRulesRegex: { ...config.namespaceRulesRegex },
            namespaceRoot: config.namespaceRoot,
            dependances: { ...config.dependances },
            rawDependances: {},
            avoidParsingInsideTags: [...config.avoidParsingInsideTags],
            nodeModulesDir: ''
        }
    }

    private defaultConfigBuildStories(baseDir: string, config: AventusConfig): AventusConfigBuildStories {

        return {
            output: baseDir + "/stories",
            format: 'all',
        }
    }

    private defaultConfigBuildDependanceValue(dependance: AventusConfigBuildDependance): AventusConfigBuildDependance {
        return {}
    }
    //#endregion


    private removeComments(txt: string): string {
        let regex = /(\".*?\"|\'.*?\')|(\/\*.*?\*\/|\/\/[^(\r\n|\n)]*$)/gm
        txt = txt.replace(regex, (match, grp1, grp2) => {
            if (grp2) {
                let result = "";
                for (let i = 0; i < grp2.length; i++) {
                    result += " "
                }
                return result;
            }
            return grp1;
        })
        return txt;
    }
}