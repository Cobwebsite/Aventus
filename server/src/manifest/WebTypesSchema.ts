export type RequiredContext =
	| {
		kind: string
		name: string
	}
	| {
		anyOf: RequiredContext[]
	}
	| {
		allOf: RequiredContext[]
	}
	| {
		not: RequiredContext
	}
/**
 * Language in which JavaScript objects types are specified.
 */
export type JsTypesSyntax = "typescript"
/**
 * Markup language in which descriptions are formatted.
 */
export type DescriptionMarkup = "html" | "markdown" | "none"
/**
 * A RegEx pattern to match whole content. Syntax should work with at least ECMA, Java and Python implementations.
 */
export type Pattern =
	| string
	| {
		regex?: string
		"case-sensitive"?: boolean
	}
/**
 * Since 2024.2. Custom package manager dependencies, which would enable context according to the rules of custom provider.
 */
export type CustomEnablementRules = string[]
/**
 * This interface was referenced by `undefined`'s JSON-Schema definition
 * via the `patternProperty` "^/[^/\n\r]+/[^/\n\r]+$".
 *
 * This interface was referenced by `NameConversionRulesSingle`'s JSON-Schema definition
 * via the `patternProperty` "^/[^/\n\r]+/[^/\n\r]+$".
 */
export type NameConverter =
	| "as-is"
	| "PascalCase"
	| "camelCase"
	| "lowercase"
	| "UPPERCASE"
	| "kebab-case"
	| "snake_case"
/**
 * This interface was referenced by `undefined`'s JSON-Schema definition
 * via the `patternProperty` "^/[^/\n\r]+/[^/\n\r]+$".
 *
 * This interface was referenced by `undefined`'s JSON-Schema definition
 * via the `patternProperty` "^/[^/\n\r]+/[^/\n\r]+$".
 *
 * This interface was referenced by `NameConversionRulesMultiple`'s JSON-Schema definition
 * via the `patternProperty` "^/[^/\n\r]+/[^/\n\r]+$".
 */
export type NameConverters = NameConverter[]
/**
 * Relative path to the icon representing the symbol or actual SVG of the icon.
 */
export type Icon = string
/**
 * Contains contributions to HTML namespace. It's property names represent symbol kinds, its property values contain list of contributions of particular kind. There are 2 predefined kinds, which integrate directly with IDE - HTML elements and HTML attributes. There are also 2 deprecated kinds: tags (which is equivalent to 'elements') and 'events' (which was moved to JS namespace)
 */
export type Html = HtmlContributionsHost
export type HtmlElement = BaseContribution & HtmlContributionsHost
export type Name = string
/**
 * Short description to be rendered in documentation popup. It will be rendered according to description-markup setting.
 */
export type Description = string
/**
 * Link to online documentation.
 */
export type DocUrl = string
/**
 * Allows to specify the source of the entity. For Vue.js component this may be for instance a class.
 */
export type Source =
	| {
		/**
		 * Path to the file, relative to the web-types JSON.
		 */
		file: string
		/**
		 * Offset in the file under which the source symbol, like class name, is located.
		 */
		offset: number
	}
	| {
		/**
		 * Name of module, which exports the symbol. May be omitted, in which case it's assumed to be the name of the library.
		 */
		module?: string
		/**
		 * Name of the exported symbol.
		 */
		symbol: string
	}
/**
 * Version since this symbol is available.
 */
export type Since = string
/**
 * Specifies whether the symbol is deprecated. Deprecated symbol usage is discouraged, but still supported. Value can be a boolean or a string message with explanation and migration information.
 */
export type Deprecated = boolean | string
/**
 * Version in which this symbol was first deprecated.
 */
export type DeprecatedSince = string
/**
 * Specifies whether the symbol is obsolete. Obsolete symbols are no longer supported. Value can be a boolean or a string message with explanation and migration information.
 */
export type Obsolete = boolean | string
/**
 * Version in which this symbol was first made obsolete.
 */
export type ObsoleteSince = string
/**
 * Specifies whether the symbol is experimental. Value can be a boolean or a string message with explanation. Experimental symbols should be used with caution as the API might change.
 */
export type Experimental = boolean | string
export type Priority = "lowest" | "low" | "normal" | "high" | "highest"
export type Proximity = number
/**
 * Mark contribution as virtual. Virtual contributions can be filtered out if needed in references. A virtual contribution meaning may differ by framework or kind contexts, but usually means something synthetic or something, which gets erased in the runtime by the framework. E.g. Vue or Angular attribute bindings are virtual.
 */
export type Virtual = boolean
/**
 * Mark contribution as abstract. Such contributions serve only as super contributions for other contributions.
 */
export type Abstract = boolean
/**
 * Mark contribution as an extension. Such contributions do not define a new contribution on their own, but can provide additional properties or contributions to existing contributions.
 */
export type Extension = boolean
/**
 * A reference to an element in Web-Types model.
 */
export type Reference = ReferenceWithProps | string
export type NamePatternRoot = NamePattern | string
export type NamePattern =
	| {
		required?: Required
		unique?: boolean
		repeat?: boolean
		template?: NamePatternTemplate
		or?: NamePatternTemplate
		delegate?: Reference
		deprecated?: Deprecated
		priority?: Priority
		proximity?: Proximity
		items?: ListReference
	}
	| {
		regex: string
		"case-sensitive"?: boolean
	}
export type Required = boolean
export type NamePatternTemplate = [
	string | NamePatternTemplate | NamePattern,
	...(string | NamePatternTemplate | NamePattern)[]
]
/**
 * A reference to an element in Web-Types model.
 */
export type ListReference = Reference | Reference[]
/**
 * Contains contributions to CSS namespace. It's property names represent symbol kinds, its property values contain list of contributions of particular kind. There are predefined kinds, which integrate directly with IDE - properties, classes, functions, pseudo-elements, pseudo-classes and parts.
 */
export type Css = CssContributionsHost
export type CssProperty = BaseContribution & CssContributionsHost
export type CssPseudoElement = BaseContribution & CssContributionsHost
export type CssPseudoClass = BaseContribution & CssContributionsHost
export type CssGenericItem = BaseContribution & CssContributionsHost
/**
 * This interface was referenced by `CssContributionsHost`'s JSON-Schema definition
 * via the `patternProperty` "^(?!pattern$).*$".
 */
export type GenericCssContributions =
	| GenericCssContributionOrProperty
	| GenericCssContributionOrProperty[]
export type GenericCssContributionOrProperty =
	| string
	| number
	| boolean
	| GenericCssContribution
export type GenericCssContribution = GenericContribution & CssContributionsHost
/**
 * A generic contribution. All contributions are of this type, except for HTML attributes and elements, as well as predefined CSS contribution kinds.
 */
export type GenericContribution = TypedContribution
/**
 * The base for any contribution, which can possibly have a JS type.
 */
export type TypedContribution = BaseContribution
/**
 * Contains contributions to JS namespace. It's property names represent symbol kinds, its property values contain list of contributions of particular kind. There are 2 predefined kinds, which integrate directly with IDE - properties and events.
 */
export type Js = JsContributionsHost
export type GenericJsContribution = GenericContribution & JsContributionsHost
export type JsProperty = GenericContribution & JsContributionsHost
export type JsSymbol = TypedContribution & JsContributionsHost
/**
 * This interface was referenced by `JsContributionsHost`'s JSON-Schema definition
 * via the `patternProperty` "^(?!pattern$).*$".
 *
 * This interface was referenced by `JsGlobal`'s JSON-Schema definition
 * via the `patternProperty` "^(?!pattern$).*$".
 */
export type GenericJsContributions =
	| GenericJsContributionOrProperty
	| GenericJsContributionOrProperty[]
export type GenericJsContributionOrProperty =
	| string
	| number
	| boolean
	| GenericJsContribution
/**
 * Specify list of contribution kinds qualified with a namespace, for which during reference resolution this will be the final contribution host. E.g. if a special HTML element does not accept standard attributes, add:
 * "exclusive-contributions": ["/html/attributes"].
 */
export type ExclusiveContributions = string[]
export type HtmlAttribute = BaseContribution & HtmlContributionsHost
export type GenericHtmlContribution = GenericContribution &
	HtmlContributionsHost
/**
 * This interface was referenced by `HtmlContributionsHost`'s JSON-Schema definition
 * via the `patternProperty` "^(?!pattern$).*$".
 */
export type GenericHtmlContributions =
	| GenericHtmlContributionOrProperty
	| GenericHtmlContributionOrProperty[]
export type GenericHtmlContributionOrProperty =
	| GenericHtmlContribution
	| string
	| number
	| boolean

export interface JSONSchemaForWebTypes {
	$schema?: string
	/**
	 * Framework, for which the components are provided by the library. If the library is not enabled in a particular context, all symbols from this file will not be available as well. If you want symbols to be always available do not specify framework.
	 */
	framework?: string
	/**
	 * Since 2024.2. Specify contexts, which are required to enable contributions from this file.
	 */
	"required-context"?:
	| {
		kind: string
		name: string
	}
	| {
		anyOf: RequiredContext[]
	}
	| {
		allOf: RequiredContext[]
	}
	| {
		not: RequiredContext
	}
	/**
	 * Deprecated since 2024.2 because of ambiguous meaning - use "required-context" instead.
	 */
	context?:
	| {
		kind: string
		name: string
	}
	| {
		anyOf: RequiredContext[]
	}
	| {
		allOf: RequiredContext[]
	}
	| {
		not: RequiredContext
	}
	/**
	 * Name of the library.
	 */
	name: string
	/**
	 * Version of the library, for which Web-Types are provided.
	 */
	version: string
	"js-types-syntax"?: JsTypesSyntax
	"description-markup"?: DescriptionMarkup
	"framework-config"?: FrameworkConfig
	"contexts-config"?: ContextsConfig
	"default-icon"?: Icon
	/**
	 * Symbol can be contributed to one of the 3 namespaces - HTML, CSS and JS. Within a particular namespace there can be different kinds of symbols. In each of the namespaces, there are several predefined kinds, which integrate directly with IDE, but providers are free to define their own.
	 */
	contributions?: {
		html?: Html
		css?: Css
		js?: JsGlobal
	}
}
/**
 * Provide configuration for the specified web framework. This is an advanced feature, which is used to provide support for templating frameworks like Angular, Vue, Svelte, etc.
 */
export interface FrameworkConfig {
	"enable-when"?: EnablementRules
	"disable-when"?: DisablementRules
	/**
	 * In many frameworks symbols can have multiple versions of a name. Specify canonical name conversion rule for names of particular symbol kinds against which comparisons will be made. Format of the 'canonical-names' property names is '{namespace}/{symbol kind}'. By default symbol names in HTML namespace are converted to lower-case, and in CSS and JS namespaces are left as-is. In case of name patterns, rules are applied to each part of the pattern separately, so even if the symbol with pattern is in HTML namespace, references to JS events will be case-sensitive.
	 */
	"canonical-names"?: {
		[k: string]: NameConverter
	}
	/**
	 * Provide an array of name conversions, in which particular symbol kinds should be matched against canonical names of symbols. By default symbol names are converted using canonical-names rule.
	 */
	"match-names"?: {
		[k: string]: NameConverters
	}
	/**
	 * Provide an array of name conversions, in which particular symbol kinds should be proposed in auto completion. Format of the 'name-variants' property names is '{namespace}/{symbol kind}'. All symbol kinds are by default provided as-is.
	 */
	"name-variants"?: {
		[k: string]: NameConverters
	}
}
/**
 * Specify rules for enabling web framework support. Only one framework can be enabled in a particular file. If you need your contributions to be enabled in all files, regardless of the context, do not specify the framework.
 */
export interface EnablementRules {
	/**
	 * Node.js package names, which enable framework support within the folder containing the package.json.
	 */
	"node-packages"?: string[]
	/**
	 * Since 2024.2. Ruby gem names, which enable framework support within the particular Ruby module.
	 */
	"ruby-gems"?: string[]
	/**
	 * Extensions of files, which should have the framework support enabled. Use this to support custom file extensions like '.vue' or '.svelte'. Never specify generic extensions like '.html', '.js' or '.ts'. If you need your contributions to be present in every file don't specify the framework at all
	 */
	"file-extensions"?: string[]
	/**
	 * RegExp patterns to match file names, which should have the framework support enabled. Use carefully as broken pattern may even freeze IDE.
	 */
	"file-name-patterns"?: Pattern[]
	/**
	 * Global JavaScript libraries names enabled within the IDE, which enable framework support in the whole project
	 */
	"ide-libraries"?: string[]
	/**
	 * List of tool executables (without extension), which presence should be checked in the project. In case of Node projects, such tools will be searched in node_modules/.bin/
	 */
	"project-tool-executables"?: string[]
}
/**
 * Specify rules for disabling web framework support. These rules take precedence over enable-when rules. They allow to turn off framework support in case of some conflicts between frameworks priority.
 */
export interface DisablementRules {
	/**
	 * Extensions of files, which should have the framework support disabled
	 */
	"file-extensions"?: string[]
	/**
	 * RegExp patterns to match file names, which should have the framework support disabled
	 */
	"file-name-patterns"?: Pattern[]
}
/**
 * Provide configuration for Web Types contexts. This allows to contribute additional Web Types for example if a particular library is present in the project.
 */
export interface ContextsConfig {
	[k: string]: ContextKindConfig
}
export interface ContextKindConfig {
	/**
	 * Context kind. Only a single context of the particular kind will be enabled. An example of context kind is framework, which has dedicated support in Web Types.
	 */
	kind?: string
	/**
	 * Specify rules for enabling web framework support. Only one framework can be enabled in a particular file. If you need your contributions to be enabled in all files, regardless of the context, do not specify the framework.
	 */
	"enable-when"?: {
		/**
		 * Node.js package names, which enable framework support within the folder containing the package.json.
		 */
		"node-packages"?: string[]
		/**
		 * Since 2024.2. Ruby gem names, which enable framework support within the particular Ruby module.
		 */
		"ruby-gems"?: string[]
		/**
		 * Extensions of files, which should have the framework support enabled. Use this to support custom file extensions like '.vue' or '.svelte'. Never specify generic extensions like '.html', '.js' or '.ts'. If you need your contributions to be present in every file don't specify the framework at all
		 */
		"file-extensions"?: string[]
		/**
		 * RegExp patterns to match file names, which should have the framework support enabled. Use carefully as broken pattern may even freeze IDE.
		 */
		"file-name-patterns"?: Pattern[]
		/**
		 * Global JavaScript libraries names enabled within the IDE, which enable framework support in the whole project
		 */
		"ide-libraries"?: string[]
		/**
		 * List of tool executables (without extension), which presence should be checked in the project. In case of Node projects, such tools will be searched in node_modules/.bin/
		 */
		"project-tool-executables"?: string[]
	}
	/**
	 * Specify rules for disabling web framework support. These rules take precedence over enable-when rules. They allow to turn off framework support in case of some conflicts between frameworks priority.
	 */
	"disable-when"?: {
		/**
		 * Extensions of files, which should have the framework support disabled
		 */
		"file-extensions"?: string[]
		/**
		 * RegExp patterns to match file names, which should have the framework support disabled
		 */
		"file-name-patterns"?: Pattern[]
	}
}
/**
 * Since 2024.2. Provide rules for setting a particular name for particular context kind. This allows to contribute additional Web Types for example if a particular library is present in the project.
 */
export interface ContextConfig {
	"enable-when"?: EnablementRules
	"disable-when"?: DisablementRules
}
export interface HtmlContributionsHost {
	/**
	 * HTML elements.
	 */
	elements?: HtmlElement[]
	/**
	 * HTML attributes.
	 */
	attributes?: HtmlAttribute[]
	/**
	 * DOM events are deprecated in HTML namespace. Contribute events to JS namespace: /js/events
	 */
	events?: GenericHtmlContribution[]
	[k: string]: GenericHtmlContributions | undefined
}
/**
 * The base for any contributions.
 */
export interface BaseContribution {
	name?: Name
	description?: Description
	"description-sections"?: DescriptionSections
	/**
	 * Since 2024.2. Specify contexts, which are required to enable this contribution.
	 */
	"required-context"?:
	| {
		kind: string
		name: string
	}
	| {
		anyOf: RequiredContext[]
	}
	| {
		allOf: RequiredContext[]
	}
	| {
		not: RequiredContext
	}
	"doc-url"?: DocUrl
	icon?: Icon
	source?: Source
	since?: Since
	deprecated?: Deprecated
	"deprecated-since"?: DeprecatedSince
	obsolete?: Obsolete
	"obsolete-since"?: ObsoleteSince
	experimental?: Experimental
	priority?: Priority
	proximity?: Proximity
	virtual?: Virtual
	abstract?: Abstract
	extension?: Extension
	extends?: Reference
	pattern?: NamePatternRoot
	html?: Html
	css?: Css
	js?: Js
	"exclusive-contributions"?: ExclusiveContributions
}
/**
 * Custom sections to be shown below description in the documentation popup.
 */
export interface DescriptionSections {
	[k: string]: string
}
export interface ReferenceWithProps {
	path: string
	includeVirtual?: boolean
	includeAbstract?: boolean
	filter?: string
	/**
	 * Override global name conversion rules for matching symbols under the path.
	 */
	"name-conversion"?: {
		/**
		 * Override global canonical name conversion rule against which comparisons are made for the referenced symbols. When only rule name is specified, it applies to the symbols of the same kind as the last segment of the referenced path. Otherwise format of the property names is '{namespace}/{symbol kind}'. Supported by JetBrains IDEs since 2022.1.
		 */
		"canonical-names"?: NameConverter | NameConversionRulesSingle
		/**
		 * Override global rules, by which referenced symbols should be matched against their canonical names. When only rule names are specified, they applies to the symbols of the same kind as the last segment of the referenced path. Otherwise format of the property names is '{namespace}/{symbol kind}'. Supported by JetBrains IDEs since 2022.1.
		 */
		"match-names"?: NameConverters | NameConversionRulesMultiple
		/**
		 * Override global rules, by which referenced symbol names should be proposed in auto completion. When only rule names are specified, they applies to the symbols of the same kind as the last segment of the referenced path. Otherwise format of the property names is '{namespace}/{symbol kind}'. Supported by JetBrains IDEs since 2022.1.
		 */
		"name-variants"?: NameConverters | NameConversionRulesMultiple
	}
}
export interface NameConversionRulesSingle {
	[k: string]: NameConverter
}
export interface NameConversionRulesMultiple {
	[k: string]: NameConverters
}
export interface CssContributionsHost {
	/**
	 * CSS properties
	 */
	properties?: CssProperty[]
	/**
	 * CSS pseudo-elements
	 */
	"pseudo-elements"?: CssPseudoElement[]
	/**
	 * CSS pseudo-classes
	 */
	"pseudo-classes"?: CssPseudoClass[]
	/**
	 * CSS functions
	 */
	functions?: CssGenericItem[]
	/**
	 * CSS classes
	 */
	classes?: CssGenericItem[]
	/**
	 * CSS parts
	 */
	parts?: CssGenericItem[]
}
export interface JsContributionsHost {
	/**
	 * DOM events
	 */
	events?: GenericJsContribution[]
	/**
	 * JavaScript properties of an object, HTML tag, framework component, etc.
	 */
	properties?: JsProperty[]
	/**
	 * Symbols available for JavaScript resolve. TypeScript resolve is not supported.
	 */
	symbols?: JsSymbol[]
}
/**
 * Contains contributions to JS namespace. It's property names represent symbol kinds, its property values contain list of contributions of particular kind. There are 2 predefined kinds, which integrate directly with IDE - properties and events, but only events can be contributed globally.
 */
export interface JsGlobal {
	/**
	 * DOM events
	 */
	events?: GenericJsContribution[]
	/**
	 * Globally available symbols for JavaScript resolve. TypeScript resolve is not supported. Please note that these symbols will override any normally available global JavaScript symbols.
	 */
	symbols?: JsSymbol[]
}
