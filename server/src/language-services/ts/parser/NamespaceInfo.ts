import { ModuleDeclaration } from 'typescript';


export class NamespaceInfo {
	public start: number = 0;
	public end: number = 0;
	public name: string = "";
	public bodyStart: number = 0;
	public bodyEnd: number = 0;

	public constructor(node: ModuleDeclaration) {
		this.name = node.name.getText();
		this.start = node.getStart();
		this.end = node.getEnd();
		if (node.body) {
			this.bodyStart = node.body.getStart() + 1;
			this.bodyEnd = node.body.getEnd() - 1;
		}
	}
}