import { AventusConfigStatic } from "../language-services/json/definition";
import { Project } from "./Project";
import { FSWatcher, watch } from "chokidar";
import { normalize, sep } from "path";
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync } from "fs";
import { compile } from 'sass';
import { HttpServer } from '../live-server/HttpServer';
import { AventusExtension } from '../definition';
import { pathToUri, writeFile } from '../tools';
import { SettingsManager } from '../settings/Settings';
import { Statistics } from '../notification/Statistics';
import { FilesManager } from '../files/FilesManager';
import { TextDocument } from 'vscode-languageserver-textdocument';

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
    }
    public async export() {
        if (this.isReady) {
            Statistics.startSendStaticTime(this.name);
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
                            let style = compile(pathFile, {
                                style: 'compressed',
                            }).css.toString().trim();
                            writeFile(pathOut.replace(".scss", ".css"), style, "static", this.name);
                        }
                    }
                    else {
                        copyFileSync(pathFile, pathOut);
                        Statistics.sendFileSize(pathOut, undefined, "static", this.name);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            let staticFiles = foundAll(this.staticConfig.inputPathFolder);
            for (let filePath of staticFiles) {
                filePath = filePath.replace(/\\/g, '/');
                for (let outputPathFolder of this.staticConfig.outputPathFolder) {
                    let resultPath = filePath.replace(this.staticConfig.inputPathFolder, outputPathFolder);
                    if (filePath.endsWith(AventusExtension.Base)) {
                        if (filePath.endsWith(AventusExtension.GlobalStyle)) {
                            resultPath = resultPath.replace(AventusExtension.GlobalStyle, ".css")
                            let cssFile = this.project.scssFiles[pathToUri(filePath)];
                            if (!cssFile) {
                                const doc = TextDocument.create(pathToUri(filePath), AventusExtension.GlobalStyle, 1, readFileSync(filePath, 'utf8'))
                                await FilesManager.getInstance().registerFile(doc);
                                cssFile = this.project.scssFiles[pathToUri(filePath)];
                            }
                            cssFile.addOutPath(resultPath, this.name);
                        }
                    }
                    else {
                        copyFile(filePath, resultPath);
                    }
                }
            }
            HttpServer.getInstance().reload();
            Statistics.sendStaticTime(this.name);
        }
    }
    public registerWatcher() {
        if (SettingsManager.getInstance().settings.onlyBuild) return;

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