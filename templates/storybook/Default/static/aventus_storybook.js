var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const moduleName = `Aventus`;
const _ = {};


let _n;
const ElementExtension=class ElementExtension {
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
                var newEl = el.shadowRoot.elementFromPoint(x, y);
                if (newEl && newEl != el && el.shadowRoot.contains(newEl)) {
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
}
ElementExtension.Namespace=`Aventus`;

_.ElementExtension=ElementExtension;
const Instance=class Instance {
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
const Style=class Style {
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
const setValueToObject=function setValueToObject(path, obj, value) {
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
const Callback=class Callback {
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
    trigger(args) {
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
const Mutex=class Mutex {
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
const compareObject=function compareObject(obj1, obj2) {
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
        if (obj1 instanceof HTMLElement || obj2 instanceof HTMLElement) {
            return obj1 == obj2;
        }
        if (obj1 instanceof Date || obj2 instanceof Date) {
            return obj1.toString() === obj2.toString();
        }
        obj1 = Watcher.extract(obj1);
        obj2 = Watcher.extract(obj2);
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
const getValueFromObject=function getValueFromObject(path, obj) {
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
const Effect=class Effect {
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
                let full = fullPath;
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
const Watcher=class Watcher {
    static __reservedName = {
        __path: '__path',
    };
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
        const replaceByAlias = (target, element, prop, receiver) => {
            let fullInternalPath = "";
            if (Array.isArray(target)) {
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
                    let unbindElement = getValueFromObject(oldPath, root);
                    if (receiver == null) {
                        receiver = getValueFromObject(target.__path, realProxy);
                        if (internalAliases[fullInternalPath]) {
                            internalAliases[fullInternalPath].unbind();
                        }
                    }
                    let result = Reflect.set(target, prop, unbindElement, receiver);
                    element.__addAlias(proxyData.baseData, oldPath, (type, target, receiver2, value, prop2, dones) => {
                        let triggerPath;
                        if (prop2.startsWith("[") || fullInternalPath == "" || prop2 == "") {
                            triggerPath = fullInternalPath + prop2;
                        }
                        else {
                            triggerPath = fullInternalPath + "." + prop2;
                        }
                        triggerPath = triggerPath.replace(/\[(.*?)\]/g, '.$1');
                        if (type == 'DELETED' && internalAliases[triggerPath]) {
                            internalAliases[triggerPath].unbind();
                        }
                        let splitted = triggerPath.split(".");
                        let newProp = splitted.pop();
                        let newReceiver = getValueFromObject(splitted.join("."), realProxy);
                        trigger(type, target, newReceiver, value, newProp, dones);
                    });
                    internalAliases[fullInternalPath] = {
                        unbind: () => {
                            delete internalAliases[fullInternalPath];
                            element.__deleteAlias(proxyData.baseData, oldPath);
                            deleteAlias(root, prop);
                        }
                    };
                    addAlias(root, prop, (type, target, receiver2, value, prop2, dones) => {
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
                        element.__trigger(type, target, newReceiver, value, newProp, dones);
                        element.__path = pathSave;
                    });
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
                element = replaceByAlias(target, element, prop, null);
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
                    return () => {
                        clearReservedNames(target);
                        return target;
                    };
                }
                else if (prop == "toJSON") {
                    if (target.toJSON) {
                        return target.toJSON;
                    }
                    if (Array.isArray(target)) {
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
                        trigger(type, target, receiver, target, '');
                    };
                }
                return undefined;
            },
            get(target, prop, receiver) {
                if (reservedName[prop]) {
                    return target[prop];
                }
                let customResult = this.tryCustomFunction(target, prop, receiver);
                if (customResult !== undefined) {
                    return customResult;
                }
                let element = target[prop];
                if (typeof (element) == 'function') {
                    if (Array.isArray(target)) {
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
                                    let index = target.push(el);
                                    target.splice(target.length - 1, 1, el);
                                    trigger('CREATED', target, receiver, receiver[index - 1], "[" + (index - 1) + "]");
                                    trigger('UPDATED', target, receiver, target.length, "length");
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
                                    for (let i = index; i < index + nbRemove; i++) {
                                        oldValues.push(receiver[i]);
                                    }
                                    let updateLength = nbRemove != insert.length;
                                    let res = target.splice(index, nbRemove, ...insert);
                                    for (let i = 0; i < oldValues.length; i++) {
                                        trigger('DELETED', target, receiver, oldValues[i], "[" + index + "]");
                                    }
                                    for (let i = 0; i < insert.length; i++) {
                                        target.splice((index + i), 1, insert[i]);
                                        trigger('CREATED', target, receiver, receiver[(index + i)], "[" + (index + i) + "]");
                                    }
                                    // for(let i = fromIndex, j = 0; i < target.length; i++, j++) {
                                    //     let proxyEl = this.getProxyObject(target, target[i], i);
                                    //     let recuUpdate = (childEl) => {
                                    //         if(Array.isArray(childEl)) {
                                    //             for(let i = 0; i < childEl.length; i++) {
                                    //                 if(childEl[i] instanceof Object && childEl[i].__path) {
                                    //                     let newProxyEl = this.getProxyObject(childEl, childEl[i], i);
                                    //                     recuUpdate(newProxyEl);
                                    //         else if(childEl instanceof Object && !(childEl instanceof Date)) {
                                    //             for(let key in childEl) {
                                    //                 if(childEl[key] instanceof Object && childEl[key].__path) {
                                    //                     let newProxyEl = this.getProxyObject(childEl, childEl[key], key);
                                    //                     recuUpdate(newProxyEl);
                                    //     recuUpdate(proxyEl);
                                    if (updateLength)
                                        trigger('UPDATED', target, receiver, target.length, "length");
                                    return res;
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
                                    let result = target.set(key, value);
                                    trigger('CREATED', target, receiver, receiver.get(key), key);
                                    trigger('UPDATED', target, receiver, target.size, "size");
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
                                    let oldValue = receiver.get(key);
                                    let res = target.delete(key);
                                    trigger('DELETED', target, receiver, oldValue, key);
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
                let oldValue = Reflect.get(target, prop, receiver);
                value = replaceByAlias(target, value, prop, receiver);
                let triggerChange = false;
                if (!reservedName[prop]) {
                    if (Array.isArray(target)) {
                        if (prop != "length") {
                            triggerChange = true;
                        }
                    }
                    else {
                        if (!compareObject(value, oldValue)) {
                            triggerChange = true;
                        }
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
                    if (oldValue instanceof Effect) {
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
                if (Array.isArray(target)) {
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
        };
        var realProxy = new Proxy(obj, proxyData);
        proxyData.baseData = obj;
        setProxyPath(realProxy, '');
        return realProxy;
    }
    static is(obj) {
        return typeof obj == 'object' && obj.__isProxy;
    }
    static extract(obj) {
        if (this.is(obj)) {
            return obj.getTarget();
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
}
Watcher.Namespace=`Aventus`;

_.Watcher=Watcher;
const Computed=class Computed extends Effect {
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
const ComputedNoRecomputed=class ComputedNoRecomputed extends Computed {
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
const PressManager=class PressManager {
    static globalConfig = {
        delayDblPress: 150,
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
    options;
    element;
    delayDblPress = PressManager.globalConfig.delayDblPress ?? 150;
    delayLongPress = PressManager.globalConfig.delayLongPress ?? 700;
    nbPress = 0;
    offsetDrag = PressManager.globalConfig.offsetDrag ?? 20;
    state = {
        oneActionTriggered: false,
        isMoving: false,
    };
    startPosition = { x: 0, y: 0 };
    customFcts = {};
    timeoutDblPress = 0;
    timeoutLongPress = 0;
    downEventSaved;
    actionsName = {
        press: "press",
        longPress: "longPress",
        dblPress: "dblPress",
        drag: "drag"
    };
    useDblPress = false;
    stopPropagation = () => true;
    functionsBinded = {
        downAction: (e) => { },
        upAction: (e) => { },
        moveAction: (e) => { },
        childPressStart: (e) => { },
        childPressEnd: (e) => { },
        childPress: (e) => { },
        childDblPress: (e) => { },
        childLongPress: (e) => { },
        childDragStart: (e) => { },
    };
    /**
     * @param {*} options - The options
     * @param {HTMLElement | HTMLElement[]} options.element - The element to manage
     */
    constructor(options) {
        if (options.element === void 0) {
            throw 'You must provide an element';
        }
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
        this.functionsBinded.childDblPress = this.childDblPress.bind(this);
        this.functionsBinded.childDragStart = this.childDragStart.bind(this);
        this.functionsBinded.childLongPress = this.childLongPress.bind(this);
        this.functionsBinded.childPress = this.childPress.bind(this);
        this.functionsBinded.childPressStart = this.childPressStart.bind(this);
        this.functionsBinded.childPressEnd = this.childPressEnd.bind(this);
    }
    init() {
        this.bindAllFunction();
        this.element.addEventListener("pointerdown", this.functionsBinded.downAction);
        this.element.addEventListener("trigger_pointer_press", this.functionsBinded.childPress);
        this.element.addEventListener("trigger_pointer_pressstart", this.functionsBinded.childPressStart);
        this.element.addEventListener("trigger_pointer_pressend", this.functionsBinded.childPressEnd);
        this.element.addEventListener("trigger_pointer_dblpress", this.functionsBinded.childDblPress);
        this.element.addEventListener("trigger_pointer_longpress", this.functionsBinded.childLongPress);
        this.element.addEventListener("trigger_pointer_dragstart", this.functionsBinded.childDragStart);
    }
    downAction(e) {
        if (this.options.onEvent) {
            this.options.onEvent(e);
        }
        if (!this.options.buttonAllowed?.includes(e.button)) {
            return;
        }
        this.downEventSaved = e;
        if (this.stopPropagation()) {
            e.stopImmediatePropagation();
        }
        this.customFcts = {};
        if (this.nbPress == 0) {
            this.state.oneActionTriggered = false;
            clearTimeout(this.timeoutDblPress);
        }
        this.startPosition = { x: e.pageX, y: e.pageY };
        document.addEventListener("pointerup", this.functionsBinded.upAction);
        document.addEventListener("pointercancel", this.functionsBinded.upAction);
        document.addEventListener("pointermove", this.functionsBinded.moveAction);
        this.timeoutLongPress = setTimeout(() => {
            if (!this.state.oneActionTriggered) {
                if (this.options.onLongPress) {
                    this.state.oneActionTriggered = true;
                    this.options.onLongPress(e, this);
                    this.triggerEventToParent(this.actionsName.longPress, e);
                }
                else {
                    this.emitTriggerFunction(this.actionsName.longPress, e);
                }
            }
        }, this.delayLongPress);
        if (this.options.onPressStart) {
            this.options.onPressStart(e, this);
            this.emitTriggerFunctionParent("pressstart", e);
        }
        else {
            this.emitTriggerFunction("pressstart", e);
        }
    }
    upAction(e) {
        if (this.options.onEvent) {
            this.options.onEvent(e);
        }
        if (this.stopPropagation()) {
            e.stopImmediatePropagation();
        }
        document.removeEventListener("pointerup", this.functionsBinded.upAction);
        document.removeEventListener("pointercancel", this.functionsBinded.upAction);
        document.removeEventListener("pointermove", this.functionsBinded.moveAction);
        clearTimeout(this.timeoutLongPress);
        if (this.state.isMoving) {
            this.state.isMoving = false;
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
                    if (!this.state.oneActionTriggered) {
                        this.state.oneActionTriggered = true;
                        this.nbPress = 0;
                        if (this.options.onDblPress) {
                            this.options.onDblPress(e, this);
                            this.triggerEventToParent(this.actionsName.dblPress, e);
                        }
                        else {
                            this.emitTriggerFunction(this.actionsName.dblPress, e);
                        }
                    }
                }
                else if (this.nbPress == 1) {
                    this.timeoutDblPress = setTimeout(() => {
                        this.nbPress = 0;
                        if (!this.state.oneActionTriggered) {
                            if (this.options.onPress) {
                                this.state.oneActionTriggered = true;
                                this.options.onPress(e, this);
                                this.triggerEventToParent(this.actionsName.press, e);
                            }
                            else {
                                this.emitTriggerFunction(this.actionsName.press, e);
                            }
                        }
                    }, this.delayDblPress);
                }
            }
            else {
                if (!this.state.oneActionTriggered) {
                    if (this.options.onPress) {
                        this.state.oneActionTriggered = true;
                        this.options.onPress(e, this);
                        this.triggerEventToParent(this.actionsName.press, e);
                    }
                    else {
                        this.emitTriggerFunction("press", e);
                    }
                }
            }
        }
        if (this.options.onPressEnd) {
            this.options.onPressEnd(e, this);
            this.emitTriggerFunctionParent("pressend", e);
        }
        else {
            this.emitTriggerFunction("pressend", e);
        }
    }
    moveAction(e) {
        if (this.options.onEvent) {
            this.options.onEvent(e);
        }
        if (!this.state.isMoving && !this.state.oneActionTriggered) {
            if (this.stopPropagation()) {
                e.stopImmediatePropagation();
            }
            let xDist = e.pageX - this.startPosition.x;
            let yDist = e.pageY - this.startPosition.y;
            let distance = Math.sqrt(xDist * xDist + yDist * yDist);
            if (distance > this.offsetDrag && this.downEventSaved) {
                this.state.oneActionTriggered = true;
                if (this.options.onDragStart) {
                    this.state.isMoving = true;
                    this.options.onDragStart(this.downEventSaved, this);
                    this.triggerEventToParent(this.actionsName.drag, e);
                }
                else {
                    this.emitTriggerFunction("dragstart", this.downEventSaved);
                }
            }
        }
        else if (this.state.isMoving) {
            if (this.options.onDrag) {
                this.options.onDrag(e, this);
            }
            else if (this.customFcts.src && this.customFcts.onDrag) {
                this.customFcts.onDrag(e, this.customFcts.src);
            }
        }
    }
    triggerEventToParent(eventName, pointerEvent) {
        if (this.element.parentNode) {
            this.element.parentNode.dispatchEvent(new CustomEvent("pressaction_trigger", {
                bubbles: true,
                cancelable: false,
                composed: true,
                detail: {
                    target: this.element,
                    eventName: eventName,
                    realEvent: pointerEvent
                }
            }));
        }
    }
    childPressStart(e) {
        if (this.options.onPressStart) {
            this.options.onPressStart(e.detail.realEvent, this);
        }
    }
    childPressEnd(e) {
        if (this.options.onPressEnd) {
            this.options.onPressEnd(e.detail.realEvent, this);
        }
    }
    childPress(e) {
        if (this.options.onPress) {
            if (this.stopPropagation()) {
                e.stopImmediatePropagation();
            }
            e.detail.state.oneActionTriggered = true;
            this.options.onPress(e.detail.realEvent, this);
            this.triggerEventToParent(this.actionsName.press, e.detail.realEvent);
        }
    }
    childDblPress(e) {
        if (this.options.onDblPress) {
            if (this.stopPropagation()) {
                e.stopImmediatePropagation();
            }
            if (e.detail.state) {
                e.detail.state.oneActionTriggered = true;
            }
            this.options.onDblPress(e.detail.realEvent, this);
            this.triggerEventToParent(this.actionsName.dblPress, e.detail.realEvent);
        }
    }
    childLongPress(e) {
        if (this.options.onLongPress) {
            if (this.stopPropagation()) {
                e.stopImmediatePropagation();
            }
            e.detail.state.oneActionTriggered = true;
            this.options.onLongPress(e.detail.realEvent, this);
            this.triggerEventToParent(this.actionsName.longPress, e.detail.realEvent);
        }
    }
    childDragStart(e) {
        if (this.options.onDragStart) {
            if (this.stopPropagation()) {
                e.stopImmediatePropagation();
            }
            e.detail.state.isMoving = true;
            e.detail.customFcts.src = this;
            e.detail.customFcts.onDrag = this.options.onDrag;
            e.detail.customFcts.onDragEnd = this.options.onDragEnd;
            e.detail.customFcts.offsetDrag = this.options.offsetDrag;
            this.options.onDragStart(e.detail.realEvent, this);
            this.triggerEventToParent(this.actionsName.drag, e.detail.realEvent);
        }
    }
    emitTriggerFunctionParent(action, e) {
        let el = this.element.parentElement;
        if (el == null) {
            let parentNode = this.element.parentNode;
            if (parentNode instanceof ShadowRoot) {
                this.emitTriggerFunction(action, e, parentNode.host);
            }
        }
        else {
            this.emitTriggerFunction(action, e, el);
        }
    }
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
            this.element.removeEventListener("trigger_pointer_press", this.functionsBinded.childPress);
            this.element.removeEventListener("trigger_pointer_pressstart", this.functionsBinded.childPressStart);
            this.element.removeEventListener("trigger_pointer_pressend", this.functionsBinded.childPressEnd);
            this.element.removeEventListener("trigger_pointer_dblpress", this.functionsBinded.childDblPress);
            this.element.removeEventListener("trigger_pointer_longpress", this.functionsBinded.childLongPress);
            this.element.removeEventListener("trigger_pointer_dragstart", this.functionsBinded.childDragStart);
            document.removeEventListener("pointerup", this.functionsBinded.upAction);
            document.removeEventListener("pointercancel", this.functionsBinded.upAction);
            document.removeEventListener("pointermove", this.functionsBinded.moveAction);
        }
    }
}
PressManager.Namespace=`Aventus`;

_.PressManager=PressManager;
const Uri=class Uri {
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
const State=class State {
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
const EmptyState=class EmptyState extends State {
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
const StateManager=class StateManager {
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
                            [...subscriber.callbacks.inactive].forEach(callback => {
                                callback(oldState, stateToUse, oldSlugNotNull);
                            });
                        }
                    }
                    for (let trigger of triggerActive) {
                        [...trigger.subscriber.callbacks.active].forEach(callback => {
                            callback(stateToUse, trigger.params);
                        });
                    }
                    for (let trigger of inactiveToActive) {
                        trigger.subscriber.isActive = true;
                        [...trigger.subscriber.callbacks.active].forEach(callback => {
                            callback(stateToUse, trigger.params);
                        });
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
                        [...this.subscribers[key].callbacks.active].forEach(callback => {
                            callback(stateToUse, slugsNotNull);
                        });
                    }
                }
                stateToUse.onActivate();
            }
            this.afterStateChanged.trigger([]);
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
const TemplateContext=class TemplateContext {
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
const TemplateInstance=class TemplateInstance {
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
                if (e instanceof TypeError && e.message.startsWith("Cannot read properties of undefined")) {
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
                if (e instanceof TypeError && e.message.startsWith("Cannot read properties of undefined")) {
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
                if (e instanceof TypeError && e.message.startsWith("Cannot read properties of undefined")) {
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
                elements = this.component.__watch;
            }
            if (!elements || !elements.__isProxy) {
                debugger;
            }
            const subTemp = (action, path, value) => {
                if (basePath.startsWith(path)) {
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
const Template=class Template {
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
const WebComponent=class WebComponent extends HTMLElement {
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
        this.__createStates();
        this.__subscribeState();
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
        return this.getAttribute(name) ?? undefined;
    }
    setStringAttr(name, val) {
        if (val === undefined || val === null) {
            this.removeAttribute(name);
        }
        else {
            this.setAttribute(name, val);
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
}
WebComponent.Namespace=`Aventus`;

_.WebComponent=WebComponent;
const WebComponentInstance=class WebComponentInstance {
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
const ResourceLoader=class ResourceLoader {
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
                throw 'unknow extension found :' + extension + ". Please define your extension inside options";
            }
        }
        else {
            result = options;
        }
        return result;
    }
}
ResourceLoader.Namespace=`Aventus`;

_.ResourceLoader=ResourceLoader;

for(let key in _) { Aventus[key] = _[key] }
})(Aventus);

var AventusStorybook;
(AventusStorybook||(AventusStorybook = {}));
(function (AventusStorybook) {
const moduleName = `AventusStorybook`;
const _ = {};


let _n;
const TypeRender = class TypeRender extends Aventus.WebComponent {
    get 'no_border'() { return this.getBoolAttr('no_border') }
    set 'no_border'(val) { this.setBoolAttr('no_border', val) }get 'margin_left'() { return this.getNumberAttr('margin_left') }
    set 'margin_left'(val) { this.setNumberAttr('margin_left', val) }    get 'type'() {
						return this.__watch["type"];
					}
					set 'type'(val) {
						this.__watch["type"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("type");    super.__registerWatchesActions();
}
    static __style = `:host{--_type-render-font-size: var(--type-render-font-size, 12px)}:host{align-items:center;background-color:#f7fafc;border:1px solid #ecf4f9;border-radius:3px;color:rgba(46,52,56,.9);display:inline-flex;flex-direction:row;flex-grow:0;font-family:ui-monospace,Menlo,Monaco,"Roboto Mono","Oxygen Mono","Ubuntu Monospace","Source Code Pro","Droid Sans Mono","Courier New",monospace;font-family:"Nunito Sans",-apple-system,".SFNSText-Regular","San Francisco",BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif;font-size:var(--_type-render-font-size);margin:0;max-width:100%;overflow:auto;padding:3px 5px;padding-bottom:2px;padding-top:2px;text-decoration:none;white-space:normal;word-break:break-word}:host a[href]{color:#029cfd}:host div{white-space:nowrap}:host av-type-render{padding:0;border:none}:host([no_border]){border:none}`;
    __getStatic() {
        return TypeRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TypeRender.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`` }
    });
}
    getClassName() {
        return "TypeRender";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('no_border')) { this.attributeChangedCallback('no_border', false, false); }if(!this.hasAttribute('margin_left')){ this['margin_left'] = 0; } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["type"] = undefined; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('no_border');this.__upgradeProperty('margin_left');this.__correctGetter('type'); }
    __listBoolProps() { return ["no_border"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    getTypeRef(ref) {
        return '/?path=/docs/' + ref.toLocaleLowerCase().replace(/\./g, "-") + "--docs";
    }
    renderSimple(simple) {
        let el = document.createElement("a");
        if (simple.ref) {
            el.href = this.getTypeRef(simple.ref);
        }
        if (simple.generics && simple.generics.length > 0) {
            el = document.createElement("div");
            const link = document.createElement("a");
            if (simple.ref) {
                link.href = this.getTypeRef(simple.ref);
            }
            link.innerHTML = simple.name + "";
            el.appendChild(link);
            const span = document.createElement("span");
            span.innerHTML = "&lt;";
            el.appendChild(span);
            for (let i = 0; i < simple.generics.length; i++) {
                const typeRender = new TypeRender();
                typeRender.type = simple.generics[i];
                el.appendChild(typeRender);
                if (i + 1 < simple.generics.length) {
                    const comma = document.createElement("span");
                    comma.innerHTML = ',&nbsp;';
                    el.appendChild(comma);
                }
            }
            const spanClose = document.createElement("span");
            spanClose.innerHTML = "&gt;";
            el.appendChild(spanClose);
        }
        else {
            el.innerHTML = simple.name;
        }
        this.shadowRoot?.appendChild(el);
    }
    renderFunction(fct) {
        const pre = document.createElement("div");
        if (fct.generics && fct.generics.length > 0) {
            const spanOpen = document.createElement("span");
            spanOpen.innerHTML = "&lt;";
            pre.appendChild(spanOpen);
            for (let i = 0; i < fct.generics.length; i++) {
                const nameGeneric = document.createElement("span");
                nameGeneric.innerHTML = fct.generics[i].name;
                pre.appendChild(nameGeneric);
                if (fct.generics[i].constraint) {
                    const extendGeneric = document.createElement("span");
                    extendGeneric.innerHTML = ' extends ';
                    pre.appendChild(extendGeneric);
                    const extendTypeGeneric = new TypeRender();
                    extendTypeGeneric.type = fct.generics[i].constraint;
                }
                if (fct.generics[i].default) {
                    const defaultGeneric = document.createElement("span");
                    defaultGeneric.innerHTML = ' = ';
                    pre.appendChild(defaultGeneric);
                    const defaultTypeGeneric = new TypeRender();
                    defaultTypeGeneric.type = fct.generics[i].default;
                }
                if (i + 1 < fct.generics.length) {
                    const comma = document.createElement("span");
                    comma.innerHTML = ',&nbsp;';
                    pre.appendChild(comma);
                }
            }
            const spanClose = document.createElement("span");
            spanClose.innerHTML = "&gt;";
            pre.appendChild(spanClose);
        }
        const open = document.createElement("span");
        open.innerHTML = fct.isConstructor ? "new (" : "(";
        pre.appendChild(open);
        if (fct.parameters) {
            for (let i = 0; i < fct.parameters.length; i++) {
                const paramName = document.createElement("span");
                paramName.innerHTML = fct.parameters[i].name + ": ";
                pre.appendChild(paramName);
                const typeRender = new TypeRender();
                typeRender.type = fct.parameters[i].type;
                pre.appendChild(typeRender);
                if (i + 1 < fct.parameters.length) {
                    const comma = document.createElement("span");
                    comma.innerHTML = ',&nbsp;';
                    pre.appendChild(comma);
                }
            }
        }
        const close = document.createElement("span");
        close.innerHTML = ") => ";
        pre.appendChild(close);
        if (fct.return) {
            const typeRender = new TypeRender();
            typeRender.type = fct.return;
            pre.appendChild(typeRender);
        }
        else {
            const unknowName = document.createElement("span");
            unknowName.innerHTML = "unknown";
            pre.appendChild(unknowName);
        }
        this.shadowRoot?.appendChild(pre);
    }
    renderTupple(tupple) {
        const pre = document.createElement("div");
        const open = document.createElement("span");
        open.innerHTML = "[";
        pre.appendChild(open);
        for (let i = 0; i < tupple.tupples.length; i++) {
            const typeRender = new TypeRender();
            typeRender.type = tupple.tupples[i];
            pre.appendChild(typeRender);
            if (i + 1 < tupple.tupples.length) {
                const comma = document.createElement("span");
                comma.innerHTML = ',&nbsp;';
                pre.appendChild(comma);
            }
        }
        const close = document.createElement("span");
        close.innerHTML = "]";
        pre.appendChild(close);
        this.shadowRoot?.appendChild(pre);
    }
    renderObject(obj) {
        const pre = this.margin_left == 0 ? document.createElement("div") : this.shadowRoot;
        if (this.margin_left) {
            this.style.marginLeft = this.margin_left + 'px';
        }
        if (obj.array) {
            const typeRender = new TypeRender();
            typeRender.type = obj.array;
            pre.appendChild(typeRender);
            const array = document.createElement("span");
            array.innerHTML = "[]";
            pre.appendChild(array);
        }
        else {
            const open = document.createElement("span");
            open.innerHTML = "{";
            pre.appendChild(open);
            if (obj.indexSignatures) {
                for (let indexSignature of obj.indexSignatures) {
                    const div = document.createElement("div");
                    div.style.marginLeft = this.margin_left + 10 + 'px';
                    pre.appendChild(div);
                    const openKey = document.createElement("span");
                    openKey.innerHTML = `[${indexSignature.keyName}: `;
                    div.appendChild(openKey);
                    const typeKeyRender = new TypeRender();
                    typeKeyRender.type = indexSignature.keyType;
                    div.appendChild(typeKeyRender);
                    const closeKey = document.createElement("span");
                    closeKey.innerHTML = `]: `;
                    div.appendChild(closeKey);
                    const typeRender = new TypeRender();
                    typeRender.type = indexSignature.type;
                    typeRender.margin_left = this.margin_left + 10;
                    div.appendChild(typeRender);
                }
            }
            if (obj.keys) {
                for (let key in obj.keys) {
                    const div = document.createElement("div");
                    div.style.marginLeft = this.margin_left + 10 + 'px';
                    pre.appendChild(div);
                    const name = document.createElement("span");
                    name.innerHTML = key + ": ";
                    div.appendChild(name);
                    const typeRender = new TypeRender();
                    typeRender.type = obj.keys[key];
                    typeRender.margin_left = this.margin_left + 10;
                    div.appendChild(typeRender);
                    pre.appendChild(div);
                }
            }
            const close = document.createElement("span");
            close.innerHTML = "}";
            pre.appendChild(close);
        }
        this.shadowRoot?.appendChild(pre);
    }
    renderUnion(union) {
        for (let i = 0; i < union.types.length; i++) {
            const typeRender = new TypeRender();
            typeRender.type = union.types[i];
            this.shadowRoot?.appendChild(typeRender);
            if (i + 1 < union.types.length) {
                const pipe = document.createElement("span");
                pipe.innerHTML = '|';
                this.shadowRoot.appendChild(pipe);
            }
        }
    }
    renderIntersection(intersection) {
        for (let i = 0; i < intersection.types.length; i++) {
            const typeRender = new TypeRender();
            typeRender.type = intersection.types[i];
            this.shadowRoot?.appendChild(typeRender);
            if (i + 1 < intersection.types.length) {
                const pipe = document.createElement("span");
                pipe.innerHTML = '&';
                this.shadowRoot.appendChild(pipe);
            }
        }
    }
    renderTypeOperator(_typeof) {
        const nameEl = document.createElement("span");
        nameEl.innerHTML = _typeof.value + "&nbsp;";
        this.shadowRoot.appendChild(nameEl);
        const typeRender = new TypeRender();
        typeRender.type = _typeof.type;
        this.shadowRoot.appendChild(typeRender);
    }
    renderTypeConditional(conditional) {
        const check = new TypeRender();
        check.type = conditional.check;
        this.shadowRoot.appendChild(check);
        const nameEl = document.createElement("span");
        nameEl.innerHTML = "&nbsp;extends&nbsp;";
        this.shadowRoot.appendChild(nameEl);
        const _extends = new TypeRender();
        _extends.type = conditional.extends;
        this.shadowRoot.appendChild(_extends);
        const question = document.createElement("span");
        question.innerHTML = "&nbsp;?&nbsp;";
        this.shadowRoot.appendChild(question);
        const _true = new TypeRender();
        _true.type = conditional.true;
        this.shadowRoot.appendChild(_true);
        const or = document.createElement("span");
        or.innerHTML = "&nbsp;:&nbsp;";
        this.shadowRoot.appendChild(or);
        const _false = new TypeRender();
        _false.type = conditional.false;
        this.shadowRoot.appendChild(_false);
    }
    renderTypeIndexAccess(indexAccess) {
        const check = new TypeRender();
        check.type = indexAccess.obj;
        this.shadowRoot.appendChild(check);
        const open = document.createElement("span");
        open.innerHTML = "[";
        this.shadowRoot.appendChild(open);
        const key = new TypeRender();
        key.type = indexAccess.key;
        this.shadowRoot.appendChild(key);
        const close = document.createElement("span");
        close.innerHTML = "]";
        this.shadowRoot.appendChild(close);
    }
    renderTypeInfer(_infer) {
        const open = document.createElement("span");
        open.innerHTML = "infer&nbsp;" + _infer.name;
        this.shadowRoot.appendChild(open);
    }
    renderTypeMappedType(mappedType) {
        const open = document.createElement("span");
        open.innerHTML = `{ [ ${mappedType.parameterName} in&nbsp;`;
        this.shadowRoot.appendChild(open);
        const parameterType = new TypeRender();
        parameterType.type = mappedType.parameterType;
        this.shadowRoot.appendChild(parameterType);
        const info = document.createElement("span");
        const modifier = mappedType.modifier ?? '';
        info.innerHTML = `]${modifier}:&nbsp;`;
        this.shadowRoot.appendChild(info);
        const type = new TypeRender();
        type.type = mappedType.type;
        this.shadowRoot.appendChild(type);
        const close = document.createElement("span");
        close.innerHTML = `&nbsp;}`;
        this.shadowRoot.appendChild(close);
    }
    render() {
        if (!this.type) {
            this.remove();
            return;
        }
        if (this.type.kind == 'simple') {
            this.renderSimple(this.type);
        }
        else if (this.type.kind == 'function') {
            this.renderFunction(this.type);
        }
        else if (this.type.kind == 'tupple') {
            this.renderTupple(this.type);
        }
        else if (this.type.kind == 'object') {
            this.renderObject(this.type);
        }
        else if (this.type.kind == 'union') {
            this.renderUnion(this.type);
        }
        else if (this.type.kind == 'intersection') {
            this.renderIntersection(this.type);
        }
        else if (this.type.kind == 'typeOperator') {
            this.renderTypeOperator(this.type);
        }
        else if (this.type.kind == 'conditional') {
            this.renderTypeConditional(this.type);
        }
        else if (this.type.kind == 'indexAccess') {
            this.renderTypeIndexAccess(this.type);
        }
        else if (this.type.kind == 'infer') {
            this.renderTypeInfer(this.type);
        }
        else if (this.type.kind == 'mappedType') {
            this.renderTypeMappedType(this.type);
        }
    }
    postCreation() {
        this.render();
    }
}
TypeRender.Namespace=`AventusStorybook`;
TypeRender.Tag=`av-type-render`;
_.TypeRender=TypeRender;
if(!window.customElements.get('av-type-render')){window.customElements.define('av-type-render', TypeRender);Aventus.WebComponentInstance.registerDefinition(TypeRender);}

const Tag = class Tag extends Aventus.WebComponent {
    get 'type'() { return this.getStringAttr('type') }
    set 'type'(val) { this.setStringAttr('type', val) }    static __style = `:host{align-items:center;border:1px solid var(--_local-color);border-radius:50px;color:var(--_local-color);display:flex;flex-grow:0;font-size:12px;font-weight:normal;height:24px;justify-content:center;padding:3px 9px}:host([type=public]){--_local-color: #61AFEF}:host([type=private]){--_local-color: #E06C75}:host([type=protected]){--_local-color: #E5C07B}:host([type=abstract]){--_local-color: #C678DD}:host([type=internal]){--_local-color: #5d5c5d}:host([type=override]){--_local-color: #ea3939}:host([type=class]){--_local-color: #D19A66}:host([type=interface]){--_local-color: #61AFEF}:host([type=type]){--_local-color: #C678DD}:host([type=function]){--_local-color: #98C379}:host([type=var]),:host([type=let]),:host([type=const]){--_local-color: #E5C07B}:host([type=enum]){--_local-color: #E06C75}:host([type=readonly]){--_local-color: #ea3939}:host([type=writeonly]){--_local-color: #ea3939}:host([type=static]){--_local-color: #efd761}`;
    __getStatic() {
        return Tag;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Tag.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Tag";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('type')){ this['type'] = undefined; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('type'); }
}
Tag.Namespace=`AventusStorybook`;
Tag.Tag=`av-tag`;
_.Tag=Tag;
if(!window.customElements.get('av-tag')){window.customElements.define('av-tag', Tag);Aventus.WebComponentInstance.registerDefinition(Tag);}

const StoryBaseRender = class StoryBaseRender extends Aventus.WebComponent {
    static get observedAttributes() {return ["json"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'json'() { return this.getStringProp('json') }
    set 'json'(val) { this.setStringAttr('json', val) }    get 'config'() {
						return this.__watch["config"];
					}
					set 'config'(val) {
						this.__watch["config"] = val;
					}get 'tags'() {
						return this.__watch["tags"];
					}
					set 'tags'(val) {
						this.__watch["tags"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("config");this.__addWatchesActions("tags");    super.__registerWatchesActions();
}
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("json", ((target) => {
    target.config = JSON.parse(target.json);
    target.onConfigSet(target.config);
})); }
    static __style = `:host{color:#2e3438;display:block;font-family:"Nunito Sans",-apple-system,".SFNSText-Regular","San Francisco",BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;margin:0;margin-block-end:.67em;margin-block-start:.67em;margin-inline-end:0px;margin-inline-start:0px;-webkit-overflow-scrolling:touch;-webkit-tap-highlight-color:rgba(0,0,0,0)}:host .namespace{color:rgba(46,52,56,.6);font-size:12px;margin-bottom:5px;margin-left:5px}:host .base{align-items:center;display:flex;flex-wrap:wrap;font-size:28px;font-weight:700;line-height:32px;margin-bottom:5px}:host .base .tags{display:flex;gap:5px;width:100%}:host .base .tags av-tag{margin-bottom:10px;margin-top:10px}:host .documentation{margin-top:10px}:host .parent{font-size:14px;margin-top:3px}:host .where{font-size:14px;margin-top:3px}@media(min-width: 600px){:host{margin-bottom:16px}:host .base{font-size:32px;line-height:36px}}:host([type=type]) .parent{margin-top:15px}:host([type=type]) .parent span{display:none}:host([type=type]) .parent av-type-render{--type-render-font-size: 16px}`;
    constructor() { super(); if (this.constructor == StoryBaseRender) { throw "can't instanciate an abstract class"; } }
    __getStatic() {
        return StoryBaseRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(StoryBaseRender.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'header':`<slot name="header"></slot>`,'before-documentation':`<slot name="before-documentation"></slot>`,'default':`<slot></slot>` }, 
        blocks: { 'default':`<div class="namespace" _id="storybaserender_0"></div><div class="base">    <div class="tags">        <template _id="storybaserender_1"></template>    </div>    <div class="title" _id="storybaserender_3"></div>    <slot name="header"></slot></div><slot name="before-documentation"></slot><div class="documentation" _id="storybaserender_4"></div><slot></slot>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "storybaserender_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__4efa173741a0da43dc86484322616c77method1())}`
    },
    "storybaserender_3°@HTML": {
      "fct": (c) => `${c.print(c.comp.__4efa173741a0da43dc86484322616c77method4())}`,
      "once": true
    },
    "storybaserender_4°@HTML": {
      "fct": (c) => `${c.print(c.comp.__4efa173741a0da43dc86484322616c77method5())}`
    }
  }
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`            <av-tag _id="storybaserender_2"></av-tag>        `);templ0.setActions({
  "content": {
    "storybaserender_2°@HTML": {
      "fct": (c) => `${c.print(c.comp.__4efa173741a0da43dc86484322616c77method3(c.data.tag))}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "storybaserender_2",
      "injectionName": "type",
      "inject": (c) => c.comp.__4efa173741a0da43dc86484322616c77method2(c.data.tag),
      "once": true
    }
  ]
});this.__getStatic().__template.addLoop({
                    anchorId: 'storybaserender_1',
                    template: templ0,
                simple:{data: "this.tags",item:"tag"}}); }
    getClassName() {
        return "StoryBaseRender";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('json')){ this['json'] = '{}'; } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["config"] = undefined;w["tags"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('json');this.__correctGetter('config');this.__correctGetter('tags'); }
    renderName() {
        if (this.config?.name) {
            const splitted = this.config.name.split("/");
            return splitted[splitted.length - 1];
        }
        return "";
    }
    onConfigSet(config) {
        this.tags = [];
        this.tags.push(config.kind);
        if (config.accessibility)
            this.tags.push(config.accessibility);
        this.defineTags(config);
    }
    renderGeneric() {
        let config = this.config;
        if (!config?.generics)
            return '';
        const letters = [];
        for (let g of config.generics) {
            if (g) {
                letters.push(g.name);
            }
        }
        return "&lt;" + letters.join(", ") + "&gt;";
    }
    render(txt) {
        return txt?.replace(/\n/g, "<br />") ?? '';
    }
    __4efa173741a0da43dc86484322616c77method1() {
        return this.config?.namespace;
    }
    __4efa173741a0da43dc86484322616c77method3(tag) {
        return tag;
    }
    __4efa173741a0da43dc86484322616c77method4() {
        return this.renderName();
    }
    __4efa173741a0da43dc86484322616c77method5() {
        return this.render(this.config?.documentation);
    }
    __4efa173741a0da43dc86484322616c77method2(tag) {
        return tag;
    }
}
StoryBaseRender.Namespace=`AventusStorybook`;
_.StoryBaseRender=StoryBaseRender;

const StoryVariableRender = class StoryVariableRender extends StoryBaseRender {
    static __style = `:host .type-info .valeur{color:#2e3438;cursor:text;font-family:"Nunito Sans",-apple-system,".SFNSText-Regular","San Francisco",BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif;font-size:20px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-weight:700;margin:30px 0px;margin-bottom:10px;-webkit-overflow-scrolling:touch;padding:0;padding-top:0;position:relative;-webkit-tap-highlight-color:rgba(0,0,0,0)}:host .type-info av-type-render{--type-render-font-size: 16px}`;
    __getStatic() {
        return StoryVariableRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(StoryVariableRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="type-info">    <div class="valeur">Valeur</div>    <av-type-render _id="storyvariablerender_0"></av-type-render></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "injection": [
    {
      "id": "storyvariablerender_0",
      "injectionName": "type",
      "inject": (c) => c.comp.__49936348472a73491b317b83762f7e00method0()
    }
  ]
}); }
    getClassName() {
        return "StoryVariableRender";
    }
    defineTags(config) {
        this.tags.push(config.modifier);
    }
    onConfigSet(config) {
        this.tags = [];
        if (config.accessibility)
            this.tags.push(config.accessibility);
        this.defineTags(config);
    }
    __49936348472a73491b317b83762f7e00method0() {
        return this.config?.type;
    }
}
StoryVariableRender.Namespace=`AventusStorybook`;
StoryVariableRender.Tag=`av-story-variable-render`;
_.StoryVariableRender=StoryVariableRender;
if(!window.customElements.get('av-story-variable-render')){window.customElements.define('av-story-variable-render', StoryVariableRender);Aventus.WebComponentInstance.registerDefinition(StoryVariableRender);}

const StoryTypeRender = class StoryTypeRender extends StoryBaseRender {
    static __style = `:host .type-info .valeur{color:#2e3438;cursor:text;font-family:"Nunito Sans",-apple-system,".SFNSText-Regular","San Francisco",BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif;font-size:20px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-weight:700;margin:30px 0px;margin-bottom:10px;-webkit-overflow-scrolling:touch;padding:0;padding-top:0;position:relative;-webkit-tap-highlight-color:rgba(0,0,0,0)}:host .type-info av-type-render{--type-render-font-size: 16px}`;
    __getStatic() {
        return StoryTypeRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(StoryTypeRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'header':`    <template _id="storytyperender_0"></template>`,'before-documentation':`    <template _id="storytyperender_2"></template>`,'default':`<div class="type-info">    <div class="valeur">Valeur</div>    <av-type-render _id="storytyperender_12"></av-type-render></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "injection": [
    {
      "id": "storytyperender_12",
      "injectionName": "type",
      "inject": (c) => c.comp.__5288dad26d5f11cae488171a75a9a426method12()
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`        <div class="generic" _id="storytyperender_1"></div>    `);templ0.setActions({
  "content": {
    "storytyperender_1°@HTML": {
      "fct": (c) => `\r\n            ${c.print(c.comp.__5288dad26d5f11cae488171a75a9a426method7())}\r\n        `,
      "once": true
    }
  }
});this.__getStatic().__template.addIf({
                    anchorId: 'storytyperender_0',
                    parts: [{
                    condition: (c) => c.comp.__5288dad26d5f11cae488171a75a9a426method0(),
                    template: templ0
                }]
            });const templ1 = new Aventus.Template(this);templ1.setTemplate(`        <template _id="storytyperender_3"></template>    `);const templ2 = new Aventus.Template(this);templ2.setTemplate(`             <template _id="storytyperender_4"></template>        `);templ1.addLoop({
                    anchorId: 'storytyperender_3',
                    template: templ2,
                simple:{data: "this.config.generics",item:"info"}});const templ3 = new Aventus.Template(this);templ3.setTemplate(`                <div class="where">                    <span _id="storytyperender_5"></span>                    <template _id="storytyperender_6"></template>                    <template _id="storytyperender_8"></template>                    <template _id="storytyperender_10"></template>                </div>            `);templ3.setActions({
  "content": {
    "storytyperender_5°@HTML": {
      "fct": (c) => `Where ${c.print(c.comp.__5288dad26d5f11cae488171a75a9a426method8(c.data.info))}`,
      "once": true
    }
  }
});const templ4 = new Aventus.Template(this);templ4.setTemplate(`                        <span> extends </span>                        <av-type-render _id="storytyperender_7"></av-type-render>                    `);templ4.setActions({
  "injection": [
    {
      "id": "storytyperender_7",
      "injectionName": "type",
      "inject": (c) => c.comp.__5288dad26d5f11cae488171a75a9a426method9(c.data.info),
      "once": true
    }
  ]
});templ3.addIf({
                    anchorId: 'storytyperender_6',
                    parts: [{once: true,
                    condition: (c) => c.comp.__5288dad26d5f11cae488171a75a9a426method4(c.data.info),
                    template: templ4
                }]
            });const templ5 = new Aventus.Template(this);templ5.setTemplate(`                        <span> = </span>                        <av-type-render _id="storytyperender_9"></av-type-render>                    `);templ5.setActions({
  "injection": [
    {
      "id": "storytyperender_9",
      "injectionName": "type",
      "inject": (c) => c.comp.__5288dad26d5f11cae488171a75a9a426method10(c.data.info),
      "once": true
    }
  ]
});templ3.addIf({
                    anchorId: 'storytyperender_8',
                    parts: [{once: true,
                    condition: (c) => c.comp.__5288dad26d5f11cae488171a75a9a426method5(c.data.info),
                    template: templ5
                }]
            });const templ6 = new Aventus.Template(this);templ6.setTemplate(`                        <span _id="storytyperender_11"></span>                    `);templ6.setActions({
  "content": {
    "storytyperender_11°@HTML": {
      "fct": (c) => ` - ${c.print(c.comp.__5288dad26d5f11cae488171a75a9a426method11(c.data.info))}`,
      "once": true
    }
  }
});templ3.addIf({
                    anchorId: 'storytyperender_10',
                    parts: [{once: true,
                    condition: (c) => c.comp.__5288dad26d5f11cae488171a75a9a426method6(c.data.info),
                    template: templ6
                }]
            });templ2.addIf({
                    anchorId: 'storytyperender_4',
                    parts: [{once: true,
                    condition: (c) => c.comp.__5288dad26d5f11cae488171a75a9a426method3(c.data.info),
                    template: templ3
                }]
            });this.__getStatic().__template.addIf({
                    anchorId: 'storytyperender_2',
                    parts: [{once: true,
                    condition: (c) => c.comp.__5288dad26d5f11cae488171a75a9a426method1(),
                    template: templ1
                }]
            }); }
    getClassName() {
        return "StoryTypeRender";
    }
    defineTags(config) {
    }
    __5288dad26d5f11cae488171a75a9a426method7() {
        return this.renderGeneric();
    }
    __5288dad26d5f11cae488171a75a9a426method8(info) {
        return info.name;
    }
    __5288dad26d5f11cae488171a75a9a426method11(info) {
        return info.documentation;
    }
    __5288dad26d5f11cae488171a75a9a426method0() {
        return this.config?.generics && this.config.generics.length > 0;
    }
    __5288dad26d5f11cae488171a75a9a426method1() {
        return this.config.generics;
    }
    __5288dad26d5f11cae488171a75a9a426method3(info) {
        return info.constraint || info.default || info.documentation;
    }
    __5288dad26d5f11cae488171a75a9a426method4(info) {
        return info.constraint;
    }
    __5288dad26d5f11cae488171a75a9a426method5(info) {
        return info.default;
    }
    __5288dad26d5f11cae488171a75a9a426method6(info) {
        return info.documentation;
    }
    __5288dad26d5f11cae488171a75a9a426method9(info) {
        return info.constraint;
    }
    __5288dad26d5f11cae488171a75a9a426method10(info) {
        return info.default;
    }
    __5288dad26d5f11cae488171a75a9a426method12() {
        return this.config?.type;
    }
}
StoryTypeRender.Namespace=`AventusStorybook`;
StoryTypeRender.Tag=`av-story-type-render`;
_.StoryTypeRender=StoryTypeRender;
if(!window.customElements.get('av-story-type-render')){window.customElements.define('av-story-type-render', StoryTypeRender);Aventus.WebComponentInstance.registerDefinition(StoryTypeRender);}

const BaseRender = class BaseRender extends Aventus.WebComponent {
    static __style = `:host{color:#2e3438;display:flex;flex-direction:column;font-family:"Nunito Sans",-apple-system,".SFNSText-Regular","San Francisco",BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif;font-size:13px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;line-height:20px;margin:0;margin-bottom:40px;margin-left:1px;margin-right:1px;margin-top:25px;-webkit-overflow-scrolling:touch;-webkit-tap-highlight-color:rgba(0,0,0,0);width:100%}:host .title{color:#2e3438;cursor:text;font-family:"Nunito Sans",-apple-system,".SFNSText-Regular","San Francisco",BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif;font-size:20px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-weight:700;margin:20px 0 8px;margin-block-end:1em;margin-block-start:1em;margin-inline-end:0px;margin-inline-start:0px;margin-top:0;-webkit-overflow-scrolling:touch;padding:0;padding-top:0;position:relative;-webkit-tap-highlight-color:rgba(0,0,0,0)}:host .header{display:flex;padding:0 20px;width:100%}:host .header>div{align-items:center;color:rgba(46,52,56,.75);display:flex;font-weight:bold;padding-bottom:10px;padding-top:10px}:host .header>div:not(:first-child):not(:last-child){padding-left:10px;padding-right:10px}:host .body{border:1px solid rgba(38,85,115,.15);border-radius:4px;filter:drop-shadow(0px 1px 3px rgba(0, 0, 0, 0.1));overflow:hidden}:host .body .line{background-color:#fff;border-top:1px solid rgba(38,85,115,.15);display:flex;padding:0 20px;width:100%}:host .body .line>div{align-items:center;display:flex;padding-bottom:10px;padding-top:10px;flex-wrap:wrap}:host .body .line>div:not(:first-child):not(:last-child){padding-left:10px;padding-right:10px}:host .row{align-items:center;display:flex;flex-direction:row;width:100%}`;
    constructor() { super(); if (this.constructor == BaseRender) { throw "can't instanciate an abstract class"; } }
    __getStatic() {
        return BaseRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(BaseRender.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "BaseRender";
    }
}
BaseRender.Namespace=`AventusStorybook`;
_.BaseRender=BaseRender;

const Diagram = class Diagram extends Aventus.WebComponent {
    static __style = `:host .hidden{display:none}`;
    __getStatic() {
        return Diagram;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Diagram.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<div class="element" _id="diagram_0"></div><div class="hidden">    <slot></slot></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "renderEl",
      "ids": [
        "diagram_0"
      ]
    }
  ]
}); }
    getClassName() {
        return "Diagram";
    }
    async render() {
        await Aventus.ResourceLoader.loadInHead("https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js");
        let w = window;
        w.mermaid.initialize({ startOnLoad: false });
        let content = this.innerHTML.replace(/<[^>]*>/g, '').trim();
        var e = document.createElement('div');
        e.innerHTML = content;
        content = e.childNodes[0].nodeValue;
        const { svg } = await w.mermaid.render('graphDiv', content);
        this.renderEl.innerHTML = svg;
    }
    postCreation() {
        this.render();
    }
}
Diagram.Namespace=`AventusStorybook`;
Diagram.Tag=`av-diagram`;
_.Diagram=Diagram;
if(!window.customElements.get('av-diagram')){window.customElements.define('av-diagram', Diagram);Aventus.WebComponentInstance.registerDefinition(Diagram);}

const Collapse = class Collapse extends Aventus.WebComponent {
    static get observedAttributes() {return ["name"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'open'() { return this.getBoolAttr('open') }
    set 'open'(val) { this.setBoolAttr('open', val) }get 'no_animation'() { return this.getBoolAttr('no_animation') }
    set 'no_animation'(val) { this.setBoolAttr('no_animation', val) }    get 'name'() { return this.getStringProp('name') }
    set 'name'(val) { this.setStringAttr('name', val) }    change = new Aventus.Callback();
    static __style = `:host{display:block;width:100%}:host .title{align-items:center;background:#f6f9fc !important;border:none;color:rgba(46,52,56,.6);cursor:pointer;display:flex;font-size:11px;font-weight:700;letter-spacing:.35em;padding:0;padding-bottom:10px;padding-left:20px;padding-top:10px;position:relative;-webkit-tap-highlight-color:rgba(0,0,0,0);text-overflow:ellipsis;text-transform:uppercase;vertical-align:top}:host .title svg{color:rgba(46,52,56,.75);display:inline-block;height:12px;margin-left:-10px;margin-right:8px;margin-top:-2px;width:12px;transform:rotate(-90deg)}:host .collapse{display:grid;grid-template-rows:0fr;transition:.5s ease-in-out grid-template-rows}:host .collapse .content{overflow:hidden}:host([open]) .title svg{transform:rotate(0deg)}:host([open]) .collapse{grid-template-rows:1fr}:host([no_animation]) .collapse{transition:none}`;
    __getStatic() {
        return Collapse;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Collapse.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<div class="title" _id="collapse_0">    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">        <path d="M1.146 4.604l5.5 5.5a.5.5 0 00.708 0l5.5-5.5a.5.5 0 00-.708-.708L7 9.043 1.854 3.896a.5.5 0 10-.708.708z" fill="currentColor"></path>    </svg>    <span _id="collapse_1"></span></div><div class="collapse" _id="collapse_2">    <div class="content">        <slot></slot>    </div></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "collapse_1°@HTML": {
      "fct": (c) => `${c.print(c.comp.__9c0a21a5cea7b65e5d99cf5db2f50ce3method0())}`,
      "once": true
    }
  },
  "events": [
    {
      "eventName": "transitionend",
      "id": "collapse_2",
      "fct": (e, c) => c.comp.transitionEnd(e)
    }
  ],
  "pressEvents": [
    {
      "id": "collapse_0",
      "onPress": (e, pressInstance, c) => { c.comp.toggleOpen(e, pressInstance); }
    }
  ]
}); }
    getClassName() {
        return "Collapse";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('open')) { this.attributeChangedCallback('open', false, false); }if(!this.hasAttribute('no_animation')) { this.attributeChangedCallback('no_animation', false, false); }if(!this.hasAttribute('name')){ this['name'] = undefined; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('open');this.__upgradeProperty('no_animation');this.__upgradeProperty('name'); }
    __listBoolProps() { return ["open","no_animation"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    transitionEnd(e) {
        let cst = e.constructor;
        const new_e = new cst(e.type, e);
        this.dispatchEvent(new_e);
    }
    toggleOpen() {
        this.open = !this.open;
        this.change.trigger([this.open]);
    }
    __9c0a21a5cea7b65e5d99cf5db2f50ce3method0() {
        return this.name;
    }
}
Collapse.Namespace=`AventusStorybook`;
Collapse.Tag=`av-collapse`;
_.Collapse=Collapse;
if(!window.customElements.get('av-collapse')){window.customElements.define('av-collapse', Collapse);Aventus.WebComponentInstance.registerDefinition(Collapse);}

const StylesRender = class StylesRender extends BaseRender {
    get 'styles'() {
						return this.__watch["styles"];
					}
					set 'styles'(val) {
						this.__watch["styles"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("styles", ((target) => {
}));    super.__registerWatchesActions();
}
    static __style = `:host .body .line .name{display:flex;flex-direction:column;flex-wrap:wrap}:host .body .line .name .single-name{font-weight:bold;margin-right:10px}:host .body .line .name .description{margin-top:3px;width:100%}:host .name{width:50%}:host .type{width:20%}:host .value{width:30%}`;
    __getStatic() {
        return StylesRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(StylesRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="title">Style</div><div class="header">    <div class="name">Name</div>    <div class="type">Type</div>    <div class="value">Value</div></div><div class="body">    <av-collapse name="Style" open>        <template _id="stylesrender_0"></template>    </av-collapse></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`             <div class="line">                <div class="name">                    <div class="row">                        <div class="single-name" _id="stylesrender_1"></div>                    </div>                    <div class="row description" _id="stylesrender_2"></div>                </div>                <div class="type" _id="stylesrender_3"></div>                <div class="value" _id="stylesrender_4"></div>            </div>        `);templ0.setActions({
  "content": {
    "stylesrender_1°@HTML": {
      "fct": (c) => `${c.print(c.comp.__399084ee0bce490fcebb44e99fc621c2method1(c.data.style))}`,
      "once": true
    },
    "stylesrender_2°@HTML": {
      "fct": (c) => `${c.print(c.comp.__399084ee0bce490fcebb44e99fc621c2method2(c.data.style))}`,
      "once": true
    },
    "stylesrender_3°@HTML": {
      "fct": (c) => `\r\n                    ${c.print(c.comp.__399084ee0bce490fcebb44e99fc621c2method3(c.data.style))}\r\n                `,
      "once": true
    },
    "stylesrender_4°@HTML": {
      "fct": (c) => `\r\n                    ${c.print(c.comp.__399084ee0bce490fcebb44e99fc621c2method4(c.data.style))}\r\n                `,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'stylesrender_0',
                    template: templ0,
                simple:{data: "this.styles",item:"style"}}); }
    getClassName() {
        return "StylesRender";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["styles"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('styles'); }
    __399084ee0bce490fcebb44e99fc621c2method1(style) {
        return style.name;
    }
    __399084ee0bce490fcebb44e99fc621c2method2(style) {
        return style.documentation;
    }
    __399084ee0bce490fcebb44e99fc621c2method3(style) {
        return style.type;
    }
    __399084ee0bce490fcebb44e99fc621c2method4(style) {
        return style.value;
    }
}
StylesRender.Namespace=`AventusStorybook`;
StylesRender.Tag=`av-styles-render`;
_.StylesRender=StylesRender;
if(!window.customElements.get('av-styles-render')){window.customElements.define('av-styles-render', StylesRender);Aventus.WebComponentInstance.registerDefinition(StylesRender);}

const SlotsRender = class SlotsRender extends BaseRender {
    get 'slots'() {
						return this.__watch["slots"];
					}
					set 'slots'(val) {
						this.__watch["slots"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("slots", ((target) => {
}));    super.__registerWatchesActions();
}
    static __style = `:host .name{width:40%}:host .description{width:60%}`;
    __getStatic() {
        return SlotsRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(SlotsRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="title">Slots</div><div class="header">    <div class="name">Name</div>    <div class="description">Description</div></div><div class="body">    <av-collapse name="Slot" open>        <template _id="slotsrender_0"></template>    </av-collapse></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`             <div class="line">                <div class="name" _id="slotsrender_1"></div>                <div class="description" _id="slotsrender_2"></div>            </div>        `);templ0.setActions({
  "content": {
    "slotsrender_1°@HTML": {
      "fct": (c) => `\r\n                    ${c.print(c.comp.__855691f31bd45ac4fe848252eee4bef5method1(c.data.slotInfo))}\r\n                `,
      "once": true
    },
    "slotsrender_2°@HTML": {
      "fct": (c) => `\r\n                    ${c.print(c.comp.__855691f31bd45ac4fe848252eee4bef5method2(c.data.slotInfo))}\r\n                `,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'slotsrender_0',
                    template: templ0,
                simple:{data: "this.slots",item:"slotInfo"}}); }
    getClassName() {
        return "SlotsRender";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["slots"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('slots'); }
    __855691f31bd45ac4fe848252eee4bef5method1(slotInfo) {
        return slotInfo.name;
    }
    __855691f31bd45ac4fe848252eee4bef5method2(slotInfo) {
        return slotInfo.documentation;
    }
}
SlotsRender.Namespace=`AventusStorybook`;
SlotsRender.Tag=`av-slots-render`;
_.SlotsRender=SlotsRender;
if(!window.customElements.get('av-slots-render')){window.customElements.define('av-slots-render', SlotsRender);Aventus.WebComponentInstance.registerDefinition(SlotsRender);}

const PropertiesRender = class PropertiesRender extends BaseRender {
    get 'properties'() {
						return this.__watch["properties"];
					}
					set 'properties'(val) {
						this.__watch["properties"] = val;
					}get 'propertiesGroups'() {
						return this.__watch["propertiesGroups"];
					}
					set 'propertiesGroups'(val) {
						this.__watch["propertiesGroups"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("properties", ((target) => {
    target.prepareProperties();
}));this.__addWatchesActions("propertiesGroups");    super.__registerWatchesActions();
}
    static __style = `:host .body .line .name{display:flex;flex-direction:column;gap:5px}:host .body .line .name .single-name{font-weight:bold;margin-right:10px}:host .body .line .name .tags{display:flex;gap:3px}:host .body .line .name .tags av-tag{font-size:10px;padding:0px 7px}:host .name{width:70%}:host .type{width:30%}`;
    __getStatic() {
        return PropertiesRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(PropertiesRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="title">Properties</div><div class="header">    <div class="name">Property</div>    <div class="type">Value</div></div><div class="body">    <template _id="propertiesrender_0"></template></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`         <av-collapse open _id="propertiesrender_1">            <template _id="propertiesrender_2"></template>        </av-collapse>    `);templ0.setActions({
  "injection": [
    {
      "id": "propertiesrender_1",
      "injectionName": "name",
      "inject": (c) => c.comp.__e0002c112c9d916ca66b8097c8013b2fmethod4(c.data.name),
      "once": true
    }
  ]
});this.__getStatic().__template.addLoop({
                    anchorId: 'propertiesrender_0',
                    template: templ0,
                simple:{data: "this.propertiesGroups",index:"name"}});const templ1 = new Aventus.Template(this);templ1.setTemplate(`                 <div class="line">                    <div class="name">                        <div class="row">                            <div class="single-name" _id="propertiesrender_3"></div>                            <div class="tags">                                <av-tag _id="propertiesrender_4"></av-tag>                                <template _id="propertiesrender_5"></template>                            </div>                        </div>                        <div class="row description" _id="propertiesrender_8"></div>                    </div>                    <div class="type">                        <av-type-render _id="propertiesrender_9"></av-type-render>                    </div>                </div>            `);templ1.setActions({
  "content": {
    "propertiesrender_3°@HTML": {
      "fct": (c) => `${c.print(c.comp.__e0002c112c9d916ca66b8097c8013b2fmethod5(c.data.property))}`,
      "once": true
    },
    "propertiesrender_4°@HTML": {
      "fct": (c) => `${c.print(c.comp.__e0002c112c9d916ca66b8097c8013b2fmethod7(c.data.property))}`,
      "once": true
    },
    "propertiesrender_8°@HTML": {
      "fct": (c) => `${c.print(c.comp.__e0002c112c9d916ca66b8097c8013b2fmethod10(c.data.property))}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "propertiesrender_4",
      "injectionName": "type",
      "inject": (c) => c.comp.__e0002c112c9d916ca66b8097c8013b2fmethod6(c.data.property),
      "once": true
    },
    {
      "id": "propertiesrender_9",
      "injectionName": "type",
      "inject": (c) => c.comp.__e0002c112c9d916ca66b8097c8013b2fmethod11(c.data.property),
      "once": true
    }
  ]
});templ0.addLoop({
                    anchorId: 'propertiesrender_2',
                    template: templ1,
                simple:{data: "this.propertiesGroups[name]",item:"property"}});const templ2 = new Aventus.Template(this);templ2.setTemplate(`                                     <template _id="propertiesrender_6"></template>                                `);templ1.addLoop({
                    anchorId: 'propertiesrender_5',
                    template: templ2,
                simple:{data: "property.modifiers",item:"tag"}});const templ3 = new Aventus.Template(this);templ3.setTemplate(`                                        <av-tag _id="propertiesrender_7"></av-tag>                                    `);templ3.setActions({
  "content": {
    "propertiesrender_7°@HTML": {
      "fct": (c) => `${c.print(c.comp.__e0002c112c9d916ca66b8097c8013b2fmethod9(c.data.tag))}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "propertiesrender_7",
      "injectionName": "type",
      "inject": (c) => c.comp.__e0002c112c9d916ca66b8097c8013b2fmethod8(c.data.tag),
      "once": true
    }
  ]
});templ2.addIf({
                    anchorId: 'propertiesrender_6',
                    parts: [{once: true,
                    condition: (c) => c.comp.__e0002c112c9d916ca66b8097c8013b2fmethod3(c.data.tag),
                    template: templ3
                }]
            }); }
    getClassName() {
        return "PropertiesRender";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["properties"] = [];w["propertiesGroups"] = {}; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('properties');this.__correctGetter('propertiesGroups'); }
    prepareProperties() {
        let propertiesGroups = {
            'static': [],
            'instance': [],
        };
        for (let method of this.properties) {
            let key = method.modifiers?.includes("static") ? 'static' : 'instance';
            propertiesGroups[key].push(method);
        }
        for (let key in propertiesGroups) {
            if (propertiesGroups[key].length == 0) {
                delete propertiesGroups[key];
            }
            else {
                propertiesGroups[key].sort((a, b) => a.name.localeCompare(b.name));
            }
        }
        this.propertiesGroups = propertiesGroups;
    }
    __e0002c112c9d916ca66b8097c8013b2fmethod5(property) {
        return property.name;
    }
    __e0002c112c9d916ca66b8097c8013b2fmethod7(property) {
        return property.accessibility;
    }
    __e0002c112c9d916ca66b8097c8013b2fmethod9(tag) {
        return tag;
    }
    __e0002c112c9d916ca66b8097c8013b2fmethod10(property) {
        return property.documentation;
    }
    __e0002c112c9d916ca66b8097c8013b2fmethod3(tag) {
        return tag != 'static';
    }
    __e0002c112c9d916ca66b8097c8013b2fmethod4(name) {
        return name;
    }
    __e0002c112c9d916ca66b8097c8013b2fmethod6(property) {
        return property.accessibility;
    }
    __e0002c112c9d916ca66b8097c8013b2fmethod8(tag) {
        return tag;
    }
    __e0002c112c9d916ca66b8097c8013b2fmethod11(property) {
        return property.type;
    }
}
PropertiesRender.Namespace=`AventusStorybook`;
PropertiesRender.Tag=`av-properties-render`;
_.PropertiesRender=PropertiesRender;
if(!window.customElements.get('av-properties-render')){window.customElements.define('av-properties-render', PropertiesRender);Aventus.WebComponentInstance.registerDefinition(PropertiesRender);}

const ParametersRender = class ParametersRender extends BaseRender {
    get 'parameters'() {
						return this.__watch["parameters"];
					}
					set 'parameters'(val) {
						this.__watch["parameters"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("parameters", ((target) => {
}));    super.__registerWatchesActions();
}
    static __style = `:host .body .line .name{display:flex;flex-direction:column;gap:5px}:host .body .line .name .single-name{font-weight:bold;margin-right:10px}:host .name{width:60%}:host .type{width:40%}`;
    __getStatic() {
        return ParametersRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ParametersRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="title">Parameters</div><div class="header">    <div class="name">Name</div>    <div class="type">Type</div></div><div class="body">    <av-collapse name="Parameters" open>        <template _id="parametersrender_0"></template>    </av-collapse></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`            <div class="line">                <div class="name">                    <div class="row">                        <div class="single-name" _id="parametersrender_1"></div>                    </div>                    <div class="row description" _id="parametersrender_2"></div>                </div>                <div class="type">                    <av-type-render _id="parametersrender_3"></av-type-render>                </div>            </div>        `);templ0.setActions({
  "content": {
    "parametersrender_1°@HTML": {
      "fct": (c) => `${c.print(c.comp.__7c61a6e3a885ba1d31ad6da401c8134bmethod1(c.data.parameter))}`,
      "once": true
    },
    "parametersrender_2°@HTML": {
      "fct": (c) => `${c.print(c.comp.__7c61a6e3a885ba1d31ad6da401c8134bmethod2(c.data.parameter))}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "parametersrender_3",
      "injectionName": "type",
      "inject": (c) => c.comp.__7c61a6e3a885ba1d31ad6da401c8134bmethod3(c.data.parameter),
      "once": true
    }
  ]
});this.__getStatic().__template.addLoop({
                    anchorId: 'parametersrender_0',
                    template: templ0,
                simple:{data: "this.parameters",item:"parameter"}}); }
    getClassName() {
        return "ParametersRender";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["parameters"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('parameters'); }
    __7c61a6e3a885ba1d31ad6da401c8134bmethod1(parameter) {
        return parameter.name;
    }
    __7c61a6e3a885ba1d31ad6da401c8134bmethod2(parameter) {
        return parameter.documentation;
    }
    __7c61a6e3a885ba1d31ad6da401c8134bmethod3(parameter) {
        return parameter.type;
    }
}
ParametersRender.Namespace=`AventusStorybook`;
ParametersRender.Tag=`av-parameters-render`;
_.ParametersRender=ParametersRender;
if(!window.customElements.get('av-parameters-render')){window.customElements.define('av-parameters-render', ParametersRender);Aventus.WebComponentInstance.registerDefinition(ParametersRender);}

const StoryFunctionRender = class StoryFunctionRender extends StoryBaseRender {
    static __style = `:host .return-info .valeur{color:#2e3438;cursor:text;font-family:"Nunito Sans",-apple-system,".SFNSText-Regular","San Francisco",BlinkMacSystemFont,"Segoe UI","Helvetica Neue",Helvetica,Arial,sans-serif;font-size:20px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-weight:700;margin:30px 0px;margin-bottom:10px;-webkit-overflow-scrolling:touch;padding:0;padding-top:0;position:relative;-webkit-tap-highlight-color:rgba(0,0,0,0)}:host .return-info av-type-render{--type-render-font-size: 16px}:host .return-info .description{margin-top:10px}`;
    __getStatic() {
        return StoryFunctionRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(StoryFunctionRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'header':`    <template _id="storyfunctionrender_0"></template>`,'before-documentation':`    <template _id="storyfunctionrender_2"></template>`,'default':`<template _id="storyfunctionrender_12"></template><template _id="storyfunctionrender_14"></template>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`        <div class="generic" _id="storyfunctionrender_1"></div>    `);templ0.setActions({
  "content": {
    "storyfunctionrender_1°@HTML": {
      "fct": (c) => `\r\n            ${c.print(c.comp.__6170b3010e279f5c692156ff9bbcd910method9())}\r\n        `,
      "once": true
    }
  }
});this.__getStatic().__template.addIf({
                    anchorId: 'storyfunctionrender_0',
                    parts: [{
                    condition: (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method0(),
                    template: templ0
                }]
            });const templ1 = new Aventus.Template(this);templ1.setTemplate(`        <template _id="storyfunctionrender_3"></template>    `);const templ2 = new Aventus.Template(this);templ2.setTemplate(`             <template _id="storyfunctionrender_4"></template>        `);templ1.addLoop({
                    anchorId: 'storyfunctionrender_3',
                    template: templ2,
                simple:{data: "this.config.generics",item:"info"}});const templ3 = new Aventus.Template(this);templ3.setTemplate(`                <div class="where">                    <span _id="storyfunctionrender_5"></span>                    <template _id="storyfunctionrender_6"></template>                    <template _id="storyfunctionrender_8"></template>                    <template _id="storyfunctionrender_10"></template>                </div>            `);templ3.setActions({
  "content": {
    "storyfunctionrender_5°@HTML": {
      "fct": (c) => `Where ${c.print(c.comp.__6170b3010e279f5c692156ff9bbcd910method10(c.data.info))}`,
      "once": true
    }
  }
});const templ4 = new Aventus.Template(this);templ4.setTemplate(`                        <span> extends </span>                        <av-type-render _id="storyfunctionrender_7"></av-type-render>                    `);templ4.setActions({
  "injection": [
    {
      "id": "storyfunctionrender_7",
      "injectionName": "type",
      "inject": (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method11(c.data.info),
      "once": true
    }
  ]
});templ3.addIf({
                    anchorId: 'storyfunctionrender_6',
                    parts: [{once: true,
                    condition: (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method4(c.data.info),
                    template: templ4
                }]
            });const templ5 = new Aventus.Template(this);templ5.setTemplate(`                        <span> = </span>                        <av-type-render _id="storyfunctionrender_9"></av-type-render>                    `);templ5.setActions({
  "injection": [
    {
      "id": "storyfunctionrender_9",
      "injectionName": "type",
      "inject": (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method12(c.data.info),
      "once": true
    }
  ]
});templ3.addIf({
                    anchorId: 'storyfunctionrender_8',
                    parts: [{once: true,
                    condition: (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method5(c.data.info),
                    template: templ5
                }]
            });const templ6 = new Aventus.Template(this);templ6.setTemplate(`                        <span _id="storyfunctionrender_11"></span>                    `);templ6.setActions({
  "content": {
    "storyfunctionrender_11°@HTML": {
      "fct": (c) => ` - ${c.print(c.comp.__6170b3010e279f5c692156ff9bbcd910method13(c.data.info))}`,
      "once": true
    }
  }
});templ3.addIf({
                    anchorId: 'storyfunctionrender_10',
                    parts: [{once: true,
                    condition: (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method6(c.data.info),
                    template: templ6
                }]
            });templ2.addIf({
                    anchorId: 'storyfunctionrender_4',
                    parts: [{once: true,
                    condition: (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method3(c.data.info),
                    template: templ3
                }]
            });this.__getStatic().__template.addIf({
                    anchorId: 'storyfunctionrender_2',
                    parts: [{once: true,
                    condition: (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method1(),
                    template: templ1
                }]
            });const templ7 = new Aventus.Template(this);templ7.setTemplate(`    <av-parameters-render _id="storyfunctionrender_13"></av-parameters-render>`);templ7.setActions({
  "injection": [
    {
      "id": "storyfunctionrender_13",
      "injectionName": "parameters",
      "inject": (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method14(),
      "once": true
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'storyfunctionrender_12',
                    parts: [{once: true,
                    condition: (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method7(),
                    template: templ7
                }]
            });const templ8 = new Aventus.Template(this);templ8.setTemplate(`    <div class="return-info">        <div class="valeur">Return</div>        <av-type-render _id="storyfunctionrender_15"></av-type-render>        <div class="description" _id="storyfunctionrender_16"></div>    </div>`);templ8.setActions({
  "content": {
    "storyfunctionrender_16°@HTML": {
      "fct": (c) => `${c.print(c.comp.__6170b3010e279f5c692156ff9bbcd910method16())}`
    }
  },
  "injection": [
    {
      "id": "storyfunctionrender_15",
      "injectionName": "type",
      "inject": (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method15()
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'storyfunctionrender_14',
                    parts: [{
                    condition: (c) => c.comp.__6170b3010e279f5c692156ff9bbcd910method8(),
                    template: templ8
                }]
            }); }
    getClassName() {
        return "StoryFunctionRender";
    }
    defineTags(config) {
    }
    __6170b3010e279f5c692156ff9bbcd910method9() {
        return this.renderGeneric();
    }
    __6170b3010e279f5c692156ff9bbcd910method10(info) {
        return info.name;
    }
    __6170b3010e279f5c692156ff9bbcd910method13(info) {
        return info.documentation;
    }
    __6170b3010e279f5c692156ff9bbcd910method16() {
        return this.config?.return?.documentation;
    }
    __6170b3010e279f5c692156ff9bbcd910method0() {
        return this.config?.generics && this.config.generics.length > 0;
    }
    __6170b3010e279f5c692156ff9bbcd910method1() {
        return this.config.generics;
    }
    __6170b3010e279f5c692156ff9bbcd910method3(info) {
        return info.constraint || info.default || info.documentation;
    }
    __6170b3010e279f5c692156ff9bbcd910method4(info) {
        return info.constraint;
    }
    __6170b3010e279f5c692156ff9bbcd910method5(info) {
        return info.default;
    }
    __6170b3010e279f5c692156ff9bbcd910method6(info) {
        return info.documentation;
    }
    __6170b3010e279f5c692156ff9bbcd910method7() {
        return this.config.parameters;
    }
    __6170b3010e279f5c692156ff9bbcd910method8() {
        return this.config?.return;
    }
    __6170b3010e279f5c692156ff9bbcd910method11(info) {
        return info.constraint;
    }
    __6170b3010e279f5c692156ff9bbcd910method12(info) {
        return info.default;
    }
    __6170b3010e279f5c692156ff9bbcd910method14() {
        return this.config.parameters;
    }
    __6170b3010e279f5c692156ff9bbcd910method15() {
        return this.config?.return?.type;
    }
}
StoryFunctionRender.Namespace=`AventusStorybook`;
StoryFunctionRender.Tag=`av-story-function-render`;
_.StoryFunctionRender=StoryFunctionRender;
if(!window.customElements.get('av-story-function-render')){window.customElements.define('av-story-function-render', StoryFunctionRender);Aventus.WebComponentInstance.registerDefinition(StoryFunctionRender);}

const EnumValuesRender = class EnumValuesRender extends BaseRender {
    get 'values'() {
						return this.__watch["values"];
					}
					set 'values'(val) {
						this.__watch["values"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("values", ((target) => {
}));    super.__registerWatchesActions();
}
    static __style = `:host .body .line .name{display:flex;flex-direction:column;gap:5px}:host .body .line .name .single-name{font-weight:bold;margin-right:10px}:host .name{width:60%}:host .value{width:40%}`;
    __getStatic() {
        return EnumValuesRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(EnumValuesRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="title">Values</div><div class="header">    <div class="name">Name</div>    <div class="value">Value</div></div><div class="body">    <av-collapse name="Values" open>        <template _id="enumvaluesrender_0"></template>    </av-collapse></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`            <div class="line">                <div class="name">                    <div class="row">                        <div class="single-name" _id="enumvaluesrender_1"></div>                    </div>                    <div class="row description" _id="enumvaluesrender_2"></div>                </div>                <div class="value" _id="enumvaluesrender_3"></div>            </div>        `);templ0.setActions({
  "content": {
    "enumvaluesrender_1°@HTML": {
      "fct": (c) => `${c.print(c.comp.__7682afe33b768d2686bc3668463e7fe7method1(c.data.value))}`,
      "once": true
    },
    "enumvaluesrender_2°@HTML": {
      "fct": (c) => `${c.print(c.comp.__7682afe33b768d2686bc3668463e7fe7method2(c.data.value))}`,
      "once": true
    },
    "enumvaluesrender_3°@HTML": {
      "fct": (c) => `${c.print(c.comp.__7682afe33b768d2686bc3668463e7fe7method3(c.data.value))}`,
      "once": true
    }
  }
});this.__getStatic().__template.addLoop({
                    anchorId: 'enumvaluesrender_0',
                    template: templ0,
                simple:{data: "this.values",item:"value"}}); }
    getClassName() {
        return "EnumValuesRender";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["values"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('values'); }
    __7682afe33b768d2686bc3668463e7fe7method1(value) {
        return value.name;
    }
    __7682afe33b768d2686bc3668463e7fe7method2(value) {
        return value.documentation;
    }
    __7682afe33b768d2686bc3668463e7fe7method3(value) {
        return value.value;
    }
}
EnumValuesRender.Namespace=`AventusStorybook`;
EnumValuesRender.Tag=`av-enum-values-render`;
_.EnumValuesRender=EnumValuesRender;
if(!window.customElements.get('av-enum-values-render')){window.customElements.define('av-enum-values-render', EnumValuesRender);Aventus.WebComponentInstance.registerDefinition(EnumValuesRender);}

const StoryEnumRender = class StoryEnumRender extends StoryBaseRender {
    static __style = ``;
    __getStatic() {
        return StoryEnumRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(StoryEnumRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<av-enum-values-render _id="storyenumrender_0"></av-enum-values-render>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "injection": [
    {
      "id": "storyenumrender_0",
      "injectionName": "values",
      "inject": (c) => c.comp.__c6dd1f262cf85fac85f0f44fe5a72368method0(),
      "once": true
    }
  ]
}); }
    getClassName() {
        return "StoryEnumRender";
    }
    defineTags(config) {
    }
    __c6dd1f262cf85fac85f0f44fe5a72368method0() {
        return this.config.properties;
    }
}
StoryEnumRender.Namespace=`AventusStorybook`;
StoryEnumRender.Tag=`av-story-enum-render`;
_.StoryEnumRender=StoryEnumRender;
if(!window.customElements.get('av-story-enum-render')){window.customElements.define('av-story-enum-render', StoryEnumRender);Aventus.WebComponentInstance.registerDefinition(StoryEnumRender);}

const MethodsRender = class MethodsRender extends BaseRender {
    get 'methods'() {
						return this.__watch["methods"];
					}
					set 'methods'(val) {
						this.__watch["methods"] = val;
					}get 'methodsGroups'() {
						return this.__watch["methodsGroups"];
					}
					set 'methodsGroups'(val) {
						this.__watch["methodsGroups"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("methods", ((target) => {
    target.prepareMethods();
}));this.__addWatchesActions("methodsGroups");    super.__registerWatchesActions();
}
    static __style = `:host .body .line .name{display:flex;flex-direction:column;flex-wrap:wrap}:host .body .line .name .single-name{font-weight:bold;margin-right:10px}:host .body .line .name .tags{display:flex;gap:3px}:host .body .line .name .tags av-tag{font-size:10px;padding:0px 7px}:host .body .line .name .description{margin-top:3px;width:100%}:host .body .line .name .where{font-size:12px;margin-top:3px;width:100%}:host .body .line .parameters{align-items:start;display:flex;flex-direction:column;gap:3px}:host .body .line .parameters .parameter{display:flex;flex-direction:column;width:100%}:host .body .line .parameters .parameter .parameter-info{align-items:center;display:flex}:host .body .line .parameters .parameter .parameter-info .param-name::after{content:":";margin:0 5px}:host .body .line .parameters .parameter .parameter-description{font-size:11px;margin-top:3px;padding:0 10px}:host .body .line .return{align-items:flex-start;display:flex;flex-direction:column}:host .body .line .return .description{font-size:12px;margin-top:3px;padding:0 3px;width:100%}:host .name{width:50%}:host .parameters{width:30%}:host .return{width:20%}`;
    __getStatic() {
        return MethodsRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(MethodsRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="title">Methods</div><div class="header">    <div class="name">Name</div>    <div class="parameters">Parameters</div>    <div class="return">Return</div></div><div class="body">    <template _id="methodsrender_0"></template></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`        <av-collapse open _id="methodsrender_1">        <template _id="methodsrender_2"></template>        </av-collapse>    `);templ0.setActions({
  "injection": [
    {
      "id": "methodsrender_1",
      "injectionName": "name",
      "inject": (c) => c.comp.__f41c9843229e225223b0b2ee71876826method14(c.data.name),
      "once": true
    }
  ]
});this.__getStatic().__template.addLoop({
                    anchorId: 'methodsrender_0',
                    template: templ0,
                simple:{data: "this.methodsGroups",index:"name"}});const templ1 = new Aventus.Template(this);templ1.setTemplate(`                <div class="line">                    <div class="name">                        <div class="row">                            <div class="single-name" _id="methodsrender_3"></div>                            <div class="tags">                                <av-tag _id="methodsrender_4"></av-tag>                                <template _id="methodsrender_5"></template>                            </div>                        </div>                        <div class="row description" _id="methodsrender_9"></div>                        <template _id="methodsrender_10"></template>                    </div>                    <div class="parameters">                        <template _id="methodsrender_20"></template>                    </div>                    <div class="return">                        <av-type-render _id="methodsrender_25"></av-type-render>                        <template _id="methodsrender_26"></template>                    </div>                </div>            `);templ1.setActions({
  "content": {
    "methodsrender_3°@HTML": {
      "fct": (c) => `${c.print(c.comp.__f41c9843229e225223b0b2ee71876826method15(c.data.method))}`,
      "once": true
    },
    "methodsrender_4°@HTML": {
      "fct": (c) => `${c.print(c.comp.__f41c9843229e225223b0b2ee71876826method17(c.data.method))}`,
      "once": true
    },
    "methodsrender_9°@HTML": {
      "fct": (c) => `${c.print(c.comp.__f41c9843229e225223b0b2ee71876826method20(c.data.method))}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "methodsrender_4",
      "injectionName": "type",
      "inject": (c) => c.comp.__f41c9843229e225223b0b2ee71876826method16(c.data.method),
      "once": true
    },
    {
      "id": "methodsrender_25",
      "injectionName": "type",
      "inject": (c) => c.comp.__f41c9843229e225223b0b2ee71876826method28(c.data.method)
    }
  ]
});templ0.addLoop({
                    anchorId: 'methodsrender_2',
                    template: templ1,
                simple:{data: "this.methodsGroups[name]",item:"method"}});const templ2 = new Aventus.Template(this);templ2.setTemplate(`                                    <template _id="methodsrender_6"></template>                                `);const templ3 = new Aventus.Template(this);templ3.setTemplate(`                                        <template _id="methodsrender_7"></template>                                    `);templ2.addLoop({
                    anchorId: 'methodsrender_6',
                    template: templ3,
                simple:{data: "method.modifiers",item:"tag"}});const templ4 = new Aventus.Template(this);templ4.setTemplate(`                                            <av-tag _id="methodsrender_8"></av-tag>                                        `);templ4.setActions({
  "content": {
    "methodsrender_8°@HTML": {
      "fct": (c) => `${c.print(c.comp.__f41c9843229e225223b0b2ee71876826method19(c.data.tag))}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "methodsrender_8",
      "injectionName": "type",
      "inject": (c) => c.comp.__f41c9843229e225223b0b2ee71876826method18(c.data.tag),
      "once": true
    }
  ]
});templ3.addIf({
                    anchorId: 'methodsrender_7',
                    parts: [{once: true,
                    condition: (c) => c.comp.__f41c9843229e225223b0b2ee71876826method4(c.data.tag),
                    template: templ4
                }]
            });templ1.addIf({
                    anchorId: 'methodsrender_5',
                    parts: [{
                    condition: (c) => c.comp.__f41c9843229e225223b0b2ee71876826method2(c.data.method),
                    template: templ2
                }]
            });const templ5 = new Aventus.Template(this);templ5.setTemplate(`                            <template _id="methodsrender_11"></template>                        `);const templ6 = new Aventus.Template(this);templ6.setTemplate(`                                <template _id="methodsrender_12"></template>                            `);templ5.addLoop({
                    anchorId: 'methodsrender_11',
                    template: templ6,
                simple:{data: "method.generics",item:"info"}});const templ7 = new Aventus.Template(this);templ7.setTemplate(`                                    <div class="row where">                                        <span _id="methodsrender_13"></span>                                        <template _id="methodsrender_14"></template>                                        <template _id="methodsrender_16"></template>                                        <template _id="methodsrender_18"></template>                                    </div>                                `);templ7.setActions({
  "content": {
    "methodsrender_13°@HTML": {
      "fct": (c) => `Where ${c.print(c.comp.__f41c9843229e225223b0b2ee71876826method21(c.data.info))}`,
      "once": true
    }
  }
});const templ8 = new Aventus.Template(this);templ8.setTemplate(`                                            <span> extends </span>                                            <av-type-render _id="methodsrender_15"></av-type-render>                                        `);templ8.setActions({
  "injection": [
    {
      "id": "methodsrender_15",
      "injectionName": "type",
      "inject": (c) => c.comp.__f41c9843229e225223b0b2ee71876826method22(c.data.info),
      "once": true
    }
  ]
});templ7.addIf({
                    anchorId: 'methodsrender_14',
                    parts: [{once: true,
                    condition: (c) => c.comp.__f41c9843229e225223b0b2ee71876826method8(c.data.info),
                    template: templ8
                }]
            });const templ9 = new Aventus.Template(this);templ9.setTemplate(`                                            <span> = </span>                                            <av-type-render _id="methodsrender_17"></av-type-render>                                        `);templ9.setActions({
  "injection": [
    {
      "id": "methodsrender_17",
      "injectionName": "type",
      "inject": (c) => c.comp.__f41c9843229e225223b0b2ee71876826method23(c.data.info),
      "once": true
    }
  ]
});templ7.addIf({
                    anchorId: 'methodsrender_16',
                    parts: [{once: true,
                    condition: (c) => c.comp.__f41c9843229e225223b0b2ee71876826method9(c.data.info),
                    template: templ9
                }]
            });const templ10 = new Aventus.Template(this);templ10.setTemplate(`                                            <span _id="methodsrender_19"></span>                                        `);templ10.setActions({
  "content": {
    "methodsrender_19°@HTML": {
      "fct": (c) => ` - ${c.print(c.comp.__f41c9843229e225223b0b2ee71876826method24(c.data.info))}`,
      "once": true
    }
  }
});templ7.addIf({
                    anchorId: 'methodsrender_18',
                    parts: [{once: true,
                    condition: (c) => c.comp.__f41c9843229e225223b0b2ee71876826method10(c.data.info),
                    template: templ10
                }]
            });templ6.addIf({
                    anchorId: 'methodsrender_12',
                    parts: [{once: true,
                    condition: (c) => c.comp.__f41c9843229e225223b0b2ee71876826method7(c.data.info),
                    template: templ7
                }]
            });templ1.addIf({
                    anchorId: 'methodsrender_10',
                    parts: [{once: true,
                    condition: (c) => c.comp.__f41c9843229e225223b0b2ee71876826method5(c.data.method),
                    template: templ5
                }]
            });const templ11 = new Aventus.Template(this);templ11.setTemplate(`                            <span>-</span>                        `);const templ12 = new Aventus.Template(this);templ12.setTemplate(`                            <template _id="methodsrender_21"></template>                        `);const templ13 = new Aventus.Template(this);templ13.setTemplate(`                                 <div class="parameter">                                    <div class="parameter-info">                                        <div class="param-name" _id="methodsrender_22"></div>                                        <av-type-render _id="methodsrender_23"></av-type-render>                                    </div>                                    <div class="parameter-description" _id="methodsrender_24"></div>                                </div>                            `);templ13.setActions({
  "content": {
    "methodsrender_22°@HTML": {
      "fct": (c) => `${c.print(c.comp.__f41c9843229e225223b0b2ee71876826method25(c.data._param))}`,
      "once": true
    },
    "methodsrender_24°@HTML": {
      "fct": (c) => `${c.print(c.comp.__f41c9843229e225223b0b2ee71876826method27(c.data._param))}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "methodsrender_23",
      "injectionName": "type",
      "inject": (c) => c.comp.__f41c9843229e225223b0b2ee71876826method26(c.data._param),
      "once": true
    }
  ]
});templ12.addLoop({
                    anchorId: 'methodsrender_21',
                    template: templ13,
                simple:{data: "method.parameters",item:"_param"}});templ1.addIf({
                    anchorId: 'methodsrender_20',
                    parts: [{once: true,
                    condition: (c) => c.comp.__f41c9843229e225223b0b2ee71876826method11(c.data.method),
                    template: templ11
                },{once: true,
                    condition: (c) => true,
                    template: templ12
                }]
            });const templ14 = new Aventus.Template(this);templ14.setTemplate(`                            <div class="description" _id="methodsrender_27"></div>                        `);templ14.setActions({
  "content": {
    "methodsrender_27°@HTML": {
      "fct": (c) => `${c.print(c.comp.__f41c9843229e225223b0b2ee71876826method29(c.data.method))}`,
      "once": true
    }
  }
});templ1.addIf({
                    anchorId: 'methodsrender_26',
                    parts: [{
                    condition: (c) => c.comp.__f41c9843229e225223b0b2ee71876826method13(c.data.method),
                    template: templ14
                }]
            }); }
    getClassName() {
        return "MethodsRender";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["methods"] = [];w["methodsGroups"] = {}; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('methods');this.__correctGetter('methodsGroups'); }
    getMethodName(method) {
        let name = method.name;
        if (method.generics) {
            name += "&lt;";
            name += method.generics.map(p => p.name).join(",");
            name += "&gt;";
        }
        return name;
    }
    prepareMethods() {
        let methodsGroups = {
            'static': [],
            'instance': [],
        };
        for (let method of this.methods) {
            let key = method.modifiers?.includes("static") ? 'static' : 'instance';
            methodsGroups[key].push(method);
        }
        for (let key in methodsGroups) {
            if (methodsGroups[key].length == 0) {
                delete methodsGroups[key];
            }
            else {
                methodsGroups[key].sort((a, b) => a.name.localeCompare(b.name));
            }
        }
        this.methodsGroups = methodsGroups;
    }
    __f41c9843229e225223b0b2ee71876826method15(method) {
        return this.getMethodName(method);
    }
    __f41c9843229e225223b0b2ee71876826method17(method) {
        return method.accessibility;
    }
    __f41c9843229e225223b0b2ee71876826method19(tag) {
        return tag;
    }
    __f41c9843229e225223b0b2ee71876826method20(method) {
        return method.documentation;
    }
    __f41c9843229e225223b0b2ee71876826method21(info) {
        return info.name;
    }
    __f41c9843229e225223b0b2ee71876826method24(info) {
        return info.documentation;
    }
    __f41c9843229e225223b0b2ee71876826method25(_param) {
        return _param.name;
    }
    __f41c9843229e225223b0b2ee71876826method27(_param) {
        return _param.documentation;
    }
    __f41c9843229e225223b0b2ee71876826method29(method) {
        return method.return.documentation;
    }
    __f41c9843229e225223b0b2ee71876826method2(method) {
        return method.modifiers;
    }
    __f41c9843229e225223b0b2ee71876826method4(tag) {
        return tag != 'static';
    }
    __f41c9843229e225223b0b2ee71876826method5(method) {
        return method.generics;
    }
    __f41c9843229e225223b0b2ee71876826method7(info) {
        return info.constraint || info.default || info.documentation;
    }
    __f41c9843229e225223b0b2ee71876826method8(info) {
        return info.constraint;
    }
    __f41c9843229e225223b0b2ee71876826method9(info) {
        return info.default;
    }
    __f41c9843229e225223b0b2ee71876826method10(info) {
        return info.documentation;
    }
    __f41c9843229e225223b0b2ee71876826method11(method) {
        return !method.parameters || method.parameters.length == 0;
    }
    __f41c9843229e225223b0b2ee71876826method13(method) {
        return method.return?.documentation;
    }
    __f41c9843229e225223b0b2ee71876826method14(name) {
        return name;
    }
    __f41c9843229e225223b0b2ee71876826method16(method) {
        return method.accessibility;
    }
    __f41c9843229e225223b0b2ee71876826method18(tag) {
        return tag;
    }
    __f41c9843229e225223b0b2ee71876826method22(info) {
        return info.constraint;
    }
    __f41c9843229e225223b0b2ee71876826method23(info) {
        return info.default;
    }
    __f41c9843229e225223b0b2ee71876826method26(_param) {
        return _param.type;
    }
    __f41c9843229e225223b0b2ee71876826method28(method) {
        return method.return?.type;
    }
}
MethodsRender.Namespace=`AventusStorybook`;
MethodsRender.Tag=`av-methods-render`;
_.MethodsRender=MethodsRender;
if(!window.customElements.get('av-methods-render')){window.customElements.define('av-methods-render', MethodsRender);Aventus.WebComponentInstance.registerDefinition(MethodsRender);}

const StoryInterfaceRender = class StoryInterfaceRender extends StoryBaseRender {
    static __style = ``;
    __getStatic() {
        return StoryInterfaceRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(StoryInterfaceRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'header':`    <template _id="storyinterfacerender_0"></template>`,'before-documentation':`    <template _id="storyinterfacerender_2"></template>`,'default':`<template _id="storyinterfacerender_12"></template><template _id="storyinterfacerender_14"></template><template _id="storyinterfacerender_16"></template>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`        <div class="generic" _id="storyinterfacerender_1"></div>    `);templ0.setActions({
  "content": {
    "storyinterfacerender_1°@HTML": {
      "fct": (c) => `\r\n            ${c.print(c.comp.__c2996f955a016e43827eff28a34e47a0method10())}\r\n        `,
      "once": true
    }
  }
});this.__getStatic().__template.addIf({
                    anchorId: 'storyinterfacerender_0',
                    parts: [{
                    condition: (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method0(),
                    template: templ0
                }]
            });const templ1 = new Aventus.Template(this);templ1.setTemplate(`        <template _id="storyinterfacerender_3"></template>    `);const templ2 = new Aventus.Template(this);templ2.setTemplate(`             <template _id="storyinterfacerender_4"></template>        `);templ1.addLoop({
                    anchorId: 'storyinterfacerender_3',
                    template: templ2,
                simple:{data: "this.config.generics",item:"info"}});const templ3 = new Aventus.Template(this);templ3.setTemplate(`                <div class="where">                    <span _id="storyinterfacerender_5"></span>                    <template _id="storyinterfacerender_6"></template>                    <template _id="storyinterfacerender_8"></template>                    <template _id="storyinterfacerender_10"></template>                </div>            `);templ3.setActions({
  "content": {
    "storyinterfacerender_5°@HTML": {
      "fct": (c) => `Where ${c.print(c.comp.__c2996f955a016e43827eff28a34e47a0method11(c.data.info))}`,
      "once": true
    }
  }
});const templ4 = new Aventus.Template(this);templ4.setTemplate(`                        <span> extends </span>                        <av-type-render _id="storyinterfacerender_7"></av-type-render>                    `);templ4.setActions({
  "injection": [
    {
      "id": "storyinterfacerender_7",
      "injectionName": "type",
      "inject": (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method12(c.data.info),
      "once": true
    }
  ]
});templ3.addIf({
                    anchorId: 'storyinterfacerender_6',
                    parts: [{once: true,
                    condition: (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method4(c.data.info),
                    template: templ4
                }]
            });const templ5 = new Aventus.Template(this);templ5.setTemplate(`                        <span> = </span>                        <av-type-render _id="storyinterfacerender_9"></av-type-render>                    `);templ5.setActions({
  "injection": [
    {
      "id": "storyinterfacerender_9",
      "injectionName": "type",
      "inject": (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method13(c.data.info),
      "once": true
    }
  ]
});templ3.addIf({
                    anchorId: 'storyinterfacerender_8',
                    parts: [{once: true,
                    condition: (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method5(c.data.info),
                    template: templ5
                }]
            });const templ6 = new Aventus.Template(this);templ6.setTemplate(`                        <span _id="storyinterfacerender_11"></span>                    `);templ6.setActions({
  "content": {
    "storyinterfacerender_11°@HTML": {
      "fct": (c) => ` - ${c.print(c.comp.__c2996f955a016e43827eff28a34e47a0method14(c.data.info))}`,
      "once": true
    }
  }
});templ3.addIf({
                    anchorId: 'storyinterfacerender_10',
                    parts: [{once: true,
                    condition: (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method6(c.data.info),
                    template: templ6
                }]
            });templ2.addIf({
                    anchorId: 'storyinterfacerender_4',
                    parts: [{once: true,
                    condition: (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method3(c.data.info),
                    template: templ3
                }]
            });this.__getStatic().__template.addIf({
                    anchorId: 'storyinterfacerender_2',
                    parts: [{once: true,
                    condition: (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method1(),
                    template: templ1
                }]
            });const templ7 = new Aventus.Template(this);templ7.setTemplate(`    <div class="parent">        <span>Extends : </span>        <av-type-render _id="storyinterfacerender_13"></av-type-render>    </div>`);templ7.setActions({
  "injection": [
    {
      "id": "storyinterfacerender_13",
      "injectionName": "type",
      "inject": (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method15()
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'storyinterfacerender_12',
                    parts: [{
                    condition: (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method7(),
                    template: templ7
                }]
            });const templ8 = new Aventus.Template(this);templ8.setTemplate(`    <av-properties-render _id="storyinterfacerender_15"></av-properties-render>`);templ8.setActions({
  "injection": [
    {
      "id": "storyinterfacerender_15",
      "injectionName": "properties",
      "inject": (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method16(),
      "once": true
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'storyinterfacerender_14',
                    parts: [{once: true,
                    condition: (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method8(),
                    template: templ8
                }]
            });const templ9 = new Aventus.Template(this);templ9.setTemplate(`    <av-methods-render _id="storyinterfacerender_17"></av-methods-render>`);templ9.setActions({
  "injection": [
    {
      "id": "storyinterfacerender_17",
      "injectionName": "methods",
      "inject": (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method17(),
      "once": true
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'storyinterfacerender_16',
                    parts: [{once: true,
                    condition: (c) => c.comp.__c2996f955a016e43827eff28a34e47a0method9(),
                    template: templ9
                }]
            }); }
    getClassName() {
        return "StoryInterfaceRender";
    }
    defineTags(config) {
    }
    __c2996f955a016e43827eff28a34e47a0method10() {
        return this.renderGeneric();
    }
    __c2996f955a016e43827eff28a34e47a0method11(info) {
        return info.name;
    }
    __c2996f955a016e43827eff28a34e47a0method14(info) {
        return info.documentation;
    }
    __c2996f955a016e43827eff28a34e47a0method0() {
        return this.config?.generics && this.config.generics.length > 0;
    }
    __c2996f955a016e43827eff28a34e47a0method1() {
        return this.config.generics;
    }
    __c2996f955a016e43827eff28a34e47a0method3(info) {
        return info.constraint || info.default || info.documentation;
    }
    __c2996f955a016e43827eff28a34e47a0method4(info) {
        return info.constraint;
    }
    __c2996f955a016e43827eff28a34e47a0method5(info) {
        return info.default;
    }
    __c2996f955a016e43827eff28a34e47a0method6(info) {
        return info.documentation;
    }
    __c2996f955a016e43827eff28a34e47a0method7() {
        return this.config?.extends;
    }
    __c2996f955a016e43827eff28a34e47a0method8() {
        return this.config.properties;
    }
    __c2996f955a016e43827eff28a34e47a0method9() {
        return this.config.methods;
    }
    __c2996f955a016e43827eff28a34e47a0method12(info) {
        return info.constraint;
    }
    __c2996f955a016e43827eff28a34e47a0method13(info) {
        return info.default;
    }
    __c2996f955a016e43827eff28a34e47a0method15() {
        return this.config?.extends;
    }
    __c2996f955a016e43827eff28a34e47a0method16() {
        return this.config.properties;
    }
    __c2996f955a016e43827eff28a34e47a0method17() {
        return this.config.methods;
    }
}
StoryInterfaceRender.Namespace=`AventusStorybook`;
StoryInterfaceRender.Tag=`av-story-interface-render`;
_.StoryInterfaceRender=StoryInterfaceRender;
if(!window.customElements.get('av-story-interface-render')){window.customElements.define('av-story-interface-render', StoryInterfaceRender);Aventus.WebComponentInstance.registerDefinition(StoryInterfaceRender);}

const StoryClassRender = class StoryClassRender extends StoryBaseRender {
    static __style = ``;
    __getStatic() {
        return StoryClassRender;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(StoryClassRender.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'header':`    <template _id="storyclassrender_0"></template>`,'before-documentation':`    <template _id="storyclassrender_2"></template>    <template _id="storyclassrender_12"></template>    <template _id="storyclassrender_14"></template>`,'default':`<template _id="storyclassrender_18"></template><template _id="storyclassrender_20"></template><template _id="storyclassrender_22"></template><template _id="storyclassrender_24"></template>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`        <div class="generic" _id="storyclassrender_1"></div>    `);templ0.setActions({
  "content": {
    "storyclassrender_1°@HTML": {
      "fct": (c) => `\r\n            ${c.print(c.comp.__ca96d083f58db6699fbdf27e9c680713method16())}\r\n        `,
      "once": true
    }
  }
});this.__getStatic().__template.addIf({
                    anchorId: 'storyclassrender_0',
                    parts: [{
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method0(),
                    template: templ0
                }]
            });const templ1 = new Aventus.Template(this);templ1.setTemplate(`        <template _id="storyclassrender_3"></template>    `);const templ2 = new Aventus.Template(this);templ2.setTemplate(`             <template _id="storyclassrender_4"></template>        `);templ1.addLoop({
                    anchorId: 'storyclassrender_3',
                    template: templ2,
                simple:{data: "this.config.generics",item:"info"}});const templ3 = new Aventus.Template(this);templ3.setTemplate(`                <div class="where">                    <span _id="storyclassrender_5"></span>                    <template _id="storyclassrender_6"></template>                    <template _id="storyclassrender_8"></template>                    <template _id="storyclassrender_10"></template>                </div>            `);templ3.setActions({
  "content": {
    "storyclassrender_5°@HTML": {
      "fct": (c) => `Where ${c.print(c.comp.__ca96d083f58db6699fbdf27e9c680713method17(c.data.info))}`,
      "once": true
    }
  }
});const templ4 = new Aventus.Template(this);templ4.setTemplate(`                        <span> extends </span>                        <av-type-render _id="storyclassrender_7"></av-type-render>                    `);templ4.setActions({
  "injection": [
    {
      "id": "storyclassrender_7",
      "injectionName": "type",
      "inject": (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method18(c.data.info),
      "once": true
    }
  ]
});templ3.addIf({
                    anchorId: 'storyclassrender_6',
                    parts: [{once: true,
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method4(c.data.info),
                    template: templ4
                }]
            });const templ5 = new Aventus.Template(this);templ5.setTemplate(`                        <span> = </span>                        <av-type-render _id="storyclassrender_9"></av-type-render>                    `);templ5.setActions({
  "injection": [
    {
      "id": "storyclassrender_9",
      "injectionName": "type",
      "inject": (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method19(c.data.info),
      "once": true
    }
  ]
});templ3.addIf({
                    anchorId: 'storyclassrender_8',
                    parts: [{once: true,
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method5(c.data.info),
                    template: templ5
                }]
            });const templ6 = new Aventus.Template(this);templ6.setTemplate(`                        <span _id="storyclassrender_11"></span>                    `);templ6.setActions({
  "content": {
    "storyclassrender_11°@HTML": {
      "fct": (c) => ` - ${c.print(c.comp.__ca96d083f58db6699fbdf27e9c680713method20(c.data.info))}`,
      "once": true
    }
  }
});templ3.addIf({
                    anchorId: 'storyclassrender_10',
                    parts: [{once: true,
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method6(c.data.info),
                    template: templ6
                }]
            });templ2.addIf({
                    anchorId: 'storyclassrender_4',
                    parts: [{once: true,
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method3(c.data.info),
                    template: templ3
                }]
            });this.__getStatic().__template.addIf({
                    anchorId: 'storyclassrender_2',
                    parts: [{once: true,
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method1(),
                    template: templ1
                }]
            });const templ7 = new Aventus.Template(this);templ7.setTemplate(`        <div class="parent">            <span>Extends : </span>            <av-type-render _id="storyclassrender_13"></av-type-render>        </div>    `);templ7.setActions({
  "injection": [
    {
      "id": "storyclassrender_13",
      "injectionName": "type",
      "inject": (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method21()
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'storyclassrender_12',
                    parts: [{
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method7(),
                    template: templ7
                }]
            });const templ8 = new Aventus.Template(this);templ8.setTemplate(`        <div class="parent">            <span>Implements : </span>            <template _id="storyclassrender_15"></template>         </div>    `);const templ9 = new Aventus.Template(this);templ9.setTemplate(`                <av-type-render _id="storyclassrender_16"></av-type-render>                <template _id="storyclassrender_17"></template>            `);templ9.setActions({
  "injection": [
    {
      "id": "storyclassrender_16",
      "injectionName": "type",
      "inject": (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method22(c.data.i)
    }
  ]
});templ8.addLoop({
                    anchorId: 'storyclassrender_15',
                    template: templ9,
                func: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method10()});const templ10 = new Aventus.Template(this);templ10.setTemplate(`                    <span>, </span>                `);templ9.addIf({
                    anchorId: 'storyclassrender_17',
                    parts: [{once: true,
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method11(c.data.i),
                    template: templ10
                }]
            });this.__getStatic().__template.addIf({
                    anchorId: 'storyclassrender_14',
                    parts: [{
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method8(),
                    template: templ8
                }]
            });const templ11 = new Aventus.Template(this);templ11.setTemplate(`    <av-properties-render _id="storyclassrender_19"></av-properties-render>`);templ11.setActions({
  "injection": [
    {
      "id": "storyclassrender_19",
      "injectionName": "properties",
      "inject": (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method23(),
      "once": true
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'storyclassrender_18',
                    parts: [{once: true,
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method12(),
                    template: templ11
                }]
            });const templ12 = new Aventus.Template(this);templ12.setTemplate(`    <av-methods-render _id="storyclassrender_21"></av-methods-render>`);templ12.setActions({
  "injection": [
    {
      "id": "storyclassrender_21",
      "injectionName": "methods",
      "inject": (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method24(),
      "once": true
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'storyclassrender_20',
                    parts: [{once: true,
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method13(),
                    template: templ12
                }]
            });const templ13 = new Aventus.Template(this);templ13.setTemplate(`    <av-styles-render _id="storyclassrender_23"></av-styles-render>`);templ13.setActions({
  "injection": [
    {
      "id": "storyclassrender_23",
      "injectionName": "styles",
      "inject": (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method25(),
      "once": true
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'storyclassrender_22',
                    parts: [{once: true,
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method14(),
                    template: templ13
                }]
            });const templ14 = new Aventus.Template(this);templ14.setTemplate(`    <av-slots-render _id="storyclassrender_25"></av-slots-render>`);templ14.setActions({
  "injection": [
    {
      "id": "storyclassrender_25",
      "injectionName": "slots",
      "inject": (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method26(),
      "once": true
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'storyclassrender_24',
                    parts: [{once: true,
                    condition: (c) => c.comp.__ca96d083f58db6699fbdf27e9c680713method15(),
                    template: templ14
                }]
            }); }
    getClassName() {
        return "StoryClassRender";
    }
    defineTags(config) {
        if (config.modifier)
            this.tags.push(config.modifier);
    }
    __ca96d083f58db6699fbdf27e9c680713method10() {
        let i = 0;
        return {
            transform: () => {
                i++;
            },
            condition: () => {
                return (i < this.config.implements.length);
            },
            apply: () => {
                return ({ i });
            }
        };
    }
    __ca96d083f58db6699fbdf27e9c680713method16() {
        return this.renderGeneric();
    }
    __ca96d083f58db6699fbdf27e9c680713method17(info) {
        return info.name;
    }
    __ca96d083f58db6699fbdf27e9c680713method20(info) {
        return info.documentation;
    }
    __ca96d083f58db6699fbdf27e9c680713method0() {
        return this.config?.generics && this.config.generics.length > 0;
    }
    __ca96d083f58db6699fbdf27e9c680713method1() {
        return this.config.generics;
    }
    __ca96d083f58db6699fbdf27e9c680713method3(info) {
        return info.constraint || info.default || info.documentation;
    }
    __ca96d083f58db6699fbdf27e9c680713method4(info) {
        return info.constraint;
    }
    __ca96d083f58db6699fbdf27e9c680713method5(info) {
        return info.default;
    }
    __ca96d083f58db6699fbdf27e9c680713method6(info) {
        return info.documentation;
    }
    __ca96d083f58db6699fbdf27e9c680713method7() {
        return this.config?.extends;
    }
    __ca96d083f58db6699fbdf27e9c680713method8() {
        return this.config?.implements;
    }
    __ca96d083f58db6699fbdf27e9c680713method11(i) {
        return i + 1 < this.config.implements.length;
    }
    __ca96d083f58db6699fbdf27e9c680713method12() {
        return this.config.properties;
    }
    __ca96d083f58db6699fbdf27e9c680713method13() {
        return this.config.methods;
    }
    __ca96d083f58db6699fbdf27e9c680713method14() {
        return this.config.style;
    }
    __ca96d083f58db6699fbdf27e9c680713method15() {
        return this.config.slots;
    }
    __ca96d083f58db6699fbdf27e9c680713method18(info) {
        return info.constraint;
    }
    __ca96d083f58db6699fbdf27e9c680713method19(info) {
        return info.default;
    }
    __ca96d083f58db6699fbdf27e9c680713method21() {
        return this.config?.extends;
    }
    __ca96d083f58db6699fbdf27e9c680713method22(i) {
        return this.config?.implements[i];
    }
    __ca96d083f58db6699fbdf27e9c680713method23() {
        return this.config.properties;
    }
    __ca96d083f58db6699fbdf27e9c680713method24() {
        return this.config.methods;
    }
    __ca96d083f58db6699fbdf27e9c680713method25() {
        return this.config.style;
    }
    __ca96d083f58db6699fbdf27e9c680713method26() {
        return this.config.slots;
    }
}
StoryClassRender.Namespace=`AventusStorybook`;
StoryClassRender.Tag=`av-story-class-render`;
_.StoryClassRender=StoryClassRender;
if(!window.customElements.get('av-story-class-render')){window.customElements.define('av-story-class-render', StoryClassRender);Aventus.WebComponentInstance.registerDefinition(StoryClassRender);}


for(let key in _) { AventusStorybook[key] = _[key] }
})(AventusStorybook);
