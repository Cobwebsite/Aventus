import { machineId as Id } from 'node-machine-id';
import { hostname } from 'os';
import { SettingsManager, HiddenSettings } from '../settings/Settings';
import { Build } from '../project/Build';
import { DependanceManager } from '../project/DependanceManager';
import { dirname, join, normalize } from 'path';
import { AventusExtension } from '../definition';
import { createReadStream, createWriteStream, existsSync, readdirSync, readFileSync, rmSync, unlink, unlinkSync } from 'fs';
import { TemplateScript } from '../files/Template';
import { create as createArchive } from 'archiver'
import { GenericServer } from '../GenericServer';

type StoreSettings = HiddenSettings["store"];

export class Store {
	public static readonly url = "http://127.0.0.1:8000";
	private static _settings: StoreSettings;
	public static get settings(): StoreSettings {
		if (!this._settings) {
			this._settings = SettingsManager.getInstance().hiddenSettings.store
		}
		return this._settings;
	}
	public static get token(): string {
		return this.settings.token;
	}
	public static get isConnected(): boolean {
		return this.token != "";
	}

	public static setSettings(settings: Partial<StoreSettings>) {
		const newSettings: StoreSettings = { ...this.settings, ...settings }
		SettingsManager.getInstance().setHiddenSettings({ store: newSettings });
		this._settings = newSettings;
	}

	public static async connect(username: string, password: string) {
		const machineId = await Id();
		const machineName = hostname();
		const token = await this.post<string>("/login", {
			username,
			password,
			machineId,
			machineName,
		}, { withoutBearer: true })
		if (token) {
			this.setSettings({ token, username })
			return true;
		}

		return false;
	}
	public static async disconnect() {
		await this.post<boolean>('/logout')
		this.setSettings({ token: "", username: undefined })
	}
	public static async publishPackage(build: Build): Promise<boolean | QueryError> {
		const form = new FormData();
		form.append("name", build.buildConfig.fullname);
		form.append("description", build.buildConfig.description ?? "");
		form.append("version", build.buildConfig.version);
		if (build.buildConfig.organization) {
			form.append("organization", build.buildConfig.organization);
		}
		for (let tag of build.buildConfig.tags) {
			form.append("tags[]", tag);
		}

		let pathPackages = join(DependanceManager.getInstance().getPath(), "@locals", build.buildConfig.fullname + AventusExtension.Package);
		if (!existsSync(pathPackages)) {
			return false;
		}
		const packageFile = new Blob([readFileSync(pathPackages)], { type: "text/plain" });
		form.append("packageFile", packageFile, build.buildConfig.fullname + AventusExtension.Package);

		const rootPath = build.project.getConfigFile().folderPath;
		if (build.buildConfig.readme) {
			let finalPath: string | undefined = undefined;
			if (build.buildConfig.readme.startsWith(".")) {
				const temp = normalize(join(rootPath, build.buildConfig.readme));
				if (existsSync(temp)) {
					finalPath = temp;
				}
				else {
					return new QueryError([{ code: -1, message: "Readme not found" }]);
				}
			}
			else {
				if (existsSync(build.buildConfig.readme)) {
					finalPath = build.buildConfig.readme;
				}
				else {
					const temp = normalize(join(rootPath, build.buildConfig.readme));
					if (existsSync(temp)) {
						finalPath = temp;
					}
					else {
						return new QueryError([{ code: -1, message: "Readme not found" }]);
					}
				}
			}
			let packageFile: Blob | undefined = new Blob([readFileSync(join(rootPath, finalPath))], { type: "text/plain" });
			form.append("readMe", packageFile, "README.md");
		}
		else {
			const files = readdirSync(rootPath);
			const readmeFile = files.find(f => f.toLowerCase() === "readme.md");
			if (readmeFile) {
				const packageFile = new Blob([readFileSync(join(rootPath, readmeFile))], { type: "text/plain" });
				form.append("readMe", packageFile, "README.md");
			}
		}

		const result = await this.postWithErrors<boolean>("/package/publish", form);
		return result;
	}

	public static async publishTemplate(template: TemplateScript): Promise<boolean | QueryError> {
		const form = new FormData();
		form.append("name", template.name);
		form.append("description", template.description);
		form.append("version", template.version);
		form.append("is_project", template.isProject ? '1' : '0');
		if (template.organization) {
			form.append("organization", template.organization);
		}
		for (let tag of template.tags) {
			form.append("tags[]", tag);
		}

		const dir = dirname(template.config);

		const outputZipPath = join(GenericServer.savePath, "temp", template.name + ".zip");
		await this.zip(dir, outputZipPath);

		const packageFile = new Blob([readFileSync(outputZipPath)], { type: "application/zip" });
		form.append("templateFile", packageFile, template.name + ".zip");

		const result = await this.postWithErrors<boolean>("/template/publish", form);
		unlinkSync(outputZipPath);
		return result;
	}

	private static async post<T>(uri: string, body: FormData | {} = {}, options?: PostOptions): Promise<T | null> {
		const result = await this.postWithErrors<T>(uri, body, options);
		if (result instanceof QueryError) {
			for (let error of result.errors) {
				console.log(error.message)
			}
			return null;
		}
		return result;
	}
	private static async postWithErrors<T>(uri: string, body: FormData | {} = {}, options?: PostOptions): Promise<T | QueryError> {
		let query: Response | null = null;
		try {
			const headers = {};
			if (!(body instanceof FormData)) {
				headers['Content-Type'] = 'application/json'
			}
			if (!options?.withoutBearer) {
				const machineId = await Id();
				const bearer = this.token + "|" + machineId;
				headers['Authorization'] = 'Bearer ' + bearer;
			}
			query = await fetch(Store.url + "/api/remote" + uri, {
				method: "POST",
				body: body instanceof FormData ? body : JSON.stringify(body),
				headers
			});
			if (query.status == 401) {
				return new QueryError([{ code: 401, message: "No token provided" }])
			}
			if (query.status == 403) {
				if (uri != '/logout')
					this.disconnect();
				return new QueryError([{ code: 403, message: "You must connect to your account first" }])
			}
			const txt = await query.text();
			let json: any = undefined;
			try {
				json = JSON.parse(txt);
			} catch (e) {
				console.log(txt);
				throw e;
			}

			if (json.errors) {
				if (json.errors.length > 0) {
					return new QueryError(json.errors);
				}
				return json.result as T;
			}
			return new QueryError([{ code: -500, message: "Wrong response format from the api" }])
		} catch (e) {

			return new QueryError([{ code: -500, message: e + "" }])
		}
	}

	public static zip(dir: string, output: string) {
		return new Promise<void>(async (resolve, reject) => {
			const outputStream = createWriteStream(output);
			const archive = createArchive("zip", { zlib: { level: 9 } });
			outputStream.on("close", () => {
				resolve();
			});

			archive.on("error", (err) => {
				reject(err);
			});

			archive.pipe(outputStream);
			archive.directory(dir, false);
			await archive.finalize();
		})
	}

}


type PostOptions = {
	withoutBearer?: boolean
}

export class QueryError {
	public constructor(
		public errors: { code: number, message: string }[]
	) {
	}
}