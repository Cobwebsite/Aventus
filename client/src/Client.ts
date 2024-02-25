import { join } from "path";
import { ExtensionContext, Location, MarkdownString, Position, Range, Uri, commands, languages, workspace } from "vscode";
import { ExecuteCommandSignature, LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient";
import { Commands } from "./cmds";
import { AvenutsVsComponent } from "./component";
import { FileSystem } from './file-system/FileSystem';
import { Notifications } from "./notification";
import { DebugFile } from './file-system/DebugFile';
import { CommandsInternal } from './cmds-internal';
import { ReloadSettings } from './cmds/ReloadSettings';

export class Client {
    private _context: ExtensionContext | undefined = undefined;
    private client: LanguageClient | undefined = undefined;
    public components: AvenutsVsComponent | undefined = undefined;
    private fileSystem: FileSystem | undefined = undefined;
    public debugFile!: DebugFile;

    public get context() {
        return this._context;
    }


    public init(context: ExtensionContext) {
        this.debugFile = new DebugFile();
        context.subscriptions.push(workspace.registerTextDocumentContentProvider(DebugFile.schema, this.debugFile));
        
        this.components = new AvenutsVsComponent();
        this._context = context;
        let serverOptions = this.createServerOption(context.asAbsolutePath(
            join('server', 'out', 'server.js')
        ));
        this.client = new LanguageClient('Aventus', 'Aventus', serverOptions, this.createClientOption(context));
        this.client.onReady().then(() => {
            this.addNotification();
            workspace.onDidChangeConfiguration(() => {
                ReloadSettings.execute();
            })
        })
        // Start the client. This will also launch the server
        context.subscriptions.push(this.client.start());

       
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
                async provideCodeLenses(document, token, next) {
                    let codeLenses = await next(document, token);
                    if (codeLenses) {
                        for (let codeLens of codeLenses) {
                            if (codeLens.command && codeLens.command.command == "editor.action.showReferences" && codeLens.command.arguments) {
                                codeLens.command.arguments[0] = Uri.parse(codeLens.command.arguments[0]);
                                codeLens.command.arguments[1] = new Position(codeLens.command.arguments[1].line, codeLens.command.arguments[1].character);
                                let locations: Location[] = []
                                for (let location of codeLens.command.arguments[2]) {
                                    locations.push(new Location(Uri.parse(location.uri), new Range(location.range.start, location.range.end)));
                                }
                                codeLens.command.arguments[2] = locations;
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

            for(let command in CommandsInternal.allCommandes) {
                commands.registerCommand(command, CommandsInternal.allCommandes[command].middleware)
            }
        }
    }
}