var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const moduleName = `Aventus`;
const _ = {};


let _n;
let ElementExtension=class ElementExtension {
    /**
     * Find a parent by tagname if exist Static.findParentByTag(this, "av-img")
     */
    static findParentByTag(element, tagname, untilNode) {
        let el = element;
        if (Array.isArray(tagname)) {
            for (let i = 0; i < tagname.length; i++) {
                tagname[i] = tagname[i].toLowerCase();
            }
        }
        else {
            tagname = [tagname.toLowerCase()];
        }
        let checkFunc = (el) => {
            return tagname.indexOf((el.nodeName || el.tagName).toLowerCase()) != -1;
        };
        if (el) {
            if (el instanceof ShadowRoot) {
                el = el.host;
            }
            else {
                el = el.parentNode;
            }
        }
        while (el) {
            if (checkFunc(el)) {
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
     * Find a parent by class name if exist Static.findParentByClass(this, "my-class-img") = querySelector('.my-class-img')
     */
    static findParentByClass(element, classname, untilNode) {
        let el = element;
        if (!Array.isArray(classname)) {
            classname = [classname];
        }
        if (el) {
            if (el instanceof ShadowRoot) {
                el = el.host;
            }
            else {
                el = el.parentNode;
            }
        }
        while (el) {
            for (let classnameTemp of classname) {
                if (el['classList'] && el['classList'].contains(classnameTemp)) {
                    return el;
                }
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
     * Find a parent by type if exist Static.findParentyType(this, Aventus.Img)
     */
    static findParentByType(element, type, untilNode) {
        let el = element;
        let checkFunc = (el) => {
            return false;
        };
        if (typeof type == "function" && type['prototype']['constructor']) {
            checkFunc = (el) => {
                if (el instanceof type) {
                    return true;
                }
                return false;
            };
        }
        else {
            console.error("you must provide a class inside this function");
            return null;
        }
        if (el) {
            if (el instanceof ShadowRoot) {
                el = el.host;
            }
            else {
                el = el.parentNode;
            }
        }
        while (el) {
            if (checkFunc(el)) {
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
     * Find list of parents by tagname
     */
    static findParents(element, tagname, untilNode) {
        let el = element;
        if (Array.isArray(tagname)) {
            for (let i = 0; i < tagname.length; i++) {
                tagname[i] = tagname[i].toLowerCase();
            }
        }
        else {
            tagname = [tagname.toLowerCase()];
        }
        let result = [];
        if (el) {
            if (el instanceof ShadowRoot) {
                el = el.host;
            }
            else {
                el = el.parentNode;
            }
        }
        while (el) {
            if (tagname.indexOf((el.nodeName || el['tagName']).toLowerCase()) != -1) {
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
_.ElementExtension=ElementExtension;

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
_.Instance=Instance;

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
            styleNode.innerHTML = Aventus.Style.getAsString(name);
            document.getElementsByTagName('head')[0].appendChild(styleNode);
        }
    }
    static refreshHead(name) {
        const styleNode = document.head.querySelector(`style[data-name="${name}"]`);
        if (styleNode) {
            styleNode.innerHTML = Aventus.Style.getAsString(name);
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
_.Style=Style;

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
_.setValueToObject=setValueToObject;

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
_.Callback=Callback;

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
            }
            await this.releaseOnlyLast();
        }
        return result;
    }
}
Mutex.Namespace=`Aventus`;
_.Mutex=Mutex;

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
_.NormalizedEvent=NormalizedEvent;

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
_.compareObject=compareObject;

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
_.getValueFromObject=getValueFromObject;

var WatchAction;
(function (WatchAction) {
    WatchAction[WatchAction["CREATED"] = 0] = "CREATED";
    WatchAction[WatchAction["UPDATED"] = 1] = "UPDATED";
    WatchAction[WatchAction["DELETED"] = 2] = "DELETED";
})(WatchAction || (WatchAction = {}));
_.WatchAction=WatchAction;

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
_.Effect=Effect;

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
_.Watcher=Watcher;

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
_.Signal=Signal;

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
_.Computed=Computed;

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
_.ComputedNoRecomputed=ComputedNoRecomputed;

let PressManager=class PressManager {
    static globalConfig = {
        delayDblPress: 250,
        delayLongPress: 700,
        offsetDrag: 20
    };
    static setGlobalConfig(options) {
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
        this.functionsBinded.moveAction = this.moveAction.bind(this);
        this.functionsBinded.upAction = this.upAction.bind(this);
        this.functionsBinded.childPressStart = this.childPressStart.bind(this);
        this.functionsBinded.childPressEnd = this.childPressEnd.bind(this);
        this.functionsBinded.childPressMove = this.childPressMove.bind(this);
    }
    init() {
        this.bindAllFunction();
        this.element.addEventListener("pointerdown", this.functionsBinded.downAction);
        this.element.addEventListener("touchstart", this.functionsBinded.downAction);
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
    downAction(ev) {
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
        this.startPosition = { x: e.pageX, y: e.pageY };
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
            let distance = Math.sqrt(xDist * xDist + yDist * yDist);
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
            this.element.removeEventListener("trigger_pointer_pressstart", this.functionsBinded.childPressStart);
            this.element.removeEventListener("trigger_pointer_pressend", this.functionsBinded.childPressEnd);
            this.element.removeEventListener("trigger_pointer_pressmove", this.functionsBinded.childPressMove);
            document.removeEventListener("pointerup", this.functionsBinded.upAction);
            document.removeEventListener("pointercancel", this.functionsBinded.upAction);
            document.removeEventListener("pointermove", this.functionsBinded.moveAction);
        }
    }
}
PressManager.Namespace=`Aventus`;
_.PressManager=PressManager;

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
_.Uri=Uri;

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
_.State=State;

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
_.EmptyState=EmptyState;

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
_.StateManager=StateManager;

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
_.TemplateContext=TemplateContext;

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
_.TemplateInstance=TemplateInstance;

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
_.Template=Template;

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
    findParents(tagname, untilNode) {
        return ElementExtension.findParents(this, tagname, untilNode);
    }
    /**
     * Check if element contains a child
     */
    containsChild(el) {
        return ElementExtension.containsChild(this, el);
    }
    /**
     * Get element inside slot
     */
    getElementsInSlot(slotName) {
        return ElementExtension.getElementsInSlot(this, slotName);
    }
    /**
     * Get active element from the shadowroot or the document
     */
    getActiveElement(document) {
        return ElementExtension.getActiveElement(document ?? this.shadowRoot);
    }
}
WebComponent.Namespace=`Aventus`;
_.WebComponent=WebComponent;

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
_.WebComponentInstance=WebComponentInstance;


for(let key in _) { Aventus[key] = _[key] }
})(Aventus);

var dependances;
(dependances||(dependances = {}));
(function (dependances) {
const moduleName = `dependances`;
const _ = {};


let _n;
let Message=class Message {
    static init() {
        window.addEventListener('message', event => {
            const message = event.data;
            console.log(message);
        });
    }
    static send(data) {
        window['vscode'].postMessage({
            type: 'add'
        });
    }
}
Message.Namespace=`dependances`;
_.Message=Message;

const Icon = class Icon extends Aventus.WebComponent {
    static __style = `:host{display:inline-block;font:normal normal normal 16px/1 codicon;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-align:center;text-decoration:none;text-rendering:auto;-webkit-user-select:none;-ms-user-select:none;user-select:none}:host(.add) span::before{content:""}:host(.plus) span::before{content:""}:host(.gist-new) span::before{content:""}:host(.repo-create) span::before{content:""}:host(.lightbulb) span::before{content:""}:host(.light-bulb) span::before{content:""}:host(.repo) span::before{content:""}:host(.repo-delete) span::before{content:""}:host(.gist-fork) span::before{content:""}:host(.repo-forked) span::before{content:""}:host(.git-pull-request) span::before{content:""}:host(.git-pull-request-abandoned) span::before{content:""}:host(.record-keys) span::before{content:""}:host(.keyboard) span::before{content:""}:host(.tag) span::before{content:""}:host(.tag-add) span::before{content:""}:host(.tag-remove) span::before{content:""}:host(.person) span::before{content:""}:host(.person-follow) span::before{content:""}:host(.person-outline) span::before{content:""}:host(.person-filled) span::before{content:""}:host(.git-branch) span::before{content:""}:host(.git-branch-create) span::before{content:""}:host(.git-branch-delete) span::before{content:""}:host(.source-control) span::before{content:""}:host(.mirror) span::before{content:""}:host(.mirror-public) span::before{content:""}:host(.star) span::before{content:""}:host(.star-add) span::before{content:""}:host(.star-delete) span::before{content:""}:host(.star-empty) span::before{content:""}:host(.comment) span::before{content:""}:host(.comment-add) span::before{content:""}:host(.alert) span::before{content:""}:host(.warning) span::before{content:""}:host(.search) span::before{content:""}:host(.search-save) span::before{content:""}:host(.log-out) span::before{content:""}:host(.sign-out) span::before{content:""}:host(.log-in) span::before{content:""}:host(.sign-in) span::before{content:""}:host(.eye) span::before{content:""}:host(.eye-unwatch) span::before{content:""}:host(.eye-watch) span::before{content:""}:host(.circle-filled) span::before{content:""}:host(.primitive-dot) span::before{content:""}:host(.close-dirty) span::before{content:""}:host(.debug-breakpoint) span::before{content:""}:host(.debug-breakpoint-disabled) span::before{content:""}:host(.debug-hint) span::before{content:""}:host(.terminal-decoration-success) span::before{content:""}:host(.primitive-square) span::before{content:""}:host(.edit) span::before{content:""}:host(.pencil) span::before{content:""}:host(.info) span::before{content:""}:host(.issue-opened) span::before{content:""}:host(.gist-private) span::before{content:""}:host(.git-fork-private) span::before{content:""}:host(.lock) span::before{content:""}:host(.mirror-private) span::before{content:""}:host(.close) span::before{content:""}:host(.remove-close) span::before{content:""}:host(.x) span::before{content:""}:host(.repo-sync) span::before{content:""}:host(.sync) span::before{content:""}:host(.clone) span::before{content:""}:host(.desktop-download) span::before{content:""}:host(.beaker) span::before{content:""}:host(.microscope) span::before{content:""}:host(.vm) span::before{content:""}:host(.device-desktop) span::before{content:""}:host(.file) span::before{content:""}:host(.file-text) span::before{content:""}:host(.more) span::before{content:""}:host(.ellipsis) span::before{content:""}:host(.kebab-horizontal) span::before{content:""}:host(.mail-reply) span::before{content:""}:host(.reply) span::before{content:""}:host(.organization) span::before{content:""}:host(.organization-filled) span::before{content:""}:host(.organization-outline) span::before{content:""}:host(.new-file) span::before{content:""}:host(.file-add) span::before{content:""}:host(.new-folder) span::before{content:""}:host(.file-directory-create) span::before{content:""}:host(.trash) span::before{content:""}:host(.trashcan) span::before{content:""}:host(.history) span::before{content:""}:host(.clock) span::before{content:""}:host(.folder) span::before{content:""}:host(.file-directory) span::before{content:""}:host(.symbol-folder) span::before{content:""}:host(.logo-github) span::before{content:""}:host(.mark-github) span::before{content:""}:host(.github) span::before{content:""}:host(.terminal) span::before{content:""}:host(.console) span::before{content:""}:host(.repl) span::before{content:""}:host(.zap) span::before{content:""}:host(.symbol-event) span::before{content:""}:host(.error) span::before{content:""}:host(.stop) span::before{content:""}:host(.variable) span::before{content:""}:host(.symbol-variable) span::before{content:""}:host(.array) span::before{content:""}:host(.symbol-array) span::before{content:""}:host(.symbol-module) span::before{content:""}:host(.symbol-package) span::before{content:""}:host(.symbol-namespace) span::before{content:""}:host(.symbol-object) span::before{content:""}:host(.symbol-method) span::before{content:""}:host(.symbol-function) span::before{content:""}:host(.symbol-constructor) span::before{content:""}:host(.symbol-boolean) span::before{content:""}:host(.symbol-null) span::before{content:""}:host(.symbol-numeric) span::before{content:""}:host(.symbol-number) span::before{content:""}:host(.symbol-structure) span::before{content:""}:host(.symbol-struct) span::before{content:""}:host(.symbol-parameter) span::before{content:""}:host(.symbol-type-parameter) span::before{content:""}:host(.symbol-key) span::before{content:""}:host(.symbol-text) span::before{content:""}:host(.symbol-reference) span::before{content:""}:host(.go-to-file) span::before{content:""}:host(.symbol-enum) span::before{content:""}:host(.symbol-value) span::before{content:""}:host(.symbol-ruler) span::before{content:""}:host(.symbol-unit) span::before{content:""}:host(.activate-breakpoints) span::before{content:""}:host(.archive) span::before{content:""}:host(.arrow-both) span::before{content:""}:host(.arrow-down) span::before{content:""}:host(.arrow-left) span::before{content:""}:host(.arrow-right) span::before{content:""}:host(.arrow-small-down) span::before{content:""}:host(.arrow-small-left) span::before{content:""}:host(.arrow-small-right) span::before{content:""}:host(.arrow-small-up) span::before{content:""}:host(.arrow-up) span::before{content:""}:host(.bell) span::before{content:""}:host(.bold) span::before{content:""}:host(.book) span::before{content:""}:host(.bookmark) span::before{content:""}:host(.debug-breakpoint-conditional-unverified) span::before{content:""}:host(.debug-breakpoint-conditional) span::before{content:""}:host(.debug-breakpoint-conditional-disabled) span::before{content:""}:host(.debug-breakpoint-data-unverified) span::before{content:""}:host(.debug-breakpoint-data) span::before{content:""}:host(.debug-breakpoint-data-disabled) span::before{content:""}:host(.debug-breakpoint-log-unverified) span::before{content:""}:host(.debug-breakpoint-log) span::before{content:""}:host(.debug-breakpoint-log-disabled) span::before{content:""}:host(.briefcase) span::before{content:""}:host(.broadcast) span::before{content:""}:host(.browser) span::before{content:""}:host(.bug) span::before{content:""}:host(.calendar) span::before{content:""}:host(.case-sensitive) span::before{content:""}:host(.check) span::before{content:""}:host(.checklist) span::before{content:""}:host(.chevron-down) span::before{content:""}:host(.chevron-left) span::before{content:""}:host(.chevron-right) span::before{content:""}:host(.chevron-up) span::before{content:""}:host(.chrome-close) span::before{content:""}:host(.chrome-maximize) span::before{content:""}:host(.chrome-minimize) span::before{content:""}:host(.chrome-restore) span::before{content:""}:host(.circle-outline) span::before{content:""}:host(.circle) span::before{content:""}:host(.debug-breakpoint-unverified) span::before{content:""}:host(.terminal-decoration-incomplete) span::before{content:""}:host(.circle-slash) span::before{content:""}:host(.circuit-board) span::before{content:""}:host(.clear-all) span::before{content:""}:host(.clippy) span::before{content:""}:host(.close-all) span::before{content:""}:host(.cloud-download) span::before{content:""}:host(.cloud-upload) span::before{content:""}:host(.code) span::before{content:""}:host(.collapse-all) span::before{content:""}:host(.color-mode) span::before{content:""}:host(.comment-discussion) span::before{content:""}:host(.credit-card) span::before{content:""}:host(.dash) span::before{content:""}:host(.dashboard) span::before{content:""}:host(.database) span::before{content:""}:host(.debug-continue) span::before{content:""}:host(.debug-disconnect) span::before{content:""}:host(.debug-pause) span::before{content:""}:host(.debug-restart) span::before{content:""}:host(.debug-start) span::before{content:""}:host(.debug-step-into) span::before{content:""}:host(.debug-step-out) span::before{content:""}:host(.debug-step-over) span::before{content:""}:host(.debug-stop) span::before{content:""}:host(.debug) span::before{content:""}:host(.device-camera-video) span::before{content:""}:host(.device-camera) span::before{content:""}:host(.device-mobile) span::before{content:""}:host(.diff-added) span::before{content:""}:host(.diff-ignored) span::before{content:""}:host(.diff-modified) span::before{content:""}:host(.diff-removed) span::before{content:""}:host(.diff-renamed) span::before{content:""}:host(.diff) span::before{content:""}:host(.discard) span::before{content:""}:host(.editor-layout) span::before{content:""}:host(.empty-window) span::before{content:""}:host(.exclude) span::before{content:""}:host(.extensions) span::before{content:""}:host(.eye-closed) span::before{content:""}:host(.file-binary) span::before{content:""}:host(.file-code) span::before{content:""}:host(.file-media) span::before{content:""}:host(.file-pdf) span::before{content:""}:host(.file-submodule) span::before{content:""}:host(.file-symlink-directory) span::before{content:""}:host(.file-symlink-file) span::before{content:""}:host(.file-zip) span::before{content:""}:host(.files) span::before{content:""}:host(.filter) span::before{content:""}:host(.flame) span::before{content:""}:host(.fold-down) span::before{content:""}:host(.fold-up) span::before{content:""}:host(.fold) span::before{content:""}:host(.folder-active) span::before{content:""}:host(.folder-opened) span::before{content:""}:host(.gear) span::before{content:""}:host(.gift) span::before{content:""}:host(.gist-secret) span::before{content:""}:host(.gist) span::before{content:""}:host(.git-commit) span::before{content:""}:host(.git-compare) span::before{content:""}:host(.compare-changes) span::before{content:""}:host(.git-merge) span::before{content:""}:host(.github-action) span::before{content:""}:host(.github-alt) span::before{content:""}:host(.globe) span::before{content:""}:host(.grabber) span::before{content:""}:host(.graph) span::before{content:""}:host(.gripper) span::before{content:""}:host(.heart) span::before{content:""}:host(.home) span::before{content:""}:host(.horizontal-rule) span::before{content:""}:host(.hubot) span::before{content:""}:host(.inbox) span::before{content:""}:host(.issue-reopened) span::before{content:""}:host(.issues) span::before{content:""}:host(.italic) span::before{content:""}:host(.jersey) span::before{content:""}:host(.json) span::before{content:""}:host(.kebab-vertical) span::before{content:""}:host(.key) span::before{content:""}:host(.law) span::before{content:""}:host(.lightbulb-autofix) span::before{content:""}:host(.link-external) span::before{content:""}:host(.link) span::before{content:""}:host(.list-ordered) span::before{content:""}:host(.list-unordered) span::before{content:""}:host(.live-share) span::before{content:""}:host(.loading) span::before{content:""}:host(.location) span::before{content:""}:host(.mail-read) span::before{content:""}:host(.mail) span::before{content:""}:host(.markdown) span::before{content:""}:host(.megaphone) span::before{content:""}:host(.mention) span::before{content:""}:host(.milestone) span::before{content:""}:host(.mortar-board) span::before{content:""}:host(.move) span::before{content:""}:host(.multiple-windows) span::before{content:""}:host(.mute) span::before{content:""}:host(.no-newline) span::before{content:""}:host(.note) span::before{content:""}:host(.octoface) span::before{content:""}:host(.open-preview) span::before{content:""}:host(.package) span::before{content:""}:host(.paintcan) span::before{content:""}:host(.pin) span::before{content:""}:host(.play) span::before{content:""}:host(.run) span::before{content:""}:host(.plug) span::before{content:""}:host(.preserve-case) span::before{content:""}:host(.preview) span::before{content:""}:host(.project) span::before{content:""}:host(.pulse) span::before{content:""}:host(.question) span::before{content:""}:host(.quote) span::before{content:""}:host(.radio-tower) span::before{content:""}:host(.reactions) span::before{content:""}:host(.references) span::before{content:""}:host(.refresh) span::before{content:""}:host(.regex) span::before{content:""}:host(.remote-explorer) span::before{content:""}:host(.remote) span::before{content:""}:host(.remove) span::before{content:""}:host(.replace-all) span::before{content:""}:host(.replace) span::before{content:""}:host(.repo-clone) span::before{content:""}:host(.repo-force-push) span::before{content:""}:host(.repo-pull) span::before{content:""}:host(.repo-push) span::before{content:""}:host(.report) span::before{content:""}:host(.request-changes) span::before{content:""}:host(.rocket) span::before{content:""}:host(.root-folder-opened) span::before{content:""}:host(.root-folder) span::before{content:""}:host(.rss) span::before{content:""}:host(.ruby) span::before{content:""}:host(.save-all) span::before{content:""}:host(.save-as) span::before{content:""}:host(.save) span::before{content:""}:host(.screen-full) span::before{content:""}:host(.screen-normal) span::before{content:""}:host(.search-stop) span::before{content:""}:host(.server) span::before{content:""}:host(.settings-gear) span::before{content:""}:host(.settings) span::before{content:""}:host(.shield) span::before{content:""}:host(.smiley) span::before{content:""}:host(.sort-precedence) span::before{content:""}:host(.split-horizontal) span::before{content:""}:host(.split-vertical) span::before{content:""}:host(.squirrel) span::before{content:""}:host(.star-full) span::before{content:""}:host(.star-half) span::before{content:""}:host(.symbol-class) span::before{content:""}:host(.symbol-color) span::before{content:""}:host(.symbol-constant) span::before{content:""}:host(.symbol-enum-member) span::before{content:""}:host(.symbol-field) span::before{content:""}:host(.symbol-file) span::before{content:""}:host(.symbol-interface) span::before{content:""}:host(.symbol-keyword) span::before{content:""}:host(.symbol-misc) span::before{content:""}:host(.symbol-operator) span::before{content:""}:host(.symbol-property) span::before{content:""}:host(.wrench) span::before{content:""}:host(.wrench-subaction) span::before{content:""}:host(.symbol-snippet) span::before{content:""}:host(.tasklist) span::before{content:""}:host(.telescope) span::before{content:""}:host(.text-size) span::before{content:""}:host(.three-bars) span::before{content:""}:host(.thumbsdown) span::before{content:""}:host(.thumbsup) span::before{content:""}:host(.tools) span::before{content:""}:host(.triangle-down) span::before{content:""}:host(.triangle-left) span::before{content:""}:host(.triangle-right) span::before{content:""}:host(.triangle-up) span::before{content:""}:host(.twitter) span::before{content:""}:host(.unfold) span::before{content:""}:host(.unlock) span::before{content:""}:host(.unmute) span::before{content:""}:host(.unverified) span::before{content:""}:host(.verified) span::before{content:""}:host(.versions) span::before{content:""}:host(.vm-active) span::before{content:""}:host(.vm-outline) span::before{content:""}:host(.vm-running) span::before{content:""}:host(.watch) span::before{content:""}:host(.whitespace) span::before{content:""}:host(.whole-word) span::before{content:""}:host(.window) span::before{content:""}:host(.word-wrap) span::before{content:""}:host(.zoom-in) span::before{content:""}:host(.zoom-out) span::before{content:""}:host(.list-filter) span::before{content:""}:host(.list-flat) span::before{content:""}:host(.list-selection) span::before{content:""}:host(.selection) span::before{content:""}:host(.list-tree) span::before{content:""}:host(.debug-breakpoint-function-unverified) span::before{content:""}:host(.debug-breakpoint-function) span::before{content:""}:host(.debug-breakpoint-function-disabled) span::before{content:""}:host(.debug-stackframe-active) span::before{content:""}:host(.circle-small-filled) span::before{content:""}:host(.debug-stackframe-dot) span::before{content:""}:host(.terminal-decoration-mark) span::before{content:""}:host(.debug-stackframe) span::before{content:""}:host(.debug-stackframe-focused) span::before{content:""}:host(.debug-breakpoint-unsupported) span::before{content:""}:host(.symbol-string) span::before{content:""}:host(.debug-reverse-continue) span::before{content:""}:host(.debug-step-back) span::before{content:""}:host(.debug-restart-frame) span::before{content:""}:host(.debug-alt) span::before{content:""}:host(.call-incoming) span::before{content:""}:host(.call-outgoing) span::before{content:""}:host(.menu) span::before{content:""}:host(.expand-all) span::before{content:""}:host(.feedback) span::before{content:""}:host(.group-by-ref-type) span::before{content:""}:host(.ungroup-by-ref-type) span::before{content:""}:host(.account) span::before{content:""}:host(.bell-dot) span::before{content:""}:host(.debug-console) span::before{content:""}:host(.library) span::before{content:""}:host(.output) span::before{content:""}:host(.run-all) span::before{content:""}:host(.sync-ignored) span::before{content:""}:host(.pinned) span::before{content:""}:host(.github-inverted) span::before{content:""}:host(.server-process) span::before{content:""}:host(.server-environment) span::before{content:""}:host(.pass) span::before{content:""}:host(.issue-closed) span::before{content:""}:host(.stop-circle) span::before{content:""}:host(.play-circle) span::before{content:""}:host(.record) span::before{content:""}:host(.debug-alt-small) span::before{content:""}:host(.vm-connect) span::before{content:""}:host(.cloud) span::before{content:""}:host(.merge) span::before{content:""}:host(.export) span::before{content:""}:host(.graph-left) span::before{content:""}:host(.magnet) span::before{content:""}:host(.notebook) span::before{content:""}:host(.redo) span::before{content:""}:host(.check-all) span::before{content:""}:host(.pinned-dirty) span::before{content:""}:host(.pass-filled) span::before{content:""}:host(.circle-large-filled) span::before{content:""}:host(.circle-large) span::before{content:""}:host(.circle-large-outline) span::before{content:""}:host(.combine) span::before{content:""}:host(.gather) span::before{content:""}:host(.table) span::before{content:""}:host(.variable-group) span::before{content:""}:host(.type-hierarchy) span::before{content:""}:host(.type-hierarchy-sub) span::before{content:""}:host(.type-hierarchy-super) span::before{content:""}:host(.git-pull-request-create) span::before{content:""}:host(.run-above) span::before{content:""}:host(.run-below) span::before{content:""}:host(.notebook-template) span::before{content:""}:host(.debug-rerun) span::before{content:""}:host(.workspace-trusted) span::before{content:""}:host(.workspace-untrusted) span::before{content:""}:host(.workspace-unknown) span::before{content:""}:host(.terminal-cmd) span::before{content:""}:host(.terminal-debian) span::before{content:""}:host(.terminal-linux) span::before{content:""}:host(.terminal-powershell) span::before{content:""}:host(.terminal-tmux) span::before{content:""}:host(.terminal-ubuntu) span::before{content:""}:host(.terminal-bash) span::before{content:""}:host(.arrow-swap) span::before{content:""}:host(.copy) span::before{content:""}:host(.person-add) span::before{content:""}:host(.filter-filled) span::before{content:""}:host(.wand) span::before{content:""}:host(.debug-line-by-line) span::before{content:""}:host(.inspect) span::before{content:""}:host(.layers) span::before{content:""}:host(.layers-dot) span::before{content:""}:host(.layers-active) span::before{content:""}:host(.compass) span::before{content:""}:host(.compass-dot) span::before{content:""}:host(.compass-active) span::before{content:""}:host(.azure) span::before{content:""}:host(.issue-draft) span::before{content:""}:host(.git-pull-request-closed) span::before{content:""}:host(.git-pull-request-draft) span::before{content:""}:host(.debug-all) span::before{content:""}:host(.debug-coverage) span::before{content:""}:host(.run-errors) span::before{content:""}:host(.folder-library) span::before{content:""}:host(.debug-continue-small) span::before{content:""}:host(.beaker-stop) span::before{content:""}:host(.graph-line) span::before{content:""}:host(.graph-scatter) span::before{content:""}:host(.pie-chart) span::before{content:""}:host(.bracket) span::before{content:""}:host(.bracket-dot) span::before{content:""}:host(.bracket-error) span::before{content:""}:host(.lock-small) span::before{content:""}:host(.azure-devops) span::before{content:""}:host(.verified-filled) span::before{content:""}:host(.newline) span::before{content:""}:host(.layout) span::before{content:""}:host(.layout-activitybar-left) span::before{content:""}:host(.layout-activitybar-right) span::before{content:""}:host(.layout-panel-left) span::before{content:""}:host(.layout-panel-center) span::before{content:""}:host(.layout-panel-justify) span::before{content:""}:host(.layout-panel-right) span::before{content:""}:host(.layout-panel) span::before{content:""}:host(.layout-sidebar-left) span::before{content:""}:host(.layout-sidebar-right) span::before{content:""}:host(.layout-statusbar) span::before{content:""}:host(.layout-menubar) span::before{content:""}:host(.layout-centered) span::before{content:""}:host(.target) span::before{content:""}:host(.indent) span::before{content:""}:host(.record-small) span::before{content:""}:host(.error-small) span::before{content:""}:host(.terminal-decoration-error) span::before{content:""}:host(.arrow-circle-down) span::before{content:""}:host(.arrow-circle-left) span::before{content:""}:host(.arrow-circle-right) span::before{content:""}:host(.arrow-circle-up) span::before{content:""}:host(.layout-sidebar-right-off) span::before{content:""}:host(.layout-panel-off) span::before{content:""}:host(.layout-sidebar-left-off) span::before{content:""}:host(.blank) span::before{content:""}:host(.heart-filled) span::before{content:""}:host(.map) span::before{content:""}:host(.map-filled) span::before{content:""}:host(.circle-small) span::before{content:""}:host(.bell-slash) span::before{content:""}:host(.bell-slash-dot) span::before{content:""}:host(.comment-unresolved) span::before{content:""}:host(.git-pull-request-go-to-changes) span::before{content:""}:host(.git-pull-request-new-changes) span::before{content:""}:host(.search-fuzzy) span::before{content:""}:host(.comment-draft) span::before{content:""}:host(.send) span::before{content:""}:host(.sparkle) span::before{content:""}:host(.insert) span::before{content:""}`;
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
        blocks: { 'default':`<span></span>` }
    });
}
    getClassName() {
        return "Icon";
    }
}
Icon.Namespace=`dependances`;
Icon.Tag=`av-icon`;
_.Icon=Icon;
if(!window.customElements.get('av-icon')){window.customElements.define('av-icon', Icon);Aventus.WebComponentInstance.registerDefinition(Icon);}

const GeneralInformation = class GeneralInformation extends Aventus.WebComponent {
    static __style = `:host>div{margin:16px 0}`;
    __getStatic() {
        return GeneralInformation;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(GeneralInformation.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<h3>General informations</h3><div>	<vscode-text-field>Module name</vscode-text-field></div><div>	<vscode-text-field>Version</vscode-text-field></div><div>	<vscode-text-field>Webcomponent prefix</vscode-text-field></div><div>	<vscode-checkbox>Hide warnings</vscode-checkbox></div><div>	<vscode-text-field>Avoid parsing tags</vscode-text-field></div><div>	<vscode-button>Save</vscode-button></div>` }
    });
}
    getClassName() {
        return "GeneralInformation";
    }
}
GeneralInformation.Namespace=`dependances`;
GeneralInformation.Tag=`av-general-information`;
_.GeneralInformation=GeneralInformation;
if(!window.customElements.get('av-general-information')){window.customElements.define('av-general-information', GeneralInformation);Aventus.WebComponentInstance.registerDefinition(GeneralInformation);}

const Dependances = class Dependances extends Aventus.WebComponent {
    get 'no_deps'() { return this.getBoolAttr('no_deps') }
    set 'no_deps'(val) { this.setBoolAttr('no_deps', val) }    get 'dependances'() {
						return this.__watch["dependances"];
					}
					set 'dependances'(val) {
						this.__watch["dependances"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("dependances", ((target) => {
    target.no_deps = target.dependances.length == 0;
}));    super.__registerWatchesActions();
}
    static __style = `:host .no-dependances-txt{display:none}:host vscode-data-grid-row{text-align:center}:host av-icon.trash{color:var(--vscode-errorForeground)}:host .add-row{margin-top:16px}:host([no_deps]) .no-dependances-txt{display:block}`;
    __getStatic() {
        return Dependances;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Dependances.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<h3>Dependances</h3><p class="no-dependances-txt">Your project has no dependance</p><vscode-data-grid aria-label="Default">	<vscode-data-grid-row row-type="header">		<vscode-data-grid-cell cell-type="columnheader" grid-column="1">			Name		</vscode-data-grid-cell>		<vscode-data-grid-cell cell-type="columnheader" grid-column="2">			Version		</vscode-data-grid-cell>		<vscode-data-grid-cell cell-type="columnheader" grid-column="3">			Url		</vscode-data-grid-cell>		<vscode-data-grid-cell cell-type="columnheader" grid-column="4">			Action		</vscode-data-grid-cell>	</vscode-data-grid-row>	<template _id="dependances_0"></template>	<vscode-data-grid-row class="add-row">		<vscode-data-grid-cell grid-column="1"></vscode-data-grid-cell>		<vscode-data-grid-cell grid-column="2"></vscode-data-grid-cell>		<vscode-data-grid-cell grid-column="3"></vscode-data-grid-cell>		<vscode-data-grid-cell grid-column="4">			<vscode-button>Add</vscode-button>		</vscode-data-grid-cell>	</vscode-data-grid-row></vscode-data-grid>` }
    });
}
    get temp () { var list = Array.from(this.shadowRoot.querySelectorAll('[_id="dependances_1"]')); return list; }    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`		<vscode-data-grid-row _id="dependances_1">			<vscode-data-grid-cell grid-column="1" _id="dependances_2"></vscode-data-grid-cell>			<vscode-data-grid-cell grid-column="2" _id="dependances_3"></vscode-data-grid-cell>			<vscode-data-grid-cell grid-column="3">				<a target="_blank" _id="dependances_4"></a>			</vscode-data-grid-cell>			<vscode-data-grid-cell grid-column="4">				<av-icon class="trash"></av-icon>			</vscode-data-grid-cell>		</vscode-data-grid-row>	`);templ0.setActions({
  "content": {
    "dependances_2°@HTML": {
      "fct": (c) => `\r\n\t\t\t\t${c.print(c.comp.__4c586c5853b5a601cdc35d6c258f14a8method1(c.data.dep))}\r\n\t\t\t`,
      "once": true
    },
    "dependances_3°@HTML": {
      "fct": (c) => `\r\n\t\t\t\t${c.print(c.comp.__4c586c5853b5a601cdc35d6c258f14a8method2(c.data.dep))}\r\n\t\t\t`,
      "once": true
    },
    "dependances_4°href": {
      "fct": (c) => `${c.print(c.comp.__4c586c5853b5a601cdc35d6c258f14a8method3(c.data.dep))}`,
      "once": true
    },
    "dependances_4°@HTML": {
      "fct": (c) => `\r\n\t\t\t\t\t${c.print(c.comp.__4c586c5853b5a601cdc35d6c258f14a8method3(c.data.dep))}\r\n\t\t\t\t`,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'dependances_0',
                    template: templ0,
                simple:{data: "this.dependances",item:"dep"}}); }
    getClassName() {
        return "Dependances";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('no_deps')) { this.attributeChangedCallback('no_deps', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["dependances"] = [{        name: "AventusUI",        version: "1.0.0",        uri: "https://aventusjs.com/aventusUI.def.avt"    }, {        name: "AventusUI2",        version: "1.0.0",        uri: "https://aventusjs.com/aventusUI.def.avt"    }]; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('no_deps');this.__correctGetter('dependances'); }
    __listBoolProps() { return ["no_deps"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    __4c586c5853b5a601cdc35d6c258f14a8method1(dep) {
        return dep.name;
    }
    __4c586c5853b5a601cdc35d6c258f14a8method2(dep) {
        return dep.version;
    }
    __4c586c5853b5a601cdc35d6c258f14a8method3(dep) {
        return dep.uri;
    }
}
Dependances.Namespace=`dependances`;
Dependances.Tag=`av-dependances`;
_.Dependances=Dependances;
if(!window.customElements.get('av-dependances')){window.customElements.define('av-dependances', Dependances);Aventus.WebComponentInstance.registerDefinition(Dependances);}

const ConfigurationEditor = class ConfigurationEditor extends Aventus.WebComponent {
    static __style = ``;
    __getStatic() {
        return ConfigurationEditor;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ConfigurationEditor.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<h1>Configuration editor</h1><vscode-panels>	<vscode-panel-tab id="tab-1">General</vscode-panel-tab>	<vscode-panel-tab id="tab-2">Dependances</vscode-panel-tab>	<vscode-panel-tab id="tab-3">Builds</vscode-panel-tab>	<vscode-panel-tab id="tab-4">Statics</vscode-panel-tab>	<vscode-panel-view id="view-1">		<av-general-information></av-general-information>	</vscode-panel-view>	<vscode-panel-view id="view-2">		<av-dependances></av-dependances>	</vscode-panel-view>	<vscode-panel-view id="view-3">		Debug Console Content	</vscode-panel-view>	<vscode-panel-view id="view-4">		Terminal Content	</vscode-panel-view></vscode-panels>` }
    });
}
    getClassName() {
        return "ConfigurationEditor";
    }
}
ConfigurationEditor.Namespace=`dependances`;
ConfigurationEditor.Tag=`av-configuration-editor`;
_.ConfigurationEditor=ConfigurationEditor;
if(!window.customElements.get('av-configuration-editor')){window.customElements.define('av-configuration-editor', ConfigurationEditor);Aventus.WebComponentInstance.registerDefinition(ConfigurationEditor);}


for(let key in _) { dependances[key] = _[key] }
})(dependances);
