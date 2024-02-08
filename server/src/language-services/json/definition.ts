export interface AventusConfigBuild {
	fullname: string,
	name: string,
	version: string,
	disabled: boolean,
	hideWarnings: boolean,
	src: string[],
	srcPathRegex: RegExp,
	compile: AventusConfigBuildCompile[],
	outsideModule: string[],
	outsideModulePathRegex: RegExp,
	module: string,
	componentPrefix: string,
	namespaceStrategy: 'manual' | 'followFolders' | 'followFoldersCamelCase' | 'rules'
	namespaceRules: { [namespace: string]: string[] },
	namespaceRulesRegex: { [namespace: string]: RegExp },
	namespaceRoot: string,
	avoidParsingInsideTags: string[],
	dependances: AventusConfigBuildDependance[],
	nodeModulesDir: string
}
export type IncludeType = 'none' | 'need' | 'full';


export interface AventusConfigBuildCompile {
	input?: string[],
	inputPathRegex: RegExp,
	output: string[],
	package: string[],
	compressed?: boolean,
}

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
	input: string,
	inputPathFolder: string,
	output: string[]
	outputPathFolder: string[],
}
export interface AventusConfig {
	version: string,
	componentPrefix: string,
	hideWarnings: boolean,
	module: string;
	dependances: AventusConfigBuildDependance[],
	build: AventusConfigBuild[],
	static: AventusConfigStatic[],
	namespaceStrategy: 'manual' | 'followFolders' | 'followFoldersCamelCase' | 'rules'
	namespaceRules: { [namespace: string]: string[] },
	namespaceRulesRegex: { [namespace: string]: RegExp },
	namespaceRoot: string,
	avoidParsingInsideTags: string[],
	aliases: {
		[alias: string]: string
	}
}