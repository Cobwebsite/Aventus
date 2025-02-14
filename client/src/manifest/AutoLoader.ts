import { ConfigurationTarget, Uri, window, workspace } from 'vscode';
import { SelectItem } from '../notification/AskSelect';

export class AutoLoader {
	private static instance: AutoLoader | undefined = undefined
	public static getInstance(): AutoLoader {
		if (!this.instance) {
			this.instance = new AutoLoader();
		}
		return this.instance;
	}

	private preventUris: string[] = [];
	private registeredUris: string[] = [];
	private constructor() {
		this.load();
		workspace.onDidChangeConfiguration(() => {
			this.load();
		})
	}

	private load() {
		this.preventUris = workspace.getConfiguration("aventus").get("preventCustomData") as string[];
		this.registeredUris = workspace.getConfiguration("html").get("customData") as string[];
	}


	public async register(uri: Uri) {
		const folders = workspace.workspaceFolders;
		if (folders) {
			for (let folder of folders) {
				let workspaceUri = this.uriToString(folder.uri);
				let fileUri = this.uriToString(uri);
				if (fileUri.startsWith(workspaceUri)) {
					const relativeUri = "." + fileUri.replace(workspaceUri, "");
					if (this.registeredUris.includes(relativeUri)) return;
					if (this.preventUris.includes(relativeUri)) return;

					const temp = await window.showQuickPick([{ label: "Yes" }, { label: "No" }], {
						canPickMany: false,
						title: `Would you include ${relativeUri} to provide autocompletion?`
					});

					if (temp?.label == "Yes") {
						const config = workspace.getConfiguration("html");
						this.registeredUris.push(relativeUri);
						await config.update("customData", this.registeredUris, ConfigurationTarget.Workspace);
					}
					else {
						const config = workspace.getConfiguration("aventus");
						this.preventUris.push(relativeUri);
						await config.update("preventCustomData", this.preventUris, ConfigurationTarget.Workspace);
					}
				}
			}
		}
	}

	public uriToString(uri: Uri) {
		let uriTxt = uri.toString();
		uriTxt = uriTxt.replace("file:///", "").replace(/\/\//g, "/")
			.replace(/%3A/g, ":")
			.replace(/%40/g, "@");
		return "file:///" + uriTxt;
	}
}