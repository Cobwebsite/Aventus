import { ThemeColor, Uri, window } from 'vscode'
import { Singleton } from '../../Singleton';
import { DebugFile } from '../../file-system/DebugFile';

export class Compiling {
    public static cmd: string = "aventus/sharp/compiling";

    private static errors?: { file: string, title: string }[];

    public static action(csproj: string, part: 'compiling' | 'success' | 'error', errors?: { file: string, title: string }[]) {

        if (!Singleton.client.components) return;
        this.errors = errors;

        if (part == 'compiling') {
            Singleton.client.components.setLastCompiledInfo({
                text: '$(loading~spin) Compiling ' + csproj
            });
        }
        else if (part == 'success') {
            let n = new Date();
            let h: number | string = n.getHours();
            if (h < 10) {
                h = '0' + h;
            }
            let m: number | string = n.getMinutes();
            if (m < 10) {
                m = '0' + m;
            }
            let s: number | string = n.getSeconds();
            if (s < 10) {
                s = '0' + s;
            }
            let time = h + ":" + m + ":" + s;
            let txt = csproj + " compiled at " + time;

            Singleton.client.components.setLastCompiledInfo({
                text: "$(issue-closed) " + txt
            });
        }
        else {
            Singleton.client.components.setLastCompiledInfo({
                text: "$(error) " + csproj + " compilation errors",
                backgroundColor: new ThemeColor('statusBarItem.errorBackground'),
                command: "aventus.openfile.debugsharp"
            });
        }
    }

    public static openDebug() {
        if (!this.errors) return
        for (let error of this.errors) {
            window.showTextDocument(Uri.parse(DebugFile.schema + ":" + error.file));
        }
    }
}