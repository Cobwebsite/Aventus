import { existsSync, mkdirSync, rmdirSync, rmSync, writeFileSync } from 'fs';
import { GenericServer } from '../../GenericServer';
import { DependanceManager } from '../../project/DependanceManager';
import { ProjectManager } from '../../project/ProjectManager';
import { join } from 'path';
import { uriToPath } from '../../tools';
import { FilesManager } from '../../files/FilesManager';
import { Build } from '../../project/Build';
import { Project } from '../../project/Project';

export class Dependance {
	static cmd: string = "aventus.ai.dependances";

	public static async run() {
		if (!GenericServer.isIDE) {
			const configs = await FilesManager.getInstance().loadAllAventusConfigFiles([GenericServer.getWorkspaceUri()])
			for (let config of configs) {
				const project = new Project(config, false)
				await project.init();
				for(let build of project.getBuilds()) {
					await DependanceManager.getInstance().loadDependancesFromBuild(build.buildConfig, build)
				}
			}
		}

		const packages = DependanceManager.getInstance().packages
		const workspace = GenericServer.getWorkspaceUri();
		const aventusDir = join(uriToPath(workspace), ".aventus");
		if (!existsSync(aventusDir)) {
			mkdirSync(aventusDir);
		}
		const dependancesDir = join(aventusDir, "dependances");
		if (existsSync(dependancesDir)) {
			rmSync(dependancesDir, { force: true, recursive: true });
		}
		mkdirSync(dependancesDir);


		for (let p of packages) {
			console.log("writting : " + join(dependancesDir, p.name))
			writeFileSync(join(dependancesDir, p.name+".d.ts"), p.definition);
		}
	}
}