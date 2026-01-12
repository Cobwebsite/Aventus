"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericConnection = void 0;
const node_1 = require("vscode-languageserver/node");
const cmds_1 = require("../../server/out/cmds");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const GenericServer_1 = require("../../server/out/GenericServer");
const AskInput_1 = require("../../server/out/notification/AskInput");
const AskSelect_1 = require("../../server/out/notification/AskSelect");
const AskSelectMultiple_1 = require("../../server/out/notification/AskSelectMultiple");
const Popup_1 = require("../../server/out/notification/Popup");
const FilesManager_1 = require("../../server/out/files/FilesManager");
const definition_1 = require("../../server/out/definition");
const SetSettings_1 = require("../../server/out/notification/SetSettings");
const path_1 = require("path");
class GenericConnection {
    _connection;
    documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
    constructor() {
        this._connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
        this.addDocumentsAction();
    }
    addDocumentsAction() {
        this.documents.onDidChangeContent(async (e) => {
            if (GenericServer_1.GenericServer.isAllowed(e.document)) {
                FilesManager_1.FilesManager.getInstance().onContentChange(e.document);
            }
        });
        this.documents.onDidSave((e) => {
            if (GenericServer_1.GenericServer.isAllowed(e.document)) {
                FilesManager_1.FilesManager.getInstance().preventUpdateUri(e.document.uri);
                FilesManager_1.FilesManager.getInstance().onSave(e.document);
            }
        });
        this.documents.onDidClose(e => {
            if (GenericServer_1.GenericServer.isAllowed(e.document)) {
                FilesManager_1.FilesManager.getInstance().onClose(e.document);
            }
        });
    }
    open() {
        // Make the text document manager listen on the connection
        // for open, change and close text document events
        this.documents.listen(this._connection);
        // Listen on the connection
        this._connection.listen();
    }
    delayBetweenBuild() {
        return 300;
    }
    async getSettings() {
        return this._connection.workspace.getConfiguration({
            section: "aventus",
        });
    }
    async setSettings(settings, global) {
        await SetSettings_1.SetSettings.send(settings, global);
    }
    async getSettingsHtml() {
        return this._connection.workspace.getConfiguration({
            section: "html",
        });
    }
    sendNotification(cmd, params) {
        this._connection.sendNotification(cmd, params);
    }
    showErrorMessage(msg) {
        this._connection.window.showErrorMessage(msg);
    }
    showWarningMessage(msg) {
        this._connection.window.showWarningMessage(msg);
    }
    showInformationMessage(msg) {
        this._connection.window.showInformationMessage(msg);
    }
    sendDiagnostics(params, build) {
        this._connection.sendDiagnostics(params);
    }
    onInitialize(cb) {
        this._connection.onInitialize((params) => {
            let extensionPath = (0, path_1.dirname)(__dirname);
            if (__filename.endsWith("GenericConnection.js")) {
                // dev
                extensionPath = (0, path_1.dirname)((0, path_1.dirname)(__dirname));
            }
            cb({
                workspaceFolders: params.workspaceFolders ?? null,
                savePath: params.initializationOptions.savePath,
                extensionPath: extensionPath,
                isIDE: false,
            });
            return {
                capabilities: {
                    textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
                    // Tell the client that the server supports code completion
                    completionProvider: {
                        resolveProvider: true,
                        // triggerCharacters: ['.'],
                    },
                    executeCommandProvider: {
                        commands: Object.keys(cmds_1.Commands.allCommandes)
                    },
                    hoverProvider: {},
                    definitionProvider: {},
                    documentFormattingProvider: {},
                    codeActionProvider: {
                        codeActionKinds: [node_1.CodeActionKind.QuickFix],
                        resolveProvider: true,
                    },
                    referencesProvider: {},
                    codeLensProvider: {
                        resolveProvider: true,
                    },
                    renameProvider: true,
                    colorProvider: {
                        documentSelector: [{ language: definition_1.AventusLanguageId.SCSS }, { language: definition_1.AventusLanguageId.WebComponent }]
                    },
                }
            };
        });
    }
    onInitialized(cb) {
        this._connection.onInitialized(async () => {
            await cb();
        });
    }
    onShutdown(cb) {
        this._connection.onShutdown(async () => {
            await cb();
        });
    }
    onCompletion(cb) {
        this._connection.onCompletion(async (params, token) => {
            const document = this.documents.get(params.textDocument.uri);
            return await cb(document, params.position);
        });
    }
    onCompletionResolve(cb) {
        this._connection.onCompletionResolve(async (completionItem, token) => {
            if (completionItem.data?.uri) {
                const document = this.documents.get(completionItem.data.uri);
                return cb(document, completionItem);
            }
            return completionItem;
        });
    }
    onHover(cb) {
        this._connection.onHover(async (params, token) => {
            const document = this.documents.get(params.textDocument.uri);
            return await cb(document, params.position);
        });
    }
    onDefinition(cb) {
        this._connection.onDefinition(async (params, token) => {
            const document = this.documents.get(params.textDocument.uri);
            const result = await cb(document, params.position);
            if (!result)
                return result;
            if (result.length == 1)
                return result[0];
            return result;
        });
    }
    onDocumentFormatting(cb) {
        this._connection.onDocumentFormatting(async (params, token) => {
            const document = this.documents.get(params.textDocument.uri);
            return await cb(document, params.options);
        });
    }
    onCodeAction(cb) {
        this._connection.onCodeAction(async (params, token) => {
            const document = this.documents.get(params.textDocument.uri);
            return await cb(document, params.range);
        });
    }
    onCodeLens(cb) {
        this._connection.onCodeLens(async (params, token) => {
            const document = this.documents.get(params.textDocument.uri);
            return await cb(document);
        });
    }
    onReferences(cb) {
        this._connection.onReferences(async (params) => {
            const document = this.documents.get(params.textDocument.uri);
            return await cb(document, params.position);
        });
    }
    onRenameRequest(cb) {
        this._connection.onRenameRequest(async (params) => {
            const document = this.documents.get(params.textDocument.uri);
            return await cb(document, params.position, params.newName);
        });
    }
    onDocumentColor(cb) {
        this._connection.onDocumentColor(async (params) => {
            const document = this.documents.get(params.textDocument.uri);
            return await cb(document);
        });
    }
    onColorPresentation(cb) {
        this._connection.onColorPresentation(async (params) => {
            const document = this.documents.get(params.textDocument.uri);
            return await cb(document, params.range, params.color);
        });
    }
    onExecuteCommand(cb) {
        this._connection.onExecuteCommand(async (params) => {
            await cb(params);
        });
    }
    onDidChangeConfiguration(cb) {
        this._connection.onDidChangeConfiguration(async (params) => {
            await cb();
        });
    }
    onRequest(cb) {
        this._connection.onRequest(async (channel, params) => {
            return await cb(channel, params);
        });
    }
    async Input(options) {
        return await AskInput_1.AskInput.send(options);
    }
    async Select(items, options) {
        return await AskSelect_1.AskSelect.send(items, options);
    }
    async SelectMultiple(items, options) {
        return await AskSelectMultiple_1.AskSelectMultiple.send(items, options);
    }
    async Popup(text, ...choices) {
        return await Popup_1.Popup.send(text, ...choices);
    }
    async SelectFolder(text, path) {
        return null;
    }
}
exports.GenericConnection = GenericConnection;
//# sourceMappingURL=GenericConnection.js.map