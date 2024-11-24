import { StatisticsInfo } from '@server/notification/Statistics'

export class Statistics {

	public static info: StatisticsInfo = {
		loadFileTime: 0,
		builds: {},
		statics: {},
		files: {}
	}

	public static loadFileTime = {
		cmd: "aventus/statistics/loadFileTime",
		action: (time: number) => {
			Statistics.info.loadFileTime = time;
		}
	}

	public static buildTime = {
		cmd: "aventus/statistics/buildTime",
		action: (build: string, time: number) => {
			const builds = Statistics.info.builds;
			if (!builds[build]) {
				builds[build] = {
					buildTime: 0
				}
			}
			builds[build].buildTime = time;
		}
	}

	public static staticTime = {
		cmd: "aventus/statistics/staticTime",
		action: (name: string, time: number) => {
			const statics = Statistics.info.statics;
			if (!statics[name]) {
				statics[name] = {
					buildTime: 0
				}
			}
			statics[name].buildTime = time;
		}
	}

	public static sizeFile = {
		cmd: "aventus/statistics/fileSize",
		action: (path: string, size: number, type: "build" | "static" | "storybook", typeName?: string) => {
			this.info.files[path] = {
				path: path,
				size: size,
				type: type,
				typeName: typeName
			}
		}
	}
}