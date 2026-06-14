import { ActionGroup } from './Action';


export class Template extends ActionGroup {
	public get name(): string {
		return "template"
	}
	public get description(): string {
		return "Manage templates"
	}
}