import { join } from 'path';
import { GenericServer } from '../GenericServer';
import { AventusPackageFile } from '../language-services/ts/package/File';
import { uriToPath, writeFile } from '../tools';
import { EmmetCustomDataSchema } from './EmmetCustomDataSchema';
import { existsSync, mkdirSync } from 'fs';
import { EOL } from 'os';

export class ManifestPackage {

	public static files: Record<string, AventusPackageFile> = {};
	public static done: boolean = false;

	public static register(file: AventusPackageFile) {
		if (!this.files[file.file.uri]) {
			this.files[file.file.uri] = file;
			if (this.done) {
				this.write();
			}
		}
	}

	public static write() {
		const result: EmmetCustomDataSchema = {
			html: {
				snippets: {}
			}
		};
		let canWrite: boolean = false;
		for (const uri in this.files) {
			const exports = this.files[uri].srcInfo.available;
			for (const info of exports) {
				if (info.tagName) {
					const tag = info.tagName;
					result.html.snippets[tag] = `<${tag}>\${1}</${tag}>`
					canWrite = true;
				}
			}
		}

		if (canWrite) {
			const dir = uriToPath(GenericServer.getWorkspaceUri());
			const emmetPath = join(dir, ".aventus", "emmet");
			if (!existsSync(emmetPath)) {
				mkdirSync(emmetPath, { recursive: true })
			}
			writeFile(join(emmetPath, "snippets.json"), JSON.stringify(result, null, 2), "manifest");
			this.done = true;
		}

	}

	public static getMarkdown(uri: string): string {
		if (this.files[uri]) {
			const md = new ManifestPackageMd(this.files[uri]);
			return md.getContent();
		}
		return "";
	}

}

type ManifestProp = {
	name: string,
	type: string,
	description?: string,
	decorator?: string
}
type ManifestMethod = {
	name: string,
	result: string,
	isAsync?: boolean,
	description?: string,
}
export class ManifestPackageMd {
	private file: AventusPackageFile;

	private content: string[] = [];

	private overviews: { name: string, type: string, description?: string }[] = []
	private parts: {
		name: string,
		isWebComponent: boolean,
		tag?: string,
		type: string,
		description?: string,
		import: string,
		parent: string,
		impl: string,
		cssProps?: ManifestProp[],
		jsProps?: ManifestProp[],
		jsPropsStatic?: ManifestProp[],
		example?: string,
		jsMethods?: ManifestMethod[],
		jsMethodsStatic?: ManifestMethod[],
	}[] = []

	public constructor(file: AventusPackageFile) {
		this.file = file;

		this.add("# " + file.name)
		this.line();
		if (file.description) {
			this.add(file.description)
			this.line();
		}

		const exports = this.file.srcInfo.available;
		this.file.fileParsed
		for (const info of exports) {

		}


		this.writeOverview();
		this.writeContent();
	}

	public getContent(): string {
		return this.content.join(EOL);
	}

	private writeOverview() {
		this.add("## Overview")
		this.line();
		this.add("| Nom | Type | Description |");
		this.add("| --- | --- | --- |");
		this.overviews.sort((a, b) => a.name.localeCompare(b.name))
		for (let overview of this.overviews) {
			this.add(`| [${overview.name}](${overview.name.toLowerCase()}) | ${overview.type} | ${overview.description} |`);
		}
		this.line();
	}

	private writeContent() {
		this.parts.sort((a, b) => a.name.localeCompare(b.name))

		for (let part of this.parts) {
			this.add("## " + part.name)
			this.line();

			this.add(`Type : ${part.type}`)
			if (part.tag)
				this.add(`Tag : ${part.tag}`)
			if (part.description)
				this.add(`Description : ${part.description}`)
			this.add(`Import : import { Lib } from "Aventus@Main:Aventus.package.avt";`)
			this.add(`Parent : Aventus.Webcomponent`)
			this.add(`Implements : ITest`)

			const withDeco: boolean = part.isWebComponent;

			this.line();
			if (part.cssProps) {
				this.add("### CSS Props")
				this.line();
				this.writeProps(part.cssProps, withDeco);
				this.line();
			}

			if (part.jsProps) {
				this.add("### JS Props")
				this.line();
				this.writeProps(part.jsProps, withDeco);
				this.line();
			}

			if (part.jsMethods) {
				this.add("### Methods")
				this.line();
				this.writeMethods(part.jsMethods);
				this.line();
			}

			if (part.jsPropsStatic) {
				this.add("### JS Props Static")
				this.line();
				this.writeProps(part.jsPropsStatic, withDeco);
				this.line();
			}

			if (part.jsMethodsStatic) {
				this.add("### Methods Static")
				this.line();
				this.writeMethods(part.jsMethodsStatic);
				this.line();
			}

			if (part.example) {
				this.add("### Example")
				this.line();
				this.add(part.example);
			}
		}
	}

	private writeProps(props: ManifestProp[], withDeco: boolean) {
		if (props.length == 0) return;

		if (withDeco) {
			this.addColumnsHeader(["Name", "Type", "Description", "Decorator"]);
			for (let prop of props) {
				this.addColumns([
					prop.name,
					prop.type,
					prop.description ?? '',
					prop.decorator ?? ''
				])
			}
		}
		else {
			this.addColumnsHeader(["Name", "Type", "Description"]);
			for (let prop of props) {
				this.addColumns([
					prop.name,
					prop.type,
					prop.description ?? ''
				])
			}
		}

	}
	private writeMethods(methods: ManifestMethod[]) {
		if (methods.length == 0) return;

		this.addColumnsHeader(["Name", "Return", "Description"]);
		for (let method of methods) {
			this.addColumns([
				method.name,
				method.result,
				method.description ?? ''
			])
		}
	}

	private line() {
		this.content.push("")
	}
	private add(txt: string) {
		this.content.push(txt)
	}

	private addColumns(cols: string[]) {
		let txt = `| ${cols.join(" | ")} |`;
		this.add(txt);
	}
	private addColumnsHeader(cols: string[]) {
		this.addColumns(cols);
		const split: string[] = [];
		for (let i = 0; i < cols.length; i++) {
			split.push("---")
		}
		let txt = `| ${split.join(" | ")} |`;
		this.add(txt);
	}
}