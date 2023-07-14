
process.env["AVENTUS_CLI"] = "true";
process.env["DEBUG"] = "true";
process.env["aventus_server_folder"] = __dirname + "/../..";

import { startServer, stopServer } from '../../server/src/server';
import { pathToUri } from '../../server/src/tools';

import { program, Command } from 'commander';
import  inquirer  from 'inquirer';

const cmd = new Command("Create2");
cmd.name("Create");
cmd.action(() => {
	console.log("salut");
})
program.addCommand(cmd);

program.name("test")

// async function main() {
// 	let projectToCompile = ""
// 	if (process.argv.length == 3) {
// 		projectToCompile = process.argv[2];
// 	}
// 	else {
// 		projectToCompile = __dirname;
// 		projectToCompile = 'D:\\404\\5_Prog_SVN\\2_Services\\Project\\Release\\currentRelease\\Export\\typescript'
// 	}
// 	projectToCompile = projectToCompile.replace(/\\/g, "/")
// 	await startServer([pathToUri(projectToCompile)]);

// 	//await delay(1000 * 60);
// 	stopServer();

// }
// main();


// async function delay(x: number) {
// 	return new Promise<void>((resolve) => {
// 		setTimeout(() => resolve(), x)
// 	})
// }