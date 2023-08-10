#!/usr/bin/env node
import { existsSync, readdirSync } from 'fs';
import { CliConnection } from './Connection';
import { printLogo } from './logo';
import { join } from 'path';
import { AventusExtension } from '@server/definition';
import { Interaction } from './Interaction';

(async () => {

    printLogo();
    await Interaction.init();

    let folderContent = process.cwd();
    console.log(folderContent);

    if (existsSync(join(folderContent, AventusExtension.Config))) {

    }
    else {
        console.log("Welcome inside Aventus CLI");
        console.log("No aventus.config.avt found inside the current folder");
        let query = [{
            value: "create",
            name: "Create a new project",
        },
        {
            value: "web",
            name: "Run the amazing web interface",
        }] as const;

        let response = await Interaction.select("Which action shoud I perform?", query)
        if(response == "create"){
            
        }
        else {
            console.log("WIP");
        }
        console.log(response);
    }




    // let server = new GenericServer(new CliConnection());
    // server.start();

})();