import { Position, CompletionList, CompletionItem, Hover, Definition, Range, FormattingOptions, TextEdit, CodeAction, Diagnostic, Location, CodeLens, WorkspaceEdit } from "vscode-languageserver";
import { AventusErrorCode, AventusExtension } from "../../../definition";
import { AventusFile } from '../../../files/AventusFile';
import { Build } from '../../../project/Build';
import { createErrorTsPos, createErrorTsSection } from "../../../tools";
import { genericTsCompile } from "../compiler";
import { AventusTsFile } from "../File";
import { ClassInfo } from '../parser/ClassInfo';

export class AventusDataFile extends AventusTsFile {
    public get extension(): string {
        return AventusExtension.Data;
    }
    constructor(file: AventusFile, build: Build) {
        super(file, build);
        this.refreshFileParsed();
    }
    protected async onValidate(): Promise<Diagnostic[]> {
        let document = this.file.documentUser;
        this.diagnostics = this.tsLanguageService.doValidation(this.file);
        if (this.fileParsed) {
            this.diagnostics = this.diagnostics.concat(this.fileParsed.errors)
        }
        if (this.build.isCoreBuild) {
            this.validateRules({
                allow_variables: false,
                allow_function: false,
                class_implement: ['IData']
            })
        }
        else {
            this.validateRules({
                allow_variables: false,
                allow_function: false,
                class_implement: ['Aventus.IData'],
                customClassRules: [
                    (classInfo) => {
                        if (!classInfo.isInterface && classInfo.convertibleName) {
                            if (!classInfo.hasStaticField(classInfo.convertibleName)) {
                                this.diagnostics.push(createErrorTsPos(this.file.documentUser, `Missing static property ${classInfo.convertibleName}`, classInfo.nameStart, classInfo.nameEnd, AventusErrorCode.MissingFullName));
                            }
                        }
                    }
                ]
            })
        }

        const struct = this.fileParsed;
        if (struct) {

            for (let className in struct.classes) {
                let classTemp = struct.classes[className];
                
                if (!classTemp.isInterface) {
                    for (let propName in classTemp.properties) {
                        let field = classTemp.properties[propName];
                        // if field is get or set => typescript ll trigger an error
                        if (!field.isAbstract && field.isGetSet && !field.overrideNullable && field.defaultValue === null) {
                            this.diagnostics.push(createErrorTsPos(document, `Property '${field.name}' has no initializer and is not definitely assigned.`, field.nameStart, field.nameEnd, AventusErrorCode.MissingInit));
                        }
                    }

                    let classToSearch: ClassInfo | null = classTemp;
                    let foundFullname = false;
                    while (classToSearch != null) {
                        if (classToSearch.propertiesStatic["Fullname"] != undefined) {
                            foundFullname = true;
                            break;
                        }
                        classToSearch = classToSearch.parentClass;
                    }
                    if (!foundFullname) {
                        this.diagnostics.push(createErrorTsPos(document, `Missing static property Fullname`, classTemp.nameStart, classTemp.nameEnd, AventusErrorCode.MissingFullName));
                    }
                }
            }
        }
        return this.diagnostics;
    }
    protected async onContentChange(): Promise<void> {
        this.refreshFileParsed();
    }
    protected async onSave() {
        this.setCompileResult(genericTsCompile(this));
    }
    protected onCompletion(document: AventusFile, position: Position): Promise<CompletionList> {
        return this.tsLanguageService.doComplete(document, position);
    }
    protected onCompletionResolve(document: AventusFile, item: CompletionItem): Promise<CompletionItem> {
        return this.tsLanguageService.doResolve(item);
    }
    protected onHover(document: AventusFile, position: Position): Promise<Hover | null> {
        return this.tsLanguageService.doHover(document, position);
    }
    protected onDefinition(document: AventusFile, position: Position): Promise<Definition | null> {
        return this.tsLanguageService.findDefinition(document, position);
    }
    protected async onFormatting(document: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
        let changes = await this.tsLanguageService.format(document, range, options);
        return changes;
    }
    protected onCodeAction(document: AventusFile, range: Range): Promise<CodeAction[]> {
        return this.tsLanguageService.doCodeAction(document, range);
    }
    protected onReferences(document: AventusFile, position: Position): Promise<Location[]> {
        return this.tsLanguageService.onReferences(document, position);
    }
    protected onCodeLens(document: AventusFile): Promise<CodeLens[]> {
        return this.tsLanguageService.onCodeLens(document);
    }
    protected async onRename(document: AventusFile, position: Position, newName: string): Promise<WorkspaceEdit | null> {
        return this.tsLanguageService.onRename(document, position, newName);
    }
}