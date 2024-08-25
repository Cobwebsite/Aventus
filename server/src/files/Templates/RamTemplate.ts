import { writeFileSync } from 'fs';
import { GenericServer } from '../../GenericServer';
import { AventusExtension, AventusLanguageId } from '../../definition';
import { pathToUri, uriToPath } from '../../tools';
import { BaseTemplate } from './BaseTemplate';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { FilesManager } from '../FilesManager';
import { OpenFile } from '../../notification/OpenFile';

export class RamTemplate extends BaseTemplate {
	public definition(): string {
		return "Create a basic RAM";
	}
	public name(): string {
		return "RAM.Basic";
	}


	public async init(path: string): Promise<void> {
		const name = await GenericServer.Input({
			title: "Provide a data name for your RAM",
		});

		if (!name) {
			return;
		}
		const extendsActionResponse = await GenericServer.Select([{
			label: "Yes"
		}, {
			label: "No"
		}], {
			title: "Do you need to add custom methods on RAM"
		});
		if (!extendsActionResponse) {
			return;
		}
		let extendsAction = extendsActionResponse.label == "Yes";

		this.createRAM(name, path, extendsAction);
	}

	private createRAM(objectName: string, baseFolderUri: string, extendsAction: boolean) {
		objectName = objectName.charAt(0).toUpperCase() + objectName.slice(1);
		let newScriptPath = uriToPath(baseFolderUri + "/" + objectName + AventusExtension.RAM);
		let newScriptUri = pathToUri(newScriptPath);
		// let importPath = this.getImportPath(newScriptPath, objectPath);
		let className = objectName + "RAM";
		let defaultRAM = ''
		if (extendsAction) {
			defaultRAM = `
interface ${objectName}Method {
	// define your methods here
	
}

export type ${objectName}Extended = ${objectName} & ${objectName}Method;

export class ${className} extends Aventus.Ram<${objectName}, ${objectName}Extended> implements Aventus.IRam {

	/**
	 * Create a singleton to store data
	 */
	public static getInstance(): ${className} {
		return Aventus.Instance.get(${className});
	}

	/**
	 * @inheritdoc
	 */
	public override defineIndexKey(): keyof ${objectName} {
		return 'id';
	}
	/**
	 * @inheritdoc
	 */
	protected override getTypeForData(objJson: Aventus.KeysObject<${objectName}> | ${objectName}): new () => ${objectName}Extended {
		return this.add${objectName}Method(${objectName});
	}

	/**
	 * Mixin pattern to add methods
	 */
	private add${objectName}Method<B extends (new (...args: any[]) => ${objectName}) & { className?: string; }>(Base: B) {
		return class Extension extends Base implements ${objectName}Extended {
			public static override get className(): string {
                return Base.className || Base.name;
            }
            public override get className(): string {
                return Base.className || Base.name;
            }

			// code your methods here

			
		};
	}

}`;
		}
		else {
			defaultRAM = `
export class ${className} extends Aventus.Ram<${objectName}> implements Aventus.IRam {

	/**
	 * Create a singleton to store data
	 */
	public static getInstance(): ${className} {
		return Aventus.Instance.get(${className});
	}

	/**
	 * @inheritdoc
	 */
	public override defineIndexKey(): keyof ${objectName} {
		return 'id';
	}
	/**
	 * @inheritdoc
	 */
	protected override getTypeForData(objJson: Aventus.KeysObject<${objectName}> | ${objectName}): new () => ${objectName} {
		return ${objectName};
	}
}`;
		}
		defaultRAM = this.addNamespace(defaultRAM, newScriptUri);
		writeFileSync(newScriptPath, defaultRAM);
		let textDocument: TextDocument = TextDocument.create(newScriptUri, AventusLanguageId.TypeScript, 0, defaultRAM);
		FilesManager.getInstance().registerFile(textDocument);
		OpenFile.send(newScriptUri);
	}
}