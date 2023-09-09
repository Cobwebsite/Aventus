/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { join, dirname, sep } from 'path';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { GenericServer } from '../../GenericServer';

const contents: { [name: string]: string } = {};




const serverFolder = () => GenericServer.extensionPath;
export const TYPESCRIPT_LIB_SOURCE = () => join(serverFolder(), 'node_modules/typescript/lib');
export const AVENTUS_DEF_BASE_PATH = () => join(serverFolder(), 'lib/Aventus@Main.package.avt');
export const AVENTUS_DEF_UI_PATH = () => join(serverFolder(), 'lib/Aventus@UI.package.avt');
export const AVENTUS_DEF_SHARP_PATH = () => join(serverFolder(), 'lib/Aventus@Sharp.package.avt');
const NODE_MODULES = () =>join(serverFolder(), 'node_modules');

const libsTypescript: string[] = [];

export function loadTypescriptLib(){
	if(libsTypescript.length > 0) {
		return;
	}
	let files = readdirSync(TYPESCRIPT_LIB_SOURCE());
	for (let file of files) {
		if (file.endsWith(".d.ts")) {
			libsTypescript.push(file);
		}
	}
}

export function loadLibrary(name: string): string {
	let content = contents[name];
	if (typeof content === 'string') {
		return content;
	}

	let libPath;
	let showError = true;
	if (name.startsWith("custom://@types")) {
		libPath = join(NODE_MODULES(), name.replace("custom://@types", "@types"));
		showError = false;
	}
	else if (name.startsWith("file:///")) {
		if (sep === "/") {
			libPath = decodeURIComponent(name.replace("file://", ""));
		}
		else {
			libPath = decodeURIComponent(name.replace("file:///", ""));
		}

		if (libPath.indexOf("/node_modules/@typescript") != -1) {
			//showError = false;
		}
		else if (libPath.indexOf("/node_modules/@types/typescript__") != -1) {
			//showError = false;
		}
		else {
			showError = false;
		}
	}
	else if(name.startsWith("node_modules/@types/typescript__")){
		showError = false;
	}
	else if(libsTypescript.includes(name)) {
		libPath = join(TYPESCRIPT_LIB_SOURCE(), name); // from source
	}

	if (typeof content !== 'string') {
		if (existsSync(libPath)) {
			content = readFileSync(libPath).toString();
		}
		else if (showError) {
			console.error(`Unable to load library ${name} at ${libPath}`);
		}
		if (content !== undefined) {
			contents[name] = content;
		}
	}
	return content;
}


// function getServerFolder() {
// 	if (process.env["aventus_server_folder"]) {
// 		return process.env["aventus_server_folder"];
// 	}
// 	if (__dirname.endsWith("ts")) {
// 		// dev
// 		return dirname(dirname(dirname(dirname(__dirname))));
// 	}
// 	// prod
// 	return dirname(dirname(__dirname));
// }