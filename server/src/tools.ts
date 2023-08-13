import { sep } from "path";
import { flattenDiagnosticMessageText } from 'typescript';
import { Diagnostic, DiagnosticSeverity, Position, Range } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { AventusErrorCode, AventusExtension, AventusLanguageId } from "./definition";
import { SectionType } from './language-services/ts/LanguageService';
import { AventusFile } from './files/AventusFile';

export function pathToUri(path: string): string {
    if (path.startsWith("file://")) {
        return path;
    }
    if (sep === "/") {
        return "file://" + encodeURI(path.replace(/\\/g, '/')).replace(":", "%3A");
    }
    return "file:///" + encodeURI(path.replace(/\\/g, '/')).replace(":", "%3A");
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
    let offset = file.document.offsetAt(position) - 1;
    let currentLetterPosition = textToSearch.length - 1;
    let currentLetter = textToSearch[currentLetterPosition];
    while (offset > 0) {
        if (file.content[offset] == " ") {
            continue;
        }
        if (file.content[offset] == currentLetter) {
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
    let offset = file.document.offsetAt(position);
    let maxOffset = file.document.getText().length;
    let currentLetterPosition = 0;
    let currentLetter = textToSearch[currentLetterPosition];
    while (offset <= maxOffset) {
        if (file.content[offset] == " ") {
            continue;
        }
        if (file.content[offset] == currentLetter) {
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