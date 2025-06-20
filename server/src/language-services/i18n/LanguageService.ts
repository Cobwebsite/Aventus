import { CodeAction, Diagnostic, DiagnosticSeverity, FormattingOptions, getLanguageService, LanguageService, Position, Range, TextDocument, TextEdit } from 'vscode-json-languageservice';
import { AventusErrorCode, AventusExtension, AventusLanguageId } from '../../definition';
import { AventusFile } from '../../files/AventusFile';
import { createErrorI18n, createErrorI18nPos, createWarningI18nPos } from '../../tools';
import { AventusI18nSchema } from './schema';
import { AventusI18nFile, AventusI18nFileSrcParsed } from './File';

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
		if (errors.length == 0) {
			let configTxt = this.removeComments(document.getText());
			try {
				JSON.parse(configTxt);
				const parsed = file.parsed ?? {};
				const locales = file.build.buildConfig.i18n?.locales ?? [];

				for (let key in parsed) {
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
			const obj = JSON.parse(file.contentUser);
			const txt = JSON.stringify(this.sortObj(obj), null, 4);
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

	private removeComments(txt: string): string {
		let regex = /(\".*?\"|\'.*?\')|(\/\*.*?\*\/|\/\/[^(\r\n|\n)]*$)/gm
		txt = txt.replace(regex, (match, grp1, grp2) => {
			if (grp2) {
				let result = "";
				for (let i = 0; i < grp2.length; i++) {
					result += " "
				}
				return result;
			}
			return grp1;
		})
		return txt;
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
		let missing = false;
		const newEl = JSON.parse(JSON.stringify(file.parsedSrc));
		for (let key in file.parsedSrc) {
			let values = file.parsedSrc[key];
			const locales = file.build.buildConfig.i18n?.locales ?? [];
			for (let locale of locales) {
				if (values[locale] === undefined) {
					missing = true;
					newEl[key][locale] = AventusI18nLanguageService.empty;
				}
			}

		}
		if (missing) {
			const txt = JSON.stringify(this.sortObj(newEl), null, 4);
			return {
				title: "Import missing locales",
				edit: {
					changes: {
						[file.file.uri]: [{
							newText: txt,
							range: {
								start: file.file.documentUser.positionAt(0),
								end: file.file.documentUser.positionAt(file.file.contentUser.length),
							}
						}]
					}
				}
			};
		}
		return undefined;
	}

	public addValueToFile(file: AventusI18nFile, value: string) {
		const newEl = JSON.parse(JSON.stringify(file.parsedSrc));
		newEl[value] = {};
		const locales = file.build.buildConfig.i18n?.locales ?? [];
		const fallback = file.build.buildConfig.i18n?.fallback ?? 'en-GB'
		for (let locale of locales) {
			newEl[value][locale] = locale == fallback ? value : AventusI18nLanguageService.empty;
		}
		const txt = JSON.stringify(this.sortObj(newEl), null, 4);
		let newDocument = TextDocument.create(file.file.uri, AventusLanguageId.I18n, file.file.versionUser + 1, txt);
	}
}