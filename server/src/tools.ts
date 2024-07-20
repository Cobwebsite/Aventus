import { normalize, sep } from "path";
import { flattenDiagnosticMessageText } from 'typescript';
import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { AventusErrorCode, AventusExtension, AventusLanguageId } from "./definition";
import { SectionType } from './language-services/ts/LanguageService';
import { AventusFile } from './files/AventusFile';
import { AventusConfig } from './language-services/json/definition';

export function pathToUri(path: string): string {
    if (path.startsWith("file://")) {
        return path;
    }
    if (sep === "/") {
        return "file://" + normalizeUri(encodeURI(path.replace(/\\/g, '/')));
    }
    return "file:///" + normalizeUri(encodeURI(path.replace(/\\/g, '/')));
}

export function normalizeUri(path: string) {
    return path
        .replace(/:/g, "%3A")
        .replace(/@/g, "%40")
}
export function normalizePath(path: string) {
    return path
        .replace(/%3A/g, ":")
        .replace(/%40/g, "@")
}
export function uriToPath(uri: string): string {
    if (sep === "/") {
        // linux system
        return decodeURIComponent(uri.replace("file://", ""));
    }
    return decodeURIComponent(uri.replace("file:///", ""));
}
export function reorderList<T>(list: T[], selected: T) {
    let indexResult = list.indexOf(selected);
    if (indexResult > -1) {
        list.splice(indexResult, 1);
    }
    list.splice(0, 0, selected);
}

type AventusExtensionKeys = keyof typeof AventusExtension;
type AventusExtensionValues = typeof AventusExtension[AventusExtensionKeys];
export function getLanguageIdByUri(uri: string) {
    let extensions = Object.keys(AventusExtension).reverse();
    for (let key of extensions) {
        if (uri.endsWith(AventusExtension[key])) {
            return getLanguageIdByExtension(AventusExtension[key]);
        }
    }
    return ''
}
export function getLanguageIdByExtension(extension: AventusExtensionValues) {
    if (extension == ".wcv.avt") {
        return AventusLanguageId.HTML;
    }
    else if (extension == ".wcs.avt") {
        return AventusLanguageId.SCSS;
    }
    return AventusLanguageId.TypeScript;
}

//#region errors

export function createErrorTs(currentDoc: TextDocument, msg: string, code: AventusErrorCode, data?: any): Diagnostic {
    return createErrorTsPos(currentDoc, msg, 0, currentDoc.getText().length, code, data)
}
export function createErrorTsSection(currentDoc: TextDocument, msg: string, section: SectionType, code: AventusErrorCode, data?: any): Diagnostic {
    let regex = new RegExp("//#region " + section + "(\\s|\\S)*?//#endregion")
    let match = regex.exec(currentDoc.getText());
    if (match) {
        let indexStart = match.index + 10 + section.length;
        let indexEnd = match.index + match[0].length;
        let result: Diagnostic = {
            range: Range.create(currentDoc.positionAt(indexStart), currentDoc.positionAt(indexEnd)),
            severity: DiagnosticSeverity.Error,
            source: AventusLanguageId.TypeScript,
            message: flattenDiagnosticMessageText(msg, '\n'),
            code: code,
        }
        if (data) {
            result.data = data;
        }
        return result;
    }
    return createErrorTs(currentDoc, msg, code);
}

export function createErrorTsPos(currentDoc: TextDocument, msg: string, start: number, end: number, code: AventusErrorCode, data?: any): Diagnostic {
    let result: Diagnostic = {
        range: Range.create(currentDoc.positionAt(start), currentDoc.positionAt(end)),
        severity: DiagnosticSeverity.Error,
        source: AventusLanguageId.TypeScript,
        message: flattenDiagnosticMessageText(msg, '\n'),
        code: code
    }
    if (data) {
        result.data = data;
    }
    return result;
}

export function createErrorScss(currentDoc: TextDocument, msg: string): Diagnostic {
    return createErrorScssPos(currentDoc, msg, 0, currentDoc.getText().length)
}

export function createErrorScssPos(currentDoc: TextDocument, msg: string, start: number, end: number): Diagnostic {
    return {
        range: Range.create(currentDoc.positionAt(start), currentDoc.positionAt(end)),
        severity: DiagnosticSeverity.Error,
        source: AventusLanguageId.SCSS,
        message: flattenDiagnosticMessageText(msg, '\n')
    }
}
export function createErrorHTMLPos(currentDoc: TextDocument, msg: string, start: number, end: number): Diagnostic {
    return {
        range: Range.create(currentDoc.positionAt(start), currentDoc.positionAt(end)),
        severity: DiagnosticSeverity.Error,
        source: AventusLanguageId.HTML,
        message: flattenDiagnosticMessageText(msg, '\n')
    }
}
//#endregion


export function getFolder(uri: string) {
    let arr = uri.split("/");
    arr.pop();
    return arr.join("/");
}
export function convertRange(document: TextDocument, span: { start: number | undefined; length: number | undefined }): Range {
    if (typeof span.start === 'undefined') {
        const pos = document.positionAt(0);
        return Range.create(pos, pos);
    }
    const startPosition = document.positionAt(span.start);
    const endPosition = document.positionAt(span.start + (span.length || 0));
    return Range.create(startPosition, endPosition);
}

export function checkTxtBefore(file: AventusFile, position: Position, textToSearch: string) {
    let offset = file.documentUser.offsetAt(position) - 1;
    let currentLetterPosition = textToSearch.length - 1;
    let currentLetter = textToSearch[currentLetterPosition];
    while (offset > 0) {
        if (file.contentUser[offset] == " ") {
            continue;
        }
        if (file.contentUser[offset] == currentLetter) {
            currentLetterPosition--;
            if (currentLetterPosition == -1) {
                return true;
            }
            else {
                currentLetter = textToSearch[currentLetterPosition];
                offset--;
                continue;
            }
        }
        return false;
    }
    return false;
}
export function checkTxtAfter(file: AventusFile, position: Position, textToSearch: string) {
    let offset = file.documentUser.offsetAt(position);
    let maxOffset = file.documentUser.getText().length;
    let currentLetterPosition = 0;
    let currentLetter = textToSearch[currentLetterPosition];
    while (offset <= maxOffset) {
        if (file.contentUser[offset] == " ") {
            continue;
        }
        if (file.contentUser[offset] == currentLetter) {
            currentLetterPosition++;
            if (currentLetterPosition == textToSearch.length) {
                return true;
            }
            else {
                currentLetter = textToSearch[currentLetterPosition];
                offset++;
                continue;
            }
        }
        return false;
    }
    return false;
}

export function replaceNotImportAliases(content: string, config: AventusConfig | null) {
    if (!config) {
        return content;
    }
    // replace aliases not starting with @
    let aliases = config.aliases;
    for (let alias in aliases) {
        if (!alias.startsWith("@")) {
            // we replace all alias not preceded by \
            let aliasEscaped = escapeRegex(alias);
            let reg = new RegExp("(?<!\\\\)" + aliasEscaped, "g");
            content = content.replace(reg, aliases[alias]);
        }
    }
    return content;
}

export function escapeRegex(txt: string, avoidStar: boolean = false) {
    if (avoidStar)
        return txt.replace(/[\\^$+?.()|[\]{}]/g, '\\$&');
    return txt.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
}

function isNewlineCharacter(charCode: number) {
    return charCode === '\r'.charCodeAt(0) || charCode === '\n'.charCodeAt(0);
}
export const JS_WORD_REGEX = /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g;
export function getWordAtText(text: string, offset: number): { start: number; length: number } {
    let wordDefinition: RegExp = JS_WORD_REGEX;
    let lineStart = offset;
    while (lineStart > 0 && !isNewlineCharacter(text.charCodeAt(lineStart - 1))) {
        lineStart--;
    }
    const offsetInLine = offset - lineStart;
    const lineText = text.substr(lineStart);

    // make a copy of the regex as to not keep the state
    const flags = wordDefinition.ignoreCase ? 'gi' : 'g';
    wordDefinition = new RegExp(wordDefinition.source, flags);

    let match = wordDefinition.exec(lineText);
    while (match && match.index + match[0].length < offsetInLine) {
        match = wordDefinition.exec(lineText);
    }
    if (match && match.index <= offsetInLine) {
        return { start: match.index + lineStart, length: match[0].length };
    }

    return { start: offset, length: 0 };
}

export function simplifyUri(importUri: string, currentUri: string): string {
    importUri = decodeURIComponent(importUri);
    currentUri = decodeURIComponent(currentUri);
    let currentDirPath = currentUri.split('/');
    currentDirPath.pop();
    let importPath = importUri.split('/');
    for (let i = 0; i < currentDirPath.length; i++) {
        if (importPath.length > i) {
            if (currentDirPath[i] == importPath[i]) {
                currentDirPath.splice(i, 1);
                importPath.splice(i, 1);
                i--;
            }
            else {
                break;
            }
        }
    }
    let finalPathToImport = "";
    for (let i = 0; i < currentDirPath.length; i++) {
        finalPathToImport += '../';
    }
    if (finalPathToImport == "") {
        finalPathToImport += "./";
    }
    finalPathToImport += importPath.join("/");
    return finalPathToImport;
}

export class Debug {
    private static timers: { [name: string]: number } = {}
    private static timersCumulative: { [name: string]: number } = {}

    public static startTimer(name: string) {
        this.timers[name] = new Date().getTime();
    }
    public static startTimerCumluative(name: string) {
        this.timers[name] = new Date().getTime();
        if (!this.timersCumulative[name])
            this.timersCumulative[name] = 0;
    }
    public static stopTimerCumluative(name: string) {
        if (this.timers[name]) {
            let diff = new Date().getTime() - this.timers[name];
            this.timersCumulative[name] += diff;
            delete this.timers[name]
        }
    }
    public static clearTimerCumluative(name: string) {
        delete this.timersCumulative[name]
    }
    public static printTimerCumluative(name: string, lvl: number = 0, msg?: string) {
        if (this.timersCumulative[name]) {
            msg = msg ?? name + " : ";
            for (let i = 0; i < lvl; i++) {
                msg = "\t" + msg;
            }
            console.log(msg + "" + this.timersCumulative[name] + "ms");
        }
    }

    public static printTimer(name: string, lvl: number, msg?: string, min?: number) {
        if (this.timers[name]) {
            let diff = new Date().getTime() - this.timers[name];
            msg = msg ?? "";
            for (let i = 0; i < lvl; i++) {
                msg = "\t" + msg;
            }
            if (min === undefined || diff >= min) {
                console.log(msg + "" + diff + "ms");
            }
        }
    }
    public static stopTimer(name: string, lvl: number = 0, print: boolean = true, msg?: string, min?: number) {
        if (print) {
            if (!msg) msg = name + " : ";
            this.printTimer(name, lvl, msg, min);
        }
        delete this.timers[name];
    }
}