import { Diagnostic } from 'vscode-languageserver';
import { HTMLDoc } from '../../../html/helper/definition';
import { SCSSDoc } from '../../../scss/helper/CSSNode';
import { CompileTsResult } from '../../LanguageService';
import { ClassInfo } from '../../parser/ClassInfo';
import { PropertyInfo } from '../../parser/PropertyInfo';


export interface CompileComponentResult {
	diagnostics: Diagnostic[],
	writeCompiled: Boolean,
	missingViewElements: { position: number, elements: { [name: string]: string } },
	missingMethods: { position: number, elements: string[] },
	componentName: string, // this is the className
	htmlDoc: HTMLDoc,
	scssDoc: SCSSDoc
	result: CompileTsResult[],
	debug: string,
	needRebuild: boolean
}

export type FieldType = 'Attribute' | 'Property' | 'Signal' | 'Watch' | 'ViewElement' | 'Simple';


export const ListCallbacks: string[] = ["Callback", "Aventus.Callback", "CallbackGroup", "Aventus.CallbackGroup"];

export class CustomFieldModel extends PropertyInfo {
	public propType: FieldType = 'Simple';
	public inParent: boolean = false;
	public arguments?: any[];
}
declare interface DebuggerConfig {
	writeCompiled?: boolean,
	enableWatchHistory?: boolean,
}
declare interface OverrideViewConfig {
	enable: boolean,
	removeViewVariables: string[]
}
export declare interface CustomClassInfo {
	debuggerOption: DebuggerConfig,
	overrideView: OverrideViewConfig
}
export declare interface ItoPrepare {
	variablesInView: {},
	eventsPerso: toPrepareEventPerson[],
	pressEvents: {},
	allFields: { [key: string]: CustomFieldModel },
	loop: {},
	actionByComponent: { [key: string]: toPrepareActionByComponent[] },
	idElement: 0,
	style: string,
	script: ClassInfo,
	view: string,

}
export declare interface toPrepareActionByComponent {
	componentId: string,
	prop?: string,
	value: string
}
export declare interface toPrepareEventPerson {
	componentId: string,
	value: string,
	event: string
}



export const configTS = {
	"noImplicitOverride": false,
	"target": "ES6"
}
export type CustomTypeAttribute = "Date" | 'DateTime' | 'string' | 'number' | 'boolean';
export const TYPES = {
	date: 'Date',
	datetime: 'DateTime',
	string: 'string',
	number: 'number',
	boolean: 'boolean',
	literal: 'literal'
}

