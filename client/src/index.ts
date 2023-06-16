/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import { ExtensionContext } from "vscode";
import { Singleton } from "./Singleton";


export function activate(context: ExtensionContext) {
	Singleton.client.init(context);
}

export function deactivate(): Thenable<void> | undefined {
	return Singleton.client.stop();
}
