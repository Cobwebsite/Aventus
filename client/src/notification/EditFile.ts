import { Uri, Range } from "vscode";

import * as vscode from 'vscode';

type ParamsType = { uri: string, transformations: { range: Range, newText: string }[][] }
export class EditFile {
    public static cmd: string = "aventus/editFile";

    public static async action(params: ParamsType) {
        try {

            for (let transformation of params.transformations) {
                let edit = new vscode.WorkspaceEdit();
                for (let transfo of transformation) {
                    edit.replace(Uri.parse(params.uri), new Range(transfo.range.start, transfo.range.end), transfo.newText);
                }

                await vscode.workspace.applyEdit(edit)
            }
        } catch (e) {
            console.log(e);
        }
    }
}