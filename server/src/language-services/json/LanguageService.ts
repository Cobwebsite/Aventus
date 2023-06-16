import { normalize } from "path";
import { Diagnostic, getLanguageService, JSONSchema, LanguageService } from "vscode-json-languageservice";
import { CompletionItem, CompletionList, DiagnosticSeverity, FormattingOptions, Hover, Position, Range, TextEdit } from 'vscode-languageserver';
import { AventusErrorCode, AventusExtension } from "../../definition";
import { AventusFile } from '../../files/AventusFile';
import { createErrorTs, getFolder, uriToPath } from "../../tools";
import { AventusConfig, AventusConfigBuild, AventusConfigBuildDependance, AventusConfigStatic } from "./definition";
import { AventusConfigSchema, AventusTemplateSchema } from "./schema";
import { TextDocument } from 'vscode-languageserver-textdocument';

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
                    fileMatch: ["**" + AventusExtension.Template],
                    uri: AventusTemplateSchema.$schema ?? '',
                    schema: AventusTemplateSchema
                }
            ]
        });
    }



    public async format(file: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        let document = file.document;
        return await this.languageService.format(document, range, options);
    }
    public async doComplete(file: AventusFile, position: Position): Promise<CompletionList> {
        let document = file.document;
        let jsonDoc = this.languageService.parseJSONDocument(document);
        let result = await this.languageService.doComplete(file.document, position, jsonDoc);
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
        let document = file.document;
        let jsonDoc = this.languageService.parseJSONDocument(document);
        return await this.languageService.doHover(document, position, jsonDoc);
    }
    public async validate(file: AventusFile): Promise<Diagnostic[]> {
        let document = file.document;
        let jsonDoc = this.languageService.parseJSONDocument(document);
        let errors = await this.languageService.doValidation(document, jsonDoc);
        if (errors.length == 0) {
            let configTxt = document.getText();
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

    //#region config
    public async getConfig(file: AventusFile): Promise<AventusConfig | null> {
        let document = file.document;
        let jsonDoc = this.languageService.parseJSONDocument(document);
        let errors = await this.languageService.doValidation(document, jsonDoc, undefined, AventusConfigSchema);
        if (errors.length == 0) {
            let configTxt = document.getText();
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
    private prepareBuild(configUri: string, build: AventusConfigBuild, config: AventusConfig): AventusConfigBuild {
        let baseDir = getFolder(configUri);
        let regexs: string[] = [];
        build = {
            ...this.defaultConfigBuildValue(config),
            ...build
        }
        build.fullname = build.module + "@" + build.name;

        // input
        for (let inputPath of build.inputPath) {
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
            let regTemp = normalize(uriToPath(baseDir) + slash + inputPath).replace(/\\/g, '\\/').replace("*", ".*");
            regexs.push("(^" + regTemp + "$)");
        }
        let regexJoin = regexs.join("|");
        if (regexJoin == "") {
            regexJoin = "(?!)";
        }
        build.inputPathRegex = new RegExp(regexJoin);

        // output
        build.outputFile = build.outputFile.trim();
        if (build.outputFile.length > 0) {
            if (!build.outputFile.startsWith("/")) {
                build.outputFile = "/" + build.outputFile;
            }
            build.outputFile = normalize(uriToPath(baseDir) + build.outputFile);
        }

        build.outputPackage = build.outputPackage.trim();
        if (build.outputPackage.length > 0) {
            if (!build.outputPackage.startsWith("/")) {
                build.outputPackage = "/" + build.outputPackage;
            }
            build.outputPackage = normalize(uriToPath(baseDir) + build.outputPackage);
        }

        // component style
        for (let styleInfo of build.componentStyle) {
            if (styleInfo.path.length > 0) {
                if (!styleInfo.path.startsWith("/")) {
                    styleInfo.path = "/" + styleInfo.path;
                }
                styleInfo.path = normalize(uriToPath(baseDir) + styleInfo.path);
            }
            if (styleInfo.outputFile && styleInfo.outputFile.length > 0) {
                if (!styleInfo.outputFile.startsWith("/")) {
                    styleInfo.outputFile = "/" + styleInfo.outputFile;
                }
                styleInfo.outputFile = normalize(uriToPath(baseDir) + styleInfo.outputFile);
            }
        }

        // dependances
        let mergeDependances: AventusConfigBuildDependance[] = [];
        for (let dependance of build.dependances) {
            mergeDependances.push({
                ...this.defaultConfigBuildDependanceValue(dependance),
                ...dependance
            })
            if (!mergeDependances[mergeDependances.length - 1].subDependancesInclude["*"]) {
                mergeDependances[mergeDependances.length - 1].subDependancesInclude["*"] = "need";
            }
        }
        build.dependances = mergeDependances;

        // no namespace
        if (build.outsideModulePath) {
            regexs = [];
            for (let noNamespacePath of build.outsideModulePath) {
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
                let regTemp = normalize(uriToPath(baseDir) + slash + noNamespacePath).replace(/\\/g, '\\/').replace("*", ".*");
                regexs.push("(^" + regTemp + "$)");
            }
            regexJoin = regexs.join("|");
            if (regexJoin == "") {
                regexJoin = "(?!)";
            }
            build.outsideModulePathRegex = new RegExp(regexJoin);
        }

        // namespace rules
        if (build.namespaceStrategy == "rules") {

            for (let namespace in build.namespaceRules) {
                regexs = [];
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
                    let regTemp = normalize(uriToPath(baseDir) + slash + rule).replace(/\\/g, '\\/').replace("*", ".*");
                    regexs.push("(^" + regTemp + "$)");
                }
                regexJoin = regexs.join("|");
                if (regexJoin == "") {
                    regexJoin = "(?!)";
                }
                build.namespaceRulesRegex[namespace] = new RegExp(regexJoin);
            }
        }
        else if (build.namespaceStrategy == "followFolders") {
            let slash = "";
            if (!build.namespaceRoot.startsWith("/")) {
                slash = "/";
            }
            build.namespaceRoot = normalize(uriToPath(baseDir) + slash + build.namespaceRoot).replace(/\\/g, '/');
        }
        return build;
    }

    private prepareStatic(configUri: string, _static: AventusConfigStatic): AventusConfigStatic {
        let baseDir = getFolder(configUri);
        let slash = "";
        if (!_static.inputPath.startsWith("/")) {
            slash = "/";
        }
        if (_static.inputPath.endsWith("*")) {
            _static.inputPath = _static.inputPath.slice(0, -1);
        }
        if (_static.inputPath.endsWith("/")) {
            _static.inputPath = _static.inputPath.slice(0, -1);
        }
        _static.inputPathFolder = normalize(uriToPath(baseDir) + slash + _static.inputPath);
        _static.inputPathFolder = _static.inputPathFolder.replace(/\\/g, '/')

        slash = "";
        if (!_static.outputPath.startsWith("/")) {
            slash = "/";
        }
        if (_static.outputPath.endsWith("*")) {
            _static.outputPath = _static.outputPath.slice(0, -1);
        }
        if (_static.outputPath.endsWith("/")) {
            _static.outputPath = _static.outputPath.slice(0, -1);
        }
        _static.outputPathFolder = normalize(uriToPath(baseDir) + slash + _static.outputPath);
        _static.outputPathFolder = _static.outputPathFolder.replace(/\\/g, '/');
        return _static;
    }

    private defaultConfigValue(): AventusConfig {
        return {
            module: '',
            hideWarnings: false,
            version: '1.0.0',
            componentPrefix: 'av',
            build: [],
            static: [],
            avoidParsingInsideTags: [],
        }
    }
    private defaultConfigBuildValue(config: AventusConfig): AventusConfigBuild {
        return {
            fullname: '',
            name: '',
            version: config.version,
            hideWarnings: config.hideWarnings,
            inputPath: [],
            inputPathRegex: new RegExp('(?!)'),
            outsideModulePath: [],
            outsideModulePathRegex: new RegExp('(?!)'),
            outputFile: '',
            outputPackage: '',
            module: config.module,
            componentPrefix: config.componentPrefix,
            namespaceStrategy: 'manual',
            namespaceRules: {},
            namespaceRulesRegex: {},
            namespaceRoot: './',
            dependances: [],
            avoidParsingInsideTags: [...config.avoidParsingInsideTags],
            componentStyle: []
        }
    }

    private defaultConfigBuildDependanceValue(dependance: AventusConfigBuildDependance): AventusConfigBuildDependance {
        return {
            include: 'need',
            subDependancesInclude: {},
            version: 'x.x.x',
            uri: ''
        }
    }
    //#endregion

}