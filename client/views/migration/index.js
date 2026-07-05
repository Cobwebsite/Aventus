var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
if(!Object.hasOwn(window, "AvInstance")) {
	Object.defineProperty(window, "AvInstance", {
		get() {return Aventus?.Instance;}
	});

	(() => {
		Map.prototype._defaultHas = Map.prototype.has;
		Map.prototype._defaultSet = Map.prototype.set;
		Map.prototype._defaultGet = Map.prototype.get;
		Map.prototype.has = function(key) {
			if(Aventus.Watcher?.is(key)) {
				return Map.prototype._defaultHas.call(this,key.getTarget())
			}
			return Map.prototype._defaultHas.call(this,key);
		}

		Map.prototype.set = function(key, value) {
			if(Aventus.Watcher?.is(key)) {
				return Map.prototype._defaultSet.call(this, key.getTarget(), value)
			}
			return Map.prototype._defaultSet.call(this, key, value);
		}
		Map.prototype.get = function(key) {
			if(Aventus.Watcher?.is(key)) {
				return Map.prototype._defaultGet.call(this, key.getTarget())
			}
			return Map.prototype._defaultGet.call(this, key);
		}
	})();
}
var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `Aventus`;
const _ = {};


let _n;
let DragElementXYType= [SVGGElement, SVGRectElement, SVGEllipseElement, SVGTextElement];
__as1(_, 'DragElementXYType', DragElementXYType);

let DragElementLeftTopType= [HTMLElement, SVGSVGElement];
__as1(_, 'DragElementLeftTopType', DragElementLeftTopType);

let isClass=function isClass(v) {
    return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
}
__as1(_, 'isClass', isClass);

var HttpErrorCode;
(function (HttpErrorCode) {
    HttpErrorCode[HttpErrorCode["unknow"] = 0] = "unknow";
})(HttpErrorCode || (HttpErrorCode = {}));
__as1(_, 'HttpErrorCode', HttpErrorCode);

var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["POST"] = "POST";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["OPTION"] = "OPTION";
})(HttpMethod || (HttpMethod = {}));
__as1(_, 'HttpMethod', HttpMethod);

let DateConverter=class DateConverter {
    static __converter = new DateConverter();
    static get converter() {
        return this.__converter;
    }
    static set converter(value) {
        this.__converter = value;
    }
    isStringDate(txt) {
        return /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3,6})Z$/.exec(txt) !== null;
    }
    fromString(txt) {
        return new Date(txt);
    }
    toString(date) {
        if (date.getFullYear() < 100) {
            return "0001-01-01T00:00:00.000Z";
        }
        return date.toISOString();
    }
}
DateConverter.Namespace=`Aventus`;
__as1(_, 'DateConverter', DateConverter);

let ElementExtension=class ElementExtension {
    /**
     * Find a parent by custom check
     */
    static findParent(element, check, untilNode) {
        let el = element;
        if (el) {
            if (el instanceof ShadowRoot) {
                el = el.host;
            }
            else {
                el = el.parentNode;
            }
        }
        while (el) {
            if (check(el)) {
                return el;
            }
            if (el instanceof ShadowRoot) {
                el = el.host;
            }
            else {
                el = el.parentNode;
            }
            if (el == untilNode) {
                break;
            }
        }
        return null;
    }
    /**
     * Find a list of parent by custom check
     */
    static findParents(element, check, untilNode) {
        let result = [];
        let el = element;
        if (el) {
            if (el instanceof ShadowRoot) {
                el = el.host;
            }
            else {
                el = el.parentNode;
            }
        }
        while (el) {
            if (check(el)) {
                result.push(el);
            }
            if (el instanceof ShadowRoot) {
                el = el.host;
            }
            else {
                el = el.parentNode;
            }
            if (el == untilNode) {
                break;
            }
        }
        return result;
    }
    /**
     * Find a parent by tagname if exist Static.findParentByTag(this, "av-img")
     */
    static findParentByTag(element, tagname, untilNode) {
        if (Array.isArray(tagname)) {
            for (let i = 0; i < tagname.length; i++) {
                tagname[i] = tagname[i].toLowerCase();
            }
        }
        else {
            tagname = [tagname.toLowerCase()];
        }
        const checkFunc = (el) => {
            if (el instanceof Element) {
                return tagname.indexOf((el.nodeName || el.tagName).toLowerCase()) != -1;
            }
            return tagname.indexOf(el.nodeName.toLowerCase()) != -1;
        };
        return this.findParent(element, checkFunc, untilNode);
    }
    /**
     * Find a parent by class name if exist Static.findParentByClass(this, "my-class-img") = querySelector('.my-class-img')
     */
    static findParentByClass(element, classname, untilNode) {
        if (!Array.isArray(classname)) {
            classname = [classname];
        }
        const check = (el) => {
            for (let classnameTemp of classname) {
                if (el instanceof Element && el['classList'].contains(classnameTemp)) {
                    return true;
                }
            }
            return false;
        };
        return this.findParent(element, check, untilNode);
    }
    static findParentByType(element, types, untilNode) {
        if (!Array.isArray(types)) {
            types = [types];
        }
        let isValid = true;
        for (let type of types) {
            if (typeof type == "function" && type['prototype']['constructor'])
                continue;
            isValid = false;
        }
        if (isValid) {
            let checkFunc = (el) => {
                for (let type of types) {
                    const t = type;
                    if (el instanceof t) {
                        return true;
                    }
                }
                return false;
            };
            return this.findParent(element, checkFunc, untilNode);
        }
        console.error("you must provide a class inside this function");
        return null;
    }
    /**
     * Find list of parents by tagname
     */
    static findParentsByTag(element, tagname, untilNode) {
        let el = element;
        if (Array.isArray(tagname)) {
            for (let i = 0; i < tagname.length; i++) {
                tagname[i] = tagname[i].toLowerCase();
            }
        }
        else {
            tagname = [tagname.toLowerCase()];
        }
        let check = (el) => {
            if (el instanceof Element) {
                return tagname.indexOf((el.nodeName || el.tagName).toLowerCase()) != -1;
            }
            return tagname.indexOf(el.nodeName.toLowerCase()) != -1;
        };
        return this.findParents(element, check, untilNode);
    }
    /**
     * Check if element contains a child
     */
    static containsChild(element, child) {
        let rootScope = element.getRootNode();
        let elScope = child.getRootNode();
        while (elScope != rootScope) {
            if (!elScope['host']) {
                return false;
            }
            child = elScope['host'];
            elScope = elScope['host'].getRootNode();
        }
        return element.contains(child);
    }
    /**
     * Get element inside slot
     */
    static getElementsInSlot(element, slotName) {
        let result = [];
        if (element.shadowRoot) {
            let slotEl;
            if (slotName) {
                slotEl = element.shadowRoot.querySelector('slot[name="' + slotName + '"]');
            }
            else {
                slotEl = element.shadowRoot.querySelector("slot:not([name])");
                if (!slotEl) {
                    slotEl = element.shadowRoot.querySelector("slot");
                }
            }
            while (true) {
                if (!slotEl) {
                    return result;
                }
                var listChild = Array.from(slotEl.assignedElements());
                if (!listChild) {
                    return result;
                }
                let slotFound = false;
                for (let i = 0; i < listChild.length; i++) {
                    let child = listChild[i];
                    if (listChild[i].nodeName == "SLOT") {
                        slotEl = listChild[i];
                        slotFound = true;
                    }
                    else if (child instanceof HTMLElement) {
                        result.push(child);
                    }
                }
                if (!slotFound) {
                    return result;
                }
            }
        }
        return result;
    }
    /**
     * Get element inside slot
     */
    static getNodesInSlot(element, slotName) {
        let result = [];
        if (element.shadowRoot) {
            let slotEl;
            if (slotName) {
                slotEl = element.shadowRoot.querySelector('slot[name="' + slotName + '"]');
            }
            else {
                slotEl = element.shadowRoot.querySelector("slot:not([name])");
                if (!slotEl) {
                    slotEl = element.shadowRoot.querySelector("slot");
                }
            }
            while (true) {
                if (!slotEl) {
                    return result;
                }
                var listChild = Array.from(slotEl.assignedNodes());
                if (!listChild) {
                    return result;
                }
                let slotFound = false;
                for (let i = 0; i < listChild.length; i++) {
                    let child = listChild[i];
                    if (listChild[i].nodeName == "SLOT") {
                        slotEl = listChild[i];
                        slotFound = true;
                    }
                    else if (child instanceof Node) {
                        result.push(child);
                    }
                }
                if (!slotFound) {
                    return result;
                }
            }
        }
        return result;
    }
    /**
     * Get deeper element inside dom at the position X and Y
     */
    static getElementAtPosition(x, y, startFrom) {
        const _realTarget = (el, i = 0) => {
            if (i == 50) {
                debugger;
            }
            if (el.shadowRoot && x !== undefined && y !== undefined) {
                const elements = el.shadowRoot.elementsFromPoint(x, y);
                var newEl = elements.length > 0 ? elements[0] : null;
                if (newEl && newEl != el && (el.shadowRoot.contains(newEl) || el.contains(newEl))) {
                    return _realTarget(newEl, i + 1);
                }
            }
            return el;
        };
        if (startFrom == null) {
            startFrom = document.body;
        }
        return _realTarget(startFrom);
    }
    /**
     * Get active element from the define root
     */
    static getActiveElement(root = document) {
        if (!root)
            return null;
        let el = root.activeElement;
        while (el instanceof WebComponent) {
            let elTemp = el.shadowRoot?.activeElement;
            if (!elTemp)
                return el;
            el = elTemp;
        }
        return el;
    }
}
ElementExtension.Namespace=`Aventus`;
__as1(_, 'ElementExtension', ElementExtension);

let Style=class Style {
    static instance;
    static noAnimation;
    static defaultStyleSheets = {
        "@default": `:host{display:inline-block;box-sizing:border-box}:host *{box-sizing:border-box}`,
    };
    static store(name, content) {
        this.getInstance().store(name, content);
    }
    static get(name) {
        return this.getInstance().get(name);
    }
    static getAsString(name) {
        return this.getInstance().getAsString(name);
    }
    static sheetToString(stylesheet) {
        return this.getInstance().sheetToString(stylesheet);
    }
    static load(name, url) {
        return this.getInstance().load(name, url);
    }
    static appendToHead(name) {
        if (!document.head.querySelector(`style[data-name="${name}"]`)) {
            const styleNode = document.createElement('style');
            styleNode.setAttribute(`data-name`, name);
            styleNode.innerHTML = Style.getAsString(name);
            document.getElementsByTagName('head')[0].appendChild(styleNode);
        }
    }
    static refreshHead(name) {
        const styleNode = document.head.querySelector(`style[data-name="${name}"]`);
        if (styleNode) {
            styleNode.innerHTML = Style.getAsString(name);
        }
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new Style();
        }
        return this.instance;
    }
    constructor() {
        for (let name in Style.defaultStyleSheets) {
            this.store(name, Style.defaultStyleSheets[name]);
        }
        Style.noAnimation = new CSSStyleSheet();
        Style.noAnimation.replaceSync(`:host{-webkit-transition: none !important;-moz-transition: none !important;-ms-transition: none !important;-o-transition: none !important;transition: none !important;}:host *{-webkit-transition: none !important;-moz-transition: none !important;-ms-transition: none !important;-o-transition: none !important;transition: none !important;}`);
    }
    stylesheets = new Map();
    async load(name, url) {
        try {
            let style = this.stylesheets.get(name);
            if (!style || style.cssRules.length == 0) {
                let txt = await (await fetch(url)).text();
                this.store(name, txt);
            }
        }
        catch (e) {
        }
    }
    store(name, content) {
        let style = this.stylesheets.get(name);
        if (!style) {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(content);
            this.stylesheets.set(name, sheet);
            return sheet;
        }
        else {
            style.replaceSync(content);
            Style.refreshHead(name);
            return style;
        }
    }
    get(name) {
        let style = this.stylesheets.get(name);
        if (!style) {
            style = this.store(name, "");
        }
        return style;
    }
    getAsString(name) {
        return this.sheetToString(this.get(name));
    }
    sheetToString(stylesheet) {
        return stylesheet.cssRules
            ? Array.from(stylesheet.cssRules)
                .map(rule => rule.cssText || '')
                .join('\n')
            : '';
    }
}
Style.Namespace=`Aventus`;
__as1(_, 'Style', Style);

let setValueToObject=function setValueToObject(path, obj, value) {
    path = path.replace(/\[(.*?)\]/g, '.$1');
    const val = (key) => {
        if (obj instanceof Map) {
            return obj.get(key);
        }
        return obj[key];
    };
    let splitted = path.split(".");
    for (let i = 0; i < splitted.length - 1; i++) {
        let split = splitted[i];
        let value = val(split);
        if (!value) {
            obj[split] = {};
            value = obj[split];
        }
        obj = value;
    }
    if (obj instanceof Map) {
        obj.set(splitted[splitted.length - 1], value);
    }
    else {
        obj[splitted[splitted.length - 1]] = value;
    }
}
__as1(_, 'setValueToObject', setValueToObject);

let Mutex=class Mutex {
    /**
     * Array to store functions waiting for the mutex to become available.
     * @type {((run: boolean) => void)[]}
     */
    waitingList = [];
    /**
    * Indicates whether the mutex is currently locked or not.
    * @type {boolean}
    */
    isLocked = false;
    /**
    * Waits for the mutex to become available and then acquires it.
    * @returns {Promise<boolean>} A Promise that resolves to true if the mutex was acquired successfully.
    */
    waitOne() {
        return new Promise((resolve) => {
            if (this.isLocked) {
                this.waitingList.push((run) => {
                    resolve(run);
                });
            }
            else {
                this.isLocked = true;
                resolve(true);
            }
        });
    }
    /**
     * Release the mutex
     */
    release() {
        let nextFct = this.waitingList.shift();
        if (nextFct) {
            nextFct(true);
        }
        else {
            this.isLocked = false;
        }
    }
    /**
     * Releases the mutex, allowing only the last function in the waiting list to acquire it.
     */
    releaseOnlyLast() {
        if (this.waitingList.length > 0) {
            let lastFct = this.waitingList.pop();
            for (let fct of this.waitingList) {
                fct(false);
            }
            this.waitingList = [];
            if (lastFct) {
                lastFct(true);
            }
        }
        else {
            this.isLocked = false;
        }
    }
    /**
     * Clears the mutex, removing all waiting functions and releasing the lock.
     */
    dispose() {
        this.waitingList = [];
        this.isLocked = false;
    }
    /**
     * Executes a callback function safely within the mutex lock and releases the lock afterward.
     * @template T - The type of the return value of the callback function.
     * @param {() => T} cb - The callback function to execute.
     * @returns {Promise<T | null>} A Promise that resolves to the result of the callback function or null if an error occurs.
     */
    async safeRun(cb) {
        let result = null;
        await this.waitOne();
        try {
            result = cb.apply(null, []);
        }
        catch (e) {
            console.error(e);
        }
        await this.release();
        return result;
    }
    /**
     * Executes an asynchronous callback function safely within the mutex lock and releases the lock afterward.
     * @template T - The type of the return value of the asynchronous callback function.
     * @param {() => Promise<T>} cb - The asynchronous callback function to execute.
     * @returns {Promise<T | null>} A Promise that resolves to the result of the asynchronous callback function or null if an error occurs.
     */
    async safeRunAsync(cb) {
        let result = null;
        await this.waitOne();
        try {
            result = await cb.apply(null, []);
        }
        catch (e) {
            console.error(e);
        }
        await this.release();
        return result;
    }
    /**
     * Executes a callback function safely within the mutex lock, allowing only the last function in the waiting list to acquire the lock, and releases the lock afterward.
     * @template T - The type of the return value of the callback function.
     * @param {() => T} cb - The callback function to execute.
     * @returns {Promise<T | null>} A Promise that resolves to the result of the callback function or null if an error occurs.
     */
    async safeRunLast(cb) {
        let result = null;
        if (await this.waitOne()) {
            try {
                result = cb.apply(null, []);
            }
            catch (e) {
                console.error(e);
            }
            await this.releaseOnlyLast();
        }
        return result;
    }
    /**
     * Executes an asynchronous callback function safely within the mutex lock, allowing only the last function in the waiting list to acquire the lock, and releases the lock afterward.
     * @template T - The type of the return value of the asynchronous callback function.
     * @param {() => Promise<T>} cb - The asynchronous callback function to execute.
     * @returns {Promise<T | undefined>} A Promise that resolves to the result of the asynchronous callback function or undefined if an error occurs.
     */
    async safeRunLastAsync(cb) {
        let result;
        if (await this.waitOne()) {
            try {
                result = await cb.apply(null, []);
            }
            catch (e) {
                console.error(e);
            }
            await this.releaseOnlyLast();
        }
        return result;
    }
}
Mutex.Namespace=`Aventus`;
__as1(_, 'Mutex', Mutex);

let NormalizedEvent=class NormalizedEvent {
    _event;
    get event() {
        return this._event;
    }
    constructor(event) {
        this._event = event;
    }
    getProp(prop) {
        if (prop in this.event) {
            return this.event[prop];
        }
        return undefined;
    }
    stopImmediatePropagation() {
        this.event.stopImmediatePropagation();
    }
    get clientX() {
        if ('clientX' in this.event) {
            return this.event.clientX;
        }
        else if ('touches' in this.event && this.event.touches.length > 0) {
            return this.event.touches[0].clientX;
        }
        return 0;
    }
    get clientY() {
        if ('clientY' in this.event) {
            return this.event.clientY;
        }
        else if ('touches' in this.event && this.event.touches.length > 0) {
            return this.event.touches[0].clientY;
        }
        return 0;
    }
    get pageX() {
        if ('pageX' in this.event) {
            return this.event.pageX;
        }
        else if ('touches' in this.event && this.event.touches.length > 0) {
            return this.event.touches[0].pageX;
        }
        return 0;
    }
    get pageY() {
        if ('pageY' in this.event) {
            return this.event.pageY;
        }
        else if ('touches' in this.event && this.event.touches.length > 0) {
            return this.event.touches[0].pageY;
        }
        return 0;
    }
    get type() {
        return this.event.type;
    }
    get target() {
        return this.event.target;
    }
    get timeStamp() {
        return this.event.timeStamp;
    }
    get pointerType() {
        if ('TouchEvent' in window && this._event instanceof TouchEvent)
            return "touch";
        return this.getProp("pointerType");
    }
    get button() {
        return this.getProp("button");
    }
    get isTouch() {
        if ('TouchEvent' in window && this._event instanceof TouchEvent)
            return true;
        return this._event.pointerType == "touch";
    }
}
NormalizedEvent.Namespace=`Aventus`;
__as1(_, 'NormalizedEvent', NormalizedEvent);

let Callback=class Callback {
    callbacks = new Map();
    /**
     * Clear all callbacks
     */
    clear() {
        this.callbacks.clear();
    }
    /**
     * Add a callback
     */
    add(cb, scope = null) {
        if (!this.callbacks.has(cb)) {
            this.callbacks.set(cb, scope);
        }
    }
    /**
     * Remove a callback
     */
    remove(cb) {
        this.callbacks.delete(cb);
    }
    /**
     * Trigger all callbacks
     */
    trigger(...args) {
        let result = [];
        let cbs = [...this.callbacks];
        for (let [cb, scope] of cbs) {
            result.push(cb.apply(scope, args));
        }
        return result;
    }
}
Callback.Namespace=`Aventus`;
__as1(_, 'Callback', Callback);

let compareObject=function compareObject(obj1, obj2) {
    if (Array.isArray(obj1)) {
        if (!Array.isArray(obj2)) {
            return false;
        }
        obj2 = obj2.slice();
        if (obj1.length !== obj2.length) {
            return false;
        }
        for (let i = 0; i < obj1.length; i++) {
            let foundElement = false;
            for (let j = 0; j < obj2.length; j++) {
                if (compareObject(obj1[i], obj2[j])) {
                    obj2.splice(j, 1);
                    foundElement = true;
                    break;
                }
            }
            if (!foundElement) {
                return false;
            }
        }
        return true;
    }
    else if (typeof obj1 === 'object' && obj1 !== undefined && obj1 !== null) {
        if (typeof obj2 !== 'object' || obj2 === undefined || obj2 === null) {
            return false;
        }
        if (obj1 == obj2) {
            return true;
        }
        if (obj1 instanceof HTMLElement || obj2 instanceof HTMLElement) {
            return false;
        }
        if (obj1 instanceof Date || obj2 instanceof Date) {
            return obj1.toString() === obj2.toString();
        }
        let oneProxy = false;
        if (Watcher.is(obj1)) {
            oneProxy = true;
            obj1 = Watcher.extract(obj1, false);
        }
        if (Watcher.is(obj2)) {
            oneProxy = true;
            obj2 = Watcher.extract(obj2, false);
        }
        if (obj1 instanceof Map && obj2 instanceof Map) {
            if (obj1.size != obj2.size) {
                return false;
            }
            const keys = obj1.keys();
            for (let key in keys) {
                if (!obj2.has(key)) {
                    return false;
                }
                if (!compareObject(obj1.get(key), obj2.get(key))) {
                    return false;
                }
            }
            return true;
        }
        else {
            if (Object.keys(obj1).length !== Object.keys(obj2).length) {
                return false;
            }
            for (let key in obj1) {
                if (oneProxy && Watcher['__reservedName'][key]) {
                    continue;
                }
                if (!(key in obj2)) {
                    return false;
                }
                if (!compareObject(obj1[key], obj2[key])) {
                    return false;
                }
            }
            return true;
        }
    }
    else {
        return obj1 === obj2;
    }
}
__as1(_, 'compareObject', compareObject);

let getValueFromObject=function getValueFromObject(path, obj) {
    if (path === undefined) {
        path = '';
    }
    path = path.replace(/\[(.*?)\]/g, '.$1');
    if (path == "") {
        return obj;
    }
    const val = (key) => {
        if (obj instanceof Map) {
            return obj.get(key);
        }
        return obj[key];
    };
    let splitted = path.split(".");
    for (let i = 0; i < splitted.length - 1; i++) {
        let split = splitted[i];
        let value = val(split);
        if (!value || typeof value !== 'object') {
            return undefined;
        }
        obj = value;
    }
    if (!obj || typeof obj !== 'object') {
        return undefined;
    }
    return val(splitted[splitted.length - 1]);
}
__as1(_, 'getValueFromObject', getValueFromObject);

var WatchAction;
(function (WatchAction) {
    WatchAction[WatchAction["CREATED"] = 0] = "CREATED";
    WatchAction[WatchAction["UPDATED"] = 1] = "UPDATED";
    WatchAction[WatchAction["DELETED"] = 2] = "DELETED";
})(WatchAction || (WatchAction = {}));
__as1(_, 'WatchAction', WatchAction);

let Effect=class Effect {
    callbacks = [];
    isInit = false;
    isDestroy = false;
    __subscribes = [];
    __allowChanged = [];
    version = 0;
    fct;
    constructor(fct) {
        this.fct = fct;
        if (this.autoInit()) {
            this.init();
        }
    }
    autoInit() {
        return true;
    }
    init() {
        this.isInit = true;
        this.run();
    }
    run() {
        this.version++;
        Watcher._registering.push(this);
        let result = this.fct();
        Watcher._registering.splice(Watcher._registering.length - 1, 1);
        for (let i = 0; i < this.callbacks.length; i++) {
            if (this.callbacks[i].version != this.version) {
                this.callbacks[i].receiver.unsubscribe(this.callbacks[i].cb);
                this.callbacks.splice(i, 1);
                i--;
            }
        }
        return result;
    }
    register(receiver, path, version, fullPath) {
        for (let info of this.callbacks) {
            if (info.receiver == receiver && info.path == path && receiver.__path == info.registerPath) {
                info.version = version;
                info.fullPath = fullPath;
                return;
            }
        }
        let cb;
        if (path == "*") {
            cb = (action, changePath, value, dones) => { this.onChange(action, changePath, value, dones); };
        }
        else {
            cb = (action, changePath, value, dones) => {
                if (changePath == path || changePath.startsWith(path + ".") || changePath.startsWith(path + "[")) {
                    // if(changePath == path) {
                    this.onChange(action, changePath, value, dones);
                }
            };
        }
        this.callbacks.push({
            receiver,
            path,
            registerPath: receiver.__path,
            cb,
            version,
            fullPath
        });
        receiver.subscribe(cb);
    }
    canChange(fct) {
        this.__allowChanged.push(fct);
    }
    checkCanChange(action, changePath, value, dones) {
        if (this.isDestroy) {
            return false;
        }
        for (let fct of this.__allowChanged) {
            if (!fct(action, changePath, value, dones)) {
                return false;
            }
        }
        return true;
    }
    onChange(action, changePath, value, dones) {
        if (!this.checkCanChange(action, changePath, value, dones)) {
            return;
        }
        this.run();
        for (let fct of this.__subscribes) {
            fct(action, changePath, value, dones);
        }
    }
    destroy() {
        this.isDestroy = true;
        this.clearCallbacks();
        this.isInit = false;
    }
    clearCallbacks() {
        for (let pair of this.callbacks) {
            pair.receiver.unsubscribe(pair.cb);
        }
        this.callbacks = [];
    }
    subscribe(fct) {
        let index = this.__subscribes.indexOf(fct);
        if (index == -1) {
            this.__subscribes.push(fct);
        }
    }
    unsubscribe(fct) {
        let index = this.__subscribes.indexOf(fct);
        if (index > -1) {
            this.__subscribes.splice(index, 1);
        }
    }
}
Effect.Namespace=`Aventus`;
__as1(_, 'Effect', Effect);

let Signal=class Signal {
    __subscribes = [];
    _value;
    _onChange;
    get value() {
        Watcher._register?.register(this, "*", Watcher._register.version, "*");
        return this._value;
    }
    set value(item) {
        const oldValue = this._value;
        this._value = item;
        if (oldValue != item) {
            if (this._onChange) {
                this._onChange();
            }
            for (let fct of this.__subscribes) {
                fct(WatchAction.UPDATED, "*", item, []);
            }
        }
    }
    constructor(item, onChange) {
        this._value = item;
        this._onChange = onChange;
    }
    subscribe(fct) {
        let index = this.__subscribes.indexOf(fct);
        if (index == -1) {
            this.__subscribes.push(fct);
        }
    }
    unsubscribe(fct) {
        let index = this.__subscribes.indexOf(fct);
        if (index > -1) {
            this.__subscribes.splice(index, 1);
        }
    }
    destroy() {
        this.__subscribes = [];
    }
}
Signal.Namespace=`Aventus`;
__as1(_, 'Signal', Signal);

let Watcher=class Watcher {
    static isNative(obj) {
        if (obj instanceof Blob ||
            obj instanceof Element ||
            obj instanceof Window)
            return true;
        return false;
    }
    constructor() { }
    ;
    static __reservedName = {
        __path: '__path',
    };
    static __triggerForced = false;
    static _registering = [];
    static get _register() {
        return this._registering[this._registering.length - 1];
    }
    /**
     * Transform object into a watcher
     */
    static get(obj, onDataChanged) {
        if (obj == undefined) {
            console.error("You must define an objet / array for your proxy");
            return;
        }
        if (obj.__isProxy) {
            if (onDataChanged)
                obj.subscribe(onDataChanged);
            return obj;
        }
        const reservedName = this.__reservedName;
        const clearReservedNames = (data) => {
            if (data instanceof Object && !data.__isProxy) {
                for (let key in reservedName) {
                    delete data[key];
                }
                for (let key in data) {
                    clearReservedNames(data[key]);
                }
            }
        };
        const setProxyPath = (newProxy, newPath) => {
            if (newProxy instanceof Object && newProxy.__isProxy) {
                newProxy.__path = newPath;
            }
        };
        const jsonReplacer = (key, value) => {
            if (reservedName[key])
                return undefined;
            return value;
        };
        const addAlias = (otherBaseData, name, cb) => {
            let cbs = aliases.get(otherBaseData);
            if (!cbs) {
                cbs = [];
                aliases.set(otherBaseData, cbs);
            }
            cbs.push({
                name: name,
                fct: cb
            });
        };
        const deleteAlias = (otherBaseData, name) => {
            let cbs = aliases.get(otherBaseData);
            if (!cbs)
                return;
            for (let i = 0; i < cbs.length; i++) {
                if (cbs[i].name == name) {
                    cbs.splice(i, 1);
                    if (cbs.length == 0) {
                        aliases.delete(otherBaseData);
                    }
                    return;
                }
            }
        };
        const replaceByAlias = (target, element, prop, receiver, apply, out = {}) => {
            let fullInternalPath = "";
            if (Array.isArray(receiver)) {
                if (prop != "length") {
                    if (target.__path) {
                        fullInternalPath = target.__path;
                    }
                    fullInternalPath += "[" + prop + "]";
                }
            }
            else {
                if (target.__path) {
                    fullInternalPath = target.__path + '.';
                }
                fullInternalPath += prop;
            }
            if (receiver && internalAliases[fullInternalPath]) {
                internalAliases[fullInternalPath].unbind();
            }
            if (element instanceof Object && element.__isProxy) {
                let root = element.__root;
                if (root != proxyData.baseData) {
                    element.__validatePath();
                    let oldPath = element.__path ?? '';
                    let unbindElement = Watcher.extract(getValueFromObject(oldPath, root));
                    if (unbindElement === undefined) {
                        return element;
                    }
                    if (receiver == null) {
                        receiver = getValueFromObject(target.__path, realProxy);
                        if (internalAliases[fullInternalPath]) {
                            internalAliases[fullInternalPath].unbind();
                        }
                    }
                    if (apply) {
                        let result = this.isNative(target) ? Reflect.set(target, prop, unbindElement) : Reflect.set(target, prop, unbindElement, receiver);
                    }
                    element.__addAlias(proxyData.baseData, oldPath, (type, target, receiver2, value, prop2, dones) => {
                        let triggerPath;
                        if (prop2.startsWith("[") || fullInternalPath == "" || prop2 == "") {
                            triggerPath = fullInternalPath + prop2;
                        }
                        else {
                            triggerPath = fullInternalPath + "." + prop2;
                        }
                        if (type == 'DELETED' && internalAliases[triggerPath]) {
                            internalAliases[triggerPath].unbind();
                        }
                        triggerPath = triggerPath.replace(/\[(.*?)\]/g, '.$1');
                        let splitted = triggerPath.split(".");
                        let newProp = splitted.pop();
                        let newReceiver = getValueFromObject(splitted.join("."), realProxy);
                        if (newReceiver.getTarget(false) == target)
                            trigger(type, target, newReceiver, value, newProp ?? '', dones);
                    });
                    internalAliases[fullInternalPath] = {
                        unbind: () => {
                            delete internalAliases[fullInternalPath];
                            element.__deleteAlias(proxyData.baseData, oldPath);
                            deleteAlias(root, fullInternalPath);
                        }
                    };
                    addAlias(root, fullInternalPath, (type, target, receiver2, value, prop2, dones) => {
                        const pathSave = element.__path;
                        let proxy = element.__getProxy;
                        let triggerPath;
                        if (prop2.startsWith("[") || oldPath == "" || prop2 == "") {
                            triggerPath = oldPath + prop2;
                        }
                        else {
                            triggerPath = oldPath + "." + prop2;
                        }
                        triggerPath = triggerPath.replace(/\[(.*?)\]/g, '.$1');
                        let splitted = triggerPath.split(".");
                        let newProp = splitted.pop();
                        let newReceiver = getValueFromObject(splitted.join("."), proxy);
                        if (newReceiver.getTarget(false) == target)
                            element.__trigger(type, target, newReceiver, value, newProp, dones);
                        element.__path = pathSave;
                    });
                    out.otherRoot = root;
                    return unbindElement;
                }
            }
            return element;
        };
        let currentTrace = new Error().stack?.split("\n") ?? [];
        currentTrace.shift();
        currentTrace.shift();
        const aliases = new Map();
        const internalAliases = {};
        let proxyData = {
            baseData: {},
            callbacks: {},
            callbacksReverse: new Map(),
            avoidUpdate: [],
            pathToRemove: [],
            injectedDones: null,
            history: [{
                    object: JSON.parse(JSON.stringify(obj, jsonReplacer)),
                    trace: currentTrace,
                    action: 'init',
                    path: ''
                }],
            useHistory: false,
            getProxyObject(target, element, prop) {
                let newProxy;
                element = replaceByAlias(target, element, prop, null, true);
                if (element instanceof Object && element.__isProxy) {
                    newProxy = element;
                }
                else {
                    try {
                        if (element instanceof Computed) {
                            return element;
                        }
                        if (element instanceof HTMLElement) {
                            return element;
                        }
                        if (element instanceof Object) {
                            newProxy = new Proxy(element, this);
                        }
                        else {
                            return element;
                        }
                    }
                    catch {
                        return element;
                    }
                }
                let newPath = '';
                if (Array.isArray(target)) {
                    if (/^[0-9]*$/g.exec(prop)) {
                        if (target.__path) {
                            newPath = target.__path;
                        }
                        newPath += "[" + prop + "]";
                        setProxyPath(newProxy, newPath);
                    }
                    else {
                        newPath += "." + prop;
                        setProxyPath(newProxy, newPath);
                    }
                }
                else if (element instanceof Date) {
                    return element;
                }
                else {
                    if (target.__path) {
                        newPath = target.__path + '.';
                    }
                    newPath += prop;
                    setProxyPath(newProxy, newPath);
                }
                return newProxy;
            },
            tryCustomFunction(target, prop, receiver) {
                if (prop == "__isProxy") {
                    return true;
                }
                else if (prop == "__getProxy") {
                    return realProxy;
                }
                else if (prop == "__root") {
                    return this.baseData;
                }
                else if (prop == "__validatePath") {
                    return () => {
                        if (this.baseData == target) {
                            target.__path = "";
                        }
                    };
                }
                else if (prop == "__callbacks") {
                    return this.callbacks;
                }
                else if (prop == "subscribe") {
                    let path = receiver.__path;
                    return (cb) => {
                        if (!this.callbacks[path]) {
                            this.callbacks[path] = [];
                        }
                        this.callbacks[path].push(cb);
                        this.callbacksReverse.set(cb, path);
                    };
                }
                else if (prop == "unsubscribe") {
                    return (cb) => {
                        let oldPath = this.callbacksReverse.get(cb);
                        if (oldPath === undefined)
                            return;
                        if (!this.callbacks[oldPath]) {
                            return;
                        }
                        let index = this.callbacks[oldPath].indexOf(cb);
                        if (index > -1) {
                            this.callbacks[oldPath].splice(index, 1);
                        }
                        this.callbacksReverse.delete(cb);
                    };
                }
                else if (prop == "getHistory") {
                    return () => {
                        return this.history;
                    };
                }
                else if (prop == "clearHistory") {
                    this.history = [];
                }
                else if (prop == "enableHistory") {
                    return () => {
                        this.useHistory = true;
                    };
                }
                else if (prop == "disableHistory") {
                    return () => {
                        this.useHistory = false;
                    };
                }
                else if (prop == "getTarget") {
                    return (clear = true) => {
                        if (clear)
                            clearReservedNames(target);
                        return target;
                    };
                }
                else if (prop == "toJSON") {
                    if (target.toJSON) {
                        return target.toJSON;
                    }
                    if (Array.isArray(receiver)) {
                        return () => {
                            let result = [];
                            for (let element of target) {
                                result.push(element);
                            }
                            return result;
                        };
                    }
                    return () => {
                        let result = {};
                        for (let key of Object.keys(target)) {
                            if (reservedName[key]) {
                                continue;
                            }
                            result[key] = target[key];
                        }
                        return result;
                    };
                }
                else if (prop == "__addAlias") {
                    return addAlias;
                }
                else if (prop == "__deleteAlias") {
                    return deleteAlias;
                }
                else if (prop == "__injectedDones") {
                    return (dones) => {
                        this.injectedDones = dones;
                    };
                }
                else if (prop == "__trigger") {
                    return trigger;
                }
                else if (prop == "__static_trigger") {
                    return (type) => {
                        Watcher.__triggerForced = true;
                        trigger(type, target, receiver, target, '');
                        Watcher.__triggerForced = false;
                    };
                }
                return undefined;
            },
            get(target, prop, receiver) {
                if (typeof prop == 'symbol') {
                    return Watcher.isNative(target) ? Reflect.get(target, prop) : Reflect.get(target, prop, receiver);
                }
                if (reservedName[prop]) {
                    return target[prop];
                }
                let customResult = this.tryCustomFunction(target, prop, receiver);
                if (customResult !== undefined) {
                    return customResult;
                }
                let element = target[prop];
                if (typeof (element) == 'function') {
                    if (Array.isArray(receiver)) {
                        let result;
                        if (prop == 'push') {
                            if (target.__isProxy) {
                                result = (el) => {
                                    let index = target.push(el);
                                    return index;
                                };
                            }
                            else {
                                result = (el) => {
                                    let index = target.length;
                                    let out = {};
                                    el = replaceByAlias(target, el, target.length + '', receiver, false, out);
                                    target.push(el);
                                    const dones = [];
                                    const dones2 = [];
                                    if (out.otherRoot) {
                                        dones.push(out.otherRoot);
                                        dones2.push(out.otherRoot);
                                    }
                                    trigger('CREATED', target, receiver, receiver[index], "[" + (index) + "]", dones);
                                    trigger('UPDATED', target, receiver, target.length, "length", dones2);
                                    return index;
                                };
                            }
                        }
                        else if (prop == 'splice') {
                            if (target.__isProxy) {
                                result = (index, nbRemove, ...insert) => {
                                    let res = target.splice(index, nbRemove, ...insert);
                                    return res;
                                };
                            }
                            else {
                                result = (index, nbRemove, ...insert) => {
                                    let oldValues = [];
                                    const extReceiver = Watcher.extract(receiver);
                                    for (let i = index; i < index + nbRemove; i++) {
                                        oldValues.push(extReceiver[i]);
                                    }
                                    let updateLength = nbRemove != insert.length;
                                    for (let i = 0; i < oldValues.length; i++) {
                                        target.splice((index + i), 1);
                                        trigger('DELETED', target, receiver, oldValues[i], "[" + index + "]");
                                    }
                                    for (let i = 0; i < insert.length; i++) {
                                        const out = {};
                                        let value = replaceByAlias(target, insert[i], (index + i) + '', receiver, false, out);
                                        const dones = out.otherRoot ? [out.otherRoot] : [];
                                        target.splice((index + i), 0, value);
                                        trigger('CREATED', target, receiver, receiver[(index + i)], "[" + (index + i) + "]", dones);
                                    }
                                    if (updateLength)
                                        trigger('UPDATED', target, receiver, target.length, "length");
                                    return target;
                                };
                            }
                        }
                        else if (prop == 'pop') {
                            if (target.__isProxy) {
                                result = () => {
                                    let res = target.pop();
                                    return res;
                                };
                            }
                            else {
                                result = () => {
                                    let index = target.length - 1;
                                    let oldValue = receiver.length ? receiver[receiver.length] : undefined;
                                    let res = target.pop();
                                    trigger('DELETED', target, receiver, oldValue, "[" + index + "]");
                                    trigger('UPDATED', target, receiver, target.length, "length");
                                    return res;
                                };
                            }
                        }
                        else {
                            result = element.bind(target);
                        }
                        return result;
                    }
                    else if (target instanceof Map) {
                        let result;
                        if (prop == "set") {
                            if (target.__isProxy) {
                                result = (key, value) => {
                                    return target.set(key, value);
                                };
                            }
                            else {
                                result = (key, value) => {
                                    const out = {};
                                    let dones = [];
                                    let dones2 = [];
                                    key = Watcher.extract(key);
                                    value = replaceByAlias(target, value, key + '', receiver, false, out);
                                    if (out.otherRoot) {
                                        dones.push(out.otherRoot);
                                        dones2.push(out.otherRoot);
                                    }
                                    let result = target.set(key, value);
                                    trigger('CREATED', target, receiver, receiver.get(key), key + '', dones);
                                    trigger('UPDATED', target, receiver, target.size, "size", dones2);
                                    return result;
                                };
                            }
                        }
                        else if (prop == "clear") {
                            if (target.__isProxy) {
                                result = () => {
                                    return target.clear();
                                };
                            }
                            else {
                                result = () => {
                                    let keys = target.keys();
                                    for (let key of keys) {
                                        let oldValue = receiver.get(key);
                                        target.delete(key);
                                        trigger('DELETED', target, receiver, oldValue, key);
                                        trigger('UPDATED', target, receiver, target.size, "size");
                                    }
                                };
                            }
                        }
                        else if (prop == "delete") {
                            if (target.__isProxy) {
                                result = (key) => {
                                    return target.delete(key);
                                };
                            }
                            else {
                                result = (key) => {
                                    key = Watcher.extract(key);
                                    let oldValue = receiver.get(key);
                                    let res = target.delete(key);
                                    trigger('DELETED', target, receiver, oldValue, key + '');
                                    trigger('UPDATED', target, receiver, target.size, "size");
                                    return res;
                                };
                            }
                        }
                        else {
                            result = element.bind(target);
                        }
                        return result;
                    }
                    return element.bind(target);
                }
                if (element instanceof Computed) {
                    return element.value;
                }
                if (Watcher._registering.length > 0) {
                    let currentPath;
                    let fullPath;
                    let isArray = Array.isArray(receiver);
                    if (isArray && /^[0-9]*$/g.exec(prop)) {
                        fullPath = receiver.__path + "[" + prop + "]";
                        currentPath = "[" + prop + "]";
                    }
                    else {
                        fullPath = receiver.__path ? receiver.__path + '.' + prop : prop;
                        currentPath = prop;
                    }
                    Watcher._register?.register(receiver, currentPath, Watcher._register.version, fullPath);
                }
                if (typeof (element) == 'object') {
                    return this.getProxyObject(target, element, prop);
                }
                return Watcher.isNative(target) ? Reflect.get(target, prop) : Reflect.get(target, prop, receiver);
            },
            set(target, prop, value, receiver) {
                if (typeof prop == 'symbol') {
                    if (Watcher.isNative(target))
                        return Reflect.set(target, prop, value);
                    return Reflect.set(target, prop, value, receiver);
                }
                let oldValue = Watcher.isNative(target) ? Reflect.get(target, prop) : Reflect.get(target, prop, receiver);
                value = replaceByAlias(target, value, prop, receiver, true);
                if (value instanceof Signal) {
                    value = value.value;
                }
                let triggerChange = false;
                if (!reservedName[prop]) {
                    if (Array.isArray(receiver)) {
                        if (prop != "length") {
                            triggerChange = true;
                        }
                    }
                    else {
                        if (!compareObject(value, oldValue)) {
                            triggerChange = true;
                        }
                    }
                    if (Watcher.__triggerForced) {
                        triggerChange = true;
                    }
                }
                let result = Watcher.isNative(target) ? Reflect.set(target, prop, value) : Reflect.set(target, prop, value, receiver);
                if (triggerChange) {
                    let index = this.avoidUpdate.indexOf(prop);
                    if (index == -1) {
                        let dones = this.injectedDones ?? [];
                        this.injectedDones = null;
                        trigger('UPDATED', target, receiver, value, prop, dones);
                    }
                    else {
                        this.avoidUpdate.splice(index, 1);
                    }
                }
                return result;
            },
            deleteProperty(target, prop) {
                if (typeof prop == 'symbol') {
                    return Reflect.deleteProperty(target, prop);
                }
                let triggerChange = false;
                let pathToDelete = '';
                if (!reservedName[prop]) {
                    if (Array.isArray(target)) {
                        if (prop != "length") {
                            if (target.__path) {
                                pathToDelete = target.__path;
                            }
                            pathToDelete += "[" + prop + "]";
                            triggerChange = true;
                        }
                    }
                    else {
                        if (target.__path) {
                            pathToDelete = target.__path + '.';
                        }
                        pathToDelete += prop;
                        triggerChange = true;
                    }
                }
                if (internalAliases[pathToDelete]) {
                    internalAliases[pathToDelete].unbind();
                }
                if (target.hasOwnProperty(prop)) {
                    let oldValue = target[prop];
                    if (oldValue instanceof Effect || oldValue instanceof Signal) {
                        oldValue.destroy();
                    }
                    delete target[prop];
                    if (triggerChange) {
                        clearReservedNames(oldValue);
                        trigger('DELETED', target, null, oldValue, prop);
                    }
                    return true;
                }
                return false;
            },
            defineProperty(target, prop, descriptor) {
                if (typeof prop == 'symbol') {
                    return Reflect.defineProperty(target, prop, descriptor);
                }
                let triggerChange = false;
                let newPath = '';
                if (!reservedName[prop]) {
                    if (Array.isArray(target)) {
                        if (prop != "length") {
                            if (target.__path) {
                                newPath = target.__path;
                            }
                            newPath += "[" + prop + "]";
                            if (!target.hasOwnProperty(prop)) {
                                triggerChange = true;
                            }
                        }
                    }
                    else {
                        if (target.__path) {
                            newPath = target.__path + '.';
                        }
                        newPath += prop;
                        if (!target.hasOwnProperty(prop)) {
                            triggerChange = true;
                        }
                    }
                }
                let result = Reflect.defineProperty(target, prop, descriptor);
                if (triggerChange) {
                    this.avoidUpdate.push(prop);
                    let proxyEl = this.getProxyObject(target, descriptor.value, prop);
                    target[prop] = proxyEl;
                    trigger('CREATED', target, null, proxyEl, prop);
                }
                return result;
            },
            ownKeys(target) {
                let result = Reflect.ownKeys(target);
                for (let i = 0; i < result.length; i++) {
                    let key = result[i];
                    if (typeof key == 'string') {
                        if (reservedName[key]) {
                            result.splice(i, 1);
                            i--;
                        }
                    }
                }
                return result;
            },
        };
        if (onDataChanged) {
            proxyData.callbacks[''] = [onDataChanged];
        }
        const trigger = (type, target, receiver, value, prop, dones = []) => {
            if (dones.includes(proxyData.baseData)) {
                return;
            }
            if (target.__isProxy) {
                return;
            }
            let rootPath;
            if (receiver == null) {
                rootPath = target.__path;
            }
            else {
                rootPath = receiver.__path;
            }
            if (rootPath != "") {
                if (Array.isArray(receiver)) {
                    if (prop && !prop.startsWith("[")) {
                        if (/^[0-9]*$/g.exec(prop)) {
                            rootPath += "[" + prop + "]";
                        }
                        else {
                            rootPath += "." + prop;
                        }
                    }
                    else {
                        rootPath += prop;
                    }
                }
                else {
                    if (prop && !prop.startsWith("[")) {
                        rootPath += ".";
                    }
                    rootPath += prop;
                }
            }
            else {
                rootPath = prop;
            }
            let stacks = [];
            if (proxyData.useHistory) {
                let allStacks = new Error().stack?.split("\n") ?? [];
                for (let i = allStacks.length - 1; i >= 0; i--) {
                    let current = allStacks[i].trim().replace("at ", "");
                    if (current.startsWith("Object.set") || current.startsWith("Proxy.result")) {
                        break;
                    }
                    stacks.push(current);
                }
            }
            dones.push(proxyData.baseData);
            let aliasesDone = [];
            for (let name in proxyData.callbacks) {
                let pathToSend = rootPath;
                if (name !== "") {
                    let regex = new RegExp("^" + name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + "(\\.|(\\[)|$)");
                    if (!regex.test(rootPath)) {
                        let regex2 = new RegExp("^" + rootPath.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + "(\\.|(\\[)|$)");
                        if (!regex2.test(name)) {
                            continue;
                        }
                        else {
                            pathToSend = "";
                        }
                    }
                    else {
                        pathToSend = rootPath.replace(regex, "$2");
                    }
                }
                if (name === "" && proxyData.useHistory) {
                    proxyData.history.push({
                        object: JSON.parse(JSON.stringify(proxyData.baseData, jsonReplacer)),
                        trace: stacks.reverse(),
                        action: WatchAction[type],
                        path: pathToSend
                    });
                }
                let cbs = [...proxyData.callbacks[name]];
                for (let cb of cbs) {
                    try {
                        cb(WatchAction[type], pathToSend, value, dones);
                    }
                    catch (e) {
                        if (e != 'impossible')
                            console.error(e);
                    }
                }
                for (let [key, infos] of aliases) {
                    if (!dones.includes(key)) {
                        for (let info of infos) {
                            if (info.name == name) {
                                aliasesDone.push(key);
                                if (target.__path) {
                                    let oldPath = target.__path;
                                    info.fct(type, target, receiver, value, prop, dones);
                                    target.__path = oldPath;
                                }
                                else {
                                    info.fct(type, target, receiver, value, prop, dones);
                                }
                            }
                        }
                    }
                }
            }
            for (let [key, infos] of aliases) {
                if (!dones.includes(key) && !aliasesDone.includes(key)) {
                    for (let info of infos) {
                        let regex = new RegExp("^" + info.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + "(\\.|(\\[)|$)");
                        if (!regex.test(rootPath)) {
                            continue;
                        }
                        let newProp = rootPath.replace(info.name, "");
                        if (newProp.startsWith(".")) {
                            newProp = newProp.slice(1);
                        }
                        if (target.__path) {
                            let oldPath = target.__path;
                            info.fct(type, target, receiver, value, newProp, dones);
                            target.__path = oldPath;
                        }
                        else {
                            info.fct(type, target, receiver, value, newProp, dones);
                        }
                    }
                }
            }
        };
        var realProxy = new Proxy(obj, proxyData);
        proxyData.baseData = obj;
        setProxyPath(realProxy, '');
        return realProxy;
    }
    static is(obj) {
        return typeof obj == 'object' && obj.__isProxy;
    }
    static extract(obj, clearPath = false) {
        if (this.is(obj)) {
            return obj.getTarget(clearPath);
        }
        else {
            if (obj instanceof Object) {
                for (let key in this.__reservedName) {
                    delete obj[key];
                }
            }
        }
        return obj;
    }
    static trigger(type, target) {
        if (this.is(target)) {
            target.__static_trigger(type);
        }
    }
    /**
     * Create a computed variable that will watch any changes
     */
    static computed(fct) {
        const comp = new Computed(fct);
        return comp;
    }
    /**
     * Create an effect variable that will watch any changes
     */
    static effect(fct) {
        const comp = new Effect(fct);
        return comp;
    }
    /**
     * Create an effect variable that will watch any changes inside the fct and trigger the cb on change
     */
    static watch(fct, cb) {
        const comp = new Effect(fct);
        comp.subscribe(cb);
        return comp;
    }
    /**
     * Create a signal variable
     */
    static signal(item, onChange) {
        return new Signal(item, onChange);
    }
}
Watcher.Namespace=`Aventus`;
__as1(_, 'Watcher', Watcher);

let Computed=class Computed extends Effect {
    _value;
    __path = "*";
    get value() {
        if (!this.isInit) {
            this.init();
        }
        Watcher._register?.register(this, "*", Watcher._register.version, "*");
        return this._value;
    }
    autoInit() {
        return false;
    }
    constructor(fct) {
        super(fct);
    }
    init() {
        this.isInit = true;
        this.computedValue();
    }
    computedValue() {
        this._value = this.run();
    }
    onChange(action, changePath, value, dones) {
        if (!this.checkCanChange(action, changePath, value, dones)) {
            return;
        }
        let oldValue = this._value;
        this.computedValue();
        if (oldValue === this._value) {
            return;
        }
        for (let fct of this.__subscribes) {
            fct(action, changePath, value, dones);
        }
    }
}
Computed.Namespace=`Aventus`;
__as1(_, 'Computed', Computed);

let ComputedNoRecomputed=class ComputedNoRecomputed extends Computed {
    init() {
        this.isInit = true;
        Watcher._registering.push(this);
        this._value = this.fct();
        Watcher._registering.splice(Watcher._registering.length - 1, 1);
    }
    computedValue() {
        if (this.isInit)
            this._value = this.fct();
        else
            this.init();
    }
    run() { }
}
ComputedNoRecomputed.Namespace=`Aventus`;
__as1(_, 'ComputedNoRecomputed', ComputedNoRecomputed);

let PressManager=class PressManager {
    static globalConfig = {
        delayDblPress: 250,
        delayLongPress: 700,
        offsetDrag: 20
    };
    static configure(options) {
        this.globalConfig = options;
    }
    static create(options) {
        if (Array.isArray(options.element)) {
            let result = [];
            for (let el of options.element) {
                let cloneOpt = { ...options };
                cloneOpt.element = el;
                result.push(new PressManager(cloneOpt));
            }
            return result;
        }
        else {
            return new PressManager(options);
        }
    }
    static onEvent = new Callback();
    options;
    element;
    delayDblPress;
    delayLongPress;
    nbPress = 0;
    offsetDrag;
    dragDirection;
    state = {
        oneActionTriggered: null,
    };
    startPosition = { x: 0, y: 0 };
    customFcts = {};
    timeoutDblPress = 0;
    timeoutLongPress = 0;
    downEventSaved;
    useDblPress = false;
    stopPropagation = () => true;
    pointersRecord = {};
    functionsBinded = {
        downAction: (e) => { },
        downActionDelay: (e) => { },
        upAction: (e) => { },
        moveAction: (e) => { },
        childPressStart: (e) => { },
        childPressEnd: (e) => { },
        childPressMove: (e) => { }
    };
    /**
     * @param {*} options - The options
     * @param {HTMLElement | HTMLElement[]} options.element - The element to manage
     */
    constructor(options) {
        if (options.element === void 0) {
            throw 'You must provide an element';
        }
        this.offsetDrag = PressManager.globalConfig.offsetDrag !== undefined ? PressManager.globalConfig.offsetDrag : 20;
        this.dragDirection = 'XY';
        this.delayLongPress = PressManager.globalConfig.delayLongPress ?? 700;
        this.delayDblPress = PressManager.globalConfig.delayDblPress ?? 150;
        this.element = options.element;
        this.checkDragConstraint(options);
        this.assignValueOption(options);
        this.options = options;
        this.init();
    }
    /**
     * Get the current element focused by the PressManager
     */
    getElement() {
        return this.element;
    }
    checkDragConstraint(options) {
        if (options.onDrag !== void 0) {
            if (options.onDragStart === void 0) {
                options.onDragStart = (e) => { };
            }
            if (options.onDragEnd === void 0) {
                options.onDragEnd = (e) => { };
            }
        }
        if (options.onDragStart !== void 0) {
            if (options.onDrag === void 0) {
                options.onDrag = (e) => { };
            }
            if (options.onDragEnd === void 0) {
                options.onDragEnd = (e) => { };
            }
        }
        if (options.onDragEnd !== void 0) {
            if (options.onDragStart === void 0) {
                options.onDragStart = (e) => { };
            }
            if (options.onDrag === void 0) {
                options.onDrag = (e) => { };
            }
        }
    }
    assignValueOption(options) {
        if (PressManager.globalConfig.delayDblPress !== undefined) {
            this.delayDblPress = PressManager.globalConfig.delayDblPress;
        }
        if (options.delayDblPress !== undefined) {
            this.delayDblPress = options.delayDblPress;
        }
        if (PressManager.globalConfig.delayLongPress !== undefined) {
            this.delayLongPress = PressManager.globalConfig.delayLongPress;
        }
        if (options.delayLongPress !== undefined) {
            this.delayLongPress = options.delayLongPress;
        }
        if (PressManager.globalConfig.offsetDrag !== undefined) {
            this.offsetDrag = PressManager.globalConfig.offsetDrag;
        }
        if (options.offsetDrag !== undefined) {
            this.offsetDrag = options.offsetDrag;
        }
        if (options.dragDirection !== undefined) {
            this.dragDirection = options.dragDirection;
        }
        if (options.onDblPress !== undefined) {
            this.useDblPress = true;
        }
        if (PressManager.globalConfig.forceDblPress !== undefined) {
            this.useDblPress = PressManager.globalConfig.forceDblPress;
        }
        if (options.forceDblPress !== undefined) {
            this.useDblPress = options.forceDblPress;
        }
        if (typeof PressManager.globalConfig.stopPropagation == 'function') {
            this.stopPropagation = PressManager.globalConfig.stopPropagation;
        }
        else if (options.stopPropagation === false) {
            this.stopPropagation = () => false;
        }
        if (typeof options.stopPropagation == 'function') {
            this.stopPropagation = options.stopPropagation;
        }
        else if (options.stopPropagation === false) {
            this.stopPropagation = () => false;
        }
        if (!options.buttonAllowed)
            options.buttonAllowed = PressManager.globalConfig.buttonAllowed;
        if (!options.buttonAllowed)
            options.buttonAllowed = [0];
        if (!options.onEvent)
            options.onEvent = PressManager.globalConfig.onEvent;
    }
    bindAllFunction() {
        this.functionsBinded.downAction = this.downAction.bind(this);
        this.functionsBinded.downActionDelay = this.downActionDelay.bind(this);
        this.functionsBinded.moveAction = this.moveAction.bind(this);
        this.functionsBinded.upAction = this.upAction.bind(this);
        this.functionsBinded.childPressStart = this.childPressStart.bind(this);
        this.functionsBinded.childPressEnd = this.childPressEnd.bind(this);
        this.functionsBinded.childPressMove = this.childPressMove.bind(this);
    }
    init() {
        this.bindAllFunction();
        this.element.addEventListener("pointerdown", this.functionsBinded.downAction);
        this.element.addEventListener("touchstart", this.functionsBinded.downActionDelay);
        this.element.addEventListener("trigger_pointer_pressstart", this.functionsBinded.childPressStart);
        this.element.addEventListener("trigger_pointer_pressend", this.functionsBinded.childPressEnd);
        this.element.addEventListener("trigger_pointer_pressmove", this.functionsBinded.childPressMove);
    }
    identifyEvent(touch) {
        if ('Touch' in window && touch instanceof Touch)
            return touch.identifier;
        return touch.pointerId;
    }
    registerEvent(ev) {
        if ('TouchEvent' in window && ev instanceof TouchEvent) {
            for (let touch of ev.targetTouches) {
                const id = this.identifyEvent(touch);
                if (this.pointersRecord[id]) {
                    return false;
                }
                this.pointersRecord[id] = ev;
            }
            return true;
        }
        else {
            const id = this.identifyEvent(ev);
            if (this.pointersRecord[id]) {
                return false;
            }
            this.pointersRecord[id] = ev;
            return true;
        }
    }
    unregisterEvent(ev) {
        let result = true;
        if ('TouchEvent' in window && ev instanceof TouchEvent) {
            for (let touch of ev.changedTouches) {
                const id = this.identifyEvent(touch);
                if (!this.pointersRecord[id]) {
                    result = false;
                }
                else {
                    delete this.pointersRecord[id];
                }
            }
        }
        else {
            const id = this.identifyEvent(ev);
            if (!this.pointersRecord[id]) {
                result = false;
            }
            else {
                delete this.pointersRecord[id];
            }
        }
        return result;
    }
    genericDownAction(state, e) {
        this.downEventSaved = e;
        this.startPosition = { x: e.pageX, y: e.pageY };
        if (this.options.onLongPress) {
            this.timeoutLongPress = setTimeout(() => {
                if (!state.oneActionTriggered) {
                    if (this.options.onLongPress) {
                        if (this.options.onLongPress(e, this) !== false) {
                            state.oneActionTriggered = this;
                        }
                    }
                }
            }, this.delayLongPress);
        }
    }
    pointerEventTriggered = false;
    downActionDelay(_ev) {
        const ev = _ev;
        if (!this.pointerEventTriggered) {
            this.downAction(ev);
        }
        else {
            ev.stopImmediatePropagation();
        }
        setTimeout(() => {
            this.pointerEventTriggered = false;
        }, 0);
    }
    downAction(_ev) {
        const ev = _ev;
        this.pointerEventTriggered = true;
        const isFirst = Object.values(this.pointersRecord).length == 0;
        if (!this.registerEvent(ev)) {
            if (this.stopPropagation()) {
                ev.stopImmediatePropagation();
            }
            return;
        }
        const e = new NormalizedEvent(ev);
        if (this.options.onEvent) {
            this.options.onEvent(e);
        }
        PressManager.onEvent.trigger(e, this);
        if (e.button != undefined && !this.options.buttonAllowed?.includes(e.button)) {
            this.unregisterEvent(ev);
            return;
        }
        if (this.stopPropagation()) {
            e.stopImmediatePropagation();
        }
        this.customFcts = {};
        if (this.nbPress == 0 && isFirst) {
            this.state.oneActionTriggered = null;
            clearTimeout(this.timeoutDblPress);
        }
        if (isFirst) {
            document.addEventListener("pointerup", this.functionsBinded.upAction);
            document.addEventListener("pointercancel", this.functionsBinded.upAction);
            document.addEventListener("touchend", this.functionsBinded.upAction);
            document.addEventListener("touchcancel", this.functionsBinded.upAction);
            document.addEventListener("pointermove", this.functionsBinded.moveAction);
        }
        this.genericDownAction(this.state, e);
        if (this.options.onPressStart) {
            this.options.onPressStart(e, this);
            this.lastEmitEvent = e;
            // this.emitTriggerFunctionParent("pressstart", e);
        }
        this.emitTriggerFunction("pressstart", e);
    }
    genericUpAction(state, e) {
        clearTimeout(this.timeoutLongPress);
        if (state.oneActionTriggered == this) {
            if (this.options.onDragEnd) {
                this.options.onDragEnd(e, this);
            }
            else if (this.customFcts.src && this.customFcts.onDragEnd) {
                this.customFcts.onDragEnd(e, this.customFcts.src);
            }
        }
        else {
            if (this.useDblPress) {
                this.nbPress++;
                if (this.nbPress == 2) {
                    if (!state.oneActionTriggered) {
                        this.nbPress = 0;
                        if (this.options.onDblPress) {
                            if (this.options.onDblPress(e, this) !== false) {
                                state.oneActionTriggered = this;
                            }
                        }
                    }
                }
                else if (this.nbPress == 1) {
                    this.timeoutDblPress = setTimeout(() => {
                        this.nbPress = 0;
                        if (!state.oneActionTriggered) {
                            if (this.options.onPress) {
                                if (this.options.onPress(e, this) !== false) {
                                    state.oneActionTriggered = this;
                                }
                            }
                        }
                    }, this.delayDblPress);
                }
            }
            else {
                if (!state.oneActionTriggered) {
                    if (this.options.onPress) {
                        if (this.options.onPress(e, this) !== false) {
                            state.oneActionTriggered = this;
                        }
                    }
                }
            }
        }
    }
    upAction(_ev) {
        const ev = _ev;
        if (!this.unregisterEvent(ev)) {
            if (this.stopPropagation()) {
                ev.stopImmediatePropagation();
            }
            return;
        }
        const e = new NormalizedEvent(ev);
        if (this.options.onEvent) {
            this.options.onEvent(e);
        }
        PressManager.onEvent.trigger(e, this);
        if (this.stopPropagation()) {
            e.stopImmediatePropagation();
        }
        if (Object.values(this.pointersRecord).length == 0) {
            document.removeEventListener("pointerup", this.functionsBinded.upAction);
            document.removeEventListener("pointercancel", this.functionsBinded.upAction);
            document.removeEventListener("touchend", this.functionsBinded.upAction);
            document.removeEventListener("touchcancel", this.functionsBinded.upAction);
            document.removeEventListener("pointermove", this.functionsBinded.moveAction);
        }
        this.genericUpAction(this.state, e);
        if (this.options.onPressEnd) {
            this.options.onPressEnd(e, this);
            this.lastEmitEvent = e;
            // this.emitTriggerFunctionParent("pressend", e);
        }
        this.emitTriggerFunction("pressend", e);
    }
    genericMoveAction(state, e) {
        if (!state.oneActionTriggered) {
            let xDist = e.pageX - this.startPosition.x;
            let yDist = e.pageY - this.startPosition.y;
            let distance = 0;
            if (this.dragDirection == 'XY')
                distance = Math.sqrt(xDist * xDist + yDist * yDist);
            else if (this.dragDirection == 'X')
                distance = Math.abs(xDist);
            else
                distance = Math.abs(yDist);
            if (distance > this.offsetDrag && this.downEventSaved) {
                if (this.options.onDragStart) {
                    if (this.options.onDragStart(this.downEventSaved, this) !== false) {
                        state.oneActionTriggered = this;
                    }
                }
            }
        }
        else if (state.oneActionTriggered == this) {
            if (this.options.onDrag) {
                this.options.onDrag(e, this);
            }
            else if (this.customFcts.src && this.customFcts.onDrag) {
                this.customFcts.onDrag(e, this.customFcts.src);
            }
        }
    }
    moveAction(_ev) {
        const ev = _ev;
        const e = new NormalizedEvent(ev);
        if (this.options.onEvent) {
            this.options.onEvent(e);
        }
        PressManager.onEvent.trigger(e, this);
        if (this.stopPropagation()) {
            e.stopImmediatePropagation();
        }
        this.genericMoveAction(this.state, e);
        this.lastEmitEvent = e;
        // if(this.options.onDrag) {
        //     this.emitTriggerFunctionParent("pressmove", e);
        this.emitTriggerFunction("pressmove", e);
    }
    childPressStart(_e) {
        const e = _e;
        if (this.lastEmitEvent == e.detail.realEvent)
            return;
        this.genericDownAction(e.detail.state, e.detail.realEvent);
        if (this.options.onPressStart) {
            this.options.onPressStart(e.detail.realEvent, this);
        }
    }
    childPressEnd(_e) {
        const e = _e;
        this.unregisterEvent(e.detail.realEvent.event);
        if (Object.values(this.pointersRecord).length == 0) {
            document.removeEventListener("pointerup", this.functionsBinded.upAction);
            document.removeEventListener("pointercancel", this.functionsBinded.upAction);
            document.removeEventListener("touchend", this.functionsBinded.upAction);
            document.removeEventListener("touchcancel", this.functionsBinded.upAction);
            document.removeEventListener("pointermove", this.functionsBinded.moveAction);
        }
        if (this.lastEmitEvent == e.detail.realEvent)
            return;
        this.genericUpAction(e.detail.state, e.detail.realEvent);
        if (this.options.onPressEnd) {
            this.options.onPressEnd(e.detail.realEvent, this);
        }
    }
    childPressMove(_e) {
        const e = _e;
        if (this.lastEmitEvent == e.detail.realEvent)
            return;
        this.genericMoveAction(e.detail.state, e.detail.realEvent);
    }
    lastEmitEvent;
    emitTriggerFunction(action, e, el) {
        let ev = new CustomEvent("trigger_pointer_" + action, {
            bubbles: true,
            cancelable: true,
            composed: true,
            detail: {
                state: this.state,
                customFcts: this.customFcts,
                realEvent: e
            }
        });
        this.lastEmitEvent = e;
        if (!el) {
            el = this.element;
        }
        el.dispatchEvent(ev);
    }
    /**
     * Destroy the Press instance byremoving all events
     */
    destroy() {
        if (this.element) {
            this.element.removeEventListener("pointerdown", this.functionsBinded.downAction);
            this.element.removeEventListener("touchstart", this.functionsBinded.downActionDelay);
            this.element.removeEventListener("trigger_pointer_pressstart", this.functionsBinded.childPressStart);
            this.element.removeEventListener("trigger_pointer_pressend", this.functionsBinded.childPressEnd);
            this.element.removeEventListener("trigger_pointer_pressmove", this.functionsBinded.childPressMove);
            document.removeEventListener("pointerup", this.functionsBinded.upAction);
            document.removeEventListener("pointercancel", this.functionsBinded.upAction);
            document.removeEventListener("touchend", this.functionsBinded.upAction);
            document.removeEventListener("touchcancel", this.functionsBinded.upAction);
            document.removeEventListener("pointermove", this.functionsBinded.moveAction);
        }
    }
}
PressManager.Namespace=`Aventus`;
__as1(_, 'PressManager', PressManager);

let Uri=class Uri {
    static prepare(uri) {
        let params = [];
        let i = 0;
        let regexState = uri.replace(/{.*?}/g, (group, position) => {
            group = group.slice(1, -1);
            let splitted = group.split(":");
            let name = splitted[0].trim();
            let type = "string";
            let result = "([^\\/]+)";
            i++;
            if (splitted.length > 1) {
                if (splitted[1].trim() == "number") {
                    result = "([0-9]+)";
                    type = "number";
                }
            }
            params.push({
                name,
                type,
                position: i
            });
            return result;
        });
        regexState = regexState.replace(/\*/g, ".*?").toLowerCase();
        regexState = "^" + regexState + '$';
        return {
            regex: new RegExp(regexState),
            params
        };
    }
    static getParams(from, current) {
        if (typeof from == "string") {
            from = this.prepare(from);
        }
        let matches = from.regex.exec(current.toLowerCase());
        if (matches) {
            let slugs = {};
            for (let param of from.params) {
                if (param.type == "number") {
                    slugs[param.name] = Number(matches[param.position]);
                }
                else {
                    slugs[param.name] = matches[param.position];
                }
            }
            return slugs;
        }
        return null;
    }
    static isActive(from, current) {
        if (typeof from == "string") {
            from = this.prepare(from);
        }
        return from.regex.test(current);
    }
    static normalize(path) {
        const isAbsolute = path.startsWith('/');
        const parts = path.split('/');
        const normalizedParts = [];
        for (let i = 0; i < parts.length; i++) {
            if (parts[i] === '..') {
                normalizedParts.pop();
            }
            else if (parts[i] !== '.' && parts[i] !== '') {
                normalizedParts.push(parts[i]);
            }
        }
        let normalizedPath = normalizedParts.join('/');
        if (isAbsolute) {
            normalizedPath = '/' + normalizedPath;
        }
        return normalizedPath;
    }
}
Uri.Namespace=`Aventus`;
__as1(_, 'Uri', Uri);

let State=class State {
    /**
     * Activate a custom state inside a specific manager
     * It ll be a generic state with no information inside exept name
     */
    static async activate(stateName, manager) {
        return await manager.setState(stateName);
    }
    /**
     * Activate this state inside a specific manager
     */
    async activate(manager) {
        return await manager.setState(this);
    }
    onActivate() {
    }
    onInactivate(nextState) {
    }
    async askChange(state, nextState) {
        return true;
    }
}
State.Namespace=`Aventus`;
__as1(_, 'State', State);

let EmptyState=class EmptyState extends State {
    localName;
    constructor(stateName) {
        super();
        this.localName = stateName;
    }
    /**
     * @inheritdoc
     */
    get name() {
        return this.localName;
    }
}
EmptyState.Namespace=`Aventus`;
__as1(_, 'EmptyState', EmptyState);

let StateManager=class StateManager {
    subscribers = {};
    static canBeActivate(statePattern, stateName) {
        let stateInfo = Uri.prepare(statePattern);
        return stateInfo.regex.test(stateName);
    }
    activeState;
    changeStateMutex = new Mutex();
    canChangeStateCbs = [];
    afterStateChanged = new Callback();
    /**
     * Subscribe actions for a state or a state list
     */
    subscribe(statePatterns, callbacks, autoActiveState = true) {
        if (!callbacks.active && !callbacks.inactive && !callbacks.askChange) {
            this._log(`Trying to subscribe to state : ${statePatterns} with no callbacks !`, "warning");
            return;
        }
        if (!Array.isArray(statePatterns)) {
            statePatterns = [statePatterns];
        }
        for (let statePattern of statePatterns) {
            if (!this.subscribers.hasOwnProperty(statePattern)) {
                let res = Uri.prepare(statePattern);
                let isActive = this.activeState !== undefined && res.regex.test(this.activeState.name);
                this.subscribers[statePattern] = {
                    "regex": res.regex,
                    "params": res.params,
                    "callbacks": {
                        "active": [],
                        "inactive": [],
                        "askChange": [],
                    },
                    "isActive": isActive,
                };
            }
            if (callbacks.active) {
                if (!Array.isArray(callbacks.active)) {
                    callbacks.active = [callbacks.active];
                }
                for (let activeFct of callbacks.active) {
                    this.subscribers[statePattern].callbacks.active.push(activeFct);
                    if (this.subscribers[statePattern].isActive && this.activeState && autoActiveState) {
                        let slugs = Uri.getParams(this.subscribers[statePattern], this.activeState.name);
                        if (slugs) {
                            activeFct(this.activeState, slugs);
                        }
                    }
                }
            }
            if (callbacks.inactive) {
                if (!Array.isArray(callbacks.inactive)) {
                    callbacks.inactive = [callbacks.inactive];
                }
                for (let inactiveFct of callbacks.inactive) {
                    this.subscribers[statePattern].callbacks.inactive.push(inactiveFct);
                }
            }
            if (callbacks.askChange) {
                if (!Array.isArray(callbacks.askChange)) {
                    callbacks.askChange = [callbacks.askChange];
                }
                for (let askChangeFct of callbacks.askChange) {
                    this.subscribers[statePattern].callbacks.askChange.push(askChangeFct);
                }
            }
        }
    }
    /**
     *
     */
    activateAfterSubscribe(statePatterns, callbacks) {
        if (!Array.isArray(statePatterns)) {
            statePatterns = [statePatterns];
        }
        for (let statePattern of statePatterns) {
            if (callbacks.active) {
                if (!Array.isArray(callbacks.active)) {
                    callbacks.active = [callbacks.active];
                }
                for (let activeFct of callbacks.active) {
                    if (this.subscribers[statePattern].isActive && this.activeState) {
                        let slugs = Uri.getParams(this.subscribers[statePattern], this.activeState.name);
                        if (slugs) {
                            activeFct(this.activeState, slugs);
                        }
                    }
                }
            }
        }
    }
    /**
     * Unsubscribe actions for a state or a state list
     */
    unsubscribe(statePatterns, callbacks) {
        if (!callbacks.active && !callbacks.inactive && !callbacks.askChange) {
            this._log(`Trying to unsubscribe to state : ${statePatterns} with no callbacks !`, "warning");
            return;
        }
        if (!Array.isArray(statePatterns)) {
            statePatterns = [statePatterns];
        }
        for (let statePattern of statePatterns) {
            if (this.subscribers[statePattern]) {
                if (callbacks.active) {
                    if (!Array.isArray(callbacks.active)) {
                        callbacks.active = [callbacks.active];
                    }
                    for (let activeFct of callbacks.active) {
                        let index = this.subscribers[statePattern].callbacks.active.indexOf(activeFct);
                        if (index !== -1) {
                            this.subscribers[statePattern].callbacks.active.splice(index, 1);
                        }
                    }
                }
                if (callbacks.inactive) {
                    if (!Array.isArray(callbacks.inactive)) {
                        callbacks.inactive = [callbacks.inactive];
                    }
                    for (let inactiveFct of callbacks.inactive) {
                        let index = this.subscribers[statePattern].callbacks.inactive.indexOf(inactiveFct);
                        if (index !== -1) {
                            this.subscribers[statePattern].callbacks.inactive.splice(index, 1);
                        }
                    }
                }
                if (callbacks.askChange) {
                    if (!Array.isArray(callbacks.askChange)) {
                        callbacks.askChange = [callbacks.askChange];
                    }
                    for (let askChangeFct of callbacks.askChange) {
                        let index = this.subscribers[statePattern].callbacks.askChange.indexOf(askChangeFct);
                        if (index !== -1) {
                            this.subscribers[statePattern].callbacks.askChange.splice(index, 1);
                        }
                    }
                }
                if (this.subscribers[statePattern].callbacks.active.length === 0 &&
                    this.subscribers[statePattern].callbacks.inactive.length === 0 &&
                    this.subscribers[statePattern].callbacks.askChange.length === 0) {
                    delete this.subscribers[statePattern];
                }
            }
        }
    }
    onAfterStateChanged(cb) {
        this.afterStateChanged.add(cb);
    }
    offAfterStateChanged(cb) {
        this.afterStateChanged.remove(cb);
    }
    assignDefaultState(stateName) {
        return new EmptyState(stateName);
    }
    canChangeState(cb) {
        this.canChangeStateCbs.push(cb);
    }
    /**
     * Activate a current state
     */
    async setState(state) {
        let result = await this.changeStateMutex.safeRunLastAsync(async () => {
            let stateToUse;
            if (typeof state == "string") {
                stateToUse = this.assignDefaultState(state);
            }
            else {
                stateToUse = state;
            }
            if (!stateToUse) {
                this._log("state is undefined", "error");
                this.changeStateMutex.release();
                return false;
            }
            for (let cb of this.canChangeStateCbs) {
                if (!(await cb(stateToUse))) {
                    return false;
                }
            }
            let canChange = true;
            if (this.activeState) {
                let activeToInactive = [];
                let inactiveToActive = [];
                let triggerActive = [];
                canChange = await this.activeState.askChange(this.activeState, stateToUse);
                if (canChange) {
                    for (let statePattern in this.subscribers) {
                        let subscriber = this.subscribers[statePattern];
                        if (subscriber.isActive) {
                            let clone = [...subscriber.callbacks.askChange];
                            let currentSlug = Uri.getParams(subscriber, this.activeState.name);
                            if (currentSlug) {
                                for (let i = 0; i < clone.length; i++) {
                                    let askChange = clone[i];
                                    if (!await askChange(this.activeState, stateToUse, currentSlug)) {
                                        canChange = false;
                                        break;
                                    }
                                }
                            }
                            let slugs = Uri.getParams(subscriber, stateToUse.name);
                            if (slugs === null) {
                                activeToInactive.push(subscriber);
                            }
                            else {
                                triggerActive.push({
                                    subscriber: subscriber,
                                    params: slugs
                                });
                            }
                        }
                        else {
                            let slugs = Uri.getParams(subscriber, stateToUse.name);
                            if (slugs) {
                                inactiveToActive.push({
                                    subscriber,
                                    params: slugs
                                });
                            }
                        }
                        if (!canChange) {
                            break;
                        }
                    }
                }
                if (canChange) {
                    const oldState = this.activeState;
                    this.activeState = stateToUse;
                    oldState.onInactivate(stateToUse);
                    for (let subscriber of activeToInactive) {
                        subscriber.isActive = false;
                        let oldSlug = Uri.getParams(subscriber, oldState.name);
                        if (oldSlug) {
                            let oldSlugNotNull = oldSlug;
                            let callbacks = [...subscriber.callbacks.inactive];
                            for (let callback of callbacks) {
                                callback(oldState, stateToUse, oldSlugNotNull);
                            }
                        }
                    }
                    for (let trigger of triggerActive) {
                        let callbacks = [...trigger.subscriber.callbacks.active];
                        for (let callback of callbacks) {
                            callback(stateToUse, trigger.params);
                        }
                    }
                    for (let trigger of inactiveToActive) {
                        trigger.subscriber.isActive = true;
                        let callbacks = [...trigger.subscriber.callbacks.active];
                        for (let callback of callbacks) {
                            callback(stateToUse, trigger.params);
                        }
                    }
                    stateToUse.onActivate();
                }
            }
            else {
                this.activeState = stateToUse;
                for (let key in this.subscribers) {
                    let slugs = Uri.getParams(this.subscribers[key], stateToUse.name);
                    if (slugs) {
                        let slugsNotNull = slugs;
                        this.subscribers[key].isActive = true;
                        let callbacks = [...this.subscribers[key].callbacks.active];
                        for (let callback of callbacks) {
                            callback(stateToUse, slugsNotNull);
                        }
                    }
                }
                stateToUse.onActivate();
            }
            this.afterStateChanged.trigger();
            return true;
        });
        return result ?? false;
    }
    getState() {
        return this.activeState;
    }
    /**
     * Check if a state is in the subscribers and active, return true if it is, false otherwise
     */
    isStateActive(statePattern) {
        return Uri.isActive(statePattern, this.activeState?.name ?? '');
    }
    /**
     * Get slugs information for the current state, return null if state isn't active
     */
    getStateSlugs(statePattern) {
        return Uri.getParams(statePattern, this.activeState?.name ?? '');
    }
    // 0 = error only / 1 = errors and warning / 2 = error, warning and logs (not implemented)
    logLevel() {
        return 0;
    }
    _log(msg, type) {
        if (type === "error") {
            console.error(msg);
        }
        else if (type === "warning" && this.logLevel() > 0) {
            console.warn(msg);
        }
        else if (type === "info" && this.logLevel() > 1) {
            console.log(msg);
        }
    }
}
StateManager.Namespace=`Aventus`;
__as1(_, 'StateManager', StateManager);

let TemplateContext=class TemplateContext {
    data = {};
    comp;
    computeds = [];
    watch;
    registry;
    isDestroyed = false;
    constructor(component, data = {}, parentContext, registry) {
        this.comp = component;
        this.registry = registry;
        this.watch = Watcher.get({});
        let that = this;
        for (let key in data) {
            if (data[key].__isProxy) {
                Object.defineProperty(this.data, key, {
                    get() {
                        return data[key];
                    }
                });
            }
            else {
                this.watch[key] = data[key];
                Object.defineProperty(this.data, key, {
                    get() {
                        return that.watch[key];
                    }
                });
            }
        }
        if (parentContext) {
            const descriptors = Object.getOwnPropertyDescriptors(parentContext.data);
            for (let name in descriptors) {
                Object.defineProperty(this.data, name, {
                    get() {
                        return parentContext.data[name];
                    }
                });
            }
        }
    }
    print(value) {
        return value == null ? "" : value + "";
    }
    registerIndex() {
        let name = "index";
        let i = 0;
        let fullName = name + i;
        while (this.watch[fullName] !== undefined) {
            i++;
            fullName = name + i;
        }
        return fullName;
    }
    registerLoop(dataName, _indexValue, _indexName, indexName, itemName, onThis) {
        this.watch[_indexName] = _indexValue;
        let getItems;
        let mustBeRecomputed = /if|switch|\?|\[.+?\]/g.test(dataName);
        let _class = mustBeRecomputed ? Computed : ComputedNoRecomputed;
        if (!onThis) {
            getItems = new _class(() => {
                return getValueFromObject(dataName, this.data);
            });
        }
        else {
            dataName = dataName.replace(/^this\./, '');
            getItems = new _class(() => {
                return getValueFromObject(dataName, this.comp);
            });
        }
        let getIndex = new ComputedNoRecomputed(() => {
            let items = getItems.value;
            if (!items)
                throw 'impossible';
            let keys = Object.keys(items);
            let index = keys[_getIndex.value];
            if (/^[0-9]+$/g.test(index))
                return Number(index);
            return index;
        });
        let getItem = new ComputedNoRecomputed(() => {
            let items = getItems.value;
            if (!items)
                throw 'impossible';
            let keys = Object.keys(items);
            let index = keys[_getIndex.value];
            let element = items[index];
            if (element === undefined && (Array.isArray(items) || !items)) {
                if (this.registry) {
                    let indexNb = Number(_getIndex.value);
                    if (!isNaN(indexNb)) {
                        this.registry.templates[indexNb].destructor();
                        this.registry.templates.splice(indexNb, 1);
                        for (let i = indexNb; i < this.registry.templates.length; i++) {
                            this.registry.templates[i].context.decreaseIndex(_indexName);
                        }
                    }
                }
            }
            return element;
        });
        let _getIndex = new ComputedNoRecomputed(() => {
            return this.watch[_indexName];
        });
        this.computeds.push(getIndex);
        this.computeds.push(getItem);
        this.computeds.push(_getIndex);
        if (itemName) {
            Object.defineProperty(this.data, itemName, {
                get() {
                    return getItem.value;
                }
            });
        }
        if (indexName) {
            Object.defineProperty(this.data, indexName, {
                get() {
                    return getIndex.value;
                }
            });
        }
    }
    updateIndex(newIndex, _indexName) {
        // let items: any[] | {};
        // if(!dataName.startsWith("this.")) {
        //     let comp = new Computed(() => {
        //         return getValueFromObject(dataName, this.data);
        //     });
        //     fullName = dataName.replace(/^this\./, '');
        //     items = getValueFromObject(fullName, this.comp);
        // if(Array.isArray(items)) {
        //     let regex = new RegExp("^(" + fullName.replace(/\./g, "\\.") + ")\\[(\\d+?)\\]");
        //     for(let computed of computeds) {
        //         for(let cb of computed.callbacks) {
        //             cb.path = cb.path.replace(regex, "$1[" + newIndex + "]");
        //     let oldKey = Object.keys(items)[this.watch[_indexName]]
        //     let newKey = Object.keys(items)[newIndex]
        //     let regex = new RegExp("^(" + fullName.replace(/\./g, "\\.") + "\\.)(" + oldKey + ")($|\\.)");
        //     for (let computed of computeds) {
        //         for (let cb of computed.callbacks) {
        //             cb.path = cb.path.replace(regex, "$1" + newKey + "$3")
        this.watch[_indexName] = newIndex;
    }
    increaseIndex(_indexName) {
        this.updateIndex(this.watch[_indexName] + 1, _indexName);
    }
    decreaseIndex(_indexName) {
        this.updateIndex(this.watch[_indexName] - 1, _indexName);
    }
    destructor() {
        this.isDestroyed = true;
        for (let computed of this.computeds) {
            computed.destroy();
        }
        this.computeds = [];
    }
    registerWatch(name, value) {
        let that = this;
        that.watch[name] = value;
        Object.defineProperty(that.data, name, {
            get() {
                return that.watch[name];
            }
        });
    }
    updateWatch(name, value, dones) {
        if (Watcher.is(this.watch[name])) {
            this.watch[name].__injectedDones(dones);
        }
        this.watch[name] = value;
    }
    normalizePath(path) {
        path = path.replace(/^this\./, '');
        const regex = /\[(.*?)\]/g;
        let m;
        while ((m = regex.exec(path)) !== null) {
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            let name = m[1];
            let result = getValueFromObject(name, this.data);
            if (result !== undefined) {
                path = path.replace(m[0], `[${result}]`);
            }
        }
        return path;
    }
    getValueFromItem(name) {
        if (!name)
            return undefined;
        let result = getValueFromObject(name, this.data);
        if (result !== undefined) {
            return result;
        }
        result = getValueFromObject(name, this.comp);
        if (result !== undefined) {
            return result;
        }
        return undefined;
    }
    setValueToItem(name, value) {
        setValueToObject(name, this.comp, value);
    }
}
TemplateContext.Namespace=`Aventus`;
__as1(_, 'TemplateContext', TemplateContext);

let TemplateInstance=class TemplateInstance {
    context;
    content;
    actions;
    component;
    _components = {};
    firstRenderUniqueCb = {};
    firstRenderCb = [];
    firstChild;
    lastChild;
    computeds = [];
    renderingComputeds = [];
    loopRegisteries = {};
    loops = [];
    ifs = [];
    isDestroyed = false;
    constructor(component, content, actions, loops, ifs, context) {
        this.component = component;
        this.content = content;
        this.actions = actions;
        this.ifs = ifs;
        this.loops = loops;
        this.context = context ? context : new TemplateContext(component);
        this.firstChild = content.firstElementChild;
        this.lastChild = content.lastElementChild;
        this.selectElements();
        this.transformActionsListening();
    }
    render() {
        this.updateContext();
        this.bindEvents();
        for (let cb of this.firstRenderCb) {
            cb();
        }
        for (let key in this.firstRenderUniqueCb) {
            this.firstRenderUniqueCb[key]();
        }
        this.renderSubTemplate();
    }
    destructor() {
        this.isDestroyed = true;
        for (let name in this.loopRegisteries) {
            let register = this.loopRegisteries[name];
            for (let item of register.templates) {
                item.destructor();
            }
            for (let item of register.computeds) {
                item.destroy();
            }
            if (register.unsub) {
                register.unsub();
            }
        }
        this.loopRegisteries = {};
        this.context.destructor();
        for (let computed of this.computeds) {
            computed.destroy();
        }
        for (let computed of this.renderingComputeds) {
            computed.destroy();
        }
        this.computeds = [];
        this.removeFromDOM();
    }
    removeFromDOM(avoidTrigger = false) {
        if (avoidTrigger) {
            let node = this.firstChild;
            while (node && node != this.lastChild) {
                let next = node.nextElementSibling;
                node.parentNode?.removeChild(node);
                node = next;
            }
            this.lastChild?.parentNode?.removeChild(this.lastChild);
        }
        else {
            let node = this.firstChild;
            while (node && node != this.lastChild) {
                let next = node.nextElementSibling;
                node.remove();
                node = next;
            }
            this.lastChild?.remove();
        }
    }
    selectElements() {
        this._components = {};
        let idEls = Array.from(this.content.querySelectorAll('[_id]'));
        for (let idEl of idEls) {
            let id = idEl.attributes['_id'].value;
            if (!this._components[id]) {
                this._components[id] = [];
            }
            this._components[id].push(idEl);
        }
        if (this.actions.elements) {
            for (let element of this.actions.elements) {
                let components = [];
                for (let id of element.ids) {
                    if (this._components[id]) {
                        components = [...components, ...this._components[id]];
                    }
                }
                if (element.isArray) {
                    setValueToObject(element.name, this.component, components);
                }
                else if (components[0]) {
                    setValueToObject(element.name, this.component, components[0]);
                }
            }
        }
    }
    updateContext() {
        if (this.actions.contextEdits) {
            for (let contextEdit of this.actions.contextEdits) {
                this.renderContextEdit(contextEdit);
            }
        }
    }
    renderContextEdit(edit) {
        let _class = edit.once ? ComputedNoRecomputed : Computed;
        let computed = new _class(() => {
            try {
                return edit.fct(this.context);
            }
            catch (e) {
            }
            return {};
        });
        computed.subscribe((action, path, value, dones) => {
            for (let key in computed.value) {
                let newValue = computed.value[key];
                this.context.updateWatch(key, newValue, dones);
            }
        });
        this.computeds.push(computed);
        for (let key in computed.value) {
            this.context.registerWatch(key, computed.value[key]);
        }
    }
    bindEvents() {
        if (this.actions.events) {
            for (let event of this.actions.events) {
                this.bindEvent(event);
            }
        }
        if (this.actions.pressEvents) {
            for (let event of this.actions.pressEvents) {
                this.bindPressEvent(event);
            }
        }
    }
    bindEvent(event) {
        if (!this._components[event.id]) {
            return;
        }
        if (event.isCallback) {
            for (let el of this._components[event.id]) {
                let cb = getValueFromObject(event.eventName, el);
                if (!cb && el.tagName.includes('-')) {
                    customElements.upgrade(el);
                    cb = getValueFromObject(event.eventName, el);
                }
                cb?.add((...args) => {
                    try {
                        return event.fct(this.context, args);
                    }
                    catch (e) {
                        console.error(e);
                    }
                });
            }
        }
        else {
            for (let el of this._components[event.id]) {
                el.addEventListener(event.eventName, (e) => {
                    try {
                        event.fct(e, this.context);
                    }
                    catch (e) {
                        console.error(e);
                    }
                });
            }
        }
    }
    bindPressEvent(event) {
        let id = event['id'];
        if (id && this._components[id]) {
            let clone = {};
            for (let temp in event) {
                if (temp != 'id') {
                    const ev = event;
                    if (ev[temp] instanceof Function) {
                        clone[temp] = (e, pressInstance) => { ev[temp](e, pressInstance, this.context); };
                    }
                    else {
                        clone[temp] = ev[temp];
                    }
                }
            }
            clone.element = this._components[id];
            PressManager.create(clone);
        }
    }
    transformActionsListening() {
        if (this.actions.content) {
            for (let name in this.actions.content) {
                this.transformChangeAction(name, this.actions.content[name]);
            }
        }
        if (this.actions.injection) {
            for (let injection of this.actions.injection) {
                this.transformInjectionAction(injection);
            }
        }
        if (this.actions.bindings) {
            for (let binding of this.actions.bindings) {
                this.transformBindigAction(binding);
            }
        }
    }
    transformChangeAction(name, change) {
        const [id, attr] = name.split("°");
        if (!this._components[id])
            return;
        let apply = () => { };
        if (attr == "@HTML") {
            apply = () => {
                let value = this.context.print(computed.value);
                for (const el of this._components[id])
                    el.innerHTML = value;
            };
        }
        else {
            apply = () => {
                let value = this.context.print(computed.value);
                if (value === "false") {
                    for (const el of this._components[id]) {
                        el.removeAttribute(attr);
                    }
                }
                else {
                    for (const el of this._components[id]) {
                        el.setAttribute(attr, value);
                    }
                }
            };
        }
        let _class = change.once ? ComputedNoRecomputed : Computed;
        let computed = new _class(() => {
            try {
                return change.fct(this.context);
            }
            catch (e) {
                if (e instanceof TypeError && e.message.includes("undefined")) {
                    if (computed instanceof ComputedNoRecomputed) {
                        computed.isInit = false;
                    }
                }
                else {
                    console.error(e);
                }
            }
            return "";
        });
        let timeout;
        computed.subscribe((action, path, value, dones) => {
            clearTimeout(timeout);
            // add timeout to group change that append on the same frame (for example index update)
            timeout = setTimeout(() => {
                if (computed.isDestroy)
                    return;
                apply();
            });
        });
        this.renderingComputeds.push(computed);
        this.firstRenderUniqueCb[name] = () => {
            apply();
        };
    }
    transformInjectionAction(injection) {
        if (!this._components[injection.id])
            return;
        let _class = injection.once ? ComputedNoRecomputed : Computed;
        let computed = new _class(() => {
            try {
                return injection.inject(this.context);
            }
            catch (e) {
                if (e instanceof TypeError && e.message.includes("undefined")) {
                    if (computed instanceof ComputedNoRecomputed) {
                        computed.isInit = false;
                    }
                }
                else {
                    console.error(e);
                }
            }
        });
        this.computeds.push(computed);
        computed.subscribe((action, path, value, dones) => {
            for (const el of this._components[injection.id]) {
                if (el instanceof WebComponent && el.__watch && Object.hasOwn(el.__watch, injection.injectionName)) {
                    el.__watch.__injectedDones(dones);
                }
                el[injection.injectionName] = computed.value;
            }
        });
        this.firstRenderCb.push(() => {
            for (const el of this._components[injection.id]) {
                customElements.upgrade(el);
                el[injection.injectionName] = computed.value;
            }
        });
    }
    transformBindigAction(binding) {
        let isLocalChange = false;
        let _class = binding.once ? ComputedNoRecomputed : Computed;
        let computed = new _class(() => {
            try {
                return binding.inject(this.context);
            }
            catch (e) {
                if (e instanceof TypeError && e.message.includes("undefined")) {
                    if (computed instanceof ComputedNoRecomputed) {
                        computed.isInit = false;
                    }
                }
                else {
                    console.error(e);
                }
            }
        });
        this.computeds.push(computed);
        computed.subscribe((action, path, value, dones) => {
            if (isLocalChange)
                return;
            for (const el of this._components[binding.id]) {
                if (el instanceof WebComponent && el.__watch && Object.hasOwn(el.__watch, binding.injectionName)) {
                    el.__watch.__injectedDones(dones);
                }
                el[binding.injectionName] = computed.value;
            }
        });
        this.firstRenderCb.push(() => {
            for (const el of this._components[binding.id]) {
                customElements.upgrade(el);
                el[binding.injectionName] = computed.value;
            }
        });
        if (binding.isCallback) {
            this.firstRenderCb.push(() => {
                for (var el of this._components[binding.id]) {
                    for (let fct of binding.eventNames) {
                        let cb = getValueFromObject(fct, el);
                        if (!cb && el.tagName.includes('-')) {
                            customElements.upgrade(el);
                            cb = getValueFromObject(binding.injectionName, el);
                        }
                        cb?.add((value) => {
                            let valueToSet = getValueFromObject(binding.injectionName, el);
                            isLocalChange = true;
                            binding.extract(this.context, valueToSet);
                            isLocalChange = false;
                        });
                    }
                }
            });
        }
        else {
            this.firstRenderCb.push(() => {
                for (var el of this._components[binding.id]) {
                    customElements.upgrade(el);
                    for (let fct of binding.eventNames) {
                        el.addEventListener(fct, (e) => {
                            let valueToSet = getValueFromObject(binding.injectionName, e.target);
                            isLocalChange = true;
                            binding.extract(this.context, valueToSet);
                            isLocalChange = false;
                        });
                    }
                }
            });
        }
    }
    renderSubTemplate() {
        for (let loop of this.loops) {
            this.renderLoop(loop);
        }
        for (let _if of this.ifs) {
            this.renderIf(_if);
        }
    }
    renderLoop(loop) {
        if (loop.func) {
            this.renderLoopComplex(loop);
        }
        else if (loop.simple) {
            this.renderLoopSimple(loop, loop.simple);
        }
    }
    resetLoopComplex(anchorId) {
        if (this.loopRegisteries[anchorId]) {
            for (let item of this.loopRegisteries[anchorId].templates) {
                item.destructor();
            }
            for (let item of this.loopRegisteries[anchorId].computeds) {
                item.destroy();
            }
        }
        this.loopRegisteries[anchorId] = {
            templates: [],
            computeds: [],
        };
    }
    renderLoopComplex(loop) {
        if (!loop.func)
            return;
        let fctsTemp = loop.func.bind(this.component)(this.context);
        let fcts = {
            apply: fctsTemp.apply,
            condition: fctsTemp.condition,
            transform: fctsTemp.transform ?? (() => { })
        };
        this.resetLoopComplex(loop.anchorId);
        let computedsCondition = [];
        let alreadyRecreated = false;
        const createComputedCondition = () => {
            let compCondition = new Computed(() => {
                return fcts.condition();
            });
            compCondition.value;
            compCondition.subscribe((action, path, value) => {
                if (!alreadyRecreated) {
                    alreadyRecreated = true;
                    this.renderLoopComplex(loop);
                }
            });
            computedsCondition.push(compCondition);
            this.loopRegisteries[loop.anchorId].computeds.push(compCondition);
            return compCondition;
        };
        let result = [];
        let compCondition = createComputedCondition();
        while (compCondition.value) {
            result.push(fcts.apply());
            fcts.transform();
            compCondition = createComputedCondition();
        }
        let anchor = this._components[loop.anchorId][0];
        for (let i = 0; i < result.length; i++) {
            let context = new TemplateContext(this.component, result[i], this.context, this.loopRegisteries[loop.anchorId]);
            let content = loop.template.template?.content.cloneNode(true);
            document.adoptNode(content);
            customElements.upgrade(content);
            let actions = loop.template.actions;
            let instance = new TemplateInstance(this.component, content, actions, loop.template.loops, loop.template.ifs, context);
            instance.render();
            anchor.parentNode?.insertBefore(instance.content, anchor);
            this.loopRegisteries[loop.anchorId].templates.push(instance);
        }
    }
    resetLoopSimple(anchorId, basePath) {
        let register = this.loopRegisteries[anchorId];
        if (register?.unsub) {
            register.unsub();
        }
        this.resetLoopComplex(anchorId);
    }
    renderLoopSimple(loop, simple) {
        let onThis = simple.data.startsWith("this.");
        let basePath = this.context.normalizePath(simple.data);
        this.resetLoopSimple(loop.anchorId, basePath);
        let getElements = () => this.context.getValueFromItem(basePath);
        let elements = getElements();
        if (!elements) {
            let currentPath = basePath;
            while (currentPath != '' && !elements) {
                let splittedPath = currentPath.split(".");
                splittedPath.pop();
                currentPath = splittedPath.join(".");
                elements = this.context.getValueFromItem(currentPath);
            }
            if (!elements && onThis) {
                const splittedPath = basePath.split(".");
                const firstPart = splittedPath.length > 0 ? splittedPath[0] : null;
                if (firstPart && this.component.__signals[firstPart]) {
                    elements = this.component.__signals[firstPart];
                }
                else {
                    elements = this.component.__watch;
                }
            }
            if (!elements || !(elements.__isProxy || elements instanceof Signal)) {
                debugger;
            }
            const subTemp = (action, path, value) => {
                if (basePath.startsWith(path) || path == "*") {
                    elements.unsubscribe(subTemp);
                    this.renderLoopSimple(loop, simple);
                    return;
                }
            };
            elements.subscribe(subTemp);
            return;
        }
        let indexName = this.context.registerIndex();
        let keys = Object.keys(elements);
        if (elements.__isProxy) {
            let regexArray = new RegExp("^\\[(\\d+?)\\]$");
            let regexObject = new RegExp("^([^\\.]*)$");
            let sub = (action, path, value) => {
                if (path == "") {
                    this.renderLoopSimple(loop, simple);
                    return;
                }
                if (action == WatchAction.UPDATED) {
                    return;
                }
                let index = undefined;
                regexArray.lastIndex = 0;
                regexObject.lastIndex = 0;
                let resultArray = regexArray.exec(path);
                if (resultArray) {
                    index = Number(resultArray[1]);
                }
                else {
                    let resultObject = regexObject.exec(path);
                    if (resultObject) {
                        let oldKey = resultObject[1];
                        if (action == WatchAction.CREATED) {
                            keys = Object.keys(getElements());
                            index = keys.indexOf(oldKey);
                        }
                        else if (action == WatchAction.DELETED) {
                            index = keys.indexOf(oldKey);
                            keys = Object.keys(getElements());
                        }
                    }
                }
                if (index !== undefined) {
                    let registry = this.loopRegisteries[loop.anchorId];
                    if (action == WatchAction.CREATED) {
                        let context = new TemplateContext(this.component, {}, this.context, registry);
                        context.registerLoop(basePath, index, indexName, simple.index, simple.item, onThis);
                        let content = loop.template.template?.content.cloneNode(true);
                        document.adoptNode(content);
                        customElements.upgrade(content);
                        let actions = loop.template.actions;
                        let instance = new TemplateInstance(this.component, content, actions, loop.template.loops, loop.template.ifs, context);
                        instance.render();
                        let anchor;
                        if (index < registry.templates.length) {
                            anchor = registry.templates[index].firstChild;
                        }
                        else {
                            anchor = this._components[loop.anchorId][0];
                        }
                        anchor?.parentNode?.insertBefore(instance.content, anchor);
                        registry.templates.splice(index, 0, instance);
                        for (let i = index + 1; i < registry.templates.length; i++) {
                            registry.templates[i].context.increaseIndex(indexName);
                        }
                    }
                    else if (action == WatchAction.DELETED) {
                        registry.templates[index].destructor();
                        registry.templates.splice(index, 1);
                        for (let i = index; i < registry.templates.length; i++) {
                            registry.templates[i].context.decreaseIndex(indexName);
                        }
                    }
                }
            };
            this.loopRegisteries[loop.anchorId].unsub = () => {
                elements.unsubscribe(sub);
            };
            elements.subscribe(sub);
        }
        let anchor = this._components[loop.anchorId][0];
        for (let i = 0; i < keys.length; i++) {
            let context = new TemplateContext(this.component, {}, this.context, this.loopRegisteries[loop.anchorId]);
            context.registerLoop(basePath, i, indexName, simple.index, simple.item, onThis);
            let content = loop.template.template?.content.cloneNode(true);
            document.adoptNode(content);
            customElements.upgrade(content);
            let actions = loop.template.actions;
            let instance = new TemplateInstance(this.component, content, actions, loop.template.loops, loop.template.ifs, context);
            instance.render();
            anchor.parentNode?.insertBefore(instance.content, anchor);
            this.loopRegisteries[loop.anchorId].templates.push(instance);
        }
    }
    renderIf(_if) {
        // this.renderIfMemory(_if);
        this.renderIfRecreate(_if);
    }
    renderIfMemory(_if) {
        let computeds = [];
        let instances = [];
        if (!this._components[_if.anchorId] || this._components[_if.anchorId].length == 0)
            return;
        let anchor = this._components[_if.anchorId][0];
        let currentActive = -1;
        const calculateActive = () => {
            let newActive = -1;
            for (let i = 0; i < _if.parts.length; i++) {
                if (computeds[i].value) {
                    newActive = i;
                    break;
                }
            }
            if (newActive == currentActive) {
                return;
            }
            if (currentActive != -1) {
                let instance = instances[currentActive];
                let node = instance.firstChild;
                while (node && node != instance.lastChild) {
                    let next = node.nextElementSibling;
                    instance.content.appendChild(node);
                    node = next;
                }
                if (instance.lastChild)
                    instance.content.appendChild(instance.lastChild);
            }
            currentActive = newActive;
            if (instances[currentActive])
                anchor.parentNode?.insertBefore(instances[currentActive].content, anchor);
        };
        for (let i = 0; i < _if.parts.length; i++) {
            const part = _if.parts[i];
            let _class = part.once ? ComputedNoRecomputed : Computed;
            let computed = new _class(() => {
                return part.condition(this.context);
            });
            computeds.push(computed);
            computed.subscribe(() => {
                calculateActive();
            });
            this.computeds.push(computed);
            let context = new TemplateContext(this.component, {}, this.context);
            let content = part.template.template?.content.cloneNode(true);
            document.adoptNode(content);
            customElements.upgrade(content);
            let actions = part.template.actions;
            let instance = new TemplateInstance(this.component, content, actions, part.template.loops, part.template.ifs, context);
            instances.push(instance);
            instance.render();
        }
        calculateActive();
    }
    renderIfRecreate(_if) {
        let computeds = [];
        if (!this._components[_if.anchorId] || this._components[_if.anchorId].length == 0)
            return;
        let anchor = this._components[_if.anchorId][0];
        let currentActive = undefined;
        let currentActiveNb = -1;
        const createContext = () => {
            if (currentActiveNb < 0 || currentActiveNb > _if.parts.length - 1) {
                currentActive = undefined;
                return;
            }
            const part = _if.parts[currentActiveNb];
            let context = new TemplateContext(this.component, {}, this.context);
            let content = part.template.template?.content.cloneNode(true);
            document.adoptNode(content);
            customElements.upgrade(content);
            let actions = part.template.actions;
            let instance = new TemplateInstance(this.component, content, actions, part.template.loops, part.template.ifs, context);
            currentActive = instance;
            instance.render();
            anchor.parentNode?.insertBefore(currentActive.content, anchor);
        };
        for (let i = 0; i < _if.parts.length; i++) {
            const part = _if.parts[i];
            let _class = part.once ? ComputedNoRecomputed : Computed;
            let computed = new _class(() => {
                return part.condition(this.context);
            });
            computeds.push(computed);
            computed.subscribe(() => {
                calculateActive();
            });
            this.computeds.push(computed);
        }
        const calculateActive = () => {
            let newActive = -1;
            for (let i = 0; i < _if.parts.length; i++) {
                if (computeds[i].value) {
                    newActive = i;
                    break;
                }
            }
            if (newActive == currentActiveNb) {
                return;
            }
            if (currentActive) {
                currentActive.destructor();
            }
            currentActiveNb = newActive;
            createContext();
        };
        calculateActive();
    }
}
TemplateInstance.Namespace=`Aventus`;
__as1(_, 'TemplateInstance', TemplateInstance);

let Template=class Template {
    static validatePath(path, pathToCheck) {
        if (pathToCheck.startsWith(path)) {
            return true;
        }
        return false;
    }
    cst;
    constructor(component) {
        this.cst = component;
    }
    htmlParts = [];
    setHTML(data) {
        this.htmlParts.push(data);
    }
    generateTemplate() {
        this.template = document.createElement('template');
        let currentHTML = "<slot></slot>";
        let previousSlots = {
            default: '<slot></slot>'
        };
        for (let htmlPart of this.htmlParts) {
            for (let blockName in htmlPart.blocks) {
                if (!previousSlots.hasOwnProperty(blockName)) {
                    throw "can't found slot with name " + blockName;
                }
                currentHTML = currentHTML.replace(previousSlots[blockName], htmlPart.blocks[blockName]);
            }
            for (let slotName in htmlPart.slots) {
                previousSlots[slotName] = htmlPart.slots[slotName];
            }
        }
        this.template.innerHTML = currentHTML;
    }
    /**
     * Used by the for loop and the if
     * @param template
     */
    setTemplate(template) {
        this.template = document.createElement('template');
        this.template.innerHTML = template;
    }
    template;
    actions = {};
    setActions(actions) {
        if (!this.actions) {
            this.actions = actions;
        }
        else {
            if (actions.elements) {
                if (!this.actions.elements) {
                    this.actions.elements = [];
                }
                this.actions.elements = [...actions.elements, ...this.actions.elements];
            }
            if (actions.events) {
                if (!this.actions.events) {
                    this.actions.events = [];
                }
                this.actions.events = [...actions.events, ...this.actions.events];
            }
            if (actions.pressEvents) {
                if (!this.actions.pressEvents) {
                    this.actions.pressEvents = [];
                }
                this.actions.pressEvents = [...actions.pressEvents, ...this.actions.pressEvents];
            }
            if (actions.content) {
                if (!this.actions.content) {
                    this.actions.content = actions.content;
                }
                else {
                    for (let contextProp in actions.content) {
                        if (!this.actions.content[contextProp]) {
                            this.actions.content[contextProp] = actions.content[contextProp];
                        }
                        else {
                            throw 'this should be impossible';
                        }
                    }
                }
            }
            if (actions.injection) {
                if (!this.actions.injection) {
                    this.actions.injection = actions.injection;
                }
                else {
                    for (let contextProp in actions.injection) {
                        if (!this.actions.injection[contextProp]) {
                            this.actions.injection[contextProp] = actions.injection[contextProp];
                        }
                        else {
                            this.actions.injection[contextProp] = { ...actions.injection[contextProp], ...this.actions.injection[contextProp] };
                        }
                    }
                }
            }
            if (actions.bindings) {
                if (!this.actions.bindings) {
                    this.actions.bindings = actions.bindings;
                }
                else {
                    for (let contextProp in actions.bindings) {
                        if (!this.actions.bindings[contextProp]) {
                            this.actions.bindings[contextProp] = actions.bindings[contextProp];
                        }
                        else {
                            this.actions.bindings[contextProp] = { ...actions.bindings[contextProp], ...this.actions.bindings[contextProp] };
                        }
                    }
                }
            }
            if (actions.contextEdits) {
                if (!this.actions.contextEdits) {
                    this.actions.contextEdits = [];
                }
                this.actions.contextEdits = [...actions.contextEdits, ...this.actions.contextEdits];
            }
        }
    }
    loops = [];
    addLoop(loop) {
        this.loops.push(loop);
    }
    ifs = [];
    addIf(_if) {
        this.ifs.push(_if);
    }
    createInstance(component) {
        let content = this.template.content.cloneNode(true);
        document.adoptNode(content);
        customElements.upgrade(content);
        return new TemplateInstance(component, content, this.actions, this.loops, this.ifs);
    }
}
Template.Namespace=`Aventus`;
__as1(_, 'Template', Template);

let Instance=class Instance {
    static elements = new Map();
    static get(type) {
        let result = this.elements.get(type);
        if (!result) {
            let cst = type.prototype['constructor'];
            result = new cst();
            this.elements.set(type, result);
        }
        return result;
    }
    static set(el) {
        let cst = el.constructor;
        if (this.elements.get(cst)) {
            return false;
        }
        this.elements.set(cst, el);
        return true;
    }
    static destroy(el) {
        let cst = el.constructor;
        return this.elements.delete(cst);
    }
}
Instance.Namespace=`Aventus`;
__as1(_, 'Instance', Instance);

let WebComponent=class WebComponent extends HTMLElement {
    /**
     * Add attributes informations
     */
    static get observedAttributes() {
        return [];
    }
    _first;
    _isReady;
    /**
     * Determine if the component is ready (postCreation done)
     */
    get isReady() {
        return this._isReady;
    }
    /**
     * The current namespace
     */
    static Namespace = "";
    /**
     * The current Tag / empty if abstract class
     */
    static Tag = "";
    /**
     * Get the unique type for the data. Define it as the namespace + class name
     */
    static get Fullname() { return this.Namespace + "." + this.name; }
    /**
     * The current namespace
     */
    get namespace() {
        return this.constructor['Namespace'];
    }
    /**
     * Get the name of the component class
     */
    getClassName() {
        return this.constructor.name;
    }
    /**
     * The current tag
     */
    get tag() {
        return this.constructor['Tag'];
    }
    /**
    * Get the unique type for the data. Define it as the namespace + class name
    */
    get $type() {
        return this.constructor['Fullname'];
    }
    __onChangeFct = {};
    __watch;
    __watchActions = {};
    __watchActionsCb = {};
    __watchFunctions = {};
    __watchFunctionsComputed = {};
    __pressManagers = [];
    __signalActions = {};
    __signals = {};
    __isDefaultState = true;
    __defaultActiveState = new Map();
    __defaultInactiveState = new Map();
    __statesList = {};
    constructor() {
        super();
        if (this.constructor == WebComponent) {
            throw "can't instanciate an abstract class";
        }
        this.__removeNoAnimations = this.__removeNoAnimations.bind(this);
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", this.__removeNoAnimations);
        }
        this._first = true;
        this._isReady = false;
        this.__renderTemplate();
        this.__registerWatchesActions();
        this.__registerPropertiesActions();
        this.__registerSignalsActions();
        this.__createStates();
        this.__subscribeState();
        if (this.constructor == WebComponent) {
            throw "can't instanciate an abstract class";
        }
    }
    /**
     * Remove all listeners
     * State + press
     */
    destructor() {
        WebComponentInstance.removeInstance(this);
        this.__unsubscribeState();
        for (let press of this.__pressManagers) {
            press.destroy();
        }
        for (let name in this.__watchFunctionsComputed) {
            this.__watchFunctionsComputed[name].destroy();
        }
        for (let name in this.__signals) {
            this.__signals[name].destroy();
        }
        // TODO add missing info for destructor();
        this.postDestruction();
        this.destructChildren();
    }
    destructChildren() {
        const recu = (el) => {
            for (let child of Array.from(el.children)) {
                if (child instanceof WebComponent) {
                    child.destructor();
                }
                else if (child instanceof HTMLElement) {
                    recu(child);
                }
            }
            if (el.shadowRoot) {
                for (let child of Array.from(el.shadowRoot.children)) {
                    if (child instanceof WebComponent) {
                        child.destructor();
                    }
                    else if (child instanceof HTMLElement) {
                        recu(child);
                    }
                }
            }
        };
        recu(this);
    }
    __addWatchesActions(name, fct) {
        if (!this.__watchActions[name]) {
            this.__watchActions[name] = [];
            this.__watchActionsCb[name] = (action, path, value) => {
                for (let fct of this.__watchActions[name]) {
                    fct(this, action, path, value);
                }
                if (this.__onChangeFct[name]) {
                    for (let fct of this.__onChangeFct[name]) {
                        fct(path);
                    }
                }
            };
        }
        if (fct) {
            this.__watchActions[name].push(fct);
        }
    }
    __addWatchesFunctions(infos) {
        for (let info of infos) {
            let realName;
            let autoInit;
            if (typeof info == "string") {
                realName = info;
                autoInit = false;
            }
            else {
                realName = info.name;
                autoInit = info.autoInit;
            }
            if (!this.__watchFunctions[realName]) {
                this.__watchFunctions[realName] = { autoInit };
            }
        }
    }
    __registerWatchesActions() {
        if (Object.keys(this.__watchActions).length > 0) {
            if (!this.__watch) {
                let defaultValue = {};
                this.__defaultValuesWatch(defaultValue);
                this.__watch = Watcher.get(defaultValue, (type, path, element) => {
                    try {
                        let action = this.__watchActionsCb[path.split(".")[0]] || this.__watchActionsCb[path.split("[")[0]];
                        action(type, path, element);
                    }
                    catch (e) {
                        console.error(e);
                    }
                });
            }
        }
        for (let name in this.__watchFunctions) {
            this.__watchFunctionsComputed[name] = Watcher.computed(this[name].bind(this));
            if (this.__watchFunctions[name].autoInit) {
                this.__watchFunctionsComputed[name].value;
            }
        }
    }
    __addSignalActions(name, fct) {
        this.__signalActions[name] = () => {
            fct(this);
        };
    }
    __registerSignalsActions() {
        if (Object.keys(this.__signals).length > 0) {
            const defaultValues = {};
            for (let name in this.__signals) {
                this.__registerSignalsAction(name);
                this.__defaultValuesSignal(defaultValues);
            }
            for (let name in defaultValues) {
                this.__signals[name].value = defaultValues[name];
            }
        }
    }
    __registerSignalsAction(name) {
        this.__signals[name] = new Signal(undefined, () => {
            if (this.__signalActions[name]) {
                this.__signalActions[name]();
            }
        });
    }
    __defaultValuesSignal(s) { }
    __addPropertyActions(name, fct) {
        if (!this.__onChangeFct[name]) {
            this.__onChangeFct[name] = [];
        }
        if (fct) {
            this.__onChangeFct[name].push(() => {
                fct(this);
            });
        }
    }
    __registerPropertiesActions() { }
    static __style = ``;
    static __template;
    __templateInstance;
    styleBefore(addStyle) {
        addStyle("@default");
    }
    styleAfter(addStyle) {
    }
    __getStyle() {
        return [WebComponent.__style];
    }
    __getHtml() { }
    __getStatic() {
        return WebComponent;
    }
    static __styleSheets = {};
    __renderStyles() {
        let sheets = {};
        const addStyle = (name) => {
            let sheet = Style.get(name);
            if (sheet) {
                sheets[name] = sheet;
            }
        };
        this.styleBefore(addStyle);
        let localStyle = new CSSStyleSheet();
        let styleTxt = this.__getStyle().join("\r\n");
        if (styleTxt.length > 0) {
            localStyle.replace(styleTxt);
            sheets['@local'] = localStyle;
        }
        this.styleAfter(addStyle);
        return sheets;
    }
    __renderTemplate() {
        let staticInstance = this.__getStatic();
        if (!staticInstance.__template || staticInstance.__template.cst != staticInstance) {
            staticInstance.__template = new Template(staticInstance);
            this.__getHtml();
            this.__registerTemplateAction();
            staticInstance.__template.generateTemplate();
            staticInstance.__styleSheets = this.__renderStyles();
        }
        this.__templateInstance = staticInstance.__template.createInstance(this);
        let shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.adoptedStyleSheets = [...Object.values(staticInstance.__styleSheets), Style.noAnimation];
        shadowRoot.appendChild(this.__templateInstance.content);
        // customElements.upgrade(shadowRoot);
        return shadowRoot;
    }
    __registerTemplateAction() {
    }
    connectedCallback() {
        if (this._first) {
            WebComponentInstance.addInstance(this);
            this._first = false;
            this.__defaultValues();
            this.__upgradeAttributes();
            this.__activateState();
            this.__templateInstance?.render();
            this.__removeNoAnimations();
        }
        else {
            setTimeout(() => {
                this.postConnect();
            });
        }
    }
    disconnectedCallback() {
        setTimeout(() => {
            this.postDisconnect();
        });
    }
    __onReadyCb = [];
    onReady(cb) {
        if (this._isReady) {
            cb();
        }
        else {
            this.__onReadyCb.push(cb);
        }
    }
    __setReady() {
        this._isReady = true;
        this.dispatchEvent(new CustomEvent('postCreationDone'));
        let cbs = [...this.__onReadyCb];
        for (let cb of cbs) {
            cb();
        }
        this.__onReadyCb = [];
    }
    __removeNoAnimations() {
        if (document.readyState !== "loading") {
            setTimeout(() => {
                this.postCreation();
                this.__setReady();
                this.shadowRoot.adoptedStyleSheets = Object.values(this.__getStatic().__styleSheets);
                document.removeEventListener("DOMContentLoaded", this.__removeNoAnimations);
                this.postConnect();
            }, 50);
        }
    }
    __defaultValues() { }
    __defaultValuesWatch(w) { }
    __upgradeAttributes() { }
    __listBoolProps() {
        return [];
    }
    __upgradeProperty(prop) {
        let boolProps = this.__listBoolProps();
        const t = this;
        if (boolProps.indexOf(prop) != -1) {
            if (this.hasAttribute(prop) && (this.getAttribute(prop) === "true" || this.getAttribute(prop) === "")) {
                let value = this.getAttribute(prop);
                delete t[prop];
                t[prop] = value;
            }
            else {
                this.removeAttribute(prop);
                delete t[prop];
                t[prop] = false;
            }
        }
        else {
            if (this.hasAttribute(prop)) {
                let value = this.getAttribute(prop);
                delete t[prop];
                t[prop] = value;
            }
            else if (Object.hasOwn(this, prop)) {
                const value = t[prop];
                delete t[prop];
                t[prop] = value;
            }
        }
    }
    __correctGetter(prop) {
        if (Object.hasOwn(this, prop)) {
            const t = this;
            const value = t[prop];
            delete t[prop];
            t[prop] = value;
        }
    }
    __getStateManager(managerClass) {
        let mClass;
        if (managerClass instanceof StateManager) {
            mClass = managerClass;
        }
        else {
            mClass = Instance.get(managerClass);
        }
        return mClass;
    }
    __addActiveDefState(managerClass, cb) {
        let mClass = this.__getStateManager(managerClass);
        if (!this.__defaultActiveState.has(mClass)) {
            this.__defaultActiveState.set(mClass, []);
        }
        this.__defaultActiveState.get(mClass)?.push(cb);
    }
    __addInactiveDefState(managerClass, cb) {
        let mClass = this.__getStateManager(managerClass);
        if (!this.__defaultInactiveState.has(mClass)) {
            this.__defaultInactiveState.set(mClass, []);
        }
        this.__defaultInactiveState.get(mClass)?.push(cb);
    }
    __addActiveState(statePattern, managerClass, cb) {
        let mClass = this.__getStateManager(managerClass);
        this.__statesList[statePattern].get(mClass)?.active.push(cb);
    }
    __addInactiveState(statePattern, managerClass, cb) {
        let mClass = this.__getStateManager(managerClass);
        this.__statesList[statePattern].get(mClass)?.inactive.push(cb);
    }
    __addAskChangeState(statePattern, managerClass, cb) {
        let mClass = this.__getStateManager(managerClass);
        this.__statesList[statePattern].get(mClass)?.askChange.push(cb);
    }
    __createStates() { }
    __createStatesList(statePattern, managerClass) {
        if (!this.__statesList[statePattern]) {
            this.__statesList[statePattern] = new Map();
        }
        let mClass = this.__getStateManager(managerClass);
        if (!this.__statesList[statePattern].has(mClass)) {
            this.__statesList[statePattern].set(mClass, {
                active: [],
                inactive: [],
                askChange: []
            });
        }
    }
    __inactiveDefaultState(managerClass) {
        if (this.__isDefaultState) {
            this.__isDefaultState = false;
            let mClass = this.__getStateManager(managerClass);
            if (this.__defaultInactiveState.has(mClass)) {
                let fcts = this.__defaultInactiveState.get(mClass) ?? [];
                for (let fct of fcts) {
                    fct.bind(this)();
                }
            }
        }
    }
    __activeDefaultState(nextStep, managerClass) {
        if (!this.__isDefaultState) {
            for (let pattern in this.__statesList) {
                if (StateManager.canBeActivate(pattern, nextStep)) {
                    let mClass = this.__getStateManager(managerClass);
                    if (this.__statesList[pattern].has(mClass)) {
                        return;
                    }
                }
            }
            this.__isDefaultState = true;
            let mClass = this.__getStateManager(managerClass);
            if (this.__defaultActiveState.has(mClass)) {
                let fcts = this.__defaultActiveState.get(mClass) ?? [];
                for (let fct of fcts) {
                    fct.bind(this)();
                }
            }
        }
    }
    __subscribeState() {
        if (!this.isReady && this.__stateCleared) {
            return;
        }
        for (let route in this.__statesList) {
            for (const managerClass of this.__statesList[route].keys()) {
                let el = this.__statesList[route].get(managerClass);
                if (el) {
                    managerClass.subscribe(route, el, false);
                }
            }
        }
    }
    __activateState() {
        for (let route in this.__statesList) {
            for (const managerClass of this.__statesList[route].keys()) {
                let el = this.__statesList[route].get(managerClass);
                if (el) {
                    managerClass.activateAfterSubscribe(route, el);
                }
            }
        }
    }
    __stateCleared = false;
    __unsubscribeState() {
        for (let route in this.__statesList) {
            for (const managerClass of this.__statesList[route].keys()) {
                let el = this.__statesList[route].get(managerClass);
                if (el) {
                    managerClass.unsubscribe(route, el);
                }
            }
        }
        this.__stateCleared = true;
    }
    dateToString(d) {
        if (typeof d == 'string') {
            d = this.stringToDate(d);
        }
        if (d instanceof Date) {
            return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
        }
        return null;
    }
    dateTimeToString(dt) {
        if (typeof dt == 'string') {
            dt = this.stringToDate(dt);
        }
        if (dt instanceof Date) {
            return new Date(dt.getTime() - (dt.getTimezoneOffset() * 60000)).toISOString().slice(0, -1);
        }
        return null;
    }
    stringToDate(s) {
        let td = new Date(s);
        let d = new Date(td.getTime() + (td.getTimezoneOffset() * 60000));
        if (isNaN(d)) {
            return null;
        }
        return d;
    }
    stringToDateTime(s) {
        let td = new Date(s);
        let d = new Date(td.getTime() + (td.getTimezoneOffset() * 60000));
        if (isNaN(d)) {
            return null;
        }
        return d;
    }
    getBoolean(val) {
        if (val === true || val === 1 || val === 'true' || val === '') {
            return true;
        }
        else if (val === false || val === 0 || val === 'false' || val === null || val === undefined) {
            return false;
        }
        console.error("error parsing boolean value " + val);
        return false;
    }
    __registerPropToWatcher(name) {
        if (Watcher._register) {
            Watcher._register.register(this.getReceiver(name), name, Watcher._register.version, name);
        }
    }
    getStringAttr(name) {
        return this.getAttribute(name)?.replace(/&avquot;/g, '"') ?? undefined;
    }
    setStringAttr(name, val) {
        if (val === undefined || val === null) {
            this.removeAttribute(name);
        }
        else {
            this.setAttribute(name, (val + "").replace(/"/g, '&avquot;'));
        }
    }
    getStringProp(name) {
        this.__registerPropToWatcher(name);
        return this.getStringAttr(name);
    }
    getNumberAttr(name) {
        return Number(this.getAttribute(name));
    }
    setNumberAttr(name, val) {
        if (val === undefined || val === null) {
            this.removeAttribute(name);
        }
        else {
            this.setAttribute(name, val);
        }
    }
    getNumberProp(name) {
        this.__registerPropToWatcher(name);
        return this.getNumberAttr(name);
    }
    getBoolAttr(name) {
        return this.hasAttribute(name);
    }
    setBoolAttr(name, val) {
        val = this.getBoolean(val);
        if (val) {
            this.setAttribute(name, 'true');
        }
        else {
            this.removeAttribute(name);
        }
    }
    getBoolProp(name) {
        this.__registerPropToWatcher(name);
        return this.getBoolAttr(name);
    }
    getDateAttr(name) {
        if (!this.hasAttribute(name)) {
            return undefined;
        }
        return this.stringToDate(this.getAttribute(name));
    }
    setDateAttr(name, val) {
        let valTxt = this.dateToString(val);
        if (valTxt === null) {
            this.removeAttribute(name);
        }
        else {
            this.setAttribute(name, valTxt);
        }
    }
    getDateProp(name) {
        this.__registerPropToWatcher(name);
        return this.getDateAttr(name);
    }
    getDateTimeAttr(name) {
        if (!this.hasAttribute(name))
            return undefined;
        return this.stringToDateTime(this.getAttribute(name));
    }
    setDateTimeAttr(name, val) {
        let valTxt = this.dateTimeToString(val);
        if (valTxt === null) {
            this.removeAttribute(name);
        }
        else {
            this.setAttribute(name, valTxt);
        }
    }
    getDateTimeProp(name) {
        this.__registerPropToWatcher(name);
        return this.getDateTimeAttr(name);
    }
    __propertyReceivers = {};
    getReceiver(name) {
        if (!this.__propertyReceivers[name]) {
            let that = this;
            let result = {
                __subscribes: [],
                subscribe(fct) {
                    let index = this.__subscribes.indexOf(fct);
                    if (index == -1) {
                        this.__subscribes.push(fct);
                    }
                },
                unsubscribe(fct) {
                    let index = this.__subscribes.indexOf(fct);
                    if (index > -1) {
                        this.__subscribes.splice(index, 1);
                    }
                },
                onChange() {
                    for (let fct of this.__subscribes) {
                        fct(WatchAction.UPDATED, name, that[name], []);
                    }
                },
                __path: name
            };
            this.__propertyReceivers[name] = result;
        }
        return this.__propertyReceivers[name];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue || !this.isReady) {
            if (this.__propertyReceivers.hasOwnProperty(name)) {
                this.__propertyReceivers[name].onChange();
            }
            if (this.__onChangeFct.hasOwnProperty(name)) {
                for (let fct of this.__onChangeFct[name]) {
                    fct('');
                }
            }
        }
    }
    /**
     * Remove a component from the dom
     * If desctruct is set to true, the component will be fully destroyed
     */
    remove(destruct = true) {
        super.remove();
        if (destruct) {
            this.destructor();
        }
    }
    /**
     * Function triggered when the component is destroyed
     */
    postDestruction() { }
    /**
     * Function triggered the first time the component is rendering inside DOM
     */
    postCreation() { }
    /**
    * Function triggered each time the component is rendering inside DOM
    */
    postConnect() { }
    /**
    * Function triggered each time the component is removed from the DOM
    */
    postDisconnect() { }
    /**
     * Find a parent by tagname if exist
     */
    findParentByTag(tagname, untilNode) {
        return ElementExtension.findParentByTag(this, tagname, untilNode);
    }
    /**
     * Find a parent by class name if exist
     */
    findParentByClass(classname, untilNode) {
        return ElementExtension.findParentByClass(this, classname, untilNode);
    }
    /**
     * Find a parent by type if exist
     */
    findParentByType(type, untilNode) {
        return ElementExtension.findParentByType(this, type, untilNode);
    }
    /**
     * Find list of parents by tagname
     */
    findParentsByTag(tagname, untilNode) {
        return ElementExtension.findParentsByTag(this, tagname, untilNode);
    }
    /**
     * Find list of parents by custom check
     */
    findParents(tagname, check, untilNode) {
        return ElementExtension.findParents(this, check, untilNode);
    }
    /**
     * Find list of parents by custom check
     */
    findParent(tagname, check, untilNode) {
        return ElementExtension.findParent(this, check, untilNode);
    }
    /**
     * Check if element contains a child
     */
    containsChild(el) {
        return ElementExtension.containsChild(this, el);
    }
    /**
     * Get elements inside slot
     */
    getElementsInSlot(slotName) {
        return ElementExtension.getElementsInSlot(this, slotName);
    }
    /**
     * Get nodes inside slot
     */
    getNodesInSlot(slotName) {
        return ElementExtension.getNodesInSlot(this, slotName);
    }
    /**
     * Get active element from the shadowroot or the document
     */
    getActiveElement(document) {
        return ElementExtension.getActiveElement(document ?? this.shadowRoot);
    }
}
WebComponent.Namespace=`Aventus`;
__as1(_, 'WebComponent', WebComponent);

let WebComponentInstance=class WebComponentInstance {
    static __allDefinitions = [];
    static __allInstances = [];
    /**
     * Last definition insert datetime
     */
    static lastDefinition = 0;
    static registerDefinition(def) {
        WebComponentInstance.lastDefinition = Date.now();
        WebComponentInstance.__allDefinitions.push(def);
    }
    static removeDefinition(def) {
        WebComponentInstance.lastDefinition = Date.now();
        let index = WebComponentInstance.__allDefinitions.indexOf(def);
        if (index > -1) {
            WebComponentInstance.__allDefinitions.splice(index, 1);
        }
    }
    /**
     * Get all sub classes of type
     */
    static getAllClassesOf(type) {
        let result = [];
        for (let def of WebComponentInstance.__allDefinitions) {
            if (def.prototype instanceof type) {
                result.push(def);
            }
        }
        return result;
    }
    /**
     * Get all registered definitions
     */
    static getAllDefinitions() {
        return WebComponentInstance.__allDefinitions;
    }
    static addInstance(instance) {
        this.__allInstances.push(instance);
    }
    static removeInstance(instance) {
        let index = this.__allInstances.indexOf(instance);
        if (index > -1) {
            this.__allInstances.splice(index, 1);
        }
    }
    static getAllInstances(type) {
        let result = [];
        for (let instance of this.__allInstances) {
            if (instance instanceof type) {
                result.push(instance);
            }
        }
        return result;
    }
    static create(type) {
        let _class = customElements.get(type);
        if (_class) {
            return new _class();
        }
        let splitted = type.split(".");
        let current = window;
        for (let part of splitted) {
            current = current[part];
        }
        if (current && current.prototype instanceof WebComponent) {
            return new current();
        }
        return null;
    }
}
WebComponentInstance.Namespace=`Aventus`;
__as1(_, 'WebComponentInstance', WebComponentInstance);

let ConverterTransform=class ConverterTransform {
    transform(data) {
        return this.transformLoop(data);
    }
    createInstance(data) {
        if (data.$type) {
            let cst = Converter.info.get(data.$type);
            if (cst) {
                return new cst();
            }
        }
        return undefined;
    }
    beforeTransformObject(obj) {
    }
    afterTransformObject(obj) {
    }
    transformLoop(data) {
        if (data === null) {
            return data;
        }
        if (Array.isArray(data)) {
            let result = [];
            for (let element of data) {
                result.push(this.transformLoop(element));
            }
            return result;
        }
        if (data instanceof Date) {
            return data;
        }
        if (typeof data === 'object' && !/^\s*class\s+/.test(data.toString())) {
            let objTemp = this.createInstance(data);
            if (objTemp) {
                if (objTemp instanceof Map) {
                    if (data.values) {
                        for (const keyValue of data.values) {
                            objTemp.set(this.transformLoop(keyValue[0]), this.transformLoop(keyValue[1]));
                        }
                    }
                    return objTemp;
                }
                let obj = objTemp;
                this.beforeTransformObject(obj);
                if (obj.fromJSON) {
                    obj = obj.fromJSON(data);
                }
                else {
                    obj = Json.classFromJson(obj, data, {
                        transformValue: (key, value) => {
                            if (obj[key] instanceof Date) {
                                return value ? new Date(value) : null;
                            }
                            else if (typeof value == 'string' && DateConverter.converter.isStringDate(value)) {
                                return value ? DateConverter.converter.fromString(value) : null;
                            }
                            else if (obj[key] instanceof Map) {
                                let map = new Map();
                                if ("$type" in value && value['$type'] == "Aventus.Map") {
                                    value = value.values;
                                }
                                for (const keyValue of value) {
                                    map.set(this.transformLoop(keyValue[0]), this.transformLoop(keyValue[1]));
                                }
                                return map;
                            }
                            else if (obj instanceof Data) {
                                let cst = obj.constructor;
                                if (cst.$schema[key] == 'boolean') {
                                    return value ? true : false;
                                }
                                else if (cst.$schema[key] == 'number') {
                                    return isNaN(Number(value)) ? 0 : Number(value);
                                }
                                else if (cst.$schema[key] == 'number') {
                                    return isNaN(Number(value)) ? 0 : Number(value);
                                }
                                else if (cst.$schema[key] == 'Date') {
                                    return value ? new Date(value) : null;
                                }
                            }
                            return this.transformLoop(value);
                        }
                    });
                }
                this.afterTransformObject(obj);
                return obj;
            }
            let result = {};
            for (let key in data) {
                result[key] = this.transformLoop(data[key]);
            }
            return result;
        }
        if (typeof data == 'string' && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/.exec(data)) {
            return new Date(data);
        }
        return data;
    }
    copyValuesClass(target, src, options) {
        const realOptions = {
            isValidKey: options?.isValidKey ?? (() => true),
            replaceKey: options?.replaceKey ?? ((key) => key),
            transformValue: options?.transformValue ?? ((key, value) => value),
        };
        this.__classCopyValues(target, src, realOptions);
    }
    __classCopyValues(target, src, options) {
        let props = Object.getOwnPropertyNames(target);
        for (let prop of props) {
            let propInfo = Object.getOwnPropertyDescriptor(target, prop);
            if (propInfo?.writable) {
                if (options.isValidKey(prop)) {
                    const _target = target;
                    const _src = src;
                    _target[options.replaceKey(prop)] = options.transformValue(prop, _src[prop]);
                }
            }
        }
        let cstTemp = target.constructor;
        while (cstTemp.prototype && cstTemp != Object.prototype) {
            props = Object.getOwnPropertyNames(cstTemp.prototype);
            for (let prop of props) {
                let propInfo = Object.getOwnPropertyDescriptor(cstTemp.prototype, prop);
                if (propInfo?.set && propInfo.get) {
                    if (options.isValidKey(prop)) {
                        const _target = target;
                        const _src = src;
                        _target[options.replaceKey(prop)] = options.transformValue(prop, _src[prop]);
                    }
                }
            }
            cstTemp = Object.getPrototypeOf(cstTemp);
        }
    }
}
ConverterTransform.Namespace=`Aventus`;
__as1(_, 'ConverterTransform', ConverterTransform);

let Json=class Json {
    /**
     * Converts a JavaScript class instance to a JSON object.
     * @template T - The type of the object to convert.
     * @param {T} obj - The object to convert to JSON.
     * @param {JsonToOptions} [options] - Options for JSON conversion.
     * @returns {{ [key: string | number]: any; }} Returns the JSON representation of the object.
     */
    static classToJson(obj, options) {
        const realOptions = {
            isValidKey: options?.isValidKey ?? (() => true),
            replaceKey: options?.replaceKey ?? ((key) => key),
            transformValue: options?.transformValue ?? ((key, value) => value),
            beforeEnd: options?.beforeEnd ?? ((res) => res)
        };
        return this.__classToJson(obj, realOptions);
    }
    static __classToJson(obj, options) {
        let result = {};
        let descriptors = Object.getOwnPropertyDescriptors(obj);
        for (let key in descriptors) {
            if (options.isValidKey(key))
                result[options.replaceKey(key)] = options.transformValue(key, descriptors[key].value);
        }
        let cst = obj.constructor;
        while (cst.prototype && cst != Object.prototype) {
            let descriptorsClass = Object.getOwnPropertyDescriptors(cst.prototype);
            for (let key in descriptorsClass) {
                if (options.isValidKey(key)) {
                    let descriptor = descriptorsClass[key];
                    if (descriptor?.get) {
                        const o = obj;
                        result[options.replaceKey(key)] = options.transformValue(key, o[key]);
                    }
                }
            }
            cst = Object.getPrototypeOf(cst);
        }
        result = options.beforeEnd(result);
        return result;
    }
    /**
    * Converts a JSON object to a JavaScript class instance.
    * @template T - The type of the object to convert.
    * @param {T} obj - The object to populate with JSON data.
    * @param {*} data - The JSON data to populate the object with.
    * @param {JsonFromOptions} [options] - Options for JSON deserialization.
    * @returns {T} Returns the populated object.
    */
    static classFromJson(obj, data, options) {
        let realOptions = {
            transformValue: options?.transformValue ?? ((key, value) => value),
            replaceUndefined: options?.replaceUndefined ?? false,
            replaceUndefinedWithKey: options?.replaceUndefinedWithKey ?? false,
        };
        return this.__classFromJson(obj, data, realOptions);
    }
    static __classFromJson(obj, data, options) {
        let props = Object.getOwnPropertyNames(obj);
        for (let prop of props) {
            let propUpperFirst = prop[0].toUpperCase() + prop.slice(1);
            let value = data[prop] === undefined ? data[propUpperFirst] : data[prop];
            if (value !== undefined || options.replaceUndefined || (options.replaceUndefinedWithKey && (Object.hasOwn(data, prop) || Object.hasOwn(data, propUpperFirst)))) {
                let propInfo = Object.getOwnPropertyDescriptor(obj, prop);
                if (propInfo?.writable) {
                    const o = obj;
                    o[prop] = options.transformValue(prop, value);
                }
            }
        }
        let cstTemp = obj.constructor;
        while (cstTemp.prototype && cstTemp != Object.prototype) {
            props = Object.getOwnPropertyNames(cstTemp.prototype);
            for (let prop of props) {
                let propUpperFirst = prop[0].toUpperCase() + prop.slice(1);
                let value = data[prop] === undefined ? data[propUpperFirst] : data[prop];
                if (value !== undefined || options.replaceUndefined || (options.replaceUndefinedWithKey && (Object.hasOwn(data, prop) || Object.hasOwn(data, propUpperFirst)))) {
                    let propInfo = Object.getOwnPropertyDescriptor(cstTemp.prototype, prop);
                    if (propInfo?.set) {
                        const o = obj;
                        o[prop] = options.transformValue(prop, value);
                    }
                }
            }
            cstTemp = Object.getPrototypeOf(cstTemp);
        }
        return obj;
    }
}
Json.Namespace=`Aventus`;
__as1(_, 'Json', Json);

let Converter=class Converter {
    /**
    * Map storing information about registered types.
    */
    static info = new Map([["Aventus.Map", Map]]);
    /**
    * Map storing schemas for registered types.
    */
    static schema = new Map();
    /**
     * Internal converter instance.
     */
    static __converter = new ConverterTransform();
    /**
     * Getter for the internal converter instance.
     */
    static get converterTransform() {
        return this.__converter;
    }
    /**
    * Sets the converter instance.
    * @param converter The converter instance to set.
    */
    static setConverter(converter) {
        this.__converter = converter;
    }
    /**
    * Registers a unique string type for any class.
    * @param $type The unique string type identifier.
    * @param cst The constructor function for the class.
    * @param schema Optional schema for the registered type.
    */
    static register($type, cst, schema) {
        this.info.set($type, cst);
        if (schema) {
            this.schema.set($type, schema);
        }
    }
    /**
     * Transforms the provided data using the current converter instance.
     * @template T
     * @param {*} data The data to transform.
     * @param {IConverterTransform} [converter] Optional converter instance to use for transformation.
     * @returns {T} Returns the transformed data.
     */
    static transform(data, converter) {
        if (!converter) {
            converter = this.converterTransform;
        }
        return converter.transform(data);
    }
    /**
     * Copies values from one class instance to another using the current converter instance.
     * @template T
     * @param {T} to The destination class instance to copy values into.
     * @param {T} from The source class instance to copy values from.
     * @param {ClassCopyOptions} [options] Optional options for the copy operation.
     * @param {IConverterTransform} [converter] Optional converter instance to use for the copy operation.
     * @returns {T} Returns the destination class instance with copied values.
     */
    static copyValuesClass(to, from, options, converter) {
        if (!converter) {
            converter = this.converterTransform;
        }
        return converter.copyValuesClass(to, from, options);
    }
}
Converter.Namespace=`Aventus`;
__as1(_, 'Converter', Converter);

let Data=// @Dependencies([{ type: Aventus.Converter, strong: true }, { type: Converter, strong: true }])
class Data {
    static converter = new Converter();
    /**
     * The schema for the class
     */
    static $schema;
    /**
     * The current namespace
     */
    static Namespace = "";
    /**
     * Get the unique type for the data. Define it as the namespace + class name
     */
    static get Fullname() { return this.Namespace + "." + this.name; }
    /**
     * The current namespace
     */
    get namespace() {
        return this.constructor['Namespace'];
    }
    /**
     * Get the unique type for the data. Define it as the namespace + class name
     */
    get $type() {
        return this.constructor['Fullname'];
    }
    /**
     * Get the name of the class
     */
    get className() {
        return this.constructor.name;
    }
    /**
     * Get a JSON for the current object
     */
    toJSON() {
        let toAvoid = ['className', 'namespace'];
        return Json.classToJson(this, {
            isValidKey: (key) => !toAvoid.includes(key)
        });
    }
    /**
     * Clone the object by transforming a parsed JSON string back into the original type
     */
    clone() {
        return Converter.transform(JSON.parse(JSON.stringify(this)));
    }
}
Data.Namespace=`Aventus`;
Data.$schema={"namespace":"string","$type":"string","className":"string"};
Converter.register(Data.Fullname, Data);
__as1(_, 'Data', Data);

let HttpResponse=class HttpResponse {
    get status() {
        return this.response.status;
    }
    get statusText() {
        return this.response.statusText;
    }
    get redirected() {
        return this.response.redirected;
    }
    get ok() {
        return this.response.ok;
    }
    get type() {
        return this.response.type;
    }
    get url() {
        return this.response.url;
    }
    get headers() {
        return this.response.headers;
    }
    response;
    constructor(response) {
        this.response = response;
    }
    bodyUsed = false;
    bodyContent;
    async json() {
        if (!this.bodyUsed) {
            this.bodyContent = await this.response.json();
        }
        return Converter.transform(this.bodyContent);
    }
    async blob() {
        if (!this.bodyUsed) {
            this.bodyContent = await this.response.blob();
        }
        return this.bodyContent;
    }
    async text() {
        if (!this.bodyUsed) {
            this.bodyContent = await this.response.text();
        }
        return this.bodyContent;
    }
}
HttpResponse.Namespace=`Aventus`;
__as1(_, 'HttpResponse', HttpResponse);

let HttpCache=class HttpCache {
    static cache = new Map();
    static async fetch(fullUrl, request) {
        const key = this.generateCacheKey(fullUrl, request);
        if (key) {
            const value = this.cache.get(key);
            if (value)
                return value;
        }
        const result = await fetch(fullUrl, request);
        const response = new HttpResponse(result);
        if (key)
            this.cache.set(key, response);
        return response;
    }
    static clear(fullUrl, request) {
        const key = this.generateCacheKey(fullUrl, request);
        if (key) {
            if (this.cache.has(key)) {
                this.cache.delete(key);
            }
        }
    }
    static generateCacheKey(fullUrl, request) {
        const method = request.method;
        const body = request.body;
        let bodyKey = "";
        if (typeof body == 'string') {
            bodyKey = this.hashStringToInt(body) + '';
        }
        else if (body instanceof FormData) {
        }
        return fullUrl + "°" + method + "°" + bodyKey;
    }
    static hashStringToInt(str) {
        let hash = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return hash >>> 0;
    }
}
HttpCache.Namespace=`Aventus`;
__as1(_, 'HttpCache', HttpCache);

let GenericError=// @Dependencies([{ type: Aventus.Converter, strong: true }, { type: Converter, strong: true }])
class GenericError {
    static converter = new Converter();
    static get Fullname() { return "Aventus.GenericError"; }
    /**
     * Code for the error
     */
    code;
    /**
     * Description of the error
     */
    message;
    /**
     * Additional details related to the error.
     */
    details = [];
    /**
     * Creates a new instance of GenericError.
     * @param {EnumValue<T>} code - The error code.
     * @param {string | Error | unknown} message - The error message.
     */
    constructor(code, message) {
        this.code = code;
        if (message instanceof Error) {
            this.message = message.message;
        }
        else {
            this.message = message + '';
        }
    }
}
GenericError.Namespace=`Aventus`;
GenericError.$schema={"code":"Aventus.EnumValue","message":"string"};
Converter.register(GenericError.Fullname, GenericError);
__as1(_, 'GenericError', GenericError);

let VoidWithError=class VoidWithError {
    static get Fullname() { return "Aventus.VoidWithError"; }
    /**
     * Determine if the action is a success
     */
    get success() {
        return this.errors.length == 0;
    }
    /**
     * List of errors
     */
    errors = [];
    /**
     * Converts the current instance to a VoidWithError object.
     * @returns {VoidWithError} A new instance of VoidWithError with the same error list.
     */
    toGeneric() {
        const result = new VoidWithError();
        result.errors = this.errors;
        return result;
    }
    /**
    * Checks if the error list contains a specific error code.
    * @template U - The type of error, extending GenericError.
    * @template T - The type of the error code, which extends either number or Enum.
    * @param {EnumValue<T>} code - The error code to check for.
    * @param {new (...args: any[]) => U} [type] - Optional constructor function of the error type.
    * @returns {boolean} True if the error list contains the specified error code, otherwise false.
    */
    containsCode(code, type) {
        if (type) {
            for (let error of this.errors) {
                if (error instanceof type) {
                    if (error.code == code) {
                        return true;
                    }
                }
            }
        }
        else {
            for (let error of this.errors) {
                if (error.code == code) {
                    return true;
                }
            }
        }
        return false;
    }
    run(fct) {
        if (this.success) {
            let result = fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
        }
        return this;
    }
    async runAsync(fct) {
        if (this.success) {
            let result = await fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
        }
        return this;
    }
    extract(fct) {
        if (this.success) {
            let result = fct();
            if (result.success && result.result) {
                return result.result;
            }
            this.errors = [...this.errors, ...result.errors];
        }
        return undefined;
    }
    async extractAsync(fct) {
        if (this.success) {
            let result = await fct();
            if (result.success && result.result) {
                return result.result;
            }
            this.errors = [...this.errors, ...result.errors];
        }
        return undefined;
    }
}
VoidWithError.Namespace=`Aventus`;
VoidWithError.$schema={"success":"boolean","errors":"T[]"};
Converter.register(VoidWithError.Fullname, VoidWithError);
__as1(_, 'VoidWithError', VoidWithError);

let ResultWithError=class ResultWithError extends VoidWithError {
    static get Fullname() { return "Aventus.ResultWithError"; }
    /**
      * The result value of the action.
      * @type {U | undefined}
      */
    result;
    /**
     * Converts the current instance to a ResultWithError object.
     * @returns {ResultWithError<U>} A new instance of ResultWithError with the same error list and result value.
     */
    toGeneric() {
        const result = new ResultWithError();
        result.errors = this.errors;
        result.result = this.result;
        return result;
    }
    run(fct) {
        if (this.success) {
            let result = fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
            if (result instanceof ResultWithError && result.success && result.result) {
                this.result = result.result;
            }
        }
        return this;
    }
    async runAsync(fct) {
        if (this.success) {
            let result = await fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
            if (result instanceof ResultWithError && result.success && result.result) {
                this.result = result.result;
            }
        }
        return this;
    }
}
ResultWithError.Namespace=`Aventus`;
ResultWithError.$schema={...(VoidWithError?.$schema ?? {}), };
Converter.register(ResultWithError.Fullname, ResultWithError);
__as1(_, 'ResultWithError', ResultWithError);

let HttpError=class HttpError extends GenericError {
}
HttpError.Namespace=`Aventus`;
HttpError.$schema={...(GenericError?.$schema ?? {}), };
Converter.register(HttpError.Fullname, HttpError);
__as1(_, 'HttpError', HttpError);

let HttpRequest=class HttpRequest {
    static options;
    static configure(options) {
        this.options = options;
    }
    request;
    url;
    methodSpoofing = false;
    useCache = false;
    constructor(url, method = HttpMethod.GET, body, methodSpoofing = false, useCache = false) {
        this.url = url;
        this.request = {};
        this.methodSpoofing = methodSpoofing;
        this.useCache = useCache;
        this.setMethod(method);
        this.prepareBody(body);
    }
    setUrl(url) {
        this.url = url;
    }
    toString() {
        return this.url + " : " + JSON.stringify(this.request);
    }
    setBody(body) {
        this.prepareBody(body);
    }
    setMethod(method) {
        this.request.method = method;
    }
    /**
     * Replace method Put/Delete by _method:"put" inside a form
     */
    enableMethodSpoofing() {
        this.methodSpoofing = true;
    }
    enableCache() {
        this.useCache = true;
    }
    disableCache() {
        this.useCache = false;
    }
    objectToFormData(obj, formData, parentKey) {
        formData = formData || new FormData();
        let byPass = obj;
        if (byPass.__isProxy) {
            obj = byPass.getTarget();
        }
        const keys = obj.toJSON ? Object.keys(obj.toJSON()) : Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            let value = obj[key];
            const newKey = parentKey ? `${parentKey}[${key}]` : key;
            if (value instanceof Date) {
                formData.append(newKey, DateConverter.converter.toString(value));
            }
            else if (typeof value === 'object' &&
                value !== null &&
                !(value instanceof File)) {
                if (Array.isArray(value)) {
                    for (let j = 0; j < value.length; j++) {
                        const arrayKey = `${newKey}[${j}]`;
                        this.objectToFormData({ [arrayKey]: value[j] }, formData);
                    }
                }
                else {
                    this.objectToFormData(value, formData, newKey);
                }
            }
            else {
                if (value === undefined || value === null) {
                    value = "";
                }
                else if (Watcher.is(value)) {
                    value = Watcher.extract(value);
                }
                formData.append(newKey, value);
            }
        }
        return formData;
    }
    jsonReplacer(key, value) {
        const t = this;
        if (t[key] instanceof Date) {
            return DateConverter.converter.toString(t[key]);
        }
        return value;
    }
    prepareBody(data) {
        if (!data) {
            return;
        }
        else if (data instanceof FormData) {
            this.request.body = data;
        }
        else {
            let useFormData = false;
            const analyseFormData = (obj) => {
                for (let key in obj) {
                    if (obj[key] instanceof File) {
                        useFormData = true;
                        break;
                    }
                    else if (Array.isArray(obj[key]) && obj[key].length > 0 && obj[key][0] instanceof File) {
                        useFormData = true;
                        break;
                    }
                    else if (typeof obj[key] == 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
                        analyseFormData(obj[key]);
                        if (useFormData) {
                            break;
                        }
                    }
                }
            };
            analyseFormData(data);
            if (useFormData) {
                this.request.body = this.objectToFormData(data);
            }
            else {
                this.request.body = JSON.stringify(data, this.jsonReplacer);
                this.setHeader("Content-Type", "Application/json");
            }
        }
        if (this.methodSpoofing) {
            if (this.request.method?.toUpperCase() == Aventus.HttpMethod.PUT) {
                if (this.request.body instanceof FormData) {
                    this.request.body.append("_method", Aventus.HttpMethod.PUT);
                    this.request.method = Aventus.HttpMethod.POST;
                }
            }
            else if (this.request.method?.toUpperCase() == Aventus.HttpMethod.DELETE) {
                if (this.request.body instanceof FormData) {
                    this.request.body.append("_method", Aventus.HttpMethod.DELETE);
                    this.request.method = Aventus.HttpMethod.POST;
                }
            }
        }
    }
    setHeader(name, value) {
        if (!this.request.headers) {
            this.request.headers = [];
        }
        this.request.headers.push([name, value]);
    }
    setCredentials(credentials) {
        this.request.credentials = credentials;
    }
    async _query(router) {
        let result = new ResultWithError();
        try {
            const isFull = this.url.match("https?://");
            if (!this.url.startsWith("/") && !isFull) {
                this.url = "/" + this.url;
            }
            if (HttpRequest.options?.beforeSend) {
                const beforeSendResult = await HttpRequest.options.beforeSend(this);
                result.errors = beforeSendResult.errors;
            }
            const fullUrl = isFull ? this.url : router ? router.options.url + this.url : this.url;
            if (this.useCache) {
                result.result = await HttpCache.fetch(fullUrl, this.request);
            }
            else {
                let response = await fetch(fullUrl, this.request);
                result.result = new HttpResponse(response);
            }
        }
        catch (e) {
            result.errors.push(new HttpError(HttpErrorCode.unknow, e));
        }
        return result;
    }
    async query(router) {
        let result = await this._query(router);
        if (HttpRequest.options?.responseMiddleware) {
            result = await HttpRequest.options.responseMiddleware(result, this);
        }
        return result;
    }
    async queryVoid(router) {
        let resultTemp = await this.query(router);
        let result = new VoidWithError();
        if (!resultTemp.success) {
            result.errors = resultTemp.errors;
            return result;
        }
        try {
            if (!resultTemp.result) {
                return result;
            }
            if (resultTemp.result.status != 204) {
                let tempResult = await resultTemp.result.json();
                if (tempResult instanceof VoidWithError) {
                    for (let error of tempResult.errors) {
                        result.errors.push(error);
                    }
                }
            }
        }
        catch (e) {
        }
        return result;
    }
    async queryJSON(router) {
        this.setHeader("Accept", "application/json");
        let resultTemp = await this.query(router);
        let result = new ResultWithError();
        if (!resultTemp.success) {
            result.errors = resultTemp.errors;
            return result;
        }
        try {
            if (!resultTemp.result) {
                return result;
            }
            let tempResult = await resultTemp.result.json();
            if (tempResult instanceof VoidWithError) {
                for (let error of tempResult.errors) {
                    result.errors.push(error);
                }
                if (tempResult instanceof ResultWithError) {
                    result.result = tempResult.result;
                }
            }
            else {
                result.result = tempResult;
            }
        }
        catch (e) {
            result.errors.push(new HttpError(HttpErrorCode.unknow, e));
        }
        return result;
    }
    async queryTxt(router) {
        this.setHeader("Accept", "text/plain");
        let resultTemp = await this.query(router);
        let result = new ResultWithError();
        if (!resultTemp.success) {
            result.errors = resultTemp.errors;
            return result;
        }
        try {
            if (!resultTemp.result) {
                return result;
            }
            result.result = await resultTemp.result.text();
        }
        catch (e) {
            result.errors.push(new HttpError(HttpErrorCode.unknow, e));
        }
        return result;
    }
    async queryBlob(router) {
        this.setHeader("Accept", "application/octet-stream");
        let resultTemp = await this.query(router);
        let result = new ResultWithError();
        if (!resultTemp.success) {
            result.errors = resultTemp.errors;
            return result;
        }
        try {
            if (!resultTemp.result) {
                return result;
            }
            result.result = await resultTemp.result.blob();
        }
        catch (e) {
            result.errors.push(new HttpError(HttpErrorCode.unknow, e));
        }
        return result;
    }
    clearCache(router) {
        const isFull = this.url.match("https?://");
        if (!this.url.startsWith("/") && !isFull) {
            this.url = "/" + this.url;
        }
        const fullUrl = isFull ? this.url : router ? router.options.url + this.url : this.url;
        HttpCache.clear(fullUrl, this.request);
    }
}
HttpRequest.Namespace=`Aventus`;
__as1(_, 'HttpRequest', HttpRequest);

let HttpRouter=class HttpRouter {
    static options;
    static configure(options) {
        this.options = options;
    }
    options;
    constructor() {
        this.options = this.defineOptions(this.defaultOptionsValue());
    }
    defaultOptionsValue() {
        return HttpRouter.options ?? {
            url: location.protocol + "//" + location.host
        };
    }
    defineOptions(options) {
        return options;
    }
    async get(url) {
        return await new HttpRequest(url).queryJSON(this);
    }
    async post(url, data) {
        return await new HttpRequest(url, HttpMethod.POST, data).queryJSON(this);
    }
    async put(url, data) {
        return await new HttpRequest(url, HttpMethod.PUT, data).queryJSON(this);
    }
    async delete(url, data) {
        return await new HttpRequest(url, HttpMethod.DELETE, data).queryJSON(this);
    }
    async option(url, data) {
        return await new HttpRequest(url, HttpMethod.OPTION, data).queryJSON(this);
    }
}
HttpRouter.Namespace=`Aventus`;
__as1(_, 'HttpRouter', HttpRouter);

let HttpRoute=class HttpRoute {
    router;
    constructor(router) {
        this.router = router ?? new HttpRouter();
    }
    getPrefix() {
        return "";
    }
}
HttpRoute.Namespace=`Aventus`;
__as1(_, 'HttpRoute', HttpRoute);

let ResizeObserver=class ResizeObserver {
    callback;
    targets;
    fpsInterval = -1;
    nextFrame;
    entriesChangedEvent;
    willTrigger;
    static resizeObserverClassByObject = {};
    static uniqueInstance;
    static getUniqueInstance() {
        if (!ResizeObserver.uniqueInstance) {
            ResizeObserver.uniqueInstance = new window.ResizeObserver(entries => {
                let allClasses = [];
                for (let j = 0; j < entries.length; j++) {
                    let entry = entries[j];
                    const target = entry.target;
                    let index = target['sourceIndex'];
                    if (ResizeObserver.resizeObserverClassByObject[index]) {
                        for (let i = 0; i < ResizeObserver.resizeObserverClassByObject[index].length; i++) {
                            let classTemp = ResizeObserver.resizeObserverClassByObject[index][i];
                            classTemp.entryChanged(entry);
                            if (allClasses.indexOf(classTemp) == -1) {
                                allClasses.push(classTemp);
                            }
                        }
                    }
                }
                for (let i = 0; i < allClasses.length; i++) {
                    allClasses[i].triggerCb();
                }
            });
        }
        return ResizeObserver.uniqueInstance;
    }
    constructor(options) {
        let realOption;
        if (options instanceof Function) {
            realOption = {
                callback: options,
            };
        }
        else {
            realOption = options;
        }
        this.callback = realOption.callback;
        this.targets = [];
        if (!realOption.fps) {
            realOption.fps = 60;
        }
        if (realOption.fps != -1) {
            this.fpsInterval = 1000 / realOption.fps;
        }
        this.nextFrame = 0;
        this.entriesChangedEvent = {};
        this.willTrigger = false;
    }
    /**
     * Observe size changing for the element
     */
    observe(target) {
        const _target = target;
        if (!_target["sourceIndex"]) {
            _target["sourceIndex"] = Math.random().toString(36);
            this.targets.push(_target);
            ResizeObserver.getUniqueInstance().observe(_target);
        }
        if (!ResizeObserver.resizeObserverClassByObject[_target["sourceIndex"]]) {
            ResizeObserver.resizeObserverClassByObject[_target["sourceIndex"]] = [];
        }
        if (ResizeObserver.resizeObserverClassByObject[_target["sourceIndex"]].indexOf(this) == -1) {
            ResizeObserver.resizeObserverClassByObject[_target["sourceIndex"]].push(this);
        }
    }
    /**
     * Stop observing size changing for the element
     */
    unobserve(target) {
        const _target = target;
        for (let i = 0; this.targets.length; i++) {
            let tempTarget = this.targets[i];
            if (tempTarget == _target) {
                let position = ResizeObserver.resizeObserverClassByObject[_target['sourceIndex']].indexOf(this);
                if (position != -1) {
                    ResizeObserver.resizeObserverClassByObject[_target['sourceIndex']].splice(position, 1);
                }
                if (ResizeObserver.resizeObserverClassByObject[_target['sourceIndex']].length == 0) {
                    delete ResizeObserver.resizeObserverClassByObject[_target['sourceIndex']];
                }
                ResizeObserver.getUniqueInstance().unobserve(_target);
                this.targets.splice(i, 1);
                return;
            }
        }
    }
    /**
     * Destroy the resize observer
     */
    disconnect() {
        for (let i = 0; this.targets.length; i++) {
            this.unobserve(this.targets[i]);
        }
    }
    entryChanged(entry) {
        const _target = entry.target;
        let index = _target.sourceIndex;
        this.entriesChangedEvent[index] = entry;
    }
    triggerCb() {
        if (!this.willTrigger) {
            this.willTrigger = true;
            this._triggerCb();
        }
    }
    _triggerCb() {
        let now = window.performance.now();
        let elapsed = now - this.nextFrame;
        if (this.fpsInterval != -1 && elapsed <= this.fpsInterval) {
            requestAnimationFrame(() => {
                this._triggerCb();
            });
            return;
        }
        this.nextFrame = now - (elapsed % this.fpsInterval);
        let changed = Object.values(this.entriesChangedEvent);
        this.entriesChangedEvent = {};
        this.willTrigger = false;
        setTimeout(() => {
            this.callback(changed, ResizeObserver.uniqueInstance);
        }, 0);
    }
}
ResizeObserver.Namespace=`Aventus`;
__as1(_, 'ResizeObserver', ResizeObserver);

let DragAndDrop=class DragAndDrop {
    /**
     * Default offset before drag element
     */
    static defaultOffsetDrag = 20;
    pressManager;
    options;
    startCursorPosition = { x: 0, y: 0 };
    startElementPosition = { x: 0, y: 0 };
    isEnable = true;
    draggableElement;
    constructor(options) {
        this.options = this.getDefaultOptions(options.element);
        this.mergeProperties(options);
        this.mergeFunctions(options);
        this.options.elementTrigger.style.touchAction = 'none';
        this.pressManager = new PressManager({
            element: this.options.elementTrigger,
            onPressStart: this.onPressStart.bind(this),
            onPressEnd: this.onPressEnd.bind(this),
            onDragStart: this.onDragStart.bind(this),
            onDrag: this.onDrag.bind(this),
            onDragEnd: this.onDragEnd.bind(this),
            offsetDrag: this.options.offsetDrag,
            dragDirection: this.options.dragDirection,
            stopPropagation: this.options.stopPropagation
        });
    }
    getDefaultOptions(element) {
        return {
            applyDrag: true,
            element: element,
            elementTrigger: element,
            offsetDrag: DragAndDrop.defaultOffsetDrag,
            dragDirection: 'XY',
            shadow: {
                enable: false,
                container: document.body,
                removeOnStop: true,
                transform: () => { },
                delete: (el) => {
                    el.remove();
                }
            },
            strict: false,
            targets: [],
            usePercent: false,
            stopPropagation: true,
            useMouseFinalPosition: false,
            useTransform: false,
            isDragEnable: () => true,
            getZoom: () => 1,
            getOffsetX: () => 0,
            getOffsetY: () => 0,
            onPointerDown: (e) => { },
            onPointerUp: (e) => { },
            onStart: (e) => { },
            onMove: (e) => { },
            onStop: (e) => { },
            onDrop: (element, targets) => { },
            correctPosition: (position) => position
        };
    }
    mergeProperties(options) {
        if (options.element === void 0) {
            throw "You must define the element for the drag&drop";
        }
        this.options.element = options.element;
        if (options.elementTrigger === void 0) {
            this.options.elementTrigger = this.options.element;
        }
        else {
            this.options.elementTrigger = options.elementTrigger;
        }
        this.defaultMerge(options, "applyDrag");
        this.defaultMerge(options, "offsetDrag");
        this.defaultMerge(options, "dragDirection");
        this.defaultMerge(options, "strict");
        this.defaultMerge(options, "targets");
        this.defaultMerge(options, "usePercent");
        this.defaultMerge(options, "stopPropagation");
        this.defaultMerge(options, "useMouseFinalPosition");
        this.defaultMerge(options, "useTransform");
        if (options.shadow !== void 0) {
            this.options.shadow.enable = options.shadow.enable;
            if (options.shadow.container !== void 0) {
                this.options.shadow.container = options.shadow.container;
            }
            else {
                this.options.shadow.container = document.body;
            }
            if (options.shadow.removeOnStop !== void 0) {
                this.options.shadow.removeOnStop = options.shadow.removeOnStop;
            }
            if (options.shadow.transform !== void 0) {
                this.options.shadow.transform = options.shadow.transform;
            }
            if (options.shadow.delete !== void 0) {
                this.options.shadow.delete = options.shadow.delete;
            }
        }
    }
    mergeFunctions(options) {
        this.defaultMerge(options, "isDragEnable");
        this.defaultMerge(options, "getZoom");
        this.defaultMerge(options, "getOffsetX");
        this.defaultMerge(options, "getOffsetY");
        this.defaultMerge(options, "onPointerDown");
        this.defaultMerge(options, "onPointerUp");
        this.defaultMerge(options, "onStart");
        this.defaultMerge(options, "onMove");
        this.defaultMerge(options, "onStop");
        this.defaultMerge(options, "onDrop");
        this.defaultMerge(options, "correctPosition");
    }
    defaultMerge(options, name) {
        if (options[name] !== void 0) {
            const opts = this.options;
            opts[name] = options[name];
        }
    }
    positionShadowRelativeToElement = { x: 0, y: 0 };
    onPressStart(e) {
        this.options.onPointerDown(e);
    }
    onPressEnd(e) {
        this.options.onPointerUp(e);
    }
    onDragStart(e) {
        this.isEnable = this.options.isDragEnable();
        if (!this.isEnable) {
            return false;
        }
        let draggableElement = this.options.element;
        this.startCursorPosition = {
            x: e.pageX,
            y: e.pageY
        };
        this.startElementPosition = this.getBoundingBoxRelative(draggableElement);
        if (this.options.shadow.enable) {
            draggableElement = this.options.element.cloneNode(true);
            let elBox = this.options.element.getBoundingClientRect();
            let containerBox = this.options.shadow.container.getBoundingClientRect();
            this.positionShadowRelativeToElement = {
                x: elBox.x - containerBox.x,
                y: elBox.y - containerBox.y
            };
            if (this.options.applyDrag) {
                draggableElement.style.position = "absolute";
                draggableElement.style.top = this.positionShadowRelativeToElement.y + this.options.getOffsetY() + 'px';
                draggableElement.style.left = this.positionShadowRelativeToElement.x + this.options.getOffsetX() + 'px';
                this.options.shadow.transform(draggableElement);
                this.options.shadow.container.appendChild(draggableElement);
            }
        }
        this.draggableElement = draggableElement;
        const result = this.options.onStart(e);
        if (result !== false) {
            document.body.style.userSelect = 'none';
            if (window.getSelection) {
                window.getSelection()?.removeAllRanges();
            }
        }
        return result;
    }
    onDrag(e) {
        if (!this.isEnable) {
            return;
        }
        let zoom = this.options.getZoom();
        let diff = {
            x: 0,
            y: 0
        };
        if (this.options.shadow.enable) {
            diff = {
                x: (e.pageX - this.startCursorPosition.x) + this.positionShadowRelativeToElement.x + this.options.getOffsetX(),
                y: (e.pageY - this.startCursorPosition.y) + this.positionShadowRelativeToElement.y + this.options.getOffsetY(),
            };
        }
        else {
            diff = {
                x: (e.pageX - this.startCursorPosition.x) / zoom + this.startElementPosition.x + this.options.getOffsetX(),
                y: (e.pageY - this.startCursorPosition.y) / zoom + this.startElementPosition.y + this.options.getOffsetY()
            };
        }
        let newPos = this.setPosition(diff);
        this.options.onMove(e, newPos);
    }
    onDragEnd(e) {
        if (!this.isEnable) {
            return;
        }
        document.body.style.userSelect = '';
        let targets = this.options.useMouseFinalPosition ? this.getMatchingTargetsWithMousePosition({
            x: e.clientX,
            y: e.clientY
        }) : this.getMatchingTargets();
        let draggableElement = this.draggableElement;
        if (this.options.shadow.enable && this.options.shadow.removeOnStop) {
            this.options.shadow.delete(draggableElement);
        }
        if (targets.length > 0) {
            this.options.onDrop(this.options.element, targets);
        }
        this.options.onStop(e);
    }
    setPosition(position) {
        let draggableElement = this.draggableElement;
        if (this.options.usePercent) {
            let elementParent = this.getOffsetParent(draggableElement);
            if (elementParent instanceof HTMLElement) {
                let percentPosition = {
                    x: (position.x / elementParent.offsetWidth) * 100,
                    y: (position.y / elementParent.offsetHeight) * 100
                };
                percentPosition = this.options.correctPosition(percentPosition);
                if (this.options.applyDrag) {
                    draggableElement.style.left = percentPosition.x + '%';
                    draggableElement.style.top = percentPosition.y + '%';
                }
                return percentPosition;
            }
            else {
                console.error("Can't find parent. Contact an admin", draggableElement);
            }
        }
        else {
            position = this.options.correctPosition(position);
            if (this.options.applyDrag) {
                if (this.isLeftTopElement(draggableElement)) {
                    draggableElement.style.left = position.x + 'px';
                    draggableElement.style.top = position.y + 'px';
                }
                else {
                    if (this.options.useTransform) {
                        draggableElement.setAttribute("transform", `translate(${position.x},${position.y})`);
                    }
                    else {
                        draggableElement.style.left = position.x + 'px';
                        draggableElement.style.top = position.y + 'px';
                    }
                }
            }
        }
        return position;
    }
    getTargets() {
        if (typeof this.options.targets == "function") {
            return this.options.targets();
        }
        else {
            return this.options.targets;
        }
    }
    /**
     * Get targets within the current element position is matching
     */
    getMatchingTargets() {
        let draggableElement = this.draggableElement;
        let matchingTargets = [];
        let srcTargets = this.getTargets();
        for (let target of srcTargets) {
            let elementCoordinates = this.getBoundingBoxAbsolute(draggableElement);
            let targetCoordinates = this.getBoundingBoxAbsolute(target);
            let offsetX = this.options.getOffsetX();
            let offsetY = this.options.getOffsetY();
            let zoom = this.options.getZoom();
            targetCoordinates.x += offsetX;
            targetCoordinates.y += offsetY;
            targetCoordinates.width *= zoom;
            targetCoordinates.height *= zoom;
            if (this.options.strict) {
                if ((elementCoordinates.x >= targetCoordinates.x && elementCoordinates.x + elementCoordinates.width <= targetCoordinates.x + targetCoordinates.width) &&
                    (elementCoordinates.y >= targetCoordinates.y && elementCoordinates.y + elementCoordinates.height <= targetCoordinates.y + targetCoordinates.height)) {
                    matchingTargets.push(target);
                }
            }
            else {
                let elementLeft = elementCoordinates.x;
                let elementRight = elementCoordinates.x + elementCoordinates.width;
                let elementTop = elementCoordinates.y;
                let elementBottom = elementCoordinates.y + elementCoordinates.height;
                let targetLeft = targetCoordinates.x;
                let targetRight = targetCoordinates.x + targetCoordinates.width;
                let targetTop = targetCoordinates.y;
                let targetBottom = targetCoordinates.y + targetCoordinates.height;
                if (!(elementRight < targetLeft ||
                    elementLeft > targetRight ||
                    elementBottom < targetTop ||
                    elementTop > targetBottom)) {
                    matchingTargets.push(target);
                }
            }
        }
        return matchingTargets;
    }
    /**
     * This function will return the targets that are matching with the mouse position
     * @param mouse The mouse position
     */
    getMatchingTargetsWithMousePosition(mouse) {
        let matchingTargets = [];
        if (this.options.shadow.enable == false || this.options.shadow.container == null) {
            console.warn("DragAndDrop : To use useMouseFinalPosition=true, you must enable shadow and set a container");
            return matchingTargets;
        }
        const container = this.options.shadow.container;
        let xCorrected = mouse.x - container.getBoundingClientRect().left;
        let yCorrected = mouse.y - container.getBoundingClientRect().top;
        for (let target of this.getTargets()) {
            if (this.isLeftTopElement(target)) {
                if (this.matchPosition(target, { x: mouse.x, y: mouse.y })) {
                    matchingTargets.push(target);
                }
            }
            else {
                if (this.matchPosition(target, { x: xCorrected, y: yCorrected })) {
                    matchingTargets.push(target);
                }
            }
        }
        return matchingTargets;
    }
    matchPosition(element, point) {
        let elementCoordinates = this.getBoundingBoxAbsolute(element);
        if (point.x >= elementCoordinates.x &&
            point.x <= elementCoordinates.x + elementCoordinates.width &&
            point.y >= elementCoordinates.y &&
            point.y <= elementCoordinates.y + elementCoordinates.height) {
            return true;
        }
        return false;
    }
    /**
     * Get element currently dragging
     */
    getElementDrag() {
        return this.options.element;
    }
    /**
     * Set targets where to drop
     */
    setTargets(targets) {
        this.options.targets = targets;
    }
    /**
     * Set targets where to drop
     */
    setTargetsFct(targets) {
        this.options.targets = targets;
    }
    /**
     * Destroy the current drag&drop instance
     */
    destroy() {
        this.pressManager.destroy();
    }
    isLeftTopElement(element) {
        for (let Type of DragElementLeftTopType) {
            if (element instanceof Type) {
                return true;
            }
        }
        return false;
    }
    isXYElement(element) {
        for (let Type of DragElementXYType) {
            if (element instanceof Type) {
                return true;
            }
        }
        return false;
    }
    getCoordinateFromAttribute(element) {
        if (this.options.useTransform) {
            const transform = element.getAttribute("transform");
            const tvalue = transform?.match(/translate\(([^,]+),([^,]+)\)/);
            const x = tvalue ? parseFloat(tvalue[1]) : 0;
            const y = tvalue ? parseFloat(tvalue[2]) : 0;
            return {
                x: x,
                y: y
            };
        }
        return {
            x: parseFloat(element.getAttribute("x")),
            y: parseFloat(element.getAttribute("y"))
        };
    }
    XYElementToRelativeBox(element) {
        let coordinates = this.getCoordinateFromAttribute(element);
        const width = parseFloat(element.getAttribute("width"));
        const height = parseFloat(element.getAttribute("height"));
        return {
            x: coordinates.x,
            y: coordinates.y,
            width: width,
            height: height,
            bottom: coordinates.y + height,
            right: coordinates.x + width,
            top: coordinates.y,
            left: coordinates.x,
            toJSON() {
                return JSON.stringify(this);
            }
        };
    }
    XYElementToAbsoluteBox(element) {
        let coordinates = this.getCoordinateFromAttribute(element);
        const parent = this.getOffsetParent(element);
        if (parent) {
            const box = parent.getBoundingClientRect();
            coordinates = {
                x: coordinates.x + box.x,
                y: coordinates.y + box.y
            };
        }
        const width = parseFloat(element.getAttribute("width"));
        const height = parseFloat(element.getAttribute("height"));
        return {
            x: coordinates.x,
            y: coordinates.y,
            width: width,
            height: height,
            bottom: coordinates.y + height,
            right: coordinates.x + width,
            top: coordinates.y,
            left: coordinates.x,
            toJSON() {
                return JSON.stringify(this);
            }
        };
    }
    getBoundingBoxAbsolute(element) {
        if (this.isLeftTopElement(element)) {
            if (element instanceof HTMLElement) {
                const bounds = element.getBoundingClientRect();
                return {
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    bottom: bounds.bottom,
                    right: bounds.right,
                    top: bounds.top,
                    left: bounds.left,
                    toJSON() {
                        return JSON.stringify(this);
                    }
                };
            }
        }
        else if (this.isXYElement(element)) {
            return this.XYElementToAbsoluteBox(element);
        }
        const parent = this.getOffsetParent(element);
        if (parent instanceof HTMLElement) {
            const rect = element.getBoundingClientRect();
            const rectParent = parent.getBoundingClientRect();
            const x = rect.left - rectParent.left;
            const y = rect.top - rectParent.top;
            return {
                x: x,
                y: y,
                width: rect.width,
                height: rect.height,
                bottom: y + rect.height,
                right: x + rect.width,
                left: rect.left - rectParent.left,
                top: rect.top - rectParent.top,
                toJSON() {
                    return JSON.stringify(this);
                }
            };
        }
        console.error("Element type not supported");
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            bottom: 0,
            right: 0,
            top: 0,
            left: 0,
            toJSON() {
                return JSON.stringify(this);
            }
        };
    }
    getBoundingBoxRelative(element) {
        if (this.isLeftTopElement(element)) {
            if (element instanceof HTMLElement) {
                return {
                    x: element.offsetLeft,
                    y: element.offsetTop,
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                    bottom: element.offsetTop + element.offsetHeight,
                    right: element.offsetLeft + element.offsetWidth,
                    top: element.offsetTop,
                    left: element.offsetLeft,
                    toJSON() {
                        return JSON.stringify(this);
                    }
                };
            }
        }
        else if (this.isXYElement(element)) {
            return this.XYElementToRelativeBox(element);
        }
        const parent = this.getOffsetParent(element);
        if (parent instanceof HTMLElement) {
            const rect = element.getBoundingClientRect();
            const rectParent = parent.getBoundingClientRect();
            const x = rect.left - rectParent.left;
            const y = rect.top - rectParent.top;
            return {
                x: x,
                y: y,
                width: rect.width,
                height: rect.height,
                bottom: y + rect.height,
                right: x + rect.width,
                left: rect.left - rectParent.left,
                top: rect.top - rectParent.top,
                toJSON() {
                    return JSON.stringify(this);
                }
            };
        }
        console.error("Element type not supported");
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            bottom: 0,
            right: 0,
            top: 0,
            left: 0,
            toJSON() {
                return JSON.stringify(this);
            }
        };
    }
    getOffsetParent(element) {
        if (element instanceof HTMLElement) {
            return element.offsetParent;
        }
        let current = element.parentNode;
        while (current) {
            if (current instanceof Element) {
                const style = getComputedStyle(current);
                if (style.position !== 'static') {
                    return current;
                }
            }
            if (current instanceof ShadowRoot) {
                current = current.host;
            }
            else {
                current = current.parentNode;
            }
        }
        return null;
    }
}
DragAndDrop.Namespace=`Aventus`;
__as1(_, 'DragAndDrop', DragAndDrop);

let ResourceLoader=class ResourceLoader {
    static headerLoaded = {};
    static headerWaiting = {};
    /**
     * Load the resource inside the head tag
     */
    static async loadInHead(options) {
        const _options = this.prepareOptions(options);
        if (this.headerLoaded[_options.url]) {
            return true;
        }
        else if (this.headerWaiting.hasOwnProperty(_options.url)) {
            return await this.awaitFctHead(_options.url);
        }
        else {
            this.headerWaiting[_options.url] = [];
            let tagEl;
            if (_options.type == "js") {
                tagEl = document.createElement("SCRIPT");
            }
            else if (_options.type == "css") {
                tagEl = document.createElement("LINK");
                tagEl.setAttribute("rel", "stylesheet");
            }
            else {
                throw "unknow type " + _options.type + " to append into head";
            }
            document.head.appendChild(tagEl);
            let result = await this.loadTag(tagEl, _options.url);
            this.headerLoaded[_options.url] = true;
            this.releaseAwaitFctHead(_options.url, result);
            return result;
        }
    }
    static loadTag(tagEl, url) {
        return new Promise((resolve, reject) => {
            tagEl.addEventListener("load", (e) => {
                resolve(true);
            });
            tagEl.addEventListener("error", (e) => {
                resolve(false);
            });
            if (tagEl instanceof HTMLLinkElement) {
                tagEl.setAttribute("href", url);
            }
            else {
                tagEl.setAttribute('src', url);
            }
        });
    }
    static releaseAwaitFctHead(url, result) {
        if (this.headerWaiting[url]) {
            for (let i = 0; i < this.headerWaiting[url].length; i++) {
                this.headerWaiting[url][i](result);
            }
            delete this.headerWaiting[url];
        }
    }
    static awaitFctHead(url) {
        return new Promise((resolve) => {
            this.headerWaiting[url].push((result) => {
                resolve(result);
            });
        });
    }
    static requestLoaded = {};
    static requestWaiting = {};
    /**
     *
    */
    static async load(options) {
        options = this.prepareOptions(options);
        if (this.requestLoaded[options.url]) {
            return this.requestLoaded[options.url];
        }
        else if (this.requestWaiting.hasOwnProperty(options.url)) {
            await this.awaitFct(options.url);
            return this.requestLoaded[options.url];
        }
        else {
            this.requestWaiting[options.url] = [];
            let blob = false;
            if (options.type == "img") {
                blob = true;
            }
            let content = await this.fetching(options.url, blob);
            if (options.type == "img" && content.startsWith("data:text/html;")) {
                console.error("Can't load img " + options.url);
                content = "";
            }
            this.requestLoaded[options.url] = content;
            this.releaseAwaitFct(options.url);
            return content;
        }
    }
    static releaseAwaitFct(url) {
        if (this.requestWaiting[url]) {
            for (let i = 0; i < this.requestWaiting[url].length; i++) {
                this.requestWaiting[url][i]();
            }
            delete this.requestWaiting[url];
        }
    }
    static awaitFct(url) {
        return new Promise((resolve) => {
            this.requestWaiting[url].push(() => {
                resolve('');
            });
        });
    }
    static async fetching(url, useBlob = false) {
        if (useBlob) {
            let result = await fetch(url, {
                headers: {
                    responseType: 'blob'
                }
            });
            let blob = await result.blob();
            return await this.readFile(blob);
        }
        else {
            let result = await fetch(url);
            return await result.text();
        }
    }
    static readFile(blob) {
        return new Promise((resolve) => {
            var reader = new FileReader();
            reader.onloadend = function () {
                resolve(reader.result);
            };
            reader.readAsDataURL(blob);
        });
    }
    static imgExtensions = ["png", "jpg", "jpeg", "gif"];
    static prepareOptions(options) {
        let result;
        if (typeof options === 'string' || options instanceof String) {
            result = {
                url: options,
                type: 'js'
            };
            let splittedURI = result.url.split('.');
            let extension = splittedURI[splittedURI.length - 1];
            extension = extension.split("?")[0];
            if (extension == "svg") {
                result.type = 'svg';
            }
            else if (extension == "js") {
                result.type = 'js';
            }
            else if (extension == "css") {
                result.type = 'css';
            }
            else if (this.imgExtensions.indexOf(extension) != -1) {
                result.type = 'img';
            }
            else {
                delete result.type;
            }
        }
        else {
            result = options;
        }
        return result;
    }
}
ResourceLoader.Namespace=`Aventus`;
__as1(_, 'ResourceLoader', ResourceLoader);


for(let key in _) { Aventus[key] = _[key] }
})(Aventus);

var VscodeView;
(VscodeView||(VscodeView = {}));
(function (VscodeView) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `VscodeView`;
const _ = {};


let _n;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["unknow"] = 0] = "unknow";
    ErrorCode[ErrorCode["differentChannel"] = 1] = "differentChannel";
    ErrorCode[ErrorCode["timeout"] = 2] = "timeout";
})(ErrorCode || (ErrorCode = {}));
__as1(_, 'ErrorCode', ErrorCode);

let Error=class Error extends Aventus.GenericError {
}
Error.Namespace=`VscodeView`;
Error.$schema={...(Aventus.GenericError?.$schema ?? {}), };
Aventus.Converter.register(Error.Fullname, Error);
__as1(_, 'Error', Error);

let Router=class Router {
    static get isVscode() {
        return 'acquireVsCodeApi' in window;
    }
    static getInstance() {
        return Aventus.Instance.get(Router);
    }
    routes = {};
    waitingList = {};
    vscode;
    constructor() {
        this.vscode = acquireVsCodeApi();
        window.addEventListener('message', (e) => this.onMessage(e));
    }
    addRoute(route) {
        if (!this.routes.hasOwnProperty(route.channel)) {
            this.routes[route.channel] = [];
        }
        for (let info of this.routes[route.channel]) {
            if (info.callback == route.callback) {
                return;
            }
        }
        const { params, regex } = Aventus.Uri.prepare(route.channel);
        let prepared = {
            callback: route.callback,
            channel: route.channel,
            regex,
            params
        };
        this.routes[route.channel].push(prepared);
    }
    removeRoute(route) {
        for (let i = 0; i < this.routes[route.channel].length; i++) {
            let info = this.routes[route.channel][i];
            if (info.callback == route.callback) {
                this.routes[route.channel].splice(i, 1);
                i--;
            }
        }
    }
    onMessage(event) {
        let response = event.data;
        let data = {};
        try {
            data = Aventus.Converter.transform(response.data);
        }
        catch (e) {
            console.error(e);
        }
        for (let channel in this.routes) {
            let current = this.routes[channel];
            for (let info of current) {
                let params = Aventus.Uri.getParams(info, response.channel);
                if (params) {
                    let valueCb = data;
                    if (data instanceof Aventus.ResultWithError) {
                        valueCb = data.result;
                    }
                    else if (data instanceof Aventus.VoidWithError) {
                        valueCb = undefined;
                    }
                    info.callback(valueCb, params, response.uid);
                }
            }
        }
        if (response.uid) {
            if (this.waitingList.hasOwnProperty(response.uid)) {
                this.waitingList[response.uid](response.channel, data);
                delete this.waitingList[response.uid];
            }
        }
    }
    send(options) {
        let result = new Aventus.VoidWithError();
        try {
            let message = {
                channel: options.channel,
            };
            if (options.uid) {
                message.uid = options.uid;
            }
            if (options.body) {
                message.data = options.body;
            }
            this.vscode.postMessage(message);
        }
        catch (e) {
            result.errors.push(new Error(ErrorCode.unknow, e));
        }
        return result;
    }
    sendWithResponse(options) {
        return new Promise(async (resolve) => {
            let result = new Aventus.ResultWithError();
            try {
                let _uid = options.uid ? options.uid : Aventus.uuidv4();
                options.uid = _uid;
                let timeoutInfo;
                this.waitingList[_uid] = (channel, data) => {
                    clearTimeout(timeoutInfo);
                    if (channel.toLowerCase() != options.channel.toLowerCase()) {
                        result.errors.push(new Error(ErrorCode.differentChannel, `We sent a message on ${options.channel} but we receive on ${channel}`));
                        resolve(result);
                    }
                    else {
                        if (data instanceof Aventus.VoidWithError) {
                            for (let error of data.errors) {
                                result.errors.push(error);
                            }
                            if (data instanceof Aventus.ResultWithError) {
                                result.result = data.result;
                            }
                        }
                        else {
                            result.result = data;
                        }
                        resolve(result);
                    }
                };
                if (options.timeout !== undefined) {
                    timeoutInfo = setTimeout(() => {
                        delete this.waitingList[_uid];
                        result.errors.push(new Error(ErrorCode.timeout, "No message received after " + options.timeout + "ms"));
                        resolve(result);
                    }, options.timeout);
                }
                let sendMessageResult = this.send(options);
                if (!sendMessageResult.success) {
                    for (let error of sendMessageResult.errors) {
                        result.errors.push(error);
                    }
                    resolve(result);
                }
            }
            catch (e) {
                result.errors.push(new Error(ErrorCode.unknow, e));
                resolve(result);
            }
        });
    }
}
Router.Namespace=`VscodeView`;
__as1(_, 'Router', Router);


for(let key in _) { VscodeView[key] = _[key] }
})(VscodeView);

var MaterialIcon;
(MaterialIcon||(MaterialIcon = {}));
(function (MaterialIcon) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `MaterialIcon`;
const _ = {};


let _n;
const Icon = class Icon extends Aventus.WebComponent {
    static get observedAttributes() {return ["icon", "type", "fill"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'is_hidden'() { return this.getBoolAttr('is_hidden') }
    set 'is_hidden'(val) { this.setBoolAttr('is_hidden', val) }get 'no_check'() { return this.getBoolAttr('no_check') }
    set 'no_check'(val) { this.setBoolAttr('no_check', val) }    get 'icon'() { return this.getStringProp('icon') }
    set 'icon'(val) { this.setStringAttr('icon', val) }get 'type'() { return this.getStringProp('type') }
    set 'type'(val) { this.setStringAttr('type', val) }get 'fill'() { return this.getBoolProp('fill') }
    set 'fill'(val) { this.setBoolAttr('fill', val) }    static config = {
        type: 'outlined',
        getFontUrl: (variant) => {
            const name = variant.charAt(0).toUpperCase() + variant.slice(1);
            return 'https://fonts.googleapis.com/css2?family=Material+Symbols+' + name + ":FILL@0..1";
        }
    };
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("icon", ((target) => {
    if (target.isReady) {
        target.init();
    }
}));this.__addPropertyActions("type", ((target) => {
    if (target.isReady)
        target.loadFont();
}));this.__addPropertyActions("fill", ((target) => {
    if (target.isReady)
        target.loadFont();
})); }
    static __style = `:host{--_material-icon-animation-duration: var(--material-icon-animation-duration, 1.75s)}:host{direction:ltr;display:inline-block;font-family:"Material Symbols Outlined";-moz-font-feature-settings:"liga";font-size:24px;-moz-osx-font-smoothing:grayscale;font-style:normal;font-weight:normal;letter-spacing:normal;line-height:1;text-transform:none;white-space:nowrap;word-wrap:normal}:host .icon{direction:inherit;display:inline-block;font-family:inherit;-moz-font-feature-settings:inherit;font-size:inherit;-moz-osx-font-smoothing:inherit;font-style:inherit;font-weight:inherit;letter-spacing:inherit;line-height:inherit;text-transform:inherit;white-space:inherit;word-wrap:inherit}:host([is_hidden]){opacity:0}:host([type=sharp]){font-family:"Material Symbols Sharp"}:host([type=rounded]){font-family:"Material Symbols Rounded"}:host([type=outlined]){font-family:"Material Symbols Outlined"}:host([fill]){font-variation-settings:"FILL" 1}:host([spin]){animation:spin var(--_material-icon-animation-duration) linear infinite}:host([reverse_spin]){animation:reverse-spin var(--_material-icon-animation-duration) linear infinite}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes reverse-spin{0%{transform:rotate(360deg)}100%{transform:rotate(0deg)}}`;
    __getStatic() {
        return Icon;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Icon.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="icon" _id="icon_0"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "iconEl",
      "ids": [
        "icon_0"
      ]
    }
  ]
}); }
    getClassName() {
        return "Icon";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('is_hidden')) {this.setAttribute('is_hidden' ,'true'); }if(!this.hasAttribute('no_check')) { this.attributeChangedCallback('no_check', false, false); }if(!this.hasAttribute('icon')){ this['icon'] = "check_box_outline_blank"; }if(!this.hasAttribute('type')){ this['type'] = Icon.config.type; }if(!this.hasAttribute('fill')) { this.attributeChangedCallback('fill', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('is_hidden');this.__upgradeProperty('no_check');this.__upgradeProperty('icon');this.__upgradeProperty('type');this.__upgradeProperty('fill'); }
    __listBoolProps() { return ["is_hidden","no_check","fill"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    async loadFont() {
        if (!this.type)
            return;
        const name = this.type.charAt(0).toUpperCase() + this.type.slice(1);
        let fontsName = [
            'Material Symbols ' + name,
            '"Material Symbols ' + name + '"',
        ];
        const check = () => {
            for (let font of document.fonts) {
                if (fontsName.includes(font.family)) {
                    this.is_hidden = false;
                    return true;
                }
            }
            return false;
        };
        if (check()) {
            return;
        }
        const cb = (e) => {
            check();
            document.fonts.removeEventListener("loadingdone", cb);
        };
        document.fonts.addEventListener("loadingdone", cb);
        let url = Icon.config.getFontUrl(this.type);
        await Aventus.ResourceLoader.loadInHead({
            type: "css",
            url: url
        });
        setTimeout(() => {
            check();
        }, 100);
    }
    async init() {
        if (!this.no_check) {
            await this.loadFont();
        }
        else {
            this.is_hidden = false;
        }
        this.iconEl.innerHTML = this.icon;
    }
    postCreation() {
        this.init();
    }
    static configure(config) {
        this.config = {
            ...this.config,
            ...config,
        };
    }
}
Icon.Namespace=`MaterialIcon`;
Icon.Tag=`mi-icon`;
__as1(_, 'Icon', Icon);
if(!window.customElements.get('mi-icon')){window.customElements.define('mi-icon', Icon);Aventus.WebComponentInstance.registerDefinition(Icon);}


for(let key in _) { MaterialIcon[key] = _[key] }
})(MaterialIcon);

(() => {
    if(!Object.hasOwn(window, "t")) {

        Object.defineProperty(window, "t", {
            get() {return Aventus.I18n.t;}
        });

        Object.defineProperty(window, "tDyn", {
            get() {return Aventus.I18n.t;}
        });

        Aventus.WebComponent.prototype.t = function(key, params = {}) {
            const i18n = Aventus.I18n;
            const localeKey = this.$type.replace(/\./g, '°') + "°" + key;
            if(i18n.hasKey(localeKey)) {
                return i18n.t(localeKey, params);
            }
            return i18n.t(key, params);
        }
        Aventus.WebComponent.prototype.tDyn = function(key, params = {}) {
            const i18n = Aventus.I18n;
            const localeKey = this.$type.replace(/\./g, '°') + "°" + key;
            if(i18n.hasKey(localeKey)) {
                return i18n.t(localeKey, params);
            }
            return i18n.t(key, params);
        }
	}

})();

var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `Aventus`;
const _ = {};

let Lib = {};
_.Lib = Aventus.Lib ?? {};
let Form = {};
_.Form = Aventus.Form ?? {};
let _n;
(function (SpecialTouch) {
    SpecialTouch[SpecialTouch["Backspace"] = 0] = "Backspace";
    SpecialTouch[SpecialTouch["Insert"] = 1] = "Insert";
    SpecialTouch[SpecialTouch["End"] = 2] = "End";
    SpecialTouch[SpecialTouch["PageDown"] = 3] = "PageDown";
    SpecialTouch[SpecialTouch["PageUp"] = 4] = "PageUp";
    SpecialTouch[SpecialTouch["Escape"] = 5] = "Escape";
    SpecialTouch[SpecialTouch["AltGraph"] = 6] = "AltGraph";
    SpecialTouch[SpecialTouch["Control"] = 7] = "Control";
    SpecialTouch[SpecialTouch["Alt"] = 8] = "Alt";
    SpecialTouch[SpecialTouch["Shift"] = 9] = "Shift";
    SpecialTouch[SpecialTouch["CapsLock"] = 10] = "CapsLock";
    SpecialTouch[SpecialTouch["Tab"] = 11] = "Tab";
    SpecialTouch[SpecialTouch["Delete"] = 12] = "Delete";
    SpecialTouch[SpecialTouch["ArrowRight"] = 13] = "ArrowRight";
    SpecialTouch[SpecialTouch["ArrowLeft"] = 14] = "ArrowLeft";
    SpecialTouch[SpecialTouch["ArrowUp"] = 15] = "ArrowUp";
    SpecialTouch[SpecialTouch["ArrowDown"] = 16] = "ArrowDown";
    SpecialTouch[SpecialTouch["Enter"] = 17] = "Enter";
})(Lib.SpecialTouch || (Lib.SpecialTouch = {}));
__as1(_.Lib, 'SpecialTouch', Lib.SpecialTouch);

Form.ButtonElement = class ButtonElement extends Aventus.WebComponent {
    static get observedAttributes() {return ["type"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'type'() { return this.getStringProp('type') }
    set 'type'(val) { this.setStringAttr('type', val) }    static get formAssociated() { return true; }
    internals;
    handler = undefined;
    static __style = ``;
    constructor() {
        super();
        this.internals = this.attachInternals();
        if (this.constructor == ButtonElement) {
            throw "can't instanciate an abstract class";
        }
    }
    __getStatic() {
        return ButtonElement;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ButtonElement.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "ButtonElement";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('type')){ this['type'] = 'button'; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('type'); }
    async triggerSubmit() {
        if (this.type == "submit") {
            if ("loading" in this) {
                if (this.loading)
                    return;
                this.loading = true;
            }
            if (this.internals.form) {
                this.internals.form.requestSubmit();
            }
            else if (this.handler) {
                await this.handler.requestSubmit();
                if ("loading" in this) {
                    this.loading = false;
                }
            }
        }
    }
    registerSubmit() {
        this.handler = this.findParentByType(_.Form.Form.formElements)?.registerSubmit(this);
        if (this.type == "submit") {
            new Aventus.PressManager({
                element: this,
                onPress: () => {
                    this.triggerSubmit();
                }
            });
            this.addEventListener("keyup", (e) => {
                if (e.key == 'Enter') {
                    this.triggerSubmit();
                }
            });
        }
    }
    postCreation() {
        super.postCreation();
        this.registerSubmit();
    }
}
Form.ButtonElement.Namespace=`Aventus.Form`;
__as1(_.Form, 'ButtonElement', Form.ButtonElement);

Form.Validator=class Validator {
    /**
     * The default error message for the validator.
     */
    static msg = "There is an error";
    /**
     * Statically tests a value against one or more validators.
     */
    static async Test(validators, value, name, globalValidation) {
        if (!Array.isArray(validators)) {
            validators = [validators];
        }
        let result = [];
        for (let validator of validators) {
            let resultTemp = new validator();
            const temp = await resultTemp.validate(value, name, globalValidation);
            if (temp === false) {
                result.push('Le champs n\'est pas valide');
            }
            else if (Array.isArray(temp)) {
                for (let error of temp) {
                    result.push(error);
                }
            }
            else if (typeof temp == 'string') {
                result.push(temp);
            }
        }
        return result.length == 0 ? undefined : result;
    }
    _msg;
    /**
     * Initializes a new Validator instance with an optional custom error message.
     */
    constructor(msg) {
        this._msg = msg;
        this.validate = this.validate.bind(this);
    }
    /**
     * Retrieves the error message for the validator, optionally replacing placeholders.
     */
    getMsg(replace) {
        let msg = this._msg ?? this.constructor['msg'];
        if (typeof msg == 'function')
            msg = msg();
        if (replace) {
            for (let field in replace) {
                msg = msg.replace(new RegExp(`\\{ *${field} *\\}`, 'g'), replace[field]);
            }
        }
        return msg;
    }
}
Form.Validator.Namespace=`Aventus.Form`;
__as1(_.Form, 'Validator', Form.Validator);

Form.Form = class Form extends Aventus.WebComponent {
    static get defaultConfig() {
        return _.Form.FormHandler._globalConfig;
    }
    static set formElements(value) {
        _.Form.FormHandler._IFormElements = value;
    }
    static get formElements() {
        return _.Form.FormHandler._IFormElements;
    }
    form;
    request;
    elements = [];
    btns = [];
    onSubmit = new Aventus.Callback();
    static __style = `:host{width:100%}`;
    constructor() {
        super();
        this.checkEnter = this.checkEnter.bind(this);
    }
    __getStatic() {
        return Form;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Form.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Form";
    }
    checkEnter(e) {
        if (e.key == "Enter") {
            this.requestSubmit();
        }
    }
    registerElement(element) {
        if (this.elements.length > 0) {
            this.elements[this.elements.length - 1].removeEventListener("keyup", this.checkEnter);
        }
        this.elements.push(element);
        element.addEventListener("keyup", this.checkEnter);
        return this;
    }
    registerSubmit(element) {
        this.btns.push(element);
        return this;
    }
    async requestSubmit() {
        if (!this.form) {
            for (let element of this.elements) {
                this.form = element.form?.handler;
                if (this.form)
                    break;
            }
        }
        if (this.form) {
            if (this.request || this.form.hasSubmitFct) {
                for (let btn of this.btns) {
                    if ("loading" in btn) {
                        btn.loading = true;
                    }
                }
                await this.form.submit(this.request);
                for (let btn of this.btns) {
                    if ("loading" in btn) {
                        btn.loading = false;
                    }
                }
            }
            else if (await this.form.validate()) {
                this.onSubmit.trigger();
            }
        }
    }
    static createFromController(controller, schema, config, config2) {
        if (typeof schema == "string") {
            let _name = schema;
            let _schema = config;
            let _config = config2;
            return _.Form.FormHandlerController.createWithName(controller, _name, _schema, _config);
        }
        let form = _.Form.FormHandlerController.create(controller, schema, config);
        return form;
    }
    static create(schema, config) {
        let form = new _.Form.FormHandler(schema, config);
        return form;
    }
    static configure(value) {
        _.Form.FormHandler._globalConfig = value;
    }
}
Form.Form.Namespace=`Aventus.Form`;
Form.Form.Tag=`av-form`;
__as1(_.Form, 'Form', Form.Form);
if(!window.customElements.get('av-form')){window.customElements.define('av-form', Form.Form);Aventus.WebComponentInstance.registerDefinition(Form.Form);}

Form.FormHandler=class FormHandler {
    /**
     * Global configuration settings for FormHandler instances.
     */
    static _globalConfig;
    /**
     * List of constructors for elements that implement IForm.
     */
    static _IFormElements = [Form.Form];
    /**
     * Internal watcher instance for tracking form data changes.
     */
    __watcher;
    /**
     * The data item associated with the form.
     */
    get item() {
        return this.__watcher.item;
    }
    /**
     * Sets the data item associated with the form.
     */
    set item(item) {
        this.__watcher.item = item;
    }
    /**
     * Provides access to the internal form parts for the schema.
     */
    get parts() {
        return this.__watcher.form;
    }
    /**
     * Internal map of registered form elements by field name.
     */
    _elements = {};
    /**
     * Provides access to the registered form elements.
     */
    get elements() {
        return { ...this._elements };
    }
    /**
     * Global validation function for the form.
     */
    _globalValidation;
    /**
     * Indicates if validation should occur on input change.
     */
    _validateOnChange = false;
    /**
     * Fallback handler for validation errors not linked to a specific input.
     */
    _onValidateFallback;
    /**
     * Fallback handler for server-side errors not linked to a specific input.
     */
    _onServerFallback;
    /**
     * Function to extract field-specific error messages from a generic error.
     */
    _extractor;
    /**
     * Callback executed upon successful form submission.
     */
    _onSuccess;
    /**
     * The internal function responsible for submitting the form.
     */
    _submitFct;
    /**
     * Checks if a submission function is defined for the form.
     */
    get hasSubmitFct() {
        return this._submitFct != undefined;
    }
    /**
     * The default values for the form fields.
     */
    defaultValues;
    /**
     * Callback triggered when an item's property changes.
     */
    onItemChange = new Aventus.Callback();
    /**
     * Initializes a new FormHandler instance with a given schema and optional configuration.
     */
    constructor(schema, config) {
        this.writeValidationIntoConsole = this.writeValidationIntoConsole.bind(this);
        this.writeErrorIntoConsole = this.writeErrorIntoConsole.bind(this);
        this.defaultExtractor = this.defaultExtractor.bind(this);
        this._globalValidation = config?.validate ?? Form.FormHandler._globalConfig?.validate;
        this._validateOnChange = config?.validateOnChange ?? Form.FormHandler._globalConfig?.validateOnChange ?? false;
        this._onValidateFallback = config?.onValidateFallback ?? Form.FormHandler._globalConfig?.onValidateFallback ?? this.writeValidationIntoConsole;
        this._onServerFallback = config?.onServerFallback ?? Form.FormHandler._globalConfig?.onServerFallback ?? this.writeErrorIntoConsole;
        this._extractor = config?.extractor ?? Form.FormHandler._globalConfig?.extractor ?? this.defaultExtractor;
        this._onSuccess = config?.onSuccess ?? Form.FormHandler._globalConfig?.onSuccess;
        this._submitFct = config?.submit;
        this.defaultValues = config?.defaultValues ?? {};
        this.onWatcherChanged = this.onWatcherChanged.bind(this);
        this.__watcher = Aventus.Watcher.get({
            form: {},
            item: this.defaultValues
        }, this.onWatcherChanged);
        this.__watcher.form = this.transformForm(schema);
    }
    /**
     * Logs validation errors to the console.
     */
    writeValidationIntoConsole(errors) {
        for (let name in errors) {
            if (!errors[name])
                continue;
            for (let error of errors[name]) {
                console.log(name + ": " + error);
            }
        }
    }
    /**
     * Logs generic errors to the console.
     */
    writeErrorIntoConsole(errors) {
        for (let error in errors) {
            console.log(error);
        }
    }
    /**
     * Transforms the raw form schema into an internal representation.
     */
    transformForm(form) {
        const result = form;
        const normalizePart = (part) => {
            let needTransform = true;
            if (typeof part == 'object' && !Array.isArray(part)) {
                const keys = Object.keys(part);
                const keysAllows = ['validate', 'validateOnChange'];
                let isValid = true;
                for (let i = 0; i < keys.length; i++) {
                    const allows = keysAllows;
                    if (!allows.includes(keys[i])) {
                        isValid = false;
                        break;
                    }
                }
                if (isValid) {
                    needTransform = false;
                }
            }
            if (needTransform) {
                return {
                    validate: part
                };
            }
            return part;
        };
        const createKey = (key) => {
            const f = form;
            f[key] = normalizePart(f[key]);
            this.transformFormPart(key, f[key]);
        };
        for (let key in result) {
            createKey(key);
        }
        return result;
    }
    /**
     * Transforms a single form part within the internal form representation.
     */
    transformFormPart(key, part) {
        if (!part)
            return;
        const realPart = part;
        realPart.onValidation = new Aventus.Callback();
        realPart.onValueChange = new Aventus.Callback();
        realPart.handler = this;
        if (part.validate) {
            const isConstructor = (validate) => {
                return Aventus.isClass(validate);
            };
            let validate;
            if (Array.isArray(part.validate)) {
                const fcts = [];
                for (let temp of part.validate) {
                    if (temp instanceof _.Form.Validator) {
                        fcts.push(temp.validate);
                    }
                    else {
                        let resultTemp = new temp();
                        fcts.push(resultTemp.validate);
                    }
                }
                validate = async (value, name, globalFct) => {
                    let result = [];
                    for (let fct of fcts) {
                        const temp = await fct(value, name, globalFct);
                        if (temp === false) {
                            result.push('Le champs n\'est pas valide');
                        }
                        else if (Array.isArray(temp)) {
                            for (let error of temp) {
                                result.push(error);
                            }
                        }
                        else if (typeof temp == 'string') {
                            result.push(temp);
                        }
                    }
                    return result.length == 0 ? undefined : result;
                };
            }
            else if (part.validate instanceof _.Form.Validator) {
                validate = part.validate.validate;
            }
            else if (isConstructor(part.validate)) {
                let cst = part.validate;
                let resultTemp = new cst();
                validate = resultTemp.validate;
            }
            else {
                validate = part.validate;
            }
            realPart.validate = validate;
        }
        realPart.test = async () => {
            const result = await this.validate(key);
            return result;
        };
        if (!this._elements[key]) {
            this._elements[key] = [];
        }
        realPart.register = (el) => {
            if (this._elements[key] && !this._elements[key].includes(el)) {
                this._elements[key].push(el);
            }
        };
        realPart.unregister = (el) => {
            if (!this._elements[key])
                return;
            const index = this._elements[key].indexOf(el);
            if (index != -1) {
                this._elements[key].splice(index, 1);
            }
        };
        realPart.value = {
            get: () => {
                return Aventus.getValueFromObject(key, this.item);
            },
            set: (value) => {
                return Aventus.setValueToObject(key, this.item, value);
            }
        };
        return;
    }
    /**
     * Handles changes observed by the watcher, triggering value change and validation for relevant form parts.
     */
    async onWatcherChanged(action, path, value) {
        if (!this.parts)
            return;
        if (path == "item") {
            for (let key in this.parts) {
                let formPart = this.parts[key];
                formPart.onValueChange.trigger();
            }
        }
        else if (path.startsWith("item.")) {
            let key = path.substring("item.".length);
            const parts = this.parts;
            if (parts[key]) {
                let formPart = parts[key];
                formPart.onValueChange.trigger();
                const validateOnChange = formPart.validateOnChange === undefined ? this._validateOnChange : formPart.validateOnChange;
                if (validateOnChange) {
                    this.validate(key);
                }
            }
            this.onItemChange.trigger(action, key, value);
        }
    }
    async _validate(key) {
        try {
            if (!this.parts)
                return { "@general": ["Aucun formulaire trouvé"] };
            if (key !== undefined) {
                let errorsForm = [];
                if (this.parts[key]) {
                    let formPart = this.parts[key];
                    let value = formPart.value.get();
                    const resultToError = (result) => {
                        if (result === false) {
                            errorsForm.push('Le champs n\'est pas valide');
                        }
                        else if (typeof result == 'string' && result !== "") {
                            errorsForm.push(result);
                        }
                        else if (Array.isArray(result)) {
                            errorsForm = [...errorsForm, ...result];
                        }
                    };
                    if (formPart.validate) {
                        const global = async () => {
                            if (this._globalValidation) {
                                const result = await this._globalValidation(key, value);
                                resultToError(result);
                            }
                        };
                        let result = await formPart.validate(value, key, global);
                        resultToError(result);
                    }
                    else if (this._globalValidation) {
                        const result = await this._globalValidation(key, value);
                        resultToError(result);
                    }
                    const proms = formPart.onValidation.trigger(errorsForm);
                    const errors2d = await Promise.all(proms);
                    const errors = [];
                    for (let errorsTemp of errors2d) {
                        for (let errorTemp of errorsTemp) {
                            if (!errors.includes(errorTemp)) {
                                errors.push(errorTemp);
                            }
                        }
                    }
                    errorsForm = errors;
                }
                return errorsForm.length == 0 ? {} : { [key]: errorsForm };
            }
            let errors = {};
            for (let key in this.parts) {
                errors = { ...errors, ...await this._validate(key) };
            }
            return errors;
        }
        catch (e) {
            return { "@general": [e + ""] };
        }
    }
    async validate(key) {
        const result = await this._validate(key);
        const unhandle = {};
        let triggerUnhandle = false;
        const els = this._elements;
        for (let key in result) {
            if (!els[key] || els[key].length == 0) {
                triggerUnhandle = true;
                unhandle[key] = result[key];
            }
        }
        if (triggerUnhandle && this._onValidateFallback) {
            this._onValidateFallback(unhandle);
        }
        return Object.keys(result).length == 0;
    }
    /**
     * Handles form submission, including validation and execution of the submission function.
     */
    async submit(query) {
        const result = await this.validate();
        if (!result) {
            return null;
        }
        return this.execute(query);
    }
    transformToSend(item) {
        return item;
    }
    /**
     * Executes the form's submission function after validation.
     */
    async execute(query) {
        if (!query) {
            query = this._submitFct;
        }
        if (!query) {
            const res = new Aventus.VoidWithError();
            res.errors.push(new Aventus.GenericError(403, "No submit function defined"));
            return res;
        }
        if (typeof query == "function") {
            if (!this.item) {
                const result = new Aventus.VoidWithError();
                result.errors.push(new Aventus.GenericError(404, "No item inside the form"));
                return result;
            }
            query = query(this.transformToSend(this.item));
        }
        let queryResult = await query;
        if (queryResult.errors.length > 0) {
            queryResult.errors = this.parseErrors(queryResult);
            if (queryResult.errors.length > 0 && this._onServerFallback) {
                this._onServerFallback(queryResult.errors);
            }
        }
        else {
            let result = queryResult instanceof Aventus.ResultWithError ? queryResult.result : undefined;
            if (this._onSuccess)
                await this._onSuccess(result);
        }
        return queryResult;
    }
    /**
     * Extracts field-specific error messages from a generic error object.
     */
    defaultExtractor(error) {
        if (Array.isArray(error.details)) {
            for (let detail of error.details) {
                if (Object.hasOwn(detail, "Name")) {
                    return [{ fieldName: detail.Name, messages: [error.message] }];
                }
            }
        }
        const result = [];
        const details = error.details;
        for (let key in details) {
            const messages = details[key];
            result.push({
                fieldName: key,
                messages: messages
            });
        }
        return result;
    }
    /**
     * Parse errors and display them inside the FormElement if possible
     */
    parseErrors(queryResult) {
        const unappliedErrors = [];
        const elements = this.elements;
        for (const error of queryResult.errors) {
            const extractions = this._extractor(error);
            let applied = false;
            for (const { fieldName, messages } of extractions) {
                const targetElements = elements[fieldName];
                if (targetElements) {
                    for (let element of targetElements) {
                        element.errors.push(...messages);
                    }
                    applied = true;
                }
            }
            if (!applied) {
                unappliedErrors.push(error);
            }
        }
        return unappliedErrors;
    }
    /**
     * Reset form with default values
     */
    reset() {
        this.item = this.defaultValues;
    }
}
Form.FormHandler.Namespace=`Aventus.Form`;
__as1(_.Form, 'FormHandler', Form.FormHandler);

Form.FormHandlerController=class FormHandlerController extends _.Form.FormHandler {
    _controller;
    _formKey;
    /**
     * The HttpRoute controller constructor.
     */
    get controller() {
        return this._controller;
    }
    /**
     * Creates a FormHandlerController instance, inferring the submission method if only one exists.
     */
    static create(controller, schema, config) {
        const fcts = Object.getOwnPropertyNames(controller.prototype).filter(m => m !== "constructor");
        if (fcts.length == 1) {
            if (!config) {
                config = {};
            }
            const ctrl = new controller();
            config.submit = ctrl[fcts[0]];
            return new Form.FormHandlerController(controller, schema, config);
        }
        throw "There isn't exaclty one function inside your controller " + JSON.stringify(fcts) + ". You must use the function createWithName";
    }
    /**
     * Creates a FormHandlerController instance with a explicitly named submission method.
     */
    static createWithName(controller, name, schema, config) {
        if (!config) {
            config = {};
        }
        config.submit = new controller()[name];
        return new Form.FormHandlerController(controller, schema, config);
    }
    /**
     * Creates a FormHandlerController instance, inferring the submission method if only one exists.
     */
    static createSubForm(controller, formKey, schema, config) {
        const fcts = Object.getOwnPropertyNames(controller.prototype).filter(m => m !== "constructor");
        if (fcts.length == 1) {
            if (!config) {
                config = {};
            }
            const ctrl = new controller();
            config.submit = ctrl[fcts[0]];
            return new Form.FormHandlerController(controller, schema, config, formKey);
        }
        throw "There isn't exaclty one function inside your controller " + JSON.stringify(fcts) + ". You must use the function createWithName";
    }
    /**
     * Creates a FormHandlerController instance with a explicitly named submission method.
     */
    static createSubFormWithName(controller, name, formKey, schema, config) {
        if (!config) {
            config = {};
        }
        config.submit = new controller()[name];
        return new Form.FormHandlerController(controller, schema, config, formKey);
    }
    /**
     * Initializes a new FormHandlerController instance.
     */
    constructor(controller, schema, config, formKey) {
        super(schema, config);
        this._controller = controller;
        this._formKey = formKey;
    }
    transformToSend(item) {
        if (this._formKey)
            return {
                [this._formKey]: item
            };
        return item;
    }
}
Form.FormHandlerController.Namespace=`Aventus.Form`;
__as1(_.Form, 'FormHandlerController', Form.FormHandlerController);

Form.FormElement = class FormElement extends Aventus.WebComponent {
    static get observedAttributes() {return ["disabled"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'has_errors'() { return this.getBoolAttr('has_errors') }
    set 'has_errors'(val) { this.setBoolAttr('has_errors', val) }    get 'disabled'() { return this.getBoolProp('disabled') }
    set 'disabled'(val) { this.setBoolAttr('disabled', val) }    get 'value'() {
						return this.__watch["value"];
					}
					set 'value'(val) {
						this.__watch["value"] = val;
					}get 'errors'() {
						return this.__watch["errors"];
					}
					set 'errors'(val) {
						this.__watch["errors"] = val;
					}    static get formAssociated() { return true; }
    _form;
    get form() {
        return this._form;
    }
    set form(value) {
        this.unlinkFormPart();
        this._form = value;
        this.linkFormPart();
    }
    internals;
    canLinkValueToForm = false;
    handler = undefined;
    onChange = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("value", ((target) => {
    target.onValueChange(target.value);
}));this.__addWatchesActions("errors", ((target) => {
    target.onErrorsChange();
}));    super.__registerWatchesActions();
}
    static __style = ``;
    constructor() {
        super();
        this.internals = this.attachInternals();
        if (this.constructor == FormElement) {
            throw "can't instanciate an abstract class";
        }
        this.refreshValueFromForm = this.refreshValueFromForm.bind(this);
        this.onFormValidation = this.onFormValidation.bind(this);
    }
    __getStatic() {
        return FormElement;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(FormElement.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "FormElement";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('has_errors')) { this.attributeChangedCallback('has_errors', false, false); }if(!this.hasAttribute('disabled')) { this.attributeChangedCallback('disabled', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["value"] = undefined;w["errors"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('form');this.__upgradeProperty('has_errors');this.__upgradeProperty('disabled');this.__correctGetter('value');this.__correctGetter('errors'); }
    __listBoolProps() { return ["has_errors","disabled"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    refreshValueFromForm() {
        if (this._form) {
            this.errors = [];
            this.value = this._form.value.get();
        }
    }
    unlinkFormPart() {
        if (this._form) {
            this._form.unregister(this);
            this._form.onValueChange.remove(this.refreshValueFromForm);
            this._form.onValidation.remove(this.onFormValidation);
        }
    }
    linkFormPart() {
        if (this._form) {
            this._form.register(this);
            this._form.onValueChange.add(this.refreshValueFromForm);
            this._form.onValidation.add(this.onFormValidation);
            this.refreshValueFromForm();
        }
        else {
            this.value = undefined;
        }
    }
    async onFormValidation(errors) {
        let _errors = await this.validation();
        if (_errors.length == 0) {
            _errors = errors;
        }
        else if (errors.length > 0) {
            for (let error of errors) {
                if (!_errors.includes(error)) {
                    _errors.push(error);
                }
            }
        }
        this.errors = _errors;
        return this.errors;
    }
    async validate() {
        if (!this.form) {
            this.errors = await this.validation();
            return this.errors.length == 0;
        }
        return await this.form.test();
    }
    async validation() {
        return [];
    }
    clearErrors() {
        this.errors = [];
    }
    triggerChange(value) {
        this.value = value;
        this.onChange.trigger(this.value);
        if (this.form) {
            this.form.value.set(this.value);
        }
    }
    onValueChange(value) {
        this.linkValueToForm();
    }
    onErrorsChange() {
        this.has_errors = this.errors.length > 0;
        this.linkErrorToForm();
    }
    linkErrorToForm() {
        if (!this.canLinkValueToForm)
            return;
        if (this.has_errors) {
            this.internals.setValidity({
                customError: true
            }, this.errors.join(' & '));
        }
        else {
            this.internals.setValidity({});
        }
    }
    linkValueToForm() {
        if (!this.canLinkValueToForm)
            return;
        if (this.value === undefined) {
            this.internals.setFormValue(null);
        }
        else {
            this.internals.setFormValue(this.value + '');
        }
    }
    formAssociatedCallback(form) {
        this.canLinkValueToForm = true;
        this.linkValueToForm();
        this.linkErrorToForm();
        this.validate();
    }
    formDisabledCallback(disabled) {
        this.disabled = disabled;
    }
    postCreation() {
        super.postCreation();
        let handler = this.findParentByType(_.Form.Form.formElements)?.registerElement(this);
    }
    postDestruction() {
        super.postDestruction();
        this.unlinkFormPart();
    }
}
Form.FormElement.Namespace=`Aventus.Form`;
__as1(_.Form, 'FormElement', Form.FormElement);

Lib.ShortcutManager=class ShortcutManager {
    /**
     * Stores registered shortcut callbacks.
     */
    static memory = {};
    /**
     * List of shortcut key combinations that should automatically prevent default browser behavior.
     */
    static autoPrevents = [];
    /**
     * Indicates if the ShortcutManager has been initialized.
     */
    static isInit = false;
    /**
     * Currently pressed keys.
     */
    static arrayKeys = [];
    /**
     * Stores options for each registered shortcut callback.
     */
    static options = new Map();
    /**
     * Stores temporarily replaced shortcut callbacks.
     */
    static replacingMemory = {};
    /**
     * Checks if a given key is a printable character or a space.
     */
    static isTxt(touch) {
        return touch.match(/[a-zA-Z0-9_\+\-]/g) || touch == " ";
    }
    /**
     * Converts a key combination into a standardized string representation.
     */
    static getText(combinaison) {
        let allTouches = [];
        for (let touch of combinaison) {
            let realTouch = "";
            if (typeof touch == "number" && Lib.SpecialTouch[touch] !== undefined) {
                realTouch = Lib.SpecialTouch[touch];
            }
            else if (this.isTxt(touch)) {
                realTouch = touch;
            }
            else {
                throw "I can't use " + touch + " to add a shortcut";
            }
            allTouches.push(realTouch);
        }
        allTouches.sort();
        return allTouches.join("+");
    }
    /**
     * Subscribes a callback function to a specific keyboard shortcut combination.
     */
    static subscribe(combinaison, cb, options) {
        if (!Array.isArray(combinaison)) {
            combinaison = [combinaison];
        }
        let key = this.getText(combinaison);
        if (options?.replaceTemp) {
            if (Lib.ShortcutManager.memory[key]) {
                if (!this.replacingMemory[key]) {
                    this.replacingMemory[key] = [];
                }
                this.replacingMemory[key].push(Lib.ShortcutManager.memory[key]);
                delete Lib.ShortcutManager.memory[key];
            }
        }
        if (!Lib.ShortcutManager.memory[key]) {
            Lib.ShortcutManager.memory[key] = [];
        }
        if (!Lib.ShortcutManager.memory[key].includes(cb)) {
            Lib.ShortcutManager.memory[key].push(cb);
            if (options) {
                this.options.set(cb, options);
            }
        }
        if (!Lib.ShortcutManager.isInit) {
            Lib.ShortcutManager.init();
        }
    }
    /**
     * Unsubscribes a callback function from a keyboard shortcut combination.
     */
    static unsubscribe(combinaison, cb) {
        if (!Array.isArray(combinaison)) {
            combinaison = [combinaison];
        }
        let key = this.getText(combinaison);
        if (Lib.ShortcutManager.memory[key]) {
            let index = Lib.ShortcutManager.memory[key].indexOf(cb);
            if (index != -1) {
                Lib.ShortcutManager.memory[key].splice(index, 1);
                let options = this.options.get(cb);
                if (options) {
                    this.options.delete(cb);
                }
                if (Lib.ShortcutManager.memory[key].length == 0) {
                    delete Lib.ShortcutManager.memory[key];
                    if (options?.replaceTemp) {
                        if (this.replacingMemory[key]) {
                            if (this.replacingMemory[key].length > 0) {
                                Lib.ShortcutManager.memory[key] = this.replacingMemory[key].pop();
                                if (this.replacingMemory[key].length == 0) {
                                    delete this.replacingMemory[key];
                                }
                            }
                            else {
                                delete this.replacingMemory[key];
                            }
                        }
                    }
                }
                if (Object.keys(Lib.ShortcutManager.memory).length == 0 && Lib.ShortcutManager.isInit) {
                    //ShortcutManager.uninit();
                }
            }
        }
    }
    /**
     * Handles keydown events, processing registered shortcuts and preventing default behavior.
     */
    static async onKeyDown(e) {
        if (e.ctrlKey) {
            let txt = Lib.SpecialTouch[Lib.SpecialTouch.Control];
            if (!this.arrayKeys.includes(txt)) {
                this.arrayKeys.push(txt);
            }
        }
        if (e.altKey) {
            let txt = Lib.SpecialTouch[Lib.SpecialTouch.Alt];
            if (!this.arrayKeys.includes(txt)) {
                this.arrayKeys.push(txt);
            }
        }
        if (e.shiftKey) {
            let txt = Lib.SpecialTouch[Lib.SpecialTouch.Shift];
            if (!this.arrayKeys.includes(txt)) {
                this.arrayKeys.push(txt);
            }
        }
        if (this.isTxt(e.key) && !this.arrayKeys.includes(e.key)) {
            this.arrayKeys.push(e.key);
        }
        else if (Lib.SpecialTouch[e.key] !== undefined && !this.arrayKeys.includes(e.key)) {
            this.arrayKeys.push(e.key);
        }
        this.arrayKeys.sort();
        let key = this.arrayKeys.join("+");
        if (Lib.ShortcutManager.memory[key]) {
            let preventDefault = true;
            for (let cb of Lib.ShortcutManager.memory[key]) {
                let options = this.options.get(cb);
                if (options && options.preventDefault === false) {
                    preventDefault = false;
                }
            }
            this.arrayKeys = [];
            for (let cb of Lib.ShortcutManager.memory[key]) {
                const result = await cb();
                if (result === false) {
                    preventDefault = result;
                }
            }
            if (preventDefault) {
                e.preventDefault();
            }
        }
        else if (Lib.ShortcutManager.autoPrevents.includes(key)) {
            e.preventDefault();
        }
    }
    /**
     * Handles keyup events, removing the released key from the currently pressed keys.
     */
    static onKeyUp(e) {
        let index = this.arrayKeys.indexOf(e.key);
        if (index != -1) {
            this.arrayKeys.splice(index, 1);
        }
    }
    /**
     * Initializes the ShortcutManager, setting up global event listeners.
     */
    static init() {
        if (Lib.ShortcutManager.isInit)
            return;
        Lib.ShortcutManager.isInit = true;
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        Lib.ShortcutManager.autoPrevents = [
            this.getText([Lib.SpecialTouch.Control, "s"]),
            this.getText([Lib.SpecialTouch.Control, "p"]),
            this.getText([Lib.SpecialTouch.Control, "l"]),
            this.getText([Lib.SpecialTouch.Control, "k"]),
            this.getText([Lib.SpecialTouch.Control, "j"]),
            this.getText([Lib.SpecialTouch.Control, "h"]),
            this.getText([Lib.SpecialTouch.Control, "g"]),
            this.getText([Lib.SpecialTouch.Control, "f"]),
            this.getText([Lib.SpecialTouch.Control, "d"]),
            this.getText([Lib.SpecialTouch.Control, "o"]),
            this.getText([Lib.SpecialTouch.Control, "u"]),
            this.getText([Lib.SpecialTouch.Control, "e"]),
        ];
        window.addEventListener("blur", () => {
            this.arrayKeys = [];
        });
        document.body.addEventListener("keydown", this.onKeyDown);
        document.body.addEventListener("keyup", this.onKeyUp);
    }
    /**
     * Sets key combinations that should automatically prevent default browser behavior.
     */
    static setAutoPrevents(combinaisons) {
        if (!Lib.ShortcutManager.isInit) {
            this.init();
        }
        Lib.ShortcutManager.autoPrevents = [];
        for (let combinaison of combinaisons) {
            Lib.ShortcutManager.autoPrevents.push(this.getText(combinaison));
        }
    }
    /**
     * Deinitializes the ShortcutManager, removing global event listeners.
     */
    static uninit() {
        document.body.removeEventListener("keydown", this.onKeyDown);
        document.body.removeEventListener("keyup", this.onKeyUp);
        this.arrayKeys = [];
        Lib.ShortcutManager.isInit = false;
    }
}
Lib.ShortcutManager.Namespace=`Aventus.Lib`;
__as1(_.Lib, 'ShortcutManager', Lib.ShortcutManager);


for(let key in _) { Aventus[key] = _[key] }
})(Aventus);

var OneMoreUI;
(OneMoreUI||(OneMoreUI = {}));
(function (OneMoreUI) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `OneMoreUI`;
const _ = {};

let Components = {};
_.Components = OneMoreUI.Components ?? {};
Components.Display = {};
_.Components.Display = OneMoreUI.Components?.Display ?? {};
let Libs = {};
_.Libs = OneMoreUI.Libs ?? {};
Components.Form = {};
_.Components.Form = OneMoreUI.Components?.Form ?? {};
Components.Form.Select = {};
_.Components.Form.Select = OneMoreUI.Components?.Form?.Select ?? {};
Components.Form.Select.BaseSelect = {};
_.Components.Form.Select.BaseSelect = OneMoreUI.Components?.Form?.Select?.BaseSelect ?? {};
let _n;
Components.Display.Scrollable = class Scrollable extends Aventus.WebComponent {
    static get observedAttributes() {return ["zoom"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'y_scroll_visible'() { return this.getBoolAttr('y_scroll_visible') }
    set 'y_scroll_visible'(val) { this.setBoolAttr('y_scroll_visible', val) }get 'x_scroll_visible'() { return this.getBoolAttr('x_scroll_visible') }
    set 'x_scroll_visible'(val) { this.setBoolAttr('x_scroll_visible', val) }get 'floating_scroll'() { return this.getBoolAttr('floating_scroll') }
    set 'floating_scroll'(val) { this.setBoolAttr('floating_scroll', val) }get 'x_scroll'() { return this.getBoolAttr('x_scroll') }
    set 'x_scroll'(val) { this.setBoolAttr('x_scroll', val) }get 'y_scroll'() { return this.getBoolAttr('y_scroll') }
    set 'y_scroll'(val) { this.setBoolAttr('y_scroll', val) }get 'auto_hide'() { return this.getBoolAttr('auto_hide') }
    set 'auto_hide'(val) { this.setBoolAttr('auto_hide', val) }get 'disable'() { return this.getBoolAttr('disable') }
    set 'disable'(val) { this.setBoolAttr('disable', val) }get 'no_user_select'() { return this.getBoolAttr('no_user_select') }
    set 'no_user_select'(val) { this.setBoolAttr('no_user_select', val) }get 'mouse_drag'() { return this.getBoolAttr('mouse_drag') }
    set 'mouse_drag'(val) { this.setBoolAttr('mouse_drag', val) }    get 'zoom'() { return this.getNumberProp('zoom') }
    set 'zoom'(val) { this.setNumberAttr('zoom', val) }    get 'allowResizeObserver'() {
						return this.__signals["allowResizeObserver"].value;
					}
					set 'allowResizeObserver'(val) {
						this.__signals["allowResizeObserver"].value = val;
					}    observer;
    contentWrapperSize = { x: 0, y: 0 };
    display = { x: 0, y: 0 };
    margin = {
        x: 0,
        y: 0
    };
    scroller = {
        x: () => {
            if (!this.horizontalScroller) {
                throw 'can\'t find the horizontalScroller';
            }
            return this.horizontalScroller;
        },
        y: () => {
            if (!this.verticalScroller) {
                throw 'can\'t find the verticalScroller';
            }
            return this.verticalScroller;
        }
    };
    max = {
        x: 0,
        y: 0
    };
    hideDelay = { x: 0, y: 0 };
    get x() {
        return this.contentHidder.scrollLeft;
    }
    get y() {
        return this.contentHidder.scrollTop;
    }
    get xMax() {
        return this.max.x;
    }
    get yMax() {
        return this.max.y;
    }
    scrollTimeout = 0;
    onScrollChange = new Aventus.Callback();
    onZoomChange = new Aventus.Callback();
    __registerSignalsActions() { this.__signals["allowResizeObserver"] = null; super.__registerSignalsActions(); this.__addSignalActions("allowResizeObserver", ((target) => {
    if (target.allowResizeObserver) {
        target.dimensionRefreshed();
    }
})); }
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("zoom", ((target) => {
    target.changeZoom();
})); }
    static __style = `:host{--internal-scrollbar-container-color: var(--scrollbar-container-color, transparent);--internal-scrollbar-color: var(--scrollbar-color, #757575);--internal-scrollbar-active-color: var(--scrollbar-active-color, #858585);--internal-scroller-width: var(--scroller-width, 6px);--internal-scroller-top: var(--scroller-top, 3px);--internal-scroller-bottom: var(--scroller-bottom, 3px);--internal-scroller-right: var(--scroller-right, 3px);--internal-scroller-left: var(--scroller-left, 3px);--_scrollbar-content-padding: var(--scrollbar-content-padding, 0);--_scrollbar-container-display: var(--scrollbar-container-display, inline-block)}:host{display:block;height:100%;min-height:inherit;min-width:inherit;overflow:clip;position:relative;-webkit-user-drag:none;-khtml-user-drag:none;-moz-user-drag:none;-o-user-drag:none;width:100%}:host .scroll-main-container{display:block;height:100%;min-height:inherit;min-width:inherit;position:relative;width:100%}:host .scroll-main-container .content-zoom{display:block;height:100%;min-height:inherit;min-width:inherit;position:relative;transform-origin:0 0;width:100%;z-index:4}:host .scroll-main-container .content-zoom .content-hidder{display:block;height:100%;min-height:inherit;min-width:inherit;overflow:auto;-webkit-overflow-scrolling:touch;-ms-overflow-style:none;position:relative;scrollbar-width:none;width:100%}:host .scroll-main-container .content-zoom .content-hidder::-webkit-scrollbar{display:none}:host .scroll-main-container .content-zoom .content-hidder .content-wrapper{display:var(--_scrollbar-container-display);height:100%;min-height:inherit;min-width:inherit;padding:var(--_scrollbar-content-padding);position:relative;width:100%}:host .scroll-main-container .scroller-wrapper .container-scroller{display:none;overflow:hidden;position:absolute;transition:transform .2s linear;z-index:5}:host .scroll-main-container .scroller-wrapper .container-scroller .shadow-scroller{background-color:var(--internal-scrollbar-container-color);border-radius:5px}:host .scroll-main-container .scroller-wrapper .container-scroller .shadow-scroller .scroller{background-color:var(--internal-scrollbar-color);border-radius:5px;cursor:pointer;position:absolute;-webkit-tap-highlight-color:rgba(0,0,0,0);touch-action:none;z-index:5}:host .scroll-main-container .scroller-wrapper .container-scroller .scroller.active{background-color:var(--internal-scrollbar-active-color)}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical{height:calc(100% - var(--internal-scroller-bottom)*2 - var(--internal-scroller-width));padding-left:var(--internal-scroller-left);right:var(--internal-scroller-right);top:var(--internal-scroller-bottom);transform:0;width:calc(var(--internal-scroller-width) + var(--internal-scroller-left))}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical.hide{transform:translateX(calc(var(--internal-scroller-width) + var(--internal-scroller-left)))}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical .shadow-scroller{height:100%}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical .shadow-scroller .scroller{width:calc(100% - var(--internal-scroller-left))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal{bottom:var(--internal-scroller-bottom);height:calc(var(--internal-scroller-width) + var(--internal-scroller-top));left:var(--internal-scroller-right);padding-top:var(--internal-scroller-top);transform:0;width:calc(100% - var(--internal-scroller-right)*2 - var(--internal-scroller-width))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal.hide{transform:translateY(calc(var(--internal-scroller-width) + var(--internal-scroller-top)))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal .shadow-scroller{height:100%}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal .shadow-scroller .scroller{height:calc(100% - var(--internal-scroller-top))}:host([y_scroll]) .scroll-main-container .content-zoom .content-hidder .content-wrapper{height:auto}:host([x_scroll]) .scroll-main-container .content-zoom .content-hidder .content-wrapper{width:auto}:host([y_scroll_visible]) .scroll-main-container .scroller-wrapper .container-scroller.vertical{display:block}:host([x_scroll_visible]) .scroll-main-container .scroller-wrapper .container-scroller.horizontal{display:block}:host([no_user_select]) .content-wrapper *{user-select:none}:host([no_user_select]) ::slotted{user-select:none}:host([flex]){display:flex;flex-direction:column;min-height:0}:host([flex]) .scroll-main-container{display:flex;flex-direction:column}:host([flex]) .scroll-main-container .content-zoom{display:flex;flex-direction:column}:host([disable]) .scroll-main-container .content-zoom .content-hidder{overflow:hidden}:host([disable]) .scroll-main-container .scroller-wrapper{display:none}:host([is_scrolling]) .content-wrapper{pointer-events:none}`;
    __getStatic() {
        return Scrollable;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Scrollable.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<div class="scroll-main-container" _id="scrollable_0">    <div class="content-zoom" _id="scrollable_1">        <div class="content-hidder" _id="scrollable_2">            <div class="content-wrapper" part="content-wrapper" _id="scrollable_3">                <slot></slot>            </div>        </div>    </div>    <div class="scroller-wrapper">        <div class="container-scroller vertical" _id="scrollable_4">            <div class="shadow-scroller">                <div class="scroller" _id="scrollable_5"></div>            </div>        </div>        <div class="container-scroller horizontal" _id="scrollable_6">            <div class="shadow-scroller">                <div class="scroller" _id="scrollable_7"></div>            </div>        </div>    </div></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "mainContainer",
      "ids": [
        "scrollable_0"
      ]
    },
    {
      "name": "contentZoom",
      "ids": [
        "scrollable_1"
      ]
    },
    {
      "name": "contentHidder",
      "ids": [
        "scrollable_2"
      ]
    },
    {
      "name": "contentWrapper",
      "ids": [
        "scrollable_3"
      ]
    },
    {
      "name": "verticalScrollerContainer",
      "ids": [
        "scrollable_4"
      ]
    },
    {
      "name": "verticalScroller",
      "ids": [
        "scrollable_5"
      ]
    },
    {
      "name": "horizontalScrollerContainer",
      "ids": [
        "scrollable_6"
      ]
    },
    {
      "name": "horizontalScroller",
      "ids": [
        "scrollable_7"
      ]
    }
  ],
  "events": [
    {
      "eventName": "scroll",
      "id": "scrollable_2",
      "fct": (e, c) => c.comp.onScrollEvent(e)
    }
  ]
}); }
    getClassName() {
        return "Scrollable";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('y_scroll_visible')) { this.attributeChangedCallback('y_scroll_visible', false, false); }if(!this.hasAttribute('x_scroll_visible')) { this.attributeChangedCallback('x_scroll_visible', false, false); }if(!this.hasAttribute('floating_scroll')) { this.attributeChangedCallback('floating_scroll', false, false); }if(!this.hasAttribute('x_scroll')) { this.attributeChangedCallback('x_scroll', false, false); }if(!this.hasAttribute('y_scroll')) {this.setAttribute('y_scroll' ,'true'); }if(!this.hasAttribute('auto_hide')) { this.attributeChangedCallback('auto_hide', false, false); }if(!this.hasAttribute('disable')) { this.attributeChangedCallback('disable', false, false); }if(!this.hasAttribute('no_user_select')) { this.attributeChangedCallback('no_user_select', false, false); }if(!this.hasAttribute('mouse_drag')) { this.attributeChangedCallback('mouse_drag', false, false); }if(!this.hasAttribute('zoom')){ this['zoom'] = 1; } }
    __defaultValuesSignal(s) { super.__defaultValuesSignal(s); s["allowResizeObserver"] = true; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('x');this.__correctGetter('y');this.__correctGetter('xMax');this.__correctGetter('yMax');this.__upgradeProperty('y_scroll_visible');this.__upgradeProperty('x_scroll_visible');this.__upgradeProperty('floating_scroll');this.__upgradeProperty('x_scroll');this.__upgradeProperty('y_scroll');this.__upgradeProperty('auto_hide');this.__upgradeProperty('disable');this.__upgradeProperty('no_user_select');this.__upgradeProperty('mouse_drag');this.__upgradeProperty('zoom');this.__correctGetter('allowResizeObserver'); }
    __listBoolProps() { return ["y_scroll_visible","x_scroll_visible","floating_scroll","x_scroll","y_scroll","auto_hide","disable","no_user_select","mouse_drag"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    calculateRealSize() {
        if (!this.contentZoom || !this.mainContainer || !this.contentWrapper) {
            return false;
        }
        const currentOffsetWidth = this.contentZoom.offsetWidth;
        const currentOffsetHeight = this.contentZoom.offsetHeight;
        let hasChanged = false;
        if (this.contentWrapper.offsetWidth != this.contentWrapperSize.x || this.contentWrapper.offsetHeight != this.contentWrapperSize.y)
            hasChanged = true;
        this.contentWrapperSize.x = this.contentWrapper.offsetWidth;
        this.contentWrapperSize.y = this.contentWrapper.offsetHeight;
        if (this.zoom < 1) {
            // scale the container for zoom
            this.contentZoom.style.width = this.div(this.mainContainer.offsetWidth, this.zoom) + 'px';
            this.contentZoom.style.height = this.div(this.mainContainer.offsetHeight, this.zoom) + 'px';
            this.contentZoom.style.maxHeight = this.div(this.mainContainer.offsetHeight, this.zoom) + 'px';
            if (currentOffsetHeight != this.display.y || currentOffsetWidth != this.display.x)
                hasChanged = true;
            this.display.y = currentOffsetHeight;
            this.display.x = currentOffsetWidth;
        }
        else {
            const newX = this.div(currentOffsetWidth, this.zoom);
            const newY = this.div(currentOffsetHeight, this.zoom);
            if (newY != this.display.y || newX != this.display.x)
                hasChanged = true;
            this.display.y = newY;
            this.display.x = newX;
            this.contentZoom.style.width = '';
            this.contentZoom.style.height = '';
            this.contentZoom.style.maxHeight = '';
        }
        return hasChanged;
    }
    calculatePositionScrollerContainer(direction) {
        if (direction == 'y') {
            this.calculatePositionScrollerContainerY();
        }
        else {
            this.calculatePositionScrollerContainerX();
        }
    }
    calculatePositionScrollerContainerY() {
        const leftMissing = this.mainContainer.offsetWidth - this.verticalScrollerContainer.offsetLeft;
        if (leftMissing > 0 && this.y_scroll_visible && !this.floating_scroll) {
            this.contentHidder.style.width = 'calc(100% - ' + leftMissing + 'px)';
            this.contentHidder.style.marginRight = leftMissing + 'px';
            this.margin.x = leftMissing;
        }
        else {
            this.contentHidder.style.width = '';
            this.contentHidder.style.marginRight = '';
            this.margin.x = 0;
        }
    }
    calculatePositionScrollerContainerX() {
        const topMissing = this.mainContainer.offsetHeight - this.horizontalScrollerContainer.offsetTop;
        if (topMissing > 0 && this.x_scroll_visible && !this.floating_scroll) {
            this.contentHidder.style.height = 'calc(100% - ' + topMissing + 'px)';
            this.contentHidder.style.marginBottom = topMissing + 'px';
            this.margin.y = topMissing;
        }
        else {
            this.contentHidder.style.height = '';
            this.contentHidder.style.marginBottom = '';
            this.margin.y = 0;
        }
    }
    calculateSizeScroller(direction) {
        const scrollerSize = (this.div((this.display[direction] - this.margin[direction]), this.contentWrapperSize[direction]) * 100);
        if (direction == "y") {
            this.scroller[direction]().style.height = scrollerSize + '%';
        }
        else {
            this.scroller[direction]().style.width = scrollerSize + '%';
        }
        let maxScrollContent = this.contentWrapperSize[direction] - this.display[direction];
        if (maxScrollContent < 0) {
            maxScrollContent = 0;
        }
        this.max[direction] = maxScrollContent + this.margin[direction];
    }
    changeZoom() {
        this.contentZoom.style.transform = 'scale(' + this.zoom + ')';
        this.dimensionRefreshed(true);
    }
    dimensionRefreshed(force = false) {
        if (!this.calculateRealSize() && !force) {
            return;
        }
        if (this.contentWrapperSize.y - this.display.y > 0) {
            if (!this.y_scroll_visible) {
                this.y_scroll_visible = true;
                this.calculatePositionScrollerContainer('y');
            }
            this.calculateSizeScroller('y');
        }
        else if (this.y_scroll_visible) {
            this.y_scroll_visible = false;
            this.calculatePositionScrollerContainer('y');
            this.calculateSizeScroller('y');
        }
        if (this.contentWrapperSize.x - this.display.x > 0) {
            if (!this.x_scroll_visible) {
                this.x_scroll_visible = true;
                this.calculatePositionScrollerContainer('x');
            }
            this.calculateSizeScroller('x');
        }
        else if (this.x_scroll_visible) {
            this.x_scroll_visible = false;
            this.calculatePositionScrollerContainer('x');
            this.calculateSizeScroller('x');
        }
    }
    createResizeObserver() {
        let inProgress = false;
        return new Aventus.ResizeObserver({
            callback: entries => {
                if (inProgress) {
                    return;
                }
                if (!this.allowResizeObserver)
                    return;
                inProgress = true;
                this.dimensionRefreshed();
                inProgress = false;
            },
            fps: 30
        });
    }
    addResizeObserver() {
        if (this.observer == undefined) {
            this.observer = this.createResizeObserver();
        }
        this.observer.observe(this.contentWrapper);
        this.observer.observe(this);
    }
    onScrollEvent(e) {
        this.calculatePosition();
        window.dispatchEvent(new CustomEvent("scroll"));
    }
    calculatePosition() {
        if (!this.hasAttribute('is-scrolling')) {
            this.setAttribute('is-scrolling', '');
        }
        const container = this.contentHidder;
        // Calcul de la position verticale
        if (this.y_scroll_visible) {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            // Ratio de déplacement (0 à 1)
            const scrollPercentY = scrollTop / (scrollHeight - clientHeight);
            // Taille disponible dans le conteneur de la scrollbar
            const trackHeight = this.verticalScrollerContainer.offsetHeight;
            const thumbHeight = this.verticalScroller.offsetHeight;
            const maxMoveY = trackHeight - thumbHeight;
            // Application de la transformation
            const translateY = scrollPercentY * maxMoveY;
            this.verticalScroller.style.transform = `translateY(${translateY}px)`;
            if (this.auto_hide) {
                this.verticalScrollerContainer.classList.remove("hide");
                clearTimeout(this.hideDelay['y']);
                this.hideDelay['y'] = setTimeout(() => {
                    this.verticalScrollerContainer.classList.add("hide");
                }, 1000);
            }
        }
        // Calcul de la position horizontale
        if (this.x_scroll_visible) {
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            const scrollPercentX = scrollLeft / (scrollWidth - clientWidth);
            const trackWidth = this.horizontalScrollerContainer.offsetWidth;
            const thumbWidth = this.horizontalScroller.offsetWidth;
            const maxMoveX = trackWidth - thumbWidth;
            const translateX = scrollPercentX * maxMoveX;
            this.horizontalScroller.style.transform = `translateX(${translateX}px)`;
            if (this.auto_hide) {
                this.horizontalScrollerContainer.classList.remove("hide");
                clearTimeout(this.hideDelay['x']);
                this.hideDelay['x'] = setTimeout(() => {
                    this.horizontalScrollerContainer.classList.add("hide");
                }, 1000);
            }
        }
        this.triggerScrollChange();
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            this.removeAttribute('is-scrolling');
        }, 150);
    }
    triggerScrollChange() {
        this.onScrollChange.trigger(this.x, this.y);
    }
    div(nb1, nb2) {
        if (!nb2)
            return nb1;
        return nb1 / nb2;
    }
    applyAutoHide() {
        if (this.auto_hide) {
            this.horizontalScrollerContainer.classList.remove("hide");
            clearTimeout(this.hideDelay['x']);
            this.hideDelay['x'] = setTimeout(() => {
                this.horizontalScrollerContainer.classList.add("hide");
            }, 1000);
            this.verticalScrollerContainer.classList.remove("hide");
            clearTimeout(this.hideDelay['y']);
            this.hideDelay['y'] = setTimeout(() => {
                this.verticalScrollerContainer.classList.add("hide");
            }, 1000);
        }
    }
    addScrollDrag(direction) {
        let scroller = this.scroller[direction]();
        let startScroll = 0;
        const drag = new Aventus.DragAndDrop({
            element: scroller,
            applyDrag: false,
            usePercent: true,
            offsetDrag: 0,
            isDragEnable: () => !this.disable,
            onStart: (e) => {
                this.no_user_select = true;
                scroller.classList.add("active");
                if (direction === 'y') {
                    startScroll = this.contentHidder.scrollTop;
                }
                else {
                    startScroll = this.contentHidder.scrollLeft;
                }
            },
            onMove: (e, position) => {
                const scrollDelta = (position[direction] / 100) * this.contentWrapperSize[direction];
                if (direction === 'y') {
                    this.contentHidder.scrollTop = startScroll + scrollDelta;
                }
                else {
                    this.contentHidder.scrollLeft = startScroll + scrollDelta;
                }
            },
            onStop: () => {
                this.no_user_select = false;
                scroller.classList.remove("active");
            }
        });
    }
    scrollX(x) {
        this.contentHidder.scrollLeft = x;
        this.calculatePositionScrollerContainer('x');
    }
    scrollY(y) {
        this.contentHidder.scrollTop = y;
        this.calculatePositionScrollerContainer('y');
    }
    addAction() {
        if (this.mouse_drag) {
            let startScrollX = 0;
            let startScrollY = 0;
            let posX = 0;
            let posY = 0;
            this.addEventListener("pointerdown", (e) => {
                if (!this.x_scroll_visible && !this.y_scroll_visible) {
                    return;
                }
                startScrollX = this.contentHidder.scrollLeft;
                startScrollY = this.contentHidder.scrollTop;
                posX = e.pageX;
                posY = e.pageY;
                this.no_user_select = true;
            });
            this.addEventListener("pointermove", (e) => {
                if (this.x_scroll_visible) {
                    this.contentHidder.scrollLeft = startScrollX + (posX - e.pageX);
                }
                if (this.y_scroll_visible) {
                    this.contentHidder.scrollTop = startScrollY + (posY - e.pageY);
                }
            });
            this.addEventListener("pointerup", (e) => {
                this.no_user_select = false;
            });
            this.addEventListener("pointercancel", (e) => {
                this.no_user_select = false;
            });
            // new PressManager({
            //     element: this,
            //     offsetDrag: 0,
            //     onDragStart: (e) => {
            //         if(!this.x_scroll_visible && !this.y_scroll_visible) {
            //             return false;
            //         }
            //         if(e.event instanceof PointerEvent) {
            //             startScrollX = this.contentHidder.scrollLeft;
            //             startScrollY = this.contentHidder.scrollTop;
            //             posX = e.event.pageX;
            //             posY = e.event.pageY;
            //             this.no_user_select = true;
            //             return true;
            //         }
            //         return false;
            //     },
            //     onDrag: (e) => {
            //         if(e.event instanceof PointerEvent) {
            //         }
            //     },
            //     onDragEnd: (e) => {
            //         this.no_user_select = false;
            //     }
            // });
        }
        this.addScrollDrag('x');
        this.addScrollDrag('y');
    }
    postCreation() {
        this.dimensionRefreshed();
        this.addResizeObserver();
        this.applyAutoHide();
        this.addAction();
    }
}
Components.Display.Scrollable.Namespace=`OneMoreUI.Components.Display`;
Components.Display.Scrollable.Tag=`om-scrollable`;
__as1(_.Components.Display, 'Scrollable', Components.Display.Scrollable);
if(!window.customElements.get('om-scrollable')){window.customElements.define('om-scrollable', Components.Display.Scrollable);Aventus.WebComponentInstance.registerDefinition(Components.Display.Scrollable);}

Libs.Style=class Style {
    static getVariable(prop, el) {
        const computed = getComputedStyle(el);
        let value = computed.getPropertyValue(prop.replace("--", "--_"));
        if (!value) {
            value = computed.getPropertyValue(prop);
        }
        return value;
    }
    static getVariables(props, el) {
        const computed = getComputedStyle(el);
        const result = [];
        for (let prop of props) {
            let value = computed.getPropertyValue(prop.replace("--", "--_"));
            if (!value) {
                value = computed.getPropertyValue(prop);
            }
            result.push(value);
        }
        return result;
    }
    static lockVariable(props, el) {
        if (typeof props == "string") {
            props = [props];
        }
        const values = this.getVariables(props, el);
        for (let i = 0; i < props.length; i++) {
            el.style.setProperty(props[i], values[i]);
        }
    }
}
Libs.Style.Namespace=`OneMoreUI.Libs`;
__as1(_.Libs, 'Style', Libs.Style);

Components.Form.Select.BaseOption = class BaseOption extends Aventus.WebComponent {
    get 'focused'() { return this.getBoolAttr('focused') }
    set 'focused'(val) { this.setBoolAttr('focused', val) }    value;
    select;
    static __style = `:host{border-radius:var(--radius-field);color:inherit;cursor:pointer;font-size:.875rem;padding-block:.375rem;padding-inline:.75rem;transition-duration:.2s;transition-property:color,background-color;transition-timing-function:cubic-bezier(0, 0, 0.2, 1);white-space:normal}@media(hover: hover)and (pointer: fine){:host(:hover){background-color:color-mix(in oklab, var(--_options-container-background), #000 7%)}}:host([focused]){background-color:color-mix(in oklab, var(--_options-container-background), #000 7%)}`;
    __getStatic() {
        return BaseOption;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(BaseOption.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "BaseOption";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('focused')) { this.attributeChangedCallback('focused', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('focused'); }
    __listBoolProps() { return ["focused"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    choose() {
        this.select.setValueFromOption(this);
        this.select.hideOptions();
    }
    init(select) {
        this.select = select;
    }
    filter(text) {
        if (this.innerText.toLowerCase().includes(text)) {
            this.style.display = "";
        }
        else {
            this.style.display = "none";
        }
    }
    postCreation() {
        this.addEventListener("click", () => {
            this.choose();
        });
    }
}
Components.Form.Select.BaseOption.Namespace=`OneMoreUI.Components.Form.Select`;
Components.Form.Select.BaseOption.Tag=`om-base-option`;
__as1(_.Components.Form.Select, 'BaseOption', Components.Form.Select.BaseOption);
if(!window.customElements.get('om-base-option')){window.customElements.define('om-base-option', Components.Form.Select.BaseOption);Aventus.WebComponentInstance.registerDefinition(Components.Form.Select.BaseOption);}

Components.Form.Select.Option = class Option extends Components.Form.Select.BaseOption {
    static get observedAttributes() {return ["value"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'value'() { return this.getStringProp('value') }
    set 'value'(val) { this.setStringAttr('value', val) }    static __style = ``;
    __getStatic() {
        return Option;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Option.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Option";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('value')){ this['value'] = undefined; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('value'); }
}
Components.Form.Select.Option.Namespace=`OneMoreUI.Components.Form.Select`;
Components.Form.Select.Option.Tag=`om-option`;
__as1(_.Components.Form.Select, 'Option', Components.Form.Select.Option);
if(!window.customElements.get('om-option')){window.customElements.define('om-option', Components.Form.Select.Option);Aventus.WebComponentInstance.registerDefinition(Components.Form.Select.Option);}

Components.Form.FormElement = class FormElement extends Aventus.Form.FormElement {
    static __style = `:host{--form-element-bg: var(--surface, white);--form-element-border-radius: var(--border-radius-lg, 0);--form-element-fg: var(--surface-content, oklch(21% 0.006 285.885));--form-element-border-color: var(--border-color, oklab(0.21 0.00164225 -0.00577088 / 0.1));--form-element-border: 1px solid var(--form-element-border-color)}`;
    constructor() {
        super();
        if (this.constructor == FormElement) {
            throw "can't instanciate an abstract class";
        }
    }
    __getStatic() {
        return FormElement;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(FormElement.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "FormElement";
    }
}
Components.Form.FormElement.Namespace=`OneMoreUI.Components.Form`;
__as1(_.Components.Form, 'FormElement', Components.Form.FormElement);

Components.Form.Select.BaseSelect.OptionsContainer = class OptionsContainer extends Aventus.WebComponent {
    get 'open'() { return this.getBoolAttr('open') }
    set 'open'(val) { this.setBoolAttr('open', val) }get 'transition'() { return this.getBoolAttr('transition') }
    set 'transition'(val) { this.setBoolAttr('transition', val) }    get 'allowResizeObserver'() {
						return this.__watch["allowResizeObserver"];
					}
					set 'allowResizeObserver'(val) {
						this.__watch["allowResizeObserver"] = val;
					}    select;
    onOpen = new Aventus.Callback();
    isAnimating = false;
    firstOpen = true;
    __registerWatchesActions() {
    this.__addWatchesActions("allowResizeObserver");    super.__registerWatchesActions();
}
    static __style = `:host{--_options-container-background: var(--options-container-background, var(--form-element-background, var(--surface)));--_options-container-border-radius: var(--options-container-border-radius, var(--form-element-border-radius, var(--border-radius-lg)))}:host{background-color:var(--_options-container-background);border:1px solid var(--border-color);border-radius:var(--_options-container-border-radius);color:var(--surface-content);display:grid;grid-template-rows:0fr;left:0;max-height:min(24rem,70dvh);outline:none;overflow:hidden;padding:.5rem;position:absolute;top:0;z-index:800}:host .wrapper{display:flex;flex-direction:column;height:100%;overflow:hidden}:host .wrapper om-scrollable .container{display:flex;flex-direction:column}:host([open]){grid-template-rows:1fr}:host([transition]){transition:.2s grid-template-rows var(--bezier-curve)}`;
    constructor() {
        super();
        this.arrowDownPressed = this.arrowDownPressed.bind(this);
        this.arrowUpPressed = this.arrowUpPressed.bind(this);
        this.enterPressed = this.enterPressed.bind(this);
    }
    __getStatic() {
        return OptionsContainer;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(OptionsContainer.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<div class="wrapper">    <om-scrollable floating_scroll flex _id="optionscontainer_0">        <div class="container">            <slot></slot>        </div>    </om-scrollable></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "injection": [
    {
      "id": "optionscontainer_0",
      "injectionName": "allowResizeObserver",
      "inject": (c) => c.comp.__b5e6e3ebcc65486c3df738dc2ab65ba2method0(),
      "once": true
    }
  ]
}); }
    getClassName() {
        return "OptionsContainer";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('open')) { this.attributeChangedCallback('open', false, false); }if(!this.hasAttribute('transition')) { this.attributeChangedCallback('transition', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["allowResizeObserver"] = true; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('open');this.__upgradeProperty('transition');this.__correctGetter('allowResizeObserver'); }
    __listBoolProps() { return ["open","transition"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    init(select) {
        this.select = select;
    }
    async show(container) {
        if (!container) {
            container = document.body;
        }
        // reset focused
        if (this.firstOpen) {
            this.lockVariable("--options-container-background");
        }
        let box = this.select.getBoundingClientRect();
        let contBox = container.getBoundingClientRect();
        let newTop = box.top + box.height + 2;
        let maxHeight = contBox.height - newTop - 10;
        if (maxHeight > 250) {
            this.style.top = newTop + 'px';
            this.style.bottom = 'auto';
        }
        else {
            let inputBox = this.select.inputEl.getBoundingClientRect();
            let newBottom = (contBox.bottom - box.bottom) + inputBox.height + 2;
            maxHeight = contBox.height - newBottom - 10;
            this.style.bottom = newBottom + 'px';
            this.style.top = 'auto';
        }
        this.style.left = box.left + 'px';
        this.style.maxHeight = maxHeight + 'px';
        this.style.width = box.width + 'px';
        container.appendChild(this);
        if (this.transition)
            await Aventus.sleep(10);
        this.open = true;
        this.onOpen.trigger(true);
        this.bindKeyboard();
    }
    hide() {
        this.open = false;
        this.onOpen.trigger(false);
        this.unbindKeyboard();
        if (!this.transition) {
            this.parentElement?.removeChild(this);
        }
    }
    addAnimationEnd() {
        this.addEventListener("transitionstart", (event) => {
            this.isAnimating = true;
            this.allowResizeObserver = false;
        });
        this.addEventListener("transitionend", (event) => {
            this.isAnimating = false;
            this.allowResizeObserver = true;
            if (!this.open) {
                this.parentElement?.removeChild(this);
                //this.select.inputEl.focus();
            }
        });
    }
    lockVariable(prop) {
        this.style.setProperty(prop, Libs.Style.getVariable(prop, this));
    }
    arrowDownPressed() {
        let children = Array.from(this.children).filter(p => p instanceof _.Components.Form.Select.BaseOption);
        if (children.length == 1) {
            children[0].focused = true;
            return;
        }
        let index = children.findIndex(p => p.focused);
        if (index != -1) {
            children[index].focused = false;
        }
        index++;
        if (index == children.length) {
            index = 0;
        }
        children[index].focused = true;
    }
    arrowUpPressed() {
        let children = Array.from(this.children).filter(p => p instanceof _.Components.Form.Select.BaseOption).filter(p => p.style.display != 'none');
        if (children.length == 1) {
            children[0].focused = true;
            return;
        }
        let index = children.findIndex(p => p.focused);
        if (index != -1) {
            children[index].focused = false;
        }
        index--;
        if (index <= -1) {
            index = children.length - 1;
        }
        children[index].focused = true;
    }
    enterPressed() {
        let children = Array.from(this.children).filter(p => p instanceof _.Components.Form.Select.BaseOption).filter(p => p.style.display != 'none');
        let index = children.findIndex(p => p.focused);
        if (index != -1) {
            children[index].choose();
        }
    }
    bindKeyboard() {
        Aventus.Lib.ShortcutManager.subscribe(Aventus.Lib.SpecialTouch.ArrowDown, this.arrowDownPressed, { replaceTemp: true });
        Aventus.Lib.ShortcutManager.subscribe(Aventus.Lib.SpecialTouch.ArrowUp, this.arrowUpPressed, { replaceTemp: true });
        Aventus.Lib.ShortcutManager.subscribe(Aventus.Lib.SpecialTouch.Enter, this.enterPressed, { replaceTemp: true });
    }
    unbindKeyboard() {
        Aventus.Lib.ShortcutManager.unsubscribe(Aventus.Lib.SpecialTouch.ArrowDown, this.arrowDownPressed);
        Aventus.Lib.ShortcutManager.unsubscribe(Aventus.Lib.SpecialTouch.ArrowUp, this.arrowUpPressed);
        Aventus.Lib.ShortcutManager.unsubscribe(Aventus.Lib.SpecialTouch.Enter, this.enterPressed);
    }
    postCreation() {
        this.addAnimationEnd();
        this.setAttribute("tabindex", "-1");
    }
    __b5e6e3ebcc65486c3df738dc2ab65ba2method0() {
        return this.allowResizeObserver;
    }
}
Components.Form.Select.BaseSelect.OptionsContainer.Namespace=`OneMoreUI.Components.Form.Select.BaseSelect`;
Components.Form.Select.BaseSelect.OptionsContainer.Tag=`om-options-container`;
__as1(_.Components.Form.Select.BaseSelect, 'OptionsContainer', Components.Form.Select.BaseSelect.OptionsContainer);
if(!window.customElements.get('om-options-container')){window.customElements.define('om-options-container', Components.Form.Select.BaseSelect.OptionsContainer);Aventus.WebComponentInstance.registerDefinition(Components.Form.Select.BaseSelect.OptionsContainer);}

_n = Components.Form.Select.BaseSelect;Components.Form.Select.BaseSelect = class BaseSelect extends Components.Form.FormElement {
    static get observedAttributes() {return ["label", "placeholder", "icon", "searchable", "transition"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'open'() { return this.getBoolAttr('open') }
    set 'open'(val) { this.setBoolAttr('open', val) }get 'is_focus'() { return this.getBoolAttr('is_focus') }
    set 'is_focus'(val) { this.setBoolAttr('is_focus', val) }    get 'label'() { return this.getStringProp('label') }
    set 'label'(val) { this.setStringAttr('label', val) }get 'placeholder'() { return this.getStringProp('placeholder') }
    set 'placeholder'(val) { this.setStringAttr('placeholder', val) }get 'icon'() { return this.getStringProp('icon') }
    set 'icon'(val) { this.setStringAttr('icon', val) }get 'searchable'() { return this.getBoolProp('searchable') }
    set 'searchable'(val) { this.setBoolAttr('searchable', val) }get 'transition'() { return this.getBoolProp('transition') }
    set 'transition'(val) { this.setBoolAttr('transition', val) }    get 'displayValue'() {
						return this.__watch["displayValue"];
					}
					set 'displayValue'(val) {
						this.__watch["displayValue"] = val;
					}get 'value'() {
						return this.__watch["value"];
					}
					set 'value'(val) {
						this.__watch["value"] = val;
					}    selectedOption;
    options = [];
    optionsInited = false;
    blurTimeout = 0;
    isFirstLoad = true;
    __registerWatchesActions() {
    this.__addWatchesActions("displayValue", ((target, action, path, value) => {
    target._inputEl.value = target.displayValue;
}));this.__addWatchesActions("value", ((target) => {
    target.onInternalValueChanged();
}));    super.__registerWatchesActions();
}
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("searchable", ((target) => {
    if (target.searchable)
        target._inputEl.removeAttribute("readonly");
    else
        target._inputEl.setAttribute("readonly", "");
})); }
    static __style = `:host{--_select-bg: var(--select-bg, var(--form-element-bg));--_select-fg: var(--select-fg, var(--form-element-fg));--_select-border: var(--select-border, var(--form-element-border));--_select-border-radius: var(--select-border-radius, var(--form-element-border-radius))}:host{width:100%}:host label{display:none;font-size:var(--font-size-sm);font-weight:500;line-height:var(--line-height-sm)}:host .input{align-items:center;background-color:var(--_select-bg);border-radius:var(--_select-border-radius);display:flex;gap:.5rem;margin-top:0;outline:none;overflow:hidden;padding:.5rem 1rem;position:relative;width:100%}:host .input .icon{color:color-mix(in oklab, var(--_select-fg) 40%, transparent);display:none;font-size:var(--font-size)}:host .input .caret{--img-stroke-width: 0;align-items:center;aspect-ratio:1;display:flex;fill:var(--_select-fg);flex-grow:0;flex-shrink:0;height:var(--font-size);justify-content:center;transform:rotate(-90deg)}:host .input .caret svg{height:100%}:host .input input{background-color:rgba(0,0,0,0);border:none;color:var(--_select-fg);display:block;flex-grow:1;font-size:var(--font-size);height:var(--line-height);margin:0;min-width:0;outline:none;padding-right:10px;pointer-events:none;user-select:none}:host .input input::placeholder{color:color-mix(in oklab, var(--_select-fg) 40%, transparent)}:host .input::after{border:var(--_select-border);border-radius:var(--_select-border-radius);content:"";display:block;inset:0px;pointer-events:none;position:absolute}:host .errors{color:var(--error);display:none;flex-direction:column;font-size:var(--font-size-sm);gap:.25rem;line-height:var(--line-height-sm);margin:.5rem;margin-bottom:0}:host .hidden{display:none}:host .options-container{display:none}:host([is_focus]) .input{border-color:var(--primary)}:host([is_focus]) .input::after{border-color:var(--primary);border-width:2px}:host([has_errors]) .input::after{border-color:var(--error)}:host([has_errors]) .errors{display:flex}:host([icon]:not([icon=""])) .input .icon{display:block}:host([label]:not([label=""])) label{display:flex}:host([label]:not([label=""])) .input{margin-top:.5rem}:host([readonly]){pointer-events:none}:host([disabled]){pointer-events:none}:host([disabled]) label{color:color-mix(in oklab, var(--_select-fg) 50%, var(--_select-bg))}:host([disabled]) .input{background-color:color-mix(in oklab, var(--_select-fg) 10%, transparent)}:host([disabled]) .input input{color:color-mix(in oklab, var(--_select-fg) 50%, var(--_select-bg))}:host([disabled]) .input::after{border:none}:host([open]) .input .caret{transform:rotate(-270deg)}:host([searchable]) .input input{pointer-events:all;user-select:all}:host([transition]) .input .caret{transition:transform .2s var(--bezier-curve)}`;
    constructor() {
        super();
        if (this.constructor == BaseSelect) {
            throw "can't instanciate an abstract class";
        }
        this.loadElementsFromSlot = this.loadElementsFromSlot.bind(this);
        this.showOptions = this.showOptions.bind(this);
        this.hideOptions = this.hideOptions.bind(this);
    }
    __getStatic() {
        return BaseSelect;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(BaseSelect.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        slots: { 'prepend':`<slot name="prepend">        <mi-icon class="icon" _id="baseselect_2"></mi-icon>    </slot>`,'append':`<slot name="append"></slot>`,'default':`<slot></slot>` }, 
        blocks: { 'default':`<label for="input" _id="baseselect_0"></label><div class="input" _id="baseselect_1">    <slot name="prepend">        <mi-icon class="icon" _id="baseselect_2"></mi-icon>    </slot>    <input id="input" autocomplete="off" _id="baseselect_3" />    <slot name="append"></slot>    <div class="caret">        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512">            <path d="M192 448c-8.188 0-16.38-3.125-22.62-9.375l-160-160c-12.5-12.5-12.5-32.75 0-45.25l160-160c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l137.4 137.4c12.5 12.5 12.5 32.75 0 45.25C208.4 444.9 200.2 448 192 448z"></path>        </svg>    </div></div><div class="errors">    <template _id="baseselect_4"></template></div><div class="hidden">    <slot></slot></div><om-options-container class="options-container" _id="baseselect_6"></om-options-container>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "inputEl",
      "ids": [
        "baseselect_1"
      ]
    },
    {
      "name": "_inputEl",
      "ids": [
        "baseselect_3"
      ]
    },
    {
      "name": "optionsContainer",
      "ids": [
        "baseselect_6"
      ]
    }
  ],
  "content": {
    "baseselect_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__6a2f0a13ce924d939c86d28d2861a8edmethod1())}`,
      "once": true
    },
    "baseselect_1°tabindex": {
      "fct": (c) => `${c.print(c.comp.__6a2f0a13ce924d939c86d28d2861a8edmethod2())}`
    },
    "baseselect_2°src": {
      "fct": (c) => `${c.print(c.comp.__6a2f0a13ce924d939c86d28d2861a8edmethod3())}`,
      "once": true
    },
    "baseselect_3°placeholder": {
      "fct": (c) => `${c.print(c.comp.__6a2f0a13ce924d939c86d28d2861a8edmethod4())}`,
      "once": true
    },
    "baseselect_6°transition": {
      "fct": (c) => `${c.print(c.comp.__6a2f0a13ce924d939c86d28d2861a8edmethod6())}`,
      "once": true
    }
  },
  "events": [
    {
      "eventName": "click",
      "id": "baseselect_0",
      "fct": (e, c) => c.comp.showOptions(e)
    },
    {
      "eventName": "click",
      "id": "baseselect_1",
      "fct": (e, c) => c.comp.showOptions(e)
    },
    {
      "eventName": "focus",
      "id": "baseselect_1",
      "fct": (e, c) => c.comp.onFocus(e)
    },
    {
      "eventName": "blur",
      "id": "baseselect_1",
      "fct": (e, c) => c.comp.onBlur(e)
    },
    {
      "eventName": "input",
      "id": "baseselect_3",
      "fct": (e, c) => c.comp.filter(e)
    },
    {
      "eventName": "focus",
      "id": "baseselect_3",
      "fct": (e, c) => c.comp.onFocus(e)
    },
    {
      "eventName": "blur",
      "id": "baseselect_3",
      "fct": (e, c) => c.comp.onBlur(e)
    },
    {
      "eventName": "onOpen",
      "id": "baseselect_6",
      "fct": (c, ...args) => c.comp.syncCaret.apply(c.comp, ...args),
      "isCallback": true
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`         <div _id="baseselect_5"></div>    `);templ0.setActions({
  "content": {
    "baseselect_5°@HTML": {
      "fct": (c) => `${c.print(c.comp.__6a2f0a13ce924d939c86d28d2861a8edmethod5(c.data.error))}`,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'baseselect_4',
                    template: templ0,
                simple:{data: "this.errors",item:"error"}}); }
    getClassName() {
        return "BaseSelect";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('open')) { this.attributeChangedCallback('open', false, false); }if(!this.hasAttribute('is_focus')) { this.attributeChangedCallback('is_focus', false, false); }if(!this.hasAttribute('label')){ this['label'] = undefined; }if(!this.hasAttribute('placeholder')){ this['placeholder'] = undefined; }if(!this.hasAttribute('icon')){ this['icon'] = undefined; }if(!this.hasAttribute('searchable')) { this.attributeChangedCallback('searchable', false, false); }if(!this.hasAttribute('transition')) { this.attributeChangedCallback('transition', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["displayValue"] = "";w["value"] = undefined; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('open');this.__upgradeProperty('is_focus');this.__upgradeProperty('label');this.__upgradeProperty('placeholder');this.__upgradeProperty('icon');this.__upgradeProperty('searchable');this.__upgradeProperty('transition');this.__correctGetter('displayValue');this.__correctGetter('value'); }
    __listBoolProps() { return ["open","is_focus","searchable","transition"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    compare(item1, item2) {
        return item1 == item2;
    }
    onInternalValueChanged() {
        if (!this.optionsInited)
            return;
        let found = false;
        for (let option of this.options) {
            if (this.compare(option.value, this.value)) {
                found = true;
                this.selectedOption = option;
                this.displayValue = this.itemToText(option);
                this.filter();
                break;
            }
        }
        if (!found) {
            this.selectedOption = undefined;
            this.filter();
        }
    }
    setValueFromOption(option) {
        this.triggerChange(option.value);
        this.selectedOption = option;
        this.displayValue = this.itemToText(option);
        this.blurOptions();
        this.filter();
    }
    removeErrors() {
        this.errors = [];
    }
    loadElementsFromSlot() {
        let elements = this.getElementsInSlot();
        for (let element of elements) {
            if (element instanceof _.Components.Form.Select.BaseOption) {
                this.options.push(element);
                element.init(this);
                if (element.value == this.value) {
                }
                this.optionsContainer.appendChild(element);
            }
        }
        if (this.isFirstLoad) {
            this.optionsInited = true;
            this.isFirstLoad = false;
            const slots = this.shadowRoot.querySelectorAll("slot");
            for (let slot of slots) {
                const name = slot.getAttribute("name");
                if (!name || name == "default") {
                    slot.addEventListener("slotchange", this.loadElementsFromSlot);
                    break;
                }
            }
        }
        this.onInternalValueChanged();
    }
    setOptions(options) {
        this.options = options;
        for (let option of options) {
            option.init(this);
            this.optionsContainer.appendChild(option);
        }
        this.onInternalValueChanged();
    }
    async showOptions() {
        clearTimeout(this.blurTimeout);
        if (this.open) {
            this.hideOptions();
            return;
        }
        if (!this.open) {
            this.open = true;
            this.removeErrors();
            if (this.searchable) {
                this._inputEl.focus();
            }
            await this.optionsContainer.show();
        }
        if (!this.searchable) {
            if (!this.transition) {
                this.optionsContainer.focus({ preventScroll: true });
            }
            else {
                setTimeout(() => {
                    this.optionsContainer.focus({ preventScroll: true });
                }, 100);
            }
        }
    }
    hideOptions() {
        this.optionsContainer.hide();
    }
    blurOptions() {
        setTimeout(() => {
            this.optionsContainer.blur();
        }, 50);
    }
    syncCaret(open) {
        this.open = open;
    }
    filter() {
        if (this.searchable) {
            let value = this._inputEl.value.toLowerCase();
            for (let option of this.options) {
                option.filter(value);
            }
        }
    }
    manageFocus() {
        this.inputEl.addEventListener("focus", () => {
            clearTimeout(this.blurTimeout);
        });
        let blur = () => {
            clearTimeout(this.blurTimeout);
            this.blurTimeout = setTimeout(() => {
                this.is_focus = false;
                this.optionsContainer.hide();
            }, 50);
        };
        this.inputEl.addEventListener("blur", () => {
            blur();
        });
        this._inputEl.addEventListener("blur", () => {
            blur();
        });
        this.optionsContainer.addEventListener("blur", () => {
            blur();
        });
        this.optionsContainer.addEventListener("focus", () => {
            clearTimeout(this.blurTimeout);
        });
    }
    onFocus() {
        clearTimeout(this.blurTimeout);
        this.is_focus = true;
        this.errors = [];
        if (!this.searchable) {
            Aventus.Lib.ShortcutManager.subscribe(" ", this.showOptions, { replaceTemp: true });
        }
        else {
            this._inputEl.select();
        }
        Aventus.Lib.ShortcutManager.subscribe(Aventus.Lib.SpecialTouch.Enter, this.showOptions, { replaceTemp: true });
    }
    onBlur() {
        if (!this.searchable) {
            Aventus.Lib.ShortcutManager.unsubscribe(" ", this.showOptions);
        }
        Aventus.Lib.ShortcutManager.unsubscribe(Aventus.Lib.SpecialTouch.Enter, this.showOptions);
    }
    postDestruction() {
        super.postDestruction();
        this.optionsContainer.remove();
        window.removeEventListener("scroll", this.hideOptions);
    }
    postCreation() {
        super.postCreation();
        this.manageFocus();
        this.optionsContainer.init(this);
        this.loadElementsFromSlot();
        this.shadowRoot.removeChild(this.optionsContainer);
        window.addEventListener("scroll", this.hideOptions);
    }
    __6a2f0a13ce924d939c86d28d2861a8edmethod1() {
        return this.label;
    }
    __6a2f0a13ce924d939c86d28d2861a8edmethod2() {
        return this.searchable ? -1 : 0;
    }
    __6a2f0a13ce924d939c86d28d2861a8edmethod3() {
        return this.icon;
    }
    __6a2f0a13ce924d939c86d28d2861a8edmethod4() {
        return this.placeholder;
    }
    __6a2f0a13ce924d939c86d28d2861a8edmethod5(error) {
        return error;
    }
    __6a2f0a13ce924d939c86d28d2861a8edmethod6() {
        return this.transition;
    }
}
Components.Form.Select.BaseSelect.Namespace=`OneMoreUI.Components.Form.Select`;
__as1(_.Components.Form.Select, 'BaseSelect', Components.Form.Select.BaseSelect);
Object.assign(Components.Form.Select.BaseSelect, _n);
Components.Form.Select.Select = class Select extends Components.Form.Select.BaseSelect {
    static get observedAttributes() {return ["value"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'value'() { return this.getStringProp('value') }
    set 'value'(val) { this.setStringAttr('value', val) }    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("value", ((target) => {
    target.onInternalValueChanged();
})); }
    static __style = ``;
    __getStatic() {
        return Select;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Select.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Select";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('value')){ this['value'] = ""; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('value'); }
    itemToText(option) {
        // if(option.value !== undefined) {
        //     return option.value
        // }
        return option.innerHTML.replace(/&nbsp;/g, " ");
    }
}
Components.Form.Select.Select.Namespace=`OneMoreUI.Components.Form.Select`;
Components.Form.Select.Select.Tag=`om-select`;
__as1(_.Components.Form.Select, 'Select', Components.Form.Select.Select);
if(!window.customElements.get('om-select')){window.customElements.define('om-select', Components.Form.Select.Select);Aventus.WebComponentInstance.registerDefinition(Components.Form.Select.Select);}

Components.Form.Button = class Button extends Aventus.Form.ButtonElement {
    static get observedAttributes() {return ["icon", "icon_right"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'color'() { return this.getStringAttr('color') }
    set 'color'(val) { this.setStringAttr('color', val) }get 'outline'() { return this.getBoolAttr('outline') }
    set 'outline'(val) { this.setBoolAttr('outline', val) }get 'disabled'() { return this.getBoolAttr('disabled') }
    set 'disabled'(val) { this.setBoolAttr('disabled', val) }get 'loading'() { return this.getBoolAttr('loading') }
    set 'loading'(val) { this.setBoolAttr('loading', val) }get 'ghost'() { return this.getBoolAttr('ghost') }
    set 'ghost'(val) { this.setBoolAttr('ghost', val) }    get 'icon'() { return this.getStringProp('icon') }
    set 'icon'(val) { this.setStringAttr('icon', val) }get 'icon_right'() { return this.getBoolProp('icon_right') }
    set 'icon_right'(val) { this.setBoolAttr('icon_right', val) }    static __style = `:host{--_button-bg: var(--button-bg, var(--primary-600));--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--primary-content));--_button-radius: var(--button-radius, var(--border-radius-lg));--_button-icon-font-size: var(--button-icon-font-size, var(--font-size-lg))}:host([outline]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, var(--surface-content));--_button-fg: var(--button-fg, var(--surface-content))}:host([ghost]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--surface-content))}:host([color=primary]){--_button-bg: var(--button-bg, var(--primary-600));--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--primary-content))}:host([outline][color=primary]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, var(--primary));--_button-fg: var(--button-fg, var(--surface-content))}:host([ghost][color=primary]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--primary))}:host([color=accent]){--_button-bg: var(--button-bg, var(--accent-600));--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--accent-content))}:host([outline][color=accent]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, var(--accent));--_button-fg: var(--button-fg, var(--surface-content))}:host([ghost][color=accent]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--accent))}:host([color=neutral]){--_button-bg: var(--button-bg, var(--neutral-600));--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--neutral-content))}:host([outline][color=neutral]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, var(--neutral));--_button-fg: var(--button-fg, var(--surface-content))}:host([ghost][color=neutral]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--neutral))}:host([color=info]){--_button-bg: var(--button-bg, var(--info-600));--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--info-content))}:host([outline][color=info]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, var(--info));--_button-fg: var(--button-fg, var(--surface-content))}:host([ghost][color=info]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--info))}:host([color=success]){--_button-bg: var(--button-bg, var(--success-600));--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--success-content))}:host([outline][color=success]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, var(--success));--_button-fg: var(--button-fg, var(--surface-content))}:host([ghost][color=success]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--success))}:host([color=warning]){--_button-bg: var(--button-bg, var(--warning-600));--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--warning-content))}:host([outline][color=warning]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, var(--warning));--_button-fg: var(--button-fg, var(--surface-content))}:host([ghost][color=warning]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--warning))}:host([color=error]){--_button-bg: var(--button-bg, var(--error-600));--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--error-content))}:host([outline][color=error]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, var(--error));--_button-fg: var(--button-fg, var(--surface-content))}:host([ghost][color=error]){--_button-bg: var(--button-bg, transparent);--_button-border: var(--button-border, transparent);--_button-fg: var(--button-fg, var(--error))}:host([disabled]){--_button-bg: color-mix(in oklab, var(--surface-content) 10%, transparent);--_button-fg: color-mix(in oklab, var(--surface-content) 50%, var(--surface));pointer-events:none}:host{align-items:center;background-color:var(--_button-bg);border-radius:var(--_button-radius);color:var(--_button-fg);cursor:pointer;display:flex;font-weight:500;gap:.5rem;line-height:var(--line-height);padding:.5rem 1rem;position:relative;user-select:none;width:fit-content}:host mi-icon{font-size:var(--_button-icon-font-size);font-weight:normal}:host .loader-mask{align-items:center;align-items:stretch;display:none;inset:.6rem;justify-content:center;position:absolute}:host .loader-mask .loader{animation:rotation 1s linear infinite;aspect-ratio:1;border:2px solid var(--_button-fg);border-bottom-color:rgba(0,0,0,0);border-radius:50000px;display:block;height:100%;max-height:100%;max-width:100%}:host .border{border:1px solid var(--_button-border);border-radius:var(--_button-radius);display:none;inset:0;pointer-events:none;position:absolute}:host([outline]) .border{display:block}:host(:not([icon])) mi-icon,:host([icon=""]) mi-icon{display:none}:host([round]){border-radius:var(--border-radius-round)}:host(:empty[icon]:not([icon=""])){align-items:center;justify-content:center;padding:.5rem}:host([loading]) slot{opacity:0;visibility:hidden}:host([loading]) mi-icon{opacity:0;visibility:hidden}:host([loading]) .loader-mask{display:flex}@media(hover: hover)and (pointer: fine){:host(:not([loading]):hover){background-color:color-mix(in oklab, var(--_button-bg), #000 7%)}}@keyframes rotation{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;
    __getStatic() {
        return Button;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Button.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<template _id="button_0"></template><slot></slot><template _id="button_2"></template><div class="loader-mask">    <div class="loader"></div></div><div class="border"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`    <mi-icon _id="button_1"></mi-icon>`);templ0.setActions({
  "content": {
    "button_1°icon": {
      "fct": (c) => `${c.print(c.comp.__4b84b84f9c7940ff70213fba40df60cemethod2())}`,
      "once": true
    }
  }
});this.__getStatic().__template.addIf({
                    anchorId: 'button_0',
                    parts: [{once: true,
                    condition: (c) => c.comp.__4b84b84f9c7940ff70213fba40df60cemethod0(),
                    template: templ0
                }]
            });const templ1 = new Aventus.Template(this);templ1.setTemplate(`    <mi-icon _id="button_3"></mi-icon>`);templ1.setActions({
  "content": {
    "button_3°icon": {
      "fct": (c) => `${c.print(c.comp.__4b84b84f9c7940ff70213fba40df60cemethod2())}`,
      "once": true
    }
  }
});this.__getStatic().__template.addIf({
                    anchorId: 'button_2',
                    parts: [{once: true,
                    condition: (c) => c.comp.__4b84b84f9c7940ff70213fba40df60cemethod1(),
                    template: templ1
                }]
            }); }
    getClassName() {
        return "Button";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('color')){ this['color'] = undefined; }if(!this.hasAttribute('outline')) { this.attributeChangedCallback('outline', false, false); }if(!this.hasAttribute('disabled')) { this.attributeChangedCallback('disabled', false, false); }if(!this.hasAttribute('loading')) { this.attributeChangedCallback('loading', false, false); }if(!this.hasAttribute('ghost')) { this.attributeChangedCallback('ghost', false, false); }if(!this.hasAttribute('icon')){ this['icon'] = undefined; }if(!this.hasAttribute('icon_right')) { this.attributeChangedCallback('icon_right', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('color');this.__upgradeProperty('outline');this.__upgradeProperty('disabled');this.__upgradeProperty('loading');this.__upgradeProperty('ghost');this.__upgradeProperty('icon');this.__upgradeProperty('icon_right'); }
    __listBoolProps() { return ["outline","disabled","loading","ghost","icon_right"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    registerSubmit() {
        this.handler = this.findParentByType(Aventus.Form.Form.formElements)?.registerSubmit(this);
        if (this.type == "submit") {
            this.addEventListener("click", () => {
                this.triggerSubmit();
            });
            this.addEventListener("keyup", (e) => {
                if (e.key == 'Enter') {
                    this.triggerSubmit();
                }
            });
        }
    }
    __4b84b84f9c7940ff70213fba40df60cemethod2() {
        return this.icon;
    }
    __4b84b84f9c7940ff70213fba40df60cemethod0() {
        return !this.icon_right;
    }
    __4b84b84f9c7940ff70213fba40df60cemethod1() {
        return this.icon_right;
    }
}
Components.Form.Button.Namespace=`OneMoreUI.Components.Form`;
Components.Form.Button.Tag=`om-button`;
__as1(_.Components.Form, 'Button', Components.Form.Button);
if(!window.customElements.get('om-button')){window.customElements.define('om-button', Components.Form.Button);Aventus.WebComponentInstance.registerDefinition(Components.Form.Button);}


for(let key in _) { OneMoreUI[key] = _[key] }
})(OneMoreUI);

var migration;
(migration||(migration = {}));
(function (migration) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `migration`;
const _ = {};


let _n;
const BaseContent = class BaseContent extends Aventus.WebComponent {
    static __style = `:host{width:100%}:host .section-header{margin-bottom:2rem}:host .section-header h2{font-size:1.75rem;font-weight:600;letter-spacing:-0.02em;margin:0;margin-bottom:.5rem}:host .section-header p{color:var(--neutral);margin:0;max-width:800px}:host .card-header{align-items:center;display:flex;justify-content:space-between}:host .card-header h3{font-size:1.15rem;font-weight:600;margin:0}:host .action-footer{border-top:1px solid var(--border-color);display:flex;gap:1rem;justify-content:flex-end;margin-top:2rem;padding-top:1.5rem}`;
    __getStatic() {
        return BaseContent;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(BaseContent.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "BaseContent";
    }
}
BaseContent.Namespace=`migration`;
BaseContent.Tag=`av-base-content`;
__as1(_, 'BaseContent', BaseContent);
if(!window.customElements.get('av-base-content')){window.customElements.define('av-base-content', BaseContent);Aventus.WebComponentInstance.registerDefinition(BaseContent);}

const RenamedField = class RenamedField extends Aventus.WebComponent {
    get 'mappingFieldTable'() {
						return this.__watch["mappingFieldTable"];
					}
					set 'mappingFieldTable'(val) {
						this.__watch["mappingFieldTable"] = val;
					}    get tableComparisons() {
        return MainState.instance.comparison.tableComparisons;
    }
    get mappingFieldTableInfo() {
        const el = this.tableComparisons.find(p => p.newTableName == this.mappingFieldTable);
        if (!el)
            return {
                addedFields: [],
                deletedFields: [],
                hasChanges: false,
                isRename: false,
                modifiedFields: [],
                newTableName: '',
                oldTableName: '',
                renamedFields: []
            };
        return el;
    }
    get fieldsMapping() {
        return MainState.instance.mappings.fields[this.mappingFieldTable];
    }
    __registerWatchesActions() {
    this.__addWatchesActions("mappingFieldTable");    super.__registerWatchesActions();
}
    static __style = ``;
    __getStatic() {
        return RenamedField;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(RenamedField.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<h4>Champs Renommés</h4><p class="card-desc">Sélectionnez une table pour associer ses anciens champs supprimés à ses nouveaux    champs ajoutés.</p><div class="table-selector-wrapper">    <label>Table :</label>    <om-select _id="renamedfield_0">        <om-option value="">-- Choisir une table --</om-option>        <template _id="renamedfield_1"></template>    </om-select></div><div class="mapping-list">    <template _id="renamedfield_3"></template></div><template _id="renamedfield_8"></template>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "bindings": [
    {
      "id": "renamedfield_0",
      "injectionName": "value",
      "eventNames": [
        "onChange"
      ],
      "inject": (c) => c.comp.__6a9803ce37a6658d333e838def2ebba3method7(),
      "extract": (c, v) => c.comp.__6a9803ce37a6658d333e838def2ebba3method8(v),
      "once": true,
      "isCallback": true
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`            <om-option _id="renamedfield_2"></om-option>        `);templ0.setActions({
  "content": {
    "renamedfield_2°value": {
      "fct": (c) => `${c.print(c.comp.__6a9803ce37a6658d333e838def2ebba3method9(c.data.table))}`,
      "once": true
    },
    "renamedfield_2°@HTML": {
      "fct": (c) => `${c.print(c.comp.__6a9803ce37a6658d333e838def2ebba3method10(c.data.table))}`
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'renamedfield_1',
                    template: templ0,
                simple:{data: "this.tableComparisons",item:"table"}});const templ1 = new Aventus.Template(this);templ1.setTemplate(`        <p>Sélectionnez une table ci-dessus.</p>    `);const templ2 = new Aventus.Template(this);templ2.setTemplate(`        <p>Aucune association pour cette table.</p>    `);const templ3 = new Aventus.Template(this);templ3.setTemplate(`        <template _id="renamedfield_4"></template>    `);const templ4 = new Aventus.Template(this);templ4.setTemplate(`            <div class="mapping-item">                <span class="mapping-names">                    <span _id="renamedfield_5"></span>                    <span class="mapping-arrow">➔</span>                    <span _id="renamedfield_6"></span>                </span>                <button class="mapping-delete" _id="renamedfield_7">✕</button>            </div>        `);templ4.setActions({
  "content": {
    "renamedfield_5°@HTML": {
      "fct": (c) => `${c.print(c.comp.__6a9803ce37a6658d333e838def2ebba3method11(c.data.oldF))}`,
      "once": true
    },
    "renamedfield_6°@HTML": {
      "fct": (c) => `${c.print(c.comp.__6a9803ce37a6658d333e838def2ebba3method12(c.data.oldF))}`
    },
    "renamedfield_7°data-field": {
      "fct": (c) => `${c.print(c.comp.__6a9803ce37a6658d333e838def2ebba3method11(c.data.oldF))}`,
      "once": true
    }
  },
  "events": [
    {
      "eventName": "click",
      "id": "renamedfield_7",
      "fct": (e, c) => c.comp.removeFieldMapping(e)
    }
  ]
});templ3.addLoop({
                    anchorId: 'renamedfield_4',
                    template: templ4,
                simple:{data: "this.fieldsMapping",index:"oldF"}});this.__getStatic().__template.addIf({
                    anchorId: 'renamedfield_3',
                    parts: [{once: true,
                    condition: (c) => c.comp.__6a9803ce37a6658d333e838def2ebba3method1(),
                    template: templ1
                },{once: true,
                    condition: (c) => c.comp.__6a9803ce37a6658d333e838def2ebba3method2(),
                    template: templ2
                },{once: true,
                    condition: (c) => true,
                    template: templ3
                }]
            });const templ5 = new Aventus.Template(this);templ5.setTemplate(`    <div class="mapping-adder">        <om-select>            <om-option value="">-- Champ Supprimé --</om-option>            <template _id="renamedfield_9"></template>        </om-select>        <span class="arrow-indicator">➔</span>        <om-select>            <om-option value="">-- Champ Ajouté --</om-option>            <template _id="renamedfield_11"></template>        </om-select>        <om-button _id="renamedfield_13">Lier</om-button>    </div>`);templ5.setActions({
  "events": [
    {
      "eventName": "click",
      "id": "renamedfield_13",
      "fct": (e, c) => c.comp.addFieldMapping(e)
    }
  ]
});const templ6 = new Aventus.Template(this);templ6.setTemplate(`                <om-option _id="renamedfield_10"></om-option>            `);templ6.setActions({
  "content": {
    "renamedfield_10°value": {
      "fct": (c) => `${c.print(c.comp.__6a9803ce37a6658d333e838def2ebba3method13(c.data.field))}`,
      "once": true
    },
    "renamedfield_10°@HTML": {
      "fct": (c) => `${c.print(c.comp.__6a9803ce37a6658d333e838def2ebba3method13(c.data.field))}`,
      "once": true
    }
  }
});templ5.addLoop({
                    anchorId: 'renamedfield_9',
                    template: templ6,
                simple:{data: "this.mappingFieldTableInfo.deletedFields",item:"field"}});const templ7 = new Aventus.Template(this);templ7.setTemplate(`                <om-option _id="renamedfield_12"></om-option>            `);templ7.setActions({
  "content": {
    "renamedfield_12°value": {
      "fct": (c) => `${c.print(c.comp.__6a9803ce37a6658d333e838def2ebba3method13(c.data.field))}`,
      "once": true
    },
    "renamedfield_12°@HTML": {
      "fct": (c) => `${c.print(c.comp.__6a9803ce37a6658d333e838def2ebba3method13(c.data.field))}`,
      "once": true
    }
  }
});templ5.addLoop({
                    anchorId: 'renamedfield_11',
                    template: templ7,
                simple:{data: "this.mappingFieldTableInfo.addedFields",item:"field"}});this.__getStatic().__template.addIf({
                    anchorId: 'renamedfield_8',
                    parts: [{once: true,
                    condition: (c) => c.comp.__6a9803ce37a6658d333e838def2ebba3method4(),
                    template: templ5
                }]
            }); }
    getClassName() {
        return "RenamedField";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["mappingFieldTable"] = undefined; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('tableComparisons');this.__correctGetter('mappingFieldTableInfo');this.__correctGetter('fieldsMapping');this.__correctGetter('mappingFieldTable'); }
    addFieldMapping() {
    }
    removeFieldMapping() {
    }
    __6a9803ce37a6658d333e838def2ebba3method9(table) {
        return table.newTableName;
    }
    __6a9803ce37a6658d333e838def2ebba3method10(table) {
        return table.isRename ? `${table.oldTableName} ➔ ${table.newTableName}` : table.newTableName;
    }
    __6a9803ce37a6658d333e838def2ebba3method11(oldF) {
        return oldF;
    }
    __6a9803ce37a6658d333e838def2ebba3method12(oldF) {
        return this.fieldsMapping[oldF];
    }
    __6a9803ce37a6658d333e838def2ebba3method13(field) {
        return field.name;
    }
    __6a9803ce37a6658d333e838def2ebba3method1() {
        return !this.mappingFieldTable;
    }
    __6a9803ce37a6658d333e838def2ebba3method2() {
        return Object.keys(this.fieldsMapping).length == 0;
    }
    __6a9803ce37a6658d333e838def2ebba3method4() {
        return !this.mappingFieldTable;
    }
    __6a9803ce37a6658d333e838def2ebba3method7() {
        return this.mappingFieldTable;
    }
    __6a9803ce37a6658d333e838def2ebba3method8(v) {
        if (this) {
            this.mappingFieldTable = v;
        }
    }
}
RenamedField.Namespace=`migration`;
RenamedField.Tag=`av-renamed-field`;
__as1(_, 'RenamedField', RenamedField);
if(!window.customElements.get('av-renamed-field')){window.customElements.define('av-renamed-field', RenamedField);Aventus.WebComponentInstance.registerDefinition(RenamedField);}

const RenamedTable = class RenamedTable extends Aventus.WebComponent {
    get comparison() {
        return MainState.instance.comparison;
    }
    get tables() {
        return MainState.instance.mappings.tables;
    }
    static __style = ``;
    __getStatic() {
        return RenamedTable;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(RenamedTable.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<h4>Tables Renommées</h4><p class="card-desc">Si une table a été renommée, associez son ancien nom au nouveau.</p><div class="mapping-list">    <template _id="renamedtable_0"></template></div><div class="mapping-adder">    <om-select _id="renamedtable_5">        <om-option value="">-- Table Supprimée --</om-option>        <template _id="renamedtable_6"></template>    </om-select>    <span class="arrow-indicator">➔</span>    <om-select _id="renamedtable_8">        <om-option value="">-- Table Ajoutée --</om-option>        <template _id="renamedtable_9"></template>    </om-select>    <om-button color="success" _id="renamedtable_11">Lier</om-button></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "oldTableSelect",
      "ids": [
        "renamedtable_5"
      ]
    },
    {
      "name": "newTableSelect",
      "ids": [
        "renamedtable_8"
      ]
    }
  ],
  "events": [
    {
      "eventName": "click",
      "id": "renamedtable_11",
      "fct": (e, c) => c.comp.addTableMapping(e)
    }
  ]
});const templ3 = new Aventus.Template(this);templ3.setTemplate(`            <om-option _id="renamedtable_7"></om-option>        `);templ3.setActions({
  "content": {
    "renamedtable_7°value": {
      "fct": (c) => `${c.print(c.comp.__890caef2e9cc439ef37effad59e247femethod6(c.data.deletedTable))}`,
      "once": true
    },
    "renamedtable_7°@HTML": {
      "fct": (c) => `${c.print(c.comp.__890caef2e9cc439ef37effad59e247femethod6(c.data.deletedTable))}`,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'renamedtable_6',
                    template: templ3,
                simple:{data: "this.comparison.deletedTables",item:"deletedTable"}});const templ4 = new Aventus.Template(this);templ4.setTemplate(`            <om-option _id="renamedtable_10"></om-option>        `);templ4.setActions({
  "content": {
    "renamedtable_10°value": {
      "fct": (c) => `${c.print(c.comp.__890caef2e9cc439ef37effad59e247femethod7(c.data.addedTable))}`,
      "once": true
    },
    "renamedtable_10°@HTML": {
      "fct": (c) => `${c.print(c.comp.__890caef2e9cc439ef37effad59e247femethod7(c.data.addedTable))}`,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'renamedtable_9',
                    template: templ4,
                simple:{data: "this.comparison.addedTables",item:"addedTable"}});const templ0 = new Aventus.Template(this);templ0.setTemplate(`        <p class="no-table">Aucune association de table.</p>    `);const templ1 = new Aventus.Template(this);templ1.setTemplate(`        <template _id="renamedtable_1"></template>    `);const templ2 = new Aventus.Template(this);templ2.setTemplate(`            <div class="mapping-item">                <span class="mapping-names">                    <span _id="renamedtable_2"></span>                    <span class="mapping-arrow">➔</span>                    <span _id="renamedtable_3"></span>                </span>                <button class="mapping-delete" _id="renamedtable_4">✕</button>            </div>        `);templ2.setActions({
  "content": {
    "renamedtable_2°@HTML": {
      "fct": (c) => `${c.print(c.comp.__890caef2e9cc439ef37effad59e247femethod4(c.data.oldName))}`,
      "once": true
    },
    "renamedtable_3°@HTML": {
      "fct": (c) => `${c.print(c.comp.__890caef2e9cc439ef37effad59e247femethod5(c.data.oldName))}`
    },
    "renamedtable_4°data-name": {
      "fct": (c) => `${c.print(c.comp.__890caef2e9cc439ef37effad59e247femethod4(c.data.oldName))}`,
      "once": true
    }
  },
  "events": [
    {
      "eventName": "click",
      "id": "renamedtable_4",
      "fct": (e, c) => c.comp.removeTableMapping(e)
    }
  ]
});templ1.addLoop({
                    anchorId: 'renamedtable_1',
                    template: templ2,
                simple:{data: "this.tables",index:"oldName"}});this.__getStatic().__template.addIf({
                    anchorId: 'renamedtable_0',
                    parts: [{once: true,
                    condition: (c) => c.comp.__890caef2e9cc439ef37effad59e247femethod0(),
                    template: templ0
                },{once: true,
                    condition: (c) => true,
                    template: templ1
                }]
            }); }
    getClassName() {
        return "RenamedTable";
    }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('comparison');this.__correctGetter('tables'); }
    removeTableMapping() {
    }
    addTableMapping() {
    }
    __890caef2e9cc439ef37effad59e247femethod4(oldName) {
        return oldName;
    }
    __890caef2e9cc439ef37effad59e247femethod5(oldName) {
        return this.tables[oldName];
    }
    __890caef2e9cc439ef37effad59e247femethod6(deletedTable) {
        return deletedTable.name;
    }
    __890caef2e9cc439ef37effad59e247femethod7(addedTable) {
        return addedTable.name;
    }
    __890caef2e9cc439ef37effad59e247femethod0() {
        return Object.keys(this.tables).length == 0;
    }
}
RenamedTable.Namespace=`migration`;
RenamedTable.Tag=`av-renamed-table`;
__as1(_, 'RenamedTable', RenamedTable);
if(!window.customElements.get('av-renamed-table')){window.customElements.define('av-renamed-table', RenamedTable);Aventus.WebComponentInstance.registerDefinition(RenamedTable);}

let Dynamic=function Dynamic(cb) {
    return function (target, context) {
        if (context.kind !== "accessor") {
            throw new Error("Le décorateur @Dynamic requiert le mot-clé 'accessor'.");
        }
        const field = context.name.toString();
        const instanceRefs = new WeakMap();
        return {
            init(initialValue) {
                if (!instanceRefs.has(this)) {
                    instanceRefs.set(this, Aventus.Watcher.get({
                        [field]: initialValue
                    }, (action, path, value) => {
                        if (cb && path.startsWith(field)) {
                            cb(this, value);
                        }
                    }));
                }
                else {
                    instanceRefs.get(this)[field] = initialValue;
                }
                return initialValue;
            },
            get() {
                return instanceRefs.get(this)[field];
            },
            set(newValue) {
                instanceRefs.get(this)[field] = newValue;
            }
        };
    };
}
__as1(_, 'Dynamic', Dynamic);

const SummaryUpdatedTable = class SummaryUpdatedTable extends Aventus.WebComponent {
    static get observedAttributes() {return ["is_rename"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'is_rename'() { return this.getBoolProp('is_rename') }
    set 'is_rename'(val) { this.setBoolAttr('is_rename', val) }    change;
    static __style = ``;
    __getStatic() {
        return SummaryUpdatedTable;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(SummaryUpdatedTable.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="diff-table-group">    <div class="diff-table-header" style="background: rgba(255, 255, 255, 0.01)">        <span class="diff-table-title" _id="summaryupdatedtable_0"></span>        <span class="badge badge-new" _id="summaryupdatedtable_1"></span>    </div>    <div class="diff-table-body">        <template _id="summaryupdatedtable_2"></template>        <template _id="summaryupdatedtable_5"></template>        <template _id="summaryupdatedtable_7"></template>        <template _id="summaryupdatedtable_10"></template>    </div></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "summaryupdatedtable_0°@HTML": {
      "fct": (c) => `\r\n            ${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method7())}\r\n        `
    },
    "summaryupdatedtable_1°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method8())}`
    }
  }
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`            <div class="diff-item">                <span class="diff-tag diff-tag-ren">Renommé</span>                <span>                    <span class="diff-change-old" _id="summaryupdatedtable_3"></span>                    <span>➔</span>                    <span class="diff-change-new" _id="summaryupdatedtable_4"></span>                </span>            </div>        `);templ0.setActions({
  "content": {
    "summaryupdatedtable_3°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method9(c.data.renameField))}`,
      "once": true
    },
    "summaryupdatedtable_4°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method10(c.data.renameField))}`,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'summaryupdatedtable_2',
                    template: templ0,
                simple:{data: "this.change.renamedFields",item:"renameField"}});const templ1 = new Aventus.Template(this);templ1.setTemplate(`            <div class="diff-item">                <span class="diff-tag diff-tag-del">Retiré</span>                <span class="diff-change-old" _id="summaryupdatedtable_6"></span>            </div>        `);templ1.setActions({
  "content": {
    "summaryupdatedtable_6°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method11(c.data.deletedField))}`,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'summaryupdatedtable_5',
                    template: templ1,
                simple:{data: "this.change.deletedFields",item:"deletedField"}});const templ2 = new Aventus.Template(this);templ2.setTemplate(`            <div class="diff-item">                <span class="diff-tag diff-tag-add">Ajouté</span>                <span class="diff-change-new" _id="summaryupdatedtable_8"></span>                <span class="diff-item-detail" _id="summaryupdatedtable_9"></span>            </div>        `);templ2.setActions({
  "content": {
    "summaryupdatedtable_8°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method12(c.data.addedField))}`,
      "once": true
    },
    "summaryupdatedtable_9°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method13(c.data.addedField))}`
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'summaryupdatedtable_7',
                    template: templ2,
                simple:{data: "this.change.addedFields",item:"addedField"}});const templ3 = new Aventus.Template(this);templ3.setTemplate(`            <div class="diff-item">                <span class="diff-tag diff-tag-mod">Modifié</span>                <span _id="summaryupdatedtable_11"></span>                <span class="diff-item-detail">                    <template _id="summaryupdatedtable_12"></template>                    <template _id="summaryupdatedtable_15"></template>                    <template _id="summaryupdatedtable_18"></template>                </span>            </div>        `);templ3.setActions({
  "content": {
    "summaryupdatedtable_11°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method14(c.data.modifiedField))}`
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'summaryupdatedtable_10',
                    template: templ3,
                simple:{data: "this.change.modifiedFields",item:"modifiedField"}});const templ4 = new Aventus.Template(this);templ4.setTemplate(`                        <span>                            <span>type: </span>                            <span class="diff-change-old" _id="summaryupdatedtable_13"></span>                            <span>➔</span>                            <span class="diff-change-new" _id="summaryupdatedtable_14"></span>                        </span>                    `);templ4.setActions({
  "content": {
    "summaryupdatedtable_13°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method15(c.data.modifiedField))}`
    },
    "summaryupdatedtable_14°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method16(c.data.modifiedField))}`
    }
  }
});templ3.addIf({
                    anchorId: 'summaryupdatedtable_12',
                    parts: [{
                    condition: (c) => c.comp.__49686968742173745148a8d3c31a7eb3method4(c.data.modifiedField),
                    template: templ4
                }]
            });const templ5 = new Aventus.Template(this);templ5.setTemplate(`                        <span>                            <span>nullable: </span>                            <span class="diff-change-old" _id="summaryupdatedtable_16"></span>                            <span>➔</span>                            <span class="diff-change-new" _id="summaryupdatedtable_17"></span>                        </span>                    `);templ5.setActions({
  "content": {
    "summaryupdatedtable_16°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method17(c.data.modifiedField))}`
    },
    "summaryupdatedtable_17°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method18(c.data.modifiedField))}`
    }
  }
});templ3.addIf({
                    anchorId: 'summaryupdatedtable_15',
                    parts: [{
                    condition: (c) => c.comp.__49686968742173745148a8d3c31a7eb3method5(c.data.modifiedField),
                    template: templ5
                }]
            });const templ6 = new Aventus.Template(this);templ6.setTemplate(`                        <span>                            <span>unique: </span>                            <span class="diff-change-old" _id="summaryupdatedtable_19"></span>                            <span>➔</span>                            <span class="diff-change-new" _id="summaryupdatedtable_20"></span>                        </span>                    `);templ6.setActions({
  "content": {
    "summaryupdatedtable_19°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method19(c.data.modifiedField))}`
    },
    "summaryupdatedtable_20°@HTML": {
      "fct": (c) => `${c.print(c.comp.__49686968742173745148a8d3c31a7eb3method20(c.data.modifiedField))}`
    }
  }
});templ3.addIf({
                    anchorId: 'summaryupdatedtable_18',
                    parts: [{
                    condition: (c) => c.comp.__49686968742173745148a8d3c31a7eb3method6(c.data.modifiedField),
                    template: templ6
                }]
            }); }
    getClassName() {
        return "SummaryUpdatedTable";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('is_rename')) { this.attributeChangedCallback('is_rename', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('is_rename'); }
    __listBoolProps() { return ["is_rename"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    __49686968742173745148a8d3c31a7eb3method7() {
        return this.change.isRename ? `Table Renommée : ${this.change.oldTableName} ➔ ${this.change.newTableName}` : `Table Modifiée : ${this.change.newTableName}`;
    }
    __49686968742173745148a8d3c31a7eb3method8() {
        return this.change.isRename ? 'Renommé' : 'Modifié';
    }
    __49686968742173745148a8d3c31a7eb3method9(renameField) {
        return renameField.oldName;
    }
    __49686968742173745148a8d3c31a7eb3method10(renameField) {
        return renameField.newName;
    }
    __49686968742173745148a8d3c31a7eb3method11(deletedField) {
        return deletedField;
    }
    __49686968742173745148a8d3c31a7eb3method12(addedField) {
        return addedField.name;
    }
    __49686968742173745148a8d3c31a7eb3method13(addedField) {
        return `(${addedField.type.name}${addedField.nullable ? ', null' : ''})`;
    }
    __49686968742173745148a8d3c31a7eb3method14(modifiedField) {
        return modifiedField.name;
    }
    __49686968742173745148a8d3c31a7eb3method15(modifiedField) {
        return modifiedField.changes.type.old;
    }
    __49686968742173745148a8d3c31a7eb3method16(modifiedField) {
        return modifiedField.changes.type.new;
    }
    __49686968742173745148a8d3c31a7eb3method17(modifiedField) {
        return modifiedField.changes.nullable.old;
    }
    __49686968742173745148a8d3c31a7eb3method18(modifiedField) {
        return modifiedField.changes.nullable.new;
    }
    __49686968742173745148a8d3c31a7eb3method19(modifiedField) {
        return modifiedField.changes.unique.old;
    }
    __49686968742173745148a8d3c31a7eb3method20(modifiedField) {
        return modifiedField.changes.unique.new;
    }
    __49686968742173745148a8d3c31a7eb3method4(modifiedField) {
        return modifiedField.changes.type;
    }
    __49686968742173745148a8d3c31a7eb3method5(modifiedField) {
        return modifiedField.changes.nullable;
    }
    __49686968742173745148a8d3c31a7eb3method6(modifiedField) {
        return modifiedField.changes.unique;
    }
}
SummaryUpdatedTable.Namespace=`migration`;
SummaryUpdatedTable.Tag=`av-summary-updated-table`;
__as1(_, 'SummaryUpdatedTable', SummaryUpdatedTable);
if(!window.customElements.get('av-summary-updated-table')){window.customElements.define('av-summary-updated-table', SummaryUpdatedTable);Aventus.WebComponentInstance.registerDefinition(SummaryUpdatedTable);}

let MainState=(() => {
    let _step_decorators;
    let _step_initializers = [];
    let _step_extraInitializers = [];
    return class MainState {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _step_decorators = [Dynamic()];
            __esDecorate(this, null, _step_decorators, { kind: "accessor", name: "step", static: false, private: false, access: { has: obj => "step" in obj, get: obj => obj.step, set: (obj, value) => { obj.step = value; } }, metadata: _metadata }, _step_initializers, _step_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static get instance() {
            return Aventus.Instance.get(MainState);
        }
        #step_accessor_storage = __runInitializers(this, _step_initializers, 0);
        get step() { return this.#step_accessor_storage; }
        set step(value) { this.#step_accessor_storage = value; }
        oldSchema = (__runInitializers(this, _step_extraInitializers), {
            "name": "DemoSchemaA",
            "databaseType": "sqlite",
            "tables": [
                {
                    "id": "t1",
                    "name": "Club",
                    "fields": [
                        { "id": "f1_1", "name": "Id", "type": { "id": "int", "name": "int" }, "primaryKey": true },
                        { "id": "f1_2", "name": "Name", "type": { "id": "varchar", "name": "varchar(255)" } },
                        { "id": "f1_3", "name": "Logo", "type": { "id": "varchar", "name": "varchar(255)" }, "nullable": true },
                        { "id": "f1_4", "name": "CreatedDate", "type": { "id": "datetime", "name": "datetime" } },
                        { "id": "f1_5", "name": "UpdatedDate", "type": { "id": "datetime", "name": "datetime" } }
                    ]
                },
                {
                    "id": "t2",
                    "name": "Role",
                    "fields": [
                        { "id": "f2_1", "name": "Id", "type": { "id": "int", "name": "int" }, "primaryKey": true },
                        { "id": "f2_2", "name": "Name", "type": { "id": "varchar", "name": "varchar(255)" } },
                        { "id": "f2_3", "name": "ClubId", "type": { "id": "int", "name": "int" } },
                        { "id": "f2_4", "name": "CreatedDate", "type": { "id": "datetime", "name": "datetime" } },
                        { "id": "f2_5", "name": "UpdatedDate", "type": { "id": "datetime", "name": "datetime" } }
                    ]
                }
            ],
            "relationships": [
                {
                    "id": "r1",
                    "name": "Role_Club",
                    "sourceTableId": "t2",
                    "sourceFieldId": "f2_3",
                    "targetTableId": "t1",
                    "targetFieldId": "f1_1"
                }
            ]
        });
        newSchema = {
            "name": "DemoSchemaB",
            "databaseType": "sqlite",
            "tables": [
                {
                    "id": "t1",
                    "name": "Club",
                    "fields": [
                        { "id": "f1_1", "name": "Id", "type": { "id": "int", "name": "int" }, "primaryKey": true },
                        { "id": "f1_2_new", "name": "Nom", "type": { "id": "varchar", "name": "varchar(255)" } },
                        { "id": "f1_3", "name": "Logo", "type": { "id": "varchar", "name": "varchar(255)" }, "nullable": true },
                        { "id": "f1_4", "name": "CreatedDate", "type": { "id": "datetime", "name": "datetime" } },
                        { "id": "f1_5", "name": "UpdatedDate", "type": { "id": "datetime", "name": "datetime" } }
                    ]
                },
                {
                    "id": "t2",
                    "name": "Role",
                    "fields": [
                        { "id": "f2_1", "name": "Id", "type": { "id": "int", "name": "int" }, "primaryKey": true },
                        { "id": "f2_2", "name": "Name", "type": { "id": "varchar", "name": "varchar(255)" } },
                        { "id": "f2_3", "name": "ClubId", "type": { "id": "int", "name": "int" } },
                        { "id": "f2_4", "name": "CreatedDate", "type": { "id": "datetime", "name": "datetime" } },
                        { "id": "f2_5", "name": "UpdatedDate", "type": { "id": "datetime", "name": "datetime" } }
                    ]
                },
                {
                    "id": "t3",
                    "name": "User",
                    "fields": [
                        { "id": "f3_1", "name": "Id", "type": { "id": "int", "name": "int" }, "primaryKey": true },
                        { "id": "f3_2", "name": "Email", "type": { "id": "varchar", "name": "varchar(255)" }, "unique": true },
                        { "id": "f3_3", "name": "Password", "type": { "id": "varchar", "name": "varchar(255)" } },
                        { "id": "f3_4", "name": "RoleId", "type": { "id": "int", "name": "int" } },
                        { "id": "f3_5", "name": "CreatedDate", "type": { "id": "datetime", "name": "datetime" } },
                        { "id": "f3_6", "name": "UpdatedDate", "type": { "id": "datetime", "name": "datetime" } }
                    ]
                }
            ],
            "relationships": [
                {
                    "id": "r1",
                    "name": "Role_Club",
                    "sourceTableId": "t2",
                    "sourceFieldId": "f2_3",
                    "targetTableId": "t1",
                    "targetFieldId": "f1_1"
                },
                {
                    "id": "r2",
                    "name": "User_Role",
                    "sourceTableId": "t3",
                    "sourceFieldId": "f3_4",
                    "targetTableId": "t2",
                    "targetFieldId": "f2_1"
                }
            ]
        };
        mappings = {
            tables: {},
            fields: {}
        };
        comparison = {
            addedTables: [],
            deletedTables: [],
            renamedTables: [],
            tableComparisons: [],
        };
    };
})();
MainState.Namespace=`migration`;
__as1(_, 'MainState', MainState);

const SummaryDeleted = class SummaryDeleted extends Aventus.WebComponent {
    get comparison() {
        return MainState.instance.comparison;
    }
    static __style = ``;
    __getStatic() {
        return SummaryDeleted;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(SummaryDeleted.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<template _id="summarydeleted_0"></template>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`    <div class="diff-table-group" style="border-color: rgba(239, 68, 68, 0.4)">        <div class="diff-table-header" style="background: rgba(239, 68, 68, 0.05)">            <span class="diff-table-title" style="color: var(--color-danger)">Table Supprimée : ${t.name}</span>            <span class="badge badge-old">Supprimé</span>        </div>        <div class="diff-table-body">            <template _id="summarydeleted_1"></template>        </div>    </div>`);this.__getStatic().__template.addLoop({
                    anchorId: 'summarydeleted_0',
                    template: templ0,
                simple:{data: "this.comparison.deletedTables",item:"deletedTable"}});const templ1 = new Aventus.Template(this);templ1.setTemplate(`                <div class="diff-item">                    <span class="diff-tag diff-tag-del">-</span>                    <span class="diff-change-old" _id="summarydeleted_2"></span>                </div>            `);templ1.setActions({
  "content": {
    "summarydeleted_2°@HTML": {
      "fct": (c) => `${c.print(c.comp.__83f0ae5284cb63e76d7ef2a50310a4bfmethod2(c.data.deletedTableField))}`,
      "once": true
    }
  }
});templ0.addLoop({
                    anchorId: 'summarydeleted_1',
                    template: templ1,
                simple:{data: "deletedTable.fields",item:"deletedTableField"}}); }
    getClassName() {
        return "SummaryDeleted";
    }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('comparison'); }
    __83f0ae5284cb63e76d7ef2a50310a4bfmethod2(deletedTableField) {
        return deletedTableField.name;
    }
}
SummaryDeleted.Namespace=`migration`;
SummaryDeleted.Tag=`av-summary-deleted`;
__as1(_, 'SummaryDeleted', SummaryDeleted);
if(!window.customElements.get('av-summary-deleted')){window.customElements.define('av-summary-deleted', SummaryDeleted);Aventus.WebComponentInstance.registerDefinition(SummaryDeleted);}

const SummaryNew = class SummaryNew extends Aventus.WebComponent {
    get comparison() {
        return MainState.instance.comparison;
    }
    static __style = ``;
    __getStatic() {
        return SummaryNew;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(SummaryNew.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<template _id="summarynew_0"></template>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`    <div class="diff-table-group" style="border-color: rgba(16, 185, 129, 0.4)">        <div class="diff-table-header" style="background: rgba(16, 185, 129, 0.05)">            <span class="diff-table-title" style="color: var(--color-success)" _id="summarynew_1"></span>            <span class="badge badge-new">Nouveau</span>        </div>        <div class="diff-table-body">            <template _id="summarynew_2"></template>        </div>    </div>`);templ0.setActions({
  "content": {
    "summarynew_1°@HTML": {
      "fct": (c) => `Table Ajoutée : ${c.print(c.comp.__a902aa746d994c2401ca9ac9dfe3b2aemethod2(c.data.addedTable))}`,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'summarynew_0',
                    template: templ0,
                simple:{data: "this.comparison.addedTables",item:"addedTable"}});const templ1 = new Aventus.Template(this);templ1.setTemplate(`                <div class="diff-item">                    <span class="diff-tag diff-tag-add">+</span>                    <span _id="summarynew_3"></span>                    <span class="diff-item-detail" _id="summarynew_4"></span>                </div>            `);templ1.setActions({
  "content": {
    "summarynew_3°@HTML": {
      "fct": (c) => `${c.print(c.comp.__a902aa746d994c2401ca9ac9dfe3b2aemethod3(c.data.addedTableField))}`,
      "once": true
    },
    "summarynew_4°@HTML": {
      "fct": (c) => `${c.print(c.comp.__a902aa746d994c2401ca9ac9dfe3b2aemethod4(c.data.addedTableField))}`
    }
  }
});templ0.addLoop({
                    anchorId: 'summarynew_2',
                    template: templ1,
                simple:{data: "addedTable.fields",item:"addedTableField"}}); }
    getClassName() {
        return "SummaryNew";
    }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('comparison'); }
    __a902aa746d994c2401ca9ac9dfe3b2aemethod2(addedTable) {
        return addedTable.name;
    }
    __a902aa746d994c2401ca9ac9dfe3b2aemethod3(addedTableField) {
        return addedTableField.name;
    }
    __a902aa746d994c2401ca9ac9dfe3b2aemethod4(addedTableField) {
        return `${addedTableField.type.name}${addedTableField.nullable ? ', null' : ''}${addedTableField.primaryKey ? ', PK' : ''})`;
    }
}
SummaryNew.Namespace=`migration`;
SummaryNew.Tag=`av-summary-new`;
__as1(_, 'SummaryNew', SummaryNew);
if(!window.customElements.get('av-summary-new')){window.customElements.define('av-summary-new', SummaryNew);Aventus.WebComponentInstance.registerDefinition(SummaryNew);}

const Header = class Header extends Aventus.WebComponent {
    static __style = `:host{align-items:center;backdrop-filter:blur(16px);background:rgba(15,23,42,.8);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;padding:1.25rem 2rem;position:sticky;top:0;z-index:100}:host .logo-area{align-items:center;display:flex;gap:.75rem}:host .logo-area .logo-icon{background:var(--accent);border-radius:var(--border-radius-lg);height:2.5rem;position:relative;width:2.5rem}:host .logo-area .logo-icon::after{background:var(--surface);border-radius:50%;content:"";height:50%;left:25%;position:absolute;top:25%;width:50%}:host .logo-area .logo-text h1{background:var(--accent);-webkit-background-clip:text;font-size:1.25rem;font-weight:700;letter-spacing:-0.02em;-webkit-text-fill-color:rgba(0,0,0,0);margin:0}:host .logo-area .logo-text span{color:var(--neutral-500);font-size:.75rem;letter-spacing:.05em;text-transform:uppercase}:host .app-nav{background:hsla(0,0%,100%,.03);border:1px solid var(--border-color);border-radius:var(--border-radius-lg);display:flex;gap:.5rem;padding:.35rem}:host .app-nav .nav-btn{background:rgba(0,0,0,0);border:none;border-radius:var(--border-radius-lg);color:var(--surface-content);cursor:pointer;font-weight:500;padding:.5rem 1.25rem;transition:all .2s ease}:host .app-nav .nav-btn:hover{background:hsla(0,0%,100%,.05)}:host .app-nav .nav-btn[active=true]{background:var(--accent);box-shadow:var(--elevation-2)}`;
    __getStatic() {
        return Header;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Header.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="logo-area">    <div class="logo-icon"></div>    <div class="logo-text">        <h1>Aventus</h1>        <span>Migration Assistant</span>    </div></div><nav class="app-nav">    <button class="nav-btn" _id="header_0">1. Schémas</button>    <button class="nav-btn" _id="header_1">2. Résolution & Diff</button>    <button class="nav-btn" _id="header_2">3. Migration C#</button></nav><div class="header-actions"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "header_0°active": {
      "fct": (c) => `${c.print(c.comp.__afe2bf44205761c9fef83440ff881e72method0())}`,
      "once": true
    },
    "header_1°active": {
      "fct": (c) => `${c.print(c.comp.__afe2bf44205761c9fef83440ff881e72method1())}`,
      "once": true
    },
    "header_2°active": {
      "fct": (c) => `${c.print(c.comp.__afe2bf44205761c9fef83440ff881e72method2())}`,
      "once": true
    }
  }
}); }
    getClassName() {
        return "Header";
    }
    __afe2bf44205761c9fef83440ff881e72method0() {
        return MainState.instance.step == 0;
    }
    __afe2bf44205761c9fef83440ff881e72method1() {
        return MainState.instance.step == 1;
    }
    __afe2bf44205761c9fef83440ff881e72method2() {
        return MainState.instance.step == 2;
    }
}
Header.Namespace=`migration`;
Header.Tag=`av-header`;
__as1(_, 'Header', Header);
if(!window.customElements.get('av-header')){window.customElements.define('av-header', Header);Aventus.WebComponentInstance.registerDefinition(Header);}

let Generator=class Generator {
    static compareSchemas(oldSchema, newSchema, mappings) {
        const oldTables = oldSchema.tables || [];
        const newTables = newSchema.tables || [];
        const oldTablesMap = new Map(oldTables.map(t => [t.name, t]));
        const newTablesMap = new Map(newTables.map(t => [t.name, t]));
        const mappedOldTables = new Set(Object.keys(mappings.tables));
        const mappedNewTables = new Set(Object.values(mappings.tables));
        const addedTables = [];
        const deletedTables = [];
        const renamedTables = [];
        const commonTables = [];
        for (const t of newTables) {
            if (!oldTablesMap.has(t.name) && !mappedNewTables.has(t.name)) {
                addedTables.push(t);
            }
        }
        for (const t of oldTables) {
            if (!newTablesMap.has(t.name) && !mappedOldTables.has(t.name)) {
                deletedTables.push(t);
            }
        }
        for (const [oldName, newName] of Object.entries(mappings.tables)) {
            const oldT = oldTablesMap.get(oldName);
            const newT = newTablesMap.get(newName);
            if (oldT && newT) {
                renamedTables.push({ old: oldT, new: newT, oldName, newName });
            }
        }
        for (const t of newTables) {
            if (oldTablesMap.has(t.name)) {
                commonTables.push({ old: oldTablesMap.get(t.name), new: t, name: t.name });
            }
        }
        const tableComparisons = [];
        const processFields = (oldTable, newTable, isRename, oldTableName, newTableName) => {
            const oldFields = oldTable.fields || [];
            const newFields = newTable.fields || [];
            const oldFieldsMap = new Map(oldFields.map(f => [f.name, f]));
            const newFieldsMap = new Map(newFields.map(f => [f.name, f]));
            const fieldMappings = mappings.fields[newTableName] || {};
            const mappedOldFields = new Set(Object.keys(fieldMappings));
            const mappedNewFields = new Set(Object.values(fieldMappings));
            const addedFields = [];
            const deletedFields = [];
            const renamedFields = [];
            const commonFields = [];
            const modifiedFields = [];
            for (const f of newFields) {
                if (!oldFieldsMap.has(f.name) && !mappedNewFields.has(f.name)) {
                    addedFields.push(f);
                }
            }
            for (const f of oldFields) {
                if (!newFieldsMap.has(f.name) && !mappedOldFields.has(f.name)) {
                    deletedFields.push(f);
                }
            }
            for (const [oldFName, newFName] of Object.entries(fieldMappings)) {
                const oldF = oldFieldsMap.get(oldFName);
                const newF = newFieldsMap.get(newFName);
                if (oldF && newF) {
                    renamedFields.push({ old: oldF, new: newF, oldName: oldFName, newName: newFName });
                }
            }
            for (const f of newFields) {
                if (oldFieldsMap.has(f.name)) {
                    commonFields.push({ old: oldFieldsMap.get(f.name), new: f, name: f.name });
                }
            }
            const checkChanges = (oldF, newF, name) => {
                const changes = {};
                if (oldF.nullable !== newF.nullable) {
                    changes.nullable = { old: oldF.nullable, new: newF.nullable };
                }
                if (oldF.unique !== newF.unique) {
                    changes.unique = { old: oldF.unique, new: newF.unique };
                }
                if (oldF.type.name !== newF.type.name) {
                    changes.type = { old: oldF.type.name, new: newF.type.name };
                }
                if (Object.keys(changes).length > 0) {
                    modifiedFields.push({ old: oldF, new: newF, name, changes });
                }
            };
            for (const cf of commonFields) {
                checkChanges(cf.old, cf.new, cf.name);
            }
            for (const rf of renamedFields) {
                checkChanges(rf.old, rf.new, rf.newName);
            }
            return {
                oldTableName,
                newTableName,
                isRename,
                addedFields,
                deletedFields,
                renamedFields,
                modifiedFields,
                hasChanges: addedFields.length > 0 || deletedFields.length > 0 || renamedFields.length > 0 || modifiedFields.length > 0
            };
        };
        for (const ct of commonTables) {
            tableComparisons.push(processFields(ct.old, ct.new, false, ct.name, ct.name));
        }
        for (const rt of renamedTables) {
            tableComparisons.push(processFields(rt.old, rt.new, true, rt.oldName, rt.newName));
        }
        return {
            addedTables,
            deletedTables,
            renamedTables,
            tableComparisons
        };
    }
}
Generator.Namespace=`migration`;
__as1(_, 'Generator', Generator);

const ImportSchema = class ImportSchema extends BaseContent {
    static __style = `:host .schemas-grid{display:grid;gap:2rem;grid-template-columns:repeat(auto-fit, minmax(450px, 1fr));margin-bottom:2rem}:host .schemas-grid .schema-card{background:var(--surface-100);border:1px solid var(--border-color);border-radius:var(--border-radius-lg);box-shadow:var(--elevation-2);display:flex;flex-direction:column;gap:1.25rem;padding:1.5rem}:host .schemas-grid .schema-card .code-textarea{background:rgba(15,23,42,.5);border:1px solid var(--border-color);border-radius:var(--border-radius-md);color:var(--primary-content);font-size:.85rem;height:350px;outline:none;padding:1rem;resize:vertical;transition:border-color .2s ease;width:100%}:host .schemas-grid .schema-card .code-textarea:focus{border-color:var(--info)}`;
    __getStatic() {
        return ImportSchema;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ImportSchema.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="section-header">    <h2>Importer les Schémas</h2>    <p>Déposez ou collez les fichiers de schémas JSON (DiagramObject) correspondants à l'ancienne et à la nouvelle        version de votre modèle.</p></div><div class="schemas-grid">    <div class="schema-card">        <div class="card-header">            <h3>Ancien Schéma (Source)</h3>            <span class="badge badge-old">Version A</span>        </div>        <textarea class="code-textarea" placeholder="Collez le JSON de l'ancien schéma ici..." _id="importschema_0"></textarea>    </div>    <div class="schema-card">        <div class="card-header">            <h3>Nouveau Schéma (Cible)</h3>            <span class="badge badge-new">Version B</span>        </div>        <textarea class="code-textarea" placeholder="Collez le JSON du nouveau schéma ici..." _id="importschema_1"></textarea>    </div></div><div class="action-footer">    <om-button _id="importschema_2">Comparer les Schémas</om-button></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "jsonOld",
      "ids": [
        "importschema_0"
      ]
    },
    {
      "name": "jsonNew",
      "ids": [
        "importschema_1"
      ]
    }
  ],
  "events": [
    {
      "eventName": "click",
      "id": "importschema_2",
      "fct": (e, c) => c.comp.analyzeAndCompare(e)
    }
  ]
}); }
    getClassName() {
        return "ImportSchema";
    }
    analyzeAndCompare() {
        Generator.compareSchemas(MainState.instance.oldSchema, MainState.instance.newSchema, MainState.instance.mappings);
        MainState.instance.step = 1;
        // throw new Error("Method not implemented.");
    }
}
ImportSchema.Namespace=`migration`;
ImportSchema.Tag=`av-import-schema`;
__as1(_, 'ImportSchema', ImportSchema);
if(!window.customElements.get('av-import-schema')){window.customElements.define('av-import-schema', ImportSchema);Aventus.WebComponentInstance.registerDefinition(ImportSchema);}

const SummaryUpdated = class SummaryUpdated extends Aventus.WebComponent {
    get tableComparisons() {
        return MainState.instance.comparison.tableComparisons;
    }
    static __style = ``;
    __getStatic() {
        return SummaryUpdated;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(SummaryUpdated.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<template _id="summaryupdated_0"></template>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`    <template _id="summaryupdated_1"></template>`);this.__getStatic().__template.addLoop({
                    anchorId: 'summaryupdated_0',
                    template: templ0,
                simple:{data: "this.tableComparisons",item:"table"}});const templ1 = new Aventus.Template(this);templ1.setTemplate(`        <av-summary-updated-table _id="summaryupdated_2"></av-summary-updated-table>    `);templ1.setActions({
  "injection": [
    {
      "id": "summaryupdated_2",
      "injectionName": "change",
      "inject": (c) => c.comp.__8959b69ae2b5092f3c1be2eb741d7f13method2(c.data.table),
      "once": true
    }
  ]
});templ0.addIf({
                    anchorId: 'summaryupdated_1',
                    parts: [{once: true,
                    condition: (c) => c.comp.__8959b69ae2b5092f3c1be2eb741d7f13method1(c.data.table),
                    template: templ1
                }]
            }); }
    getClassName() {
        return "SummaryUpdated";
    }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('tableComparisons'); }
    __8959b69ae2b5092f3c1be2eb741d7f13method1(table) {
        return table.hasChanges;
    }
    __8959b69ae2b5092f3c1be2eb741d7f13method2(table) {
        return table;
    }
}
SummaryUpdated.Namespace=`migration`;
SummaryUpdated.Tag=`av-summary-updated`;
__as1(_, 'SummaryUpdated', SummaryUpdated);
if(!window.customElements.get('av-summary-updated')){window.customElements.define('av-summary-updated', SummaryUpdated);Aventus.WebComponentInstance.registerDefinition(SummaryUpdated);}

const DiffSummary = class DiffSummary extends Aventus.WebComponent {
    get 'has_diff'() { return this.getBoolAttr('has_diff') }
    set 'has_diff'(val) { this.setBoolAttr('has_diff', val) }    static __style = `:host .empty-state{display:none}:host(:not([has_diff])) .empty-state{display:flex}`;
    __getStatic() {
        return DiffSummary;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(DiffSummary.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="empty-state">    <span class="empty-icon">✨</span>    <p>Aucune différence structurelle détectée entre les deux schémas.</p></div><av-summary-new></av-summary-new><av-summary-deleted></av-summary-deleted><av-summary-updated></av-summary-updated>` }
    });
}
    getClassName() {
        return "DiffSummary";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('has_diff')) { this.attributeChangedCallback('has_diff', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('has_diff'); }
    __listBoolProps() { return ["has_diff"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    postCreation() {
        Aventus.Watcher.effect(() => {
            const comp = MainState.instance.comparison;
            this.has_diff = comp.addedTables.length > 0 || comp.deletedTables.length > 0 || comp.renamedTables.length > 0;
        });
    }
}
DiffSummary.Namespace=`migration`;
DiffSummary.Tag=`av-diff-summary`;
__as1(_, 'DiffSummary', DiffSummary);
if(!window.customElements.get('av-diff-summary')){window.customElements.define('av-diff-summary', DiffSummary);Aventus.WebComponentInstance.registerDefinition(DiffSummary);}

const Resolution = class Resolution extends BaseContent {
    get comparison() {
        return MainState.instance.comparison;
    }
    get tableComparisons() {
        return this.comparison.tableComparisons;
    }
    get tables() {
        return MainState.instance.mappings.tables;
    }
    static __style = `:host .diff-container{align-items:start;display:grid;gap:2rem;grid-template-columns:1fr 1.25fr}:host .diff-container .panel{background:var(--surface-100);border:1px solid var(--border-color);border-radius:var(--border-radius-lg);box-shadow:var(--elevation-2);overflow:hidden}:host .diff-container .panel .panel-header{align-items:center;background:hsla(0,0%,100%,.02);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;padding:1.25rem 1.5rem}:host .diff-container .panel .panel-header h3{font-size:1.1rem;font-weight:600;margin:0}:host .diff-container .panel .panel-body{display:flex;flex-direction:column;gap:1.5rem;padding:1.5rem}:host .diff-container .panel .panel-body .mapping-card{background:var(--surface-200);border:1px solid var(--border-color);border-radius:var(--border-radius-md);padding:1.25rem}:host .diff-container .panel .panel-body .mapping-card h4{font-size:1rem;font-weight:500;margin:0;margin-bottom:.25rem}:host .diff-container .panel .panel-body .mapping-card .card-desc{color:var(--neutral);font-size:.8rem;margin-bottom:1rem}:host .diff-container .panel .panel-body .mapping-card .mapping-adder{align-items:center;display:flex;gap:.5rem}:host .diff-container .panel .panel-body .mapping-card .mapping-adder om-select{min-width:0}:host .diff-container .panel .panel-body .mapping-card .mapping-list{display:flex;flex-direction:column;gap:.5rem;margin-bottom:1rem}:host .diff-container .panel .panel-body .mapping-card .mapping-list .mapping-item{align-items:center;background:hsla(0,0%,100%,.02);border:1px solid var(--border-color);border-radius:var(--border-radius-lg);display:flex;font-size:.85rem;justify-content:space-between;padding:.5rem .75rem}:host .diff-container .panel .panel-body .mapping-card .mapping-list .mapping-names{align-items:center;display:flex;font-family:var(--font-mono);gap:.5rem}:host .diff-container .panel .panel-body .mapping-card .mapping-list .mapping-arrow{color:var(--info)}:host .diff-container .panel .panel-body .mapping-card .mapping-list .mapping-delete{background:rgba(0,0,0,0);border:none;border-radius:4px;color:var(--error);cursor:pointer;font-size:1rem;padding:.1rem .3rem}:host .diff-container .panel .panel-body .mapping-card .mapping-list .mapping-delete:hover{background:var(--error-600)}:host .diff-container .panel .panel-body .mapping-card .table-selector-wrapper{align-items:center;display:flex;gap:.75rem;margin-bottom:1rem}:host .diff-container .panel .panel-body .mapping-card .table-selector-wrapper label{flex-shrink:0}`;
    __getStatic() {
        return Resolution;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Resolution.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="section-header">    <h2>Résolution des Différences</h2>    <p>Associez les tables et champs renommés pour générer une migration propre utilisant <code>RenameModel</code> et        <code>RenameProperty</code>.    </p></div><div class="diff-container">    <div class="panel resolution-panel">        <div class="panel-header">            <h3>Renommages & Associations</h3>        </div>        <div class="panel-body">            <div class="mapping-card">               <av-renamed-table></av-renamed-table>            </div>            <div class="mapping-card">                <av-renamed-field></av-renamed-field>            </div>        </div>    </div>    <div class="panel diff-preview-panel">        <div class="panel-header">            <h3>Modifications Détectées</h3>        </div>        <div class="panel-body" id="diff-results">           <av-diff-summary></av-diff-summary>        </div>    </div></div><div class="action-footer">    <om-button _id="resolution_0">Retour</om-button>    <om-button _id="resolution_1">Générer la Migration</om-button></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "events": [
    {
      "eventName": "click",
      "id": "resolution_0",
      "fct": (e, c) => c.comp.back(e)
    },
    {
      "eventName": "click",
      "id": "resolution_1",
      "fct": (e, c) => c.comp.prepareMigrationGeneration(e)
    }
  ]
}); }
    getClassName() {
        return "Resolution";
    }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('comparison');this.__correctGetter('tableComparisons');this.__correctGetter('tables'); }
    back() {
        MainState.instance.step = 0;
    }
    prepareMigrationGeneration() {
        MainState.instance.step = 2;
    }
}
Resolution.Namespace=`migration`;
Resolution.Tag=`av-resolution`;
__as1(_, 'Resolution', Resolution);
if(!window.customElements.get('av-resolution')){window.customElements.define('av-resolution', Resolution);Aventus.WebComponentInstance.registerDefinition(Resolution);}

const Body = class Body extends Aventus.WebComponent {
    static __style = `:host{padding:2.5rem 2rem;width:100%}:host .content{margin:0 auto;max-width:1600px;width:100%}`;
    __getStatic() {
        return Body;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Body.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="content">    <template _id="body_0"></template></div>` }
    });
}
    get importEl () { return this.shadowRoot.querySelector('[_id="body_1"]'); }    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`        <av-import-schema _id="body_1"></av-import-schema>    `);const templ1 = new Aventus.Template(this);templ1.setTemplate(`        <av-resolution></av-resolution>    `);this.__getStatic().__template.addIf({
                    anchorId: 'body_0',
                    parts: [{once: true,
                    condition: (c) => c.comp.__2be0ec9db9ae5e5eba9b8fde6955e867method0(),
                    template: templ0
                },{once: true,
                    condition: (c) => c.comp.__2be0ec9db9ae5e5eba9b8fde6955e867method1(),
                    template: templ1
                }]
            }); }
    getClassName() {
        return "Body";
    }
    postCreation() {
    }
    __2be0ec9db9ae5e5eba9b8fde6955e867method0() {
        return MainState.instance.step == 0;
    }
    __2be0ec9db9ae5e5eba9b8fde6955e867method1() {
        return MainState.instance.step == 1;
    }
}
Body.Namespace=`migration`;
Body.Tag=`av-body`;
__as1(_, 'Body', Body);
if(!window.customElements.get('av-body')){window.customElements.define('av-body', Body);Aventus.WebComponentInstance.registerDefinition(Body);}

const App = class App extends Aventus.WebComponent {
    static __style = `:host{display:flex;flex-direction:column;height:100vh}:host av-header{flex-shrink:0}:host om-scrollable{flex-grow:1;min-height:0;width:100%}`;
    __getStatic() {
        return App;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(App.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<av-header _id="app_0"></av-header><om-scrollable floating_scroll>    <av-body _id="app_1"></av-body></om-scrollable>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "headerEl",
      "ids": [
        "app_0"
      ]
    },
    {
      "name": "bodyEl",
      "ids": [
        "app_1"
      ]
    }
  ]
}); }
    getClassName() {
        return "App";
    }
}
App.Namespace=`migration`;
App.Tag=`av-app`;
__as1(_, 'App', App);
if(!window.customElements.get('av-app')){window.customElements.define('av-app', App);Aventus.WebComponentInstance.registerDefinition(App);}


for(let key in _) { migration[key] = _[key] }
})(migration);
