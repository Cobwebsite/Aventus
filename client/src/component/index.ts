import { StatusBarAlignment, StatusBarItem, window } from "vscode";
import { ServerStop } from '../notification/httpServer/ServerStop';

export class AvenutsVsComponent {
    public lastCompiledInfo: StatusBarItem;
    public runningServer: StatusBarItem;

    constructor() {
        this.lastCompiledInfo = window.createStatusBarItem("last-compiled-info", StatusBarAlignment.Right, 1000);
        this.lastCompiledInfo.text = "$(loading~spin) Aventus : init";
        this.lastCompiledInfo.show();

        this.runningServer  = window.createStatusBarItem("running-server", StatusBarAlignment.Right, 999);
        this.runningServer.hide();
        ServerStop.setInfo(this.runningServer);
    }

}