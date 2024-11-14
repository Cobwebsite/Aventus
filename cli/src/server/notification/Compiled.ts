
export class Compiled {
    public static cmd: string = "aventus/compiled";

    private static timeByBuild: { [build: string]: string } = {};

    public static removeBuild(buildName: string) {
        delete Compiled.timeByBuild[buildName];
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
    }
}