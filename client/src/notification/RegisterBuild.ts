import { Singleton } from "../Singleton";

export class RegisterBuild {
    public static cmd: string = "aventus/registerBuild";

    public static action(params: { pathConfig: string, buildName: string }) {
        let pathConfig = params.pathConfig;
        let buildName = params.buildName;
        if (!Singleton.allBuilds[pathConfig]) {
            Singleton.allBuilds[pathConfig] = [];
        }
        if (Singleton.allBuilds[pathConfig].indexOf(buildName) == -1) {
            Singleton.allBuilds[pathConfig].push(buildName);
        }
    }
}