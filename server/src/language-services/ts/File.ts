import { Diagnostic } from "vscode-languageserver";
import { AventusErrorCode, AventusExtension } from "../../definition";
import { AventusFile } from '../../files/AventusFile';
import { Build } from "../../project/Build";
import { createErrorTsPos } from '../../tools';
import { AventusBaseFile } from "../BaseFile";
import { CompileTsResult } from './LanguageService';
import { ParserTs } from './parser/ParserTs';
import { ClassInfo } from './parser/ClassInfo';




export abstract class AventusTsFile extends AventusBaseFile {
    public get tsLanguageService() {
        return this.build.tsLanguageService;
    }
    private _compileResult: CompileTsResult[] = [];
    public get compileResult() {
        return this._compileResult;
    }
    protected diagnostics: Diagnostic[] = [];
    public getDiagnostics(): Diagnostic[] {
        return [...this.diagnostics];
    }

    protected abstract get extension(): string;
    public fileParsed: ParserTs | null = null;

    public get contentForLanguageService() { return this._contentForLanguageService }
    protected _contentForLanguageService: string = '';
    protected buildNamespace: string = "";

    public constructor(file: AventusFile, build: Build) {
        super(file, build);
        this.buildNamespace = this.build.getNamespace(file.uri);
        if (this.mustBeAddedToLanguageService()) {
            this.tsLanguageService.addFile(this);
        }
    }

    protected refreshFileParsed(isLib: boolean = false): void {
        this.fileParsed = ParserTs.parse(this.file.document, isLib);
        this._contentForLanguageService = this.file.document.getText();
        if (!isLib) {
            for (let _namespace of this.fileParsed.namespaces) {
                let diff = _namespace.bodyStart - _namespace.start;
                let empty = "";
                for (let i = 0; i < diff; i++) { empty += " " }
                let firstPart = this._contentForLanguageService.substring(0, _namespace.start);
                let lastPart = this._contentForLanguageService.substring(_namespace.bodyStart, this._contentForLanguageService.length);
                this._contentForLanguageService = firstPart + empty + lastPart;

                diff = _namespace.end - _namespace.bodyEnd;
                empty = "";
                for (let i = 0; i < diff; i++) { empty += " " }
                firstPart = this._contentForLanguageService.substring(0, _namespace.bodyEnd);
                lastPart = this._contentForLanguageService.substring(_namespace.end, this._contentForLanguageService.length);
                this._contentForLanguageService = firstPart + empty + lastPart;
            }
        }
    }

    /**
     * check type for element inside file and add error into this.diagnostics
     * @param rules 
     * @returns 
     */
    protected validateRules(rules: {
        allow_variables?: boolean,
        allow_function?: boolean,
        class_extend?: string[],
        class_implement?: string[],
        customClassRules?: ((classinfo: ClassInfo) => void)[],
        interface?: string[],
        enum?: string[],
        alias?: string[]
    }): void {
        const struct = this.fileParsed;
        if (!struct) {
            return;
        }
        if (!rules.allow_function) {
            for (let fctName in struct.functions) {
                let fct = struct.functions[fctName];
                this.diagnostics.push(createErrorTsPos(this.file.document, `Function can only be used inside lib.avt file`, fct.nameStart, fct.nameEnd, AventusErrorCode.FunctionNotAllowed));
            }
        }
        if (!rules.allow_variables) {
            for (let varName in struct.variables) {
                let varr = struct.variables[varName];
                this.diagnostics.push(createErrorTsPos(this.file.document, `Variables can only be used inside lib.avt file`, varr.nameStart, varr.nameEnd, AventusErrorCode.VariableNotAllowed));
            }
        }
        if (rules.class_extend || rules.class_implement || rules.interface || rules.customClassRules) {

            if (!rules.class_extend) { rules.class_extend = [] }
            if (!rules.class_implement) { rules.class_implement = [] }
            if (!rules.interface) { rules.interface = [] }
            if (!rules.customClassRules) { rules.customClassRules = [] }

            for (let className in struct.classes) {
                let classTemp = struct.classes[className];

                for(let customClassRule of rules.customClassRules){
                    customClassRule(classTemp);
                }
                if (classTemp.isInterface) {
                    let foundInterface = rules.interface.length == 0;
                    for (let extend of classTemp.extends) {
                        if (rules.interface.indexOf(extend) != -1) {
                            foundInterface = true;
                            break;
                        }
                    }
                    if (!foundInterface) {
                        this.diagnostics.push(createErrorTsPos(this.file.document, 'Interface ' + classTemp.name + ' must extend ' + rules.interface.join(" or "), classTemp.nameStart, classTemp.nameEnd, AventusErrorCode.MissingExtension));
                    }
                }
                else {
                    let foundClassExtend = rules.class_extend.length == 0;
                    let foundClassImplement = rules.class_implement.length == 0;
                    for (let implement of classTemp.implements) {
                        if (rules.class_implement.indexOf(implement) != -1) {
                            foundClassImplement = true;
                            break;
                        }
                    }
                    for (let extend of classTemp.extends) {
                        if (rules.class_extend.indexOf(extend) != -1) {
                            foundClassExtend = true;
                            break;
                        }
                    }
                    if (!foundClassImplement) {
                        this.diagnostics.push(createErrorTsPos(this.file.document, 'Class ' + classTemp.name + ' must implement ' + rules.class_implement.join(" or "), classTemp.nameStart, classTemp.nameEnd, AventusErrorCode.MissingImplementation));
                    }
                    if (!foundClassExtend) {
                        this.diagnostics.push(createErrorTsPos(this.file.document, 'Class ' + classTemp.name + ' must extend ' + rules.class_extend.join(" or "), classTemp.nameStart, classTemp.nameEnd, AventusErrorCode.MissingExtension));
                    }
                }
            }
        }
        if (rules.enum) {
            // for (let enumName of struct.enums) {
            //     let enumTemp = struct.enums[enumName];
            //     let foundData = false;
            //     for (let extend of enumTemp.extends) {
            //         if (rules.enum.indexOf(extend.typeName) != -1) {
            //             foundData = true;
            //             break;
            //         }
            //     }
            //     if (!foundData) {
            //         this.diagnostics.push(createErrorTsPos(this.file.document, 'Enum must extends ' + rules.enum.join(" or "), enumTemp.start, enumTemp.end));
            //     }
            // }
        }
        if (rules.alias) {
            // for (let aliasName in struct.aliases) {
            // let aliasTemp = struct.aliases[aliasName]
            // let foundData = false;
            // for (let extend of aliasTemp.extends) {
            //     if (rules.alias.indexOf(extend.typeName) != -1) {
            //         foundData = true;
            //         break;
            //     }
            // }
            // if (!foundData) {
            //     this.diagnostics.push(createErrorTsPos(this.file.document, 'Alias must extends ' + rules.alias.join(" or "), aliasTemp.start, aliasTemp.end));
            // }
            // }
        }
    }

    protected override async onDelete() {
        if (this.mustBeAddedToLanguageService()) {
            this.tsLanguageService.removeFile(this);
        }
    }

    private oldFullSrc: { name: string, src: string }[] = [];
    private oldFullDocVisible = "";
    private oldFullDocInvisible = "";
    private oldFullClassScript = "";
    protected setCompileResult(compileResult: CompileTsResult[]) {
        let triggerRebuild = false;
        let fullSrcInline = "";
        let fullSrc: { name: string, src: string }[] = [];
        let fullDocVisible = "";
        let fullDocInvisible = "";
        let fullClassScript = "";
        for (let res of compileResult) {
            fullSrcInline += res.compiled;
            if (res.classScript != "") {
                fullSrc.push({
                    name: res.classScript,
                    src: res.compiled
                })
            }
            fullDocVisible += res.docVisible;
            fullDocInvisible += res.docInvisible;
            fullClassScript += res.classScript + "#";
        }

        let oldSrcInline = "";
        for (let old of this.oldFullSrc) {
            oldSrcInline += old.src;
        }

        if (compileResult.length != this.compileResult.length) {
            triggerRebuild = true;
        }
        else if (this.oldFullClassScript != fullClassScript) {
            triggerRebuild = true;
        }
        else if (oldSrcInline != fullSrcInline) {
            triggerRebuild = true;
        }
        else if (this.oldFullDocVisible != fullDocVisible) {
            triggerRebuild = true;
        }
        else if (this.oldFullDocInvisible != fullDocInvisible) {
            triggerRebuild = true;
        }
        let oldBuildInfo = this.oldFullSrc;
        if (triggerRebuild) {
            this.oldFullDocInvisible = fullDocInvisible;
            this.oldFullDocVisible = fullDocVisible;
            this.oldFullSrc = fullSrc;
            this.oldFullClassScript = fullClassScript;
        }


        this._compileResult = compileResult;
        if (triggerRebuild) {
            this.emitToHtttpServer(oldBuildInfo);
            this.build.build()
        }
    }
    protected mustBeAddedToLanguageService() {
        return true;
    }

    protected emitToHtttpServer(oldBuildInfo: { name: string, src: string }[]) {
        this.build.reloadPage = true;
    }

    protected onGetBuild(): Build[] {
        return [this.build]
    }

}