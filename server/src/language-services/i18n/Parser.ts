import { getLanguageService } from 'vscode-json-languageservice';
import { TextDocument } from 'vscode-languageserver-textdocument';

export type I18nParsed = { [key: string]: I18nParsedItem };
export type I18nParsedItem = {
	key: string,
	keyStart: number,
	keyEnd: number,
	locales: { [locale: string]: I18nParsedItemLocale }
};
export type I18nParsedItemLocale = {
	locale: string,
	localeStart: number,
	localeEnd: number,

	value: string,
	valueStart: number,
	valueEnd: number,
};


export class I18nParser {
	public static parse(document: TextDocument) {
		const result: I18nParsed = {};
		const languageService = getLanguageService({});
		let jsonDoc = languageService.parseJSONDocument(document);
		let children = jsonDoc.root?.children ?? [];
		for (let child of children) {
			if (child.type == "property") {
				const keyObj = child.children?.[0];
				const valueObj = child.children?.[1];
				if (!keyObj || !valueObj || valueObj.type !== "object") {
					continue;
				}
				const locales = valueObj.children ?? [];

				const item: I18nParsedItem = {
					key: keyObj.value + '',
					keyStart: keyObj.offset,
					keyEnd: keyObj.offset + keyObj.length,
					locales: {}
				}

				for (let localeObj of locales) {
					if (localeObj.type == "property") {
						const localeKeyObj = localeObj.children?.[0];
						const localeValueObj = localeObj.children?.[1];
						if (!localeKeyObj || !localeValueObj) {
							continue;
						}
						const locale = localeKeyObj.value + '';
						const localeStart = localeKeyObj.offset;
						const localeEnd = localeStart + localeKeyObj.length;
						const value = localeValueObj.value + '';
						const valueStart = localeValueObj.offset;
						const valueEnd = valueStart + localeValueObj.length;

						item.locales[locale] = {
							locale,
							localeStart,
							localeEnd,

							value,
							valueStart,
							valueEnd
						}
					}
				}

				result[item.key] = item;
			}
		}

		return result;
	}
}
