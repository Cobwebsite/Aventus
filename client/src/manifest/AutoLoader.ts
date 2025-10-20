import { ConfigurationTarget, Uri, window, workspace } from 'vscode';

export class AutoLoader {
	public static readonly htmlManifest = "vscode.html-custom-data.json";
	public static readonly emmetManifest = "snippets.json";
	private static instance: AutoLoader | undefined = undefined
	public static getInstance(): AutoLoader {
		if (!this.instance) {
			this.instance = new AutoLoader();
		}
		return this.instance;
	}

	private preventUris: string[] = [];
	private registeredUris: string[] = [];
	private registeredUrisEmmet: string[] = [];
	private constructor() {
		this.load();
		workspace.onDidChangeConfiguration(() => {
			this.load();
		})
	}

	private load() {
		this.preventUris = workspace.getConfiguration("aventus").get("preventCustomData") as string[];
		this.registeredUris = workspace.getConfiguration("html").get("customData") as string[];
		this.registeredUrisEmmet = workspace.getConfiguration("emmet").get("extensionsPath") as string[];
	}


	public async register(uri: Uri) {
		const folders = workspace.workspaceFolders;
		if (folders) {
			for (let folder of folders) {
				let workspaceUri = this.uriToString(folder.uri);
				let fileUri = this.uriToString(uri);
				if (fileUri.startsWith(workspaceUri)) {
					const relativeUri = "." + fileUri.replace(workspaceUri, "");
					if (this.preventUris.includes(relativeUri)) return;
					if (relativeUri.endsWith(AutoLoader.htmlManifest) && this.registeredUris.includes(relativeUri)) return;
					if (relativeUri.endsWith(AutoLoader.emmetManifest) && this.registeredUrisEmmet.includes(this.dir(relativeUri))) return;

					const temp = await window.showQuickPick([{ label: "Yes" }, { label: "No" }], {
						canPickMany: false,
						title: `Would you include ${relativeUri} to provide autocompletion?`
					});

					if (temp?.label == "Yes") {
						if (relativeUri.endsWith(AutoLoader.htmlManifest)) {
							const config = workspace.getConfiguration("html");
							this.registeredUris.push(relativeUri);
							await config.update("customData", this.registeredUris, ConfigurationTarget.Workspace);
						}
						else if (relativeUri.endsWith(AutoLoader.emmetManifest)) {
							const config = workspace.getConfiguration("emmet");
							this.registeredUrisEmmet.push(this.dir(relativeUri));
							await config.update("extensionsPath", this.registeredUrisEmmet, ConfigurationTarget.Workspace);
						}

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

	public dir(uri: string): string {
		let split = uri.split("/");
		split.pop();
		return split.join("/")
	}
	public uriToString(uri: Uri) {
		let uriTxt = uri.toString();
		uriTxt = uriTxt.replace("file:///", "").replace(/\/\//g, "/")
			.replace(/%3A/g, ":")
			.replace(/%40/g, "@");
		return "file:///" + uriTxt;
	}
}