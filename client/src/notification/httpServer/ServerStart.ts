import { Singleton } from "../../Singleton";

export class ServerStart {
    public static cmd: string = "aventus/server/start";

    public static action(info: string) {
        if (Singleton.client.components) {
            Singleton.client.components.runningServer.text = "$(notebook-stop)";
            Singleton.client.components.runningServer.tooltip = "Aventus : Stop live reload";
            Singleton.client.components.runningServer.command = "aventus.liveserver.stop";
        }
    }
}