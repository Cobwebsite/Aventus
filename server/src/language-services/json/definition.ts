export interface AventusConfigBuild {
	fullname: string,
	description?: string,
	tags: string[]
	name?: string,
	version: string,
	readme?: string,
	repository?: string,
	documentation?: string,
	organization?: string,
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
	rawDependances: { [name: string]: AventusConfigBuildDependance },
	dependances: { [name: string]: AventusConfigBuildDependance },
	nodeModulesDir: string,
	i18n?: AventusConfigBuildI18n
}
export type IncludeType = 'none' | 'need' | 'full';


export interface AventusConfigBuildCompile {
	input?: string[],
	inputPathRegex: RegExp,
	output: string[],
	package: string[],
	outputNpm: AventusConfigBuildCompileOutputNpm,
	compressed?: boolean,
	i18n: AventusConfigBuildCompileOutputI18n[]
}

export interface AventusConfigBuildCompileOutputNpmManifest {
	srcBaseUrl?: string
}
export interface AventusConfigBuildCompileOutputNpm {
	path: string[],
	packageJson: boolean,
	npmName: string,
	manifest?: AventusConfigBuildCompileOutputNpmManifest,
	live: boolean
}
export interface AventusConfigBuildCompileOutputI18n {
	output: string,
	mount: string,
	mode: 'singleFile' | 'oneToOne' | 'groupComponent' | 'basedOnAttribute' | 'include'
}

export interface AventusConfigBuildDependance {
	uri?: string,
	npm?: string,
	version?: string,
	include?: IncludeType,
	subDependancesInclude?: { // define how to include children, you can specify each dependance here or add a star as name to define globaly
		[name: string]: IncludeType
	},
	isLocal?: boolean
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
	description?: string,
	tags: string[],
	organization?: string,
	readme?: string,
	repository?: string,
	documentation?: string,
	dependances: { [name: string]: AventusConfigBuildDependance },
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

export interface AventusConfigBuildI18n {
	locales: string[],
	fallback: string,
	autoRegister?: boolean
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
	routerName?: string,
	uri?: string,
	host?: string,
	parent?: string,
	parentFile?: string,
	namespace?: string
}

interface AventusSharpWsEndPoint {
	prefix?: string,
}

export interface AventusPhp {
	output: string,
	exportAsTs?: boolean,
	useNamespace?: boolean,
	exportEnumByDefault?: boolean,
	exportStorableByDefault?: boolean,
	exportHttpRouteByDefault?: boolean,
	exportErrorsByDefault?: boolean,
	exportWsEndPointByDefault?: boolean,
	exportWsEventByDefault?: boolean,
	exportWsRouteByDefault?: boolean,
	replacer?: {
		all?: AventusPhpReplacerPart
		genericError?: AventusPhpReplacerPart
		httpRouter?: AventusPhpReplacerPart
		normalClass?: AventusPhpReplacerPart
		storable?: AventusPhpReplacerPart
		withError?: AventusPhpReplacerPart
		httpRequest?: AventusPhpReplacerPart
		httpResource?: AventusPhpReplacerPart
	},
	httpRouter?: AventusPhpHttpRouter,
}

interface AventusPhpReplacerPart {
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

interface AventusPhpHttpRouter {
	createRouter?: boolean,
	routerName?: string,
	uri?: string,
	host?: string,
	parent?: string,
	parentFile?: string,
	namespace?: string
}