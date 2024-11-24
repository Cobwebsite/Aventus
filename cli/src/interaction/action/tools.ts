import { KeypressEvent } from '@inquirer/core';

export function isExitKey(key:KeypressEvent) {
	return key.name == "l" && key.ctrl;
}