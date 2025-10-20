import { ProgressLocation, window } from 'vscode';
import { ProgressStart } from './ProgressStart';

export class ProgressStop {
	public static cmd: string = "aventus/progress_stop";


	public static action(uuid: string) {
		if (ProgressStart.progress[uuid]) {
			ProgressStart.progress[uuid]();
			delete ProgressStart.progress[uuid];
		}
	}
}