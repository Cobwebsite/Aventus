import { normalize } from "path";
import { Diagnostic, getLanguageService, JSONSchema, LanguageService } from "vscode-json-languageservice";
import { CompletionItem, CompletionList, DiagnosticSeverity, FormattingOptions, Hover, Position, Range, TextEdit } from 'vscode-languageserver';
import { AventusErrorCode, AventusExtension } from "../../definition";
import { AventusFile } from '../../files/AventusFile';
import { createErrorTs, escapeRegex, getFolder, uriToPath } from "../../tools";
import { AventusConfig, AventusConfigBuild, AventusConfigBuildCompile, AventusConfigBuildDependance, AventusConfigBuildStories, AventusConfigStatic } from "./definition";
import { AventusConfigSchema, AventusSharpSchema, AventusTemplateSchema } from "./schema";
import { TextDocument } from 'vscode-languageserver-textdocument';
import { env } from 'process';

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
                },
                {
                    fileMatch: ["**" + AventusExtension.CsharpConfig],
                    uri: AventusSharpSchema.$schema ?? '',
                    schema: AventusSharpSchema
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
    private prepareBuild(configUri: string, build: AventusConfigBuild, config: AventusConfig): AventusConfigBuild {
        let baseDir = getFolder(configUri);
        build = {
            ...this.defaultConfigBuildValue(config),
            ...build
        }
        build.fullname = build.module + "@" + build.name;

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
                        let regexEnvVar = /%(.*?)%/gm;
                        let result: RegExpExecArray | null;
                        while (result = regexEnvVar.exec(compile.output[i])) {
                            let varName = result[1];
                            let varValue = env[varName] ?? 'undefined';
                            compile.output[i] = compile.output[i].replace(result[0], varValue);
                        }
                        let windowDisk = /^[a-zA-Z]:/gm
                        if (!compile.output[i].startsWith("/") && !windowDisk.test(compile.output[i])) {
                            compile.output[i] = "/" + compile.output[i];
                            compile.output[i] = normalize(uriToPath(baseDir) + compile.output[i]);
                        }
                        else {
                            compile.output[i] = normalize(compile.output[i]);
                        }
                    }
                }
            }

            // output npm
            if (!compile.outputNpm) {
                compile.outputNpm = {
                    path: [],
                    packageJson: false
                };
            }
            else {
                if (typeof compile.outputNpm == "string") {
                    compile.outputNpm = {
                        path: [compile.outputNpm],
                        packageJson: true
                    };
                }
                else if (Array.isArray(compile.outputNpm)) {
                    compile.outputNpm = {
                        path: compile.outputNpm,
                        packageJson: true
                    };
                }

                if (!Array.isArray(compile.outputNpm.path)) {
                    compile.outputNpm.path = [compile.outputNpm.path];
                }

                if (compile.outputNpm.packageJson === undefined) {
                    compile.outputNpm.packageJson = true;
                }


                for (let i = 0; i < compile.outputNpm.path.length; i++) {
                    let outputPath = compile.outputNpm.path[i];
                    let regexEnvVar = /%(.*?)%/gm;
                    let result: RegExpExecArray | null;
                    while (result = regexEnvVar.exec(outputPath)) {
                        let varName = result[1];
                        let varValue = env[varName] ?? 'undefined';
                        outputPath = outputPath.replace(result[0], varValue);
                    }

                    if (outputPath.endsWith("*")) {
                        outputPath = outputPath.slice(0, -1);
                    }
                    if (outputPath.endsWith("/")) {
                        outputPath = outputPath.slice(0, -1);
                    }
                    let windowDisk = /^[a-zA-Z]:/gm
                    if (!outputPath.startsWith("/") && !windowDisk.test(outputPath)) {
                        outputPath = "/" + outputPath;
                        outputPath = normalize(uriToPath(baseDir) + outputPath);
                    }
                    else {
                        outputPath = normalize(outputPath);
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
                        let regexEnvVar = /%(.*?)%/gm;
                        let result: RegExpExecArray | null;
                        while (result = regexEnvVar.exec(compile.package[i])) {
                            let varName = result[1];
                            let varValue = env[varName] ?? 'undefined';
                            compile.package[i] = compile.package[i].replace(result[0], varValue);
                        }
                        let windowDisk = /^[a-zA-Z]:/gm
                        if (!compile.package[i].startsWith("/") && !windowDisk.test(compile.package[i])) {
                            compile.package[i] = "/" + compile.package[i];
                            compile.package[i] = normalize(uriToPath(baseDir) + compile.package[i]);
                        }
                        else {
                            compile.package[i] = normalize(compile.package[i]);
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
            regTemp = escapeRegex(regTemp, true).replace("*", ".*");
            regexsSrc.push("(^" + regTemp + "$)");
        }
        // stories
        if (build.stories) {
            build.stories = {
                ...this.defaultConfigBuildStories(baseDir, config),
                ...build.stories
            }
            let outputPath = build.stories.output;
            let regexEnvVar = /%(.*?)%/gm;
            let result: RegExpExecArray | null;
            while (result = regexEnvVar.exec(outputPath)) {
                let varName = result[1];
                let varValue = env[varName] ?? 'undefined';
                outputPath = outputPath.replace(result[0], varValue);
            }

            if (outputPath.endsWith("*")) {
                outputPath = outputPath.slice(0, -1);
            }
            if (outputPath.endsWith("/")) {
                outputPath = outputPath.slice(0, -1);
            }
            let windowDisk = /^[a-zA-Z]:/gm
            if (!outputPath.startsWith("/") && !windowDisk.test(outputPath)) {
                outputPath = "/" + outputPath;
                outputPath = normalize(uriToPath(baseDir) + outputPath);
            }
            else {
                outputPath = normalize(outputPath);
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
            let regexEnvVar = /%(.*?)%/gm;
            let result: RegExpExecArray | null;
            while (result = regexEnvVar.exec(build.nodeModulesDir)) {
                let varName = result[1];
                let varValue = env[varName] ?? 'undefined';
                build.nodeModulesDir = build.nodeModulesDir.replace(result[0], varValue);
            }
            let windowDisk = /^[a-zA-Z]:/gm
            if (!build.nodeModulesDir.startsWith("/") && !windowDisk.test(build.nodeModulesDir)) {
                build.nodeModulesDir = "/" + build.nodeModulesDir;
                build.nodeModulesDir = normalize(uriToPath(baseDir) + build.nodeModulesDir);
            }
            else {
                build.nodeModulesDir = normalize(build.nodeModulesDir);
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
            let regexEnvVar = /%(.*?)%/gm;
            let result: RegExpExecArray | null;
            while (result = regexEnvVar.exec(outputPath)) {
                let varName = result[1];
                let varValue = env[varName] ?? 'undefined';
                outputPath = outputPath.replace(result[0], varValue);
            }

            if (outputPath.endsWith("*")) {
                outputPath = outputPath.slice(0, -1);
            }
            if (outputPath.endsWith("/")) {
                outputPath = outputPath.slice(0, -1);
            }
            let windowDisk = /^[a-zA-Z]:/gm
            if (!outputPath.startsWith("/") && !windowDisk.test(outputPath)) {
                outputPath = "/" + outputPath;
                outputPath = normalize(uriToPath(baseDir) + outputPath);
            }
            else {
                outputPath = normalize(outputPath);
            }
            outputPath = outputPath.replace(/\\/g, '/');
            _static.outputPathFolder.push(outputPath);
        }

        return _static;
    }

    private defaultConfigValue(): AventusConfig {
        return {
            module: '',
            hideWarnings: false,
            version: '1.0.0',
            componentPrefix: '',
            dependances: [],
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
            version: config.version,
            disabled: false,
            hideWarnings: config.hideWarnings,
            src: [],
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
            dependances: [...config.dependances],
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
        return {
            include: 'need',
            subDependancesInclude: {},
            version: 'x.x.x',
            uri: '',
            npm: ''
        }
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