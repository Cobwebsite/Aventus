import { join } from 'path'
import { GenericServer } from '../GenericServer'
import { existsSync, readFileSync, writeFileSync } from 'fs'

export type LiveServerSettings = {
	host: string,
	autoIncrementPort: boolean
	port: number,
	rootFolder: string,
	indexFile: string,
	delay: number,
	launch_browser: boolean,
	browser: string,
	auto_close: boolean
}

export interface Settings {
	liveserver: LiveServerSettings,
	updateImportOnRename: boolean,
	projectPath: string[],
	templatePath: string[],
	useDefaultTemplate: boolean,
	readNodeModules: boolean,
	readDirs: string[],
	debug: boolean,
	// settings cli
	onlyBuild: boolean,
	useStats: boolean,
	/** The path of the aventus.conf.avt */
	configPath?: string,
	/** The builds to watch */
	builds?: string[],
	/** The statics to watch */
	statics?: string[],
	errorByBuild?: boolean,
	defaultHideWarnings: boolean,
	deeplApiKey: string,
	quickCreations: string[],
}
export interface SettingsHtml {
	customData: string[]
}

export interface HiddenSettings {
	version: string
	store: {
		token: string,
		username?: string
	}
}

const defaultSettings: Settings = {
	liveserver: {
		host: "0.0.0.0",
		autoIncrementPort: true,
		port: 8080,
		rootFolder: "./dist",
		indexFile: "index.html",
		delay: 200,
		launch_browser: true,
		browser: "",
		auto_close: true,
	},
	updateImportOnRename: true,
	readNodeModules: false,
	templatePath: [],
	projectPath: [],
	readDirs: [],
	onlyBuild: false,
	debug: false,
	useStats: false,
	useDefaultTemplate: true,
	defaultHideWarnings: false,
	deeplApiKey: "",
	quickCreations: []
}
function getDefaultSettings(): Settings {
	return JSON.parse(JSON.stringify(defaultSettings));
}

const defaultHiddenSettings: HiddenSettings = {
	version: "1.3.7",
	store: {
		token: "",
		username: ""
	}
}
function getDefaultHiddenSettings(): HiddenSettings {
	return JSON.parse(JSON.stringify(defaultHiddenSettings));
}

const defaultSettingsHtml: SettingsHtml = {
	customData: []
}
function getDefaultSettingsHtml(): SettingsHtml {
	return JSON.parse(JSON.stringify(defaultSettingsHtml));
}
export class SettingsManager {
	private static instance: SettingsManager;

	private _settings: Settings = getDefaultSettings();
	private _settingsHtml: SettingsHtml = getDefaultSettingsHtml();
	private _hiddenSettings: HiddenSettings = getDefaultHiddenSettings();

	// GenericServer.savePath

	public get settings() {
		return this._settings;
	}
	public get settingsHtml() {
		return this._settingsHtml;
	}
	public get hiddenSettings() {
		return this._hiddenSettings;
	}

	public static getInstance(): SettingsManager {
		if (!this.instance) {
			this.instance = new SettingsManager();
		}
		return this.instance;
	}

	private constructor() {
		const path = join(GenericServer.savePath, "config.json");
		if (existsSync(path)) {
			let settings = {};
			try {
				settings = JSON.parse(readFileSync(path, 'utf8'));
			} catch { }

			this._hiddenSettings = { ...this._hiddenSettings, ...settings }
		}
	}

	public initSettings(newSettings: Partial<Settings>) {
		this._settings = this.mergeDeep(getDefaultSettings(), newSettings);
		let cbs = [...this.cbOnSettingsChange];
		for (let cb of cbs) {
			cb();
		}
	}
	public setSettings(newSettings: Partial<Settings>, global: boolean) {
		GenericServer.setSettings(newSettings, global)
	}
	public setHiddenSettings(newSettings: Partial<HiddenSettings>) {
		this._hiddenSettings = { ...this._hiddenSettings, ...newSettings };
		const path = join(GenericServer.savePath, "config.json");
		writeFileSync(path, JSON.stringify(this._hiddenSettings, null, 4));
	}

	private cbOnSettingsChange: (() => void)[] = []
	public onSettingsChange(cb: () => void) {
		this.cbOnSettingsChange.push(cb);
	}


	public setSettingsHtml(newSettings: Partial<SettingsHtml>) {
		this._settingsHtml = this.mergeDeep(getDefaultSettingsHtml(), newSettings);
		let cbs = [...this.cbOnSettingsChangeHtml];
		for (let cb of cbs) {
			cb();
		}
	}
	private cbOnSettingsChangeHtml: (() => void)[] = []
	public onSettingsChangeHtml(cb: () => void) {
		this.cbOnSettingsChangeHtml.push(cb);
	}

	private isObject(item) {
		return (item && typeof item === 'object' && !Array.isArray(item));
	}
	private mergeDeep(target, ...sources) {
		if (!sources.length) return target;
		const source = sources.shift();

		if (this.isObject(target) && this.isObject(source)) {
			for (const key in source) {
				if (this.isObject(source[key])) {
					if (!target[key]) Object.assign(target, { [key]: {} });
					this.mergeDeep(target[key], source[key]);
				} else {
					Object.assign(target, { [key]: source[key] });
				}
			}
		}

		return this.mergeDeep(target, ...sources);
	}
}