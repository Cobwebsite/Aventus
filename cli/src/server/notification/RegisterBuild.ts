
export class RegisterBuild {
    public static cmd: string = "aventus/registerBuild";

    public static action(params: { pathConfig: string, buildName: string }) {
        let pathConfig = params.pathConfig;
        let buildName = params.buildName;
    }
}