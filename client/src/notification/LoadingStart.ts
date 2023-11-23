import { Progress, ProgressLocation, window } from 'vscode';


export class LoadingStart {
	public static cmd: string = "aventus/start_loading";
	public static waitings: { [uuid: string]: () => void } = {}
	public static progresses: {
		[uuid: string]: Progress<{
			message?: string | undefined;
			increment?: number | undefined;
		}>
	} = {}

	public static async action(uuid: string, text: string) {
		window.withProgress({
			location: ProgressLocation.Notification,
			title: text,
			cancellable: false
		}, (progress) => {
			this.progresses[uuid] = progress;
			return new Promise<void>((resolve) => {
				this.waitings[uuid] = () => {
					delete this.progresses[uuid];
					delete this.waitings[uuid];
					resolve();
				}
			})
		});
	}
}