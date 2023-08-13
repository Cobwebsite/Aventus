#!/usr/bin/env node
import { existsSync, readdirSync } from 'fs';
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
        }, {
            value: "quit",
            name: "Quit",
        }] as const;

        let response = await Interaction.select("Which action shoud I perform?", query)
        if (response == "create") {
            // use this to delay loading file
            const { Server } = await (eval('import("./Server.js")') as Promise<typeof import('./Server')>);
            Server.start();
        }
        else if (response == "quit") {
            process.exit(0)
        }
        else {
            console.log("WIP");
        }
        console.log(response);
    }





})();

setInterval(function() {
    
}, 1000 * 60);