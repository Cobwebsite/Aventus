export type InterestPoint = {
	start: number,
	end: number,
	name: string,
	type: 'method' | 'property' | 'tag'
}
export type PressEventMapKey = keyof typeof pressEventMap;
export type PressEventMapValues = typeof pressEventMap[PressEventMapKey];
export const pressEventMap = {
	['@press']: "onPress",
	['@press-start']: "onPressStart",
	['@press-stop']: "onPressEnd",
	['@longpress']: "onLongPress",
	['@longpress-delay']: "delayLongPress",
	['@dblpress']: "onDblPress",
	['@dblpress-delay']: "delayDblPress",
	['@drag']: "onDrag",
	['@drag-start']: "onDragStart",
	['@drag-end']: "onDragEnd",
};

export type ActionElement = {
	name: string,
	tags: { [tag: string]: number },
	ids: string[],
	useLive: boolean,
	isArray: boolean,
	positions: { start: number, end: number }[]
}

export type ActionChange = {
	id: string,
	attrName: string | '@HTML';
	render: string;
	isBool?: boolean;
	path?: string;
	positions?: { start: number, end: number }[]
};
export type ActionInjection = {
	id: string,
	injectionName: string;
	inject: string;
	path?: string;
	position?: { start: number, end: number }
};
export type ActionBindings = {
	id: string,
	valueName: string,
	eventNames: string[],
	tagName?: string,
	isCallback?: boolean,
	path?: string,
	position?: { start: number, end: number }
};
export type ActionEvent = {
	id: string,
	eventName: string,
	fct: string,
	isCallback?: boolean,
	tagName?: string,
	position?: { start: number, end: number }
};
export interface ActionPressEvent {
	id: string,
	[key: PressEventMapValues]: {
		value: string,
		start: number, 
		end: number
	} | string,
};
export interface ActionLoop {
	loopId: number,
	anchorId: string,
	template: string,
	from: string,
	index: string,
	item: string,
	actions: HtmlTemplateResult,
	loopParentId: number | null,
	positionFrom: { start: number, end: number }
};

export type HtmlTemplateResult = {
	elements: ActionElement[],
	injection: {
		[contextProp: string]: ActionInjection[];
	};
	bindings: {
		[contextProp: string]: ActionBindings[];
	};
	events: ActionEvent[];
	pressEvents: ActionPressEvent[];
	loops: ActionLoop[];
};