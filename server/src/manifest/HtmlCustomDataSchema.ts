/**
 * Format for loading Custom Data in VS Code's HTML support
 */
export interface VSCodeHTMLCustomDataFormat {
	/**
	 * The custom data version
	 */
	version: 1.1
	/**
	 * Custom HTML tags
	 */
	tags: Tag[]
	/**
	 * Custom HTML global attributes
	 */
	globalAttributes?: {
		/**
		 * Name of attribute
		 */
		name: string
		/**
		 * Description of attribute shown in completion and hover
		 */
		description?: string | MarkupDescription
		/**
		 * Name of the matching attribute value set
		 */
		valueSet?: string
		/**
		 * A list of possible values for the attribute
		 */
		values?: {
			/**
			 * Name of attribute value
			 */
			name: string
			/**
			 * Description of attribute value shown in completion and hover
			 */
			description?: string | MarkupDescription
			/**
			 * A list of references for the attribute value shown in completion and hover
			 */
			references?: References[]

		}[]
		/**
		 * A list of references for the attribute shown in completion and hover
		 */
		references?: References[]

	}[]
	/**
	 * A set of attribute value. When an attribute refers to an attribute set, its value completion will use value from that set
	 */
	valueSets?: {
		/**
		 * Name of attribute value in value set
		 */
		name: string
		/**
		 * A list of possible values for the attribute
		 */
		values?: {
			/**
			 * Name of attribute value
			 */
			name: string
			/**
			 * Description of attribute value shown in completion and hover
			 */
			description?: string | MarkupDescription
			/**
			 * A list of references for the attribute value shown in completion and hover
			 */
			references?: References[]

		}[]
	}[]

}

export interface Tag {
	/**
	 * Name of tag
	 */
	name: string
	/**
	 * Description of tag shown in completion and hover
	 */
	description?: string | MarkupDescription
	/**
	 * A list of possible attributes for the tag
	 */
	attributes?: Attribute[]
	/**
	 * A list of references for the tag shown in completion and hover
	 */
	references?: References[]

}
export interface Attribute {
	/**
	 * Name of attribute
	 */
	name: string
	/**
	 * Description of attribute shown in completion and hover
	 */
	description?: string | MarkupDescription
	/**
	 * Name of the matching attribute value set
	 */
	valueSet?: string
	/**
	 * A list of possible values for the attribute
	 */
	values?: AttributeValue[]
	/**
	 * A list of references for the attribute shown in completion and hover
	 */
	references?: References[]

}
export interface AttributeValue {
	/**
	 * Name of attribute value
	 */
	name: string
	/**
	 * Description of attribute value shown in completion and hover
	 */
	description?: string | MarkupDescription
	/**
	 * A list of references for the attribute value shown in completion and hover
	 */
	references?: References[]

}
export interface MarkupDescription {
	/**
	 * Whether `description.value` should be rendered as plaintext or markdown
	 */
	kind: "plaintext" | "markdown"
	/**
	 * Description shown in completion and hover
	 */
	value: string

}
export interface References {
	/**
	 * The name of the reference.
	 */
	name: string
	/**
	 * The URL of the reference.
	 */
	url: string

}
