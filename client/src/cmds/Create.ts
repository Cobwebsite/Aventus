import { window } from "vscode";
import { BuildQuickPick, QuickPick } from "../quickPick";
import { Singleton } from "../Singleton";
import { readdirSync } from 'fs';

export class Create {
    static cmd: string = "aventus.create";

    public static async middleware(args: any[]): Promise<any[] | null> {

        if (this.checkIfProject(args[0].fsPath)) {
            const result = await window.showQuickPick(QuickPick.createOptions, {
                placeHolder: 'What do you want to create?',
                canPickMany: false,
            });
            if (result) {
                QuickPick.reorder(QuickPick.createOptions, result);
                args.push(result);
                if (result.label == "Custom") {
                    await Singleton.client.localTemplateManager?.createTemplate(args[0].fsPath)
                    return null;
                }
                else if (result.label == "RAM") {
                    let dataToLink: BuildQuickPick[] = [];
                    for (let uri in Singleton.dataClasses) {
                        for (let name of Singleton.dataClasses[uri]) {
                            dataToLink.push(new BuildQuickPick(name, uri));
                        }
                    }
                    const name = await window.showInputBox({
                        title: "Provide a data name for your " + result.label,
                    });
                    args.push(name);
                }
                else if (result.label == "Component") {
                    const name = await window.showInputBox({
                        title: "Provide a name for your " + result.label,
                    });
                    args.push(name);
                    if (name) {
                        const resultFormat = await window.showQuickPick(QuickPick.componentFormat, {
                            placeHolder: 'How should I setup your component?',
                            canPickMany: false,
                        });
                        if (resultFormat) {
                            QuickPick.reorder(QuickPick.componentFormat, resultFormat);
                            args.push(resultFormat);
                        }
                    }
                }
                else if (result.label == "State") {
                    let stateOptions: BuildQuickPick[] = [
                        new BuildQuickPick("State", "Create a state"),
                        new BuildQuickPick("Manager", "Create a state manager"),
                    ];

                    let stateOption = await window.showQuickPick(stateOptions);
                    if (stateOption) {
                        const name = await window.showInputBox({
                            title: "Provide a name for your " + stateOption.label,
                        });
                        args.push(name);
                        args.push(stateOption);
                    }
                }
                else {
                    const name = await window.showInputBox({
                        title: "Provide a name for your " + result.label,
                    });
                    args.push(name);
                }
            }
            return args;
        }
        else {
            const result = await window.showQuickPick([QuickPick.initOption], {
                placeHolder: 'What do you want to create?',
                canPickMany: false,
            });
            if (result && result.label == "Init") {
                await Singleton.client.templateManager?.createProject(args[0].fsPath)
                return null;
            }
        }

        return args;
    }

    private static checkIfProject(path: string) {
        let pathes = Object.keys(Singleton.allBuilds);
        for (let pathTemp of pathes) {
            let norm = path.replace(/\\/g, "/");
            if (norm.startsWith(pathTemp.replace("/aventus.conf.avt", ""))) {
                return true;
            }
        }
        return false;
    }
}