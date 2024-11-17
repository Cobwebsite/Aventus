import { statSync } from 'fs';
import { GenericServer } from '../GenericServer';
import { SettingsManager } from '../settings/Settings';
import { Timer } from '../tools';

export type StatisticsInfo = {
	loadFileTime: number,
	builds: { [name: string]: StatisticsInfoBuild },
	statics: { [name: string]: StatisticsInfoStatic },
	files: {
		[path: string]: {
			type: "build" | "static" | "storybook",
			typeName?: string,
			path: string,
			size: number
		}
	}
}
export type StatisticsInfoBuild = {
	buildTime: number
}
export type StatisticsInfoStatic = {
	buildTime: number
}

export class Statistics {

	public static get isEnable(): boolean {
		return SettingsManager.getInstance().settings.useStats;
	}
	public static startSendLoadFile() {
		if (this.isEnable)
			Timer.start("load_files");
	}
	public static sendLoadFile() {
		if (this.isEnable)
			GenericServer.sendNotification("aventus/statistics/loadFileTime", Timer.stop("load_files"));
	}
	public static startSendBuildTime(build: string) {
		if (this.isEnable)
			Timer.start("full_build_" + build);
	}
	public static sendBuildTime(build: string) {
		if (this.isEnable)
			GenericServer.sendNotification("aventus/statistics/buildTime", build, Timer.stop("full_build_" + build));
	}

	public static startSendStaticTime(name: string) {
		if (this.isEnable)
			Timer.start("full_static_" + name);
	}
	public static sendStaticTime(name: string) {
		if (this.isEnable)
			GenericServer.sendNotification("aventus/statistics/staticTime", name, Timer.stop("full_static_" + name));
	}


	public static sendFileSize(path: string, text: string | undefined, type: "build" | "static" | "storybook", name?: string) {
		if (this.isEnable) {
			let size: number = 0;
			if (typeof text == 'string') {
				size = Buffer.from(text).length
			}
			else {
				size = statSync(path).size;
			}
			GenericServer.sendNotification("aventus/statistics/fileSize", path, size, type, name);
		}
	}
}