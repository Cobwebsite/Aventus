import { ActionGroup } from './Action';


export class Project extends ActionGroup {
	public get name(): string {
		return "project"
	}
	public get description(): string {
		return "Manage project's templates"
	}
}