import { ProgressLocation, window } from 'vscode';

export interface LoadingMessageOptions {
	message: string,
	cancellable?: boolean,
}

export class ShowLoadingMessage {
	public static cmd: string = "aventus/show_loading_message";

	private static waitings: { [uuid: string]: () => void } = {}
	private static alreadyCancelled: string[] = []

	public static async resolve(uuid: string) {
		if (this.waitings[uuid]) {
			this.waitings[uuid]();
			delete this.waitings[uuid];
		}
		else if (!this.alreadyCancelled.includes(uuid)) {
			this.alreadyCancelled.push(uuid);
		}
	}

	public static async action(uuid: string, options: LoadingMessageOptions) {

		const action = new Promise<void>((resolve, reject) => {
			const index = this.alreadyCancelled.indexOf(uuid);
			if (index > -1) {
				this.alreadyCancelled.splice(index, 1);
				resolve();
				return
			}
			this.waitings[uuid] = resolve;
		})
		window.withProgress(
			{
				location: ProgressLocation.Notification,
				title: options.message,
				cancellable: options.cancellable
			},
			async () => {
				await action
				console.log("inside");
			}
		);
	}
}

export class HideLoadingMessage {
	public static cmd: string = "aventus/hide_loading_message";

	public static async action(uuid: string) {
		ShowLoadingMessage.resolve(uuid);
	}
}