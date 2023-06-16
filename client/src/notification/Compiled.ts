import { Singleton } from "../Singleton";

export class Compiled {
    public static cmd: string = "aventus/compiled";

    private static timeByBuild: { [build: string]: string } = {};

    public static removeBuild(buildName: string) {
        delete Compiled.timeByBuild[buildName];
        if (Singleton.client.components) {
            Singleton.client.components.lastCompiledInfo.tooltip = "Aventus last compilation :\n" + Object.values(Compiled.timeByBuild).join("\n");
        }
    }
    public static action(buildName: string) {
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
        Compiled.timeByBuild[buildName] = txt;
        if (Singleton.client.components) {
            Singleton.client.components.lastCompiledInfo.text = "$(issue-closed) " + time;
            Singleton.client.components.lastCompiledInfo.tooltip = "Aventus last compilation :\n" + Object.values(Compiled.timeByBuild).join("\n");
        }
    }
}