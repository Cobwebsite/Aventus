import { Disposable, ProviderResult, Uri, UriHandler, window } from 'vscode';
import { StoreDownloadTemplate } from './cmds/store/DownloadTemplate';

export class ProtocolHandler implements UriHandler {

	private disposable: Disposable;

	constructor() {
		this.disposable = window.registerUriHandler(this);
	}


	handleUri(uri: Uri): ProviderResult<void> {
		if (uri.path == "/template/download") {
			this.downloadTemplate(uri);
		}
	}

	private downloadTemplate(uri: Uri) {
		const queryParams = new URLSearchParams(uri.query);
		const url = queryParams.get('url');
		if (url) {
			StoreDownloadTemplate.execute(url);
		}
	}

	public dispose(): void {
		this.disposable.dispose();
	}
}