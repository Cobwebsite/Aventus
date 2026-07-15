import { ActionGroup } from './Action';


export class Ai extends ActionGroup {
	public get name(): string {
		return "ai"
	}
	public get description(): string {
		return "Manage ai helpers"
	}
}