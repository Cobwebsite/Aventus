import { Command } from 'commander';
import { Action } from './Action';
import { Build } from './Build'
import { Dev } from './Dev'

const actions: (new () => Action<any>)[] = [
	Build,
	Dev
]


export function registerCommands(progam: Command) {
	for (let actionCst of actions) {
		const action = new actionCst();
		action.register(progam);
	}
}