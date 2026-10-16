import { TextDocument } from 'vscode-languageserver-textdocument';

export function applyI18nAction(document, action) {
    const edits = action.edit.changes[document.uri];
    return TextDocument.applyEdits(document, edits);
}

export function parseI18nAction(document, action) {
    return JSON.parse(applyI18nAction(document, action));
}
