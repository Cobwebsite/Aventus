import { CodeAction, Diagnostic, DiagnosticSeverity, FormattingOptions, getLanguageService, LanguageService, ObjectASTNode, Position, Range, TextEdit } from 'vscode-json-languageservice';
import { AventusErrorCode, AventusExtension } from '../../definition';
import { AventusFile } from '../../files/AventusFile';
import { createErrorI18n, createErrorI18nPos, createWarningI18nPos } from '../../tools';
import { AventusI18nSchema } from './schema';
import { AventusI18nFile, AventusI18nFileSrcParsed } from './File';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { GenericServer } from '../../GenericServer';
import { I18nParser } from './Parser';

export class AventusI18nLanguageService {
	public static readonly empty: string = "ⵌⵌ";

	private static instance: AventusI18nLanguageService;
	public static getInstance(): AventusI18nLanguageService {
		if (!this.instance) {
			this.instance = new AventusI18nLanguageService();
		}
		return this.instance;
	}

	private languageService: LanguageService;


	private constructor() {
		this.languageService = getLanguageService({

		});
		this.languageService.configure({
			allowComments: true,
			schemas: [
				{
					fileMatch: ["**" + AventusExtension.I18n],
					uri: AventusI18nSchema.$schema ?? '',
					schema: AventusI18nSchema
				},
			]
		});
	}

	public async validate(file: AventusI18nFile): Promise<Diagnostic[]> {
		let document = file.file.documentUser;
		let jsonDoc = this.languageService.parseJSONDocument(document);
		let errors = await this.languageService.doValidation(document, jsonDoc);
		const syntaxErrors = (jsonDoc as typeof jsonDoc & { syntaxErrors?: Diagnostic[] }).syntaxErrors;
		if (!jsonDoc.root || syntaxErrors?.length) {
			if (errors.length == 0) {
				errors.push(createErrorI18n(document, "Can't parse the json"));
			}
			return errors.map(error => ({ ...error, severity: DiagnosticSeverity.Error }));
		}
		try {
			const parsed = file.parsed ?? {};
			const locales = (file.build.buildConfig.i18n?.locales ?? []).filter(locale => !I18nParser.isReservedI18nLocale(locale));
			for (const property of jsonDoc.root.children ?? []) {
				if (property.type !== 'property') continue;
				const key = property.children?.[0];
				if (key && I18nParser.isReservedI18nLocale(String(key.value))) {
					errors.push(createErrorI18nPos(document, `Translation key ${key.value} is not allowed`, key.offset, key.offset + key.length));
				}
				if (property.children && property.children.length > 1) {
					const children = property.children[1].children ?? [];
					for (const localeProperty of children) {
						if (localeProperty.type !== 'property') continue;
						const locale = localeProperty.children[0];
						if (locale && I18nParser.isReservedI18nLocale(String(locale.value))) {
							errors.push(createErrorI18nPos(document, `Locale ${locale.value} is not allowed`, locale.offset, locale.offset + locale.length));
						}
					}
				}
			}

			for (let key in parsed) {
				if (file.isGlobal) {
					const otherFiles = file.build.tsLanguageService?.i18nFiles ?? {};
					const duplicates = Object.values(otherFiles).filter(other => other !== file && other.isGlobal && other.parsed && Object.hasOwn(other.parsed, key));
					if (duplicates.length > 0) {
						errors.push(
							createErrorI18nPos(
								document,
								`Duplicate translation key ${key} across global files`,
								parsed[key].keyStart,
								parsed[key].keyEnd
							)
						);
					}
				}
				for (let locale in parsed[key].locales) {
					const info = parsed[key].locales[locale];
					if (!locales.includes(locale)) {
						errors.push(createWarningI18nPos(file.file.documentUser, "Locale not needed", info.localeStart, info.localeEnd));
					}

					if (info.value == AventusI18nLanguageService.empty) {
						errors.push(createWarningI18nPos(file.file.documentUser, "Translation not set", info.valueStart, info.valueEnd));
					}
				}

				const missing: string[] = [];
				for (let locale of locales) {
					if (parsed[key].locales[locale] === undefined) {
						missing.push(locale);
					}
				}
				if (missing.length > 0) {
					errors.push(createErrorI18nPos(file.file.documentUser, "Missing locales " + missing.join(", "), parsed[key].keyStart, parsed[key].keyEnd));
				}
			}

			return errors;
		}
		catch (e) {
			if (errors.length == 0) {
				errors.push(createErrorI18n(document, "Can't parse the json"))
			}
		}
		for (let error of errors) {
			error.severity = DiagnosticSeverity.Error;
		}
		return errors;
	}

	public async format(file: AventusFile, range: Range, options: FormattingOptions): Promise<TextEdit[]> {
		try {
			let txt: string;
			try {
				const obj = JSON.parse(file.contentUser);
				txt = JSON.stringify(this.sortObj(obj), null, 4);
			} catch {
				const jsonDocument = this.languageService.parseJSONDocument(file.documentUser);
				const root = jsonDocument.root;
				const syntaxErrors = (jsonDocument as typeof jsonDocument & { syntaxErrors?: Diagnostic[] }).syntaxErrors;
				if (!root || root.type !== 'object' || syntaxErrors?.length) return [];

				const sorted = file.contentUser.slice(0, root.offset) + this.sortJsoncObject(file.contentUser, root) +
					file.contentUser.slice(root.offset + root.length);
				const sortedDocument = TextDocument.create(file.uri, file.documentUser.languageId, file.documentUser.version, sorted);
				const edits = await this.languageService.format(sortedDocument, undefined, { tabSize: 4, insertSpaces: true });
				txt = TextDocument.applyEdits(sortedDocument, edits);
			}
			const txtEdit: TextEdit = {
				newText: txt,
				range: {
					start: file.documentUser.positionAt(0),
					end: file.documentUser.positionAt(file.contentUser.length),
				}
			}
			return [txtEdit];
		} catch {

		}
		return [];
	}

	private sortJsoncObject(source: string, node: ObjectASTNode): string {
		const properties = node.properties;
		let previousEnd = node.offset + 1;
		const entries: { key: string; text: string; }[] = [];
		for (const property of properties) {
			const value = property.valueNode;
			const prefix = this.removeJsoncComma(source.slice(previousEnd, property.offset));
			previousEnd = property.offset + property.length;
			let content = source.slice(property.offset, previousEnd);
			if (value?.type === 'object') {
				const start = value.offset - property.offset;
				content = content.slice(0, start) + this.sortJsoncObject(source, value) +
					content.slice(start + value.length);
			}
			entries.push({
				key: property.keyNode.value,
				text: prefix + content
			});
		}

		const tail = this.removeJsoncComma(source.slice(previousEnd, node.offset + node.length - 1));
		entries.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
		const obj = entries.map(entry => entry.text).join(',');
		return '{' + obj + tail + '}';
	}

	private removeJsoncComma(text: string): string {
		return text.replace(/^(\s*),/, '$1');
	}

	public async codeAction(file: AventusI18nFile, range: Range): Promise<CodeAction[]> {
		const result: CodeAction[] = [];
		try {
			const missingLocales = this.actionImportMissingLocales(file);
			if (missingLocales) {
				result.push(missingLocales);
			}
		}
		catch {
		}
		return result;
	}

	public sortObj(unordered: AventusI18nFileSrcParsed) {
		return AventusI18nLanguageService.sortObj(unordered);
	}
	public static sortObj(unordered: AventusI18nFileSrcParsed) {
		const ordered = Object.keys(unordered).sort().reduce(
			(obj, key) => {
				const temp = unordered[key];
				obj[key] = Object.keys(temp).sort().reduce(
					(obj2, key) => {
						obj2[key] = temp[key];
						return obj2;
					},
					{}
				);

				return obj;
			},
			{}
		);
		return ordered;
	}

	private actionImportMissingLocales(file: AventusI18nFile): CodeAction | undefined {
		const document = file.file.documentUser;
		const source = file.file.contentUser;
		const jsonDocument = this.languageService.parseJSONDocument(document);
		const syntaxErrors = (jsonDocument as typeof jsonDocument & { syntaxErrors?: Diagnostic[] }).syntaxErrors;
		const root = jsonDocument.root;
		if (root?.type !== 'object' || syntaxErrors?.length) {
			GenericServer.showErrorMessage('The i18n file is malformed. Fix its JSON before importing missing locales.');
			return undefined;
		}

		const edits: TextEdit[] = [];
		const locales = (file.build.buildConfig.i18n?.locales ?? []).filter(locale => !I18nParser.isReservedI18nLocale(locale));
		for (const property of root.properties) {
			if (I18nParser.isReservedI18nLocale(String(property.keyNode.value))) continue;
			const value = property.valueNode;
			if (value?.type !== 'object') continue;

			const missing = locales.filter(locale => !value.properties.some(existing => existing.keyNode.value === locale));
			if (missing.length === 0) continue;

			const first = value.properties[0];
			const offset = first?.offset ?? value.offset + 1;
			const lineStart = source.lastIndexOf('\n', offset - 1) + 1;
			const before = source.slice(lineStart, offset);
			const multiline = source.slice(value.offset, value.offset + value.length).includes('\n');
			const indent = first && /^\s*$/.test(before) ? before : '    ';
			const entries = missing.map(locale => `${JSON.stringify(locale)}: ${JSON.stringify(AventusI18nLanguageService.empty)}`);
			let newText: string;
			if (first) {
				if (multiline && /^\s*$/.test(before)) {
					newText = entries.join(',\n' + indent) + ',\n' + indent;
				} else {
					newText = entries.join(', ') + ', ';
				}
			} else if (multiline) {
				newText = '\n' + indent + entries.join(',\n' + indent) + '\n';
			} else {
				newText = entries.join(', ');
			}
			const position = document.positionAt(offset);
			edits.push({ newText, range: { start: position, end: position } });
		}
		if (edits.length === 0) return undefined;
		return {
			title: "Import missing locales",
			edit: { changes: { [file.file.uri]: edits } }
		};
	}

}
