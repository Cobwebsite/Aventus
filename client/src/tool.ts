import { sep } from 'path';

export function pathToUri(path: string): string {
    if (path.startsWith("file://")) {
        return path;
    }
    if (sep === "/") {
        return "file://" + encodeURI(path.replace(/\\/g, '/')).replace(":", "%3A");
    }
    return "file:///" + encodeURI(path.replace(/\\/g, '/')).replace(":", "%3A");
}
export function uriToPath(uri: string): string {
    if (sep === "/") {
        // linux system
        return decodeURIComponent(uri.replace("file://", ""));
    }
    return decodeURIComponent(uri.replace("file:///", ""));
}
export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
