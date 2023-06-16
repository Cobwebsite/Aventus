import { window } from "vscode";
import { BuildQuickPick } from "../quickPick";
import { Singleton } from "../Singleton";

export class StaticExport {
    static cmd: string = "aventus.static";

    public static async middleware(args: any[]): Promise<any[]> {
        let toDisplay: BuildQuickPick[] = [];
        for (let uri in Singleton.allStatics) {
            for (let name of Singleton.allStatics[uri]) {
                toDisplay.push(new BuildQuickPick(name, uri));
            }
        }

        const result = await window.showQuickPick(toDisplay, {
            placeHolder: 'Static to export',
            canPickMany: false,
        });
        if (result) {
            args.push(result);
        }
        return args;
    }
}