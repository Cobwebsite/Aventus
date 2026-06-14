import { ActionGroup } from './Action';


export class Store extends ActionGroup {
	public get name(): string {
		return "store"
	}
	public get description(): string {
		return "Manage store"
	}
}