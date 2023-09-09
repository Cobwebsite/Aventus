import { AventusConfigStatic } from "../language-services/json/definition";
import { Project } from "./Project";
import { FSWatcher, watch } from "chokidar";
import { normalize, sep } from "path";
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
const nodeSass = require('sass');
import { HttpServer } from '../live-server/HttpServer';
import { AventusExtension } from '../definition';
import { pathToUri, uriToPath } from '../tools';

export class Static {
    private staticConfig: AventusConfigStatic;

    private watcher: FSWatcher | undefined;
    private isReady: boolean = false;
    private project: Project;

    public get name() {
        return this.staticConfig.name;
    }

    public constructor(project: Project, staticConfig: AventusConfigStatic) {
        this.project = project;
        this.staticConfig = staticConfig;

        this.registerWatcher();
        this.isReady = true;
        this.export();
    }
    public export() {
        if (this.isReady) {
            // TODO Improve by moving only changed file
            const foundAll = (dir) => {
                var result: string[] = [];
                var recu = (dir) => {
                    if (existsSync(dir)) {
                        let content = readdirSync(dir);
                        content.forEach(name => {
                            let completePath = dir + '/' + name;
                            if (lstatSync(completePath).isDirectory()) {
                                // If it is another directory
                                let files = recu(completePath);
                                if (files.length > 0) {
                                    result.concat(files);
                                }
                            } else {
                                result.push(completePath);
                            }
                        });
                    }
                    return result;
                }
                result = recu(dir);
                return result;
            }

            const copyFile = (pathFile, pathOut) => {
                try {
                    pathOut = normalize(pathOut);
                    let splitted = pathOut.split(sep);
                    let filename = splitted.pop();
                    let folder = splitted.join(sep);

                    if (!existsSync(folder)) {
                        mkdirSync(folder, { recursive: true });
                    }
                    if (filename.endsWith(".scss")) {
                        if (!filename.startsWith("_")) {
                            let style = nodeSass.compile(pathFile, {
                                style: 'compressed',
                            }).css.toString().trim();
                            writeFileSync(pathOut.replace(".scss", ".css"), style);
                        }
                    }
                    else {
                        copyFileSync(pathFile, pathOut)
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            let staticFiles = foundAll(this.staticConfig.inputPathFolder);
            staticFiles.forEach(filePath => {
                filePath = filePath.replace(/\\/g, '/');
                for (let outputPathFolder of this.staticConfig.outputPathFolder) {
                    let resultPath = filePath.replace(this.staticConfig.inputPathFolder, outputPathFolder);
                    if (filePath.endsWith(AventusExtension.Base)) {
                        if (filePath.endsWith(AventusExtension.GlobalStyle)) {
                            resultPath = resultPath.replace(AventusExtension.GlobalStyle, ".css")
                            this.project.scssFiles[pathToUri(filePath)]?.addOutPath(resultPath);
                        }
                        else if (filePath.endsWith(AventusExtension.ComponentGlobalStyle)) {

                        }
                    }
                    else {
                        copyFile(filePath, resultPath);
                    }
                }
            })
            HttpServer.getInstance().reload();
        }
    }
    public registerWatcher() {
        this.watcher = watch(this.staticConfig.inputPathFolder, {
            ignored: /^\./,
            persistent: true,
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 100
            },
            ignoreInitial: true,
        });
        this.watcher.on('add', (path) => {
            this.export();
        })
        this.watcher.on('change', (path) => {
            this.export();
        })
        this.watcher.on('unlink', (path) => {
            this.export();
        })
        this.watcher.on('error', function (error) { })
    }

    public destroy() {
        if (this.watcher) {
            this.watcher.close();
        }
    }
}