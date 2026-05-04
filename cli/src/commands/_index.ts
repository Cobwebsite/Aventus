import { Command } from 'commander';
import { Action } from './Action';
import { Build } from './Build'
import { Dev } from './Dev'
import { Check } from './Check';
import { Format } from './Format';
import { StoreLogin } from './StoreLogin';
import { StoreLogout } from './StoreLogout';
import { StorePublish } from './StorePublish';
import { Create } from './Create';
import { ImportTemplate } from './ImportTemplate';
import { ImportProject } from './ImportProject';
import { UninstallProject } from './UninstallProject';
import { UninstallTemplate } from './UninstallTemplate';
import { LiveServer } from './LiveServer';
import { Dependance } from './ai/Dependance';

const actions: (new () => Action<any>)[] = [
	Build,
	Create,
	Dev,
	Check,
	Format,
	StoreLogin,
	StoreLogout,
	StorePublish,
	ImportTemplate,
	ImportProject,
	UninstallProject,
	UninstallTemplate,
	LiveServer,
	Dependance
]


export function registerCommands(progam: Command) {

	for (let actionCst of actions) {
		const action = new actionCst();
		action.register(progam);
	}
}