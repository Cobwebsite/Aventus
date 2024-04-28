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
            Singleton.client.components.lastCompiledInfo.text = '$(loading~spin) Compiling ' + csproj;
            Singleton.client.components.lastCompiledInfo.backgroundColor = undefined;
            Singleton.client.components.lastCompiledInfo.command = undefined;
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

            Singleton.client.components.lastCompiledInfo.text = "$(issue-closed) " + txt;
            Singleton.client.components.lastCompiledInfo.backgroundColor = undefined;
            Singleton.client.components.lastCompiledInfo.command = undefined;
        }
        else {
            Singleton.client.components.lastCompiledInfo.text = "$(error) " + csproj + " compilation errors";
            Singleton.client.components.lastCompiledInfo.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
            Singleton.client.components.lastCompiledInfo.command = "aventus.openfile.debugsharp";
        }
    }

    public static openDebug() {
        if (!this.errors) return
        for (let error of this.errors) {
            window.showTextDocument(Uri.parse(DebugFile.schema + ":" + error.file));
        }
    }
}