import { ConfigurationTarget, Disposable, Uri, window, workspace } from 'vscode';

export class AutoLoader {
	public static readonly htmlManifest = "vscode.html-custom-data.json";
	public static readonly emmetManifest = "snippets.json";
	private static instance: AutoLoader | undefined = undefined
	private configurationSubscription: Disposable;
	public static dispose() {
		this.instance?.configurationSubscription.dispose();
		this.instance = undefined;
	}
	public static getInstance(): AutoLoader {
		if (!this.instance) {
			this.instance = new AutoLoader();
		}
		return this.instance;
	}

	private preventUris: string[] = [];
	private registeredUris: string[] = [];
	private registeredUrisEmmet: string[] = [];
	private pending = new Map<string, Promise<void>>();
	private constructor() {
		this.load();
		this.configurationSubscription = workspace.onDidChangeConfiguration(() => {
			this.load();
		})
	}

	private load() {
		this.preventUris = workspace.getConfiguration("aventus").get("preventCustomData") as string[];
		this.registeredUris = workspace.getConfiguration("html").get("customData") as string[];
		this.registeredUrisEmmet = workspace.getConfiguration("emmet").get("extensionsPath") as string[];
	}


	public async register(uri: Uri) {
		const key = uri.toString();
		const existing = this.pending.get(key);
		if (existing) return existing;
		const operation = this.registerOnce(uri);
		this.pending.set(key, operation);
		try {
			await operation;
		} finally {
			this.pending.delete(key);
		}
	}

	private async registerOnce(uri: Uri) {
		if (!workspace.getWorkspaceFolder(uri)) return;
		const relativeUri = "./" + workspace.asRelativePath(uri, false).replace(/\\/g, "/");
		if (relativeUri.startsWith("./../") || relativeUri === "./..") return;
		if (this.preventUris.includes(relativeUri)) return;
		if (relativeUri.endsWith(AutoLoader.htmlManifest) && this.registeredUris.includes(relativeUri)) return;
		if (relativeUri.endsWith(AutoLoader.emmetManifest) && this.registeredUrisEmmet.includes(this.dir(relativeUri))) return;

		const temp = await window.showQuickPick([{ label: "Yes" }, { label: "No" }], {
			canPickMany: false,
			title: `Would you include ${relativeUri} to provide autocompletion?`
		});

		if (temp?.label == "Yes") {
			if (relativeUri.endsWith(AutoLoader.htmlManifest)) {
				if (this.registeredUris.includes(relativeUri)) return;
				this.registeredUris.push(relativeUri);
				await workspace.getConfiguration("html").update("customData", this.registeredUris, ConfigurationTarget.Workspace);
			}
			else if (relativeUri.endsWith(AutoLoader.emmetManifest)) {
				const directory = this.dir(relativeUri);
				if (this.registeredUrisEmmet.includes(directory)) return;
				this.registeredUrisEmmet.push(directory);
				await workspace.getConfiguration("emmet").update("extensionsPath", this.registeredUrisEmmet, ConfigurationTarget.Workspace);
			}
		}
		else {
			if (this.preventUris.includes(relativeUri)) return;
			this.preventUris.push(relativeUri);
			await workspace.getConfiguration("aventus").update("preventCustomData", this.preventUris, ConfigurationTarget.Workspace);
		}
	}

	public dir(uri: string): string {
		let split = uri.split("/");
		split.pop();
		return split.join("/")
	}
}
