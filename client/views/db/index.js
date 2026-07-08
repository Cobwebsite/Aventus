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
let sleep=function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
__as1(_, 'sleep', sleep);

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

let Animation=class Animation {
    /**
     * Default FPS for all Animation if not set inside options
     */
    static FPS_DEFAULT = 60;
    options;
    nextFrame = 0;
    fpsInterval;
    continueAnimation = false;
    frame_id = 0;
    constructor(options) {
        if (!options.animate) {
            options.animate = () => { };
        }
        if (!options.stopped) {
            options.stopped = () => { };
        }
        if (!options.fps) {
            options.fps = Animation.FPS_DEFAULT;
        }
        this.options = options;
        this.fpsInterval = 1000 / options.fps;
    }
    animate() {
        let now = window.performance.now();
        let elapsed = now - this.nextFrame;
        if (elapsed <= this.fpsInterval) {
            this.frame_id = requestAnimationFrame(() => this.animate());
            return;
        }
        this.nextFrame = now - (elapsed % this.fpsInterval);
        setTimeout(() => {
            this.options.animate();
        }, 0);
        if (this.continueAnimation) {
            this.frame_id = requestAnimationFrame(() => this.animate());
        }
        else {
            this.options.stopped();
        }
    }
    /**
     * Start the of animation
     */
    start() {
        if (this.continueAnimation == false) {
            this.continueAnimation = true;
            this.nextFrame = window.performance.now();
            this.animate();
        }
    }
    /**
     * Stop the animation
     */
    stop() {
        this.continueAnimation = false;
    }
    /**
     * Stop the animation
     */
    immediateStop() {
        cancelAnimationFrame(this.frame_id);
        this.continueAnimation = false;
        this.options.stopped();
    }
    /**
     * Get the FPS
     */
    getFPS() {
        return this.options.fps;
    }
    /**
     * Set the FPS
     */
    setFPS(fps) {
        this.options.fps = fps;
        this.fpsInterval = 1000 / this.options.fps;
    }
    /**
     * Get the animation status (true if animation is running)
     */
    isStarted() {
        return this.continueAnimation;
    }
}
Animation.Namespace=`Aventus`;
__as1(_, 'Animation', Animation);


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
let Modal = {};
_.Modal = Aventus.Modal ?? {};
let Toast = {};
_.Toast = Aventus.Toast ?? {};
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

Modal.ModalElement = class ModalElement extends Aventus.WebComponent {
    get 'options'() {
						return this.__watch["options"];
					}
					set 'options'(val) {
						this.__watch["options"] = val;
					}    static defaultCloseWithEsc = true;
    static defaultCloseWithClick = true;
    static defaultRejectValue = null;
    cb;
    pressManagerClickClose;
    pressManagerPrevent;
    __registerWatchesActions() {
    this.__addWatchesActions("options", ((target, action, path, value) => {
    target.onOptionsChanged();
}));    super.__registerWatchesActions();
}
    static __style = `:host{align-items:center;display:flex;inset:0;justify-content:center;position:fixed;z-index:60}:host .modal{background-color:#fff;padding:1.5rem;position:relative}`;
    constructor() {
        super();
        this.options = this.configure();
        if (this.options.closeWithClick === undefined)
            this.options.closeWithClick = Modal.ModalElement.defaultCloseWithClick;
        if (this.options.closeWithEsc === undefined)
            this.options.closeWithEsc = Modal.ModalElement.defaultCloseWithEsc;
        if (!Object.hasOwn(this.options, "rejectValue")) {
            this.options.rejectValue = Modal.ModalElement.defaultRejectValue;
        }
        if (this.constructor == ModalElement) {
            throw "can't instanciate an abstract class";
        }
        this.close = this.close.bind(this);
        this.reject = this.reject.bind(this);
        this.resolve = this.resolve.bind(this);
    }
    __getStatic() {
        return ModalElement;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ModalElement.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<div class="modal" _id="modalelement_0">	<slot></slot></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "modalEl",
      "ids": [
        "modalelement_0"
      ]
    }
  ]
}); }
    getClassName() {
        return "ModalElement";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["options"] = undefined; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('options'); }
    onOptionsChanged() { }
    init(cb) {
        this.cb = cb;
        if (this.options.closeWithEsc) {
            Lib.ShortcutManager.subscribe(Lib.SpecialTouch.Escape, this.reject, { replaceTemp: true });
        }
        if (this.options.closeWithClick) {
            this.pressManagerClickClose = new Aventus.PressManager({
                element: this,
                onPress: () => {
                    this.reject();
                }
            });
            this.pressManagerPrevent = new Aventus.PressManager({
                element: this.modalEl,
                onPress: () => { }
            });
        }
    }
    show(element) {
        return Modal.ModalElement._show(this, element);
    }
    close() {
        Lib.ShortcutManager.unsubscribe(Lib.SpecialTouch.Escape, this.reject);
        this.pressManagerClickClose?.destroy();
        this.pressManagerPrevent?.destroy();
        this.remove();
    }
    reject(no_close) {
        if (this.cb) {
            this.cb(this.options.rejectValue ?? null);
        }
        if (no_close !== true) {
            this.close();
        }
    }
    resolve(response, no_close) {
        if (this.cb) {
            this.cb(response);
        }
        if (no_close !== true) {
            this.close();
        }
    }
    static configure(options) {
        if (options.closeWithClick !== undefined)
            this.defaultCloseWithClick = options.closeWithClick;
        if (options.closeWithEsc !== undefined)
            this.defaultCloseWithEsc = options.closeWithEsc;
        if (!Object.hasOwn(options, "rejectValue")) {
            this.defaultRejectValue = options.rejectValue;
        }
    }
    static _show(modal, element) {
        return new Promise((resolve) => {
            modal.init((response) => {
                resolve(response);
            });
            if (!element) {
                element = document.body;
            }
            element.appendChild(modal);
        });
    }
}
Modal.ModalElement.Namespace=`Aventus.Modal`;
__as1(_.Modal, 'ModalElement', Modal.ModalElement);

Toast.ToastElement = class ToastElement extends Aventus.WebComponent {
    get 'position'() { return this.getStringAttr('position') }
    set 'position'(val) { this.setStringAttr('position', val) }get 'delay'() { return this.getNumberAttr('delay') }
    set 'delay'(val) { this.setNumberAttr('delay', val) }get 'is_active'() { return this.getBoolAttr('is_active') }
    set 'is_active'(val) { this.setBoolAttr('is_active', val) }    showAsked = false;
    onHideCallback = () => { };
    timeout = 0;
    hasTransition = false;
    waitTransitionCbs = [];
    static __style = `:host{position:absolute}:host(:not([is_active])){opacity:0;visibility:hidden}:host([position="bottom left"]){bottom:0px;left:0px}:host([position="top left"]){left:0;top:0}:host([position="bottom right"]){bottom:0;right:0}:host([position="top right"]){right:0;top:0}:host([position=top]){left:50%;top:0;transform:translateX(-50%)}:host([position=bottom]){bottom:0;left:50%;transform:translateX(-50%)}`;
    constructor() {
        super();
        this.addTransition();
        if (this.constructor == ToastElement) {
            throw "can't instanciate an abstract class";
        }
    }
    __getStatic() {
        return ToastElement;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ToastElement.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "ToastElement";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('position')){ this['position'] = _.Toast.ToastManager.defaultPosition; }if(!this.hasAttribute('delay')){ this['delay'] = _.Toast.ToastManager.defaultDelay; }if(!this.hasAttribute('is_active')) { this.attributeChangedCallback('is_active', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('position');this.__upgradeProperty('delay');this.__upgradeProperty('is_active'); }
    __listBoolProps() { return ["is_active"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    _setOptions(options) {
        if (options.position !== undefined)
            this.position = options.position;
        if (options.delay !== undefined)
            this.delay = options.delay;
        return this.setOptions(options);
    }
    show(onHideCallback) {
        this.onHideCallback = onHideCallback;
        if (this.isReady) {
            this.is_active = true;
            this.startDelay();
        }
        else {
            this.showAsked = true;
        }
    }
    startDelay() {
        if (this.delay > 0) {
            this.timeout = setTimeout(() => {
                this.close();
            }, this.delay);
        }
    }
    async close() {
        if (this.onHideCallback) {
            this.is_active = false;
            this.onHideCallback(false);
            this.remove();
        }
    }
    addTransition() {
        this.addEventListener("transitionstart", (e) => {
            this.hasTransition = true;
        });
        this.addEventListener("transitionend", () => {
            this.hasTransition = false;
            let cbs = [...this.waitTransitionCbs];
            this.waitTransitionCbs = [];
            for (let cb of cbs) {
                cb();
            }
        });
    }
    waitTransition() {
        if (this.hasTransition) {
            return new Promise((resolve) => {
                this.waitTransitionCbs.push(resolve);
            });
        }
        return new Promise((resolve) => {
            resolve();
        });
    }
    postCreation() {
        if (this.showAsked) {
            this.is_active = true;
            this.startDelay();
        }
    }
    static add(options) {
        return _.Toast.ToastManager.add(options);
    }
}
Toast.ToastElement.Namespace=`Aventus.Toast`;
__as1(_.Toast, 'ToastElement', Toast.ToastElement);

Toast.ToastManager = class ToastManager extends Aventus.WebComponent {
    get 'not_main'() { return this.getBoolAttr('not_main') }
    set 'not_main'(val) { this.setBoolAttr('not_main', val) }    static defaultToast;
    static defaultToastManager;
    static defaultPosition = 'top right';
    static defaultDelay = 5000;
    static gap = 10;
    static heightLimitPercent = 100;
    static instance;
    activeToasts = {
        top: [],
        'top left': [],
        'bottom left': [],
        bottom: [],
        'bottom right': [],
        'top right': [],
    };
    waitingToasts = {
        top: [],
        'top left': [],
        'bottom left': [],
        bottom: [],
        'bottom right': [],
        'top right': [],
    };
    get containerHeight() {
        return this.offsetHeight;
    }
    get heightLimit() {
        return this.containerHeight * Toast.ToastManager.heightLimitPercent / 100;
    }
    mutex = new Aventus.Mutex();
    static __style = `:host{--_toast-space-bottom: var(--toast-space-bottom, 20px);--_toast-space-top: var(--toast-space-top, 20px);--_toast-space-right: var(--toast-space-right, 10px);--_toast-space-left: var(--toast-space-left, 10px)}:host{bottom:var(--_toast-space-bottom);left:var(--_toast-space-left);overflow:visible;pointer-events:none;position:fixed;right:var(--_toast-space-right);top:var(--_toast-space-top);z-index:50}:host ::slotted(*){pointer-events:auto}`;
    __getStatic() {
        return ToastManager;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ToastManager.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "ToastManager";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('not_main')) { this.attributeChangedCallback('not_main', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('containerHeight');this.__correctGetter('heightLimit');this.__upgradeProperty('not_main'); }
    __listBoolProps() { return ["not_main"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    async add(toast) {
        await this.mutex.waitOne();
        let realToast;
        if (toast instanceof _.Toast.ToastElement) {
            realToast = toast;
        }
        else {
            if (!Toast.ToastManager.defaultToast)
                throw "No default toast. Try ToastManager.configure()";
            realToast = new Toast.ToastManager.defaultToast();
            await realToast._setOptions(toast);
        }
        this.appendChild(realToast);
        if (realToast.position == "bottom") {
            return this._notifyBottom(realToast, true);
        }
        else if (realToast.position == "bottom left") {
            return this._notifyBottomLeft(realToast, true);
        }
        else if (realToast.position == "top left") {
            return this._notifyTopLeft(realToast, true);
        }
        else if (realToast.position == "bottom right") {
            return this._notifyBottomRight(realToast, true);
        }
        else if (realToast.position == "top right") {
            return this._notifyTopRight(realToast, true);
        }
        else if (realToast.position == "top") {
            return this._notifyTop(realToast, true);
        }
        return false;
    }
    _calculateBottom(toast, firstTime, position) {
        return new Promise(async (resolve) => {
            let height = toast.offsetHeight;
            const _remove = (result) => {
                let index = this.activeToasts[position].indexOf(toast);
                if (index > -1) {
                    this.activeToasts[position].splice(index, 1);
                }
                if (this.waitingToasts[position].length > 0) {
                    let nextNotif = this.waitingToasts[position].splice(0, 1)[0];
                    this._calculateBottom(nextNotif, false, position);
                }
                else {
                    let bottom = 0;
                    for (let i = 0; i < this.activeToasts[position].length; i++) {
                        let notif = this.activeToasts[position][i];
                        notif.style.bottom = bottom + 'px';
                        bottom += notif.offsetHeight + Toast.ToastManager.gap;
                    }
                }
                resolve(result);
            };
            let length = this.activeToasts[position].length;
            if (length == 0) {
                this.activeToasts[position].push(toast);
                toast.show(_remove);
            }
            else {
                let totHeight = 0;
                for (let notif of this.activeToasts[position]) {
                    await notif.waitTransition();
                    totHeight += notif.offsetHeight + Toast.ToastManager.gap;
                }
                if (totHeight + height < this.heightLimit) {
                    this.activeToasts[position].splice(0, 0, toast);
                    let bottom = 0;
                    for (let i = 0; i < this.activeToasts[position].length; i++) {
                        let notif = this.activeToasts[position][i];
                        notif.style.bottom = bottom + 'px';
                        bottom += notif.offsetHeight + Toast.ToastManager.gap;
                    }
                    toast.show(_remove);
                }
                else if (firstTime) {
                    this.waitingToasts[position].push(toast);
                }
            }
            this.mutex.release();
        });
    }
    _calculateTop(toast, firstTime, position) {
        return new Promise(async (resolve) => {
            let height = toast.offsetHeight;
            const _remove = (result) => {
                let index = this.activeToasts[position].indexOf(toast);
                if (index > -1) {
                    this.activeToasts[position].splice(index, 1);
                }
                if (this.waitingToasts[position].length > 0) {
                    let nextNotif = this.waitingToasts[position].splice(0, 1)[0];
                    this._calculateTop(nextNotif, false, position);
                }
                else {
                    let top = 0;
                    for (let i = 0; i < this.activeToasts[position].length; i++) {
                        let notif = this.activeToasts[position][i];
                        notif.style.top = top + 'px';
                        top += notif.offsetHeight + Toast.ToastManager.gap;
                    }
                }
                resolve(result);
            };
            let length = this.activeToasts[position].length;
            if (length == 0) {
                this.activeToasts[position].push(toast);
                toast.show(_remove);
            }
            else {
                let totHeight = 0;
                for (let notif of this.activeToasts[position]) {
                    await notif.waitTransition();
                    totHeight += notif.offsetHeight + Toast.ToastManager.gap;
                }
                if (totHeight + height < this.heightLimit) {
                    this.activeToasts[position].splice(0, 0, toast);
                    let top = 0;
                    for (let i = 0; i < this.activeToasts[position].length; i++) {
                        let notif = this.activeToasts[position][i];
                        notif.style.top = top + 'px';
                        top += notif.offsetHeight + Toast.ToastManager.gap;
                    }
                    toast.show(_remove);
                }
                else if (firstTime) {
                    this.waitingToasts[position].push(toast);
                }
            }
            this.mutex.release();
        });
    }
    async _notifyBottomRight(toast, firstTime) {
        return await this._calculateBottom(toast, firstTime, "bottom right");
    }
    async _notifyTopRight(toast, firstTime) {
        return await this._calculateTop(toast, firstTime, "top right");
    }
    async _notifyBottomLeft(toast, firstTime) {
        return await this._calculateBottom(toast, firstTime, "bottom left");
    }
    async _notifyTopLeft(toast, firstTime) {
        return await this._calculateTop(toast, firstTime, "top left");
    }
    async _notifyTop(toast, firstTime) {
        return await this._calculateTop(toast, firstTime, "top");
    }
    async _notifyBottom(toast, firstTime) {
        return await this._calculateBottom(toast, firstTime, "bottom");
    }
    postConnect() {
        super.postConnect();
        if (!Toast.ToastManager.instance && !this.not_main) {
            Toast.ToastManager.instance = this;
        }
    }
    postDisconnect() {
        if (Toast.ToastManager.instance == this) {
            Toast.ToastManager.instance = undefined;
        }
    }
    static add(toast) {
        if (!this.instance) {
            this.instance = this.defaultToastManager ? new this.defaultToastManager() : new Toast.ToastManager();
            document.body.appendChild(this.instance);
        }
        return this.instance.add(toast);
    }
    static configure(options) {
        const opts = options;
        const t = this;
        for (let key in options) {
            if (opts[key] !== undefined)
                t[key] = opts[key];
        }
    }
}
Toast.ToastManager.Namespace=`Aventus.Toast`;
Toast.ToastManager.Tag=`av-toast-manager`;
__as1(_.Toast, 'ToastManager', Toast.ToastManager);
if(!window.customElements.get('av-toast-manager')){window.customElements.define('av-toast-manager', Toast.ToastManager);Aventus.WebComponentInstance.registerDefinition(Toast.ToastManager);}

let Process=class Process {
    /**
     * Static handler for processing generic errors.
     */
    static handleErrors;
    /**
     * Configures the Process utility with custom error handling.
     */
    static configure(config) {
        this.handleErrors = config.handleErrors;
    }
    static async execute(prom) {
        const queryResult = await prom;
        return await this.parseErrors(queryResult);
    }
    static async parseErrors(result) {
        if (result.errors.length > 0) {
            if (this.handleErrors) {
                let msg = result.errors.map(p => p.message.replace(/\n/g, '<br/>')).join("<br/>");
                this.handleErrors(msg, result.errors);
            }
            return undefined;
        }
        if (result instanceof Aventus.ResultWithError)
            return result.result;
        if (result instanceof Aventus.VoidWithError)
            return result.success;
        return undefined;
    }
}
Process.Namespace=`Aventus`;
__as1(_, 'Process', Process);


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
Components.Interaction = {};
_.Components.Interaction = OneMoreUI.Components?.Interaction ?? {};
let Libs = {};
_.Libs = OneMoreUI.Libs ?? {};
Components.Form = {};
_.Components.Form = OneMoreUI.Components?.Form ?? {};
let Lib = {};
_.Lib = OneMoreUI.Lib ?? {};
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

Components.Interaction.Modal = class Modal extends Aventus.Modal.ModalElement {
    static __style = `:host{backdrop-filter:blur(4px);background-color:rgba(0,0,0,.4)}:host .modal{background-color:var(--surface);border-radius:var(--border-radius-lg);box-shadow:var(--elevation-3);display:flex;flex-direction:column;gap:1.5rem;max-height:calc(100% - 4rem);max-width:calc(100% - 40px);min-width:min(400px,100% - 40px);padding:1.5rem}:host .modal .modal-header{align-items:center;border-bottom:1px solid var(--border-color);display:flex;flex-shrink:0;gap:1rem;padding:.5rem;padding-top:0rem}:host .modal .modal-header .icon{aspect-ratio:1;display:flex;font-size:var(--font-size-lg);margin-left:.5rem;width:21px}:host .modal .modal-header .title{font-size:var(--font-size-md);font-weight:500;line-height:var(--line-height-md)}:host .modal .modal-header:empty{display:none}:host .modal .modal-content{--scrollbar-content-padding: 0 0.5rem;flex-grow:1;flex-shrink:1;min-height:0}:host .modal .modal-footer{align-items:center;display:flex;flex-shrink:0;gap:1rem;justify-content:flex-end;margin-top:.5rem}:host .modal .modal-footer:empty{display:none}`;
    constructor() {
        super();
        if (this.constructor == Modal) {
            throw "can't instanciate an abstract class";
        }
    }
    __getStatic() {
        return Modal;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Modal.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        slots: { 'header':`<slot name="header"></slot>`,'default':`<slot></slot>`,'footer':`<slot name="footer"></slot>` }, 
        blocks: { 'default':`<div class="modal-header">    <slot name="header"></slot></div><om-scrollable class="modal-content" flex>    <slot></slot></om-scrollable><div class="modal-footer">    <slot name="footer"></slot></div>` }
    });
}
    getClassName() {
        return "Modal";
    }
    init(cb) {
        this.cb = cb;
        if (this.options.closeWithEsc) {
            Aventus.Lib.ShortcutManager.subscribe(Aventus.Lib.SpecialTouch.Escape, this.reject, { replaceTemp: true });
        }
        if (this.options.closeWithClick) {
            this.addEventListener("click", () => {
                this.reject();
            });
            this.modalEl.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        }
    }
}
Components.Interaction.Modal.Namespace=`OneMoreUI.Components.Interaction`;
__as1(_.Components.Interaction, 'Modal', Components.Interaction.Modal);

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

(function (MenuState) {
    MenuState[MenuState["BeforeOpen"] = 0] = "BeforeOpen";
    MenuState[MenuState["Open"] = 1] = "Open";
    MenuState[MenuState["Close"] = 2] = "Close";
})(Components.Display.MenuState || (Components.Display.MenuState = {}));
__as1(_.Components.Display, 'MenuState', Components.Display.MenuState);

Lib.Colors=class Colors {
    static get BLACK() { return new Lib.Color("#000000"); }
    static get SILVER() { return new Lib.Color("#c0c0c0"); }
    static get GRAY() { return new Lib.Color("#808080"); }
    static get WHITE() { return new Lib.Color("#ffffff"); }
    static get MAROON() { return new Lib.Color("#800000"); }
    static get RED() { return new Lib.Color("#ff0000"); }
    static get PURPLE() { return new Lib.Color("#800080"); }
    static get GREEN() { return new Lib.Color("#008000"); }
    static get LIME() { return new Lib.Color("#00ff00"); }
    static get OLIVE() { return new Lib.Color("#808000"); }
    static get YELLOW() { return new Lib.Color("#ffff00"); }
    static get NAVY() { return new Lib.Color("#000080"); }
    static get BLUE() { return new Lib.Color("#0000ff"); }
    static get TEAL() { return new Lib.Color("#008080"); }
    static get AQUA() { return new Lib.Color("#00ffff"); }
    static get ORANGE() { return new Lib.Color("#ffa500"); }
    static get ALICEBLUE() { return new Lib.Color("#f0f8ff"); }
    static get ANTIQUEWHITE() { return new Lib.Color("#faebd7"); }
    static get AQUAMARINE() { return new Lib.Color("#7fffd4"); }
    static get AZURE() { return new Lib.Color("#f0ffff"); }
    static get BEIGE() { return new Lib.Color("#f5f5dc"); }
    static get BISQUE() { return new Lib.Color("#ffe4c4"); }
    static get BLANCHEDALMOND() { return new Lib.Color("#ffebcd"); }
    static get BLUEVIOLET() { return new Lib.Color("#8a2be2"); }
    static get BROWN() { return new Lib.Color("#a52a2a"); }
    static get BURLYWOOD() { return new Lib.Color("#deb887"); }
    static get CADETBLUE() { return new Lib.Color("#5f9ea0"); }
    static get CHARTREUSE() { return new Lib.Color("#7fff00"); }
    static get CHOCOLATE() { return new Lib.Color("#d2691e"); }
    static get CORAL() { return new Lib.Color("#ff7f50"); }
    static get CORNFLOWERBLUE() { return new Lib.Color("#6495ed"); }
    static get CORNSILK() { return new Lib.Color("#fff8dc"); }
    static get CRIMSON() { return new Lib.Color("#dc143c"); }
    static get CYAN() { return new Lib.Color("#00ffff"); }
    static get DARKBLUE() { return new Lib.Color("#00008b"); }
    static get DARKCYAN() { return new Lib.Color("#008b8b"); }
    static get DARKGOLDENROD() { return new Lib.Color("#b8860b"); }
    static get DARKGRAY() { return new Lib.Color("#a9a9a9"); }
    static get DARKGREEN() { return new Lib.Color("#006400"); }
    static get DARKGREY() { return new Lib.Color("#a9a9a9"); }
    static get DARKKHAKI() { return new Lib.Color("#bdb76b"); }
    static get DARKMAGENTA() { return new Lib.Color("#8b008b"); }
    static get DARKOLIVEGREEN() { return new Lib.Color("#556b2f"); }
    static get DARKORANGE() { return new Lib.Color("#ff8c00"); }
    static get DARKORCHID() { return new Lib.Color("#9932cc"); }
    static get DARKRED() { return new Lib.Color("#8b0000"); }
    static get DARKSALMON() { return new Lib.Color("#e9967a"); }
    static get DARKSEAGREEN() { return new Lib.Color("#8fbc8f"); }
    static get DARKSLATEBLUE() { return new Lib.Color("#483d8b"); }
    static get DARKSLATEGRAY() { return new Lib.Color("#2f4f4f"); }
    static get DARKSLATEGREY() { return new Lib.Color("#2f4f4f"); }
    static get DARKTURQUOISE() { return new Lib.Color("#00ced1"); }
    static get DARKVIOLET() { return new Lib.Color("#9400d3"); }
    static get DEEPPINK() { return new Lib.Color("#ff1493"); }
    static get DEEPSKYBLUE() { return new Lib.Color("#00bfff"); }
    static get DIMGRAY() { return new Lib.Color("#696969"); }
    static get DIMGREY() { return new Lib.Color("#696969"); }
    static get DODGERBLUE() { return new Lib.Color("#1e90ff"); }
    static get FIREBRICK() { return new Lib.Color("#b22222"); }
    static get FLORALWHITE() { return new Lib.Color("#fffaf0"); }
    static get FORESTGREEN() { return new Lib.Color("#228b22"); }
    static get GAINSBORO() { return new Lib.Color("#dcdcdc"); }
    static get GHOSTWHITE() { return new Lib.Color("#f8f8ff"); }
    static get GOLD() { return new Lib.Color("#ffd700"); }
    static get GOLDENROD() { return new Lib.Color("#daa520"); }
    static get GREENYELLOW() { return new Lib.Color("#adff2f"); }
    static get GREY() { return new Lib.Color("#808080"); }
    static get HONEYDEW() { return new Lib.Color("#f0fff0"); }
    static get HOTPINK() { return new Lib.Color("#ff69b4"); }
    static get INDIANRED() { return new Lib.Color("#cd5c5c"); }
    static get INDIGO() { return new Lib.Color("#4b0082"); }
    static get IVORY() { return new Lib.Color("#fffff0"); }
    static get KHAKI() { return new Lib.Color("#f0e68c"); }
    static get LAVENDER() { return new Lib.Color("#e6e6fa"); }
    static get LAVENDERBLUSH() { return new Lib.Color("#fff0f5"); }
    static get LAWNGREEN() { return new Lib.Color("#7cfc00"); }
    static get LEMONCHIFFON() { return new Lib.Color("#fffacd"); }
    static get LIGHTBLUE() { return new Lib.Color("#add8e6"); }
    static get LIGHTCORAL() { return new Lib.Color("#f08080"); }
    static get LIGHTCYAN() { return new Lib.Color("#e0ffff"); }
    static get LIGHTGOLDENRODYELLOW() { return new Lib.Color("#fafad2"); }
    static get LIGHTGRAY() { return new Lib.Color("#d3d3d3"); }
    static get LIGHTGREEN() { return new Lib.Color("#90ee90"); }
    static get LIGHTGREY() { return new Lib.Color("#d3d3d3"); }
    static get LIGHTPINK() { return new Lib.Color("#ffb6c1"); }
    static get LIGHTSALMON() { return new Lib.Color("#ffa07a"); }
    static get LIGHTSEAGREEN() { return new Lib.Color("#20b2aa"); }
    static get LIGHTSKYBLUE() { return new Lib.Color("#87cefa"); }
    static get LIGHTSLATEGRAY() { return new Lib.Color("#778899"); }
    static get LIGHTSLATEGREY() { return new Lib.Color("#778899"); }
    static get LIGHTSTEELBLUE() { return new Lib.Color("#b0c4de"); }
    static get LIGHTYELLOW() { return new Lib.Color("#ffffe0"); }
    static get LIMEGREEN() { return new Lib.Color("#32cd32"); }
    static get LINEN() { return new Lib.Color("#faf0e6"); }
    static get MAGENTA() { return new Lib.Color("#ff00ff"); }
    static get FUCHSIA() { return new Lib.Color("#ff00ff"); }
    static get MEDIUMAQUAMARINE() { return new Lib.Color("#66cdaa"); }
    static get MEDIUMBLUE() { return new Lib.Color("#0000cd"); }
    static get MEDIUMORCHID() { return new Lib.Color("#ba55d3"); }
    static get MEDIUMPURPLE() { return new Lib.Color("#9370db"); }
    static get MEDIUMSEAGREEN() { return new Lib.Color("#3cb371"); }
    static get MEDIUMSLATEBLUE() { return new Lib.Color("#7b68ee"); }
    static get MEDIUMSPRINGGREEN() { return new Lib.Color("#00fa9a"); }
    static get MEDIUMTURQUOISE() { return new Lib.Color("#48d1cc"); }
    static get MEDIUMVIOLETRED() { return new Lib.Color("#c71585"); }
    static get MIDNIGHTBLUE() { return new Lib.Color("#191970"); }
    static get MINTCREAM() { return new Lib.Color("#f5fffa"); }
    static get MISTYROSE() { return new Lib.Color("#ffe4e1"); }
    static get MOCCASIN() { return new Lib.Color("#ffe4b5"); }
    static get NAVAJOWHITE() { return new Lib.Color("#ffdead"); }
    static get OLDLACE() { return new Lib.Color("#fdf5e6"); }
    static get OLIVEDRAB() { return new Lib.Color("#6b8e23"); }
    static get ORANGERED() { return new Lib.Color("#ff4500"); }
    static get ORCHID() { return new Lib.Color("#da70d6"); }
    static get PALEGOLDENROD() { return new Lib.Color("#eee8aa"); }
    static get PALEGREEN() { return new Lib.Color("#98fb98"); }
    static get PALETURQUOISE() { return new Lib.Color("#afeeee"); }
    static get PALEVIOLETRED() { return new Lib.Color("#db7093"); }
    static get PAPAYAWHIP() { return new Lib.Color("#ffefd5"); }
    static get PEACHPUFF() { return new Lib.Color("#ffdab9"); }
    static get PERU() { return new Lib.Color("#cd853f"); }
    static get PINK() { return new Lib.Color("#ffc0cb"); }
    static get PLUM() { return new Lib.Color("#dda0dd"); }
    static get POWDERBLUE() { return new Lib.Color("#b0e0e6"); }
    static get ROSYBROWN() { return new Lib.Color("#bc8f8f"); }
    static get ROYALBLUE() { return new Lib.Color("#4169e1"); }
    static get SADDLEBROWN() { return new Lib.Color("#8b4513"); }
    static get SALMON() { return new Lib.Color("#fa8072"); }
    static get SANDYBROWN() { return new Lib.Color("#f4a460"); }
    static get SEAGREEN() { return new Lib.Color("#2e8b57"); }
    static get SEASHELL() { return new Lib.Color("#fff5ee"); }
    static get SIENNA() { return new Lib.Color("#a0522d"); }
    static get SKYBLUE() { return new Lib.Color("#87ceeb"); }
    static get SLATEBLUE() { return new Lib.Color("#6a5acd"); }
    static get SLATEGRAY() { return new Lib.Color("#708090"); }
    static get SLATEGREY() { return new Lib.Color("#708090"); }
    static get SNOW() { return new Lib.Color("#fffafa"); }
    static get SPRINGGREEN() { return new Lib.Color("#00ff7f"); }
    static get STEELBLUE() { return new Lib.Color("#4682b4"); }
    static get TAN() { return new Lib.Color("#d2b48c"); }
    static get THISTLE() { return new Lib.Color("#d8bfd8"); }
    static get TOMATO() { return new Lib.Color("#ff6347"); }
    static get TURQUOISE() { return new Lib.Color("#40e0d0"); }
    static get VIOLET() { return new Lib.Color("#ee82ee"); }
    static get WHEAT() { return new Lib.Color("#f5deb3"); }
    static get WHITESMOKE() { return new Lib.Color("#f5f5f5"); }
    static get YELLOWGREEN() { return new Lib.Color("#9acd32"); }
    static get REBECCAPURPLE() { return new Lib.Color("#663399"); }
}
Lib.Colors.Namespace=`OneMoreUI.Lib`;
__as1(_.Lib, 'Colors', Lib.Colors);

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

Components.Form.Input = class Input extends Components.Form.FormElement {
    static get observedAttributes() {return ["name", "label", "icon", "placeholder", "value"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'is_focus'() { return this.getBoolAttr('is_focus') }
    set 'is_focus'(val) { this.setBoolAttr('is_focus', val) }    get 'name'() { return this.getStringProp('name') }
    set 'name'(val) { this.setStringAttr('name', val) }get 'label'() { return this.getStringProp('label') }
    set 'label'(val) { this.setStringAttr('label', val) }get 'icon'() { return this.getStringProp('icon') }
    set 'icon'(val) { this.setStringAttr('icon', val) }get 'placeholder'() { return this.getStringProp('placeholder') }
    set 'placeholder'(val) { this.setStringAttr('placeholder', val) }get 'value'() { return this.getStringProp('value') }
    set 'value'(val) { this.setStringAttr('value', val) }    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("value", ((target) => {
    target.onValueChange(target.value);
})); }
    static __style = `:host{--_input-bg: var(--input-bg, var(--form-element-bg));--_input-fg: var(--input-fg, var(--form-element-fg));--_input-border: var(--input-border, var(--form-element-border));--_input-border-radius: var(--input-border-radius, var(--form-element-border-radius))}:host{width:100%}:host label{display:none;font-size:var(--font-size-sm);font-weight:500;line-height:var(--line-height-sm)}:host .input{align-items:center;background-color:var(--_input-bg);border-radius:var(--_input-border-radius);display:flex;gap:.5rem;height:100%;margin-top:0;overflow:hidden;padding:.5rem 1rem;position:relative;width:100%}:host .input .icon{color:color-mix(in oklab, var(--_input-fg) 40%, transparent);display:none;font-size:var(--font-size)}:host .input input{background-color:rgba(0,0,0,0);border:none;color:var(--_input-fg);display:block;flex-grow:1;font-size:var(--font-size);height:var(--line-height);margin:0;min-width:0;outline:none;padding:0}:host .input input::placeholder{color:color-mix(in oklab, var(--_input-fg) 40%, transparent)}:host .input::after{border:var(--_input-border);border-radius:var(--_input-border-radius);content:"";display:block;inset:0px;pointer-events:none;position:absolute}:host .errors{color:var(--error);display:none;flex-direction:column;font-size:var(--font-size-sm);gap:.25rem;line-height:var(--line-height-sm);margin:.5rem;margin-bottom:0}:host([is_focus]) .input{border-color:var(--primary)}:host([is_focus]) .input::after{border-color:var(--primary);border-width:2px}:host([has_errors]) .input::after{border-color:var(--error)}:host([has_errors]) .errors{display:flex}:host([icon]:not([icon=""])) .input .icon{display:block}:host([label]:not([label=""])) label{display:flex}:host([label]:not([label=""])) .input{height:auto;margin-top:.5rem}:host([readonly]){pointer-events:none}:host([disabled]){pointer-events:none}:host([disabled]) label{color:color-mix(in oklab, var(--surface-content) 50%, var(--surface))}:host([disabled]) .input{background-color:color-mix(in oklab, var(--surface-content) 10%, transparent)}:host([disabled]) .input input{color:color-mix(in oklab, var(--surface-content) 50%, var(--surface))}:host([disabled]) .input::after{border:none}`;
    __getStatic() {
        return Input;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Input.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        slots: { 'prepend':`<slot name="prepend">        <mi-icon class="icon" _id="input_1"></mi-icon>    </slot>`,'append':`<slot name="append">    </slot>` }, 
        blocks: { 'default':`<label _id="input_0"></label><div class="input">    <slot name="prepend">        <mi-icon class="icon" _id="input_1"></mi-icon>    </slot>    <input autocomplete="off" _id="input_2" />    <slot name="append">    </slot></div><div class="errors">    <template _id="input_3"></template></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "iconEl",
      "ids": [
        "input_1"
      ]
    },
    {
      "name": "inputEl",
      "ids": [
        "input_2"
      ]
    }
  ],
  "content": {
    "input_0°for": {
      "fct": (c) => `${c.print(c.comp.__2d86810f2ba04f242547809ce401a43bmethod1())}`,
      "once": true
    },
    "input_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__2d86810f2ba04f242547809ce401a43bmethod2())}`,
      "once": true
    },
    "input_1°icon": {
      "fct": (c) => `${c.print(c.comp.__2d86810f2ba04f242547809ce401a43bmethod3())}`,
      "once": true
    },
    "input_2°id": {
      "fct": (c) => `${c.print(c.comp.__2d86810f2ba04f242547809ce401a43bmethod1())}`,
      "once": true
    },
    "input_2°name": {
      "fct": (c) => `${c.print(c.comp.__2d86810f2ba04f242547809ce401a43bmethod1())}`,
      "once": true
    },
    "input_2°placeholder": {
      "fct": (c) => `${c.print(c.comp.__2d86810f2ba04f242547809ce401a43bmethod4())}`,
      "once": true
    },
    "input_2°tabindex": {
      "fct": (c) => `${c.print(c.comp.__2d86810f2ba04f242547809ce401a43bmethod6())}`
    }
  },
  "injection": [
    {
      "id": "input_2",
      "injectionName": "value",
      "inject": (c) => c.comp.__2d86810f2ba04f242547809ce401a43bmethod5(),
      "once": true
    }
  ],
  "events": [
    {
      "eventName": "focus",
      "id": "input_2",
      "fct": (e, c) => c.comp.onFocus(e)
    },
    {
      "eventName": "blur",
      "id": "input_2",
      "fct": (e, c) => c.comp.onBlur(e)
    },
    {
      "eventName": "input",
      "id": "input_2",
      "fct": (e, c) => c.comp.onInputChanged(e)
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`         <div _id="input_4"></div>    `);templ0.setActions({
  "content": {
    "input_4°@HTML": {
      "fct": (c) => `${c.print(c.comp.__2d86810f2ba04f242547809ce401a43bmethod7(c.data.error))}`,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'input_3',
                    template: templ0,
                simple:{data: "this.errors",item:"error"}}); }
    getClassName() {
        return "Input";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('is_focus')) { this.attributeChangedCallback('is_focus', false, false); }if(!this.hasAttribute('name')){ this['name'] = undefined; }if(!this.hasAttribute('label')){ this['label'] = undefined; }if(!this.hasAttribute('icon')){ this['icon'] = undefined; }if(!this.hasAttribute('placeholder')){ this['placeholder'] = undefined; }if(!this.hasAttribute('value')){ this['value'] = ""; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('is_focus');this.__upgradeProperty('name');this.__upgradeProperty('label');this.__upgradeProperty('icon');this.__upgradeProperty('placeholder');this.__upgradeProperty('value'); }
    __listBoolProps() { return ["is_focus"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    onFocus() {
        this.is_focus = true;
        this.errors = [];
    }
    onBlur() {
        this.is_focus = false;
    }
    onInputChanged() {
        this.triggerChange(this.inputEl.value);
    }
    __2d86810f2ba04f242547809ce401a43bmethod1() {
        return this.name;
    }
    __2d86810f2ba04f242547809ce401a43bmethod2() {
        return this.label;
    }
    __2d86810f2ba04f242547809ce401a43bmethod3() {
        return this.icon;
    }
    __2d86810f2ba04f242547809ce401a43bmethod4() {
        return this.placeholder;
    }
    __2d86810f2ba04f242547809ce401a43bmethod6() {
        return this.disabled ? -1 : 0;
    }
    __2d86810f2ba04f242547809ce401a43bmethod7(error) {
        return error;
    }
    __2d86810f2ba04f242547809ce401a43bmethod5() {
        return this.value;
    }
}
Components.Form.Input.Namespace=`OneMoreUI.Components.Form`;
Components.Form.Input.Tag=`om-input`;
__as1(_.Components.Form, 'Input', Components.Form.Input);
if(!window.customElements.get('om-input')){window.customElements.define('om-input', Components.Form.Input);Aventus.WebComponentInstance.registerDefinition(Components.Form.Input);}

Components.Form.Slider = class Slider extends Components.Form.FormElement {
    static get observedAttributes() {return ["name", "label", "min", "max", "value", "step"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'popup'() { return this.getStringAttr('popup') }
    set 'popup'(val) { this.setStringAttr('popup', val) }get 'no_transition'() { return this.getBoolAttr('no_transition') }
    set 'no_transition'(val) { this.setBoolAttr('no_transition', val) }get 'popup_visible'() { return this.getBoolAttr('popup_visible') }
    set 'popup_visible'(val) { this.setBoolAttr('popup_visible', val) }    get 'name'() { return this.getStringProp('name') }
    set 'name'(val) { this.setStringAttr('name', val) }get 'label'() { return this.getStringProp('label') }
    set 'label'(val) { this.setStringAttr('label', val) }get 'min'() { return this.getNumberProp('min') }
    set 'min'(val) { this.setNumberAttr('min', val) }get 'max'() { return this.getNumberProp('max') }
    set 'max'(val) { this.setNumberAttr('max', val) }get 'value'() { return this.getNumberProp('value') }
    set 'value'(val) { this.setNumberAttr('value', val) }get 'step'() { return this.getNumberProp('step') }
    set 'step'(val) { this.setNumberAttr('step', val) }    currentPercent = 0;
    timerPopup = 0;
    resizerObserver;
    onValidateValue = new Aventus.Callback();
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("min", ((target) => {
    target.calculatePercent();
}));this.__addPropertyActions("max", ((target) => {
    target.calculatePercent();
}));this.__addPropertyActions("value", ((target) => {
    target.calculatePercent();
})); }
    static __style = `:host{--_slider-background-color: var(--slider-background-color, var(--surface-200));--_slider-background-image: var(--slider-background-image, none);--_slider-background-position: var(--slider-background-position, 0 0);--_slider-background-size: var(--slider-background-size, auto);--_slider-active-background-color: var(--slider-active-background-color, var(--primary));--_slider-dot-color: var(--slider-dot-color, var(--surface));--_slider-dot-size: var(--slider-dot-size, 16px);--_slider-popup-font-size: var(--slider-popup-font-size, var(--font-size-sm));--_slider-font-size-label: var(--slider-font-size-label, var(--font-size-sm));--_slider-border-radius: var(--slider-border-radius, var(--form-element-border-radius));--_slider-bar-height: var(--slider-bar-height, 10px);--_slider-height: var(--slider-height, 35px);--local-slider-dot-percent: 0%}:host{width:100%}:host label{display:none;font-size:var(--font-size-sm);font-weight:500;line-height:var(--line-height-sm)}:host .input{align-items:center;display:flex;height:var(--_slider-height);-webkit-tap-highlight-color:rgba(0,0,0,0);user-select:none;width:100%}:host .input .bar{align-items:center;background-color:var(--_slider-background-color);background-image:var(--_slider-background-image);background-position:var(--_slider-background-position);background-size:var(--_slider-background-size);border-radius:var(--_slider-border-radius);cursor:pointer;display:flex;flex-direction:row;flex-shrink:0;height:var(--_slider-bar-height);position:relative;width:100%}:host .input .bar .bar-fill{background-color:var(--_slider-active-background-color);border-radius:var(--border-radius-round);height:100%;left:0;pointer-events:all;position:absolute;top:0;transition:width var(--bezier-curve) .3s;width:var(--local-slider-dot-percent)}:host .input .bar .dot{background-color:var(--_slider-dot-color);border-radius:var(--border-radius-round);box-shadow:var(--elevation-2);cursor:pointer;height:var(--_slider-dot-size);left:var(--local-slider-dot-percent);pointer-events:all;position:absolute;transform:translateX(-50%);transition:left var(--bezier-curve) .3s,box-shadow var(--bezier-curve) .3s,background-color var(--bezier-curve) .3s;width:var(--_slider-dot-size);z-index:10}:host .input .bar .value{background-color:var(--_slider-dot-color);background-color:var(--primary-200);border-radius:var(--_slider-border-radius);box-shadow:var(--elevation-2);font-size:var(--_slider-popup-font-size);left:var(--local-slider-dot-percent);opacity:0;padding:5px 10px;padding-bottom:2px;position:absolute;top:0;transform:translateY(calc(-100% - 12px)) translateX(-50%);transform-origin:center center;transition:left var(--bezier-curve) .3s,opacity var(--bezier-curve) .3s,visibility var(--bezier-curve) .3s;visibility:hidden}:host .input .bar .value::after{border-left:6px solid rgba(0,0,0,0);border-right:6px solid rgba(0,0,0,0);border-top:8px solid var(--primary-200);bottom:-7px;content:"";left:50%;position:absolute;transform:translateX(-50%)}:host([label]:not([label=""])) label{display:flex}:host([label]:not([label=""])) .input{margin-top:.5rem}:host([popup_visible]) .input .bar .value{opacity:1;visibility:visible}:host([no_transition]) .input .bar .bar-fill{transition:none}:host([no_transition]) .input .bar .dot{transition:none}:host([no_transition]) .input .bar .value{transition:opacity var(--bezier-curve) .3s,visibility var(--bezier-curve) .3s}`;
    __getStatic() {
        return Slider;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Slider.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        slots: { 'dot':`<slot name="dot"></slot>`,'bar':`<slot name="bar"></slot>` }, 
        blocks: { 'default':`<label _id="slider_0"></label><div class="input">    <div class="bar" _id="slider_1">        <div class="value" part="popup" _id="slider_2"></div>        <div class="bar-fill">        </div>        <div class="dot" _id="slider_3">            <slot name="dot"></slot>        </div>        <slot name="bar"></slot>    </div></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "barEl",
      "ids": [
        "slider_1"
      ]
    },
    {
      "name": "dotEl",
      "ids": [
        "slider_3"
      ]
    }
  ],
  "content": {
    "slider_0°for": {
      "fct": (c) => `${c.print(c.comp.__e3987e1a7178be3821af667a72eb9064method0())}`,
      "once": true
    },
    "slider_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__e3987e1a7178be3821af667a72eb9064method1())}`,
      "once": true
    },
    "slider_2°@HTML": {
      "fct": (c) => `${c.print(c.comp.__e3987e1a7178be3821af667a72eb9064method2())}`,
      "once": true
    }
  }
}); }
    getClassName() {
        return "Slider";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('popup')){ this['popup'] = 'onMove'; }if(!this.hasAttribute('no_transition')) { this.attributeChangedCallback('no_transition', false, false); }if(!this.hasAttribute('popup_visible')) { this.attributeChangedCallback('popup_visible', false, false); }if(!this.hasAttribute('name')){ this['name'] = undefined; }if(!this.hasAttribute('label')){ this['label'] = undefined; }if(!this.hasAttribute('min')){ this['min'] = 0; }if(!this.hasAttribute('max')){ this['max'] = 100; }if(!this.hasAttribute('value')){ this['value'] = 0; }if(!this.hasAttribute('step')){ this['step'] = 1; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('popup');this.__upgradeProperty('no_transition');this.__upgradeProperty('popup_visible');this.__upgradeProperty('name');this.__upgradeProperty('label');this.__upgradeProperty('min');this.__upgradeProperty('max');this.__upgradeProperty('value');this.__upgradeProperty('step'); }
    __listBoolProps() { return ["no_transition","popup_visible"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    calculatePercent(value) {
        if (!this.isConnected)
            return;
        if (value === undefined) {
            value = this.value;
        }
        let range = this.max - this.min;
        let percent = (value - this.min) / range * 100;
        this.setPercent(percent);
    }
    setPercent(percent) {
        if (percent < 0) {
            percent = 0;
        }
        else if (percent > 100) {
            percent = 100;
        }
        // correct step
        let range = this.max - this.min;
        let value = (range * percent / 100) + this.min;
        let diff = value % this.step;
        if (diff > this.step / 2) {
            value += (this.step - diff);
        }
        else {
            value -= diff;
        }
        percent = (value - this.min) / range * 100;
        this.currentPercent = percent;
        this.style.setProperty("--local-slider-dot-percent", percent + "%");
    }
    calculateValue(emit = true) {
        let range = this.max - this.min;
        let value = (range * this.currentPercent / 100) + this.min;
        let diff = value % this.step;
        if (diff > this.step / 2) {
            value += (this.step - diff);
        }
        else {
            value -= diff;
        }
        let result = this.onValidateValue.trigger(value);
        if (result.length > 0) {
            if (result[0] != value) {
                // we correct the value so apply percent
                this.calculatePercent(result[0]);
                value = result[0];
            }
        }
        if (value != this.value) {
            this.value = value;
            if (emit) {
                this.triggerChange(this.value);
            }
        }
    }
    addClickBar() {
        if (this.popup == 'always') {
            this.popup_visible = true;
        }
        let changeValue = (e) => {
            let pageX = 0;
            if (e instanceof MouseEvent) {
                pageX = e.pageX;
            }
            else {
                pageX = e.touches[0].pageX;
            }
            let left = this.getBoundingClientRect().left;
            let newPosition = pageX - left;
            let percent = newPosition / this.offsetWidth * 100;
            this.setPercent(percent);
            this.calculateValue();
        };
        let onMove = (e) => {
            this.no_transition = true;
            changeValue(e);
        };
        let onEnd = (e) => {
            document.body.removeEventListener("mousemove", onMove);
            document.body.removeEventListener("touchmove", onMove);
            document.body.removeEventListener("mouseup", onEnd);
            document.body.removeEventListener("touchend", onEnd);
            // document.body.removeEventListener("pointercancel", onEnd);
            this.no_transition = false;
            if (this.popup == "onMove") {
                this.timerPopup = setTimeout(() => {
                    this.popup_visible = false;
                }, 1000);
            }
        };
        this.barEl.addEventListener("pointerdown", (e) => {
            changeValue(e);
            if (this.popup == "onMove") {
                clearTimeout(this.timerPopup);
                this.popup_visible = true;
            }
            document.body.addEventListener("mousemove", onMove);
            document.body.addEventListener("touchmove", onMove);
            document.body.addEventListener("mouseup", onEnd);
            document.body.addEventListener("touchend", onEnd);
        });
        this.resizerObserver = new Aventus.ResizeObserver({
            fps: 10,
            callback: () => {
                this.calculatePercent();
            }
        });
        this.resizerObserver.observe(this);
    }
    postCreation() {
        super.postCreation();
        this.addClickBar();
    }
    postDestruction() {
        this.resizerObserver?.disconnect();
    }
    __e3987e1a7178be3821af667a72eb9064method0() {
        return this.name;
    }
    __e3987e1a7178be3821af667a72eb9064method1() {
        return this.label;
    }
    __e3987e1a7178be3821af667a72eb9064method2() {
        return this.value;
    }
}
Components.Form.Slider.Namespace=`OneMoreUI.Components.Form`;
Components.Form.Slider.Tag=`om-slider`;
__as1(_.Components.Form, 'Slider', Components.Form.Slider);
if(!window.customElements.get('om-slider')){window.customElements.define('om-slider', Components.Form.Slider);Aventus.WebComponentInstance.registerDefinition(Components.Form.Slider);}

Lib.Color=class Color {
    static isValid(txt) {
        return this.getColorType(txt) != -1;
    }
    static types = {
        rgb: "rgb",
        hex: "hex",
        rgba: "rgba",
        hsl: "hsl",
        hsla: "hsla",
        hsv: "hsv",
        hsva: "hsva",
        static: "static"
    };
    static getColorType(colorString) {
        let treatedColor = colorString.replaceAll(" ", "");
        if (/^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i.test(treatedColor) ||
            /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.test(treatedColor)) {
            return Lib.Color.types.hex;
        }
        else if (/^rgba?\((\d{1,3},*){3,4}\)$/.test(treatedColor)) {
            return treatedColor.startsWith("rgba") ? Lib.Color.types.rgba : Lib.Color.types.rgb;
        }
        else if (/^hsla?\(\s*(\d{1,3})\s*(,| )\s*(\d{1,3})%?\s*(,| )\s*(\d{1,3})%?\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(treatedColor)) {
            return treatedColor.startsWith("hsla") ? Lib.Color.types.hsla : Lib.Color.types.hsl;
        }
        else if (/^hsva?\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*(,\s*(0|1|0?\.\d+))?\s*\)$/.test(treatedColor)) {
            return treatedColor.startsWith("hsva") ? Lib.Color.types.hsva : Lib.Color.types.hsv;
        }
        else if (Object.hasOwn(Lib.Colors, colorString.toUpperCase())) {
            return Lib.Color.types.static;
        }
        else {
            return -1;
        }
    }
    static createFromRgb(r, g, b) {
        return new Lib.Color(`rgb(${r},${g},${b})`);
    }
    static createFromHsl(h, s, l) {
        return new Lib.Color(`hsl(${h},${s}%,${l}%)`);
    }
    static createFromRgba(r, g, b, a) {
        return new Lib.Color(`rgba(${r},${g},${b},${a})`);
    }
    static createFromHsla(h, s, l, a) {
        return new Lib.Color(`hsla(${h},${s}%,${l}%,${a})`);
    }
    static createFromHsvla(h, s, v, a) {
        return new Lib.Color(`hsva(${h},${s}%,${v}%,${a})`);
    }
    _watcher;
    get currentColor() {
        return this._watcher.currentColor;
    }
    set currentColor(value) {
        this._watcher.currentColor = value;
    }
    get r() {
        return this.currentColor.r;
    }
    set r(newValue) {
        if (newValue >= 0 && newValue <= 255) {
            this.currentColor.r = newValue;
        }
        else {
            throw new Error("Invalid value");
        }
    }
    get g() {
        return this.currentColor.g;
    }
    set g(newValue) {
        if (newValue >= 0 && newValue <= 255) {
            this.currentColor.g = newValue;
        }
        else {
            throw new Error("Invalid value");
        }
    }
    get b() {
        return this.currentColor.b;
    }
    set b(newValue) {
        if (newValue >= 0 && newValue <= 255) {
            this.currentColor.b = newValue;
        }
        else {
            throw new Error("Invalid value");
        }
    }
    get a() {
        return this.currentColor.a;
    }
    set a(newValue) {
        if (newValue >= 0 && newValue <= 1) {
            this.currentColor.a = newValue;
        }
        else {
            throw new Error("Invalid value for A (Alpha). It should be between 0 and 1.");
        }
    }
    get h() {
        return this.hsl.h;
    }
    set h(newValue) {
        if (newValue >= 0 && newValue <= 360) {
            let currentHSL = this.hsl;
            currentHSL.h = newValue;
            this.currentColor = { ...this.hslToRgb(currentHSL.h, currentHSL.s, currentHSL.l), a: this.currentColor.a };
        }
        else {
            throw new Error("Invalid value for H (Hue). It should be between 0 and 360.");
        }
    }
    /**
     * The hex format of the color
     */
    get hex() {
        return this.rgbToHex(this.currentColor.r, this.currentColor.g, this.currentColor.b, this.currentColor.a);
    }
    set hex(hexString) {
        this.currentColor = this.hexStringToRgba(hexString);
    }
    /**
     * The rgb format of the color
     */
    get rgb() {
        const { r, g, b } = this.currentColor;
        return { r, g, b };
    }
    get rgbString() {
        const { r, g, b } = this.rgb;
        return `rgb(${r}, ${g}, ${b})`;
    }
    set rgb(value) {
        if (typeof value == 'string') {
            this.currentColor = { ...this.stringToRgba(value), a: this.currentColor.a };
        }
        else if (typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null) {
            value.r = Math.min(Math.max(value.r, 0), 255);
            value.g = Math.min(Math.max(value.g, 0), 255);
            value.b = Math.min(Math.max(value.b, 0), 255);
            this.currentColor = { ...value, a: this.currentColor.a };
        }
    }
    /**
     * The rgba format of the color
     */
    get rgba() {
        return this.currentColor;
    }
    set rgba(value) {
        if (typeof value == 'string') {
            this.currentColor = this.stringToRgba(value);
        }
        else if (typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null) {
            value.r = Math.min(Math.max(value.r, 0), 255);
            value.g = Math.min(Math.max(value.g, 0), 255);
            value.b = Math.min(Math.max(value.b, 0), 255);
            value.a = Math.min(Math.max(value.a, 0), 1);
            this.currentColor = value;
        }
    }
    get rgbaString() {
        const { r, g, b, a } = this.rgba;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    /**
     * The hsl format of the color
     */
    get hsl() {
        const { h, s, l } = this.rgbToHsl(this.currentColor.r, this.currentColor.g, this.currentColor.b);
        return { h, s, l };
    }
    get hslString() {
        const { h, s, l } = this.hsl;
        return `hsl(${h}, ${s}, ${l})`;
    }
    set hsl(value) {
        if (typeof value == 'string') {
            this.currentColor = { ...this.hslaStringToRgba(value), a: this.currentColor.a };
        }
        else if (typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null) {
            this.currentColor = { ...this.hslToRgb(value.h, value.s, value.l), a: this.currentColor.a };
        }
    }
    /**
    * The hsla format of the color
    */
    get hsla() {
        return this.rgbToHsla(this.currentColor.r, this.currentColor.g, this.currentColor.b, this.currentColor.a);
    }
    get hslaString() {
        const { h, s, l, a } = this.hsla;
        return `hsla(${h}, ${s}, ${l}, ${a})`;
    }
    set hsla(value) {
        if (typeof value == 'string') {
            this.currentColor = this.hslaStringToRgba(value);
        }
        else if (typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null) {
            this.currentColor = this.hslaToRgba(value.h, value.s, value.l, value.a);
        }
    }
    /**
     * The hsv format of the color
     */
    get hsv() {
        const { h, s, v } = this.rgbToHsv(this.currentColor.r, this.currentColor.g, this.currentColor.b);
        return { h, s, v };
    }
    get hsvString() {
        const { h, s, v } = this.hsv;
        return `hsv(${h}, ${s}%, ${v}%)`;
    }
    set hsv(value) {
        if (typeof value === 'string') {
            this.currentColor = { ...this.hsvaStringToRgba(value), a: this.currentColor.a };
        }
        else if (typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null) {
            this.currentColor = { ...this.hsvaToRgba(value.h, value.s, value.v, this.currentColor.a) };
        }
    }
    /**
     * The hsva format of the color
     */
    get hsva() {
        return this.rgbToHsva(this.currentColor.r, this.currentColor.g, this.currentColor.b, this.currentColor.a);
    }
    get hsvaString() {
        const { h, s, v, a } = this.hsva;
        return `hsva(${h}, ${s}%, ${v}%, ${a})`;
    }
    set hsva(value) {
        if (typeof value === 'string') {
            this.currentColor = this.hsvaStringToRgba(value);
        }
        else if (typeof value === 'object' &&
            !Array.isArray(value) &&
            value !== null) {
            this.currentColor = this.hsvaToRgba(value.h, value.s, value.v, value.a);
        }
    }
    get isLight() {
        const luminance = (0.299 * this.currentColor.r * this.currentColor.r + 0.587 * this.currentColor.g * this.currentColor.g + 0.114 * this.currentColor.b * this.currentColor.b);
        return luminance > 16256;
    }
    /**
     * Create a new color
     * @param {string} colorString - The color in hex or rgb format
     */
    constructor(colorString) {
        let currentColor;
        if (colorString === "" || !colorString) {
            colorString = "#ffffff";
        }
        let colorType = Lib.Color.getColorType(colorString);
        if (colorType !== -1) {
            if (colorType === Lib.Color.types.static) {
                let staticColor = Lib.Colors[colorString.toUpperCase()];
                if (staticColor instanceof Lib.Color) {
                    currentColor = staticColor.currentColor;
                }
                else {
                    throw new Error("Unknown color type");
                }
            }
            else if (colorType === Lib.Color.types.rgb || colorType === Lib.Color.types.rgba) {
                currentColor = this.stringToRgba(colorString);
            }
            else if (colorType === Lib.Color.types.hex) {
                currentColor = this.hexStringToRgba(colorString);
            }
            else if (colorType === Lib.Color.types.hsl || colorType === Lib.Color.types.hsla) {
                currentColor = this.hslaStringToRgba(colorString);
            }
            else {
                throw new Error("Unknown color type");
            }
        }
        else {
            throw new Error(`${colorString} is not a supported color`);
        }
        this._watcher = Aventus.Watcher.get({ currentColor }, () => {
            this.onColorChange.trigger();
        });
    }
    setColorTxt(colorString) {
        if (colorString === "" || !colorString) {
            colorString = "#ffffff";
        }
        let colorType = Lib.Color.getColorType(colorString);
        if (colorType !== -1) {
            if (colorType === Lib.Color.types.static) {
                let staticColor = Lib.Colors[colorString.toUpperCase()];
                if (staticColor instanceof Lib.Color) {
                    this.currentColor = staticColor.currentColor;
                }
                else {
                    throw new Error("Unknown color type");
                }
            }
            else if (colorType === Lib.Color.types.rgb || colorType === Lib.Color.types.rgba) {
                this.currentColor = this.stringToRgba(colorString);
            }
            else if (colorType === Lib.Color.types.hex) {
                this.currentColor = this.hexStringToRgba(colorString);
            }
            else if (colorType === Lib.Color.types.hsl || colorType === Lib.Color.types.hsla) {
                this.currentColor = this.hslaStringToRgba(colorString);
            }
            else {
                throw new Error("Unknown color type");
            }
        }
        else {
            throw new Error(`${colorString} is not a supported color`);
        }
    }
    onColorChange = new Aventus.Callback();
    hexStringToRgba(hexColorString) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i;
        hexColorString = hexColorString.replace(shorthandRegex, function (m, r, g, b, a) {
            return r + r + g + g + b + b + (a ? a + a : "");
            ;
        });
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hexColorString);
        if (!result) {
            console.error(`Invalid hex string : ${hexColorString}`);
            return {
                r: 0,
                g: 0,
                b: 0,
                a: 1
            };
        }
        else {
            return {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
                a: result[4] ? parseInt(result[4], 16) / 255 : 1
            };
        }
    }
    stringToRgba(rgbColorString) {
        let splitted = rgbColorString.replaceAll(/[\(\)rgb ]/g, "").split(",");
        let result = [];
        for (let i = 0; i < 4; i++) {
            if (i < 3) {
                result.push(Math.min(Math.max(parseInt(splitted[i]), 0), 255));
            }
            else {
                result.push(Math.min(Math.max(parseFloat(splitted[i]), 0), 1));
            }
        }
        return {
            r: result[0],
            g: result[1],
            b: result[2],
            a: result[3] || 1
        };
    }
    rgbToHex(r, g, b, a = 1) {
        let hex = "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
        if (a < 1) {
            let alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
            hex += alphaHex;
        }
        return hex;
    }
    hslStringToRgb(hslColorString) {
        let [h, s, l] = hslColorString.replaceAll(/[\(\)hsl% ]/g, "").split(",").map(Number);
        return this.hslToRgb(h, s, l);
    }
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max == min) {
            h = s = 0;
        }
        else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
                default: h = 0;
            }
            h /= 6;
        }
        return {
            h: this.round(h * 360),
            s: this.round(s * 100),
            l: this.round(l * 100)
        };
    }
    rgbToHsla(r, g, b, a) {
        let hsl = this.rgbToHsl(r, g, b);
        return { ...hsl, a: a };
    }
    hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        let c = (1 - Math.abs(2 * l - 1)) * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (0 <= h && h < 60) {
            r = c;
            g = x;
            b = 0;
        }
        else if (60 <= h && h < 120) {
            r = x;
            g = c;
            b = 0;
        }
        else if (120 <= h && h < 180) {
            r = 0;
            g = c;
            b = x;
        }
        else if (180 <= h && h < 240) {
            r = 0;
            g = x;
            b = c;
        }
        else if (240 <= h && h < 300) {
            r = x;
            g = 0;
            b = c;
        }
        else if (300 <= h && h <= 360) {
            r = c;
            g = 0;
            b = x;
        }
        return {
            r: this.round((r + m) * 255),
            g: this.round((g + m) * 255),
            b: this.round((b + m) * 255)
        };
    }
    hslaToRgba(h, s, l, a) {
        let rgb = this.hslToRgb(h, s, l);
        return { ...rgb, a: a };
    }
    hslaStringToRgba(hslaColorString) {
        let [h, s, l, a] = hslaColorString.replaceAll(/[\(\)hsla% ]/g, "").split(",").map(Number);
        return this.hslaToRgba(h, s, l, a);
    }
    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        let h, s, v = max;
        let delta = max - min;
        s = max === 0 ? 0 : delta / max;
        if (delta === 0) {
            h = 0;
        }
        else {
            switch (max) {
                case r:
                    h = (g - b) / delta + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / delta + 2;
                    break;
                case b:
                    h = (r - g) / delta + 4;
                    break;
                default:
                    h = 0;
            }
            h /= 6;
        }
        return {
            h: this.round(h * 360),
            s: this.round(s * 100),
            v: this.round(v * 100)
        };
    }
    hsvToRgb(h, s, v) {
        s /= 100;
        v /= 100;
        let c = v * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = v - c;
        let r = 0, g = 0, b = 0;
        if (0 <= h && h < 60) {
            r = c;
            g = x;
            b = 0;
        }
        else if (60 <= h && h < 120) {
            r = x;
            g = c;
            b = 0;
        }
        else if (120 <= h && h < 180) {
            r = 0;
            g = c;
            b = x;
        }
        else if (180 <= h && h < 240) {
            r = 0;
            g = x;
            b = c;
        }
        else if (240 <= h && h < 300) {
            r = x;
            g = 0;
            b = c;
        }
        else if (300 <= h && h <= 360) {
            r = c;
            g = 0;
            b = x;
        }
        return {
            r: this.round((r + m) * 255),
            g: this.round((g + m) * 255),
            b: this.round((b + m) * 255)
        };
    }
    rgbToHsva(r, g, b, a) {
        let hsv = this.rgbToHsv(r, g, b);
        return { ...hsv, a };
    }
    hsvaToRgba(h, s, v, a) {
        let rgb = this.hsvToRgb(h, s, v);
        return { ...rgb, a };
    }
    hsvaStringToRgba(hsvaColorString) {
        let [h, s, v, a] = hsvaColorString.replaceAll(/[\(\)hsva% ]/g, "").split(",").map(Number);
        return this.hsvaToRgba(h, s, v, a);
    }
    round(nb) {
        return Math.round(nb * 100) / 100;
    }
    /**
     * Print the color in hex format
     * @returns {string} - A pretty print of the color in hex format
     */
    toString() {
        return this.rgbToHex(this.currentColor.r, this.currentColor.g, this.currentColor.b, this.currentColor.a);
    }
}
Lib.Color.Namespace=`OneMoreUI.Lib`;
__as1(_.Lib, 'Color', Lib.Color);

Components.ColorPickerSelector = class ColorPickerSelector extends Aventus.WebComponent {
    static get observedAttributes() {return ["color"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'direction'() { return this.getStringAttr('direction') }
    set 'direction'(val) { this.setStringAttr('direction', val) }get 'opacity'() { return this.getBoolAttr('opacity') }
    set 'opacity'(val) { this.setBoolAttr('opacity', val) }get 'show_text_value'() { return this.getBoolAttr('show_text_value') }
    set 'show_text_value'(val) { this.setBoolAttr('show_text_value', val) }    get 'color'() { return this.getStringProp('color') }
    set 'color'(val) { this.setStringAttr('color', val) }    get 'colorTxt'() {
						return this.__watch["colorTxt"];
					}
					set 'colorTxt'(val) {
						this.__watch["colorTxt"] = val;
					}get 'hue'() {
						return this.__watch["hue"];
					}
					set 'hue'(val) {
						this.__watch["hue"] = val;
					}get 'alpha'() {
						return this.__watch["alpha"];
					}
					set 'alpha'(val) {
						this.__watch["alpha"] = val;
					}get 'presets'() {
						return this.__watch["presets"];
					}
					set 'presets'(val) {
						this.__watch["presets"] = val;
					}    _color;
    canEmit = false;
    internalSet = false;
    resizeObserver;
    onChange = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("colorTxt", ((target, action, path, value) => {
    target.onColorTxtChange();
}));this.__addWatchesActions("hue", ((target, action, path, value) => {
    target.changeHue();
}));this.__addWatchesActions("alpha", ((target, action, path, value) => {
    target.changeAlpha();
}));this.__addWatchesActions("presets", ((target, action, path, value) => {
    target.renderPresets();
}));    super.__registerWatchesActions();
}
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("color", ((target) => {
    if (!target.internalSet) {
        target.canEmit = false;
        target._color.setColorTxt(target.color);
        target.hue = target._color.hsv.h;
        target.alpha = target._color.a * 100;
        target.updatePositionFromColor(target._color);
        target.canEmit = true;
    }
})); }
    static __style = `:host{--_color-picker-selector-area-width: var(--color-picker-selector-area-width, 200px);--_color-picker-selector-panel-width: var(--color-picker-selector-panel-width, 200px);--_color-picker-selector-background-color: var(--color-picker-selector-background-color, var(--form-element-background, var(--surface)));--_color-picker-selector-border-radius: var(--color-picker-selector-border-radius, var(--form-element-border-radius, var(--border-radius-md)))}:host{background-color:var(--_color-picker-selector-background-color);border:1px solid var(--border-color);border-radius:var(--_color-picker-selector-border-radius);outline:none;width:max(var(--_color-picker-selector-area-width),var(--_color-picker-selector-panel-width));z-index:800}:host .style-wrapper{display:flex;flex-direction:column;width:100%}:host .style-wrapper .color-area{aspect-ratio:1/.5;background-image:linear-gradient(rgba(0, 0, 0, 0), #000),linear-gradient(90deg, #fff, var(--_color-picker-selector-area-color));border-top-left-radius:var(--_color-picker-selector-border-radius);border-top-right-radius:var(--_color-picker-selector-border-radius);cursor:pointer;margin:0 auto;position:relative;width:var(--_color-picker-selector-area-width)}:host .style-wrapper .color-area .area-dot{background-color:var(--_color-picker-selector-color-opacity);border:2px solid #fff;border-radius:var(--border-radius-round);height:10px;left:0;position:absolute;top:0;transform:translate(-50%, -50%);width:10px}:host .style-wrapper .color-panel{margin:0 auto;padding:15px;width:var(--_color-picker-selector-panel-width)}:host .style-wrapper .color-panel .color-hue{margin-bottom:5px;width:100%}:host .style-wrapper .color-panel .color-hue om-slider{--slider-background-image: linear-gradient(to right, red 0, #ff0 16.66%, #0f0 33.33%, #0ff 50%, #00f 66.66%, #f0f 83.33%, red 100%);--slider-active-background-color: transparent;--slider-background-color: transparent;--slider-dot-color: var(--_color-picker-selector-area-color);--slider-bar-height: 8px;min-width:auto;width:100%}:host .style-wrapper .color-panel .color-alpha{display:none;margin-top:5px;position:relative}:host .style-wrapper .color-panel .color-alpha om-slider{--slider-background-color: transparent;--slider-active-background-color: transparent;--slider-bar-height: 8px;min-width:auto;position:relative;width:100%;z-index:2}:host .style-wrapper .color-panel .color-alpha .bar{background-image:repeating-linear-gradient(45deg, #aaa 25%, transparent 25%, transparent 75%, #aaa 75%, #aaa),repeating-linear-gradient(45deg, #aaa 25%, #fff 25%, #fff 75%, #aaa 75%, #aaa);background-position:0 0,2px 2px;background-size:4px 4px;border-radius:var(--_color-picker-selector-border-radius);inset:0;position:absolute;width:100%;z-index:1}:host .style-wrapper .color-panel .color-alpha .bar-color{background-image:linear-gradient(90deg, rgba(0, 0, 0, 0), var(--_color-picker-selector-color-opacity));border-radius:var(--_color-picker-selector-border-radius);inset:0;position:absolute;width:100%;z-index:2}:host .style-wrapper .color-panel .color-alpha .dot{background-image:repeating-linear-gradient(45deg, #aaa 25%, transparent 25%, transparent 75%, #aaa 75%, #aaa),repeating-linear-gradient(45deg, #aaa 25%, #fff 25%, #fff 75%, #aaa 75%, #aaa);background-position:0 0,2px 2px;background-size:4px 4px;border-radius:var(--border-radius-round);inset:0;position:absolute;z-index:1}:host .style-wrapper .color-panel .color-alpha .dot-color{background-color:var(--_color-picker-selector-color);border-radius:var(--border-radius-round);inset:0;position:absolute;z-index:2}:host .style-wrapper .color-panel .color-result{align-items:center;display:flex;flex-direction:row;gap:10px;justify-content:center;margin-top:20px}:host .style-wrapper .color-panel .color-result .color-preview{background-image:repeating-linear-gradient(45deg, #aaa 25%, transparent 25%, transparent 75%, #aaa 75%, #aaa),repeating-linear-gradient(45deg, #aaa 25%, #fff 25%, #fff 75%, #aaa 75%, #aaa);background-position:0 0,2px 2px;background-size:4px 4px;border-radius:var(--border-radius-round);flex-shrink:0;height:25px;overflow:hidden;position:relative;width:25px}:host .style-wrapper .color-panel .color-result .color-preview::after{background-color:var(--_color-picker-selector-color);content:"";inset:0;position:absolute}:host .style-wrapper .color-panel .color-result .color-text{display:none;width:calc(100% - 35px)}:host .style-wrapper .color-panel .color-result .color-text om-input{height:25px;min-width:auto;width:100%}:host .style-wrapper .color-panel .color-preset:not(:empty){align-items:center;display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-top:20px;width:100%}:host .style-wrapper .color-panel .color-preset:not(:empty) .preset{border-radius:var(--border-radius-round);flex-shrink:0;height:20px;width:20px}:host([direction=horizontal]){width:fit-content}:host([direction=horizontal]) .style-wrapper{display:flex;flex-direction:row}:host([direction=horizontal]) .style-wrapper .color-area{aspect-ratio:auto;border-bottom-left-radius:var(--_color-picker-selector-border-radius);border-top-right-radius:0}:host([opacity]) .style-wrapper .color-panel .color-alpha{display:block}:host([show_text_value]) .style-wrapper .color-panel .color-result .color-text{display:block}`;
    constructor() {
        super();
        this._color = new Lib.Color("#FFFFFF");
        this._color.onColorChange.add(() => {
            this.applyColorChange();
        });
    }
    __getStatic() {
        return ColorPickerSelector;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ColorPickerSelector.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="style-wrapper" _id="colorpickerselector_0">    <div class="color-area" _id="colorpickerselector_1">        <div class="area-dot" _id="colorpickerselector_2"></div>    </div>    <div class="color-panel">        <div class="color-hue">            <om-slider min="0" max="360" popup="never" _id="colorpickerselector_3"></om-slider>        </div>        <div class="color-alpha">            <om-slider min="0" max="100" popup="never" _id="colorpickerselector_4">                <span class="bar" slot="bar"></span>                <span class="bar-color" slot="bar"></span>                <span class="dot" slot="dot"></span>                <span class="dot-color" slot="dot"></span>            </om-slider>        </div>        <div class="color-result">            <div class="color-preview"></div>            <div class="color-text">                <om-input _id="colorpickerselector_5"></om-input>            </div>        </div>        <div class="color-preset" _id="colorpickerselector_6"></div>    </div></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "styleWrapper",
      "ids": [
        "colorpickerselector_0"
      ]
    },
    {
      "name": "areaEl",
      "ids": [
        "colorpickerselector_1"
      ]
    },
    {
      "name": "areaDotEl",
      "ids": [
        "colorpickerselector_2"
      ]
    },
    {
      "name": "presetEl",
      "ids": [
        "colorpickerselector_6"
      ]
    }
  ],
  "bindings": [
    {
      "id": "colorpickerselector_3",
      "injectionName": "value",
      "eventNames": [
        "onChange"
      ],
      "inject": (c) => c.comp.__b4cf53c23da67293a9ba13bea07e4ab0method0(),
      "extract": (c, v) => c.comp.__b4cf53c23da67293a9ba13bea07e4ab0method1(v),
      "once": true,
      "isCallback": true
    },
    {
      "id": "colorpickerselector_4",
      "injectionName": "value",
      "eventNames": [
        "onChange"
      ],
      "inject": (c) => c.comp.__b4cf53c23da67293a9ba13bea07e4ab0method2(),
      "extract": (c, v) => c.comp.__b4cf53c23da67293a9ba13bea07e4ab0method3(v),
      "once": true,
      "isCallback": true
    },
    {
      "id": "colorpickerselector_5",
      "injectionName": "value",
      "eventNames": [
        "onChange"
      ],
      "inject": (c) => c.comp.__b4cf53c23da67293a9ba13bea07e4ab0method4(),
      "extract": (c, v) => c.comp.__b4cf53c23da67293a9ba13bea07e4ab0method5(v),
      "once": true,
      "isCallback": true
    }
  ]
}); }
    getClassName() {
        return "ColorPickerSelector";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('direction')){ this['direction'] = 'horizontal'; }if(!this.hasAttribute('opacity')) { this.attributeChangedCallback('opacity', false, false); }if(!this.hasAttribute('show_text_value')) {this.setAttribute('show_text_value' ,'true'); }if(!this.hasAttribute('color')){ this['color'] = "#ffffff"; } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["colorTxt"] = "";w["hue"] = 0;w["alpha"] = 100;w["presets"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('direction');this.__upgradeProperty('opacity');this.__upgradeProperty('show_text_value');this.__upgradeProperty('color');this.__correctGetter('colorTxt');this.__correctGetter('hue');this.__correctGetter('alpha');this.__correctGetter('presets'); }
    __listBoolProps() { return ["opacity","show_text_value"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    onColorTxtChange() {
        if (Lib.Color.isValid(this.colorTxt) && !this.internalSet) {
            this._color.setColorTxt(this.colorTxt);
            this.hue = this._color.hsv.h;
            this.alpha = this._color.a * 100;
            this.updatePositionFromColor(this._color);
        }
    }
    emitChange() {
        if (this.canEmit) {
            this.onChange.trigger(this.color);
        }
    }
    changeHue() {
        this._color.h = this.hue;
        this.styleWrapper.style.setProperty("--_color-picker-selector-area-color", `hsl(${this.hue}, 100%, 50%)`);
    }
    changeAlpha() {
        this._color.a = this.alpha / 100;
    }
    applyColorChange() {
        this.styleWrapper.style.setProperty("--_color-picker-selector-color", this._color.hex);
        this.styleWrapper.style.setProperty("--_color-picker-selector-area-color", `hsl(${this.hue}, 100%, 50%)`);
        this.styleWrapper.style.setProperty("--_color-picker-selector-color-opacity", this._color.rgbString);
        this.internalSet = true;
        let hex = this._color.hex;
        if (this.colorTxt != hex) {
            this.colorTxt = this._color.hex;
        }
        if (this.color != hex) {
            this.color = this._color.hex;
            this.emitChange();
        }
        this.internalSet = false;
    }
    addPressManager() {
        let clientRect;
        const calc = (e) => {
            let positionX = e.clientX - clientRect.x;
            let positionY = e.clientY - clientRect.y;
            if (positionX < 0)
                positionX = 0;
            else if (positionX > clientRect.width)
                positionX = clientRect.width;
            if (positionY < 0)
                positionY = 0;
            else if (positionY > clientRect.height)
                positionY = clientRect.height;
            this.areaDotEl.style.left = positionX + 'px';
            this.areaDotEl.style.top = positionY + 'px';
            this.updateColorFromPosition(positionX, positionY);
        };
        new Aventus.DragAndDrop({
            element: this.areaEl,
            applyDrag: false,
            offsetDrag: 0,
            onPointerDown: (e) => {
                clientRect = this.areaEl.getBoundingClientRect();
                calc(e);
            },
            onMove: (e, position) => {
                calc(e);
            }
        });
    }
    updateColorFromPosition(x, y) {
        const { width, height } = this.areaEl.getBoundingClientRect();
        const hsv = {
            h: this.hue,
            s: x / width * 100,
            v: 100 - (y / height * 100),
        };
        this._color.hsv = hsv;
    }
    updatePositionFromColor(color) {
        const { width, height } = this.areaEl.getBoundingClientRect();
        const { h, s, v } = color.hsv;
        const x = width * s / 100;
        const y = (100 - v) * height / 100;
        this.areaDotEl.style.left = x + 'px';
        this.areaDotEl.style.top = y + 'px';
    }
    renderPresets() {
        this.presetEl.innerHTML = '';
        const createPreset = (color) => {
            const el = document.createElement("div");
            el.classList.add("preset");
            el.style.backgroundColor = color;
            el.addEventListener("click", () => {
                this._color.setColorTxt(color);
                this.hue = this._color.hsv.h;
                this.alpha = this._color.a * 100;
                this.updatePositionFromColor(this._color);
            });
            this.presetEl.appendChild(el);
        };
        for (const preset of this.presets) {
            createPreset(preset);
        }
    }
    addObserver() {
        this.resizeObserver = new Aventus.ResizeObserver(() => {
            this.updatePositionFromColor(this._color);
        });
        this.resizeObserver.observe(this.areaEl);
    }
    postCreation() {
        this.hue = this._color.hsv.h;
        this.alpha = this._color.a * 100;
        this.applyColorChange();
        this.addPressManager();
        this.renderPresets();
        this.updatePositionFromColor(this._color);
        this.addObserver();
    }
    postDestruction() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = undefined;
        }
    }
    __b4cf53c23da67293a9ba13bea07e4ab0method0() {
        return this.hue;
    }
    __b4cf53c23da67293a9ba13bea07e4ab0method1(v) {
        if (this) {
            this.hue = v;
        }
    }
    __b4cf53c23da67293a9ba13bea07e4ab0method2() {
        return this.alpha;
    }
    __b4cf53c23da67293a9ba13bea07e4ab0method3(v) {
        if (this) {
            this.alpha = v;
        }
    }
    __b4cf53c23da67293a9ba13bea07e4ab0method4() {
        return this.colorTxt;
    }
    __b4cf53c23da67293a9ba13bea07e4ab0method5(v) {
        if (this) {
            this.colorTxt = v;
        }
    }
}
Components.ColorPickerSelector.Namespace=`OneMoreUI.Components`;
Components.ColorPickerSelector.Tag=`om-color-picker-selector`;
__as1(_.Components, 'ColorPickerSelector', Components.ColorPickerSelector);
if(!window.customElements.get('om-color-picker-selector')){window.customElements.define('om-color-picker-selector', Components.ColorPickerSelector);Aventus.WebComponentInstance.registerDefinition(Components.ColorPickerSelector);}

let PositionTools=class PositionTools {
    /**
     * Calculates the optimal position for the menu based on the reference element's rectangle
     * and the preferred position, ensuring it stays within the viewport.
     */
    static calculatePosition(el, rect, position, edge_gap, position_gap) {
        el.style.left = -10000 + 'px';
        el.style.top = '0';
        el.style.bottom = '';
        el.style.position = 'absolute';
        el.style.right = '';
        document.body.appendChild(el);
        let height = el.offsetHeight;
        let width = el.offsetWidth;
        document.body.removeChild(el);
        const getDefaultResult = () => {
            return {
                top: null,
                left: null,
                bottom: null,
                right: null,
                maxHeight: document.body.offsetHeight - 2 * edge_gap,
                maxWidth: document.body.offsetWidth - 2 * edge_gap,
                found: false
            };
        };
        let info = {
            maxHeight: document.body.offsetHeight,
            maxWidth: document.body.offsetWidth,
            menuHeight: height,
            rect: rect,
            menuWidth: width,
        };
        let result = getDefaultResult();
        if (position == 'bottom right') {
            this
                .getPositionBottomRight(info, result, edge_gap, position_gap)
                .getPositionBottomLeft(info, result, edge_gap, position_gap)
                .getPositionTopRight(info, result, edge_gap, position_gap)
                .getPositionTopLeft(info, result, edge_gap, position_gap);
        }
        else if (position == 'bottom left') {
            this
                .getPositionBottomLeft(info, result, edge_gap, position_gap)
                .getPositionBottomRight(info, result, edge_gap, position_gap)
                .getPositionTopLeft(info, result, edge_gap, position_gap)
                .getPositionTopRight(info, result, edge_gap, position_gap);
        }
        else if (position == 'top left') {
            this
                .getPositionTopLeft(info, result, edge_gap, position_gap)
                .getPositionTopRight(info, result, edge_gap, position_gap)
                .getPositionBottomLeft(info, result, edge_gap, position_gap)
                .getPositionBottomRight(info, result, edge_gap, position_gap);
        }
        else if (position == 'top right') {
            this
                .getPositionTopRight(info, result, edge_gap, position_gap)
                .getPositionTopLeft(info, result, edge_gap, position_gap)
                .getPositionBottomRight(info, result, edge_gap, position_gap)
                .getPositionBottomLeft(info, result, edge_gap, position_gap);
        }
        else if (position == 'left top') {
            this
                .getPositionLeftTop(info, result, edge_gap, position_gap)
                .getPositionLeftBottom(info, result, edge_gap, position_gap)
                .getPositionRightTop(info, result, edge_gap, position_gap)
                .getPositionRightBottom(info, result, edge_gap, position_gap);
        }
        else if (position == 'left bottom') {
            this
                .getPositionLeftBottom(info, result, edge_gap, position_gap)
                .getPositionLeftTop(info, result, edge_gap, position_gap)
                .getPositionRightBottom(info, result, edge_gap, position_gap)
                .getPositionRightTop(info, result, edge_gap, position_gap);
        }
        else if (position == 'right top') {
            this
                .getPositionRightTop(info, result, edge_gap, position_gap)
                .getPositionRightBottom(info, result, edge_gap, position_gap)
                .getPositionLeftTop(info, result, edge_gap, position_gap)
                .getPositionLeftBottom(info, result, edge_gap, position_gap);
        }
        else if (position == 'right bottom') {
            this
                .getPositionRightBottom(info, result, edge_gap, position_gap)
                .getPositionRightTop(info, result, edge_gap, position_gap)
                .getPositionLeftBottom(info, result, edge_gap, position_gap)
                .getPositionLeftTop(info, result, edge_gap, position_gap);
        }
        el.style.left = '';
        el.style.top = '';
        el.style.bottom = '';
        el.style.position = '';
        el.style.right = '';
        return result;
    }
    /**
     * Resets the given MenuPositionResult object to its default state.
     */
    static resetResult(result, edge_gap) {
        result.top = null;
        result.left = null;
        result.bottom = null;
        result.right = null;
        result.maxHeight = document.body.offsetHeight - 2 * edge_gap;
        result.maxWidth = document.body.offsetWidth - 2 * edge_gap;
    }
    /**
     * Checks if a calculated position value is valid and updates the result.
     */
    static checkValue(name, value, info, result, edge_gap) {
        const { maxHeight, maxWidth, menuHeight, menuWidth } = info;
        if (name == "top" || name == "bottom") {
            if (menuHeight >= maxHeight - 2 * edge_gap) {
                if (value <= maxHeight / 2) {
                    result[name] = value;
                    result.maxHeight = (maxHeight - 2 * edge_gap) - value;
                }
                else {
                    return false;
                }
            }
            else {
                if (value + menuHeight <= maxHeight - edge_gap) {
                    result[name] = value;
                }
                else {
                    return false;
                }
            }
        }
        else {
            if (menuWidth >= maxWidth - 2 * edge_gap) {
                if (value <= maxWidth / 2) {
                    result[name] = value;
                    result.maxWidth = (maxWidth - 2 * edge_gap) - value;
                }
                else {
                    return false;
                }
            }
            else {
                if (value + menuWidth < maxWidth - edge_gap) {
                    result[name] = value;
                }
                else {
                    return false;
                }
            }
        }
        return true;
    }
    /**
     * Attempts to position the menu at the bottom-left of the reference element.
     */
    static getPositionBottomLeft(info, result, edge_gap, position_gap) {
        if (result.found)
            return this;
        const { maxWidth, rect } = info;
        this.resetResult(result, edge_gap);
        const right = maxWidth - (rect.x + rect.width);
        const top = rect.y + rect.height + position_gap;
        if (!this.checkValue('right', right, info, result, edge_gap))
            return this;
        if (!this.checkValue('top', top, info, result, edge_gap))
            return this;
        result.found = true;
        return this;
    }
    /**
     * Attempts to position the menu at the bottom-right of the reference element.
     */
    static getPositionBottomRight(info, result, edge_gap, position_gap) {
        if (result.found)
            return this;
        const { rect } = info;
        this.resetResult(result, edge_gap);
        const left = rect.x;
        const top = rect.y + rect.height + position_gap;
        if (!this.checkValue('left', left, info, result, edge_gap))
            return this;
        if (!this.checkValue('top', top, info, result, edge_gap))
            return this;
        result.found = true;
        return this;
    }
    /**
     * Attempts to position the menu at the top-left of the reference element.
     */
    static getPositionTopLeft(info, result, edge_gap, position_gap) {
        if (result.found)
            return this;
        const { maxHeight, maxWidth, rect } = info;
        this.resetResult(result, edge_gap);
        const right = maxWidth - (rect.x + rect.width);
        const bottom = maxHeight - rect.y + position_gap;
        if (!this.checkValue('right', right, info, result, edge_gap))
            return this;
        if (!this.checkValue('bottom', bottom, info, result, edge_gap))
            return this;
        result.found = true;
        return this;
    }
    /**
     * Attempts to position the menu at the top-right of the reference element.
     */
    static getPositionTopRight(info, result, edge_gap, position_gap) {
        if (result.found)
            return this;
        const { maxHeight, rect } = info;
        this.resetResult(result, edge_gap);
        const left = rect.x;
        const bottom = maxHeight - rect.y + position_gap;
        if (!this.checkValue('left', left, info, result, edge_gap))
            return this;
        if (!this.checkValue('bottom', bottom, info, result, edge_gap))
            return this;
        result.found = true;
        return this;
    }
    /**
     * Attempts to position the menu at the left-top of the reference element.
     */
    static getPositionLeftTop(info, result, edge_gap, position_gap) {
        if (result.found)
            return this;
        const { maxHeight, maxWidth, rect } = info;
        this.resetResult(result, edge_gap);
        const right = maxWidth - rect.x + position_gap;
        const bottom = maxHeight - (rect.y + rect.height);
        if (!this.checkValue('right', right, info, result, edge_gap))
            return this;
        if (!this.checkValue('bottom', bottom, info, result, edge_gap))
            return this;
        result.found = true;
        return this;
    }
    /**
     * Attempts to position the menu at the left-bottom of the reference element.
     */
    static getPositionLeftBottom(info, result, edge_gap, position_gap) {
        if (result.found)
            return this;
        const { maxWidth, rect } = info;
        this.resetResult(result, edge_gap);
        const right = maxWidth - rect.x + position_gap;
        const top = rect.y;
        if (!this.checkValue('right', right, info, result, edge_gap))
            return this;
        if (!this.checkValue('top', top, info, result, edge_gap))
            return this;
        result.found = true;
        return this;
    }
    /**
     * Attempts to position the menu at the right-top of the reference element.
     */
    static getPositionRightTop(info, result, edge_gap, position_gap) {
        if (result.found)
            return this;
        const { maxHeight, rect } = info;
        this.resetResult(result, edge_gap);
        const left = rect.x + rect.width + position_gap;
        const bottom = maxHeight - (rect.y + rect.height);
        if (!this.checkValue('left', left, info, result, edge_gap))
            return this;
        if (!this.checkValue('bottom', bottom, info, result, edge_gap))
            return this;
        result.found = true;
        return this;
    }
    /**
     * Attempts to position the menu at the right-bottom of the reference element.
     */
    static getPositionRightBottom(info, result, edge_gap, position_gap) {
        if (result.found)
            return this;
        const { maxWidth, rect } = info;
        this.resetResult(result, edge_gap);
        const left = rect.x + rect.width + position_gap;
        const top = rect.y;
        if (!this.checkValue('left', left, info, result, edge_gap))
            return this;
        if (!this.checkValue('top', top, info, result, edge_gap))
            return this;
        result.found = true;
        return this;
    }
}
PositionTools.Namespace=`OneMoreUI`;
__as1(_, 'PositionTools', PositionTools);

Components.Form.ColorPicker = class ColorPicker extends Components.Form.FormElement {
    static get observedAttributes() {return ["name", "label", "icon", "placeholder", "direction", "opacity", "show_text_value", "value"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'is_focus'() { return this.getBoolAttr('is_focus') }
    set 'is_focus'(val) { this.setBoolAttr('is_focus', val) }get 'preview_position'() { return this.getStringAttr('preview_position') }
    set 'preview_position'(val) { this.setStringAttr('preview_position', val) }get 'icon_position'() { return this.getStringAttr('icon_position') }
    set 'icon_position'(val) { this.setStringAttr('icon_position', val) }    get 'name'() { return this.getStringProp('name') }
    set 'name'(val) { this.setStringAttr('name', val) }get 'label'() { return this.getStringProp('label') }
    set 'label'(val) { this.setStringAttr('label', val) }get 'icon'() { return this.getStringProp('icon') }
    set 'icon'(val) { this.setStringAttr('icon', val) }get 'placeholder'() { return this.getStringProp('placeholder') }
    set 'placeholder'(val) { this.setStringAttr('placeholder', val) }get 'direction'() { return this.getStringProp('direction') }
    set 'direction'(val) { this.setStringAttr('direction', val) }get 'opacity'() { return this.getBoolProp('opacity') }
    set 'opacity'(val) { this.setBoolAttr('opacity', val) }get 'show_text_value'() { return this.getBoolProp('show_text_value') }
    set 'show_text_value'(val) { this.setBoolAttr('show_text_value', val) }get 'value'() { return this.getStringProp('value') }
    set 'value'(val) { this.setStringAttr('value', val) }    get 'presets'() {
						return this.__watch["presets"];
					}
					set 'presets'(val) {
						this.__watch["presets"] = val;
					}    errorsTxt = {};
    defaultErrorsTxt = {
        notColor: "You must provide a valid color",
    };
    __registerWatchesActions() {
    this.__addWatchesActions("presets");    super.__registerWatchesActions();
}
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("value", ((target) => {
    target.onValueChange(target.value);
})); }
    static __style = `:host{--_color-picker-bg: var(--color-picker-bg, var(--form-element-bg));--_color-picker-fg: var(--color-picker-fg, var(--form-element-fg));--_color-picker-border: var(--color-picker-border, var(--form-element-border));--_color-picker-border-radius: var(--color-picker-border-radius, var(--form-element-border-radius));--_color-picker-preview-border-radius: var(--color-picker-preview-border-radius, var(--border-radius-md, 0))}:host{width:100%}:host label{display:none;font-size:var(--font-size-sm);font-weight:500;line-height:var(--line-height-sm)}:host .input{align-items:center;background-color:var(--_color-picker-bg);border-radius:var(--_color-picker-border-radius);display:flex;gap:.5rem;height:100%;margin-top:0;overflow:hidden;padding:.5rem 1rem;position:relative;width:100%}:host .input .icon{color:color-mix(in oklab, var(--_color-picker-fg) 40%, transparent);display:block;font-size:var(--font-size)}:host .input .preview{aspect-ratio:1/1;background-image:repeating-linear-gradient(45deg, #aaa 25%, transparent 25%, transparent 75%, #aaa 75%, #aaa),repeating-linear-gradient(45deg, #aaa 25%, #fff 25%, #fff 75%, #aaa 75%, #aaa);background-position:0 0,2px 2px;background-size:4px 4px;border-radius:var(--_color-picker-preview-border-radius);cursor:pointer;display:block;height:calc(100% - 10px);position:relative}:host .input .preview::after{background-color:var(--_color-picker-selected-color);border-radius:var(--_color-picker-preview-border-radius);content:"";inset:0;position:absolute}:host .input input{background-color:rgba(0,0,0,0);border:none;color:var(--_color-picker-fg);display:block;flex-grow:1;font-size:var(--font-size);height:var(--line-height);margin:0;margin-top:1px;min-width:0;outline:none;padding:0}:host .input input::placeholder{color:color-mix(in oklab, var(--_color-picker-fg) 40%, transparent)}:host .input::after{border:var(--_color-picker-border);border-radius:var(--_color-picker-border-radius);content:"";display:block;inset:0px;pointer-events:none;position:absolute}:host .errors{color:var(--error);display:none;flex-direction:column;font-size:var(--font-size-sm);gap:.25rem;line-height:var(--line-height-sm);margin:.5rem;margin-bottom:0}:host .picker{display:none}:host([is_focus]) .input{border-color:var(--primary)}:host([is_focus]) .input::after{border-color:var(--primary);border-width:2px}:host([has_errors]) .input::after{border-color:var(--error)}:host([has_errors]) .errors{display:flex}:host([label]:not([label=""])) label{display:flex}:host([label]:not([label=""])) .input{height:auto;margin-top:.5rem}:host([label]:not([label=""])) .input .preview{height:var(--line-height)}:host([readonly]){pointer-events:none}:host([disabled]){pointer-events:none}:host([disabled]) label{color:color-mix(in oklab, var(--surface-content) 50%, var(--surface))}:host([disabled]) .input{background-color:color-mix(in oklab, var(--surface-content) 10%, transparent)}:host([disabled]) .input input{color:color-mix(in oklab, var(--surface-content) 50%, var(--surface))}:host([disabled]) .input::after{border:none}`;
    constructor() {
        super();
        this.onscrollEvent = this.onscrollEvent.bind(this);
    }
    __getStatic() {
        return ColorPicker;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ColorPicker.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        slots: { 'prepend':`<slot name="prepend">        <template _id="colorpicker_2"></template>        <template _id="colorpicker_3"></template>    </slot>`,'append':`<slot name="append">        <template _id="colorpicker_5"></template>         <template _id="colorpicker_6"></template>    </slot>` }, 
        blocks: { 'default':`<label _id="colorpicker_0"></label><div class="input" _id="colorpicker_1">    <slot name="prepend">        <template _id="colorpicker_2"></template>        <template _id="colorpicker_3"></template>    </slot>    <input autocomplete="off" _id="colorpicker_4" />    <slot name="append">        <template _id="colorpicker_5"></template>         <template _id="colorpicker_6"></template>    </slot></div><div class="errors">    <template _id="colorpicker_7"></template></div><om-color-picker-selector class="picker" _id="colorpicker_9"></om-color-picker-selector>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "containerEl",
      "ids": [
        "colorpicker_1"
      ]
    },
    {
      "name": "inputEl",
      "ids": [
        "colorpicker_4"
      ]
    },
    {
      "name": "pickerEl",
      "ids": [
        "colorpicker_9"
      ]
    }
  ],
  "content": {
    "colorpicker_0°for": {
      "fct": (c) => `${c.print(c.comp.__edfc2d61f33bd1551864b63413a35f79method5())}`,
      "once": true
    },
    "colorpicker_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__edfc2d61f33bd1551864b63413a35f79method6())}`,
      "once": true
    },
    "colorpicker_4°id": {
      "fct": (c) => `${c.print(c.comp.__edfc2d61f33bd1551864b63413a35f79method5())}`,
      "once": true
    },
    "colorpicker_4°name": {
      "fct": (c) => `${c.print(c.comp.__edfc2d61f33bd1551864b63413a35f79method5())}`,
      "once": true
    },
    "colorpicker_4°placeholder": {
      "fct": (c) => `${c.print(c.comp.__edfc2d61f33bd1551864b63413a35f79method7())}`,
      "once": true
    },
    "colorpicker_4°tabindex": {
      "fct": (c) => `${c.print(c.comp.__edfc2d61f33bd1551864b63413a35f79method9())}`
    }
  },
  "injection": [
    {
      "id": "colorpicker_4",
      "injectionName": "value",
      "inject": (c) => c.comp.__edfc2d61f33bd1551864b63413a35f79method8(),
      "once": true
    },
    {
      "id": "colorpicker_9",
      "injectionName": "direction",
      "inject": (c) => c.comp.__edfc2d61f33bd1551864b63413a35f79method11(),
      "once": true
    },
    {
      "id": "colorpicker_9",
      "injectionName": "opacity",
      "inject": (c) => c.comp.__edfc2d61f33bd1551864b63413a35f79method12(),
      "once": true
    },
    {
      "id": "colorpicker_9",
      "injectionName": "show_text_value",
      "inject": (c) => c.comp.__edfc2d61f33bd1551864b63413a35f79method13(),
      "once": true
    },
    {
      "id": "colorpicker_9",
      "injectionName": "presets",
      "inject": (c) => c.comp.__edfc2d61f33bd1551864b63413a35f79method14(),
      "once": true
    }
  ],
  "events": [
    {
      "eventName": "input",
      "id": "colorpicker_4",
      "fct": (e, c) => c.comp.onInputChanged(e)
    }
  ]
});const templ4 = new Aventus.Template(this);templ4.setTemplate(`         <div _id="colorpicker_8"></div>    `);templ4.setActions({
  "content": {
    "colorpicker_8°@HTML": {
      "fct": (c) => `${c.print(c.comp.__edfc2d61f33bd1551864b63413a35f79method10(c.data.error))}`,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'colorpicker_7',
                    template: templ4,
                simple:{data: "this.errors",item:"error"}});const templ0 = new Aventus.Template(this);templ0.setTemplate(`            <mi-icon class="icon" icon="colorize"></mi-icon>        `);this.__getStatic().__template.addIf({
                    anchorId: 'colorpicker_2',
                    parts: [{once: true,
                    condition: (c) => c.comp.__edfc2d61f33bd1551864b63413a35f79method0(),
                    template: templ0
                }]
            });const templ1 = new Aventus.Template(this);templ1.setTemplate(`            <div class="preview"></div>        `);this.__getStatic().__template.addIf({
                    anchorId: 'colorpicker_3',
                    parts: [{once: true,
                    condition: (c) => c.comp.__edfc2d61f33bd1551864b63413a35f79method1(),
                    template: templ1
                }]
            });const templ2 = new Aventus.Template(this);templ2.setTemplate(`            <div class="preview"></div>        `);this.__getStatic().__template.addIf({
                    anchorId: 'colorpicker_5',
                    parts: [{once: true,
                    condition: (c) => c.comp.__edfc2d61f33bd1551864b63413a35f79method2(),
                    template: templ2
                }]
            });const templ3 = new Aventus.Template(this);templ3.setTemplate(`            <mi-icon class="icon" icon="colorize"></mi-icon>        `);this.__getStatic().__template.addIf({
                    anchorId: 'colorpicker_6',
                    parts: [{once: true,
                    condition: (c) => c.comp.__edfc2d61f33bd1551864b63413a35f79method3(),
                    template: templ3
                }]
            }); }
    getClassName() {
        return "ColorPicker";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('is_focus')) { this.attributeChangedCallback('is_focus', false, false); }if(!this.hasAttribute('preview_position')){ this['preview_position'] = 'before'; }if(!this.hasAttribute('icon_position')){ this['icon_position'] = 'after'; }if(!this.hasAttribute('name')){ this['name'] = undefined; }if(!this.hasAttribute('label')){ this['label'] = undefined; }if(!this.hasAttribute('icon')){ this['icon'] = undefined; }if(!this.hasAttribute('placeholder')){ this['placeholder'] = undefined; }if(!this.hasAttribute('direction')){ this['direction'] = 'horizontal'; }if(!this.hasAttribute('opacity')) { this.attributeChangedCallback('opacity', false, false); }if(!this.hasAttribute('show_text_value')) {this.setAttribute('show_text_value' ,'true'); }if(!this.hasAttribute('value')){ this['value'] = ""; } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["presets"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('is_focus');this.__upgradeProperty('preview_position');this.__upgradeProperty('icon_position');this.__upgradeProperty('name');this.__upgradeProperty('label');this.__upgradeProperty('icon');this.__upgradeProperty('placeholder');this.__upgradeProperty('direction');this.__upgradeProperty('opacity');this.__upgradeProperty('show_text_value');this.__upgradeProperty('value');this.__correctGetter('presets'); }
    __listBoolProps() { return ["is_focus","opacity","show_text_value"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    onValueChange(value) {
        super.onValueChange(value);
        this.containerEl.style.setProperty('--_color-picker-selected-color', this.value ?? 'transparent');
    }
    showPicker() {
        let box = this.getBoundingClientRect();
        const result = PositionTools.calculatePosition(this.pickerEl, box, "bottom right", 20, 2);
        this.pickerEl.style.position = 'absolute';
        this.pickerEl.style.top = result.top !== null ? result.top + 'px' : '';
        this.pickerEl.style.left = result.left !== null ? result.left + 'px' : '';
        this.pickerEl.style.bottom = result.bottom !== null ? result.bottom + 'px' : '';
        this.pickerEl.style.right = result.right !== null ? result.right + 'px' : '';
        this.pickerEl.setAttribute("tabindex", "-1");
        this.pickerEl.colorTxt = this.value ?? "#ffffff";
        document.body.appendChild(this.pickerEl);
        this.pickerEl.focus();
    }
    hidePicker() {
        this.shadowRoot.appendChild(this.pickerEl);
        this.validate();
    }
    manageFocus() {
        let blurTimeout = 0;
        let blur = () => {
            blurTimeout = setTimeout(() => {
                this.shadowRoot.appendChild(this.pickerEl);
                this.hidePicker();
            }, 100);
        };
        this.inputEl.addEventListener("blur", () => {
            blur();
        });
        this.pickerEl.addEventListener("blur", () => {
            blur();
        });
        this.inputEl.addEventListener("focus", () => {
            this.show();
            clearTimeout(blurTimeout);
        });
        this.pickerEl.addEventListener("focus", () => {
            clearTimeout(blurTimeout);
        });
    }
    show() {
        this.is_focus = true;
        this.errors = [];
        this.showPicker();
    }
    localValidation() {
        let errors = [];
        if (this.inputEl.value && !Lib.Color.isValid(this.inputEl.value)) {
            const txt = this.errorsTxt.notColor ?? this.defaultErrorsTxt.notColor;
            errors.push(txt);
        }
        return errors;
    }
    onInputChanged() {
        if (Lib.Color.isValid(this.inputEl.value)) {
            this.triggerChange(this.inputEl.value);
            this.pickerEl.colorTxt = this.inputEl.value;
        }
    }
    onscrollEvent() {
        this.hidePicker();
        this.inputEl.blur();
    }
    postDestruction() {
        super.postDestruction();
        window.removeEventListener("scroll", this.onscrollEvent);
    }
    postCreation() {
        super.postCreation();
        this.manageFocus();
        this.pickerEl.onChange.add((value) => {
            this.triggerChange(value);
        });
        window.addEventListener("scroll", this.onscrollEvent);
    }
    __edfc2d61f33bd1551864b63413a35f79method5() {
        return this.name;
    }
    __edfc2d61f33bd1551864b63413a35f79method6() {
        return this.label;
    }
    __edfc2d61f33bd1551864b63413a35f79method7() {
        return this.placeholder;
    }
    __edfc2d61f33bd1551864b63413a35f79method9() {
        return this.disabled ? -1 : 0;
    }
    __edfc2d61f33bd1551864b63413a35f79method10(error) {
        return error;
    }
    __edfc2d61f33bd1551864b63413a35f79method0() {
        return this.icon_position == "before";
    }
    __edfc2d61f33bd1551864b63413a35f79method1() {
        return this.preview_position == "before";
    }
    __edfc2d61f33bd1551864b63413a35f79method2() {
        return this.preview_position == "after";
    }
    __edfc2d61f33bd1551864b63413a35f79method3() {
        return this.icon_position == "after";
    }
    __edfc2d61f33bd1551864b63413a35f79method8() {
        return this.value;
    }
    __edfc2d61f33bd1551864b63413a35f79method11() {
        return this.direction;
    }
    __edfc2d61f33bd1551864b63413a35f79method12() {
        return this.opacity;
    }
    __edfc2d61f33bd1551864b63413a35f79method13() {
        return this.show_text_value;
    }
    __edfc2d61f33bd1551864b63413a35f79method14() {
        return this.presets;
    }
}
Components.Form.ColorPicker.Namespace=`OneMoreUI.Components.Form`;
Components.Form.ColorPicker.Tag=`om-color-picker`;
__as1(_.Components.Form, 'ColorPicker', Components.Form.ColorPicker);
if(!window.customElements.get('om-color-picker')){window.customElements.define('om-color-picker', Components.Form.ColorPicker);Aventus.WebComponentInstance.registerDefinition(Components.Form.ColorPicker);}

Components.Display.MenuItem = class MenuItem extends Aventus.WebComponent {
    static get observedAttributes() {return ["label", "icon"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'color'() { return this.getStringAttr('color') }
    set 'color'(val) { this.setStringAttr('color', val) }get 'icon_color'() { return this.getStringAttr('icon_color') }
    set 'icon_color'(val) { this.setStringAttr('icon_color', val) }get 'text_color'() { return this.getStringAttr('text_color') }
    set 'text_color'(val) { this.setStringAttr('text_color', val) }get 'no_close'() { return this.getBoolAttr('no_close') }
    set 'no_close'(val) { this.setBoolAttr('no_close', val) }    get 'label'() { return this.getStringProp('label') }
    set 'label'(val) { this.setStringAttr('label', val) }get 'icon'() { return this.getStringProp('icon') }
    set 'icon'(val) { this.setStringAttr('icon', val) }    menu;
    static __style = `:host{--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--surface-content));--_menu-item-text-fg: var(--menu-item-text-fg, var(--surface-content));--_menu-item-bg: var(--menu-item-bg, var(--surface));--_menu-item-bg-hover: var(--menu-item-bg-hover, var(--surface-100))}:host([color=primary]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--primary-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--primary-600))}:host([icon_color=primary]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--primary-600))}:host([text_color=primary]){--_menu-item-text-fg: var(--menu-item-text-fg, var(--primary-600))}:host([color=primary][reverse]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--primary-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--primary-600));--_menu-item-bg: var(--menu-item-bg, var(--primary-content))}:host([color=accent]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--accent-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--accent-600))}:host([icon_color=accent]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--accent-600))}:host([text_color=accent]){--_menu-item-text-fg: var(--menu-item-text-fg, var(--accent-600))}:host([color=accent][reverse]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--accent-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--accent-600));--_menu-item-bg: var(--menu-item-bg, var(--accent-content))}:host([color=neutral]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--neutral-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--neutral-600))}:host([icon_color=neutral]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--neutral-600))}:host([text_color=neutral]){--_menu-item-text-fg: var(--menu-item-text-fg, var(--neutral-600))}:host([color=neutral][reverse]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--neutral-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--neutral-600));--_menu-item-bg: var(--menu-item-bg, var(--neutral-content))}:host([color=info]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--info-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--info-600))}:host([icon_color=info]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--info-600))}:host([text_color=info]){--_menu-item-text-fg: var(--menu-item-text-fg, var(--info-600))}:host([color=info][reverse]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--info-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--info-600));--_menu-item-bg: var(--menu-item-bg, var(--info-content))}:host([color=success]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--success-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--success-600))}:host([icon_color=success]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--success-600))}:host([text_color=success]){--_menu-item-text-fg: var(--menu-item-text-fg, var(--success-600))}:host([color=success][reverse]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--success-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--success-600));--_menu-item-bg: var(--menu-item-bg, var(--success-content))}:host([color=warning]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--warning-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--warning-600))}:host([icon_color=warning]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--warning-600))}:host([text_color=warning]){--_menu-item-text-fg: var(--menu-item-text-fg, var(--warning-600))}:host([color=warning][reverse]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--warning-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--warning-600));--_menu-item-bg: var(--menu-item-bg, var(--warning-content))}:host([color=error]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--error-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--error-600))}:host([icon_color=error]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--error-600))}:host([text_color=error]){--_menu-item-text-fg: var(--menu-item-text-fg, var(--error-600))}:host([color=error][reverse]){--_menu-item-icon-fg: var(--menu-item-icon-fg, var(--error-600));--_menu-item-text-fg: var(--menu-item-text-fg, var(--error-600));--_menu-item-bg: var(--menu-item-bg, var(--error-content))}:host{align-items:center;background-color:var(--_menu-item-bg);border-top:1px solid var(--border-color);cursor:pointer;display:flex;gap:1rem;padding:.5rem 1rem;transition:background-color .2s var(--bezier-curve)}:host mi-icon{color:var(--_menu-item-icon-fg);font-size:var(--font-size-md)}:host .body{color:var(--_menu-item-text-fg)}:host(:first-child){border-top:0}@media(hover: hover)and (pointer: fine){:host(:hover){background-color:var(--_menu-item-bg-hover)}}`;
    __getStatic() {
        return MenuItem;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(MenuItem.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<mi-icon _id="menuitem_0"></mi-icon><div class="body" _id="menuitem_1"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "menuitem_0°icon": {
      "fct": (c) => `${c.print(c.comp.__93a0baadd972559bba6693ecc40e53bamethod0())}`,
      "once": true
    },
    "menuitem_1°@HTML": {
      "fct": (c) => `${c.print(c.comp.__93a0baadd972559bba6693ecc40e53bamethod1())}`,
      "once": true
    }
  }
}); }
    getClassName() {
        return "MenuItem";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('color')){ this['color'] = undefined; }if(!this.hasAttribute('icon_color')){ this['icon_color'] = undefined; }if(!this.hasAttribute('text_color')){ this['text_color'] = undefined; }if(!this.hasAttribute('no_close')) { this.attributeChangedCallback('no_close', false, false); }if(!this.hasAttribute('label')){ this['label'] = undefined; }if(!this.hasAttribute('icon')){ this['icon'] = undefined; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('color');this.__upgradeProperty('icon_color');this.__upgradeProperty('text_color');this.__upgradeProperty('no_close');this.__upgradeProperty('label');this.__upgradeProperty('icon'); }
    __listBoolProps() { return ["no_close"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    preRender() {
        Libs.Style.lockVariable(["--menu-item-icon-color"], this);
    }
    bindToMenu() {
        const menu = this.findParentByType(_.Components.Display.Menu);
        if (!menu)
            return;
        this.menu = menu;
        this.addEventListener("click", () => {
            if (this.no_close)
                return;
            menu.close();
        });
        // this.menu.stateChange.add(this.preRender);
    }
    unbindFromMenu() {
        if (!this.menu)
            return;
        // this.menu.stateChange.remove(this.preRender);
    }
    postCreation() {
        this.bindToMenu();
    }
    postDestruction() {
        this.unbindFromMenu();
    }
    __93a0baadd972559bba6693ecc40e53bamethod0() {
        return this.icon;
    }
    __93a0baadd972559bba6693ecc40e53bamethod1() {
        return this.label;
    }
}
Components.Display.MenuItem.Namespace=`OneMoreUI.Components.Display`;
Components.Display.MenuItem.Tag=`om-menu-item`;
__as1(_.Components.Display, 'MenuItem', Components.Display.MenuItem);
if(!window.customElements.get('om-menu-item')){window.customElements.define('om-menu-item', Components.Display.MenuItem);Aventus.WebComponentInstance.registerDefinition(Components.Display.MenuItem);}

Components.Display.Menu = class Menu extends Aventus.WebComponent {
    static get observedAttributes() {return ["position"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'edge_gap'() { return this.getNumberAttr('edge_gap') }
    set 'edge_gap'(val) { this.setNumberAttr('edge_gap', val) }get 'position_gap'() { return this.getNumberAttr('position_gap') }
    set 'position_gap'(val) { this.setNumberAttr('position_gap', val) }get 'not_ready'() { return this.getBoolAttr('not_ready') }
    set 'not_ready'(val) { this.setBoolAttr('not_ready', val) }get 'disable_focus'() { return this.getBoolAttr('disable_focus') }
    set 'disable_focus'(val) { this.setBoolAttr('disable_focus', val) }    get 'position'() { return this.getStringProp('position') }
    set 'position'(val) { this.setStringAttr('position', val) }    state = Components.Display.MenuState.Close;
    ref;
    parentBase;
    stateChange = new Aventus.Callback();
    static __style = `:host{background-color:var(--surface);border:1px solid var(--border-color);border-radius:var(--border-radius-md);min-width:150px;outline:none;position:absolute;-webkit-tap-highlight-color:rgba(0,0,0,0);z-index:500;box-shadow:var(--elevation-2);overflow:hidden}:host .container{display:flex;flex-direction:column;width:100%}`;
    __getStatic() {
        return Menu;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Menu.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<om-scrollable floating_scroll>    <div class="container" _id="menu_0">        <slot></slot>    </div></om-scrollable>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "containerEl",
      "ids": [
        "menu_0"
      ]
    }
  ]
}); }
    getClassName() {
        return "Menu";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('edge_gap')){ this['edge_gap'] = 20; }if(!this.hasAttribute('position_gap')){ this['position_gap'] = 0; }if(!this.hasAttribute('not_ready')) {this.setAttribute('not_ready' ,'true'); }if(!this.hasAttribute('disable_focus')) { this.attributeChangedCallback('disable_focus', false, false); }if(!this.hasAttribute('position')){ this['position'] = 'left bottom'; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('edge_gap');this.__upgradeProperty('position_gap');this.__upgradeProperty('not_ready');this.__upgradeProperty('disable_focus');this.__upgradeProperty('position'); }
    __listBoolProps() { return ["not_ready","disable_focus"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    show(from) {
        let rect;
        if (!from) {
            const ref = this.ref;
            if (!ref)
                throw "Can't find a parent for the menu";
            from = ref;
        }
        if (from instanceof Element) {
            rect = from.getBoundingClientRect();
        }
        else if (from instanceof Event) {
            const el = {
                bottom: from.pageY,
                top: from.pageY,
                height: 1,
                width: 1,
                left: from.pageX,
                right: from.pageX,
                x: from.pageX,
                y: from.pageY,
            };
            rect = {
                ...el,
                toJSON: () => {
                    return el;
                }
            };
        }
        else {
            rect = from;
        }
        this.state = Components.Display.MenuState.BeforeOpen;
        this.stateChange.trigger(this.state);
        this.calculatePosition(rect);
        document.body.appendChild(this);
        if (!this.disable_focus) {
            setTimeout(() => {
                this.focus({ preventScroll: true });
                this.state = Components.Display.MenuState.Open;
                this.stateChange.trigger(this.state);
            }, 300);
        }
    }
    calculatePosition(rect) {
        const result = PositionTools.calculatePosition(this, rect, this.position, this.edge_gap, this.position_gap);
        if (!result.found) {
            alert("Error");
            return;
        }
        this.style.top = result.top !== null ? result.top + 'px' : '';
        this.style.left = result.left !== null ? result.left + 'px' : '';
        this.style.bottom = result.bottom !== null ? result.bottom + 'px' : '';
        this.style.right = result.right !== null ? result.right + 'px' : '';
        this.style.maxHeight = result.maxHeight + 'px';
        this.style.maxWidth = result.maxWidth + 'px';
    }
    close() {
        this.state = Components.Display.MenuState.Close;
        try {
            this.remove(false);
        }
        catch { }
        this.stateChange.trigger(this.state);
    }
    addFocus() {
        if (this.disable_focus)
            return;
        this.setAttribute("tabindex", "-1");
        let oldTarget = null;
        const check = (_e) => {
            const e = _e;
            if (oldTarget) {
                oldTarget.removeEventListener("blur", check);
            }
            if (e.relatedTarget) {
                const isChild = Aventus.ElementExtension.findParent(e.relatedTarget, (el) => el == this);
                if (isChild) {
                    oldTarget = e.relatedTarget;
                    e.relatedTarget.addEventListener("blur", check);
                    return;
                }
            }
            this.close();
        };
        this.addEventListener("blur", (e) => {
            e.stopPropagation();
            check(e);
        });
        const slotEls = this.getElementsInSlot();
        for (let el of slotEls) {
            if (el instanceof _.Components.Display.MenuItem) {
                el.preRender();
            }
        }
        this.remove(false);
    }
    postCreation() {
        this.parentBase = this.parentElement;
        this.addFocus();
        if (this.ref) {
            const r = this.ref;
            r.addEventListener("click", () => {
                this.show();
            });
        }
        this.not_ready = false;
    }
}
Components.Display.Menu.Namespace=`OneMoreUI.Components.Display`;
Components.Display.Menu.Tag=`om-menu`;
__as1(_.Components.Display, 'Menu', Components.Display.Menu);
if(!window.customElements.get('om-menu')){window.customElements.define('om-menu', Components.Display.Menu);Aventus.WebComponentInstance.registerDefinition(Components.Display.Menu);}

Components.Interaction.Toast = class Toast extends Aventus.Toast.ToastElement {
    get 'type'() { return this.getStringAttr('type') }
    set 'type'(val) { this.setStringAttr('type', val) }get 'closing'() { return this.getBoolAttr('closing') }
    set 'closing'(val) { this.setBoolAttr('closing', val) }get 'closable'() { return this.getBoolAttr('closable') }
    set 'closable'(val) { this.setBoolAttr('closable', val) }get 'close_icon'() { return this.getBoolAttr('close_icon') }
    set 'close_icon'(val) { this.setBoolAttr('close_icon', val) }    get 'toastTitle'() {
						return this.__watch["toastTitle"];
					}
					set 'toastTitle'(val) {
						this.__watch["toastTitle"] = val;
					}get 'toastMessage'() {
						return this.__watch["toastMessage"];
					}
					set 'toastMessage'(val) {
						this.__watch["toastMessage"] = val;
					}    icon;
    __registerWatchesActions() {
    this.__addWatchesActions("toastTitle");this.__addWatchesActions("toastMessage");    super.__registerWatchesActions();
}
    static __style = `:host{background-color:var(--surface);border-radius:var(--border-radius-lg);box-shadow:var(--elevation-3);cursor:default;max-width:calc(100vw - 2rem);overflow:hidden;pointer-events:auto;transition:top .2s linear,opacity .2s linear,visibility .2s linear}:host .toast-content{display:grid;gap:1rem;grid-auto-flow:column;grid-template-columns:auto;justify-content:start;padding-block:.75rem;padding-inline:1rem;place-items:center start;text-align:start}:host .toast-content .toast-flex{align-items:flex-start;display:flex}:host .toast-content .toast-flex .toast-icon-wrapper{flex-shrink:0}:host .toast-content .toast-flex .toast-icon-wrapper .toast-icon{align-items:center;display:flex;font-size:var(--font-size-lg);height:var(--font-size-lg);justify-content:center;width:var(--font-size-lg)}:host .toast-content .toast-flex .toast-message-wrapper{flex:1;margin-left:1rem}:host .toast-content .toast-flex .toast-message-wrapper .toast-title{font-size:var(--font-size);font-weight:500;line-height:var(--line-height)}:host .toast-content .toast-flex .toast-message-wrapper .toast-message{font-size:var(--font-size-sm)}:host .toast-content .toast-flex .toast-close-wrapper{flex-shrink:0;margin-left:1rem}:host .toast-content .toast-flex .toast-close-wrapper .toast-close-icon{align-items:center;cursor:pointer;display:flex;font-size:var(--font-size-lg);height:var(--font-size-lg);justify-content:center;width:var(--font-size-lg)}:host mi-icon{user-select:none}:host([type=primary]) .toast-content .toast-flex .toast-icon-wrapper .toast-icon{color:var(--primary)}:host([type=accent]) .toast-content .toast-flex .toast-icon-wrapper .toast-icon{color:var(--accent)}:host([type=neutral]) .toast-content .toast-flex .toast-icon-wrapper .toast-icon{color:var(--neutral)}:host([type=info]) .toast-content .toast-flex .toast-icon-wrapper .toast-icon{color:var(--info)}:host([type=success]) .toast-content .toast-flex .toast-icon-wrapper .toast-icon{color:var(--success)}:host([type=warning]) .toast-content .toast-flex .toast-icon-wrapper .toast-icon{color:var(--warning)}:host([type=error]) .toast-content .toast-flex .toast-icon-wrapper .toast-icon{color:var(--error)}`;
    constructor() {
        super();
        this.close = this.close.bind(this);
    }
    __getStatic() {
        return Toast;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Toast.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="toast-content">    <div class="toast-flex">        <template _id="toast_0"></template>        <div class="toast-message-wrapper">            <template _id="toast_2"></template>            <template _id="toast_4"></template>        </div>        <div class="toast-close-wrapper">            <mi-icon icon="close" class="toast-close-icon" tabindex="0" _id="toast_6"></mi-icon>        </div>    </div></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "events": [
    {
      "eventName": "click",
      "id": "toast_6",
      "fct": (e, c) => c.comp.close(e)
    },
    {
      "eventName": "focus",
      "id": "toast_6",
      "fct": (e, c) => c.comp.addKeyboard(e)
    },
    {
      "eventName": "blur",
      "id": "toast_6",
      "fct": (e, c) => c.comp.removeKeyboard(e)
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`            <div class="toast-icon-wrapper">                <mi-icon class="toast-icon" aria-hidden="true" _id="toast_1"></mi-icon>            </div>        `);templ0.setActions({
  "content": {
    "toast_1°icon": {
      "fct": (c) => `${c.print(c.comp.__6dcf3cd35b0051eebb666b32076a0404method3())}`,
      "once": true
    }
  }
});this.__getStatic().__template.addIf({
                    anchorId: 'toast_0',
                    parts: [{once: true,
                    condition: (c) => c.comp.__6dcf3cd35b0051eebb666b32076a0404method0(),
                    template: templ0
                }]
            });const templ1 = new Aventus.Template(this);templ1.setTemplate(`                <div class="toast-title" _id="toast_3"></div>            `);templ1.setActions({
  "content": {
    "toast_3°@HTML": {
      "fct": (c) => `${c.print(c.comp.__6dcf3cd35b0051eebb666b32076a0404method4())}`,
      "once": true
    }
  }
});this.__getStatic().__template.addIf({
                    anchorId: 'toast_2',
                    parts: [{once: true,
                    condition: (c) => c.comp.__6dcf3cd35b0051eebb666b32076a0404method1(),
                    template: templ1
                }]
            });const templ2 = new Aventus.Template(this);templ2.setTemplate(`                <div class="toast-message" _id="toast_5"></div>            `);templ2.setActions({
  "content": {
    "toast_5°@HTML": {
      "fct": (c) => `${c.print(c.comp.__6dcf3cd35b0051eebb666b32076a0404method5())}`,
      "once": true
    }
  }
});this.__getStatic().__template.addIf({
                    anchorId: 'toast_4',
                    parts: [{once: true,
                    condition: (c) => c.comp.__6dcf3cd35b0051eebb666b32076a0404method2(),
                    template: templ2
                }]
            }); }
    getClassName() {
        return "Toast";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('type')){ this['type'] = undefined; }if(!this.hasAttribute('closing')) { this.attributeChangedCallback('closing', false, false); }if(!this.hasAttribute('closable')) { this.attributeChangedCallback('closable', false, false); }if(!this.hasAttribute('close_icon')) { this.attributeChangedCallback('close_icon', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["toastTitle"] = "";w["toastMessage"] = ""; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('type');this.__upgradeProperty('closing');this.__upgradeProperty('closable');this.__upgradeProperty('close_icon');this.__correctGetter('toastTitle');this.__correctGetter('toastMessage'); }
    __listBoolProps() { return ["closing","closable","close_icon"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    /**
     * @inheritdoc
     * Overrides the `close` method to handle the closing animation and removal from DOM.
     */
    close() {
        if (this.onHideCallback) {
            this.closing = true;
            this.is_active = false;
            this.onHideCallback(false);
            Aventus.sleep(300).then(() => {
                this.remove();
            });
        }
    }
    addKeyboard() {
        Aventus.Lib.ShortcutManager.subscribe(" ", this.close, { replaceTemp: true });
        Aventus.Lib.ShortcutManager.subscribe(Aventus.Lib.SpecialTouch.Enter, this.close, { replaceTemp: true });
    }
    removeKeyboard() {
        Aventus.Lib.ShortcutManager.unsubscribe(" ", this.close);
        Aventus.Lib.ShortcutManager.unsubscribe(Aventus.Lib.SpecialTouch.Enter, this.close);
    }
    setOptions(options) {
        if (options.type != undefined)
            this.type = options.type;
        if (options.icon != undefined)
            this.icon = options.icon;
        if (options.title != undefined)
            this.toastTitle = options.title;
        if (options.message != undefined)
            this.toastMessage = options.message;
        if (options.closable != undefined)
            this.closable = options.closable;
        if (options.close_icon != undefined)
            this.close_icon = options.close_icon;
        if (options.message != undefined)
            this.toastMessage = options.message;
    }
    getIcon() {
        if (this.icon !== undefined)
            return this.icon;
        if (this.type == "error")
            return 'error';
        if (this.type == "info")
            return 'info';
        if (this.type == "success")
            return 'check';
        if (this.type == "warning")
            return 'warning';
        return undefined;
    }
    postDestruction() {
        super.postDestruction();
        this.removeKeyboard();
    }
    __6dcf3cd35b0051eebb666b32076a0404method3() {
        return this.getIcon();
    }
    __6dcf3cd35b0051eebb666b32076a0404method4() {
        return this.toastTitle;
    }
    __6dcf3cd35b0051eebb666b32076a0404method5() {
        return this.toastMessage;
    }
    __6dcf3cd35b0051eebb666b32076a0404method0() {
        return this.getIcon();
    }
    __6dcf3cd35b0051eebb666b32076a0404method1() {
        return this.toastTitle;
    }
    __6dcf3cd35b0051eebb666b32076a0404method2() {
        return this.toastMessage;
    }
    static add(options) {
        return super.add(options);
    }
}
Components.Interaction.Toast.Namespace=`OneMoreUI.Components.Interaction`;
Components.Interaction.Toast.Tag=`om-toast`;
__as1(_.Components.Interaction, 'Toast', Components.Interaction.Toast);
if(!window.customElements.get('om-toast')){window.customElements.define('om-toast', Components.Interaction.Toast);Aventus.WebComponentInstance.registerDefinition(Components.Interaction.Toast);}

Components.Interaction.Alert = class Alert extends Components.Interaction.Modal {
    static defaultConfig = {
        title: "",
        content: "",
        btnTxt: "Ok",
    };
    static __style = `:host .modal{max-width:800px}:host .modal .modal-header .icon[color=primary]{color:var(--primary)}:host .modal .modal-header .icon[color=accent]{color:var(--accent)}:host .modal .modal-header .icon[color=neutral]{color:var(--neutral)}:host .modal .modal-header .icon[color=info]{color:var(--info)}:host .modal .modal-header .icon[color=success]{color:var(--success)}:host .modal .modal-header .icon[color=warning]{color:var(--warning)}:host .modal .modal-header .icon[color=error]{color:var(--error)}`;
    __getStatic() {
        return Alert;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Alert.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'header':`    <template _id="alert_0"></template>    <div class="title" _id="alert_2"></div>`,'footer':`    <om-button _id="alert_4"></om-button>`,'default':`<div _id="alert_3"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "alert_2°@HTML": {
      "fct": (c) => `${c.print(c.comp.__18e1eef5fce2e718728d07198f6800camethod3())}`,
      "once": true
    },
    "alert_3°@HTML": {
      "fct": (c) => `${c.print(c.comp.__18e1eef5fce2e718728d07198f6800camethod4())}`,
      "once": true
    },
    "alert_4°@HTML": {
      "fct": (c) => `${c.print(c.comp.__18e1eef5fce2e718728d07198f6800camethod5())}`,
      "once": true
    }
  },
  "events": [
    {
      "eventName": "click",
      "id": "alert_4",
      "fct": (e, c) => c.comp.done(e)
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`        <mi-icon class="icon" _id="alert_1"></mi-icon>    `);templ0.setActions({
  "content": {
    "alert_1°icon": {
      "fct": (c) => `${c.print(c.comp.__18e1eef5fce2e718728d07198f6800camethod1())}`,
      "once": true
    },
    "alert_1°color": {
      "fct": (c) => `${c.print(c.comp.__18e1eef5fce2e718728d07198f6800camethod2())}`,
      "once": true
    }
  }
});this.__getStatic().__template.addIf({
                    anchorId: 'alert_0',
                    parts: [{once: true,
                    condition: (c) => c.comp.__18e1eef5fce2e718728d07198f6800camethod0(),
                    template: templ0
                }]
            }); }
    getClassName() {
        return "Alert";
    }
    determineIcon() {
        if (this.options.icon)
            return;
        if (this.options.type == "error")
            this.options.icon = "error";
        else if (this.options.type == "warning")
            this.options.icon = "warning";
        else if (this.options.type == "success")
            this.options.icon = "done_all";
        else if (this.options.type == "info")
            this.options.icon = "info";
    }
    configure() {
        return Components.Interaction.Alert.defaultConfig;
    }
    done() {
        this.resolve();
    }
    postCreation() {
        super.postCreation();
        this.determineIcon();
    }
    __18e1eef5fce2e718728d07198f6800camethod1() {
        return this.options.icon;
    }
    __18e1eef5fce2e718728d07198f6800camethod2() {
        return this.options.type;
    }
    __18e1eef5fce2e718728d07198f6800camethod3() {
        return this.options.title;
    }
    __18e1eef5fce2e718728d07198f6800camethod4() {
        return this.options.content;
    }
    __18e1eef5fce2e718728d07198f6800camethod5() {
        return this.options.btnTxt;
    }
    __18e1eef5fce2e718728d07198f6800camethod0() {
        return this.options.icon;
    }
    static configure(options) {
        this.defaultConfig = { ...this.defaultConfig, ...options };
    }
    static async open(options) {
        const alert = new Components.Interaction.Alert();
        alert.options = { ...alert.options, ...options };
        alert.determineIcon();
        return await alert.show();
    }
}
Components.Interaction.Alert.Namespace=`OneMoreUI.Components.Interaction`;
Components.Interaction.Alert.Tag=`om-alert`;
__as1(_.Components.Interaction, 'Alert', Components.Interaction.Alert);
if(!window.customElements.get('om-alert')){window.customElements.define('om-alert', Components.Interaction.Alert);Aventus.WebComponentInstance.registerDefinition(Components.Interaction.Alert);}


for(let key in _) { OneMoreUI[key] = _[key] }
})(OneMoreUI);

var dbEditor;
(dbEditor||(dbEditor = {}));
(function (dbEditor) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `dbEditor`;
const _ = {};


let _n;
const Toast2 = class Toast2 extends OneMoreUI.Components.Interaction.Toast {
    static __style = ``;
    __getStatic() {
        return Toast2;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Toast2.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Toast2";
    }
}
Toast2.Namespace=`dbEditor`;
Toast2.Tag=`av-toast-2`;
__as1(_, 'Toast2', Toast2);
if(!window.customElements.get('av-toast-2')){window.customElements.define('av-toast-2', Toast2);Aventus.WebComponentInstance.registerDefinition(Toast2);}

const Loader = class Loader extends Aventus.WebComponent {
    get 'visible'() { return this.getBoolAttr('visible') }
    set 'visible'(val) { this.setBoolAttr('visible', val) }    static __style = `:host{align-items:center;background-color:var(--bg-main);display:flex;inset:0;justify-content:center;position:absolute;top:64px;z-index:999;opacity:0;visibility:hidden;transition-property:visibility,opacity;transition-duration:.3s;transition-timing-function:ease-in-out}:host .loader{--b: 8px;animation:l4 1s infinite steps(10);aspect-ratio:1;background:conic-gradient(rgba(0, 0, 0, 0) 10%, var(--color-area)) content-box;border-radius:50%;-webkit-mask:repeating-conic-gradient(rgba(0, 0, 0, 0) 0deg, var(--bg-main) 1deg 20deg, rgba(0, 0, 0, 0) 21deg 36deg),radial-gradient(farthest-side, rgba(0, 0, 0, 0) calc(100% - var(--b) - 1px), var(--bg-main) calc(100% - var(--b)));-webkit-mask-composite:destination-in;mask-composite:intersect;padding:1px;width:50px}:host([visible]){opacity:1;visibility:visible}@keyframes l4{to{transform:rotate(1turn)}}`;
    __getStatic() {
        return Loader;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Loader.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="loader"></div>` }
    });
}
    getClassName() {
        return "Loader";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('visible')) { this.attributeChangedCallback('visible', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('visible'); }
    __listBoolProps() { return ["visible"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
}
Loader.Namespace=`dbEditor`;
Loader.Tag=`av-loader`;
__as1(_, 'Loader', Loader);
if(!window.customElements.get('av-loader')){window.customElements.define('av-loader', Loader);Aventus.WebComponentInstance.registerDefinition(Loader);}

const Button = class Button extends Aventus.Form.ButtonElement {
    get 'disabled'() { return this.getBoolAttr('disabled') }
    set 'disabled'(val) { this.setBoolAttr('disabled', val) }get 'color'() { return this.getStringAttr('color') }
    set 'color'(val) { this.setStringAttr('color', val) }    static __style = `:host{align-items:center;background-color:var(--bg-header);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);cursor:pointer;display:flex;font-size:13px;font-weight:500;gap:8px;padding:8px;transition:all .2s ease}:host([disabled]){opacity:.5;cursor:default}:host(:not([disabled]):hover){background-color:var(--border-color);border-color:var(--text-secondary)}:host([color=error]){background-color:rgba(239,68,68,.15);border-color:rgba(239,68,68,.3);color:var(--color-area)}:host([color=error]:not([disabled]):hover){background-color:rgba(239,68,68,.25);border-color:var(--color-area)}:host([color=success]){background-color:rgba(16,185,129,.15);border-color:rgba(16,185,129,.3);color:#10b981}:host([color=success]:not([disabled]):hover){background-color:rgba(16,185,129,.3);border-color:#10b981;color:#fff}:host([color=warning]){background-color:rgba(245,158,11,.1);border-color:rgba(245,158,11,.25);color:var(--color-pk)}:host([color=warning]:not([disabled]):hover){background-color:rgba(245,158,11,.2);border-color:var(--color-pk)}`;
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
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Button";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('disabled')) { this.attributeChangedCallback('disabled', false, false); }if(!this.hasAttribute('color')){ this['color'] = undefined; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('disabled');this.__upgradeProperty('color'); }
    __listBoolProps() { return ["disabled"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
}
Button.Namespace=`dbEditor`;
Button.Tag=`av-button`;
__as1(_, 'Button', Button);
if(!window.customElements.get('av-button')){window.customElements.define('av-button', Button);Aventus.WebComponentInstance.registerDefinition(Button);}

const TableNode = class TableNode extends Aventus.WebComponent {
    static get observedAttributes() {return ["locked", "selected", "is_editing"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'pulse'() { return this.getBoolAttr('pulse') }
    set 'pulse'(val) { this.setBoolAttr('pulse', val) }    get 'locked'() { return this.getBoolProp('locked') }
    set 'locked'(val) { this.setBoolAttr('locked', val) }get 'selected'() { return this.getBoolProp('selected') }
    set 'selected'(val) { this.setBoolAttr('selected', val) }get 'is_editing'() { return this.getBoolProp('is_editing') }
    set 'is_editing'(val) { this.setBoolAttr('is_editing', val) }    get 'editTableName'() {
						return this.__watch["editTableName"];
					}
					set 'editTableName'(val) {
						this.__watch["editTableName"] = val;
					}    table;
    canvas;
    get editor() {
        return this.canvas.editor;
    }
    dragStart = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("editTableName");    super.__registerWatchesActions();
}
    static __style = `:host{--_table-node-color: var(--table-node-color, transparent)}:host{background-color:var(--bg-surface);border:1px solid var(--border-color);border-radius:8px;box-shadow:0 10px 30px -10px rgba(0,0,0,.7);display:flex;flex-direction:column;overflow:hidden;position:absolute;transition:border-color .15s ease,box-shadow .15s ease;user-select:none;width:224px;z-index:3}:host:hover{border-color:var(--border-hover);box-shadow:0 12px 35px -8px rgba(0,0,0,.8),0 0 0 1px var(--border-color)}:host:hover .node-lock-btn{opacity:.8}:host .table-header-color-bar{background-color:var(--_table-node-color);cursor:pointer;height:5px;left:0;position:absolute;right:0;top:0}:host .table-color-picker{height:5px;left:10px;opacity:0;pointer-events:none;position:absolute;right:10px;top:5px}:host .table-header{align-items:center;background-color:var(--bg-header);border-bottom:1px solid var(--border-color);border-top-left-radius:8px;border-top-right-radius:8px;color:var(--text-primary);cursor:move;display:flex;font-size:13px;font-weight:600;gap:8px;padding:10px 14px;transition:background-color .2s}:host .table-header:active{background-color:var(--border-color)}:host .table-fields{padding:6px 0}:host .node-lock-btn{align-items:center;background:rgba(0,0,0,0);border:none;cursor:pointer;display:flex;font-size:13px;justify-content:center;opacity:.25;padding:2px;transition:opacity .2s,transform .2s}:host .node-lock-btn:hover{opacity:1 !important;transform:scale(1.15)}:host .inline-edit-input{background-color:var(--bg-main);border:1px solid var(--color-accent);border-radius:4px;color:var(--text-primary);display:none;outline:none;padding:2px 6px;user-select:all;width:100%}:host([selected]:not([locked])){border-color:var(--color-accent) !important;box-shadow:0 0 0 2px var(--color-accent),0 12px 35px -8px rgba(0,0,0,.8) !important;z-index:4}:host([locked]){cursor:default !important}:host([locked]):hover{border-color:var(--border-color)}:host([locked]) .table-header-color-bar{cursor:default}:host([locked]) .node-lock-btn{opacity:.8}:host([locked]) .table-header{cursor:default !important}:host([locked]) .table-header:active{background-color:var(--bg-header)}:host([pulse]){animation:highlight-glow 1.5s ease-out 1;z-index:10 !important}:host([is_editing]) .table-title-span{display:none}:host([is_editing]) .inline-edit-input{display:inline-block}@keyframes highlight-glow{0%{border-color:var(--color-accent);box-shadow:0 0 0 0px rgba(59,130,246,.8),0 10px 30px -10px rgba(0,0,0,.7)}50%{border-color:#fff;box-shadow:0 0 0 15px rgba(59,130,246,0),0 12px 35px -8px rgba(0,0,0,.8);transform:scale(1.03)}100%{border-color:var(--border-color);box-shadow:0 0 0 0px rgba(59,130,246,0),0 10px 30px -10px rgba(0,0,0,.7)}}`;
    constructor() {
        super();
        this.onMouseDown = this.onMouseDown.bind(this);
    }
    __getStatic() {
        return TableNode;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TableNode.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="table-header-color-bar" _id="tablenode_0"></div><om-color-picker class="table-color-picker" _id="tablenode_1"></om-color-picker><div class="table-header" _id="tablenode_2">    <button class="node-lock-btn" _id="tablenode_3"></button>    <span class="table-title-span" _id="tablenode_4"></span>    <input class="inline-edit-input" _id="tablenode_5" /></div><div class="table-fields" _id="tablenode_6">    <template _id="tablenode_7"></template></div><om-menu _id="tablenode_9">    <om-menu-item icon="colors" label="Color" _id="tablenode_10"></om-menu-item>    <template _id="tablenode_11"></template>    <om-menu-item icon="edit" label="Rename" _id="tablenode_14"></om-menu-item></om-menu>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "colorPicker",
      "ids": [
        "tablenode_1"
      ]
    },
    {
      "name": "tableInputRef",
      "ids": [
        "tablenode_5"
      ]
    },
    {
      "name": "menuEl",
      "ids": [
        "tablenode_9"
      ]
    }
  ],
  "content": {
    "tablenode_3°title": {
      "fct": (c) => `${c.print(c.comp.__97564805aabf10220aea0267d4e9cde9method4())}`
    },
    "tablenode_3°@HTML": {
      "fct": (c) => `\r\n        ${c.print(c.comp.__97564805aabf10220aea0267d4e9cde9method5())}\r\n    `
    },
    "tablenode_4°@HTML": {
      "fct": (c) => `\r\n        ${c.print(c.comp.__97564805aabf10220aea0267d4e9cde9method6())}\r\n    `,
      "once": true
    }
  },
  "bindings": [
    {
      "id": "tablenode_1",
      "injectionName": "value",
      "eventNames": [
        "onChange"
      ],
      "inject": (c) => c.comp.__97564805aabf10220aea0267d4e9cde9method2(),
      "extract": (c, v) => c.comp.__97564805aabf10220aea0267d4e9cde9method3(v),
      "once": true,
      "isCallback": true
    },
    {
      "id": "tablenode_5",
      "injectionName": "value",
      "eventNames": [
        "change",
        "input"
      ],
      "inject": (c) => c.comp.__97564805aabf10220aea0267d4e9cde9method7(),
      "extract": (c, v) => c.comp.__97564805aabf10220aea0267d4e9cde9method8(v),
      "once": true
    }
  ],
  "events": [
    {
      "eventName": "click",
      "id": "tablenode_0",
      "fct": (e, c) => c.comp.changeColor(e)
    },
    {
      "eventName": "mousedown",
      "id": "tablenode_2",
      "fct": (e, c) => c.comp.onMouseDown(e)
    },
    {
      "eventName": "click",
      "id": "tablenode_3",
      "fct": (e, c) => c.comp.toggleLock(e)
    },
    {
      "eventName": "dblclick",
      "id": "tablenode_4",
      "fct": (e, c) => c.comp.startEditTable(e)
    },
    {
      "eventName": "blur",
      "id": "tablenode_5",
      "fct": (e, c) => c.comp.saveEditTable(e)
    },
    {
      "eventName": "keydown",
      "id": "tablenode_5",
      "fct": (e, c) => c.comp.keyDownEditTable(e)
    },
    {
      "eventName": "mousedown",
      "id": "tablenode_6",
      "fct": (e, c) => c.comp.prevent(e)
    },
    {
      "eventName": "click",
      "id": "tablenode_10",
      "fct": (e, c) => c.comp.changeColor(e)
    },
    {
      "eventName": "click",
      "id": "tablenode_14",
      "fct": (e, c) => c.comp.startEditTable(e)
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`         <av-table-field _id="tablenode_8"></av-table-field>    `);templ0.setActions({
  "injection": [
    {
      "id": "tablenode_8",
      "injectionName": "locked",
      "inject": (c) => c.comp.__97564805aabf10220aea0267d4e9cde9method9(),
      "once": true
    },
    {
      "id": "tablenode_8",
      "injectionName": "field",
      "inject": (c) => c.comp.__97564805aabf10220aea0267d4e9cde9method10(c.data.field),
      "once": true
    },
    {
      "id": "tablenode_8",
      "injectionName": "table",
      "inject": (c) => c.comp.__97564805aabf10220aea0267d4e9cde9method11(),
      "once": true
    }
  ]
});this.__getStatic().__template.addLoop({
                    anchorId: 'tablenode_7',
                    template: templ0,
                simple:{data: "this.table.fields",item:"field"}});const templ1 = new Aventus.Template(this);templ1.setTemplate(`        <om-menu-item icon="lock_open" label="Unlock" _id="tablenode_12"></om-menu-item>    `);templ1.setActions({
  "events": [
    {
      "eventName": "click",
      "id": "tablenode_12",
      "fct": (e, c) => c.comp.toggleLock(e)
    }
  ]
});const templ2 = new Aventus.Template(this);templ2.setTemplate(`        <om-menu-item icon="lock" label="Lock" _id="tablenode_13"></om-menu-item>    `);templ2.setActions({
  "events": [
    {
      "eventName": "click",
      "id": "tablenode_13",
      "fct": (e, c) => c.comp.toggleLock(e)
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'tablenode_11',
                    parts: [{once: true,
                    condition: (c) => c.comp.__97564805aabf10220aea0267d4e9cde9method1(),
                    template: templ1
                },{once: true,
                    condition: (c) => true,
                    template: templ2
                }]
            }); }
    getClassName() {
        return "TableNode";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('pulse')) { this.attributeChangedCallback('pulse', false, false); }if(!this.hasAttribute('locked')) { this.attributeChangedCallback('locked', false, false); }if(!this.hasAttribute('selected')) { this.attributeChangedCallback('selected', false, false); }if(!this.hasAttribute('is_editing')) { this.attributeChangedCallback('is_editing', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["editTableName"] = ""; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('editor');this.__upgradeProperty('pulse');this.__upgradeProperty('locked');this.__upgradeProperty('selected');this.__upgradeProperty('is_editing');this.__correctGetter('editTableName'); }
    __listBoolProps() { return ["pulse","locked","selected","is_editing"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    prevent(e) {
        e.stopPropagation();
        e.preventDefault();
        this.editor.selectTable(this.table.id, e.shiftKey);
    }
    toggleLock(e) {
        e.stopPropagation();
        this.table.locked = !this.table.locked;
    }
    startEditTable() {
        if (this.table.locked)
            return;
        this.editTableName = this.table.name;
        this.is_editing = true;
        this.tableInputRef.focus();
        this.tableInputRef.select();
    }
    saveEditTable() {
        if (!this.is_editing)
            return;
        this.table.name = this.editTableName;
        this.is_editing = false;
    }
    keyDownEditTable(e) {
        if (e.key == "Escape") {
            this.is_editing = false;
        }
        else if (e.key == "Enter") {
            this.saveEditTable();
        }
    }
    onMouseDown(e) {
        e.stopPropagation();
        const target = e.target;
        if (target.closest('.node-lock-btn')) {
            return;
        }
        this.dragStart.trigger(e, this.table);
    }
    changeColor() {
        if (this.locked)
            return;
        this.colorPicker.presets = this.editor.getColors();
        this.colorPicker.show();
    }
    postCreation() {
        this.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.menuEl.show(e);
        });
        Aventus.Watcher.effect(() => {
            this.selected = this.editor.selectedTables.includes(this.table.id);
        });
        Aventus.Watcher.effect(() => {
            this.style.left = this.table.x + 'px';
            this.style.top = this.table.y + 'px';
            this.style.setProperty("--table-node-color", this.table.color || 'transparent');
        });
        Aventus.Watcher.effect(() => {
            if (this.locked != this.table.locked)
                this.locked = this.table.locked;
        });
        Aventus.Watcher.effect(() => {
            this.pulse = (this.editor.highlightedTableId == this.table.id);
        });
    }
    __97564805aabf10220aea0267d4e9cde9method4() {
        return this.locked ? 'Déverrouiller la table' : 'Verrouiller la table';
    }
    __97564805aabf10220aea0267d4e9cde9method5() {
        return this.locked ? '🔒' : '🔓';
    }
    __97564805aabf10220aea0267d4e9cde9method6() {
        return this.table.name;
    }
    __97564805aabf10220aea0267d4e9cde9method1() {
        return this.locked;
    }
    __97564805aabf10220aea0267d4e9cde9method9() {
        return this.locked;
    }
    __97564805aabf10220aea0267d4e9cde9method10(field) {
        return field;
    }
    __97564805aabf10220aea0267d4e9cde9method11() {
        return this;
    }
    __97564805aabf10220aea0267d4e9cde9method2() {
        return this.table.color;
    }
    __97564805aabf10220aea0267d4e9cde9method3(v) {
        if (this.table) {
            this.table.color = v;
        }
    }
    __97564805aabf10220aea0267d4e9cde9method7() {
        return this.editTableName;
    }
    __97564805aabf10220aea0267d4e9cde9method8(v) {
        if (this) {
            this.editTableName = v;
        }
    }
}
TableNode.Namespace=`dbEditor`;
TableNode.Tag=`av-table-node`;
__as1(_, 'TableNode', TableNode);
if(!window.customElements.get('av-table-node')){window.customElements.define('av-table-node', TableNode);Aventus.WebComponentInstance.registerDefinition(TableNode);}

let DEFAULT_SCHEMA= {
    "id": "7f7c5801-e9e9-4e4d-9474-546c0c9444b6",
    "name": "E-Commerce",
    "databaseType": "mysql",
    "tables": [
        {
            "id": "Order",
            "name": "Order",
            "schema": "public",
            "x": 420,
            "y": 140,
            "color": "#3b82f6",
            "locked": false,
            "fields": [
                { "id": "Order.Id", "name": "Id", "type": { "id": "int", "name": "int" }, "primaryKey": true },
                { "id": "Order.Price", "name": "Price", "type": { "id": "float", "name": "float" } },
                { "id": "Order.CreatedDate", "name": "CreatedDate", "type": { "id": "datetime", "name": "datetime" } }
            ]
        },
        {
            "id": "OrderItem",
            "name": "OrderItem",
            "schema": "public",
            "x": 700,
            "y": 140,
            "color": "#3b82f6",
            "locked": false,
            "fields": [
                { "id": "OrderItem.Id", "name": "Id", "type": { "id": "int", "name": "int" }, "primaryKey": true },
                { "id": "OrderItem.OrderId", "name": "OrderId", "type": { "id": "int", "name": "int" } },
                { "id": "OrderItem.ProductId", "name": "ProductId", "type": { "id": "int", "name": "int" } },
                { "id": "OrderItem.Quantity", "name": "Quantity", "type": { "id": "int", "name": "int" } }
            ]
        },
        {
            "id": "Product",
            "name": "Product",
            "schema": "public",
            "x": 980,
            "y": 140,
            "color": "#10b981",
            "locked": false,
            "fields": [
                { "id": "Product.Id", "name": "Id", "type": { "id": "int", "name": "int" }, "primaryKey": true },
                { "id": "Product.Name", "name": "Name", "type": { "id": "varchar(255)", "name": "varchar(255)" } },
                { "id": "Product.Price", "name": "Price", "type": { "id": "float", "name": "float" } }
            ]
        },
        {
            "id": "Bill",
            "name": "Bill",
            "schema": "public",
            "x": 140,
            "y": 140,
            "color": "#ef4444",
            "locked": false,
            "fields": [
                { "id": "Bill.Id", "name": "Id", "type": { "id": "int", "name": "int" }, "primaryKey": true },
                { "id": "Bill.OrderId", "name": "OrderId", "type": { "id": "int", "name": "int" } },
                { "id": "Bill.Amount", "name": "Amount", "type": { "id": "float", "name": "float" } }
            ]
        }
    ],
    "relationships": [
        {
            "id": "rel1",
            "name": "OrderItem_Order",
            "sourceTableId": "OrderItem",
            "targetTableId": "Order",
            "sourceFieldId": "OrderItem.OrderId",
            "targetFieldId": "Order.Id"
        },
        {
            "id": "rel2",
            "name": "OrderItem_Product",
            "sourceTableId": "OrderItem",
            "targetTableId": "Product",
            "sourceFieldId": "OrderItem.ProductId",
            "targetFieldId": "Product.Id"
        },
        {
            "id": "rel3",
            "name": "Bill_Order",
            "sourceTableId": "Bill",
            "targetTableId": "Order",
            "sourceFieldId": "Bill.OrderId",
            "targetFieldId": "Order.Id"
        }
    ],
    "areas": [
        { "id": "area-billing", "name": "Facturation", "x": 100, "y": 60, "width": 480, "height": 360, "color": "#ef4444", "locked": false },
        { "id": "area-shop", "name": "Boutique", "x": 620, "y": 60, "width": 640, "height": 360, "color": "#10b981", "locked": false }
    ]
};
__as1(_, 'DEFAULT_SCHEMA', DEFAULT_SCHEMA);

const TableField = class TableField extends Aventus.WebComponent {
    static get observedAttributes() {return ["is_editing", "primary"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'pulse'() { return this.getBoolAttr('pulse') }
    set 'pulse'(val) { this.setBoolAttr('pulse', val) }get 'locked'() { return this.getBoolAttr('locked') }
    set 'locked'(val) { this.setBoolAttr('locked', val) }    get 'is_editing'() { return this.getBoolProp('is_editing') }
    set 'is_editing'(val) { this.setBoolAttr('is_editing', val) }get 'primary'() { return this.getBoolProp('primary') }
    set 'primary'(val) { this.setBoolAttr('primary', val) }    get 'editFieldName'() {
						return this.__watch["editFieldName"];
					}
					set 'editFieldName'(val) {
						this.__watch["editFieldName"] = val;
					}    field;
    table;
    __registerWatchesActions() {
    this.__addWatchesActions("editFieldName");    super.__registerWatchesActions();
}
    static __style = `:host{align-items:center;display:flex;font-size:12px;justify-content:space-between;padding:6px 14px;position:relative;user-select:none}:host:hover{background-color:hsla(0,0%,100%,.03)}:host .field-name-container{align-items:center;display:flex;gap:6px}:host .field-name-container .field-name{color:var(--text-primary);cursor:pointer;font-weight:450}:host .field-name-container .field-edit{background-color:var(--bg-main);border:1px solid var(--color-accent);border-radius:4px;color:var(--text-primary);display:none;font-size:12px;outline:none;padding:2px 6px;width:100%;user-select:all}:host .field-name-container .field-pk-badge{color:var(--color-pk);display:none;font-size:10px;font-weight:bold}:host .field-type{color:var(--text-secondary);font-size:11px}:host([locked]) .field-name-container .field-name{cursor:default}:host([primary]) .field-name-container .field-pk-badge{display:inline}:host([is_editing]) .field-name-container .field-name{display:none}:host([is_editing]) .field-name-container .field-edit{display:inline-block}:host([pulse]){animation:field-glow 2s ease-out 1}@keyframes field-glow{0%{background-color:rgba(59,130,246,.4)}100%{background-color:rgba(0,0,0,0)}}`;
    __getStatic() {
        return TableField;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TableField.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="field-name-container">    <span class="field-name" _id="tablefield_0"></span>    <input class="inline-edit-input field-edit" _id="tablefield_1" />    <span class="field-pk-badge" title="Clé primaire">🔑</span></div><span class="field-type" _id="tablefield_2"></span>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "fieldInputRef",
      "ids": [
        "tablefield_1"
      ]
    }
  ],
  "content": {
    "tablefield_0°@HTML": {
      "fct": (c) => `\r\n        ${c.print(c.comp.__883c1c4cf53bd6b64794b7a881ff07c1method0())}\r\n    `,
      "once": true
    },
    "tablefield_2°@HTML": {
      "fct": (c) => `${c.print(c.comp.__883c1c4cf53bd6b64794b7a881ff07c1method3())}`,
      "once": true
    }
  },
  "bindings": [
    {
      "id": "tablefield_1",
      "injectionName": "value",
      "eventNames": [
        "change",
        "input"
      ],
      "inject": (c) => c.comp.__883c1c4cf53bd6b64794b7a881ff07c1method1(),
      "extract": (c, v) => c.comp.__883c1c4cf53bd6b64794b7a881ff07c1method2(v),
      "once": true
    }
  ],
  "events": [
    {
      "eventName": "dblclick",
      "id": "tablefield_0",
      "fct": (e, c) => c.comp.startEdit(e)
    },
    {
      "eventName": "blur",
      "id": "tablefield_1",
      "fct": (e, c) => c.comp.saveEdit(e)
    },
    {
      "eventName": "keydown",
      "id": "tablefield_1",
      "fct": (e, c) => c.comp.keyDownEdit(e)
    }
  ]
}); }
    getClassName() {
        return "TableField";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('pulse')) { this.attributeChangedCallback('pulse', false, false); }if(!this.hasAttribute('locked')) { this.attributeChangedCallback('locked', false, false); }if(!this.hasAttribute('is_editing')) { this.attributeChangedCallback('is_editing', false, false); }if(!this.hasAttribute('primary')) { this.attributeChangedCallback('primary', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["editFieldName"] = ""; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('pulse');this.__upgradeProperty('locked');this.__upgradeProperty('is_editing');this.__upgradeProperty('primary');this.__correctGetter('editFieldName'); }
    __listBoolProps() { return ["pulse","locked","is_editing","primary"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    startEdit() {
        if (this.table.locked)
            return;
        this.editFieldName = this.field.name;
        this.is_editing = true;
        this.fieldInputRef.focus();
        this.fieldInputRef.select();
    }
    saveEdit() {
        this.field.name = this.editFieldName;
        this.is_editing = false;
    }
    keyDownEdit(e) {
        if (e.key == "esc") {
            this.is_editing = false;
        }
        throw new Error("Method not implemented.");
    }
    getFieldTypeString() {
        const type = this.field.type;
        return (typeof type === 'object') ? (type.name || type.id) : type;
    }
    postCreation() {
        this.primary = this.field.primaryKey == true;
        this.table.editor.fields[this.field.id] = this;
        Aventus.Watcher.effect(() => {
            this.pulse = (this.table.editor.highlightedFieldId == this.field.id);
        });
    }
    postDestruction() {
        delete this.table.editor.fields[this.field.id];
    }
    __883c1c4cf53bd6b64794b7a881ff07c1method0() {
        return this.field.name;
    }
    __883c1c4cf53bd6b64794b7a881ff07c1method3() {
        return this.getFieldTypeString();
    }
    __883c1c4cf53bd6b64794b7a881ff07c1method1() {
        return this.editFieldName;
    }
    __883c1c4cf53bd6b64794b7a881ff07c1method2(v) {
        if (this) {
            this.editFieldName = v;
        }
    }
}
TableField.Namespace=`dbEditor`;
TableField.Tag=`av-table-field`;
__as1(_, 'TableField', TableField);
if(!window.customElements.get('av-table-field')){window.customElements.define('av-table-field', TableField);Aventus.WebComponentInstance.registerDefinition(TableField);}

let API=class API {
    static onIsDirtyChange = new Aventus.Callback();
    static onHasNewContent = new Aventus.Callback();
    static init() {
        if (VscodeView.Router.isVscode) {
            VscodeView.Router.getInstance().addRoute({
                channel: "is_dirty",
                callback: (data) => {
                    this.onIsDirtyChange.trigger(data);
                }
            });
            VscodeView.Router.getInstance().addRoute({
                channel: "update_content",
                callback: (data) => {
                    this.onHasNewContent.trigger(data);
                }
            });
        }
    }
    static async loadSchema() {
        if (VscodeView.Router.isVscode) {
            const result = await VscodeView.Router.getInstance().sendWithResponse({
                channel: "getData",
            });
            if (result.result) {
                return result.result;
            }
            else if (result.errors.length > 0) {
                alert(result.errors[0].message);
            }
        }
        else {
            return DEFAULT_SCHEMA;
        }
        return undefined;
    }
    static async save() {
        if (!VscodeView.Router.isVscode)
            return;
        await VscodeView.Router.getInstance().sendWithResponse({
            channel: "save"
        });
    }
    static async triggerChange(schema) {
        if (!VscodeView.Router.isVscode)
            return;
        await VscodeView.Router.getInstance().sendWithResponse({
            channel: "triggerChange",
            body: schema,
        });
    }
}
API.Namespace=`dbEditor`;
__as1(_, 'API', API);

const Header = class Header extends Aventus.WebComponent {
    get 'disableSave'() {
						return this.__watch["disableSave"];
					}
					set 'disableSave'(val) {
						this.__watch["disableSave"] = val;
					}get 'hasNewContent'() {
						return this.__watch["hasNewContent"];
					}
					set 'hasNewContent'(val) {
						this.__watch["hasNewContent"] = val;
					}    editor;
    get disableUndo() {
        return !this.editor.canUndo;
    }
    get disableRedo() {
        return !this.editor.canRedo;
    }
    __registerWatchesActions() {
    this.__addWatchesActions("disableSave");this.__addWatchesActions("hasNewContent");    super.__registerWatchesActions();
}
    static __style = `:host{align-items:center;backdrop-filter:blur(12px);background-color:rgba(22,27,34,.85);border-bottom:1px solid var(--border-color);display:flex;height:64px;justify-content:space-between;padding:0 24px;user-select:none;z-index:10}:host .logo-section{align-items:center;display:flex;gap:10px}:host .logo-section .logo-title{color:var(--text-primary);font-family:"Outfit",sans-serif;font-size:18px;font-weight:700;letter-spacing:-0.5px}:host .controls-section{align-items:center;display:flex;gap:16px}:host .controls-section .divider{background-color:var(--border-color);height:24px;width:1px}:host .controls-section mi-icon{font-size:var(--font-size)}:host .controls-section .btn{align-items:center;background-color:var(--bg-header);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary);cursor:pointer;display:flex;font-size:13px;font-weight:500;gap:8px;padding:8px 16px;transition:all .2s ease}:host .controls-section .btn:hover{background-color:var(--border-color);border-color:var(--text-secondary)}:host .controls-section .btn.btn-save{background-color:rgba(16,185,129,.15);border-color:rgba(16,185,129,.3);color:#10b981}:host .controls-section .btn.btn-save[disabled=true]{opacity:.5}:host .controls-section .btn.btn-save:not([disabled=true]):hover{background-color:rgba(16,185,129,.3);border-color:#10b981;color:#fff}:host .controls-section .btn.btn-lock{background-color:rgba(245,158,11,.1);border-color:rgba(245,158,11,.25);color:var(--color-pk)}:host .controls-section .btn.btn-lock:hover{background-color:rgba(245,158,11,.2);border-color:var(--color-pk)}:host .controls-section .btn.btn-lock.all-locked{background-color:rgba(239,68,68,.15);border-color:rgba(239,68,68,.3);color:var(--color-area)}:host .controls-section .btn.btn-lock.all-locked:hover{background-color:rgba(239,68,68,.25);border-color:var(--color-area)}:host .controls-section .btn.btn-update{background-color:rgba(245,158,11,.2);border-color:var(--color-pk);color:var(--color-pk)}:host .controls-section .zoom-controls{align-items:center;background-color:var(--bg-header);border:1px solid var(--border-color);border-radius:6px;display:flex;padding:2px}:host .controls-section .zoom-controls .btn-zoom{align-items:center;background:rgba(0,0,0,0);border:none;border-radius:4px;color:var(--text-secondary);cursor:pointer;display:flex;height:32px;justify-content:center;transition:all .2s;width:32px}:host .controls-section .zoom-controls .btn-zoom:hover{background-color:var(--border-color);color:var(--text-primary)}:host .controls-section .zoom-controls .zoom-level{color:var(--text-primary);font-size:12px;font-weight:600;min-width:48px;padding:0 8px;text-align:center}:host .controls-section .btn-zoom-standalone{align-items:center;background-color:var(--bg-header);border:1px solid var(--border-color);border-radius:6px;color:var(--text-secondary);cursor:pointer;display:flex;height:36px;justify-content:center;transition:all .2s;width:36px}:host .controls-section .btn-zoom-standalone:hover{background-color:var(--border-color);border-color:var(--text-secondary);color:var(--text-primary)}:host .controls-section .btn-zoom-standalone:disabled{cursor:not-allowed;opacity:.35}`;
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
        blocks: { 'default':`<div class="logo-section">    <h1 class="logo-title" _id="header_0"></h1></div><div class="controls-section">    <template _id="header_1"></template>    <av-button color="success" _id="header_3">        <mi-icon icon="save"></mi-icon>    </av-button>    <av-button _id="header_4">        <template _id="header_5"></template>    </av-button>    <div class="divider"></div>    <av-button _id="header_6">        <mi-icon icon="undo"></mi-icon>    </av-button>    <av-button _id="header_7">        <mi-icon icon="redo"></mi-icon>    </av-button>    <av-button _id="header_8">        <mi-icon icon="search"></mi-icon>    </av-button>    <div class="zoom-controls">        <button class="btn-zoom" title="Zoom arrière" _id="header_9">            <mi-icon icon="remove"></mi-icon>        </button>        <span class="zoom-level" _id="header_10"></span>        <button class="btn-zoom" title="Zoom avant" _id="header_11">            <mi-icon icon="add"></mi-icon>        </button>        <button class="btn-zoom" title="Réinitialiser le zoom" _id="header_12">            <mi-icon icon="sync"></mi-icon>        </button>    </div></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "header_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__bf20e263a12c69cea1e9ab4822e5bb35method2())}`
    },
    "header_3°disabled": {
      "fct": (c) => `${c.print(c.comp.__bf20e263a12c69cea1e9ab4822e5bb35method3())}`,
      "once": true
    },
    "header_4°color": {
      "fct": (c) => `${c.print(c.comp.__bf20e263a12c69cea1e9ab4822e5bb35method4())}`
    },
    "header_6°disabled": {
      "fct": (c) => `${c.print(c.comp.__bf20e263a12c69cea1e9ab4822e5bb35method5())}`,
      "once": true
    },
    "header_7°disabled": {
      "fct": (c) => `${c.print(c.comp.__bf20e263a12c69cea1e9ab4822e5bb35method6())}`,
      "once": true
    },
    "header_10°@HTML": {
      "fct": (c) => `${c.print(c.comp.__bf20e263a12c69cea1e9ab4822e5bb35method7())}%`,
      "once": true
    }
  },
  "events": [
    {
      "eventName": "click",
      "id": "header_3",
      "fct": (e, c) => c.comp.exportSchema(e)
    },
    {
      "eventName": "click",
      "id": "header_4",
      "fct": (e, c) => c.comp.toggleLockAll(e)
    },
    {
      "eventName": "click",
      "id": "header_6",
      "fct": (e, c) => c.comp.undo(e)
    },
    {
      "eventName": "click",
      "id": "header_7",
      "fct": (e, c) => c.comp.redo(e)
    },
    {
      "eventName": "click",
      "id": "header_8",
      "fct": (e, c) => c.comp.triggerSearch(e)
    },
    {
      "eventName": "click",
      "id": "header_9",
      "fct": (e, c) => c.comp.zoomOut(e)
    },
    {
      "eventName": "click",
      "id": "header_11",
      "fct": (e, c) => c.comp.zoomIn(e)
    },
    {
      "eventName": "click",
      "id": "header_12",
      "fct": (e, c) => c.comp.zoomResetEmit(e)
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`        <av-button color="warning" _id="header_2">            <mi-icon icon="refresh"></mi-icon>        </av-button>    `);templ0.setActions({
  "events": [
    {
      "eventName": "click",
      "id": "header_2",
      "fct": (e, c) => c.comp.updateSchema(e)
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'header_1',
                    parts: [{once: true,
                    condition: (c) => c.comp.__bf20e263a12c69cea1e9ab4822e5bb35method0(),
                    template: templ0
                }]
            });const templ1 = new Aventus.Template(this);templ1.setTemplate(`            <mi-icon icon="lock"></mi-icon>        `);const templ2 = new Aventus.Template(this);templ2.setTemplate(`            <mi-icon icon="lock_open"></mi-icon>        `);this.__getStatic().__template.addIf({
                    anchorId: 'header_5',
                    parts: [{once: true,
                    condition: (c) => c.comp.__bf20e263a12c69cea1e9ab4822e5bb35method1(),
                    template: templ1
                },{once: true,
                    condition: (c) => true,
                    template: templ2
                }]
            }); }
    getClassName() {
        return "Header";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["disableSave"] = false;w["hasNewContent"] = false; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('disableUndo');this.__correctGetter('disableRedo');this.__correctGetter('disableSave');this.__correctGetter('hasNewContent'); }
    exportSchema() {
        OneMoreUI.Components.Interaction.Toast.add({
            message: "Test 124",
            closable: true,
            title: "Test"
        });
        this.editor.exportSchema();
    }
    toggleLockAll() {
        this.editor.toggleLockAll();
    }
    undo() {
        this.editor.undo();
    }
    redo() {
        this.editor.redo();
    }
    triggerSearch() {
        this.editor.searchActive = true;
    }
    zoomOut() {
        this.editor.zoomOut();
    }
    zoomIn() {
        this.editor.zoomIn();
    }
    zoomResetEmit() {
        this.editor.zoomResetEmit();
    }
    updateSchema() {
        this.editor.reloadFile();
    }
    postCreation() {
        API.onIsDirtyChange.add((value) => {
            this.disableSave = !value;
        });
    }
    __bf20e263a12c69cea1e9ab4822e5bb35method2() {
        return this.editor.schema?.name;
    }
    __bf20e263a12c69cea1e9ab4822e5bb35method3() {
        return this.disableSave;
    }
    __bf20e263a12c69cea1e9ab4822e5bb35method4() {
        return this.editor.allAreLocked ? 'error' : 'warning';
    }
    __bf20e263a12c69cea1e9ab4822e5bb35method5() {
        return this.disableUndo;
    }
    __bf20e263a12c69cea1e9ab4822e5bb35method6() {
        return this.disableRedo;
    }
    __bf20e263a12c69cea1e9ab4822e5bb35method7() {
        return Math.round(this.editor.scale * 100);
    }
    __bf20e263a12c69cea1e9ab4822e5bb35method0() {
        return this.hasNewContent;
    }
    __bf20e263a12c69cea1e9ab4822e5bb35method1() {
        return this.editor.allAreLocked;
    }
}
Header.Namespace=`dbEditor`;
Header.Tag=`av-header`;
__as1(_, 'Header', Header);
if(!window.customElements.get('av-header')){window.customElements.define('av-header', Header);Aventus.WebComponentInstance.registerDefinition(Header);}

const CommandePalette = class CommandePalette extends Aventus.WebComponent {
    static get observedAttributes() {return ["active"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'active'() { return this.getBoolProp('active') }
    set 'active'(val) { this.setBoolAttr('active', val) }    get 'query'() {
						return this.__watch["query"];
					}
					set 'query'(val) {
						this.__watch["query"] = val;
					}get 'activeResultId'() {
						return this.__watch["activeResultId"];
					}
					set 'activeResultId'(val) {
						this.__watch["activeResultId"] = val;
					}get 'filteredResults'() {
						return this.__watch["filteredResults"];
					}
					set 'filteredResults'(val) {
						this.__watch["filteredResults"] = val;
					}    editor;
    resultItemsRefs = [];
    __registerWatchesActions() {
    this.__addWatchesActions("query");this.__addWatchesActions("activeResultId");this.__addWatchesActions("filteredResults");    super.__registerWatchesActions();
}
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("active", ((target) => {
    if (target.active) {
        target.onShow();
    }
    else {
        target.onHide();
    }
})); }
    static __style = `:host{align-items:flex-start;backdrop-filter:blur(4px);background-color:rgba(13,17,23,.7);display:flex;height:100vh;justify-content:center;left:0;opacity:0;padding-top:10vh;pointer-events:none;position:fixed;top:0;transition:opacity .15s ease-out;width:100vw;z-index:100}:host .command-palette-box{background-color:var(--bg-surface);border:1px solid var(--border-color);border-radius:12px;box-shadow:0 24px 60px rgba(0,0,0,.8);display:flex;flex-direction:column;overflow:hidden;transform:translateY(-20px);transition:transform .15s ease-out;width:500px}:host .command-palette-box .command-palette-header{align-items:center;border-bottom:1px solid var(--border-color);display:flex;gap:12px;padding:16px 20px}:host .command-palette-box .command-palette-header .search-icon{color:var(--text-secondary);font-size:18px}:host .command-palette-box .command-palette-header input{background:rgba(0,0,0,0);border:none;color:var(--text-primary);font-family:inherit;font-size:15px;outline:none;width:100%}:host .command-palette-box .command-palette-header input::placeholder{color:var(--text-secondary)}:host .command-palette-box .command-palette-results{max-height:300px;overflow-y:auto;padding:8px}:host .command-palette-box .command-palette-results .command-result-item{align-items:center;border-radius:6px;color:var(--text-primary);cursor:pointer;display:flex;font-size:13px;justify-content:space-between;padding:10px 16px;transition:background-color .1s}:host .command-palette-box .command-palette-results .command-result-item:hover{background-color:hsla(0,0%,100%,.05)}:host .command-palette-box .command-palette-results .command-result-item[active=true]{background-color:hsla(0,0%,100%,.05);border-bottom-left-radius:0;border-left:3px solid var(--color-accent);border-top-left-radius:0}:host .command-palette-box .command-palette-results .command-result-item .left-section{align-items:center;display:flex}:host .command-palette-box .command-palette-results .command-result-item .left-section .result-title{font-weight:500}:host .command-palette-box .command-palette-results .command-result-item .left-section .result-subtext{color:var(--text-secondary);font-size:11px;margin-left:8px}:host .command-palette-box .command-palette-results .command-result-item .result-type-badge{border-radius:4px;font-size:10px;font-weight:600;padding:2px 6px;text-transform:uppercase}:host .command-palette-box .command-palette-results .command-result-item .result-type-badge.badge-table{background-color:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3);color:var(--color-accent)}:host .command-palette-box .command-palette-results .command-result-item .result-type-badge.badge-field{background-color:rgba(245,158,11,.15);border:1px solid rgba(245,158,11,.3);color:var(--color-pk)}:host .command-palette-box .command-palette-results .empty-state{color:var(--text-secondary);font-size:13px;padding:16px;text-align:center}:host .command-palette-box .command-palette-footer{background-color:var(--bg-header);border-top:1px solid var(--border-color);color:var(--text-secondary);display:flex;font-size:11px;gap:12px;padding:12px 20px}:host([active]){opacity:1;pointer-events:auto}:host([active]) .command-palette-box{transform:translateY(0)}`;
    constructor() {
        super();
        this.closePalette = this.closePalette.bind(this);
        this.arrowUp = this.arrowUp.bind(this);
        this.arrowDown = this.arrowDown.bind(this);
        this.selectCurrent = this.selectCurrent.bind(this);
    }
    __getStatic() {
        return CommandePalette;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(CommandePalette.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="modal-overlay">    <div class="command-palette-box" _id="commandepalette_0">        <div class="command-palette-header">            <span class="search-icon">🔍</span>            <input id="search-palette" type="text" placeholder="Rechercher une table ou une colonne..." autocomplete="off" _id="commandepalette_1" />        </div>        <div class="command-palette-results">            <template _id="commandepalette_2"></template>            <template _id="commandepalette_7"></template>        </div>        <div class="command-palette-footer">            <span>↑↓ pour naviguer</span> • <span>Entrée pour sélectionner</span> • <span>Échap pour fermer</span>        </div>    </div></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "searchInput",
      "ids": [
        "commandepalette_1"
      ]
    }
  ],
  "bindings": [
    {
      "id": "commandepalette_1",
      "injectionName": "value",
      "eventNames": [
        "change",
        "input"
      ],
      "inject": (c) => c.comp.__1a8dd6a3691cfaabd49601ed199ef90emethod2(),
      "extract": (c, v) => c.comp.__1a8dd6a3691cfaabd49601ed199ef90emethod3(v),
      "once": true
    }
  ],
  "events": [
    {
      "eventName": "mousedown",
      "id": "commandepalette_0",
      "fct": (e, c) => c.comp.stop(e)
    },
    {
      "eventName": "input",
      "id": "commandepalette_1",
      "fct": (e, c) => c.comp.searchItems(e)
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`                <div class="command-result-item" _id="commandepalette_3">                    <div class="left-section">                    <span class="result-title" _id="commandepalette_4"></span>                    <span class="result-subtext" _id="commandepalette_5"></span>                    </div>                    <span _id="commandepalette_6"></span>                </div>            `);templ0.setActions({
  "content": {
    "commandepalette_3°active": {
      "fct": (c) => `${c.print(c.comp.__1a8dd6a3691cfaabd49601ed199ef90emethod4(c.data.res))}`,
      "once": true
    },
    "commandepalette_3°data-id": {
      "fct": (c) => `${c.print(c.comp.__1a8dd6a3691cfaabd49601ed199ef90emethod5(c.data.res))}`,
      "once": true
    },
    "commandepalette_3°data-type": {
      "fct": (c) => `${c.print(c.comp.__1a8dd6a3691cfaabd49601ed199ef90emethod6(c.data.res))}`,
      "once": true
    },
    "commandepalette_4°@HTML": {
      "fct": (c) => `${c.print(c.comp.__1a8dd6a3691cfaabd49601ed199ef90emethod7(c.data.res))}`,
      "once": true
    },
    "commandepalette_5°@HTML": {
      "fct": (c) => `${c.print(c.comp.__1a8dd6a3691cfaabd49601ed199ef90emethod8(c.data.res))}`,
      "once": true
    },
    "commandepalette_6°class": {
      "fct": (c) => `result-type-badge ${c.print(c.comp.__1a8dd6a3691cfaabd49601ed199ef90emethod9(c.data.res))}`
    },
    "commandepalette_6°@HTML": {
      "fct": (c) => `\r\n                        ${c.print(c.comp.__1a8dd6a3691cfaabd49601ed199ef90emethod10(c.data.res))}\r\n                    `,
      "once": true
    }
  },
  "events": [
    {
      "eventName": "click",
      "id": "commandepalette_3",
      "fct": (e, c) => c.comp.selectResult(e)
    }
  ]
});this.__getStatic().__template.addLoop({
                    anchorId: 'commandepalette_2',
                    template: templ0,
                simple:{data: "this.filteredResults",item:"res"}});const templ1 = new Aventus.Template(this);templ1.setTemplate(`                <div class="empty-state">                    Aucune table ou colonne trouvée                </div>            `);this.__getStatic().__template.addIf({
                    anchorId: 'commandepalette_7',
                    parts: [{once: true,
                    condition: (c) => c.comp.__1a8dd6a3691cfaabd49601ed199ef90emethod1(),
                    template: templ1
                }]
            }); }
    getClassName() {
        return "CommandePalette";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('active')) { this.attributeChangedCallback('active', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["query"] = "";w["activeResultId"] = "";w["filteredResults"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('active');this.__correctGetter('query');this.__correctGetter('activeResultId');this.__correctGetter('filteredResults'); }
    __listBoolProps() { return ["active"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    onShow() {
        this.searchInput.focus();
        Aventus.Lib.ShortcutManager.subscribe(Aventus.Lib.SpecialTouch.Escape, this.closePalette);
        Aventus.Lib.ShortcutManager.subscribe(Aventus.Lib.SpecialTouch.Enter, this.selectCurrent);
        Aventus.Lib.ShortcutManager.subscribe(Aventus.Lib.SpecialTouch.ArrowUp, this.arrowUp);
        Aventus.Lib.ShortcutManager.subscribe(Aventus.Lib.SpecialTouch.ArrowDown, this.arrowDown);
        this.searchItems();
    }
    onHide() {
        Aventus.Lib.ShortcutManager.unsubscribe(Aventus.Lib.SpecialTouch.Escape, this.closePalette);
        Aventus.Lib.ShortcutManager.unsubscribe(Aventus.Lib.SpecialTouch.Enter, this.selectCurrent);
        Aventus.Lib.ShortcutManager.unsubscribe(Aventus.Lib.SpecialTouch.ArrowUp, this.arrowUp);
        Aventus.Lib.ShortcutManager.unsubscribe(Aventus.Lib.SpecialTouch.ArrowDown, this.arrowDown);
    }
    closePalette() {
        this.editor.searchActive = false;
        this.query = '';
    }
    stop(e) {
        e.stopPropagation();
    }
    searchItems() {
        const filteredResults = [];
        this.activeResultId = "";
        if (!this.editor.schema)
            return;
        const searchQuery = this.query.toLowerCase().trim();
        for (let table of this.editor.schema.tables) {
            if (!searchQuery || table.name.toLowerCase().includes(searchQuery)) {
                filteredResults.push({
                    type: 'table',
                    name: table.name,
                    id: table.id,
                    subtext: `${table.fields.length} colonnes`
                });
            }
            for (let field of table.fields) {
                const fieldFullName = `${table.name}.${field.name}`;
                if (searchQuery && (field.name.toLowerCase().includes(searchQuery) || fieldFullName.toLowerCase().includes(searchQuery))) {
                    filteredResults.push({
                        type: 'field',
                        name: field.name,
                        id: field.id,
                        tableId: table.id,
                        tableName: table.name,
                        subtext: `dans ${table.name}`
                    });
                }
            }
            ;
        }
        ;
        this.filteredResults = filteredResults.slice(0, 10);
        if (filteredResults.length > 0) {
            this.activeResultId = filteredResults[0].id;
        }
    }
    arrowUp() {
        const resultsCount = this.filteredResults.length;
        if (resultsCount === 0)
            return;
        let index = this.filteredResults.findIndex(p => p.id == this.activeResultId);
        index = (index - 1 + resultsCount) % resultsCount;
        this.activeResultId = this.filteredResults[index].id;
        this.scrollToActiveItem();
    }
    arrowDown() {
        const resultsCount = this.filteredResults.length;
        if (resultsCount === 0)
            return;
        let index = this.filteredResults.findIndex(p => p.id == this.activeResultId);
        index = (index + 1) % resultsCount;
        this.activeResultId = this.filteredResults[index].id;
        this.scrollToActiveItem();
    }
    selectCurrent() {
        const resultsCount = this.filteredResults.length;
        if (resultsCount === 0)
            return;
        let index = this.filteredResults.findIndex(p => p.id == this.activeResultId);
        if (index >= 0 && index < resultsCount) {
            this.editor.focusOnElement(this.filteredResults[index]);
            this.closePalette();
        }
    }
    scrollToActiveItem() {
        const index = this.filteredResults.findIndex(p => p.id == this.activeResultId);
        const activeEl = this.resultItemsRefs[index];
        if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest' });
        }
    }
    selectResult(e) {
        const el = e.currentTarget;
        const id = el.dataset.id;
        const result = this.filteredResults.find(p => p.id == id);
        if (result)
            this.editor.focusOnElement(result);
        this.closePalette();
    }
    postCreation() {
        this.addEventListener("mousedown", this.closePalette);
        const editor = this.findParentByType(Editor);
        Aventus.Watcher.effect(() => {
            this.active = editor.searchActive;
        });
    }
    __1a8dd6a3691cfaabd49601ed199ef90emethod4(res) {
        return res.id == this.activeResultId;
    }
    __1a8dd6a3691cfaabd49601ed199ef90emethod5(res) {
        return res.id;
    }
    __1a8dd6a3691cfaabd49601ed199ef90emethod6(res) {
        return res.type;
    }
    __1a8dd6a3691cfaabd49601ed199ef90emethod7(res) {
        return res.name;
    }
    __1a8dd6a3691cfaabd49601ed199ef90emethod8(res) {
        return res.subtext;
    }
    __1a8dd6a3691cfaabd49601ed199ef90emethod9(res) {
        return res.type === 'table' ? 'badge-table' : 'badge-field';
    }
    __1a8dd6a3691cfaabd49601ed199ef90emethod10(res) {
        return res.type;
    }
    __1a8dd6a3691cfaabd49601ed199ef90emethod1() {
        return this.filteredResults.length == 0;
    }
    __1a8dd6a3691cfaabd49601ed199ef90emethod2() {
        return this.query;
    }
    __1a8dd6a3691cfaabd49601ed199ef90emethod3(v) {
        if (this) {
            this.query = v;
        }
    }
}
CommandePalette.Namespace=`dbEditor`;
CommandePalette.Tag=`av-commande-palette`;
__as1(_, 'CommandePalette', CommandePalette);
if(!window.customElements.get('av-commande-palette')){window.customElements.define('av-commande-palette', CommandePalette);Aventus.WebComponentInstance.registerDefinition(CommandePalette);}

const Editor = class Editor extends Aventus.WebComponent {
    get 'schema'() {
						return this.__watch["schema"];
					}
					set 'schema'(val) {
						this.__watch["schema"] = val;
					}get 'scale'() {
						return this.__watch["scale"];
					}
					set 'scale'(val) {
						this.__watch["scale"] = val;
					}get 'panX'() {
						return this.__watch["panX"];
					}
					set 'panX'(val) {
						this.__watch["panX"] = val;
					}get 'panY'() {
						return this.__watch["panY"];
					}
					set 'panY'(val) {
						this.__watch["panY"] = val;
					}get 'historyStack'() {
						return this.__watch["historyStack"];
					}
					set 'historyStack'(val) {
						this.__watch["historyStack"] = val;
					}get 'redoStack'() {
						return this.__watch["redoStack"];
					}
					set 'redoStack'(val) {
						this.__watch["redoStack"] = val;
					}get 'tempHistoryState'() {
						return this.__watch["tempHistoryState"];
					}
					set 'tempHistoryState'(val) {
						this.__watch["tempHistoryState"] = val;
					}get 'selectedTables'() {
						return this.__watch["selectedTables"];
					}
					set 'selectedTables'(val) {
						this.__watch["selectedTables"] = val;
					}get 'selectedAreas'() {
						return this.__watch["selectedAreas"];
					}
					set 'selectedAreas'(val) {
						this.__watch["selectedAreas"] = val;
					}get 'searchActive'() {
						return this.__watch["searchActive"];
					}
					set 'searchActive'(val) {
						this.__watch["searchActive"] = val;
					}get 'highlightedTableId'() {
						return this.__watch["highlightedTableId"];
					}
					set 'highlightedTableId'(val) {
						this.__watch["highlightedTableId"] = val;
					}get 'highlightedFieldId'() {
						return this.__watch["highlightedFieldId"];
					}
					set 'highlightedFieldId'(val) {
						this.__watch["highlightedFieldId"] = val;
					}get 'loading'() {
						return this.__watch["loading"];
					}
					set 'loading'(val) {
						this.__watch["loading"] = val;
					}get 'isDirty'() {
						return this.__watch["isDirty"];
					}
					set 'isDirty'(val) {
						this.__watch["isDirty"] = val;
					}get 'hasNewContent'() {
						return this.__watch["hasNewContent"];
					}
					set 'hasNewContent'(val) {
						this.__watch["hasNewContent"] = val;
					}    get allAreLocked() {
        if (!this.schema)
            return false;
        const tables = this.schema.tables || [];
        const areas = this.schema.areas || [];
        if (tables.length === 0 && areas.length === 0)
            return false;
        return tables.every(t => t.locked) && areas.every(a => a.locked);
    }
    get canUndo() {
        return this.historyStack.length > 0;
    }
    get canRedo() {
        return this.redoStack.length > 0;
    }
    fields = {};
    timeout = 0;
    __registerWatchesActions() {
    this.__addWatchesActions("schema", ((target, action) => {
    if (action == Aventus.WatchAction.UPDATED) {
        target.triggerChange();
    }
}));this.__addWatchesActions("scale");this.__addWatchesActions("panX");this.__addWatchesActions("panY");this.__addWatchesActions("historyStack");this.__addWatchesActions("redoStack");this.__addWatchesActions("tempHistoryState");this.__addWatchesActions("selectedTables");this.__addWatchesActions("selectedAreas");this.__addWatchesActions("searchActive");this.__addWatchesActions("highlightedTableId");this.__addWatchesActions("highlightedFieldId");this.__addWatchesActions("loading");this.__addWatchesActions("isDirty");this.__addWatchesActions("hasNewContent");    super.__registerWatchesActions();
}
    static __style = `:host{display:flex;flex-direction:column;height:100vh;overflow:hidden;position:relative;width:100vw}`;
    constructor() {
        super();
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);
    }
    __getStatic() {
        return Editor;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Editor.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<av-header _id="editor_0"></av-header><av-canvas _id="editor_1"></av-canvas><av-commande-palette _id="editor_2"></av-commande-palette><av-loader _id="editor_3"></av-loader>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "canvasEl",
      "ids": [
        "editor_1"
      ]
    }
  ],
  "content": {
    "editor_3°visible": {
      "fct": (c) => `${c.print(c.comp.__dd61cb2036e4e65408924cad284d568emethod4())}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "editor_0",
      "injectionName": "editor",
      "inject": (c) => c.comp.__dd61cb2036e4e65408924cad284d568emethod0(),
      "once": true
    },
    {
      "id": "editor_0",
      "injectionName": "hasNewContent",
      "inject": (c) => c.comp.__dd61cb2036e4e65408924cad284d568emethod1(),
      "once": true
    },
    {
      "id": "editor_1",
      "injectionName": "editor",
      "inject": (c) => c.comp.__dd61cb2036e4e65408924cad284d568emethod2(),
      "once": true
    },
    {
      "id": "editor_2",
      "injectionName": "editor",
      "inject": (c) => c.comp.__dd61cb2036e4e65408924cad284d568emethod3(),
      "once": true
    }
  ]
}); }
    getClassName() {
        return "Editor";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["schema"] = undefined;w["scale"] = 1;w["panX"] = 0;w["panY"] = 0;w["historyStack"] = [];w["redoStack"] = [];w["tempHistoryState"] = null;w["selectedTables"] = [];w["selectedAreas"] = [];w["searchActive"] = false;w["highlightedTableId"] = null;w["highlightedFieldId"] = null;w["loading"] = true;w["isDirty"] = false;w["hasNewContent"] = false; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('allAreLocked');this.__correctGetter('canUndo');this.__correctGetter('canRedo');this.__correctGetter('schema');this.__correctGetter('scale');this.__correctGetter('panX');this.__correctGetter('panY');this.__correctGetter('historyStack');this.__correctGetter('redoStack');this.__correctGetter('tempHistoryState');this.__correctGetter('selectedTables');this.__correctGetter('selectedAreas');this.__correctGetter('searchActive');this.__correctGetter('highlightedTableId');this.__correctGetter('highlightedFieldId');this.__correctGetter('loading');this.__correctGetter('isDirty');this.__correctGetter('hasNewContent'); }
    async loadSchema(newSchema) {
        this.loading = true;
        this.hasNewContent = false;
        await Aventus.sleep(300);
        newSchema.tables = newSchema.tables || [];
        newSchema.relationships = newSchema.relationships || [];
        newSchema.areas = newSchema.areas || [];
        for (const table of newSchema.tables) {
            if (table.locked === undefined)
                table.locked = false;
        }
        for (const area of newSchema.areas) {
            if (area.locked === undefined)
                area.locked = false;
        }
        this.schema = newSchema;
        this.historyStack = [];
        this.redoStack = [];
        this.tempHistoryState = null;
        this.clearSelection();
        this.canvasEl.needCreatePath = true;
        this.canvasEl.createPathLoop = 0;
        this.canvasEl.createPaths();
    }
    exportSchema() {
        if (!this.schema)
            return;
        if (!this.isDirty)
            return;
        try {
            API.save();
        }
        catch { }
    }
    triggerChange() {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            try {
                const schema = Aventus.Watcher.extract(this.schema);
                API.triggerChange(schema);
            }
            catch { }
        }, 300);
    }
    toggleLockAll() {
        const targetState = !this.allAreLocked;
        if (this.schema) {
            for (let table of this.schema.tables)
                table.locked = targetState;
            for (let area of this.schema.areas)
                area.locked = targetState;
        }
    }
    clearSelection() {
        this.selectedTables = [];
        this.selectedAreas = [];
    }
    selectTable(tableId, isShift) {
        const index = this.selectedTables.indexOf(tableId);
        if (isShift) {
            if (index > -1) {
                this.selectedTables.splice(index, 1);
            }
            else {
                this.selectedTables.push(tableId);
            }
        }
        else {
            if (!this.selectedTables.includes(tableId)) {
                this.clearSelection();
                this.selectedTables.push(tableId);
            }
        }
    }
    selectArea(areaId, isShift) {
        const index = this.selectedAreas.indexOf(areaId);
        if (isShift) {
            if (index > -1) {
                this.selectedAreas.splice(index, 1);
            }
            else {
                this.selectedAreas.push(areaId);
            }
        }
        else {
            if (!this.selectedAreas.includes(areaId)) {
                this.clearSelection();
                this.selectedAreas.push(areaId);
            }
        }
    }
    capturePositions() {
        if (!this.schema)
            return { tables: [], areas: [] };
        return {
            tables: this.schema.tables.map(t => ({ id: t.id, x: t.x, y: t.y })),
            areas: this.schema.areas.map(a => ({ id: a.id, x: a.x, y: a.y, width: a.width, height: a.height }))
        };
    }
    restorePositions(snapshot) {
        if (!snapshot || !this.schema)
            return;
        for (let savedTable of snapshot.tables) {
            const table = this.find(this.schema.tables, savedTable.id);
            if (table) {
                table.x = savedTable.x;
                table.y = savedTable.y;
            }
        }
        for (let savedArea of snapshot.areas) {
            const area = this.find(this.schema.areas, savedArea.id);
            if (area) {
                area.x = savedArea.x;
                area.y = savedArea.y;
                area.width = savedArea.width;
                area.height = savedArea.height;
            }
        }
        this.canvasEl.updatePaths();
    }
    arePositionsDifferent(state1, state2) {
        if (!state1 || !state2)
            return false;
        if (state1.tables.length !== state2.tables.length)
            return true;
        for (let i = 0; i < state1.tables.length; i++) {
            const t1 = state1.tables[i];
            const t2 = state2.tables.find(t => t.id === t1.id);
            if (!t2)
                return true;
            if (t1.x !== t2.x || t1.y !== t2.y)
                return true;
        }
        if (state1.areas.length !== state2.areas.length)
            return true;
        for (let i = 0; i < state1.areas.length; i++) {
            const a1 = state1.areas[i];
            const a2 = state2.areas.find(a => a.id === a1.id);
            if (!a2)
                return true;
            if (a1.x !== a2.x || a1.y !== a2.y || a1.width !== a2.width || a1.height !== a2.height)
                return true;
        }
        return false;
    }
    prepareHistoryState() {
        this.tempHistoryState = this.capturePositions();
    }
    commitHistoryState() {
        if (!this.tempHistoryState)
            return;
        const currentState = this.capturePositions();
        if (this.arePositionsDifferent(this.tempHistoryState, currentState)) {
            if (this.historyStack.length >= 50) {
                this.historyStack.shift();
            }
            this.historyStack.push(this.tempHistoryState);
            this.redoStack = [];
        }
        this.tempHistoryState = null;
    }
    undo() {
        if (this.historyStack.length === 0)
            return;
        this.redoStack.push(this.capturePositions());
        const previousPositions = this.historyStack.pop();
        if (previousPositions) {
            this.restorePositions(previousPositions);
        }
    }
    redo() {
        if (this.redoStack.length === 0)
            return;
        this.historyStack.push(this.capturePositions());
        const nextPositions = this.redoStack.pop();
        if (nextPositions) {
            this.restorePositions(nextPositions);
        }
    }
    zoomIn() {
        this.canvasEl.changeScale('in', 1.2);
    }
    zoomOut() {
        this.canvasEl.changeScale('out', 1.2);
    }
    zoomResetEmit() {
        const rect = this.canvasEl.getBoundingClientRect();
        this.centerView(rect.width, rect.height);
        this.canvasEl.updatePaths();
    }
    centerView(viewportWidth, viewportHeight) {
        if (!this.schema || this.schema.tables.length === 0)
            return;
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        for (let table of this.schema.tables) {
            minX = Math.min(minX, table.x);
            minY = Math.min(minY, table.y);
            maxX = Math.max(maxX, table.x + 224);
            maxY = Math.max(maxY, table.y + 180);
        }
        ;
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        const scaleX = (viewportWidth * 0.8) / contentWidth;
        const scaleY = (viewportHeight * 0.8) / contentHeight;
        this.scale = Math.min(Math.min(scaleX, scaleY), 1.1);
        this.scale = Math.max(this.scale, 0.4);
        this.panX = (viewportWidth - contentWidth * this.scale) / 2 - minX * this.scale;
        this.panY = (viewportHeight - contentHeight * this.scale) / 2 - minY * this.scale;
    }
    focusOnElement(res) {
        const rect = this.canvasEl.getBoundingClientRect();
        const viewportWidth = rect.width;
        const viewportHeight = rect.height;
        const tableId = res.type === 'table' ? res.id : res.tableId;
        if (!tableId)
            return;
        const table = this.schema?.tables.find(t => t.id === tableId);
        if (!table)
            return;
        this.scale = 1.0;
        this.panX = viewportWidth / 2 - (table.x + 112) * this.scale;
        this.panY = viewportHeight / 2 - (table.y + 90) * this.scale;
        this.highlightedTableId = table.id;
        setTimeout(() => {
            if (this.highlightedTableId === table.id) {
                this.highlightedTableId = null;
            }
        }, 1500);
        if (res.type === 'field') {
            this.highlightedFieldId = res.id;
            setTimeout(() => {
                if (this.highlightedFieldId === res.id) {
                    this.highlightedFieldId = null;
                }
            }, 2000);
        }
    }
    find(arr, id) {
        for (let item of arr) {
            if (item.id == id) {
                return item;
            }
        }
        return null;
    }
    bindShortcut() {
        Aventus.Lib.ShortcutManager.subscribe([Aventus.Lib.SpecialTouch.Control, 'z'], this.undo);
        Aventus.Lib.ShortcutManager.subscribe([Aventus.Lib.SpecialTouch.Control, 'y'], this.redo);
        Aventus.Lib.ShortcutManager.subscribe([Aventus.Lib.SpecialTouch.Control, 'a'], () => {
            if (!this.schema)
                return;
            this.selectedAreas = this.schema.areas.map(p => p.id);
            this.selectedTables = this.schema.tables.map(p => p.id);
        });
        Aventus.Lib.ShortcutManager.subscribe([Aventus.Lib.SpecialTouch.Control, 'f'], () => {
            this.searchActive = true;
        });
        Aventus.Lib.ShortcutManager.subscribe([Aventus.Lib.SpecialTouch.Control, 's'], () => {
            this.exportSchema();
        });
        this.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });
    }
    async reloadFile() {
        if (this.hasNewContent) {
            const schema = await API.loadSchema();
            if (schema) {
                this.loadSchema(schema);
            }
        }
    }
    async loadFile() {
        API.init();
        const schema = await API.loadSchema();
        if (schema) {
            this.loadSchema(schema);
        }
        API.onIsDirtyChange.add((value) => {
            this.isDirty = value;
        });
        API.onHasNewContent.add((value) => {
            this.hasNewContent = true;
        });
    }
    getColors() {
        if (!this.schema)
            return [];
        const result = [];
        for (let table of this.schema.tables) {
            if (!result.includes(table.color))
                result.push(table.color);
        }
        for (let area of this.schema.areas) {
            if (!result.includes(area.color))
                result.push(area.color);
        }
        return result;
    }
    configure() {
        Aventus.Modal.ModalElement.configure({
            closeWithEsc: true,
            closeWithClick: false,
        });
        Aventus.Toast.ToastManager.configure({
            defaultPosition: 'top right',
            defaultToast: OneMoreUI.Components.Interaction.Toast
        });
        MaterialIcon.Icon.configure({
            getFontUrl: () => {
                const el = document.getElementById("base-style");
                if (el instanceof HTMLLinkElement) {
                    return el.href.replace("style.css", "css/material.css");
                }
                return "/css/material.css";
            }
        });
        Aventus.Process.configure({
            handleErrors: (msg) => {
                OneMoreUI.Components.Interaction.Alert.open({
                    title: "Execution error",
                    content: msg,
                });
            }
        });
    }
    postCreation() {
        this.configure();
        this.bindShortcut();
        this.loadFile();
    }
    __dd61cb2036e4e65408924cad284d568emethod4() {
        return this.loading;
    }
    __dd61cb2036e4e65408924cad284d568emethod0() {
        return this;
    }
    __dd61cb2036e4e65408924cad284d568emethod1() {
        return this.hasNewContent;
    }
    __dd61cb2036e4e65408924cad284d568emethod2() {
        return this;
    }
    __dd61cb2036e4e65408924cad284d568emethod3() {
        return this;
    }
}
Editor.Namespace=`dbEditor`;
Editor.Tag=`av-editor`;
__as1(_, 'Editor', Editor);
if(!window.customElements.get('av-editor')){window.customElements.define('av-editor', Editor);Aventus.WebComponentInstance.registerDefinition(Editor);}

const Canvas = class Canvas extends Aventus.WebComponent {
    get 'relationshipPaths'() {
						return this.__watch["relationshipPaths"];
					}
					set 'relationshipPaths'(val) {
						this.__watch["relationshipPaths"] = val;
					}    editor;
    isPanning = false;
    panStartX = 0;
    panStartY = 0;
    isDragging = false;
    dragStartX = 0;
    dragStartY = 0;
    selectedTableInitialPositions = [];
    selectedAreaInitialPositions = [];
    isResizingArea = false;
    resizedArea = null;
    resizeStartX = 0;
    resizeStartY = 0;
    initialAreaW = 0;
    initialAreaH = 0;
    needCreatePath = true;
    createPathLoop = 0;
    get areas() {
        return this.editor.schema?.areas ?? [];
    }
    get tables() {
        return this.editor.schema?.tables ?? [];
    }
    __registerWatchesActions() {
    this.__addWatchesActions("relationshipPaths");    super.__registerWatchesActions();
}
    static __style = `:host{background-color:var(--bg-main);background-image:radial-gradient(#21262d 1.5px, transparent 1.5px);background-size:24px 24px;cursor:grab;flex:1;overflow:hidden;position:relative}:host .canvas-inner{height:20000px;left:0;pointer-events:none;position:absolute;top:0;transform-origin:0 0;width:20000px}:host .canvas-inner>*{pointer-events:auto}:host .canvas-inner .svg-overlay{height:100%;left:0;pointer-events:none;position:absolute;top:0;width:100%;z-index:1}:host .canvas-inner .svg-overlay path{cursor:pointer;fill:none;pointer-events:stroke;stroke:#8892b0;stroke-width:2px;transition:stroke .2s,stroke-width .2s}:host .canvas-inner .svg-overlay path:hover{filter:drop-shadow(0 0 2px rgba(59, 130, 246, 0.6));stroke:var(--color-accent)}:host .canvas-inner .svg-overlay text{font-size:12px;fill:#8892b0;pointer-events:stroke}:host .canvas-instructions{background-color:rgba(22,27,34,.9);border:1px solid var(--border-color);border-radius:20px;bottom:16px;box-shadow:0 4px 12px rgba(0,0,0,.5);color:var(--text-secondary);display:none;font-size:11px;left:50%;padding:8px 20px;pointer-events:none;position:absolute;transform:translateX(-50%);white-space:nowrap;z-index:5}:host .canvas-selector{background-color:rgba(59,130,246,.3);border:2px solid #3b82f6;display:none;position:absolute}`;
    constructor() {
        super();
        this.onViewportMouseDown = this.onViewportMouseDown.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.handleGlobalMouseMove = this.handleGlobalMouseMove.bind(this);
        this.handleGlobalMouseUp = this.handleGlobalMouseUp.bind(this);
    }
    __getStatic() {
        return Canvas;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Canvas.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="canvas-inner" _id="canvas_0">    <svg class="svg-overlay" _id="canvas_1">        <defs>            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#8892b0"></path>            </marker>            <marker id="dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">                <circle cx="5" cy="5" r="3" fill="#8892b0"></circle>            </marker>        </defs>    </svg>    <template _id="canvas_2"></template></div><div class="canvas-instructions">    💡 Glissez-déposez le fond pour vous déplacer • Utilisez la molette pour zoomer • Glissez le haut d'une table pour    la déplacer • Étirez le coin inférieur droit des zones pour les redimensionner</div><div class="canvas-selector" _id="canvas_7"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "canvasRef",
      "ids": [
        "canvas_0"
      ]
    },
    {
      "name": "svgEl",
      "ids": [
        "canvas_1"
      ]
    },
    {
      "name": "selectorEl",
      "ids": [
        "canvas_7"
      ]
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`        <div id="areas-container">            <template _id="canvas_3"></template>        </div>        <div id="tables-container">            <template _id="canvas_5"></template>        </div>    `);const templ1 = new Aventus.Template(this);templ1.setTemplate(`                <av-area-node _id="canvas_4"></av-area-node>            `);templ1.setActions({
  "injection": [
    {
      "id": "canvas_4",
      "injectionName": "area",
      "inject": (c) => c.comp.__2ebc7ece76d7c5fa6f2b63d2d7ed74e9method3(c.data.area),
      "once": true
    },
    {
      "id": "canvas_4",
      "injectionName": "canvas",
      "inject": (c) => c.comp.__2ebc7ece76d7c5fa6f2b63d2d7ed74e9method4(),
      "once": true
    }
  ],
  "events": [
    {
      "eventName": "dragStart",
      "id": "canvas_4",
      "fct": (c, ...args) => c.comp.handleAreaDragStart.apply(c.comp, ...args),
      "isCallback": true
    },
    {
      "eventName": "resizeStart",
      "id": "canvas_4",
      "fct": (c, ...args) => c.comp.handleAreaResizeStart.apply(c.comp, ...args),
      "isCallback": true
    }
  ]
});templ0.addLoop({
                    anchorId: 'canvas_3',
                    template: templ1,
                simple:{data: "this.areas",item:"area"}});const templ2 = new Aventus.Template(this);templ2.setTemplate(`                <av-table-node _id="canvas_6"></av-table-node>            `);templ2.setActions({
  "injection": [
    {
      "id": "canvas_6",
      "injectionName": "table",
      "inject": (c) => c.comp.__2ebc7ece76d7c5fa6f2b63d2d7ed74e9method5(c.data.table),
      "once": true
    },
    {
      "id": "canvas_6",
      "injectionName": "canvas",
      "inject": (c) => c.comp.__2ebc7ece76d7c5fa6f2b63d2d7ed74e9method6(),
      "once": true
    }
  ],
  "events": [
    {
      "eventName": "dragStart",
      "id": "canvas_6",
      "fct": (c, ...args) => c.comp.handleTableDragStart.apply(c.comp, ...args),
      "isCallback": true
    },
    {
      "eventName": "relationshipChanged",
      "id": "canvas_6",
      "fct": (e, c) => c.comp.updatePaths(e)
    }
  ]
});templ0.addLoop({
                    anchorId: 'canvas_5',
                    template: templ2,
                simple:{data: "this.tables",item:"table"}});this.__getStatic().__template.addIf({
                    anchorId: 'canvas_2',
                    parts: [{once: true,
                    condition: (c) => c.comp.__2ebc7ece76d7c5fa6f2b63d2d7ed74e9method0(),
                    template: templ0
                }]
            }); }
    getClassName() {
        return "Canvas";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["relationshipPaths"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('areas');this.__correctGetter('tables');this.__correctGetter('relationshipPaths'); }
    find(arr, id) {
        if (!arr)
            return null;
        for (let item of arr) {
            if (item.id == id) {
                return item;
            }
        }
        return null;
    }
    onViewportMouseDown(e) {
        const target = e.target;
        // Ignore clicks on nodes, header controls, command palette etc.
        if (target.closest('.table-node') ||
            target.closest('.area-node') ||
            target.closest('.app-header') ||
            target.closest('.canvas-instructions') ||
            target.closest('.modal-overlay') ||
            target.closest('.btn-zoom-standalone')) {
            return;
        }
        if (e.ctrlKey) {
            this.ctrlSelect(e);
            return;
        }
        if (!e.shiftKey) {
            this.editor.clearSelection();
        }
        this.isPanning = true;
        this.panStartX = e.clientX - this.editor.panX;
        this.panStartY = e.clientY - this.editor.panY;
        this.style.cursor = 'grabbing';
    }
    ctrlSelect(e) {
        this.editor.clearSelection();
        const rect = this.getBoundingClientRect();
        const transform = (e) => {
            return {
                x: e.pageX - rect.left,
                y: e.pageY - rect.top,
            };
        };
        const { x, y } = transform(e);
        let startX = x;
        let startXRight = rect.width - x;
        let startY = y;
        let startYBottom = rect.height - y;
        const el = this.selectorEl;
        el.style.left = '';
        el.style.top = '';
        el.style.bottom = '';
        el.style.right = '';
        el.style.width = '';
        el.style.height = '';
        el.style.display = 'block';
        const isRectInside = (rectChild, rectBig) => {
            return (rectChild.left >= rectBig.left &&
                rectChild.right <= rectBig.right &&
                rectChild.top >= rectBig.top &&
                rectChild.bottom <= rectBig.bottom);
        };
        const animation = new Aventus.Animation({
            fps: 15,
            animate: () => {
                const rect = this.selectorEl.getBoundingClientRect();
                const tables = this.shadowRoot.querySelectorAll("av-table-node");
                for (let table of tables) {
                    const rect2 = table.getBoundingClientRect();
                    table.selected = isRectInside(rect2, rect);
                }
                const areas = this.shadowRoot.querySelectorAll("av-area-node");
                for (let area of areas) {
                    const rect2 = area.getBoundingClientRect();
                    area.selected = isRectInside(rect2, rect);
                }
            }
        });
        animation.start();
        const mouseMove = (e) => {
            const { x, y } = transform(e);
            if (x >= startX) {
                let width = x - startX;
                el.style.width = width + 'px';
                el.style.left = startX + 'px';
                el.style.right = '';
            }
            else {
                let width = startX - x;
                el.style.width = width + 'px';
                el.style.right = startXRight + 'px';
                el.style.left = '';
            }
            if (y >= startY) {
                let height = y - startY;
                el.style.height = height + 'px';
                el.style.top = startY + 'px';
                el.style.bottom = '';
            }
            else {
                let height = startY - y;
                el.style.height = height + 'px';
                el.style.top = '';
                el.style.bottom = startYBottom + 'px';
            }
        };
        const clearMouse = () => {
            animation.immediateStop();
            el.style.display = '';
            document.removeEventListener("mouseup", clearMouse);
            document.removeEventListener("mousemove", mouseMove);
            const tables = this.shadowRoot.querySelectorAll("av-table-node");
            const tablesId = [];
            for (let table of tables) {
                if (table.selected) {
                    tablesId.push(table.table.id);
                }
            }
            const areas = this.shadowRoot.querySelectorAll("av-area-node");
            const areasId = [];
            for (let area of areas) {
                if (area.selected) {
                    areasId.push(area.area.id);
                }
            }
            this.editor.selectedTables = tablesId;
            this.editor.selectedAreas = areasId;
        };
        document.addEventListener("mouseup", clearMouse);
        document.addEventListener("mousemove", mouseMove);
    }
    onWheel(e) {
        e.preventDefault();
        this.changeScale(e.deltaY < 0 ? 'in' : 'out', 1.08, e);
    }
    changeScale(direction, zoomFactor, e) {
        const rect = this.getBoundingClientRect();
        const clientX = e?.clientX ?? document.body.offsetWidth / 2;
        const clientY = e?.clientY ?? document.body.offsetHeight / 2;
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        const oldScale = this.editor.scale;
        if (direction == 'in') {
            this.editor.scale = Math.min(this.editor.scale * zoomFactor, 3.0);
        }
        else {
            this.editor.scale = Math.max(this.editor.scale / zoomFactor, 0.15);
        }
        this.editor.panX = mouseX - (mouseX - this.editor.panX) * (this.editor.scale / oldScale);
        this.editor.panY = mouseY - (mouseY - this.editor.panY) * (this.editor.scale / oldScale);
        this.updatePaths();
    }
    handleAreaDragStart(event, area) {
        this.editor.prepareHistoryState();
        const isShift = event.shiftKey;
        this.editor.selectArea(area.id, isShift);
        this.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        // Record initial positions
        this.selectedTableInitialPositions = this.editor.selectedTables.map(tId => {
            const t = this.find(this.editor.schema?.tables, tId);
            if (!t)
                throw new Error(`Table with ID ${tId} not found`);
            return { table: t, startX: t.x, startY: t.y };
        });
        this.selectedAreaInitialPositions = this.editor.selectedAreas.map(aId => {
            const a = this.find(this.editor.schema?.areas, aId);
            if (!a)
                throw new Error(`Area with ID ${aId} not found`);
            return { area: a, startX: a.x, startY: a.y };
        });
    }
    handleAreaResizeStart(event, area) {
        this.editor.prepareHistoryState();
        this.isResizingArea = true;
        this.resizedArea = area;
        this.resizeStartX = event.clientX;
        this.resizeStartY = event.clientY;
        this.initialAreaW = area.width;
        this.initialAreaH = area.height;
    }
    handleTableDragStart(event, table) {
        this.editor.prepareHistoryState();
        const isShift = event.shiftKey;
        this.editor.selectTable(table.id, isShift);
        this.isDragging = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        // Record initial positions
        this.selectedTableInitialPositions = this.editor.selectedTables.map(tId => {
            const t = this.find(this.editor.schema?.tables, tId);
            if (!t)
                throw new Error(`Table with ID ${tId} not found`);
            return { table: t, startX: t.x, startY: t.y };
        });
        this.selectedAreaInitialPositions = this.editor.selectedAreas.map(aId => {
            const a = this.find(this.editor.schema?.areas, aId);
            if (!a)
                throw new Error(`Area with ID ${aId} not found`);
            return { area: a, startX: a.x, startY: a.y };
        });
    }
    createPaths() {
        if (!this.editor.schema)
            return;
        if (this.needCreatePath) {
            this.needCreatePath = false;
            for (let old of this.relationshipPaths) {
                old.el.remove();
                if (old.invisiblePathEl)
                    old.invisiblePathEl.remove();
                if (old.textEl)
                    old.textEl.remove();
            }
            this.relationshipPaths = [];
            let pathIdCounter = 0;
            for (let rel of this.editor.schema.relationships) {
                pathIdCounter++;
                if (!this.createPath(rel, pathIdCounter)) {
                    return;
                }
            }
            this.editor.zoomResetEmit();
            this.editor.loading = false;
            this.updatePaths();
        }
    }
    createPath(rel, pathIdCounter) {
        const sourceFieldEl = this.editor.fields[rel.sourceFieldId];
        const targetFieldEl = this.editor.fields[rel.targetFieldId];
        if (!sourceFieldEl || !targetFieldEl) {
            this.needCreatePath = true;
            this.createPathLoop++;
            if (this.createPathLoop < 50) {
                setTimeout(() => {
                    this.createPaths();
                }, 100);
            }
            return false;
        }
        const pathId = `route-${pathIdCounter}`;
        const textPathId = `text-path-${pathIdCounter}`;
        const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
        el.setAttribute("id", pathId);
        el.setAttribute("marker-end", "url(#arrow)");
        el.setAttribute("marker-start", "url(#dot)");
        this.svgEl.appendChild(el);
        let invisiblePathEl = undefined;
        let textEl = undefined;
        if (rel.description) {
            invisiblePathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
            invisiblePathEl.setAttribute("id", textPathId);
            invisiblePathEl.setAttribute("fill", "none");
            invisiblePathEl.setAttribute("stroke", "transparent");
            this.svgEl.appendChild(invisiblePathEl);
            textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
            const textPathEl = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
            textPathEl.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${textPathId}`);
            textPathEl.setAttribute("startOffset", "50%");
            textPathEl.setAttribute("text-anchor", "middle");
            textPathEl.textContent = rel.description;
            textEl.appendChild(textPathEl);
            el.addEventListener("click", () => {
                alert("edit rel");
            });
            this.svgEl.appendChild(textEl);
        }
        const result = {
            el,
            invisiblePathEl,
            textEl,
            source: sourceFieldEl,
            target: targetFieldEl
        };
        el.addEventListener("dblclick", () => {
        });
        if (result.textEl) {
            el.addEventListener("dblclick", () => {
            });
        }
        this.relationshipPaths.push(result);
        return true;
    }
    async updatePaths() {
        if (!this.editor.schema)
            return;
        this.createPaths();
        await Aventus.sleep(10);
        const canvasRect = this.canvasRef.getBoundingClientRect();
        for (let rel of this.relationshipPaths) {
            const srcRect = rel.source.getBoundingClientRect();
            const tgtRect = rel.target.getBoundingClientRect();
            const srcY = (srcRect.top + srcRect.height / 2 - canvasRect.top) / this.editor.scale;
            const tgtY = (tgtRect.top + tgtRect.height / 2 - canvasRect.top) / this.editor.scale;
            const srcLeft = (srcRect.left - canvasRect.left) / this.editor.scale;
            const srcRight = (srcRect.right - canvasRect.left) / this.editor.scale;
            const tgtLeft = (tgtRect.left - canvasRect.left) / this.editor.scale;
            const tgtRight = (tgtRect.right - canvasRect.left) / this.editor.scale;
            const isSourceLeft = srcLeft < tgtLeft;
            const x1 = isSourceLeft ? srcRight : srcLeft;
            const y1 = srcY;
            const x2 = isSourceLeft ? tgtLeft : tgtRight;
            const y2 = tgtY;
            const dx = Math.abs(x2 - x1);
            const controlOffset = Math.max(50, dx * 0.45);
            const cx1 = x1 + (isSourceLeft ? controlOffset : -controlOffset);
            const cx2 = x2 + (isSourceLeft ? -controlOffset : controlOffset);
            rel.el.setAttribute("d", `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`);
            if (rel.textEl && rel.invisiblePathEl) {
                if (isSourceLeft) {
                    rel.invisiblePathEl.setAttribute("d", `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`);
                    rel.textEl.setAttribute("dy", "-6");
                }
                else {
                    rel.invisiblePathEl.setAttribute("d", `M ${x2} ${y2} C ${cx2} ${y2}, ${cx1} ${y1}, ${x1} ${y1}`);
                    rel.textEl.setAttribute("dy", "14");
                }
            }
        }
    }
    handleGlobalMouseMove(e) {
        if (this.isPanning) {
            this.editor.panX = e.clientX - this.panStartX;
            this.editor.panY = e.clientY - this.panStartY;
        }
        else if (this.isDragging) {
            const dx = (e.clientX - this.dragStartX) / this.editor.scale;
            const dy = (e.clientY - this.dragStartY) / this.editor.scale;
            for (let item of this.selectedTableInitialPositions) {
                if (item.table.locked)
                    return;
                // todo replace when watch will be correct
                this.find(this.editor.schema?.tables, item.table.id).x = item.startX + dx;
                this.find(this.editor.schema?.tables, item.table.id).y = item.startY + dy;
            }
            for (let item of this.selectedAreaInitialPositions) {
                if (item.area.locked)
                    return;
                this.find(this.editor.schema?.areas, item.area.id).x = item.startX + dx;
                this.find(this.editor.schema?.areas, item.area.id).y = item.startY + dy;
            }
            this.updatePaths();
        }
        else if (this.isResizingArea && this.resizedArea) {
            if (this.resizedArea.locked)
                return;
            const dx = (e.clientX - this.resizeStartX) / this.editor.scale;
            const dy = (e.clientY - this.resizeStartY) / this.editor.scale;
            this.resizedArea.width = Math.max(150, this.initialAreaW + dx);
            this.resizedArea.height = Math.max(100, this.initialAreaH + dy);
        }
    }
    handleGlobalMouseUp() {
        if (this.editor.tempHistoryState) {
            this.editor.commitHistoryState();
        }
        this.isPanning = false;
        this.isDragging = false;
        this.isResizingArea = false;
        this.resizedArea = null;
        this.style.cursor = 'grab';
    }
    postCreation() {
        this.addEventListener("mousedown", this.onViewportMouseDown);
        this.addEventListener("wheel", this.onWheel);
        window.addEventListener('mousemove', this.handleGlobalMouseMove);
        window.addEventListener('mouseup', this.handleGlobalMouseUp);
        Aventus.Watcher.effect(() => {
            this.canvasRef.style.transform = `translate(${this.editor.panX}px, ${this.editor.panY}px) scale(${this.editor.scale})`;
        });
    }
    postDestruction() {
        window.removeEventListener('mousemove', this.handleGlobalMouseMove);
        window.removeEventListener('mouseup', this.handleGlobalMouseUp);
    }
    __2ebc7ece76d7c5fa6f2b63d2d7ed74e9method0() {
        return this.editor.schema;
    }
    __2ebc7ece76d7c5fa6f2b63d2d7ed74e9method3(area) {
        return area;
    }
    __2ebc7ece76d7c5fa6f2b63d2d7ed74e9method4() {
        return this;
    }
    __2ebc7ece76d7c5fa6f2b63d2d7ed74e9method5(table) {
        return table;
    }
    __2ebc7ece76d7c5fa6f2b63d2d7ed74e9method6() {
        return this;
    }
}
Canvas.Namespace=`dbEditor`;
Canvas.Tag=`av-canvas`;
__as1(_, 'Canvas', Canvas);
if(!window.customElements.get('av-canvas')){window.customElements.define('av-canvas', Canvas);Aventus.WebComponentInstance.registerDefinition(Canvas);}

const AreaNode = class AreaNode extends Aventus.WebComponent {
    static get observedAttributes() {return ["locked", "selected", "is_editing"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'locked'() { return this.getBoolProp('locked') }
    set 'locked'(val) { this.setBoolAttr('locked', val) }get 'selected'() { return this.getBoolProp('selected') }
    set 'selected'(val) { this.setBoolAttr('selected', val) }get 'is_editing'() { return this.getBoolProp('is_editing') }
    set 'is_editing'(val) { this.setBoolAttr('is_editing', val) }    get 'editName'() {
						return this.__watch["editName"];
					}
					set 'editName'(val) {
						this.__watch["editName"] = val;
					}    area;
    canvas;
    dragStart = new Aventus.Callback();
    resizeStart = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("editName");    super.__registerWatchesActions();
}
    static __style = `:host{--_area-node-color: var(--area-node-color, #fff);--_area-node-background-color: var(--area-node-background-color, #ef4444)}:host{background-color:var(--_area-node-background-color);border:2px dashed var(--_area-node-color);border-radius:8px;display:flex;flex-direction:column;min-height:100px;min-width:150px;overflow:visible;pointer-events:none;position:absolute;user-select:none;z-index:2}:host .area-header-container{align-items:center;cursor:move;display:flex;justify-content:space-between;padding:12px 14px 4px 14px;pointer-events:all}:host .area-title-container{align-items:center;display:flex;flex-grow:1;gap:8px}:host .area-title-container .area-title-span{color:var(--_area-node-color);cursor:pointer;font-size:14px;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,.8)}:host .area-title-container .inline-edit-input{background-color:var(--bg-main);border:1px solid var(--color-accent);border-radius:4px;color:var(--_area-node-color);color:var(--text-primary);display:none;font-size:14px;font-weight:600;outline:none;padding:2px 6px;user-select:all;width:100%}:host .area-header-color-bar{background-color:var(--area-node-color);border:none;border-radius:50%;cursor:pointer;height:18px;margin:0;overflow:hidden;padding:0;width:18px}:host .area-header-color-bar::-webkit-color-swatch-wrapper{padding:0}:host .area-header-color-bar::-webkit-color-swatch{border:1px solid var(--border-color);border-radius:50%}:host .area-color-picker{border:none;border-radius:50%;height:18px;margin:0;opacity:0;overflow:hidden;padding:0;pointer-events:none;position:absolute;right:14px;top:14px;width:18px}:host .node-lock-btn{align-items:center;background:rgba(0,0,0,0);border:none;cursor:pointer;display:flex;font-size:13px;justify-content:center;opacity:.25;padding:2px;transition:opacity .2s,transform .2s}:host .node-lock-btn:hover{opacity:1 !important;transform:scale(1.15)}:host .area-resizer{align-items:flex-end;background-color:hsla(0,0%,100%,.15);border-bottom-right-radius:6px;border-top-left-radius:4px;bottom:0;cursor:se-resize;display:flex;height:16px;justify-content:flex-end;padding:2px;pointer-events:all;position:absolute;right:0;width:16px}:host .area-resizer::after{border-bottom:2px solid var(--text-secondary);border-right:2px solid var(--text-secondary);content:"";height:6px;width:6px}:host .area-resizer:hover{background-color:var(--color-area)}:host .area-resizer:hover::after{border-color:#fff}:host([locked]){cursor:default !important}:host([locked]) .area-header-container{cursor:default}:host([locked]) .area-title-container .area-title-span{cursor:default}:host([locked]) .node-lock-btn{opacity:.8}:host([locked]) .area-color-picker{display:none}:host([locked]) .area-resizer{display:none}:host([selected]:not([locked])){background-color:rgba(59,130,246,.05) !important;border-color:var(--color-accent) !important;border-style:solid !important;z-index:3}:host([is_editing]) .area-title-container .area-title-span{display:none}:host([is_editing]) .area-title-container .inline-edit-input{display:inline-block}`;
    __getStatic() {
        return AreaNode;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(AreaNode.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="area-header-container" _id="areanode_0">    <div class="area-title-container">        <button class="node-lock-btn" _id="areanode_1"></button>        <span class="area-title-span" _id="areanode_2"></span>        <input class="inline-edit-input" _id="areanode_3" />    </div>    <div class="area-header-color-bar" _id="areanode_4"></div>    <om-color-picker class="area-color-picker" _id="areanode_5"></om-color-picker></div><div class="area-resizer" _id="areanode_6"></div><om-menu _id="areanode_7">    <om-menu-item icon="colors" label="Color" _id="areanode_8"></om-menu-item>    <template _id="areanode_9"></template>    <om-menu-item icon="edit" label="Rename" _id="areanode_12"></om-menu-item></om-menu>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "editInput",
      "ids": [
        "areanode_3"
      ]
    },
    {
      "name": "colorPicker",
      "ids": [
        "areanode_5"
      ]
    },
    {
      "name": "menuEl",
      "ids": [
        "areanode_7"
      ]
    }
  ],
  "content": {
    "areanode_1°title": {
      "fct": (c) => `${c.print(c.comp.__500b1a40677989bc5828540005f29ca0method1())}`
    },
    "areanode_1°@HTML": {
      "fct": (c) => `\r\n            ${c.print(c.comp.__500b1a40677989bc5828540005f29ca0method2())}\r\n        `
    },
    "areanode_2°@HTML": {
      "fct": (c) => `\r\n            ${c.print(c.comp.__500b1a40677989bc5828540005f29ca0method3())}\r\n        `,
      "once": true
    }
  },
  "bindings": [
    {
      "id": "areanode_3",
      "injectionName": "value",
      "eventNames": [
        "change",
        "input"
      ],
      "inject": (c) => c.comp.__500b1a40677989bc5828540005f29ca0method4(),
      "extract": (c, v) => c.comp.__500b1a40677989bc5828540005f29ca0method5(v),
      "once": true
    },
    {
      "id": "areanode_5",
      "injectionName": "value",
      "eventNames": [
        "onChange"
      ],
      "inject": (c) => c.comp.__500b1a40677989bc5828540005f29ca0method6(),
      "extract": (c, v) => c.comp.__500b1a40677989bc5828540005f29ca0method7(v),
      "once": true,
      "isCallback": true
    }
  ],
  "events": [
    {
      "eventName": "mousedown",
      "id": "areanode_0",
      "fct": (e, c) => c.comp.onMouseDown(e)
    },
    {
      "eventName": "click",
      "id": "areanode_1",
      "fct": (e, c) => c.comp.toggleLock(e)
    },
    {
      "eventName": "dblclick",
      "id": "areanode_2",
      "fct": (e, c) => c.comp.startEdit(e)
    },
    {
      "eventName": "blur",
      "id": "areanode_3",
      "fct": (e, c) => c.comp.saveEdit(e)
    },
    {
      "eventName": "keydown",
      "id": "areanode_3",
      "fct": (e, c) => c.comp.keyDownEdit(e)
    },
    {
      "eventName": "click",
      "id": "areanode_4",
      "fct": (e, c) => c.comp.changeColor(e)
    },
    {
      "eventName": "mousedown",
      "id": "areanode_6",
      "fct": (e, c) => c.comp.onResizeMouseDown(e)
    },
    {
      "eventName": "click",
      "id": "areanode_8",
      "fct": (e, c) => c.comp.changeColor(e)
    },
    {
      "eventName": "click",
      "id": "areanode_12",
      "fct": (e, c) => c.comp.startEdit(e)
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`        <om-menu-item icon="lock_open" label="Unlock" _id="areanode_10"></om-menu-item>    `);templ0.setActions({
  "events": [
    {
      "eventName": "click",
      "id": "areanode_10",
      "fct": (e, c) => c.comp.toggleLock(e)
    }
  ]
});const templ1 = new Aventus.Template(this);templ1.setTemplate(`        <om-menu-item icon="lock" label="Lock" _id="areanode_11"></om-menu-item>    `);templ1.setActions({
  "events": [
    {
      "eventName": "click",
      "id": "areanode_11",
      "fct": (e, c) => c.comp.toggleLock(e)
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'areanode_9',
                    parts: [{once: true,
                    condition: (c) => c.comp.__500b1a40677989bc5828540005f29ca0method0(),
                    template: templ0
                },{once: true,
                    condition: (c) => true,
                    template: templ1
                }]
            }); }
    getClassName() {
        return "AreaNode";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('locked')) { this.attributeChangedCallback('locked', false, false); }if(!this.hasAttribute('selected')) { this.attributeChangedCallback('selected', false, false); }if(!this.hasAttribute('is_editing')) { this.attributeChangedCallback('is_editing', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["editName"] = ""; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('locked');this.__upgradeProperty('selected');this.__upgradeProperty('is_editing');this.__correctGetter('editName'); }
    __listBoolProps() { return ["locked","selected","is_editing"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    toggleLock(e) {
        e.stopPropagation();
        this.area.locked = !this.area.locked;
    }
    startEdit() {
        if (this.area.locked)
            return;
        this.editName = this.area.name;
        this.is_editing = true;
        this.editInput.focus();
        this.editInput.select();
    }
    saveEdit() {
        if (!this.is_editing)
            return;
        const newName = this.editName.trim();
        if (newName && newName !== this.area.name) {
            this.area.name = newName;
        }
        this.is_editing = false;
    }
    keyDownEdit(e) {
        if (e.key == "Enter") {
            this.saveEdit();
        }
        else if (e.key == "Escape") {
            this.is_editing = false;
        }
    }
    onResizeMouseDown(e) {
        e.stopPropagation();
        this.resizeStart.trigger(e, this.area);
    }
    getRgbaColor(hex, opacity) {
        if (!hex)
            return '';
        let cleanHex = hex.replace('#', '');
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(char => char + char).join('');
        }
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    onMouseDown(e) {
        e.stopPropagation();
        const target = e.target;
        if (target.classList.contains('area-title-container')) {
            this.dragStart.trigger(e, this.area);
            return;
        }
    }
    changeColor() {
        if (this.locked)
            return;
        this.colorPicker.presets = this.canvas.editor.getColors();
        this.colorPicker.show();
    }
    postCreation() {
        this.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.menuEl.show(e);
        });
        Aventus.Watcher.effect(() => {
            if (this.locked != this.area.locked)
                this.locked = this.area.locked;
        });
        Aventus.Watcher.effect(() => {
            this.style.left = this.area.x + 'px';
            this.style.top = this.area.y + 'px';
            this.style.width = this.area.width + 'px';
            this.style.height = this.area.height + 'px';
            this.style.setProperty("--area-node-color", this.area.color || '#ef4444');
            this.style.setProperty("--area-node-background-color", this.getRgbaColor(this.area.color || '#ef4444', 0.03));
        });
        Aventus.Watcher.effect(() => {
            this.selected = this.canvas.editor.selectedAreas.includes(this.area.id);
        });
    }
    __500b1a40677989bc5828540005f29ca0method1() {
        return this.locked ? 'Déverrouiller la zone' : 'Verrouiller la zone';
    }
    __500b1a40677989bc5828540005f29ca0method2() {
        return this.locked ? '🔒' : '🔓';
    }
    __500b1a40677989bc5828540005f29ca0method3() {
        return this.area.name;
    }
    __500b1a40677989bc5828540005f29ca0method0() {
        return this.locked;
    }
    __500b1a40677989bc5828540005f29ca0method4() {
        return this.editName;
    }
    __500b1a40677989bc5828540005f29ca0method5(v) {
        if (this) {
            this.editName = v;
        }
    }
    __500b1a40677989bc5828540005f29ca0method6() {
        return this.area.color;
    }
    __500b1a40677989bc5828540005f29ca0method7(v) {
        if (this.area) {
            this.area.color = v;
        }
    }
}
AreaNode.Namespace=`dbEditor`;
AreaNode.Tag=`av-area-node`;
__as1(_, 'AreaNode', AreaNode);
if(!window.customElements.get('av-area-node')){window.customElements.define('av-area-node', AreaNode);Aventus.WebComponentInstance.registerDefinition(AreaNode);}


for(let key in _) { dbEditor[key] = _[key] }
})(dbEditor);
