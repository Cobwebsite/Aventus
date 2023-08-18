export interface AventusConfigBuild {
	fullname: string,
	name: string,
	version: string,
	disabled: boolean,
	hideWarnings: boolean,
	inputPath: string[],
	inputPathRegex: RegExp,
	outsideModulePath: string[],
	outsideModulePathRegex: RegExp,
	outputFile: string,
	outputPackage: string,
	module: string,
	componentPrefix: string,
	namespaceStrategy: 'manual' | 'followFolders' | 'rules'
	namespaceRules: { [namespace: string]: string[] },
	namespaceRulesRegex: { [namespace: string]: RegExp },
	namespaceRoot: string,
	avoidParsingInsideTags: string[],
	dependances: AventusConfigBuildDependance[],
	componentStyle: {
		name: string,
		path: string,
		outputFile?: string,
	}[],
	compressed: boolean
}
export type IncludeType = 'none' | 'need' | 'full';

export interface AventusConfigBuildDependance {
	uri: string,
	version: string,
	include: IncludeType,
	subDependancesInclude: { // define how to include children, you can specify each dependance here or add a star as name to define globaly
		[name: string]: IncludeType
	}
}
export interface AventusConfigStatic {
	name: string,
	inputPath: string,
	inputPathFolder: string,
	outputPath: string
	outputPathFolder: string,
}
export interface AventusConfig {
	version: string,
	componentPrefix: string,
	hideWarnings: boolean,
	module: string;
	build: AventusConfigBuild[],
	static: AventusConfigStatic[],
	avoidParsingInsideTags: string[],
	aliases: {
		[alias: string]: string
	}
}