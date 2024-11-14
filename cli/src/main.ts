#!/usr/bin/env node
import { program } from "commander";
import { registerCommands } from "./commands/_index";

program
    .version("1.0.0")
    .name("aventus")
    .description("AventusJs CLI");

registerCommands(program);

program.parse(process.argv);