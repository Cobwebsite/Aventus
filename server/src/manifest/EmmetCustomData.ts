import { join } from 'path';
import { AventusTsFile } from '../language-services/ts/File';
import { writeFile } from '../tools';
import { Manifest, ManifestInfo } from './Manifest';
import { AventusWebComponentLogicalFile } from '../language-services/ts/component/File';
import { EmmetCustomDataSchema } from './EmmetCustomDataSchema';


export class EmmetCustomData {

	private manifest: Manifest;
	private _package: EmmetCustomDataSchema;
	public constructor(manifest: Manifest) {
		this.manifest = manifest;
		this._package = {
			html: {
				snippets: {}
			}
		}
	}

	public write(dir: string) {
		writeFile(join(dir, "emmet", "snippets.json"), JSON.stringify(this._package, null, 2), "build", this.manifest.build.buildConfig.name);
	}

	public register(file: AventusTsFile, info: ManifestInfo) {
		if (!file.fileParsed) return;
		if (!(file instanceof AventusWebComponentLogicalFile)) return
		const _class = info.class;
		const compilationResult = file.compileResult.find(p => p.classScript.split('.').pop() == file.componentClassName)!;
		if (!_class) return;
		if (!compilationResult) return;
		if (!compilationResult.tagName) return;
		const tag = compilationResult.tagName;
		this._package.html.snippets[tag] = `<${tag}>\${1}</${tag}>`;
	}

}