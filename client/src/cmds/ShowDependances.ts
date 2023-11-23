import { window } from "vscode";
import { BuildQuickPick } from "../quickPick";
import { Singleton } from "../Singleton";
import { AventusDependancesView } from '../webview/dependances';

export class ShowDependances {
    static cmd: string = "aventus.dependances.show";

    public static async middleware(args: any[]): Promise<any[]> {
        // if (Singleton.client.context) {
        //     new AventusDependancesView().getView(Singleton.client.context, '');
        // }
        return args;
    }
}