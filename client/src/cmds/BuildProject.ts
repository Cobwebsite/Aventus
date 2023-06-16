import { window } from "vscode";
import { BuildQuickPick } from "../quickPick";
import { Singleton } from "../Singleton";

export class BuildProject {
    static cmd: string = "aventus.compile";

    public static async middleware(args: any[]): Promise<any[]> {
        let toDisplay: BuildQuickPick[] = [];
        for (let uri in Singleton.allBuilds) {
            for (let name of Singleton.allBuilds[uri]) {
                toDisplay.push(new BuildQuickPick(name, uri));
            }
        }

        const result = await window.showQuickPick(toDisplay, {
            placeHolder: 'Project to compile',
            canPickMany: false,
        });
        if (result) {
            args.push(result);
        }
        return args;
    }
}