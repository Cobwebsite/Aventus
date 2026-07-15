import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { GenericServer } from '../../GenericServer';
import { DependencyManager } from '../../project/DependencyManager';
import { join } from 'path';
import { uriToPath } from '../../tools';
import { FilesManager } from '../../files/FilesManager';
import { Project } from '../../project/Project';
import { ManifestPackage } from '../../manifest/ManifestPackage';

export class Dependency {
	static cmd: string = "aventus.ai.dependencies";

	public static async run() {
		if (!GenericServer.isIDE) {
			const configs = await FilesManager.getInstance().loadAllAventusConfigFiles([GenericServer.getWorkspaceUri()])
			for (let config of configs) {
				const project = new Project(config, false)
				await project.init();
				for (let build of project.getBuilds()) {
					await DependencyManager.getInstance().loadDependenciesFromBuild(build.buildConfig, build)
				}
			}
		}

		const packages = DependencyManager.getInstance().packages
		const workspace = GenericServer.getWorkspaceUri();
		const aventusDir = join(uriToPath(workspace), ".aventus");
		if (!existsSync(aventusDir)) {
			mkdirSync(aventusDir);
		}
		const dependenciesDir = join(aventusDir, "dependencies");
		if (existsSync(dependenciesDir)) {
			rmSync(dependenciesDir, { force: true, recursive: true });
		}
		mkdirSync(dependenciesDir);


		for (let p of packages) {
			console.log("writting : " + join(dependenciesDir, p.name)+ ".md")
			// writeFileSync(join(dependenciesDir, p.name + ".d.ts"), p.definition);
			const md = ManifestPackage.getMarkdown(p.file.uri);
			if (md) {
				writeFileSync(join(dependenciesDir, p.name + ".md"), md);
			}
		}
	}
}