import { createPrompt, useEffect, useKeypress, useMemo, useState } from '@inquirer/core';
import { isExitKey } from './tools';
import type { CliErrors, CliErrorsBuild } from '../../server/Connection';
import { DiagnosticSeverity } from 'vscode-languageserver';

export type LogConfig = {
	errors: CliErrors;
	refresh: (cb: (errors: CliErrorsBuild, build: string) => void) => void;
	stopRefresh: (cb: (errors: CliErrorsBuild, build: string) => void) => void;
};

export default createPrompt<void, LogConfig>((config, done) => {
	let baseError = config.errors[''] ?? {};
	const [errors, setErrors] = useState<CliErrorsBuild>({ ...baseError });

	useEffect(() => {
		let delayTimeout: NodeJS.Timeout;

		const refresh = (newErrors: CliErrorsBuild, newBuild: string) => {
			clearTimeout(delayTimeout);
			delayTimeout = setTimeout(() => {
				setErrors({ ...newErrors });
			}, 300);
		};

		config.refresh(refresh);

		return () => {
			clearTimeout(delayTimeout); 
			config.stopRefresh(refresh);
		};
	}, [config]);



	const renderTxt = useMemo(() => {
		const errorsTxt: string[] = [];
		const errorsTemp: CliErrorsBuild = errors;

		for (let uri in errorsTemp) {
			for (let diagnostic of errorsTemp[uri]) {
				let sev = '';
				switch (diagnostic.severity) {
					case DiagnosticSeverity.Error:
						sev = '\x1b[31m[error]\x1b[0m';
						break;
					case DiagnosticSeverity.Warning:
						sev = '\x1b[33m[warning]\x1b[0m';
						break;
					case DiagnosticSeverity.Information:
						sev = '\x1b[34m[info]\x1b[0m';
						break;
					case DiagnosticSeverity.Hint:
						sev = '\x1b[90m[hint]\x1b[0m';
						continue;
				}
				errorsTxt.push(`${uri}:${diagnostic.range.start.line + 1} - ${sev} : ${diagnostic.message}`);
			}
		}

		if (errorsTxt.length === 0) {
			return 'No error';
		}
		return errorsTxt.join('\r\n');
	}, [errors]);

	useKeypress(async (key, rl) => {
		if (isExitKey(key)) {
			done();
		}
	});

	return renderTxt;
});
