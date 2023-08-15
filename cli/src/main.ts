#!/usr/bin/env node
import { printLogo } from './logo';
import { Interaction } from './Interaction';
import { Server } from './Server';


(async () => {
    console.clear();
    printLogo();
    console.log("Welcome inside Aventus CLI");
    console.log("Initing...");
    await Interaction.init();
    await Server.start();
    let query = [{
        value: "create",
        name: "Create...",
    },
    {
        value: "log",
        name: "Show logs",
    },
    // {
    //     value: "web",
    //     name: "Run the amazing web interface",
    // }, 
    {
        value: "quit",
        name: "Quit",
    }] as const;
    Interaction.clear();

    while (true) {
        let response = await Interaction.select("Which action shoud I perform?", query)
        if (response == "create") {
            // use this to delay loading file
            // const { Server } = await (eval('import("./Server")') as Promise<typeof import('./Server')>);
            await Server.create();
        }
        else if (response == "log") {
            await Server.log();
        }
        else if (response == "quit") {
            process.exit(0)
        }
        else {
            console.log("WIP");
        }
        Interaction.clear();
    }
})();

setInterval(function () {

}, 1000 * 60);