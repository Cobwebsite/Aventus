import { ClientConnection } from '../Connection';

export class InitStep {
	public static isInit: boolean = false;
	public static send(text: string) {
		ClientConnection.getInstance().sendNotification("aventus/initStep", text);
	}

	public static sendDone() {
		ClientConnection.getInstance().sendNotification("aventus/initStep", "Aventus : Done");
        InitStep.isInit = true;
	}
}