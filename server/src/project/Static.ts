import { AventusConfigStatic } from "../language-services/json/definition";
import { Project } from "./Project";
import { FSWatcher, watch } from "chokidar";
import { normalize, sep } from "path";
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync } from "fs";
import { compile } from 'sass';
import { HttpServer } from '../live-server/HttpServer';
import { AventusExtension } from '../definition';
import { pathToUri, writeFile } from '../tools';
import { SettingsManager } from '../settings/Settings';
import { Statistics } from '../notification/Statistics';
import { FilesManager } from '../files/FilesManager';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { GenericServer } from '../GenericServer';

export class Static {
    private staticConfig: AventusConfigStatic;

    private watcher: FSWatcher | undefined;
    private isReady: boolean = false;
    private project: Project;
    private exportedBySource = new Map<string, Map<string, { size: number, mtimeMs: number, canDelete: boolean }>>();

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
            let success = true;
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

            const copyFile = async (pathFile, pathOut): Promise<string | null> => {
                try {
                    if (!this.isReady) return null;
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
                            const cssPath = pathOut.slice(0, -".scss".length) + ".css";
                            if (!this.isReady) return null;
                            await writeFile(cssPath, style, "static", this.name);
                            return cssPath;
                        }
                    }
                    else {
                        copyFileSync(pathFile, pathOut);
                        Statistics.sendFileSize(pathOut, undefined, "static", this.name);
                        return pathOut;
                    }
                } catch (e) {
                    success = false;
                    GenericServer.error(e);
                }
                return null;
            }
            let staticFiles = foundAll(this.staticConfig.inputPathFolder);
            const currentSources = new Set(staticFiles.map(path => path.replace(/\\/g, '/')));
            const currentOutputPaths = new Set<string>();
            const ownedOutputPaths = new Set<string>();
            for (const outputs of this.exportedBySource.values()) {
                for (const [path, recorded] of outputs) {
                    if (recorded.canDelete) ownedOutputPaths.add(path);
                }
            }
            for (let filePath of staticFiles) {
                if (!this.isReady) return;
                filePath = filePath.replace(/\\/g, '/');
                const previousOutputs = this.exportedBySource.get(filePath);
                const currentOutputs = new Map<string, { size: number, mtimeMs: number, canDelete: boolean }>();
                const outputFolders = new Set(this.staticConfig.outputPathFolder.map(path => normalize(path)));
                for (let outputPathFolder of outputFolders) {
                    if (!this.isReady) return;
                    let resultPath = filePath.replace(this.staticConfig.inputPathFolder, outputPathFolder);
                    if (filePath.endsWith(AventusExtension.Base)) {
                        if (filePath.endsWith(AventusExtension.GlobalStyle)) {
                            resultPath = resultPath.replace(AventusExtension.GlobalStyle, ".css")
                            let cssFile = this.project.scssFiles[pathToUri(filePath)];
                            if (!cssFile) {
                                const doc = TextDocument.create(pathToUri(filePath), AventusExtension.GlobalStyle, 1, readFileSync(filePath, 'utf8'))
                                await FilesManager.getInstance().registerFile(doc);
                                if (!this.isReady) return;
                                cssFile = this.project.scssFiles[pathToUri(filePath)];
                            }
                            const outputPath = normalize(resultPath);
                            const existedBefore = existsSync(outputPath);
                            await cssFile.addOutPath(resultPath, this.name);
                            if (!this.isReady) return;
                            this.rememberOutput(currentOutputs, previousOutputs, outputPath, existedBefore, ownedOutputPaths);
                        }
                    }
                    else {
                        const outputPath = normalize(resultPath.endsWith('.scss') ? resultPath.slice(0, -".scss".length) + ".css" : resultPath);
                        const existedBefore = existsSync(outputPath);
                        const writtenPath = await copyFile(filePath, resultPath);
                        if (!this.isReady) return;
                        if (writtenPath) this.rememberOutput(currentOutputs, previousOutputs, writtenPath, existedBefore, ownedOutputPaths);
                    }
                }
                if (previousOutputs || currentOutputs.size > 0) {
                    this.exportedBySource.set(filePath, new Map([...(previousOutputs ?? []), ...currentOutputs]));
                }
                for (const path of currentOutputs.keys()) currentOutputPaths.add(path);
            }
            if (!this.isReady) return;
            for (const [source, outputs] of this.exportedBySource) {
                if (currentSources.has(source)) continue;
                for (const [path, recorded] of outputs) {
                    if (currentOutputPaths.has(path)) continue;
                    if (source.endsWith(AventusExtension.GlobalStyle)) {
                        this.project.scssFiles[pathToUri(source)]?.removeOutPath?.(path);
                    }
                    try {
                        if (!recorded.canDelete || !existsSync(path)) continue;
                        const current = statSync(path);
                        if (current.size === recorded.size && current.mtimeMs === recorded.mtimeMs) {
                            unlinkSync(path);
                        }
                    } catch (e) {
                        GenericServer.error(e);
                    }
                }
                this.exportedBySource.delete(source);
            }
            if (!success || !this.isReady) return;
            HttpServer.getInstance().reload();
            Statistics.sendStaticTime(this.name);
        }
    }
    private rememberOutput(current: Map<string, { size: number, mtimeMs: number, canDelete: boolean }>, previous: Map<string, { size: number, mtimeMs: number, canDelete: boolean }> | undefined, path: string, existedBefore: boolean, ownedOutputPaths: Set<string>) {
        if (!existsSync(path)) return;
        const stats = statSync(path);
        const canDelete = previous?.get(path)?.canDelete === true || ownedOutputPaths.has(path) || !existedBefore;
        if (canDelete) ownedOutputPaths.add(path);
        current.set(path, {
            size: stats.size,
            mtimeMs: stats.mtimeMs,
            canDelete,
        });
    }
    public registerWatcher() {
        if (!SettingsManager.getInstance().settings.watchFiles) return;

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
        this.isReady = false;
        if (this.watcher) {
            this.watcher.close();
        }
    }
}
