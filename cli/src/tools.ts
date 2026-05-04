import { sep } from 'path';

export function uriToPath(uri: string): string {
	if (sep === "/") {
		// linux system
		return decodeURIComponent(uri.replace("file://", ""));
	}
	return decodeURIComponent(uri.replace("file:///", ""));
}
export function pathToUri(path: string): string {
	if (path.startsWith("file://")) {
		return path;
	}
	let uriTemp = path[0].toLowerCase() + path.substring(1);
	uriTemp = normalizeUri(encodeURI(uriTemp.replace(/\\/g, '/')))
	if (sep === "/") {
		return "file://" + uriTemp;
	}
	return "file:///" + uriTemp;
}
export function normalizeUri(path: string) {
    return path
        .replace(/:/g, "%3A")
        .replace(/@/g, "%40")
}
export function normalizePath(path: string) {
    return path
        .replace(/%3A/g, ":")
        .replace(/%40/g, "@")
}

export function parseSize(size: number) {
	const k = 1024
	const dm = 2
	const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
	const i = size == 0 ? 0 : Math.floor(Math.log(size) / Math.log(k))

	return `${parseFloat((size / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}