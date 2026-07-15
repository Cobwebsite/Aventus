import { Command } from 'commander';
import { Action, ActionGroup } from './Action';
import { Build } from './Build'
import { Dev } from './Dev'
import { Check } from './Check';
import { Format } from './Format';
import { StoreLogin } from './store/StoreLogin';
import { StoreLogout } from './store/StoreLogout';
import { StorePublish } from './store/StorePublish';
import { Create } from './Create';
import { ImportTemplate } from './template/InstallTemplate';
import { InstallProject } from './project/InstallProject';

import { Serve } from './Serve';
import { HelpLLM } from './dependencies/HelpLLM';
import { UninstallProject } from './project/UninstallProject';
import { UninstallTemplate } from './template/UninstallTemplate';
import { Project } from './Project';
import { Template } from './Template';
import { Dependencies as Dependencies } from './Dependencies';
import { Store } from './Store';
import { Watch } from './Watch';
import { Ai } from './Ai';
import { Prepare } from './ai/Prepare';

const actions: ((new () => Action<any>) | (new () => ActionGroup))[] = [
	Create,
	Dev,
	Watch,
	Serve,
	Build,
	Check,
	Format,

	Dependencies,
	HelpLLM,

	Ai,
	Prepare,

	Project,
	InstallProject,
	UninstallProject,

	Template,
	ImportTemplate,
	UninstallTemplate,

	Store,
	StoreLogin,
	StoreLogout,
	StorePublish,
]


export function registerCommands(progam: Command) {

	for (let actionCst of actions) {
		const action = new actionCst();
		action.register(progam);
	}
}