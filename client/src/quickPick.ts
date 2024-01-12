import { QuickInputButton, QuickPickItem, QuickPickItemKind } from 'vscode';

export class BuildQuickPick implements QuickPickItem {
	label: string;
	kind?: QuickPickItemKind;
	description?: string;
	detail?: string;
	picked?: boolean;
	alwaysShow?: boolean;
	buttons?: readonly QuickInputButton[];

	constructor(label, detail) {
		this.label = label;
		this.detail = detail;
	}
}
