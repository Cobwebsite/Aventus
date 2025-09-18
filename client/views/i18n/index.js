if(!Object.hasOwn(window, "AvInstance")) {
	Object.defineProperty(window, "AvInstance", {
		get() {return Aventus.Instance;}
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

let ActionGuard=class ActionGuard {
    /**
     * Map to store actions that are currently running.
     * @type {Map<any[], ((res: any) => void)[]>}
     * @private
     */
    runningAction = new Map();
    run(keys, action) {
        return new Promise(async (resolve) => {
            if (typeof keys == 'function') {
                action = keys;
                keys = [];
            }
            if (!action) {
                throw "No action inside the Mutex.run";
            }
            let actions = undefined;
            let runningKeys = Array.from(this.runningAction.keys());
            for (let runningKey of runningKeys) {
                if (runningKey.length == keys.length) {
                    let found = true;
                    for (let i = 0; i < keys.length; i++) {
                        if (runningKey[i] != keys[i]) {
                            found = false;
                            break;
                        }
                    }
                    if (found) {
                        actions = this.runningAction.get(runningKey);
                        break;
                    }
                }
            }
            if (actions) {
                actions.push((res) => {
                    resolve(res);
                });
            }
            else {
                this.runningAction.set(keys, []);
                let res = await action();
                let actions = this.runningAction.get(keys);
                if (actions) {
                    for (let action of actions) {
                        action(res);
                    }
                }
                this.runningAction.delete(keys);
                resolve(res);
            }
        });
    }
}
ActionGuard.Namespace=`Aventus`;
__as1(_, 'ActionGuard', ActionGuard);

let DragElementXYType= [SVGGElement, SVGRectElement, SVGEllipseElement, SVGTextElement];
__as1(_, 'DragElementXYType', DragElementXYType);

let DragElementLeftTopType= [HTMLElement, SVGSVGElement];
__as1(_, 'DragElementLeftTopType', DragElementLeftTopType);

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
            return tagname.indexOf((el.nodeName || el.tagName).toLowerCase()) != -1;
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
                if (el['classList'] && el['classList'].contains(classnameTemp)) {
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
            return tagname.indexOf((el.nodeName || el['tagName']).toLowerCase()) != -1;
        };
        return this.findParents(element, check, untilNode);
    }
    /**
     * Check if element contains a child
     */
    static containsChild(element, child) {
        var rootScope = element.getRootNode();
        var elScope = child.getRootNode();
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
        var _realTarget = (el, i = 0) => {
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
                // if(changePath == path || changePath.startsWith(path + ".") || changePath.startsWith(path + "[")) {
                if (changePath == path) {
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
                        let result = Reflect.set(target, prop, unbindElement, receiver);
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
                            trigger(type, target, newReceiver, value, newProp, dones);
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
                    return Reflect.get(target, prop, receiver);
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
                                    if (out.otherRoot) {
                                        dones.push(out.otherRoot);
                                    }
                                    trigger('CREATED', target, receiver, receiver[index], "[" + (index) + "]", dones);
                                    trigger('UPDATED', target, receiver, target.length, "length", dones);
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
                                    key = Watcher.extract(key);
                                    value = replaceByAlias(target, value, key + '', receiver, false, out);
                                    if (out.otherRoot)
                                        dones.push(out.otherRoot);
                                    let result = target.set(key, value);
                                    trigger('CREATED', target, receiver, receiver.get(key), key + '', dones);
                                    trigger('UPDATED', target, receiver, target.size, "size", dones);
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
                return Reflect.get(target, prop, receiver);
            },
            set(target, prop, value, receiver) {
                if (typeof prop == 'symbol') {
                    return Reflect.set(target, prop, value, receiver);
                }
                let oldValue = Reflect.get(target, prop, receiver);
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
                let result = Reflect.set(target, prop, value, receiver);
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
    downActionDelay(ev) {
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
    downAction(ev) {
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
    upAction(ev) {
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
    moveAction(ev) {
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
    childPressStart(e) {
        if (this.lastEmitEvent == e.detail.realEvent)
            return;
        this.genericDownAction(e.detail.state, e.detail.realEvent);
        if (this.options.onPressStart) {
            this.options.onPressStart(e.detail.realEvent, this);
        }
    }
    childPressEnd(e) {
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
    childPressMove(e) {
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
                    if (event[temp] instanceof Function) {
                        clone[temp] = (e, pressInstance) => { event[temp](e, pressInstance, this.context); };
                    }
                    else {
                        clone[temp] = event[temp];
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
                el[binding.injectionName] = computed.value;
            }
        });
        if (binding.isCallback) {
            this.firstRenderCb.push(() => {
                for (var el of this._components[binding.id]) {
                    for (let fct of binding.eventNames) {
                        let cb = getValueFromObject(fct, el);
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
            this.postDisonnect();
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
        if (boolProps.indexOf(prop) != -1) {
            if (this.hasAttribute(prop) && (this.getAttribute(prop) === "true" || this.getAttribute(prop) === "")) {
                let value = this.getAttribute(prop);
                delete this[prop];
                this[prop] = value;
            }
            else {
                this.removeAttribute(prop);
                delete this[prop];
                this[prop] = false;
            }
        }
        else {
            if (this.hasAttribute(prop)) {
                let value = this.getAttribute(prop);
                delete this[prop];
                this[prop] = value;
            }
            else if (Object.hasOwn(this, prop)) {
                const value = this[prop];
                delete this[prop];
                this[prop] = value;
            }
        }
    }
    __correctGetter(prop) {
        if (Object.hasOwn(this, prop)) {
            const value = this[prop];
            delete this[prop];
            this[prop] = value;
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
                        fct(WatchAction.UPDATED, name, that[name]);
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
    postDisonnect() { }
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
                    let index = entry.target['sourceIndex'];
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
        if (!target["sourceIndex"]) {
            target["sourceIndex"] = Math.random().toString(36);
            this.targets.push(target);
            ResizeObserver.getUniqueInstance().observe(target);
        }
        if (!ResizeObserver.resizeObserverClassByObject[target["sourceIndex"]]) {
            ResizeObserver.resizeObserverClassByObject[target["sourceIndex"]] = [];
        }
        if (ResizeObserver.resizeObserverClassByObject[target["sourceIndex"]].indexOf(this) == -1) {
            ResizeObserver.resizeObserverClassByObject[target["sourceIndex"]].push(this);
        }
    }
    /**
     * Stop observing size changing for the element
     */
    unobserve(target) {
        for (let i = 0; this.targets.length; i++) {
            let tempTarget = this.targets[i];
            if (tempTarget == target) {
                let position = ResizeObserver.resizeObserverClassByObject[target['sourceIndex']].indexOf(this);
                if (position != -1) {
                    ResizeObserver.resizeObserverClassByObject[target['sourceIndex']].splice(position, 1);
                }
                if (ResizeObserver.resizeObserverClassByObject[target['sourceIndex']].length == 0) {
                    delete ResizeObserver.resizeObserverClassByObject[target['sourceIndex']];
                }
                ResizeObserver.getUniqueInstance().unobserve(target);
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
        let index = entry.target.sourceIndex;
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
            this.callback(changed);
        }, 0);
    }
}
ResizeObserver.Namespace=`Aventus`;
__as1(_, 'ResizeObserver', ResizeObserver);

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
            this.options[name] = options[name];
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
        return this.options.onStart(e);
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


for(let key in _) { Aventus[key] = _[key] }
})(Aventus);



var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `Aventus`;
const _ = {};

let Layout = {};
_.Layout = Aventus.Layout ?? {};
let _n;
let Tracker=class Tracker {
    velocityMultiplier = window.devicePixelRatio;
    updateTime = Date.now();
    delta = { x: 0, y: 0 };
    velocity = { x: 0, y: 0 };
    lastPosition = { x: 0, y: 0 };
    constructor(touch) {
        this.lastPosition = this.getPosition(touch);
    }
    update(touch) {
        const { velocity, updateTime, lastPosition, } = this;
        const now = Date.now();
        const position = this.getPosition(touch);
        const delta = {
            x: -(position.x - lastPosition.x),
            y: -(position.y - lastPosition.y),
        };
        const duration = (now - updateTime) || 16.7;
        const vx = delta.x / duration * 16.7;
        const vy = delta.y / duration * 16.7;
        velocity.x = vx * this.velocityMultiplier;
        velocity.y = vy * this.velocityMultiplier;
        this.delta = delta;
        this.updateTime = now;
        this.lastPosition = position;
    }
    getPointerData(evt) {
        return evt.touches ? evt.touches[evt.touches.length - 1] : evt;
    }
    getPosition(evt) {
        const data = this.getPointerData(evt);
        return {
            x: data.clientX,
            y: data.clientY,
        };
    }
}
Tracker.Namespace=`Aventus`;
__as1(_, 'Tracker', Tracker);

let TouchRecord=class TouchRecord {
    _activeTouchID;
    _touchList = {};
    get _primitiveValue() {
        return { x: 0, y: 0 };
    }
    isActive() {
        return this._activeTouchID !== undefined;
    }
    getDelta() {
        const tracker = this._getActiveTracker();
        if (!tracker) {
            return this._primitiveValue;
        }
        return { ...tracker.delta };
    }
    getVelocity() {
        const tracker = this._getActiveTracker();
        if (!tracker) {
            return this._primitiveValue;
        }
        return { ...tracker.velocity };
    }
    getNbOfTouches() {
        return Object.values(this._touchList).length;
    }
    getTouches() {
        return Object.values(this._touchList);
    }
    getEasingDistance(damping) {
        const deAcceleration = 1 - damping;
        let distance = {
            x: 0,
            y: 0,
        };
        const vel = this.getVelocity();
        Object.keys(vel).forEach(dir => {
            let v = Math.abs(vel[dir]) <= 10 ? 0 : vel[dir];
            while (v !== 0) {
                distance[dir] += v;
                v = (v * deAcceleration) | 0;
            }
        });
        return distance;
    }
    track(evt) {
        if ('TouchEvent' in window && evt instanceof TouchEvent) {
            const { targetTouches, } = evt;
            Array.from(targetTouches).forEach(touch => {
                this._add(touch);
            });
        }
        else {
            this._add(evt);
        }
        return this._touchList;
    }
    update(evt) {
        if ('TouchEvent' in window && evt instanceof TouchEvent) {
            const { touches, changedTouches, } = evt;
            Array.from(touches).forEach(touch => {
                this._renew(touch);
            });
            this._setActiveID(changedTouches);
        }
        else if (evt instanceof PointerEvent) {
            this._renew(evt);
            this._setActiveID(evt);
        }
        return this._touchList;
    }
    release(evt) {
        if ('TouchEvent' in window && evt instanceof TouchEvent) {
            Array.from(evt.changedTouches).forEach(touch => {
                this._delete(touch);
            });
        }
        else {
            this._delete(evt);
        }
    }
    _getIdentifier(touch) {
        if ('Touch' in window && touch instanceof Touch)
            return touch.identifier;
        if (touch instanceof PointerEvent)
            return touch.pointerId;
        return touch.button;
    }
    _add(touch) {
        if (this._has(touch)) {
            this._delete(touch);
        }
        const tracker = new Tracker(touch);
        const identifier = this._getIdentifier(touch);
        this._touchList[identifier] = tracker;
    }
    _renew(touch) {
        if (!this._has(touch)) {
            return;
        }
        const identifier = this._getIdentifier(touch);
        const tracker = this._touchList[identifier];
        tracker.update(touch);
    }
    _delete(touch) {
        const identifier = this._getIdentifier(touch);
        delete this._touchList[identifier];
        if (this._activeTouchID == identifier) {
            this._activeTouchID = undefined;
        }
    }
    _has(touch) {
        const identifier = this._getIdentifier(touch);
        return this._touchList.hasOwnProperty(identifier);
    }
    _setActiveID(touches) {
        if (touches instanceof PointerEvent || touches instanceof MouseEvent) {
            this._activeTouchID = this._getIdentifier(touches);
        }
        else {
            this._activeTouchID = touches[touches.length - 1].identifier;
        }
    }
    _getActiveTracker() {
        const { _touchList, _activeTouchID, } = this;
        if (_activeTouchID !== undefined) {
            return _touchList[_activeTouchID];
        }
        return undefined;
    }
}
TouchRecord.Namespace=`Aventus`;
__as1(_, 'TouchRecord', TouchRecord);

Layout.Scrollable = class Scrollable extends Aventus.WebComponent {
    static get observedAttributes() {return ["zoom"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'min_zoom'() { return this.getNumberAttr('min_zoom') }
    set 'min_zoom'(val) { this.setNumberAttr('min_zoom', val) }get 'max_zoom'() { return this.getNumberAttr('max_zoom') }
    set 'max_zoom'(val) { this.setNumberAttr('max_zoom', val) }get 'y_scroll_visible'() { return this.getBoolAttr('y_scroll_visible') }
    set 'y_scroll_visible'(val) { this.setBoolAttr('y_scroll_visible', val) }get 'x_scroll_visible'() { return this.getBoolAttr('x_scroll_visible') }
    set 'x_scroll_visible'(val) { this.setBoolAttr('x_scroll_visible', val) }get 'floating_scroll'() { return this.getBoolAttr('floating_scroll') }
    set 'floating_scroll'(val) { this.setBoolAttr('floating_scroll', val) }get 'x_scroll'() { return this.getBoolAttr('x_scroll') }
    set 'x_scroll'(val) { this.setBoolAttr('x_scroll', val) }get 'y_scroll'() { return this.getBoolAttr('y_scroll') }
    set 'y_scroll'(val) { this.setBoolAttr('y_scroll', val) }get 'auto_hide'() { return this.getBoolAttr('auto_hide') }
    set 'auto_hide'(val) { this.setBoolAttr('auto_hide', val) }get 'break'() { return this.getNumberAttr('break') }
    set 'break'(val) { this.setNumberAttr('break', val) }get 'disable'() { return this.getBoolAttr('disable') }
    set 'disable'(val) { this.setBoolAttr('disable', val) }get 'no_user_select'() { return this.getBoolAttr('no_user_select') }
    set 'no_user_select'(val) { this.setBoolAttr('no_user_select', val) }get 'mouse_drag'() { return this.getBoolAttr('mouse_drag') }
    set 'mouse_drag'(val) { this.setBoolAttr('mouse_drag', val) }get 'pinch'() { return this.getBoolAttr('pinch') }
    set 'pinch'(val) { this.setBoolAttr('pinch', val) }    get 'zoom'() { return this.getNumberProp('zoom') }
    set 'zoom'(val) { this.setNumberAttr('zoom', val) }    observer;
    display = { x: 0, y: 0 };
    max = {
        x: 0,
        y: 0
    };
    margin = {
        x: 0,
        y: 0
    };
    position = {
        x: 0,
        y: 0
    };
    momentum = { x: 0, y: 0 };
    contentWrapperSize = { x: 0, y: 0 };
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
    scrollerContainer = {
        x: () => {
            if (!this.horizontalScrollerContainer) {
                throw 'can\'t find the horizontalScrollerContainer';
            }
            return this.horizontalScrollerContainer;
        },
        y: () => {
            if (!this.verticalScrollerContainer) {
                throw 'can\'t find the verticalScrollerContainer';
            }
            return this.verticalScrollerContainer;
        }
    };
    hideDelay = { x: 0, y: 0 };
    touchRecord;
    pointerCount = 0;
    loadedOnce = false;
    savedPercent;
    isDragScroller = false;
    cachedSvg;
    previousMidPoint;
    previousDistance;
    startTranslate = { x: 0, y: 0 };
    get x() {
        return this.position.x;
    }
    get y() {
        return this.position.y;
    }
    get xMax() {
        return this.max.x;
    }
    get yMax() {
        return this.max.y;
    }
    onScrollChange = new Aventus.Callback();
    onZoomChange = new Aventus.Callback();
    renderAnimation;
    autoScrollInterval = {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    };
    autoScrollSpeed = {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    };
    pressManager;
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("zoom", ((target) => {
    target.changeZoom();
})); }
    static __style = `:host{--internal-scrollbar-container-color: var(--scrollbar-container-color, transparent);--internal-scrollbar-color: var(--scrollbar-color, #757575);--internal-scrollbar-active-color: var(--scrollbar-active-color, #858585);--internal-scroller-width: var(--scroller-width, 6px);--internal-scroller-top: var(--scroller-top, 3px);--internal-scroller-bottom: var(--scroller-bottom, 3px);--internal-scroller-right: var(--scroller-right, 3px);--internal-scroller-left: var(--scroller-left, 3px);--_scrollbar-content-padding: var(--scrollbar-content-padding, 0);--_scrollbar-container-display: var(--scrollbar-container-display, inline-block)}:host{display:block;height:100%;min-height:inherit;min-width:inherit;overflow:clip;position:relative;-webkit-user-drag:none;-khtml-user-drag:none;-moz-user-drag:none;-o-user-drag:none;width:100%}:host .scroll-main-container{display:block;height:100%;min-height:inherit;min-width:inherit;position:relative;width:100%}:host .scroll-main-container .content-zoom{display:block;height:100%;min-height:inherit;min-width:inherit;position:relative;transform-origin:0 0;width:100%;z-index:4}:host .scroll-main-container .content-zoom .content-hidder{display:block;height:100%;min-height:inherit;min-width:inherit;overflow:clip;position:relative;width:100%}:host .scroll-main-container .content-zoom .content-hidder .content-wrapper{display:var(--_scrollbar-container-display);height:100%;min-height:inherit;min-width:inherit;padding:var(--_scrollbar-content-padding);position:relative;width:100%}:host .scroll-main-container .scroller-wrapper .container-scroller{display:none;overflow:hidden;position:absolute;transition:transform .2s linear;z-index:5}:host .scroll-main-container .scroller-wrapper .container-scroller .shadow-scroller{background-color:var(--internal-scrollbar-container-color);border-radius:5px}:host .scroll-main-container .scroller-wrapper .container-scroller .shadow-scroller .scroller{background-color:var(--internal-scrollbar-color);border-radius:5px;cursor:pointer;position:absolute;-webkit-tap-highlight-color:rgba(0,0,0,0);touch-action:none;z-index:5}:host .scroll-main-container .scroller-wrapper .container-scroller .scroller.active{background-color:var(--internal-scrollbar-active-color)}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical{height:calc(100% - var(--internal-scroller-bottom)*2 - var(--internal-scroller-width));padding-left:var(--internal-scroller-left);right:var(--internal-scroller-right);top:var(--internal-scroller-bottom);transform:0;width:calc(var(--internal-scroller-width) + var(--internal-scroller-left))}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical.hide{transform:translateX(calc(var(--internal-scroller-width) + var(--internal-scroller-left)))}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical .shadow-scroller{height:100%}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical .shadow-scroller .scroller{width:calc(100% - var(--internal-scroller-left))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal{bottom:var(--internal-scroller-bottom);height:calc(var(--internal-scroller-width) + var(--internal-scroller-top));left:var(--internal-scroller-right);padding-top:var(--internal-scroller-top);transform:0;width:calc(100% - var(--internal-scroller-right)*2 - var(--internal-scroller-width))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal.hide{transform:translateY(calc(var(--internal-scroller-width) + var(--internal-scroller-top)))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal .shadow-scroller{height:100%}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal .shadow-scroller .scroller{height:calc(100% - var(--internal-scroller-top))}:host([y_scroll]) .scroll-main-container .content-zoom .content-hidder .content-wrapper{height:auto}:host([x_scroll]) .scroll-main-container .content-zoom .content-hidder .content-wrapper{width:auto}:host([y_scroll_visible]) .scroll-main-container .scroller-wrapper .container-scroller.vertical{display:block}:host([x_scroll_visible]) .scroll-main-container .scroller-wrapper .container-scroller.horizontal{display:block}:host([no_user_select]) .content-wrapper *{user-select:none}:host([no_user_select]) ::slotted{user-select:none}`;
    constructor() {
        super();
        this.renderAnimation = this.createAnimation();
        this.onWheel = this.onWheel.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMovePointer = this.onTouchMovePointer.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchMovePointer = this.onTouchMovePointer.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onTouchEndPointer = this.onTouchEndPointer.bind(this);
        this.touchRecord = new TouchRecord();
    }
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
  ]
}); }
    getClassName() {
        return "Scrollable";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('min_zoom')){ this['min_zoom'] = 1; }if(!this.hasAttribute('max_zoom')){ this['max_zoom'] = undefined; }if(!this.hasAttribute('y_scroll_visible')) { this.attributeChangedCallback('y_scroll_visible', false, false); }if(!this.hasAttribute('x_scroll_visible')) { this.attributeChangedCallback('x_scroll_visible', false, false); }if(!this.hasAttribute('floating_scroll')) { this.attributeChangedCallback('floating_scroll', false, false); }if(!this.hasAttribute('x_scroll')) { this.attributeChangedCallback('x_scroll', false, false); }if(!this.hasAttribute('y_scroll')) {this.setAttribute('y_scroll' ,'true'); }if(!this.hasAttribute('auto_hide')) { this.attributeChangedCallback('auto_hide', false, false); }if(!this.hasAttribute('break')){ this['break'] = 0.1; }if(!this.hasAttribute('disable')) { this.attributeChangedCallback('disable', false, false); }if(!this.hasAttribute('no_user_select')) { this.attributeChangedCallback('no_user_select', false, false); }if(!this.hasAttribute('mouse_drag')) { this.attributeChangedCallback('mouse_drag', false, false); }if(!this.hasAttribute('pinch')) { this.attributeChangedCallback('pinch', false, false); }if(!this.hasAttribute('zoom')){ this['zoom'] = 1; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('x');this.__correctGetter('y');this.__correctGetter('xMax');this.__correctGetter('yMax');this.__upgradeProperty('min_zoom');this.__upgradeProperty('max_zoom');this.__upgradeProperty('y_scroll_visible');this.__upgradeProperty('x_scroll_visible');this.__upgradeProperty('floating_scroll');this.__upgradeProperty('x_scroll');this.__upgradeProperty('y_scroll');this.__upgradeProperty('auto_hide');this.__upgradeProperty('break');this.__upgradeProperty('disable');this.__upgradeProperty('no_user_select');this.__upgradeProperty('mouse_drag');this.__upgradeProperty('pinch');this.__upgradeProperty('zoom'); }
    __listBoolProps() { return ["y_scroll_visible","x_scroll_visible","floating_scroll","x_scroll","y_scroll","auto_hide","disable","no_user_select","mouse_drag","pinch"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    createAnimation() {
        return new Aventus.Animation({
            fps: 60,
            animate: () => {
                const nextX = this.nextPosition('x');
                const nextY = this.nextPosition('y');
                this.momentum.x = nextX.momentum;
                this.momentum.y = nextY.momentum;
                this.scrollDirection('x', nextX.position);
                this.scrollDirection('y', nextY.position);
                if (!this.momentum.x && !this.momentum.y) {
                    this.renderAnimation.stop();
                }
            },
            stopped: () => {
                if (this.momentum.x || this.momentum.y) {
                    this.renderAnimation.start();
                }
            }
        });
    }
    nextPosition(direction) {
        const current = this.position[direction];
        const remain = this.momentum[direction];
        let result = {
            momentum: 0,
            position: 0,
        };
        if (Math.abs(remain) <= 0.1) {
            result.position = current + remain;
        }
        else {
            const _break = this.pointerCount > 0 ? 0.5 : this.break;
            let nextMomentum = remain * (1 - _break);
            nextMomentum |= 0;
            result.momentum = nextMomentum;
            result.position = current + remain - nextMomentum;
        }
        let correctPosition = this.correctScrollValue(result.position, direction);
        if (correctPosition != result.position) {
            result.position = correctPosition;
            result.momentum = 0;
        }
        return result;
    }
    scrollDirection(direction, value) {
        const max = this.max[direction];
        if (max != 0) {
            this.position[direction] = this.correctScrollValue(value, direction);
        }
        else {
            this.position[direction] = 0;
        }
        let container = this.scrollerContainer[direction]();
        let scroller = this.scroller[direction]();
        if (this.auto_hide) {
            container.classList.remove("hide");
            clearTimeout(this.hideDelay[direction]);
            this.hideDelay[direction] = setTimeout(() => {
                container.classList.add("hide");
            }, 1000);
        }
        let containerSize = direction == 'y' ? container.offsetHeight : container.offsetWidth;
        if (this.contentWrapperSize[direction] != 0) {
            let scrollPosition = this.position[direction] / this.contentWrapperSize[direction] * containerSize;
            scroller.style.transform = `translate${direction.toUpperCase()}(${scrollPosition}px)`;
            this.contentWrapper.style.transform = `translate3d(${-1 * this.x}px, ${-1 * this.y}px, 0)`;
        }
        this.triggerScrollChange();
    }
    scrollDirectionPercent(direction, percent) {
        const max = this.max[direction];
        this.scrollDirection(direction, max * percent / 100);
    }
    correctScrollValue(value, direction) {
        if (value < 0) {
            value = 0;
        }
        else if (value > this.max[direction]) {
            value = this.max[direction];
        }
        return value;
    }
    triggerScrollChange() {
        this.onScrollChange.trigger(this.x, this.y);
    }
    scrollToPosition(x, y) {
        this.scrollDirection('x', x);
        this.scrollDirection('y', y);
    }
    scrollX(x) {
        this.scrollDirection('x', x);
    }
    scrollXPercent(x) {
        this.scrollDirectionPercent('x', x);
    }
    scrollY(y) {
        this.scrollDirection('y', y);
    }
    scrollYPercent(y) {
        this.scrollDirectionPercent('y', y);
    }
    startAutoScrollRight() {
        if (!this.autoScrollInterval.right) {
            this.stopAutoScrollLeft();
            this.autoScrollInterval.right = setInterval(() => {
                if (this.x == this.max.x) {
                    this.stopAutoScrollRight();
                    return;
                }
                this.addDelta({
                    x: this.autoScrollSpeed.right,
                    y: 0
                });
            }, 100);
        }
    }
    autoScrollRight(percent = 50) {
        let slow = this.max.x * 1 / 100;
        let fast = this.max.x * 10 / 100;
        this.autoScrollSpeed.right = (fast - slow) * (percent / 100) + slow;
        this.startAutoScrollRight();
    }
    stopAutoScrollRight() {
        if (this.autoScrollInterval.right) {
            clearInterval(this.autoScrollInterval.right);
            this.autoScrollInterval.right = 0;
        }
    }
    startAutoScrollLeft() {
        if (!this.autoScrollInterval.left) {
            this.stopAutoScrollRight();
            this.autoScrollInterval.left = setInterval(() => {
                if (this.x == 0) {
                    this.stopAutoScrollLeft();
                    return;
                }
                this.addDelta({
                    x: this.autoScrollSpeed.left * -1,
                    y: 0
                });
            }, 100);
        }
    }
    autoScrollLeft(percent = 50) {
        let slow = this.max.x * 1 / 100;
        let fast = this.max.x * 10 / 100;
        this.autoScrollSpeed.left = (fast - slow) * (percent / 100) + slow;
        this.startAutoScrollLeft();
    }
    stopAutoScrollLeft() {
        if (this.autoScrollInterval.left) {
            clearInterval(this.autoScrollInterval.left);
            this.autoScrollInterval.left = 0;
        }
    }
    startAutoScrollTop() {
        if (!this.autoScrollInterval.top) {
            this.stopAutoScrollBottom();
            this.autoScrollInterval.top = setInterval(() => {
                if (this.y == 0) {
                    this.stopAutoScrollTop();
                    return;
                }
                this.addDelta({
                    x: 0,
                    y: this.autoScrollSpeed.top * -1
                });
            }, 100);
        }
    }
    autoScrollTop(percent = 50) {
        let slow = this.max.y * 1 / 100;
        let fast = this.max.y * 10 / 100;
        this.autoScrollSpeed.top = (fast - slow) * (percent / 100) + slow;
        this.startAutoScrollTop();
    }
    stopAutoScrollTop() {
        if (this.autoScrollInterval.top) {
            clearInterval(this.autoScrollInterval.top);
            this.autoScrollInterval.top = 0;
        }
    }
    startAutoScrollBottom() {
        if (!this.autoScrollInterval.bottom) {
            this.stopAutoScrollTop();
            this.autoScrollInterval.bottom = setInterval(() => {
                if (this.y == this.max.y) {
                    this.stopAutoScrollBottom();
                    return;
                }
                this.addDelta({
                    x: 0,
                    y: this.autoScrollSpeed.bottom
                });
            }, 100);
        }
    }
    autoScrollBottom(percent = 50) {
        let slow = this.max.y * 1 / 100;
        let fast = this.max.y * 10 / 100;
        this.autoScrollSpeed.bottom = (fast - slow) * (percent / 100) + slow;
        this.startAutoScrollBottom();
    }
    stopAutoScrollBottom() {
        if (this.autoScrollInterval.bottom) {
            clearInterval(this.autoScrollInterval.bottom);
            this.autoScrollInterval.bottom = 0;
        }
    }
    createMatrix() {
        if (!this.cachedSvg) {
            this.cachedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        }
        return this.cachedSvg.createSVGMatrix();
    }
    getMidPoint(a, b) {
        return {
            x: (a.lastPosition.x + b.lastPosition.x) / 2,
            y: (a.lastPosition.y + b.lastPosition.y) / 2,
        };
    }
    getDistance(a, b) {
        return Math.sqrt((b.lastPosition.x - a.lastPosition.x) ** 2 + (b.lastPosition.y - a.lastPosition.y) ** 2);
    }
    zoomOnPoint(clientX, clientY, newZoom) {
        let targetCoordinates = this.getBoundingClientRect();
        let mousePositionRelativeToTarget = {
            x: targetCoordinates.x - clientX,
            y: targetCoordinates.y - clientY
        };
        let oldScale = this.zoom;
        let newScale;
        if (this.max_zoom > 0) {
            newScale = Math.max(this.min_zoom, Math.min(this.max_zoom, newZoom));
        }
        else {
            newScale = Math.max(this.min_zoom, newZoom);
        }
        let scaleDiff = newScale / oldScale;
        const matrix = this.createMatrix()
            .translate(this.x, this.y)
            .translate(mousePositionRelativeToTarget.x, mousePositionRelativeToTarget.y)
            .scale(scaleDiff)
            .translate(-mousePositionRelativeToTarget.x, -mousePositionRelativeToTarget.y)
            .scale(this.zoom);
        const newZoomFinal = matrix.a || 1;
        const newX = matrix.e || 0;
        const newY = matrix.f || 0;
        this.zoom = newZoomFinal;
        this.onZoomChange.trigger(newZoomFinal);
        this.scrollDirection('x', newX);
        this.scrollDirection('y', newY);
    }
    pinchAction() {
        const touches = this.touchRecord.getTouches();
        if (touches.length == 2) {
            const newMidpoint = this.getMidPoint(touches[0], touches[1]);
            const prevMidpoint = this.previousMidPoint ?? newMidpoint;
            const positioningElRect = this.getBoundingClientRect();
            const originX = (positioningElRect.left + this.x - this.startTranslate.x) - prevMidpoint.x;
            const originY = (positioningElRect.top + this.y - this.startTranslate.y) - prevMidpoint.y;
            const newDistance = this.getDistance(touches[0], touches[1]);
            const prevDistance = this.previousDistance;
            let scaleDiff = prevDistance ? newDistance / prevDistance : 1;
            const panX = prevMidpoint.x - newMidpoint.x;
            const panY = prevMidpoint.y - newMidpoint.y;
            let oldScale = this.zoom;
            let newScale;
            if (this.max_zoom > 0) {
                newScale = Math.max(this.min_zoom, Math.min(this.max_zoom, oldScale * scaleDiff));
            }
            else {
                newScale = Math.max(this.min_zoom, oldScale * scaleDiff);
            }
            scaleDiff = newScale / oldScale;
            const matrix = this.createMatrix()
                .translate(panX, panY)
                .translate(originX, originY)
                .translate(this.x, this.y)
                .scale(scaleDiff)
                .translate(-originX, -originY)
                .scale(this.zoom);
            const newZoom = matrix.a || 1;
            const newX = matrix.e || 0;
            const newY = matrix.f || 0;
            this.zoom = newZoom;
            this.onZoomChange.trigger(newZoom);
            this.scrollDirection('x', newX);
            this.scrollDirection('y', newY);
            this.previousMidPoint = newMidpoint;
            this.previousDistance = newDistance;
        }
        return null;
    }
    addAction() {
        this.addEventListener("wheel", this.onWheel, { passive: false });
        this.pressManager = new Aventus.PressManager({
            element: this,
            offsetDrag: 0,
            onPressStart: (e) => {
                this.touchRecord.track(e.event);
                this.pointerCount = this.touchRecord.getNbOfTouches();
            },
            onPressEnd: (e) => {
                this.touchRecord.release(e.event);
                this.pointerCount = this.touchRecord.getNbOfTouches();
            },
            onDragStart: (e) => {
                if (!this.pinch && !this.x_scroll_visible && !this.y_scroll_visible) {
                    return false;
                }
                return this.onTouchStartPointer(e);
            },
            onDrag: (e) => {
                this.onTouchMovePointer(e);
            },
            onDragEnd: (e) => {
                this.onTouchEndPointer(e);
            }
        });
        // this.addEventListener("touchstart", this.onTouchStart);
        // this.addEventListener("trigger_pointer_pressstart", this.onTouchStartPointer);
        if (this.mouse_drag) {
            // this.addEventListener("mousedown", this.onTouchStart);
        }
        this.addScrollDrag('x');
        this.addScrollDrag('y');
    }
    addActionMove() {
        // document.body.addEventListener("touchmove", this.onTouchMove);
        // document.body.addEventListener("trigger_pointer_pressmove", this.onTouchMovePointer);
        // document.body.addEventListener("touchcancel", this.onTouchEnd);
        // document.body.addEventListener("touchend", this.onTouchEnd);
        // document.body.addEventListener("trigger_pointer_pressend", this.onTouchEndPointer);
        if (this.mouse_drag) {
            // document.body.addEventListener("mousemove", this.onTouchMove);
            // document.body.addEventListener("mouseup", this.onTouchEnd);
        }
    }
    removeActionMove() {
        // document.body.removeEventListener("touchmove", this.onTouchMove);
        // document.body.removeEventListener("trigger_pointer_pressmove", this.onTouchMovePointer);
        // document.body.removeEventListener("touchcancel", this.onTouchEnd);
        // document.body.removeEventListener("touchend", this.onTouchEnd);
        // document.body.removeEventListener("trigger_pointer_pressend", this.onTouchEndPointer);
        // document.body.removeEventListener("mousemove", this.onTouchMove);
        // document.body.removeEventListener("mouseup", this.onTouchEnd);
    }
    addScrollDrag(direction) {
        let scroller = this.scroller[direction]();
        let startPosition = 0;
        new Aventus.DragAndDrop({
            element: scroller,
            applyDrag: false,
            usePercent: true,
            offsetDrag: 0,
            isDragEnable: () => !this.disable,
            onStart: (e) => {
                this.isDragScroller = true;
                this.no_user_select = true;
                scroller.classList.add("active");
                startPosition = this.position[direction];
            },
            onMove: (e, position) => {
                let delta = position[direction] / 100 * this.contentWrapperSize[direction];
                let value = startPosition + delta;
                this.scrollDirection(direction, value);
            },
            onStop: () => {
                this.no_user_select = false;
                scroller.classList.remove("active");
                this.isDragScroller = false;
            }
        });
    }
    shouldStopPropagation(e, delta) {
        if (!this.y_scroll && this.x_scroll) {
            if ((delta.x > 0 && this.x != this.max.x) ||
                (delta.x <= 0 && this.x != 0)) {
                e.stopPropagation();
            }
        }
        else {
            if ((delta.y > 0 && this.y != this.max.y) ||
                (delta.y <= 0 && this.y != 0)) {
                e.stopPropagation();
            }
        }
    }
    addDelta(delta) {
        if (this.disable) {
            return;
        }
        this.momentum.x += delta.x;
        this.momentum.y += delta.y;
        this.renderAnimation?.start();
    }
    onWheel(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            if (this.pinch) {
                let factor = 0.9;
                if (e.deltaY < 0) {
                    factor = 1.1;
                }
                this.zoomOnPoint(e.clientX, e.clientY, this.zoom * factor);
            }
            return;
        }
        const DELTA_MODE = [1.0, 28.0, 500.0];
        const mode = DELTA_MODE[e.deltaMode] || DELTA_MODE[0];
        let newValue = {
            x: 0,
            y: e.deltaY * mode,
        };
        if (!this.y_scroll && this.x_scroll) {
            newValue = {
                x: e.deltaY * mode,
                y: 0,
            };
        }
        else if (this.x_scroll && e.altKey) {
            newValue = {
                x: e.deltaY * mode,
                y: 0,
            };
        }
        this.shouldStopPropagation(e, newValue);
        this.addDelta(newValue);
    }
    onTouchStartPointer(e) {
        const ev = e.event;
        if ('TouchEvent' in window && ev instanceof TouchEvent) {
            this.onTouchStart(ev);
            return true;
        }
        else if (ev instanceof PointerEvent) {
            if (this.mouse_drag || ev.pointerType == "touch") {
                this.onTouchStart(ev);
                return true;
            }
        }
        return false;
    }
    onTouchStart(e) {
        if (this.isDragScroller)
            return;
        this.touchRecord.track(e);
        this.momentum = {
            x: 0,
            y: 0
        };
        if (this.pointerCount === 0) {
            this.addActionMove();
        }
        this.pointerCount = this.touchRecord.getNbOfTouches();
        if (this.pinch && this.pointerCount == 2) {
            this.startTranslate = { x: this.x, y: this.y };
        }
    }
    onTouchMovePointer(e) {
        const ev = e.event;
        if ('TouchEvent' in window && ev instanceof TouchEvent) {
            this.onTouchMove(ev);
        }
        else if (ev instanceof PointerEvent) {
            if (this.mouse_drag || ev.pointerType == "touch") {
                this.onTouchMove(ev);
            }
        }
    }
    onTouchMove(e) {
        if (this.isDragScroller)
            return;
        this.touchRecord.update(e);
        if (this.pinch && this.pointerCount == 2) {
            // zoom
            e.stopPropagation();
            this.renderAnimation?.stop();
            this.pinchAction();
        }
        else {
            const delta = this.touchRecord.getDelta();
            this.shouldStopPropagation(e, delta);
            this.addDelta(delta);
        }
    }
    onTouchEndPointer(e) {
        const ev = e.event;
        if ('TouchEvent' in window && ev instanceof TouchEvent) {
            this.onTouchEnd(ev);
        }
        else if (ev instanceof PointerEvent) {
            if (this.mouse_drag || ev.pointerType == "touch") {
                this.onTouchEnd(ev);
            }
        }
    }
    onTouchEnd(e) {
        if (this.isDragScroller)
            return;
        const delta = this.touchRecord.getEasingDistance(this.break);
        this.shouldStopPropagation(e, delta);
        this.addDelta(delta);
        this.touchRecord.release(e);
        this.pointerCount = this.touchRecord.getNbOfTouches();
        if (this.pointerCount === 0) {
            this.removeActionMove();
        }
        if (this.pointerCount < 2) {
            this.previousMidPoint = undefined;
            this.previousDistance = undefined;
        }
    }
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
            this.contentZoom.style.width = this.mainContainer.offsetWidth / this.zoom + 'px';
            this.contentZoom.style.height = this.mainContainer.offsetHeight / this.zoom + 'px';
            this.contentZoom.style.maxHeight = this.mainContainer.offsetHeight / this.zoom + 'px';
            if (currentOffsetHeight != this.display.y || currentOffsetWidth != this.display.x)
                hasChanged = true;
            this.display.y = currentOffsetHeight;
            this.display.x = currentOffsetWidth;
        }
        else {
            const newX = currentOffsetWidth / this.zoom;
            const newY = currentOffsetHeight / this.zoom;
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
        const scrollerSize = ((this.display[direction] - this.margin[direction]) / this.contentWrapperSize[direction] * 100);
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
        if (this.contentWrapper.offsetHeight > 0 && this.contentWrapper.offsetWidth > 0) {
            this.loadedOnce = true;
            if (this.savedPercent) {
                this.position.x = this.contentWrapper.offsetWidth * this.savedPercent.x;
                this.position.y = this.contentWrapper.offsetHeight * this.savedPercent.y;
                this.savedPercent = undefined;
            }
        }
        else if (this.loadedOnce) {
            this.savedPercent = {
                x: this.position.x / this.contentWrapperSize.x,
                y: this.position.y / this.contentWrapperSize.y
            };
        }
        if (!this.calculateRealSize() && !force) {
            return;
        }
        if (this.contentWrapperSize.y - this.display.y > 0) {
            if (!this.y_scroll_visible) {
                this.y_scroll_visible = true;
                this.calculatePositionScrollerContainer('y');
            }
            this.calculateSizeScroller('y');
            this.scrollDirection('y', this.y);
        }
        else if (this.y_scroll_visible) {
            this.y_scroll_visible = false;
            this.calculatePositionScrollerContainer('y');
            this.calculateSizeScroller('y');
            this.scrollDirection('y', 0);
        }
        if (this.contentWrapperSize.x - this.display.x > 0) {
            if (!this.x_scroll_visible) {
                this.x_scroll_visible = true;
                this.calculatePositionScrollerContainer('x');
            }
            this.calculateSizeScroller('x');
            this.scrollDirection('x', this.x);
        }
        else if (this.x_scroll_visible) {
            this.x_scroll_visible = false;
            this.calculatePositionScrollerContainer('x');
            this.calculateSizeScroller('x');
            this.scrollDirection('x', 0);
        }
    }
    createResizeObserver() {
        let inProgress = false;
        return new Aventus.ResizeObserver({
            callback: entries => {
                if (inProgress) {
                    return;
                }
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
    postCreation() {
        this.dimensionRefreshed();
        this.addResizeObserver();
        this.addAction();
    }
    static lock(element) {
        const container = element.findParentByType(Layout.Scrollable);
        if (container) {
            container.disable = true;
        }
    }
    static unlock(element) {
        const container = element.findParentByType(Layout.Scrollable);
        if (container) {
            container.disable = false;
        }
    }
}
Layout.Scrollable.Namespace=`Aventus.Layout`;
Layout.Scrollable.Tag=`av-scrollable`;
__as1(_.Layout, 'Scrollable', Layout.Scrollable);
if(!window.customElements.get('av-scrollable')){window.customElements.define('av-scrollable', Layout.Scrollable);Aventus.WebComponentInstance.registerDefinition(Layout.Scrollable);}


for(let key in _) { Aventus[key] = _[key] }
})(Aventus);

var AventusI18nView;
(AventusI18nView||(AventusI18nView = {}));
(function (AventusI18nView) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `AventusI18nView`;
const _ = {};

let Components = {};
_.Components = AventusI18nView.Components ?? {};
let _n;
const TranslationRowHeader = class TranslationRowHeader extends Aventus.WebComponent {
    get 'locales'() {
						return this.__watch["locales"];
					}
					set 'locales'(val) {
						this.__watch["locales"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("locales");    super.__registerWatchesActions();
}
    static __style = `:host{align-items:stretch;border-bottom:1px solid var(--vscode-widget-border);border-left:1px solid var(--vscode-widget-border);border-right:1px solid var(--vscode-widget-border);display:flex;font-weight:bold;gap:0px;height:39px;text-align:center;user-select:none}:host .key{align-items:center;border-right:1px solid var(--vscode-widget-border);display:flex;flex-shrink:0;justify-content:center;min-width:100px;padding:10px 20px;position:relative;width:var(--_translation-page-key-width)}:host .inputs{display:flex;gap:0px}`;
    __getStatic() {
        return TranslationRowHeader;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TranslationRowHeader.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="key">    <span>Key</span>    <av-resize is_key></av-resize></div><div class="inputs"><template _id="translationrowheader_0"></template></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`    <av-translation-col-header _id="translationrowheader_1"></av-translation-col-header>`);templ0.setActions({
  "content": {
    "translationrowheader_1°@HTML": {
      "fct": (c) => `${c.print(c.comp.__189fa087d6daa05734acb2853341f755method2(c.data.locale))}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "translationrowheader_1",
      "injectionName": "locale",
      "inject": (c) => c.comp.__189fa087d6daa05734acb2853341f755method1(c.data.locale),
      "once": true
    }
  ]
});this.__getStatic().__template.addLoop({
                    anchorId: 'translationrowheader_0',
                    template: templ0,
                simple:{data: "this.locales",item:"locale"}}); }
    getClassName() {
        return "TranslationRowHeader";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["locales"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('locales'); }
    __189fa087d6daa05734acb2853341f755method2(locale) {
        return locale;
    }
    __189fa087d6daa05734acb2853341f755method1(locale) {
        return locale;
    }
}
TranslationRowHeader.Namespace=`AventusI18nView`;
TranslationRowHeader.Tag=`av-translation-row-header`;
__as1(_, 'TranslationRowHeader', TranslationRowHeader);
if(!window.customElements.get('av-translation-row-header')){window.customElements.define('av-translation-row-header', TranslationRowHeader);Aventus.WebComponentInstance.registerDefinition(TranslationRowHeader);}

const TranslationColHeader = class TranslationColHeader extends Aventus.WebComponent {
    get 'locale'() {
						return this.__watch["locale"];
					}
					set 'locale'(val) {
						this.__watch["locale"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("locale", ((target) => {
    target.style.setProperty("--translation-col-width", "var(--col-width-" + target.locale + ")");
}));    super.__registerWatchesActions();
}
    static __style = `:host{--_translation-col-width: var(--translation-col-width, 200px)}:host{align-items:center;border-right:1px solid var(--vscode-widget-border);display:flex;flex-shrink:0;gap:10px;justify-content:center;margin:0;padding:10px 20px;position:relative;width:var(--translation-col-width);min-width:200px}`;
    __getStatic() {
        return TranslationColHeader;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TranslationColHeader.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot><av-resize _id="translationcolheader_0"></av-resize>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "translationcolheader_0°locale": {
      "fct": (c) => `${c.print(c.comp.__c0f6c43ffbd917481fc06076601eea8amethod0())}`,
      "once": true
    }
  }
}); }
    getClassName() {
        return "TranslationColHeader";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["locale"] = ""; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('locale'); }
    __c0f6c43ffbd917481fc06076601eea8amethod0() {
        return this.locale;
    }
}
TranslationColHeader.Namespace=`AventusI18nView`;
TranslationColHeader.Tag=`av-translation-col-header`;
__as1(_, 'TranslationColHeader', TranslationColHeader);
if(!window.customElements.get('av-translation-col-header')){window.customElements.define('av-translation-col-header', TranslationColHeader);Aventus.WebComponentInstance.registerDefinition(TranslationColHeader);}

Components.Tooltip = class Tooltip extends Aventus.WebComponent {
    get 'visible'() { return this.getBoolAttr('visible') }
    set 'visible'(val) { this.setBoolAttr('visible', val) }get 'position'() { return this.getStringAttr('position') }
    set 'position'(val) { this.setStringAttr('position', val) }get 'use_absolute'() { return this.getBoolAttr('use_absolute') }
    set 'use_absolute'(val) { this.setBoolAttr('use_absolute', val) }get 'delay'() { return this.getNumberAttr('delay') }
    set 'delay'(val) { this.setNumberAttr('delay', val) }get 'delay_touch'() { return this.getNumberAttr('delay_touch') }
    set 'delay_touch'(val) { this.setNumberAttr('delay_touch', val) }get 'no_caret'() { return this.getBoolAttr('no_caret') }
    set 'no_caret'(val) { this.setBoolAttr('no_caret', val) }    parent = null;
    parentEv = null;
    isDestroyed = false;
    timeoutEnter = false;
    timeout = 0;
    pressManager;
    screenMargin = 10;
    elementsMoved = new Map();
    static __style = `:host{--local-tooltip-from-y: 0;--local-tooltip-from-x: 0;--local-tooltip-to-y: 0;--local-tooltip-to-x: 0;--local-offset-carret-x: 0px;--local-offset-carret-y: 0px;--_tooltip-background-color: var(--tooltip-background-color, var(--vscode-menu-background));--_tooltip-color: var(--tooltip-color, var(--vscode-menu-foreground));--_tooltip-border: var(--tooltip-border, var(--vscode-menu-border))}:host{background-color:var(--_tooltip-background-color);border:1px solid var(--_tooltip-border);border-radius:2px;color:var(--_tooltip-color);opacity:0;padding:5px 15px;pointer-events:none;position:absolute;transition:.3s opacity ease-in-out,.3s visibility ease-in-out,.3s top ease-in-out,.3s bottom ease-in-out,.3s right ease-in-out,.3s left ease-in-out,.3s transform ease-in-out;visibility:hidden;width:max-content;z-index:1}:host::after{content:"";position:absolute}:host([no_caret])::after{display:none}:host([visible]){opacity:1;visibility:visible}:host([position=bottom]){transform:translateX(-50%)}:host([position=bottom])::after{border-bottom:9px solid var(--_tooltip-background-color);border-left:6px solid rgba(0,0,0,0);border-right:6px solid rgba(0,0,0,0);left:calc(50% + var(--local-offset-carret-x));top:-8px;transform:translateX(-50%)}:host([use_absolute][position=bottom]){left:var(--local-tooltip-from-x);max-height:calc(100% - var(--local-tooltip-to-y) - 10px);top:var(--local-tooltip-from-y)}:host([use_absolute][visible][position=bottom]){top:var(--local-tooltip-to-y)}:host([position=bottom]:not([use_absolute])){bottom:0px;left:50%;transform:translateX(-50%) translateY(calc(100% - 10px))}:host([position=bottom][visible]:not([use_absolute])){transform:translateX(-50%) translateY(calc(100% + 10px))}:host([no_caret][use_absolute][position=bottom]){top:calc(var(--local-tooltip-from-y) - 8px)}:host([no_caret][use_absolute][visible][position=bottom]){top:calc(var(--local-tooltip-to-y) - 8px)}:host([position=top]){transform:translateX(-50%)}:host([position=top])::after{border-left:6px solid rgba(0,0,0,0);border-right:6px solid rgba(0,0,0,0);border-top:9px solid var(--_tooltip-background-color);bottom:-8px;left:calc(50% + var(--local-offset-carret-x));transform:translateX(-50%)}:host([use_absolute][position=top]){bottom:var(--local-tooltip-from-y);left:var(--local-tooltip-from-x);max-height:calc(100% - var(--local-tooltip-to-y) - 10px)}:host([use_absolute][visible][position=top]){bottom:var(--local-tooltip-to-y)}:host([position=top]:not([use_absolute])){left:50%;top:0px;transform:translateX(-50%) translateY(calc(-100% + 10px))}:host([position=top][visible]:not([use_absolute])){transform:translateX(-50%) translateY(calc(-100% - 10px))}:host([no_caret][use_absolute][position=top]){bottom:calc(var(--local-tooltip-from-y) - 6px)}:host([no_caret][use_absolute][visible][position=top]){bottom:calc(var(--local-tooltip-to-y) - 6px)}:host([position=right]){transform:translateY(-50%)}:host([position=right])::after{border-bottom:6px solid rgba(0,0,0,0);border-right:9px solid var(--_tooltip-background-color);border-top:6px solid rgba(0,0,0,0);left:-8px;top:calc(50% + var(--local-offset-carret-y));transform:translateY(-50%)}:host([use_absolute][position=right]){left:var(--local-tooltip-from-x);max-width:calc(100% - var(--local-tooltip-to-x) - 10px);top:var(--local-tooltip-from-y)}:host([use_absolute][visible][position=right]){left:var(--local-tooltip-to-x)}:host([position=right]:not([use_absolute])){right:0;top:50%;transform:translateX(calc(100% - 10px)) translateY(-50%)}:host([visible][position=right]:not([use_absolute])){transform:translateX(calc(100% + 10px)) translateY(-50%)}:host([no_caret][use_absolute][position=right]){left:calc(var(--local-tooltip-from-x) - 6px)}:host([no_caret][use_absolute][visible][position=right]){left:calc(var(--local-tooltip-to-x) - 6px)}:host([position=left]){right:var(--local-tooltip-from-x);top:var(--local-tooltip-from-y);transform:translateY(-50%)}:host([position=left])::after{border-bottom:6px solid rgba(0,0,0,0);border-left:9px solid var(--_tooltip-background-color);border-top:6px solid rgba(0,0,0,0);right:-8px;top:calc(50% + var(--local-offset-carret-y));transform:translateY(-50%)}:host([use_absolute][position=left]){max-width:calc(100% - var(--local-tooltip-to-x) - 10px);right:var(--local-tooltip-from-x);top:var(--local-tooltip-from-y)}:host([use_absolute][visible][position=left]){right:var(--local-tooltip-to-x)}:host([position=left]:not([use_absolute])){left:0;top:50%;transform:translateX(calc(-100% + 10px)) translateY(-50%)}:host([visible][position=left]:not([use_absolute])){transform:translateX(calc(-100% - 10px)) translateY(-50%)}:host([no_caret][use_absolute][position=left]){right:calc(var(--local-tooltip-from-x) - 6px)}:host([no_caret][use_absolute][visible][position=left]){right:calc(var(--local-tooltip-to-x) - 6px)}`;
    constructor() {
        super();
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onTransitionEnd = this.onTransitionEnd.bind(this);
    }
    __getStatic() {
        return Tooltip;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Tooltip.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Tooltip";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('visible')) { this.attributeChangedCallback('visible', false, false); }if(!this.hasAttribute('position')){ this['position'] = 'top'; }if(!this.hasAttribute('use_absolute')) { this.attributeChangedCallback('use_absolute', false, false); }if(!this.hasAttribute('delay')){ this['delay'] = 700; }if(!this.hasAttribute('delay_touch')){ this['delay_touch'] = 700; }if(!this.hasAttribute('no_caret')) { this.attributeChangedCallback('no_caret', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('visible');this.__upgradeProperty('position');this.__upgradeProperty('use_absolute');this.__upgradeProperty('delay');this.__upgradeProperty('delay_touch');this.__upgradeProperty('no_caret'); }
    __listBoolProps() { return ["visible","use_absolute","no_caret"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    calculatePosition() {
        if (!this.parentEv || !this.use_absolute)
            return;
        let rect = this.parentEv.getBoundingClientRect();
        let center = {
            x: rect.left + rect.width / 2,
            y: rect.y + rect.height / 2
        };
        if (this.use_absolute) {
            const diffMinX = center.x - this.offsetWidth / 2;
            const diffMaxX = center.x + this.offsetWidth / 2;
            const maxX = document.body.offsetWidth - this.screenMargin;
            const minX = this.screenMargin;
            if (diffMinX < minX) {
                center.x += minX - diffMinX;
                this.style.setProperty("--local-offset-carret-x", diffMinX - minX + 'px');
            }
            else if (diffMaxX > maxX) {
                center.x += maxX - diffMaxX;
                this.style.setProperty("--local-offset-carret-x", diffMaxX - maxX + 'px');
            }
            const diffMinY = center.y - this.offsetHeight / 2;
            const diffMaxY = center.y + this.offsetHeight / 2;
            const maxY = document.body.offsetHeight - this.screenMargin;
            const minY = this.screenMargin;
            if (diffMinY < minY) {
                center.y += minY - diffMinY;
                this.style.setProperty("--local-offset-carret-y", diffMinY - minY + 'px');
            }
            else if (diffMaxY > maxY) {
                center.y += maxY - diffMaxY;
                this.style.setProperty("--local-offset-carret-y", diffMaxY - maxY + 'px');
            }
        }
        if (this.position == 'bottom') {
            let bottom = rect.y + rect.height;
            this.style.setProperty("--local-tooltip-from-y", bottom - 10 + 'px');
            this.style.setProperty("--local-tooltip-from-x", center.x + 'px');
            this.style.setProperty("--local-tooltip-to-x", center.x + 'px');
            this.style.setProperty("--local-tooltip-to-y", bottom + 10 + 'px');
        }
        else if (this.position == 'top') {
            let bottom = document.body.offsetHeight - rect.top;
            this.style.setProperty("--local-tooltip-from-y", bottom - 10 + 'px');
            this.style.setProperty("--local-tooltip-from-x", center.x + 'px');
            this.style.setProperty("--local-tooltip-to-x", center.x + 'px');
            this.style.setProperty("--local-tooltip-to-y", bottom + 10 + 'px');
        }
        else if (this.position == 'right') {
            let left = rect.x + rect.width;
            this.style.setProperty("--local-tooltip-from-y", center.y + 'px');
            this.style.setProperty("--local-tooltip-from-x", left - 10 + 'px');
            this.style.setProperty("--local-tooltip-to-x", left + 10 + 'px');
            this.style.setProperty("--local-tooltip-to-y", center.y + 10 + 'px');
        }
        else if (this.position == 'left') {
            let left = document.body.offsetWidth - rect.left;
            this.style.setProperty("--local-tooltip-from-y", center.y + 'px');
            this.style.setProperty("--local-tooltip-from-x", left - 10 + 'px');
            this.style.setProperty("--local-tooltip-to-x", left + 10 + 'px');
            this.style.setProperty("--local-tooltip-to-y", center.y + 'px');
        }
    }
    moveNodesToThis() {
        if (this.use_absolute) {
            const elements = this.getNodesInSlot();
            for (let element of elements) {
                this.elementsMoved.set(element, element.parentElement);
                this.shadowRoot.appendChild(element);
            }
        }
    }
    removeNodesFromThis() {
        if (this.use_absolute) {
            for (const [node, parent] of this.elementsMoved) {
                // TODO solution simpliste voir si ça marche vrm
                parent.appendChild(node);
            }
        }
    }
    onMouseEnter() {
        this.moveNodesToThis();
        this.calculatePosition();
        let delay = this.delay == 0 ? 50 : this.delay;
        if (this.use_absolute) {
            document.body.appendChild(this);
            this.timeoutEnter = false;
            this.timeout = setTimeout(() => {
                this.timeoutEnter = true;
                this.visible = true;
            }, delay);
        }
        else {
            if (delay == 0) {
                this.visible = true;
            }
            else {
                this.timeoutEnter = false;
                this.timeout = setTimeout(() => {
                    this.timeoutEnter = true;
                    this.visible = true;
                }, delay);
            }
        }
    }
    onMouseLeave() {
        this.visible = false;
        if (this.use_absolute) {
            if (!this.timeoutEnter) {
                clearTimeout(this.timeout);
                this.onTransitionEnd();
            }
        }
        else if (this.delay != 0) {
            if (!this.timeoutEnter) {
                clearTimeout(this.timeout);
                this.onTransitionEnd();
            }
        }
    }
    onTransitionEnd() {
        if (!this.use_absolute || this.visible)
            return;
        this.removeNodesFromThis();
        if (this.parent && !this.isDestroyed)
            this.parent?.appendChild(this);
        else
            this.remove();
    }
    onLongPress() {
        this.calculatePosition();
        if (this.use_absolute) {
            document.body.appendChild(this);
            this.timeoutEnter = false;
            this.timeout = setTimeout(() => {
                this.timeoutEnter = true;
                this.visible = true;
            }, 50);
        }
        else {
            this.visible = true;
        }
    }
    registerAction() {
        if (!this.parentEv)
            return;
        this.parentEv.addEventListener("mouseenter", this.onMouseEnter);
        this.parentEv.addEventListener("mouseleave", this.onMouseLeave);
        this.addEventListener("transitionend", this.onTransitionEnd);
    }
    postCreation() {
        let parentEv = this.parentNode;
        if (parentEv instanceof ShadowRoot) {
            parentEv = parentEv.host;
        }
        if (parentEv instanceof HTMLElement) {
            this.parentEv = parentEv;
        }
        this.parent = this.parentNode;
        this.registerAction();
    }
    postDestruction() {
        this.isDestroyed = true;
        super.postDestruction();
        if (!this.parentEv)
            return;
        this.parentEv.removeEventListener("mouseenter", this.onMouseEnter);
        this.parentEv.removeEventListener("mouseleave", this.onMouseLeave);
    }
}
Components.Tooltip.Namespace=`AventusI18nView.Components`;
Components.Tooltip.Tag=`av-tooltip`;
__as1(_.Components, 'Tooltip', Components.Tooltip);
if(!window.customElements.get('av-tooltip')){window.customElements.define('av-tooltip', Components.Tooltip);Aventus.WebComponentInstance.registerDefinition(Components.Tooltip);}

const Textarea = class Textarea extends Aventus.WebComponent {
    static get observedAttributes() {return ["error"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'error'() { return this.getBoolProp('error') }
    set 'error'(val) { this.setBoolAttr('error', val) }    get 'value'() {
						return this.__watch["value"];
					}
					set 'value'(val) {
						this.__watch["value"] = val;
					}    preventDrag;
    change = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("value", ((target) => {
    target.textarea.value = target.value;
}));    super.__registerWatchesActions();
}
    static __style = `:host{width:100%}:host vscode-textarea{width:100%}`;
    __getStatic() {
        return Textarea;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Textarea.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<vscode-textarea resize="vertical" rows="1" _id="textarea_0"></vscode-textarea>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "textarea",
      "ids": [
        "textarea_0"
      ]
    }
  ],
  "injection": [
    {
      "id": "textarea_0",
      "injectionName": "invalid",
      "inject": (c) => c.comp.__9affda56eddd377764c7a23adf1303f8method0(),
      "once": true
    }
  ],
  "events": [
    {
      "eventName": "change",
      "id": "textarea_0",
      "fct": (e, c) => c.comp.onChange(e)
    }
  ]
}); }
    getClassName() {
        return "Textarea";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('error')) { this.attributeChangedCallback('error', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["value"] = "salut"; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('error');this.__correctGetter('value'); }
    __listBoolProps() { return ["error"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    preventDragFct() {
        this.preventDrag = new Aventus.DragAndDrop({
            element: this,
            applyDrag: false,
            offsetDrag: 0,
            onMove: () => {
            }
        });
    }
    onChange() {
        debugger;
        this.value = this.textarea.value;
        this.change.trigger(this.value);
    }
    postCreation() {
        super.postCreation();
        this.preventDragFct();
    }
    __9affda56eddd377764c7a23adf1303f8method0() {
        return this.error;
    }
}
Textarea.Namespace=`AventusI18nView`;
Textarea.Tag=`av-textarea`;
__as1(_, 'Textarea', Textarea);
if(!window.customElements.get('av-textarea')){window.customElements.define('av-textarea', Textarea);Aventus.WebComponentInstance.registerDefinition(Textarea);}

let StringTools=class StringTools {
    static removeAccents(value) {
        return value
            .replace(/[áàãâä]/gi, "a")
            .replace(/[éè¨ê]/gi, "e")
            .replace(/[íìïî]/gi, "i")
            .replace(/[óòöôõ]/gi, "o")
            .replace(/[úùüû]/gi, "u")
            .replace(/[ç]/gi, "c")
            .replace(/[ñ]/gi, "n")
            .replace(/[^a-zA-Z0-9]/g, " ");
    }
    static contains(src, search) {
        if (src === undefined)
            return false;
        const _src = this.removeAccents((src + '').toLowerCase());
        const _search = this.removeAccents((search + '').toLowerCase());
        return _src.includes(_search);
    }
    static search(src, search) {
        const terms = search.split(" ");
        for (let _term of terms) {
            const term = _term.trim();
            if (term) {
                if (this.contains(src, term)) {
                    return true;
                }
            }
        }
        return false;
    }
    static firstLetterUpper(txt) {
        return txt.slice(0, 1).toUpperCase() + txt.slice(1);
    }
}
StringTools.Namespace=`AventusI18nView`;
__as1(_, 'StringTools', StringTools);

let DemoData= {
    "click me1": {
        "en-GB": "click me",
        "fr-CH": "presse moi"
    },
    "click me2": {
        "en-GB": "ⵌⵌ",
        "fr-CH": "presse moi"
    }
};
__as1(_, 'DemoData', DemoData);

const Loading = class Loading extends Aventus.WebComponent {
    get 'visible'() { return this.getBoolAttr('visible') }
    set 'visible'(val) { this.setBoolAttr('visible', val) }    static _instance;
    static _minTimeDisplay;
    static _minTimeShow;
    static _showTime;
    static __style = `:host{--_loading-dot-size: var(--loading-dot-size, 16px);--_loading-size: var(--loading-size, 84px)}:host{align-items:center;background-color:rgba(0,0,0,.3);display:none;inset:0;justify-content:center;position:fixed;z-index:999}@keyframes l4{to{transform:rotate(1turn)}}:host .loader{animation:l4 1s infinite steps(10);aspect-ratio:1;background:conic-gradient(rgba(0, 0, 0, 0) 10%, var(--vscode-input-foreground)) content-box;border-radius:50%;-webkit-mask:repeating-conic-gradient(rgba(0, 0, 0, 0) 0deg, #000 1deg 20deg, rgba(0, 0, 0, 0) 21deg 36deg),radial-gradient(farthest-side, rgba(0, 0, 0, 0) calc(100% - var(--_loading-dot-size) - 1px), #000 calc(100% - var(--_loading-dot-size)));-webkit-mask-composite:destination-in;mask-composite:intersect;padding:1px;width:var(--_loading-size)}:host([visible]){display:flex}`;
    __getStatic() {
        return Loading;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Loading.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="loader"></div>` }
    });
}
    getClassName() {
        return "Loading";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('visible')) { this.attributeChangedCallback('visible', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('visible'); }
    __listBoolProps() { return ["visible"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    static show(minTimeShow = 100, minTimeDisplay = 1000) {
        this._minTimeDisplay = minTimeDisplay;
        this._minTimeShow = minTimeShow;
        if (!this._instance) {
            this._instance = new Loading();
            document.body.appendChild(this._instance);
        }
        if (this._minTimeDisplay) {
            const d = new Date();
            this._showTime = d.getTime();
        }
        this._instance.visible = true;
    }
    static hide() {
        if (this._minTimeDisplay && this._showTime && this._instance) {
            const now = new Date();
            const diff = now.getTime() - this._showTime;
            if (diff > this._minTimeDisplay) {
                this._instance.visible = false;
            }
            else {
                const instance = this._instance;
                const delay = this._minTimeDisplay - diff;
                setTimeout(() => {
                    instance.visible = false;
                }, delay);
            }
        }
    }
}
Loading.Namespace=`AventusI18nView`;
Loading.Tag=`av-loading`;
__as1(_, 'Loading', Loading);
if(!window.customElements.get('av-loading')){window.customElements.define('av-loading', Loading);Aventus.WebComponentInstance.registerDefinition(Loading);}

const IconTooltip = class IconTooltip extends Aventus.WebComponent {
    static get observedAttributes() {return ["name"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'notif'() { return this.getBoolAttr('notif') }
    set 'notif'(val) { this.setBoolAttr('notif', val) }get 'active'() { return this.getBoolAttr('active') }
    set 'active'(val) { this.setBoolAttr('active', val) }    get 'name'() { return this.getStringProp('name') }
    set 'name'(val) { this.setStringAttr('name', val) }    static __style = `:host{border-radius:6px;cursor:pointer;height:32px;padding:8px;position:relative;transition:background-color .2s linear;width:32px}:host vscode-icon{height:100%;width:100%}:host .notif{background-color:var(--vscode-icon-foreground);border-radius:10px;display:none;height:10px;position:absolute;right:3px;top:3px;width:10px}:host([active])::after{border:1px solid var(--vscode-button-secondaryHoverBackground);border-radius:6px;content:"";height:100%;left:50%;pointer-events:none;position:absolute;top:50%;transform:translate(-50%, -50%);width:100%}:host(:hover){background-color:var(--vscode-button-secondaryHoverBackground)}:host([notif]) .notif{display:block}`;
    __getStatic() {
        return IconTooltip;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(IconTooltip.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<vscode-icon _id="icontooltip_0"></vscode-icon><av-tooltip use_absolute no_caret>    <slot></slot></av-tooltip><div class="notif"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "icontooltip_0°name": {
      "fct": (c) => `${c.print(c.comp.__6b93c63e12520a69df7261ff7f843c0fmethod0())}`,
      "once": true
    }
  }
}); }
    getClassName() {
        return "IconTooltip";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('notif')) { this.attributeChangedCallback('notif', false, false); }if(!this.hasAttribute('active')) { this.attributeChangedCallback('active', false, false); }if(!this.hasAttribute('name')){ this['name'] = "symbol-array"; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('notif');this.__upgradeProperty('active');this.__upgradeProperty('name'); }
    __listBoolProps() { return ["notif","active"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    postCreation() {
        super.postCreation();
    }
    __6b93c63e12520a69df7261ff7f843c0fmethod0() {
        return this.name;
    }
}
IconTooltip.Namespace=`AventusI18nView`;
IconTooltip.Tag=`av-icon-tooltip`;
__as1(_, 'IconTooltip', IconTooltip);
if(!window.customElements.get('av-icon-tooltip')){window.customElements.define('av-icon-tooltip', IconTooltip);Aventus.WebComponentInstance.registerDefinition(IconTooltip);}

const GenericPopup = class GenericPopup extends Aventus.WebComponent {
    static get observedAttributes() {return ["popup_title"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'popup_title'() { return this.getStringProp('popup_title') }
    set 'popup_title'(val) { this.setStringAttr('popup_title', val) }    cb;
    static __style = `:host{align-items:center;background-color:rgba(0,0,0,.3);display:flex;inset:0;justify-content:center;position:fixed;z-index:999}:host .popup{background-color:var(--vscode-panel-background);border:var(--vscode-panel-border);border-radius:4px;box-shadow:var(--elevation-8);max-width:min(800px,100% - 100px);min-width:400px;padding:15px}:host .popup .title{font-size:24px;font-weight:bold;margin-bottom:10px}:host .popup .content{font-size:16px}:host .popup .actions{align-items:center;display:flex;font-size:16px;gap:10px;justify-content:flex-end;margin-top:10px}`;
    __getStatic() {
        return GenericPopup;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(GenericPopup.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>`,'actions':`<slot name="actions">            <vscode-button _id="genericpopup_1">Close</vscode-button>        </slot>` }, 
        blocks: { 'default':`<div class="popup">    <div class="title" _id="genericpopup_0"></div>    <div class="content">        <slot></slot>    </div>    <div class="actions">        <slot name="actions">            <vscode-button _id="genericpopup_1">Close</vscode-button>        </slot>    </div></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "closeBtn",
      "ids": [
        "genericpopup_1"
      ]
    }
  ],
  "content": {
    "genericpopup_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__e07b11b2e32632baaa472cf6cd242d2fmethod0())}`,
      "once": true
    }
  },
  "pressEvents": [
    {
      "id": "genericpopup_1",
      "onPress": (e, pressInstance, c) => { c.comp.close(e, pressInstance); }
    }
  ]
}); }
    getClassName() {
        return "GenericPopup";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('popup_title')){ this['popup_title'] = undefined; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('popup_title'); }
    close() {
        this.remove();
        if (this.cb) {
            this.cb();
        }
    }
    __e07b11b2e32632baaa472cf6cd242d2fmethod0() {
        return this.popup_title;
    }
    static show(popup) {
        return new Promise((resolve) => {
            popup.cb = resolve;
            document.body.appendChild(popup);
        });
    }
}
GenericPopup.Namespace=`AventusI18nView`;
GenericPopup.Tag=`av-generic-popup`;
__as1(_, 'GenericPopup', GenericPopup);
if(!window.customElements.get('av-generic-popup')){window.customElements.define('av-generic-popup', GenericPopup);Aventus.WebComponentInstance.registerDefinition(GenericPopup);}

const Popup = class Popup extends GenericPopup {
    static __style = ``;
    __getStatic() {
        return Popup;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Popup.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`` }
    });
}
    getClassName() {
        return "Popup";
    }
}
Popup.Namespace=`AventusI18nView`;
Popup.Tag=`av-popup`;
__as1(_, 'Popup', Popup);
if(!window.customElements.get('av-popup')){window.customElements.define('av-popup', Popup);Aventus.WebComponentInstance.registerDefinition(Popup);}

const ApiKeyPopup = class ApiKeyPopup extends GenericPopup {
    static get observedAttributes() {return ["popup_title"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'popup_title'() { return this.getStringProp('popup_title') }
    set 'popup_title'(val) { this.setStringAttr('popup_title', val) }    apiKeySet = false;
    static __style = `:host vscode-textfield{width:calc(100% - 32px);margin:16px}:host .cancel{--vscode-button-background: var(--vscode-editorError-foreground);--vscode-button-hoverBackground: #f45d5d}`;
    __getStatic() {
        return ApiKeyPopup;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ApiKeyPopup.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'actions':`	<vscode-button class="cancel" _id="apikeypopup_1">Close</vscode-button>	<vscode-button _id="apikeypopup_2">Save</vscode-button>`,'default':`<vscode-textfield placeholder="Deepl Api Key" _id="apikeypopup_0"></vscode-textfield>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "keyInput",
      "ids": [
        "apikeypopup_0"
      ]
    },
    {
      "name": "closeBtn",
      "ids": [
        "apikeypopup_1"
      ]
    },
    {
      "name": "saveBtn",
      "ids": [
        "apikeypopup_2"
      ]
    }
  ],
  "pressEvents": [
    {
      "id": "apikeypopup_1",
      "onPress": (e, pressInstance, c) => { c.comp.close(e, pressInstance); }
    },
    {
      "id": "apikeypopup_2",
      "onPress": (e, pressInstance, c) => { c.comp.save(e, pressInstance); }
    }
  ]
}); }
    getClassName() {
        return "ApiKeyPopup";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('popup_title')){ this['popup_title'] = "Deepl api key is missing"; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('popup_title'); }
    async save() {
        const value = this.keyInput.value.trim();
        this.apiKeySet = value != '';
        const result = await VscodeView.Router.getInstance().sendWithResponse({
            channel: "setApiKey",
            body: {
                key: value,
            }
        });
        this.close();
    }
}
ApiKeyPopup.Namespace=`AventusI18nView`;
ApiKeyPopup.Tag=`av-api-key-popup`;
__as1(_, 'ApiKeyPopup', ApiKeyPopup);
if(!window.customElements.get('av-api-key-popup')){window.customElements.define('av-api-key-popup', ApiKeyPopup);Aventus.WebComponentInstance.registerDefinition(ApiKeyPopup);}

const Alert = class Alert extends GenericPopup {
    static __style = ``;
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
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Alert";
    }
    static make(title, content) {
        return new Promise((resolve) => {
            const el = new Alert();
            el.popup_title = title;
            el.innerHTML = content;
            el.cb = resolve;
            document.body.appendChild(el);
        });
    }
}
Alert.Namespace=`AventusI18nView`;
Alert.Tag=`av-alert`;
__as1(_, 'Alert', Alert);
if(!window.customElements.get('av-alert')){window.customElements.define('av-alert', Alert);Aventus.WebComponentInstance.registerDefinition(Alert);}

let Translator=class Translator {
    static async translate(value, source, destination, askKey = true) {
        const result = await VscodeView.Router.getInstance().sendWithResponse({
            channel: "translate",
            body: {
                value,
                source,
                destination
            }
        });
        if (!result.result)
            return null;
        if (askKey && result.result.error == "No api key") {
            let popup = new ApiKeyPopup();
            await ApiKeyPopup.show(popup);
            if (popup.apiKeySet) {
                return await this.translate(value, source, destination, false);
            }
            return null;
        }
        else if (result.result.error) {
            await Alert.make("Error", result.result.error);
            return null;
        }
        return result.result.result;
    }
}
Translator.Namespace=`AventusI18nView`;
__as1(_, 'Translator', Translator);

const TranslateAllPopup = class TranslateAllPopup extends GenericPopup {
    static get observedAttributes() {return ["is_running"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'is_running'() { return this.getBoolProp('is_running') }
    set 'is_running'(val) { this.setBoolAttr('is_running', val) }    get 'fallback'() {
						return this.__watch["fallback"];
					}
					set 'fallback'(val) {
						this.__watch["fallback"] = val;
					}    parsed = {};
    locales = [];
    __registerWatchesActions() {
    this.__addWatchesActions("fallback");    super.__registerWatchesActions();
}
    static __style = `:host .popup{height:calc(100% - 50px);max-width:calc(100% - 100px);min-width:auto;width:100%}:host .popup .content{height:calc(100% - 45px)}:host .header{display:flex;gap:20px;justify-content:stretch}:host .header .left{width:100%}:host .header .right{position:relative;width:100px}:host .header .right av-loading{--loading-size: 40px;--loading-dot-size: 5px;background-color:rgba(0,0,0,0);position:absolute}:host .sub-title{font-size:calc(var(--vscode-font-size)*.9)}:host .list{border:1px solid var(--vscode-widget-border);border-radius:5px;display:flex;flex-direction:column;height:calc(100% - 78px);margin-top:15px;overflow:hidden}:host .list .item{align-items:stretch;display:flex;padding:0 15px}:host .list .item .source{align-items:center;border-right:1px solid var(--vscode-widget-border);display:flex;flex-shrink:0;padding:5px 10px;width:50%}:host .list .item .result{display:flex;flex-direction:column;flex-shrink:0;gap:2px;justify-content:center;padding:5px 10px;width:50%}:host .list .item .result span:nth-child(2){color:var(--vscode-settings-textInputForeground);font-size:calc(var(--vscode-font-size)*.8)}:host .list .item:nth-child(odd){background-color:var(--vscode-editorWidget-background)}:host .list .item:last-child{border-bottom:1px solid var(--vscode-widget-border)}:host .list .item.head{background-color:rgba(0,0,0,0);border-bottom:1px solid var(--vscode-widget-border);border-left:1px solid var(--vscode-widget-border);border-right:1px solid var(--vscode-widget-border)}:host .list .item.head .result,:host .list .item.head .source{flex-direction:row;font-weight:bold;justify-content:center;padding:10px 0}:host .scroll{height:calc(100% - 40px)}`;
    __getStatic() {
        return TranslateAllPopup;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TranslateAllPopup.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="header">	<div class="left">		<div class="title">Translate all</div>		<div class="sub-title" _id="translateallpopup_0"></div>	</div>	<div class="right">		<av-loading _id="translateallpopup_1"></av-loading>	</div></div><div class="list">	<div class="item head">		<div class="source" _id="translateallpopup_2"></div>		<div class="result">Result</div>	</div>	<av-scrollable class="scroll" floating_scroll auto_hide mouse_drag _id="translateallpopup_3">	</av-scrollable></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "scrollEl",
      "ids": [
        "translateallpopup_3"
      ]
    }
  ],
  "content": {
    "translateallpopup_0°@HTML": {
      "fct": (c) => `Source lang : ${c.print(c.comp.__68a6f2046cb9c9d100a4c888b5011073method0())}`,
      "once": true
    },
    "translateallpopup_2°@HTML": {
      "fct": (c) => `Source (${c.print(c.comp.__68a6f2046cb9c9d100a4c888b5011073method0())})`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "translateallpopup_1",
      "injectionName": "visible",
      "inject": (c) => c.comp.__68a6f2046cb9c9d100a4c888b5011073method1(),
      "once": true
    }
  ]
}); }
    getClassName() {
        return "TranslateAllPopup";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('is_running')) { this.attributeChangedCallback('is_running', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["fallback"] = ""; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('is_running');this.__correctGetter('fallback'); }
    __listBoolProps() { return ["is_running"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    async run() {
        this.closeBtn['disabled'] = true;
        this.is_running = true;
        await Aventus.sleep(5000);
        for (let key in this.parsed) {
            for (let locale of this.locales) {
                if (!this.parsed[key][locale] || this.parsed[key][locale] == TranslationPage.KeyUndefined) {
                    if (locale == this.fallback) {
                        this.parsed[key][locale] = key;
                        this.addTranslation(key, locale, key);
                    }
                    else {
                        const result = await Translator.translate(key, this.fallback, locale);
                        if (result) {
                            this.parsed[key][locale] = result;
                            this.addTranslation(key, locale, result);
                        }
                    }
                }
            }
        }
        this.closeBtn['disabled'] = false;
        this.is_running = false;
    }
    addTranslation(key, locale, result) {
        const el = document.createElement("div");
        el.classList.add("item");
        el.innerHTML = `<div class="source">${key}</div><div class="result"><span>${result}</span><span>${locale}</span></div>`;
        this.scrollEl.prepend(el);
    }
    postCreation() {
        super.postCreation();
    }
    __68a6f2046cb9c9d100a4c888b5011073method0() {
        return this.fallback;
    }
    __68a6f2046cb9c9d100a4c888b5011073method1() {
        return this.is_running;
    }
}
TranslateAllPopup.Namespace=`AventusI18nView`;
TranslateAllPopup.Tag=`av-translate-all-popup`;
__as1(_, 'TranslateAllPopup', TranslateAllPopup);
if(!window.customElements.get('av-translate-all-popup')){window.customElements.define('av-translate-all-popup', TranslateAllPopup);Aventus.WebComponentInstance.registerDefinition(TranslateAllPopup);}

const TranslationCol = class TranslationCol extends Aventus.WebComponent {
    static get observedAttributes() {return ["error"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'icon_btn'() { return this.getBoolAttr('icon_btn') }
    set 'icon_btn'(val) { this.setBoolAttr('icon_btn', val) }    get 'error'() { return this.getBoolProp('error') }
    set 'error'(val) { this.setBoolAttr('error', val) }    get 'locale'() {
						return this.__watch["locale"];
					}
					set 'locale'(val) {
						this.__watch["locale"] = val;
					}get 'value'() {
						return this.__watch["value"];
					}
					set 'value'(val) {
						this.__watch["value"] = val;
					}    initialValue;
    change = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("locale", ((target) => {
    target.style.setProperty("--translation-col-width", "var(--col-width-" + target.locale + ")");
}));this.__addWatchesActions("value", ((target) => {
    target.showIcon();
}));    super.__registerWatchesActions();
}
    static __style = `:host{--_translation-col-width: var(--translation-col-width, 200px)}:host{align-items:center;display:flex;flex-shrink:0;gap:10px;margin:0;min-width:200px;position:relative;width:var(--_translation-col-width)}:host vscode-icon{background-color:rgba(0,0,0,0);border-radius:5px;cursor:pointer;display:none;padding:4px;transition:background-color linear .2s}:host vscode-icon:hover{background-color:var(--vscode-button-secondaryBackground)}:host .resize{background-color:red;bottom:0;cursor:col-resize;position:absolute;right:-4px;top:0;width:8px}:host([icon_btn]) vscode-icon{display:inline-block}`;
    __getStatic() {
        return TranslationCol;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TranslationCol.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<av-textarea _id="translationcol_0"></av-textarea><div class="action">    <vscode-icon name="book" _id="translationcol_1"></vscode-icon></div><av-resize _id="translationcol_2"></av-resize>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "translationcol_2°locale": {
      "fct": (c) => `${c.print(c.comp.__5c58baf68a3de763ecfa54cfd926bb36method2())}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "translationcol_0",
      "injectionName": "value",
      "inject": (c) => c.comp.__5c58baf68a3de763ecfa54cfd926bb36method0(),
      "once": true
    },
    {
      "id": "translationcol_0",
      "injectionName": "error",
      "inject": (c) => c.comp.__5c58baf68a3de763ecfa54cfd926bb36method1(),
      "once": true
    }
  ],
  "events": [
    {
      "eventName": "change",
      "id": "translationcol_0",
      "fct": (c, ...args) => c.comp.onChange.apply(c.comp, ...args),
      "isCallback": true
    }
  ],
  "pressEvents": [
    {
      "id": "translationcol_1",
      "onPress": (e, pressInstance, c) => { c.comp.getTranslatation(e, pressInstance); }
    }
  ]
}); }
    getClassName() {
        return "TranslationCol";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('icon_btn')) { this.attributeChangedCallback('icon_btn', false, false); }if(!this.hasAttribute('error')) { this.attributeChangedCallback('error', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["locale"] = undefined;w["value"] = undefined; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('icon_btn');this.__upgradeProperty('error');this.__correctGetter('locale');this.__correctGetter('value'); }
    __listBoolProps() { return ["icon_btn","error"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    getValue() {
        if (this.value == TranslationPage.KeyUndefined || !this.value) {
            this.error = true;
            return "";
        }
        this.error = false;
        return this.value;
    }
    async getTranslatation() {
        let row = this.findParentByType(TranslationRow);
        let page = this.findParentByType(TranslationPage);
        if (this.locale == page.fallback) {
            this.value = row.key;
            return;
        }
        const result = await Translator.translate(row.key, page.fallback, this.locale);
        if (result) {
            this.onChange(result);
        }
    }
    showIcon() {
        this.icon_btn = !this.value || this.value == TranslationPage.KeyUndefined;
    }
    onChange(value) {
        this.value = value;
        this.change.trigger(value);
    }
    postCreation() {
        this.showIcon();
    }
    __5c58baf68a3de763ecfa54cfd926bb36method2() {
        return this.locale;
    }
    __5c58baf68a3de763ecfa54cfd926bb36method0() {
        return this.getValue();
    }
    __5c58baf68a3de763ecfa54cfd926bb36method1() {
        return this.error;
    }
}
TranslationCol.Namespace=`AventusI18nView`;
TranslationCol.Tag=`av-translation-col`;
__as1(_, 'TranslationCol', TranslationCol);
if(!window.customElements.get('av-translation-col')){window.customElements.define('av-translation-col', TranslationCol);Aventus.WebComponentInstance.registerDefinition(TranslationCol);}

const TranslationRow = class TranslationRow extends Aventus.WebComponent {
    get 'key'() {
						return this.__watch["key"];
					}
					set 'key'(val) {
						this.__watch["key"] = val;
					}get 'locales'() {
						return this.__watch["locales"];
					}
					set 'locales'(val) {
						this.__watch["locales"] = val;
					}    parsedItem;
    hasChanged = false;
    cols = {};
    change = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("key");this.__addWatchesActions("locales");    super.__registerWatchesActions();
}
    static __style = `:host{align-items:stretch;border-left:1px solid var(--vscode-widget-border);border-right:1px solid var(--vscode-widget-border);display:flex;gap:0px}:host .col{border-right:1px solid var(--vscode-widget-border);padding:10px 20px}:host .inputs{display:flex;gap:0px}:host .key{flex-shrink:0;position:relative;width:var(--_translation-page-key-width);min-width:100px}:host(:nth-child(odd)){background-color:rgba(87,87,87,.2);background-color:var(--vscode-editorWidget-background)}:host(:nth-last-child(1)){border-bottom:1px solid var(--vscode-widget-border);border-bottom-left-radius:5px;border-bottom-right-radius:5px}`;
    __getStatic() {
        return TranslationRow;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TranslationRow.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="col key">	<vscode-label _id="translationrow_0"></vscode-label>	<av-resize is_key></av-resize></div><div class="inputs" _id="translationrow_1"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "inputsEl",
      "ids": [
        "translationrow_1"
      ]
    }
  ],
  "content": {
    "translationrow_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__c86b13a0b49a096fc47a9596b8ca6beemethod0())}`,
      "once": true
    }
  }
}); }
    getClassName() {
        return "TranslationRow";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["key"] = undefined;w["locales"] = undefined; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('key');this.__correctGetter('locales'); }
    loadData() {
        this.hasChanged = false;
        for (let locale of this.locales) {
            this.createCol(locale);
        }
    }
    updateData(data) {
        this.parsedItem = data;
        for (let locale of this.locales) {
            if (this.cols[locale]) {
                this.cols[locale].value = this.parsedItem[locale];
                this.cols[locale].initialValue = this.parsedItem[locale];
            }
        }
    }
    createCol(locale) {
        const col = new TranslationCol();
        col.locale = locale;
        col.value = this.parsedItem[locale];
        col.initialValue = this.parsedItem[locale];
        col.change.add((value) => {
            debugger;
            this.parsedItem[locale] = value;
            const hasChanged = value != col.initialValue;
            if (this.hasChanged != hasChanged) {
                this.hasChanged = hasChanged;
            }
            this.change.trigger();
        });
        col.classList.add("col");
        this.cols[locale] = col;
        this.inputsEl.appendChild(col);
    }
    search(txt, onlyMissing) {
        let isVisible = false;
        if (txt == "") {
            isVisible = true;
        }
        else if (StringTools.search(this.key, txt)) {
            isVisible = true;
        }
        else {
            for (let locale in this.parsedItem) {
                const value = this.parsedItem[locale];
                if (StringTools.search(value, txt)) {
                    isVisible = true;
                    break;
                }
            }
        }
        if (!isVisible) {
            this.style.display = 'none';
        }
        else {
            if (onlyMissing) {
                isVisible = false;
                for (let locale of this.locales) {
                    const value = this.parsedItem[locale];
                    if (value == TranslationPage.KeyUndefined || !value) {
                        isVisible = true;
                        break;
                    }
                }
            }
            if (isVisible) {
                this.style.display = '';
            }
            else {
                this.style.display = 'none';
            }
        }
    }
    postCreation() {
        this.loadData();
    }
    __c86b13a0b49a096fc47a9596b8ca6beemethod0() {
        return this.key;
    }
}
TranslationRow.Namespace=`AventusI18nView`;
TranslationRow.Tag=`av-translation-row`;
__as1(_, 'TranslationRow', TranslationRow);
if(!window.customElements.get('av-translation-row')){window.customElements.define('av-translation-row', TranslationRow);Aventus.WebComponentInstance.registerDefinition(TranslationRow);}

const TranslationPage = class TranslationPage extends Aventus.WebComponent {
    static get observedAttributes() {return ["need_save", "has_empty"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'is_init'() { return this.getBoolAttr('is_init') }
    set 'is_init'(val) { this.setBoolAttr('is_init', val) }    get 'need_save'() { return this.getBoolProp('need_save') }
    set 'need_save'(val) { this.setBoolAttr('need_save', val) }get 'has_empty'() { return this.getBoolProp('has_empty') }
    set 'has_empty'(val) { this.setBoolAttr('has_empty', val) }    get 'fallback'() {
						return this.__watch["fallback"];
					}
					set 'fallback'(val) {
						this.__watch["fallback"] = val;
					}get 'searchTxt'() {
						return this.__watch["searchTxt"];
					}
					set 'searchTxt'(val) {
						this.__watch["searchTxt"] = val;
					}get 'onlyMissing'() {
						return this.__watch["onlyMissing"];
					}
					set 'onlyMissing'(val) {
						this.__watch["onlyMissing"] = val;
					}get 'importMissingBtn'() {
						return this.__watch["importMissingBtn"];
					}
					set 'importMissingBtn'(val) {
						this.__watch["importMissingBtn"] = val;
					}get 'pageName'() {
						return this.__watch["pageName"];
					}
					set 'pageName'(val) {
						this.__watch["pageName"] = val;
					}get 'locales'() {
						return this.__watch["locales"];
					}
					set 'locales'(val) {
						this.__watch["locales"] = val;
					}    static KeyUndefined = "ⵌⵌ";
    parsed = {};
    guard = new Aventus.ActionGuard();
    rows = {};
    __registerWatchesActions() {
    this.__addWatchesActions("fallback");this.__addWatchesActions("searchTxt", ((target) => {
    target.search();
}));this.__addWatchesActions("onlyMissing", ((target) => {
    target.search();
}));this.__addWatchesActions("importMissingBtn");this.__addWatchesActions("pageName");this.__addWatchesActions("locales");    super.__registerWatchesActions();
}
    static __style = `:host{--_translation-page-key-width: var(--translation-page-key-width, 300px)}:host{display:none;flex-direction:column;height:100%;margin:0;margin-block:0 !important;width:100%}:host vscode-scrollable{height:calc(100% - 190px);margin:0 20px;width:calc(100% - 40px)}:host av-scrollable{--scroller-width: 0;height:min-content;min-height:0}:host .header{flex-shrink:0;height:177px;padding:20px;padding-bottom:0}:host .header .bar{display:flex;justify-content:space-between;width:100%;gap:20px}:host .header .bar .menu-actions{display:flex;flex-wrap:nowrap;gap:50px}:host .header .bar .menu-actions div{display:flex;margin:15px 0;white-space:nowrap;height:26px}:host .header .bar .menu-actions div vscode-label{margin-right:14px;text-align:right;width:auto}:host .header .bar .menu-actions div vscode-textfield{width:auto}:host .header .menu{border:1px solid var(--vscode-widget-border);padding:8px}:host .header .menu vscode-icon{background-color:rgba(0,0,0,0);cursor:pointer;padding:8px;transition:background-color linear .2s}:host .header .menu vscode-icon:hover{background-color:var(--vscode-button-secondaryBackground)}:host .content{display:flex;flex-direction:column}:host([is_init]){display:flex}`;
    constructor() {
        super();
        this.triggerChange = this.triggerChange.bind(this);
    }
    __getStatic() {
        return TranslationPage;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TranslationPage.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="header">    <div class="bar">        <h1 class="title" _id="translationpage_0"></h1>        <div class="menu-actions">            <div>                <vscode-label>Recherche:</vscode-label>                <vscode-textfield _id="translationpage_1"></vscode-textfield>            </div>        </div>    </div>    <div class="menu">        <av-icon-tooltip name="save" _id="translationpage_2">Save</av-icon-tooltip>        <av-icon-tooltip name="bug" _id="translationpage_3">Only missing</av-icon-tooltip>        <template _id="translationpage_4"></template>        <template _id="translationpage_6"></template>    </div>    <av-scrollable x_scroll y_scroll="true" mouse_drag auto_hide _id="translationpage_8">        <av-translation-row-header _id="translationpage_9"></av-translation-row-header>    </av-scrollable></div><vscode-scrollable>    <av-scrollable x_scroll y_scroll="true" mouse_drag auto_hide _id="translationpage_10">        <div class="content" _id="translationpage_11">        </div>    </av-scrollable></vscode-scrollable>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "headerEl",
      "ids": [
        "translationpage_8"
      ]
    },
    {
      "name": "bodyEl",
      "ids": [
        "translationpage_10"
      ]
    },
    {
      "name": "contentEl",
      "ids": [
        "translationpage_11"
      ]
    }
  ],
  "content": {
    "translationpage_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method2())}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "translationpage_2",
      "injectionName": "notif",
      "inject": (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method5(),
      "once": true
    },
    {
      "id": "translationpage_3",
      "injectionName": "active",
      "inject": (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method6(),
      "once": true
    },
    {
      "id": "translationpage_9",
      "injectionName": "locales",
      "inject": (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method8(),
      "once": true
    }
  ],
  "bindings": [
    {
      "id": "translationpage_1",
      "injectionName": "value",
      "eventNames": [
        "keyup"
      ],
      "inject": (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method3(),
      "extract": (c, v) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method4(v),
      "once": true
    }
  ],
  "pressEvents": [
    {
      "id": "translationpage_2",
      "onPress": (e, pressInstance, c) => { c.comp.save(e, pressInstance); }
    },
    {
      "id": "translationpage_3",
      "onPress": (e, pressInstance, c) => { c.comp.toogleOnlyMissing(e, pressInstance); }
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`            <av-icon-tooltip name="check-all" _id="translationpage_5">Translate all</av-icon-tooltip>        `);templ0.setActions({
  "injection": [
    {
      "id": "translationpage_5",
      "injectionName": "active",
      "inject": (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method7(),
      "once": true
    }
  ],
  "pressEvents": [
    {
      "id": "translationpage_5",
      "onPress": (e, pressInstance, c) => { c.comp.translateAll(e, pressInstance); }
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'translationpage_4',
                    parts: [{once: true,
                    condition: (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method0(),
                    template: templ0
                }]
            });const templ1 = new Aventus.Template(this);templ1.setTemplate(`            <av-icon-tooltip name="warning" _id="translationpage_7">Import missing</av-icon-tooltip>        `);templ1.setActions({
  "pressEvents": [
    {
      "id": "translationpage_7",
      "onPress": (e, pressInstance, c) => { c.comp.importMissing(e, pressInstance); }
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'translationpage_6',
                    parts: [{once: true,
                    condition: (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method1(),
                    template: templ1
                }]
            }); }
    getClassName() {
        return "TranslationPage";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('is_init')) { this.attributeChangedCallback('is_init', false, false); }if(!this.hasAttribute('need_save')) { this.attributeChangedCallback('need_save', false, false); }if(!this.hasAttribute('has_empty')) { this.attributeChangedCallback('has_empty', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["fallback"] = "en-GB";w["searchTxt"] = "";w["onlyMissing"] = false;w["importMissingBtn"] = false;w["pageName"] = "";w["locales"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('is_init');this.__upgradeProperty('need_save');this.__upgradeProperty('has_empty');this.__correctGetter('fallback');this.__correctGetter('searchTxt');this.__correctGetter('onlyMissing');this.__correctGetter('importMissingBtn');this.__correctGetter('pageName');this.__correctGetter('locales'); }
    __listBoolProps() { return ["is_init","need_save","has_empty"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    syncScroll() {
        this.headerEl?.onScrollChange.add((x, y) => {
            if (this.bodyEl?.x != x) {
                this.bodyEl?.scrollX(x);
            }
        });
        this.bodyEl?.onScrollChange.add((x, y) => {
            if (this.headerEl?.x != x) {
                this.headerEl?.scrollX(x);
            }
        });
        new Aventus.ResizeObserver(() => {
            this.style.setProperty("--content-width", this.headerEl.offsetWidth - 2 + "px");
        }).observe(this.headerEl);
        this.style.setProperty("--content-width", this.headerEl.offsetWidth - 2 + "px");
    }
    async triggerChange() {
        debugger;
        this.guard.run(['triggerChange'], async () => {
            // Loading.show();
            try {
                const promise = VscodeView.Router.getInstance().sendWithResponse({
                    channel: "triggerChange",
                    body: this.parsed
                });
                this.calculateEmpty();
                await promise;
            }
            catch { }
            // Loading.hide();
        });
    }
    async save() {
        if (!this.need_save)
            return;
        this.guard.run(['save'], async () => {
            Loading.show();
            try {
                await VscodeView.Router.getInstance().sendWithResponse({
                    channel: "save"
                });
            }
            catch { }
            Loading.hide();
        });
    }
    addRoutes() {
        VscodeView.Router.getInstance().addRoute({
            channel: 'has_missing',
            callback: (value) => {
                this.importMissingBtn = value;
            }
        });
    }
    importMissing() {
        this.guard.run(['import_missing'], async () => {
            Loading.show();
            try {
                const result = await VscodeView.Router.getInstance().sendWithResponse({
                    channel: "import_missing",
                    body: {}
                });
                if (result.result)
                    this.parsed = result.result;
            }
            catch { }
            Loading.hide();
        });
    }
    search() {
        const txt = this.searchTxt;
        const onlyMissing = this.onlyMissing;
        for (let key in this.rows) {
            this.rows[key].search(txt, onlyMissing);
        }
    }
    calculateEmpty() {
        let result = false;
        for (let key in this.parsed) {
            for (let locale of this.locales) {
                if (!this.parsed[key][locale] || this.parsed[key][locale] == TranslationPage.KeyUndefined) {
                    result = true;
                    break;
                }
            }
            if (result) {
                break;
            }
        }
        this.has_empty = result;
    }
    render() {
        while (this.contentEl.lastElementChild) {
            this.contentEl.lastElementChild.remove();
        }
        let search = this.searchTxt != "";
        for (let key in this.parsed) {
            const row = new TranslationRow();
            row.key = key;
            row.parsedItem = this.parsed[key];
            row.locales = this.locales;
            row.change.add(this.triggerChange);
            this.rows[key] = row;
            this.contentEl.appendChild(row);
            if (search)
                row.search(this.searchTxt, this.onlyMissing);
        }
        const w = "calc((var(--content-width) - var(--_translation-page-key-width)) / " + this.locales.length + ")";
        for (let locale of this.locales) {
            this.style.setProperty("--col-width-" + locale, w);
        }
        this.calculateEmpty();
    }
    async init() {
        await this.guard.run(['init'], async () => {
            Loading.show();
            const result = await VscodeView.Router.getInstance().sendWithResponse({
                channel: "init",
                body: {}
            });
            if (result.result) {
                this.locales = result.result.locales;
                this.searchTxt = result.result.filter ?? '';
                this.parsed = result.result.content;
                this.pageName = result.result.pageName;
                this.render();
            }
            this.is_init = true;
            Loading.hide();
        });
        VscodeView.Router.getInstance().addRoute({
            channel: "is_dirty",
            callback: (data) => {
                this.need_save = data;
            }
        });
        VscodeView.Router.getInstance().addRoute({
            channel: "update_content",
            callback: (data) => {
                const oldKeys = Object.keys(this.parsed);
                this.parsed = data;
                for (let key in this.parsed) {
                    if (this.rows[key]) {
                        let index = oldKeys.indexOf(key);
                        if (index > -1) {
                            oldKeys.splice(index, 1);
                        }
                        this.rows[key].updateData(this.parsed[key]);
                    }
                    else {
                        const row = new TranslationRow();
                        row.key = key;
                        row.parsedItem = this.parsed[key];
                        row.locales = this.locales;
                        row.change.add(this.triggerChange);
                        this.rows[key] = row;
                        this.contentEl.appendChild(row);
                    }
                }
                for (let key of oldKeys) {
                    if (this.rows[key]) {
                        this.rows[key].remove();
                        delete this.rows[key];
                    }
                }
            }
        });
    }
    toogleOnlyMissing() {
        this.onlyMissing = !this.onlyMissing;
    }
    async translateAll() {
        await this.guard.run(['translateAll'], async () => {
            let popup = new TranslateAllPopup();
            popup.parsed = this.parsed;
            popup.locales = this.locales;
            popup.fallback = this.fallback;
            this.shadowRoot.appendChild(popup);
            await popup.run();
            this.calculateEmpty();
            this.render();
            await this.triggerChange();
        });
    }
    postCreation() {
        super.postCreation();
        let vscodeElements = npmCompilation['1608514c9acd4a97df63533df1b9d0fd'].VscodeElement;
        this.syncScroll();
        this.init();
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method2() {
        return this.pageName;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method0() {
        return this.has_empty;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method1() {
        return this.importMissingBtn;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method5() {
        return this.need_save;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method6() {
        return this.onlyMissing;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method7() {
        return this.onlyMissing;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method8() {
        return this.locales;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method3() {
        return this.searchTxt;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method4(v) {
        if (this) {
            this.searchTxt = v;
        }
    }
}
TranslationPage.Namespace=`AventusI18nView`;
TranslationPage.Tag=`av-translation-page`;
__as1(_, 'TranslationPage', TranslationPage);
if(!window.customElements.get('av-translation-page')){window.customElements.define('av-translation-page', TranslationPage);Aventus.WebComponentInstance.registerDefinition(TranslationPage);}

const Resize = class Resize extends Aventus.WebComponent {
    static get observedAttributes() {return ["locale", "is_key"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'locale'() { return this.getStringProp('locale') }
    set 'locale'(val) { this.setStringAttr('locale', val) }get 'is_key'() { return this.getBoolProp('is_key') }
    set 'is_key'(val) { this.setBoolAttr('is_key', val) }    static __style = `:host{bottom:0;cursor:col-resize;position:absolute;right:-4px;top:0;width:8px}`;
    __getStatic() {
        return Resize;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Resize.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Resize";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('locale')){ this['locale'] = ""; }if(!this.hasAttribute('is_key')) { this.attributeChangedCallback('is_key', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('locale');this.__upgradeProperty('is_key'); }
    __listBoolProps() { return ["is_key"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    postCreation() {
        let page = this.findParentByType(TranslationPage);
        let width = 0;
        let startX = 0;
        let _parent = this.parentNode;
        if (_parent instanceof ShadowRoot) {
            _parent = _parent.host;
        }
        const parent = _parent;
        new Aventus.DragAndDrop({
            element: this,
            applyDrag: false,
            offsetDrag: 0,
            onStart: (e) => {
                width = parent.offsetWidth;
                startX = e.clientX;
            },
            onMove: (e) => {
                let newW = width + (e.clientX - startX);
                if (this.is_key) {
                    if (newW > page.offsetWidth / 2) {
                        newW = page.offsetWidth / 2;
                    }
                    page.style.setProperty("--translation-page-key-width", newW + 'px');
                }
                else {
                    page.style.setProperty("--col-width-" + this.locale, newW + 'px');
                }
            }
        });
    }
}
Resize.Namespace=`AventusI18nView`;
Resize.Tag=`av-resize`;
__as1(_, 'Resize', Resize);
if(!window.customElements.get('av-resize')){window.customElements.define('av-resize', Resize);Aventus.WebComponentInstance.registerDefinition(Resize);}


for(let key in _) { AventusI18nView[key] = _[key] }
})(AventusI18nView);
