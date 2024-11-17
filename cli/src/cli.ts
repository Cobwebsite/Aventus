#!/usr/bin/env node
import { program } from "commander";
import { registerCommands } from "./commands/_index";
import { version } from '../package.json';

program
    .version(version)
    .name("aventus")
    .description("Aventus CLI");

registerCommands(program);

program.parse(process.argv);