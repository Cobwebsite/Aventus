import { join } from 'path';
import { AventusTsFile } from '../language-services/ts/File';
import { writeFile } from '../tools';
import { Manifest, ManifestInfo } from './Manifest';
import { AventusWebComponentLogicalFile } from '../language-services/ts/component/File';
import { EmmetCustomDataSchema } from './EmmetCustomDataSchema';


export class EmmetCustomData {

	private manifest: Manifest;
	private _package: EmmetCustomDataSchema;
	private tagsByUri = new Map<string, string>();
	public constructor(manifest: Manifest) {
		this.manifest = manifest;
		this._package = {
			html: {
				snippets: {}
			}
		}
	}

	public async write(dir: string) {
		await writeFile(join(dir, "emmet", "snippets.json"), JSON.stringify(this._package, null, 2), "build", this.manifest.build.buildConfig.fullname);
	}

	public register(file: AventusTsFile, info: ManifestInfo) {
		this.unregister(file.file.uri);
		if (!file.fileParsed) return;
		if (!(file instanceof AventusWebComponentLogicalFile)) return
		const _class = info.class;
		const compilationResult = file.compileResult.find(p => p.classScript.split('.').pop() == file.componentClassName)!;
		if (!_class) return;
		if (!compilationResult) return;
		if (!compilationResult.tagName) return;
		const tag = compilationResult.tagName;
		this.tagsByUri.set(file.file.uri, tag);
		this.rebuildSnippets();
	}

	public unregister(uri: string) {
		this.tagsByUri.delete(uri);
		this.rebuildSnippets();
	}

	private rebuildSnippets() {
		this._package.html.snippets = {};
		for (const tag of this.tagsByUri.values()) {
			this._package.html.snippets[tag] = `<${tag}>\${1}</${tag}>`;
		}
	}

}
