import { GenericServer } from '../GenericServer';
import { BuildErrors } from '../project/Build';
import { InitStep } from './InitStep';

export class Compiled {

	public static send(buildName: string, errors?: BuildErrors) {
		GenericServer.sendNotification("aventus/compiled", buildName, errors);
	}

	public static part(info: string) {
		GenericServer.sendNotification("aventus/compiled/part", info);
	}
}