import { commands, Uri, window } from "vscode";

export class CloseFile {
    public static cmd: string = "aventus/closefile";

    public static action(uri: string) {
        window.showTextDocument(Uri.parse(uri), { preview: true, preserveFocus: false })
            .then(() => {
                return commands.executeCommand('workbench.action.closeActiveEditor');
            });
    }
}