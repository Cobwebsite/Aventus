import { Singleton } from "../Singleton";
import { DebugFile } from '../file-system/DebugFile';
import { InitStep } from './InitStep';
import { ThemeColor, Uri, window } from 'vscode'

export class Compiled {
    public static cmd: string = "aventus/compiled";

    private static timeByBuild: {
        [build: string]: {
            title: string,
            errors: {
                file: string,
                title: string
            }[]
        }
    } = {};
    private static lastTime: string = "";

    public static removeBuild(buildName: string) {
        delete Compiled.timeByBuild[buildName];
        if (Singleton.client.components) {
            Singleton.client.components.lastCompiledInfo.tooltip = "Aventus last compilation :\n" + Object.values(Compiled.timeByBuild).join("\n");
        }
    }
    public static action(buildName: string, errors?: { file: string, title: string }[]) {
        if (!errors || errors.length == 0) {
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
            let txt = buildName + " compiled at " + time;
            Compiled.timeByBuild[buildName] = {
                title: txt,
                errors: []
            };
            this.lastTime = txt;
        }
        else {
            let txt = buildName + "\n\t" + errors.map(e => e.title).join("\n\t");
            Compiled.timeByBuild[buildName] = {
                title: txt,
                errors: errors
            };
        }
        this.render();
    }

    public static render() {
        if (!InitStep.isDone) {
            return;
        }
        if (Singleton.client.components) {
            if (Object.values(Compiled.timeByBuild).length > 0) {
                let hasError = false;
                let tooltips: string[] = []
                for (let buildName in Compiled.timeByBuild) {
                    let info = Compiled.timeByBuild[buildName];
                    if (info.errors.length > 0) {
                        hasError = true;
                    }
                    tooltips.push(info.title);
                }

                if (!hasError) {
                    Singleton.client.components.lastCompiledInfo.text = "$(issue-closed) " + this.lastTime;
                    Singleton.client.components.lastCompiledInfo.backgroundColor = undefined;
                    Singleton.client.components.lastCompiledInfo.command = undefined;
                }
                else {
                    Singleton.client.components.lastCompiledInfo.text = "$(error) You have compilation errors";
                    Singleton.client.components.lastCompiledInfo.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
                    Singleton.client.components.lastCompiledInfo.command = "aventus.openfile.debug";
                }
                Singleton.client.components.lastCompiledInfo.tooltip = "Aventus last compilation :\n" + tooltips.join("\n");
            }
            else {
                Singleton.client.components.lastCompiledInfo.text = "";
                Singleton.client.components.lastCompiledInfo.tooltip = "";
            }
        }
    }

    public static getBuilds() {
        return Object.keys(Compiled.timeByBuild);
    }

    public static openDebug(buildName: string) {
        if (this.timeByBuild[buildName]) {
            for (let error of this.timeByBuild[buildName].errors) {
                window.showTextDocument(Uri.parse(DebugFile.schema + ":" + error.file));
            }
        }
    }
}