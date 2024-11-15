import { GenericServer } from '../GenericServer';

export class InitStep {
	public static isInit: boolean = false;
	public static send(text: string) {
		console.log(text);
		GenericServer.sendNotification("aventus/initStep", text);
	}

	public static sendDone() {
		GenericServer.sendNotification("aventus/initStep", "Aventus : Done");
		InitStep.isInit = true;
	}
}