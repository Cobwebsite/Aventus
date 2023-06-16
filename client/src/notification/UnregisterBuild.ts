import { Singleton } from "../Singleton";

export class UnregisterBuild {
    public static cmd: string = "aventus/unregisterBuild";

    public static action(params: { pathConfig: string, buildName: string }) {
        let pathConfig = params.pathConfig;
        let buildName = params.buildName;
        if (Singleton.allBuilds[pathConfig]) {
            let index = Singleton.allBuilds[pathConfig].indexOf(buildName);
            if (index != -1) {
                Singleton.allBuilds[pathConfig].splice(index, 1);
            }
        }

        if (Object.keys(Singleton.allBuilds).length == 0) {
            Singleton.client.components?.runningServer.hide();
        }
    }
}