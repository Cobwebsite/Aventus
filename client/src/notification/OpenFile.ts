import { Uri, window } from "vscode";

export class OpenFile {
    public static cmd: string = "aventus/openfile";

    public static action(uri: string){
        window.showTextDocument(Uri.parse(uri));
    }
}