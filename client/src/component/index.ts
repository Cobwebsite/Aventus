import { StatusBarAlignment, StatusBarItem, ThemeColor, window } from "vscode";
import { ServerStop } from '../notification/httpServer/ServerStop';
import { SettingsManager } from '../Settings';

export type TextInfo = { text: string, tooltip?: string, command?: string, color?: string, backgroundColor?: ThemeColor }
export class AvenutsVsComponent {
    private lastCompiledInfo: StatusBarItem;
    public runningServer: StatusBarItem;

    private info: TextInfo;

    constructor() {
        this.info = {
            text: "$(loading~spin) Aventus : init"
        }
        this.lastCompiledInfo = window.createStatusBarItem("last-compiled-info", StatusBarAlignment.Right, 1000);
        this.lastCompiledInfo.text = this.info.text;
        this.lastCompiledInfo.show();

        this.runningServer = window.createStatusBarItem("running-server", StatusBarAlignment.Right, 999);
        this.runningServer.hide();
        ServerStop.setInfo(this.runningServer);

        SettingsManager.getInstance().onSettingsChange(() => {
            this.renderInfo();
        })
    }

    private renderInfo() {
        if (SettingsManager.getInstance().settings.ideBuild) {
            this.lastCompiledInfo.text = this.info.text;
            this.lastCompiledInfo.tooltip = this.info.tooltip;
            this.lastCompiledInfo.command = this.info.command;
            this.lastCompiledInfo.color = this.info.color;
            this.lastCompiledInfo.backgroundColor = this.info.backgroundColor;
        }
        else {
            this.lastCompiledInfo.text = "Compilation is disabled";
            this.lastCompiledInfo.tooltip = undefined;
            this.lastCompiledInfo.command = "aventus.enableBuild";
            this.lastCompiledInfo.color = undefined;
            this.lastCompiledInfo.backgroundColor = new ThemeColor('statusBarItem.errorBackground');
        }
    }

    public setLastCompiledInfo(info: TextInfo) {
        this.info = info;
        this.renderInfo();
    }

}