import { CancellationToken, Event, ProviderResult, TextDocumentContentProvider, Uri, EventEmitter } from 'vscode'


export class DebugFile implements TextDocumentContentProvider {

	public static schema: string = "avdebug";

	private documents: { [uri: string]: string } = {}

	public constructor() {

	}
	onDidChangeEmitter = new EventEmitter<Uri>();
	onDidChange?: Event<Uri> | undefined = this.onDidChangeEmitter.event;
	provideTextDocumentContent(uri: Uri, token: CancellationToken): ProviderResult<string> {
		return this.documents[uri.path];
	}

	public register(uri: string, content: string) {
		this.documents[uri] = content;
	}

	public remove(uri: string) {
		delete this.documents[uri];
	}
}