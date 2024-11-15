import { createPrompt, useKeypress, useState } from '@inquirer/core';
import { isExitKey } from './tools'

export type LogConfig = {
	errors: string[];
	refresh: (cb: (errors: string[]) => void) => void
	stopRefresh: (cb: (errors: string[]) => void) => void
};

export default createPrompt<void, LogConfig>((config, done) => {
	const [errors, setErrors] = useState<string[]>(config.errors);

	config.refresh(setErrors);

	useKeypress(async (key, rl) => {
		if (isExitKey(key)) {
			config.stopRefresh(setErrors);
			done();
		}

	});

	if(errors.length == 0) {
		return "No error";
	}

	return errors.join("\r\n");
});

