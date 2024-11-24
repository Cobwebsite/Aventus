
export class UnregisterBuild {
    public static cmd: string = "aventus/unregisterBuild";

    public static action(params: { pathConfig: string, buildName: string }) {
        let pathConfig = params.pathConfig;
        let buildName = params.buildName;
       
    }
}