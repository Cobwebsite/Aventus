import { GetKeyFromPosition } from './i18n/GetKeyFromPosition';
import { GetLocales } from './i18n/GetLocales';

export const Communication = {
	allCommunications: {},
	list: [
		GetKeyFromPosition,
		GetLocales
	],
	isInit: false,
	init: function () {
		if (this.isInit) return;
		for(let cst of this.list) {
			const el = new cst();
			this.allCommunications[el.channel()] = el;
		}
		this.isInit = true;
	},
	execute: function (channel: string, params: object | any[] | undefined) {
		this.init();
		let cmd = this.allCommunications[channel];
		if (cmd) {
			if (!params) {
				return (cmd.run as any).call(cmd);
			}
			else if (Array.isArray(params)) {
				return (cmd.run as any).call(cmd, ...params);
			}
			else {
				return (cmd.run as any).call(cmd, params);
			}
		}
	}
}