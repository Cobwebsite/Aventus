import { StatusBarItem } from 'vscode';
import { Singleton } from "../../Singleton";

export class ServerStop {
    public static cmd: string = "aventus/server/stop";

    public static action() {
        if (Singleton.client.components) {
            ServerStop.setInfo(Singleton.client.components.runningServer);
        }
    }

    public static setInfo(el: StatusBarItem) {
        el.text = "$(notebook-execute)";
        el.tooltip = "Aventus : Start live reload";
        el.command = "aventus.liveserver.start";
    }
}