export interface AventusConfigBuild {
	fullname: string,
	name: string,
	version: string,
	disabled: boolean,
	hideWarnings: boolean,
	src: string[],
	srcPath: string[],
	stories: AventusConfigBuildStories | undefined,
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
	outputNpm: AventusConfigBuildCompileOutputNpm,
	compressed?: boolean,
}

export interface AventusConfigBuildCompileOutputNpm {
	path: string[],
	packageJson: boolean,
	npmName: string
}

export interface AventusConfigBuildDependance {
	uri: string,
	npm: string,
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
export interface AventusConfigBuildStories {
	output: string,
	workspace?: string,
	format?: "all" | "public" | "protected" | "manual",
	live?: boolean,
	prefix?: string,
	srcBaseUrl?: string
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

export interface AventusSharp {
	csProj: string,
	outputPath: string,
	exportEnumByDefault?: boolean,
	exportStorableByDefault?: boolean,
	exportHttpRouteByDefault?: boolean,
	exportErrorsByDefault?: boolean,
	exportWsEndPointByDefault?: boolean,
	exportWsEventByDefault?: boolean,
	exportWsRouteByDefault?: boolean,
	replacer?: {
		all?: AventusSharpReplacerPart
		genericError?: AventusSharpReplacerPart
		httpRouter?: AventusSharpReplacerPart
		normalClass?: AventusSharpReplacerPart
		storable?: AventusSharpReplacerPart
		withError?: AventusSharpReplacerPart
		wsEndPoint?: AventusSharpReplacerPart
		wsEvent?: AventusSharpReplacerPart
		wsRouter?: AventusSharpReplacerPart
	},
	httpRouter?: AventusSharpHttpRouter,
	wsEndpoint?: AventusSharpWsEndPoint
}

interface AventusSharpReplacerPart {
	type: {
		[key: string]: {
			result: string,
			file?: string,
			useTypeImport?: boolean,
		}
	}
	result: {
		[key: string]: {
			result: string,
			file?: string,
			useTypeImport?: boolean,
		}
	}
}


interface AventusSharpHttpRouter {
	createRouter?: boolean,
	autobindRoute?: AventusSharpHttpRouterAutoBind,
	routerName?: string,
	variableRoutesName?: string,
	uri?: string,
	host?: string,
	parent?: string,
	namespace?: string
}

enum AventusSharpHttpRouterAutoBind {
	none,
	auto,
	full,
}

interface AventusSharpWsEndPoint {
	prefix?: string,
}