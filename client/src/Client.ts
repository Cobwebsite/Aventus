import { join } from "path";
import { ExtensionContext, Location, Position, Range, Uri, commands, workspace } from "vscode";
import { CancellationToken, LanguageClient, LanguageClientOptions, LocationLink, MessageSignature, Range as Range2, ServerOptions, TransportKind } from "vscode-languageclient/node";
import { Commands } from "./cmds";
import { AvenutsVsComponent } from "./component";
import { FileSystem } from './file-system/FileSystem';
import { Notifications } from "./notification";
import { DebugFile } from './file-system/DebugFile';
import { CommandsInternal } from './cmds-internal';
import { ReloadSettings } from './cmds/ReloadSettings';
import { AutoLoader } from './manifest/AutoLoader';
import { AventusI18nEditor } from './customEditors/AventusI18nEditor';
import { GetKeyFromPosition } from './communication/i18n/GetKeyFromPosition';
import { SettingsManager } from './Settings';

export class Client {
    private _context: ExtensionContext | undefined = undefined;
    private client: LanguageClient | undefined = undefined;
    public components: AvenutsVsComponent | undefined = undefined;
    private fileSystem: FileSystem | undefined = undefined;
    public debugFile!: DebugFile;
    private _isInit = false;
    public get isInit(): boolean {
        return this._isInit;
    }

    public get context() {
        return this._context;
    }


    public async init(context: ExtensionContext) {
        this.debugFile = new DebugFile();
        context.subscriptions.push(workspace.registerTextDocumentContentProvider(DebugFile.schema, this.debugFile));
        context.subscriptions.push(AventusI18nEditor.register(context));
        AutoLoader.getInstance();
        this.components = new AvenutsVsComponent();
        this._context = context;
        SettingsManager.getInstance();
        let serverOptions = this.createServerOption(context.asAbsolutePath(
            join('server', 'out', 'server.js')
        ));
        this.client = new LanguageClient('Aventus', 'Aventus', serverOptions, this.createClientOption(context));
        let oldHandle = this.client.handleFailedRequest;
        this.client.handleFailedRequest = <T>(type: MessageSignature, token: CancellationToken | undefined, error: any, defaultValue: T, showNotification: boolean = true, throwOnCancel: boolean = false) => {
            if (type.method == "codeAction/resolve") {
                // TODO search where the crash come from
                return defaultValue;
            }
            return oldHandle(type, token, error, defaultValue, showNotification)
        }
        this.addNotification();
        await this.client.start();

        workspace.onDidChangeConfiguration(() => {
            ReloadSettings.execute();
        })
    }
    public stop(): Thenable<void> | undefined {
        if (this.fileSystem) {
            this.fileSystem.stop();
        }
        if (this.client) {
            return this.client.stop();
        }
        return undefined;
    }
    public startFileSystem() {
        this.fileSystem = new FileSystem();
    }

    private createServerOption(serverEntryPath: string): ServerOptions {
        // The debug options for the server
        // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
        const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

        // If the extension is launched in debug mode then the debug server options are used
        // Otherwise the run options are used
        return {
            run: { module: serverEntryPath, transport: TransportKind.ipc },
            debug: {
                module: serverEntryPath,
                transport: TransportKind.ipc,
                options: debugOptions
            },
        };
    }
    private createClientOption(context: ExtensionContext): LanguageClientOptions {
        return {
            // Register the server for plain text documents
            documentSelector: [
                { scheme: 'file', language: "Aventus Ts" },
                { scheme: 'file', language: "Aventus HTML" },
                { scheme: 'file', language: 'Aventus SCSS' },
                { scheme: 'file', language: 'Aventus WebComponent' },
                { scheme: 'file', language: 'Aventus I18n' },
            ],
            middleware: {
                executeCommand: async (command, args, next) => {
                    let newArgs = await this.commandMiddleware(command, args);
                    if (newArgs != null) {
                        next(command, newArgs);
                    }
                },
                provideCodeActions(this, document, range, context, token, next) {
                    return next(document, range, context, token);
                },
                resolveCodeAction(item, token, next) {
                    return next(item, token);
                },
                async provideDefinition(document, position, token, next) {
                    const result = await next(document, position, token);
                    if (result) {
                        const load = async (uri: string, range: Range2) => {
                            if (uri.endsWith(".i18n.avt")) {
                                const key = await GetKeyFromPosition.execute(uri, range);
                                if (key) {
                                    AventusI18nEditor.filtersByUri[uri] = key;
                                }
                            }
                        }
                        if (!Array.isArray(result)) {
                            await load(result.uri.toString(), result.range)
                        }
                        else {
                            for (let el of result) {
                                if (LocationLink.is(el)) {
                                    const link = el as LocationLink;
                                    await load(link.targetUri.toString(), link.targetRange)
                                }
                                else {
                                    const loc = el as Location;
                                    await load(loc.uri.toString(), loc.range)
                                }
                            }
                        }
                    }
                    return result;
                },
                async provideCodeLenses(document, token, next) {
                    let codeLenses = await next(document, token);
                    if (codeLenses) {
                        for (let codeLens of codeLenses) {
                            if (codeLens.command && codeLens.command.command == "editor.action.showReferences" && codeLens.command.arguments) {
                                codeLens.command.arguments[0] = Uri.parse(codeLens.command.arguments[0]);
                                if (codeLens.command.arguments.length > 1) {
                                    codeLens.command.arguments[1] = new Position(codeLens.command.arguments[1].line, codeLens.command.arguments[1].character);
                                }
                                if (codeLens.command.arguments.length > 2) {
                                    let locations: Location[] = []
                                    for (let location of codeLens.command.arguments[2]) {
                                        locations.push(new Location(Uri.parse(location.uri), new Range(location.range.start, location.range.end)));
                                    }
                                    codeLens.command.arguments[2] = locations;
                                }
                            }
                        }
                    }
                    return codeLenses;
                },

            },
            initializationOptions: {
                savePath: context.globalStorageUri.fsPath,
                extensionPath: context.extensionPath,
            },
        };
    }

    private async commandMiddleware(command: string, args: any[]): Promise<any[] | null> {
        let result: any[] = args;
        if (Commands.allCommandes[command]) {
            result = await Commands.allCommandes[command].middleware(args);
        }
        return result;
    }

    private addNotification() {
        if (this.client) {
            for (let cmdName in Notifications.allNotifications) {
                this.client.onNotification(cmdName, (params) => {
                    (Notifications.allNotifications[cmdName].action as any).call(Notifications.allNotifications[cmdName], ...params)
                });
            }

            for (let command in CommandsInternal.allCommandes) {
                commands.registerCommand(command, CommandsInternal.allCommandes[command].middleware)
            }
        }
    }

    public sendRequest<U>(channel: string, body: any) {
        return this.client!.sendRequest<U>(channel, body);
    }


    public initDone() {
        this._isInit = true;
        const cbs = [...this.initCbs];
        for (let cb of cbs) {
            cb();
        }
    }
    private initCbs: (() => any)[] = []
    public onInit(cb: () => any) {
        if (this.isInit) {
            cb();
        }
        else {
            this.initCbs.push(cb)
        }
    }
    public waitInit(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.onInit(resolve);
        });
    }
}