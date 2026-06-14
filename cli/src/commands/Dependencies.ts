import { ActionGroup } from './Action';


export class Dependencies extends ActionGroup {
	public get name(): string {
		return "dependencies"
	}
	public get description(): string {
		return "Manage project's dependencies"
	}
}