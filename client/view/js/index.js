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
        if (element.shadowRoot) {
            let slotEl;
            if (slotName) {
                slotEl = element.shadowRoot.querySelector('slot[name="' + slotName + '"]');
            }
            else {
                slotEl = element.shadowRoot.querySelector("slot");
            }
            while (true) {
                if (!slotEl) {
                    return [];
                }
                var listChild = Array.from(slotEl.assignedElements());
                if (!listChild) {
                    return [];
                }
                let slotFound = false;
                for (let i = 0; i < listChild.length; i++) {
                    if (listChild[i].nodeName == "SLOT") {
                        slotEl = listChild[i];
                        slotFound = true;
                        break;
                    }
                }
                if (!slotFound) {
                    return listChild;
                }
            }
        }
        return [];
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
                if (newEl && newEl != el) {
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
ElementExtension.Namespace=`${moduleName}`;
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
Instance.Namespace=`${moduleName}`;
_.Instance=Instance;
const Style=class Style {
    static instance;
    static noAnimation;
    static defaultStyleSheets = {
        "@general": `:host{display:inline-block;box-sizing:border-box}:host *{box-sizing:border-box}`,
    };
    static store(name, content) {
        this.getInstance().store(name, content);
    }
    static get(name) {
        return this.getInstance().get(name);
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
}
Style.Namespace=`${moduleName}`;
_.Style=Style;
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
        if (current && current.prototype instanceof Aventus.WebComponent) {
            return new current();
        }
        return null;
    }
}
WebComponentInstance.Namespace=`${moduleName}`;
_.WebComponentInstance=WebComponentInstance;
const Callback=class Callback {
    callbacks = [];
    /**
     * Clear all callbacks
     */
    clear() {
        this.callbacks = [];
    }
    /**
     * Add a callback
     */
    add(cb) {
        this.callbacks.push(cb);
    }
    /**
     * Remove a callback
     */
    remove(cb) {
        let index = this.callbacks.indexOf(cb);
        if (index != -1) {
            this.callbacks.splice(index, 1);
        }
    }
    /**
     * Trigger all callbacks
     */
    trigger(args) {
        let result = [];
        let cbs = [...this.callbacks];
        for (let cb of cbs) {
            result.push(cb.apply(null, args));
        }
        return result;
    }
}
Callback.Namespace=`${moduleName}`;
_.Callback=Callback;
const Mutex=class Mutex {
    waitingList = [];
    isLocked = false;
    /**
     * Wait the mutex to be free then get it
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
     * Release the mutex
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
     * Clear mutex
     */
    dispose() {
        this.waitingList = [];
        this.isLocked = false;
    }
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
Mutex.Namespace=`${moduleName}`;
_.Mutex=Mutex;
const State=class State {
    /**
     * Activate a custom state inside a specific manager
     * It ll be a generic state with no information inside exept name
     */
    static async activate(stateName, manager) {
        return await new EmptyState(stateName).activate(manager);
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
State.Namespace=`${moduleName}`;
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
EmptyState.Namespace=`${moduleName}`;
_.EmptyState=EmptyState;
var WatchAction;
(function (WatchAction) {
    WatchAction[WatchAction["CREATED"] = 0] = "CREATED";
    WatchAction[WatchAction["UPDATED"] = 1] = "UPDATED";
    WatchAction[WatchAction["DELETED"] = 2] = "DELETED";
})(WatchAction || (WatchAction = {}));

_.WatchAction=WatchAction;
const Watcher=class Watcher {
    static __maxProxyData = 0;
    /**
     * Transform object into a watcher
     */
    static get(obj, onDataChanged) {
        if (obj == undefined) {
            console.error("You must define an objet / array for your proxy");
            return;
        }
        if (obj.__isProxy) {
            obj.__subscribe(onDataChanged);
            return obj;
        }
        Watcher.__maxProxyData++;
        let setProxyPath = (newProxy, newPath) => {
            if (newProxy instanceof Object && newProxy.__isProxy) {
                newProxy.__path = newPath;
                if (!newProxy.__proxyData) {
                    newProxy.__proxyData = {};
                }
                if (!newProxy.__proxyData[newPath]) {
                    newProxy.__proxyData[newPath] = [];
                }
                if (newProxy.__proxyData[newPath].indexOf(proxyData) == -1) {
                    newProxy.__proxyData[newPath].push(proxyData);
                }
            }
        };
        let removeProxyPath = (oldValue, pathToDelete, recursive = true) => {
            if (oldValue instanceof Object && oldValue.__isProxy) {
                let allProxies = oldValue.__proxyData;
                for (let triggerPath in allProxies) {
                    if (triggerPath == pathToDelete) {
                        for (let i = 0; i < allProxies[triggerPath].length; i++) {
                            if (allProxies[triggerPath][i] == proxyData) {
                                allProxies[triggerPath].splice(i, 1);
                                i--;
                            }
                        }
                        if (allProxies[triggerPath].length == 0) {
                            delete allProxies[triggerPath];
                            if (Object.keys(allProxies).length == 0) {
                                delete oldValue.__proxyData;
                            }
                        }
                    }
                }
            }
        };
        let jsonReplacer = (key, value) => {
            if (key == "__path")
                return undefined;
            else if (key == "__proxyData")
                return undefined;
            else
                return value;
        };
        let currentTrace = new Error().stack?.split("\n") ?? [];
        currentTrace.shift();
        currentTrace.shift();
        let onlyDuringInit = true;
        let proxyData = {
            baseData: {},
            id: Watcher.__maxProxyData,
            callbacks: [onDataChanged],
            avoidUpdate: [],
            pathToRemove: [],
            history: [{
                    object: JSON.parse(JSON.stringify(obj, jsonReplacer)),
                    trace: currentTrace,
                    action: 'init',
                    path: ''
                }],
            useHistory: false,
            getProxyObject(target, element, prop) {
                let newProxy;
                if (element instanceof Object && element.__isProxy) {
                    newProxy = element;
                }
                else {
                    try {
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
                    if (prop != "length") {
                        if (target.__path) {
                            newPath = target.__path;
                        }
                        newPath += "[" + prop + "]";
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
                else if (prop == "__subscribe") {
                    return (cb) => {
                        this.callbacks.push(cb);
                    };
                }
                else if (prop == "__unsubscribe") {
                    return (cb) => {
                        let index = this.callbacks.indexOf(cb);
                        if (index > -1) {
                            this.callbacks.splice(index, 1);
                        }
                    };
                }
                else if (prop == "__proxyId") {
                    return this.id;
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
                else if (prop == "__getTarget" && onlyDuringInit) {
                    return () => {
                        return target;
                    };
                }
                else if (prop == "toJSON") {
                    return () => {
                        let result = {};
                        for (let key of Object.keys(target)) {
                            if (key == "__path" || key == "__proxyData") {
                                continue;
                            }
                            result[key] = target[key];
                        }
                        return result;
                    };
                }
                return undefined;
            },
            get(target, prop, receiver) {
                if (prop == "__proxyData") {
                    return target[prop];
                }
                let customResult = this.tryCustomFunction(target, prop, receiver);
                if (customResult !== undefined) {
                    return customResult;
                }
                let element = target[prop];
                if (typeof (element) == 'object') {
                    return this.getProxyObject(target, element, prop);
                }
                else if (typeof (element) == 'function') {
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
                                    let proxyEl = this.getProxyObject(target, el, (index - 1));
                                    target.splice(target.length - 1, 1, proxyEl);
                                    trigger('CREATED', target, receiver, proxyEl, "[" + (index - 1) + "]");
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
                                    let res = target.splice(index, nbRemove, ...insert);
                                    let path = target.__path ? target.__path : '';
                                    for (let i = 0; i < res.length; i++) {
                                        trigger('DELETED', target, receiver, res[i], "[" + index + "]");
                                        removeProxyPath(res[i], path + "[" + (index + i) + "]");
                                    }
                                    for (let i = 0; i < insert.length; i++) {
                                        let proxyEl = this.getProxyObject(target, insert[i], (index + i));
                                        target.splice((index + i), 1, proxyEl);
                                        trigger('CREATED', target, receiver, proxyEl, "[" + (index + i) + "]");
                                    }
                                    let fromIndex = index + insert.length;
                                    let baseDiff = index - insert.length + res.length + 1;
                                    for (let i = fromIndex, j = 0; i < target.length; i++, j++) {
                                        let oldPath = path + "[" + (j + baseDiff) + "]";
                                        removeProxyPath(target[i], oldPath, false);
                                        let proxyEl = this.getProxyObject(target, target[i], i);
                                        let recuUpdate = (childEl) => {
                                            if (Array.isArray(childEl)) {
                                                for (let i = 0; i < childEl.length; i++) {
                                                    if (childEl[i] instanceof Object && childEl[i].__path) {
                                                        let oldPathRecu = proxyEl[i].__path.replace(proxyEl.__path, oldPath);
                                                        removeProxyPath(childEl[i], oldPathRecu, false);
                                                        let newProxyEl = this.getProxyObject(childEl, childEl[i], i);
                                                        recuUpdate(newProxyEl);
                                                    }
                                                }
                                            }
                                            else if (childEl instanceof Object && !(childEl instanceof Date)) {
                                                for (let key in childEl) {
                                                    if (childEl[key] instanceof Object && childEl[key].__path) {
                                                        let oldPathRecu = proxyEl[key].__path.replace(proxyEl.__path, oldPath);
                                                        removeProxyPath(childEl[key], oldPathRecu, false);
                                                        let newProxyEl = this.getProxyObject(childEl, childEl[key], key);
                                                        recuUpdate(newProxyEl);
                                                    }
                                                }
                                            }
                                        };
                                        recuUpdate(proxyEl);
                                    }
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
                                    let res = target.pop();
                                    let path = target.__path ? target.__path : '';
                                    trigger('DELETED', target, receiver, res, "[" + index + "]");
                                    removeProxyPath(res, path + "[" + index + "]");
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
                return Reflect.get(target, prop, receiver);
            },
            set(target, prop, value, receiver) {
                let triggerChange = false;
                if (["__path", "__proxyData"].indexOf(prop) == -1) {
                    if (Array.isArray(target)) {
                        if (prop != "length") {
                            triggerChange = true;
                        }
                    }
                    else {
                        let oldValue = Reflect.get(target, prop, receiver);
                        if (oldValue !== value) {
                            triggerChange = true;
                        }
                    }
                }
                let result = Reflect.set(target, prop, value, receiver);
                if (triggerChange) {
                    let index = this.avoidUpdate.indexOf(prop);
                    if (index == -1) {
                        trigger('UPDATED', target, receiver, value, prop);
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
                if (prop != "__path") {
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
                if (target.hasOwnProperty(prop)) {
                    let oldValue = target[prop];
                    delete target[prop];
                    if (triggerChange) {
                        trigger('DELETED', target, null, oldValue, prop);
                        removeProxyPath(oldValue, pathToDelete);
                    }
                    return true;
                }
                return false;
            },
            defineProperty(target, prop, descriptor) {
                let triggerChange = false;
                let newPath = '';
                if (["__path", "__proxyData"].indexOf(prop) == -1) {
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
            }
        };
        const trigger = (type, target, receiver, value, prop) => {
            if (target.__isProxy) {
                return;
            }
            let allProxies = target.__proxyData;
            let receiverId = 0;
            if (receiver == null) {
                receiverId = proxyData.id;
            }
            else {
                receiverId = receiver.__proxyId;
            }
            if (proxyData.id == receiverId) {
                let stacks = [];
                let allStacks = new Error().stack?.split("\n") ?? [];
                for (let i = allStacks.length - 1; i >= 0; i--) {
                    let current = allStacks[i].trim().replace("at ", "");
                    if (current.startsWith("Object.set") || current.startsWith("Proxy.result")) {
                        break;
                    }
                    stacks.push(current);
                }
                for (let triggerPath in allProxies) {
                    for (let currentProxyData of allProxies[triggerPath]) {
                        let pathToSend = triggerPath;
                        if (pathToSend != "") {
                            if (Array.isArray(target)) {
                                if (!prop.startsWith("[")) {
                                    pathToSend += "[" + prop + "]";
                                }
                                else {
                                    pathToSend += prop;
                                }
                            }
                            else {
                                if (!prop.startsWith("[")) {
                                    pathToSend += ".";
                                }
                                pathToSend += prop;
                            }
                        }
                        else {
                            pathToSend = prop;
                        }
                        if (proxyData.useHistory) {
                            proxyData.history.push({
                                object: JSON.parse(JSON.stringify(currentProxyData.baseData, jsonReplacer)),
                                trace: stacks.reverse(),
                                action: WatchAction[type],
                                path: pathToSend
                            });
                        }
                        [...currentProxyData.callbacks].forEach((cb) => {
                            cb(WatchAction[type], pathToSend, value);
                        });
                    }
                }
            }
        };
        var realProxy = new Proxy(obj, proxyData);
        proxyData.baseData = realProxy.__getTarget();
        onlyDuringInit = false;
        setProxyPath(realProxy, '');
        return realProxy;
    }
}
Watcher.Namespace=`${moduleName}`;
_.Watcher=Watcher;
const PressManager=class PressManager {
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
    delayDblPress = 150;
    delayLongPress = 700;
    nbPress = 0;
    offsetDrag = 20;
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
        if (options.delayDblPress !== undefined) {
            this.delayDblPress = options.delayDblPress;
        }
        if (options.delayLongPress !== undefined) {
            this.delayLongPress = options.delayLongPress;
        }
        if (options.offsetDrag !== undefined) {
            this.offsetDrag = options.offsetDrag;
        }
        if (options.onDblPress !== undefined) {
            this.useDblPress = true;
        }
        if (options.forceDblPress) {
            this.useDblPress = true;
        }
        if (typeof options.stopPropagation == 'function') {
            this.stopPropagation = options.stopPropagation;
        }
        else if (options.stopPropagation === false) {
            this.stopPropagation = () => false;
        }
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
        if (this.stopPropagation()) {
            e.stopImmediatePropagation();
        }
        document.removeEventListener("pointerup", this.functionsBinded.upAction);
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
        }
    }
}
PressManager.Namespace=`${moduleName}`;
_.PressManager=PressManager;
const StateManager=class StateManager {
    subscribers = {};
    static canBeActivate(statePattern, stateName) {
        let stateInfo = this.prepareStateString(statePattern);
        return stateInfo.regex.test(stateName);
    }
    activeState;
    changeStateMutex = new Mutex();
    afterStateChanged = new Callback();
    /**
     * Subscribe actions for a state or a state list
     */
    subscribe(statePatterns, callbacks) {
        if (!callbacks.active && !callbacks.inactive && !callbacks.askChange) {
            this._log(`Trying to subscribe to state : ${statePatterns} with no callbacks !`, "warning");
            return;
        }
        if (!Array.isArray(statePatterns)) {
            statePatterns = [statePatterns];
        }
        for (let statePattern of statePatterns) {
            if (!this.subscribers.hasOwnProperty(statePattern)) {
                let res = StateManager.prepareStateString(statePattern);
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
                    if (this.subscribers[statePattern].isActive && this.activeState) {
                        let slugs = this.getInternalStateSlugs(this.subscribers[statePattern], this.activeState.name);
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
    static prepareStateString(stateName) {
        let params = [];
        let i = 0;
        let regexState = stateName.replace(/{.*?}/g, (group, position) => {
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
        regexState = regexState.replace(/\*/g, ".*?");
        regexState = "^" + regexState + '$';
        return {
            regex: new RegExp(regexState),
            params
        };
    }
    /**
     * Activate a current state
     */
    async setState(state) {
        let result = await this.changeStateMutex.safeRunLastAsync(async () => {
            let stateToUse;
            if (typeof state == "string") {
                stateToUse = new EmptyState(state);
            }
            else {
                stateToUse = state;
            }
            if (!stateToUse) {
                this._log("state is undefined", "error");
                this.changeStateMutex.release();
                return false;
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
                            let currentSlug = this.getInternalStateSlugs(subscriber, this.activeState.name);
                            if (currentSlug) {
                                for (let i = 0; i < clone.length; i++) {
                                    let askChange = clone[i];
                                    if (!await askChange(this.activeState, stateToUse, currentSlug)) {
                                        canChange = false;
                                        break;
                                    }
                                }
                            }
                            let slugs = this.getInternalStateSlugs(subscriber, stateToUse.name);
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
                            let slugs = this.getInternalStateSlugs(subscriber, stateToUse.name);
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
                        let oldSlug = this.getInternalStateSlugs(subscriber, oldState.name);
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
                    let slugs = this.getInternalStateSlugs(this.subscribers[key], stateToUse.name);
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
    getInternalStateSlugs(subscriber, stateName) {
        let matches = subscriber.regex.exec(stateName);
        if (matches) {
            let slugs = {};
            for (let param of subscriber.params) {
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
    /**
     * Check if a state is in the subscribers and active, return true if it is, false otherwise
     */
    isStateActive(statePattern) {
        return StateManager.prepareStateString(statePattern).regex.test(this.activeState?.name ?? '');
    }
    /**
     * Get slugs information for the current state, return null if state isn't active
     */
    getStateSlugs(statePattern) {
        let prepared = StateManager.prepareStateString(statePattern);
        let name = this.activeState?.name ?? '';
        return this.getInternalStateSlugs({
            regex: prepared.regex,
            params: prepared.params,
            isActive: false,
            callbacks: {
                active: [],
                inactive: [],
                askChange: [],
            }
        }, name);
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
StateManager.Namespace=`${moduleName}`;
_.StateManager=StateManager;
const WebComponentTemplateContext=class WebComponentTemplateContext {
    __changes = {};
    component;
    fctsToRemove = [];
    c = {
        __P: (value) => {
            return value == null ? "" : value + "";
        }
    };
    isRendered = false;
    schema;
    constructor(component, schema, locals) {
        this.component = component;
        this.schema = { ...schema };
        for (let key in locals) {
            this.schema.locals[key] = locals[key];
        }
        this.buildSchema();
    }
    destructor() {
        for (let toRemove of this.fctsToRemove) {
            let index = this.component['__onChangeFct'][toRemove.name].indexOf(toRemove.fct);
            if (index != -1) {
                this.component['__onChangeFct'][toRemove.name].splice(index, 1);
            }
        }
    }
    buildSchema() {
        for (let global of this.schema.globals) {
            this.createGlobal(global);
        }
        for (let item in this.schema.loops) {
            this.createLoop(item, this.schema.loops[item].index, this.schema.loops[item].data);
        }
        for (let key in this.schema.locals) {
            this.createLocal(key, this.schema.locals[key]);
        }
    }
    createGlobal(global) {
        let comp = this.component;
        Object.defineProperty(this.c, global, {
            get() {
                return WebComponentTemplate.getValueFromItem(global, comp);
            },
            set(value) {
                WebComponentTemplate.setValueToItem(global, comp, value);
            }
        });
        let name = global.split(".")[0];
        this.__changes[name] = [];
        if (!this.component['__onChangeFct'][name]) {
            this.component['__onChangeFct'][name] = [];
        }
        let fct = (path) => {
            if (this.isRendered) {
                for (let change of this.__changes[name]) {
                    change(path);
                }
            }
        };
        this.fctsToRemove.push({ name, fct });
        this.component['__onChangeFct'][name].push(fct);
    }
    createLoop(item, index, data) {
        Object.defineProperty(this.c, item, {
            get() {
                let indexValue = this[index];
                return WebComponentTemplate.getValueFromItem(data, this)[indexValue];
            }
        });
        let name = data.split(".")[0];
        this.__changes[item] = [];
        this.__changes[name].push((path) => {
            if (this.isRendered) {
                let currentPath = `${data}[${this.c[index]}]`;
                if (path.startsWith(currentPath)) {
                    let localPath = path.replace(currentPath, item);
                    for (let change of this.__changes[item]) {
                        change(localPath);
                    }
                }
            }
        });
    }
    createLocal(key, value) {
        let changes = this.__changes;
        Object.defineProperty(this.c, key, {
            get() {
                return value;
            },
            set(value) {
                value = value;
                if (changes[key]) {
                    for (let change of changes[key]) {
                        change(key);
                    }
                }
            }
        });
    }
    addChange(on, fct) {
        if (!this.__changes[on]) {
            this.__changes[on] = [];
        }
        this.__changes[on].push(fct);
    }
}
WebComponentTemplateContext.Namespace=`${moduleName}`;
_.WebComponentTemplateContext=WebComponentTemplateContext;
const WebComponentTemplate=class WebComponentTemplate {
    static setValueToItem(path, obj, value) {
        let splitted = path.split(".");
        for (let i = 0; i < splitted.length - 1; i++) {
            let split = splitted[i];
            if (!obj[split]) {
                obj[split] = {};
            }
            obj = obj[split];
        }
        obj[splitted[splitted.length - 1]] = value;
    }
    static getValueFromItem(path, obj) {
        let splitted = path.split(".");
        for (let i = 0; i < splitted.length - 1; i++) {
            let split = splitted[i];
            if (typeof obj[split] !== 'object') {
                return undefined;
            }
            obj = obj[split];
        }
        return obj[splitted[splitted.length - 1]];
    }
    static validatePath(path, pathToCheck) {
        if (path.startsWith(pathToCheck)) {
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
    setTemplate(template) {
        this.template = document.createElement('template');
        this.template.innerHTML = template;
    }
    contextSchema = {
        globals: [],
        locals: {},
        loops: {}
    };
    template;
    actions = {};
    loops = [];
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
                            this.actions.content[contextProp] = [...actions.content[contextProp], ...this.actions.content[contextProp]];
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
        }
    }
    setSchema(contextSchema) {
        if (contextSchema.globals) {
            for (let glob of contextSchema.globals) {
                if (!this.contextSchema.globals.includes(glob)) {
                    this.contextSchema.globals.push(glob);
                }
            }
        }
        if (contextSchema.locals) {
            for (let key in contextSchema.locals) {
                this.contextSchema.locals[key] = contextSchema.locals[key];
            }
        }
        if (contextSchema.loops) {
            for (let key in contextSchema.loops) {
                this.contextSchema.loops[key] = contextSchema.loops[key];
            }
        }
    }
    createInstance(component) {
        let context = new WebComponentTemplateContext(component, this.contextSchema, {});
        let content = this.template?.content.cloneNode(true);
        let actions = this.actions;
        let instance = new WebComponentTemplateInstance(context, content, actions, component, this.loops);
        return instance;
    }
    addLoop(loop) {
        this.loops.push(loop);
    }
}
WebComponentTemplate.Namespace=`${moduleName}`;
_.WebComponentTemplate=WebComponentTemplate;
const WebComponentTemplateInstance=class WebComponentTemplateInstance {
    context;
    content;
    actions;
    component;
    _components = {};
    firstRenderUniqueCb = {};
    firstRenderCb = [];
    fctsToRemove = [];
    loopRegisteries = {};
    firstChild;
    lastChild;
    loops = [];
    constructor(context, content, actions, component, loops) {
        this.context = context;
        this.content = content;
        this.actions = actions;
        this.component = component;
        this.loops = loops;
        this.firstChild = content.firstChild;
        this.lastChild = content.lastChild;
        this.selectElements();
        this.transformActionsListening();
    }
    render() {
        this.bindEvents();
        for (let cb of this.firstRenderCb) {
            cb();
        }
        for (let key in this.firstRenderUniqueCb) {
            this.firstRenderUniqueCb[key]();
        }
        this.renderSubTemplate();
        this.context.isRendered = true;
    }
    destructor() {
        this.firstChild.remove();
        this.context.destructor();
        for (let toRemove of this.fctsToRemove) {
            let index = this.component['__watchActions'][toRemove.name].indexOf(toRemove.fct);
            if (index != -1) {
                this.component['__watchActions'][toRemove.name].splice(index, 1);
            }
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
                    WebComponentTemplate.setValueToItem(element.name, this.component, components);
                }
                else if (components[0]) {
                    WebComponentTemplate.setValueToItem(element.name, this.component, components[0]);
                }
            }
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
                let cb = WebComponentTemplate.getValueFromItem(event.eventName, el);
                cb?.add((...args) => {
                    event.fct(this.context, args);
                });
            }
        }
        else {
            for (let el of this._components[event.id]) {
                el.addEventListener(event.eventName, (e) => { event.fct(e, this.context); });
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
                for (let change of this.actions.content[name]) {
                    this.transformChangeAction(name, change);
                }
            }
        }
        if (this.actions.injection) {
            for (let name in this.actions.injection) {
                for (let injection of this.actions.injection[name]) {
                    this.transformInjectionAction(name, injection);
                }
            }
        }
        if (this.actions.bindings) {
            for (let name in this.actions.bindings) {
                for (let binding of this.actions.bindings[name]) {
                    this.transformBindigAction(name, binding);
                }
            }
        }
    }
    transformChangeAction(name, change) {
        if (!this._components[change.id])
            return;
        let key = change.id + "_" + change.attrName;
        if (change.attrName == "@HTML") {
            if (change.path) {
                this.context.addChange(name, (path) => {
                    if (WebComponentTemplate.validatePath(path, change.path ?? '')) {
                        for (const el of this._components[change.id]) {
                            el.innerHTML = change.render(this.context.c);
                        }
                    }
                });
            }
            else {
                this.context.addChange(name, (path) => {
                    for (const el of this._components[change.id]) {
                        el.innerHTML = change.render(this.context.c);
                    }
                });
            }
            if (!this.firstRenderUniqueCb[key]) {
                this.firstRenderUniqueCb[key] = () => {
                    for (const el of this._components[change.id]) {
                        el.innerHTML = change.render(this.context.c);
                    }
                };
            }
        }
        else if (change.isBool) {
            this.context.addChange(name, () => {
                for (const el of this._components[change.id]) {
                    if (this.context.c[name]) {
                        el.setAttribute(change.attrName, "true");
                    }
                    else {
                        el.removeAttribute(change.attrName);
                    }
                }
            });
            if (!this.firstRenderUniqueCb[key]) {
                this.firstRenderUniqueCb[key] = () => {
                    for (const el of this._components[change.id]) {
                        if (this.context.c[name]) {
                            el.setAttribute(change.attrName, "true");
                        }
                        else {
                            el.removeAttribute(change.attrName);
                        }
                    }
                };
            }
        }
        else {
            if (change.path) {
                this.context.addChange(name, (path) => {
                    if (WebComponentTemplate.validatePath(path, change.path ?? '')) {
                        for (const el of this._components[change.id]) {
                            el.setAttribute(change.attrName, change.render(this.context.c));
                        }
                    }
                });
            }
            else {
                this.context.addChange(name, (path) => {
                    for (const el of this._components[change.id]) {
                        el.setAttribute(change.attrName, change.render(this.context.c));
                    }
                });
            }
            if (!this.firstRenderUniqueCb[key]) {
                this.firstRenderUniqueCb[key] = () => {
                    for (const el of this._components[change.id]) {
                        el.setAttribute(change.attrName, change.render(this.context.c));
                    }
                };
            }
        }
    }
    transformInjectionAction(name, injection) {
        if (!this._components[injection.id])
            return;
        if (injection.path) {
            this.context.addChange(name, (path) => {
                if (WebComponentTemplate.validatePath(path, injection.path ?? '')) {
                    for (const el of this._components[injection.id]) {
                        el[injection.injectionName] = injection.inject(this.context.c);
                    }
                }
            });
        }
        else {
            this.context.addChange(name, (path) => {
                for (const el of this._components[injection.id]) {
                    el[injection.injectionName] = injection.inject(this.context.c);
                }
            });
        }
        this.firstRenderCb.push(() => {
            for (const el of this._components[injection.id]) {
                el[injection.injectionName] = injection.inject(this.context.c);
            }
        });
    }
    transformBindigAction(name, binding) {
        if (!this._components[binding.id])
            return;
        if (binding.path) {
            this.context.addChange(name, (path) => {
                let bindingPath = binding.path ?? '';
                if (WebComponentTemplate.validatePath(path, bindingPath)) {
                    let valueToSet = WebComponentTemplate.getValueFromItem(bindingPath, this.context.c);
                    for (const el of this._components[binding.id]) {
                        WebComponentTemplate.setValueToItem(binding.valueName, el, valueToSet);
                    }
                }
            });
        }
        else {
            binding.path = name;
            this.context.addChange(name, (path) => {
                let valueToSet = WebComponentTemplate.getValueFromItem(name, this.context.c);
                for (const el of this._components[binding.id]) {
                    WebComponentTemplate.setValueToItem(binding.valueName, el, valueToSet);
                }
            });
        }
        if (binding.isCallback) {
            this.firstRenderCb.push(() => {
                for (var el of this._components[binding.id]) {
                    for (let fct of binding.eventNames) {
                        let cb = WebComponentTemplate.getValueFromItem(fct, el);
                        cb?.add((value) => {
                            WebComponentTemplate.setValueToItem(binding.path ?? '', this.context.c, value);
                        });
                    }
                    let valueToSet = WebComponentTemplate.getValueFromItem(binding.path ?? '', this.context.c);
                    WebComponentTemplate.setValueToItem(binding.valueName, el, valueToSet);
                }
            });
        }
        else {
            this.firstRenderCb.push(() => {
                for (var el of this._components[binding.id]) {
                    for (let fct of binding.eventNames) {
                        el.addEventListener(fct, (e) => {
                            let valueToSet = WebComponentTemplate.getValueFromItem(binding.valueName, e.target);
                            WebComponentTemplate.setValueToItem(binding.path ?? '', this.context.c, valueToSet);
                        });
                    }
                    let valueToSet = WebComponentTemplate.getValueFromItem(binding.path ?? '', this.context.c);
                    WebComponentTemplate.setValueToItem(binding.valueName, el, valueToSet);
                }
            });
        }
    }
    renderSubTemplate() {
        for (let loop of this.loops) {
            let localContext = JSON.parse(JSON.stringify(this.context.schema));
            localContext.loops[loop.item] = {
                data: loop.data,
                index: loop.index,
            };
            this.renderLoop(loop, localContext);
            this.registerLoopWatchEvent(loop, localContext);
        }
    }
    renderLoop(loop, localContext) {
        if (this.loopRegisteries[loop.anchorId]) {
            for (let item of this.loopRegisteries[loop.anchorId]) {
                item.destructor();
            }
        }
        this.loopRegisteries[loop.anchorId] = [];
        let result = WebComponentTemplate.getValueFromItem(loop.data, this.context.c);
        let anchor = this._components[loop.anchorId][0];
        for (let i = 0; i < result.length; i++) {
            let context = new WebComponentTemplateContext(this.component, localContext, { [loop.index]: i });
            let content = loop.template.template?.content.cloneNode(true);
            let actions = loop.template.actions;
            let instance = new WebComponentTemplateInstance(context, content, actions, this.component, loop.template.loops);
            instance.render();
            anchor.parentNode?.insertBefore(instance.content, anchor);
            this.loopRegisteries[loop.anchorId].push(instance);
        }
    }
    registerLoopWatchEvent(loop, localContext) {
        let fullPath = loop.data;
        let watchName = fullPath.split(".")[0];
        if (!this.component['__watchActions'][watchName]) {
            this.component['__watchActions'][watchName] = [];
        }
        let regex = new RegExp(fullPath.replace(/\./g, "\\.") + "\\[(\\d+?)\\]$");
        this.component['__watchActions'][watchName].push((element, action, path, value) => {
            if (path == fullPath) {
                this.renderLoop(loop, localContext);
                return;
            }
            regex.lastIndex = 0;
            let result = regex.exec(path);
            if (result) {
                let registry = this.loopRegisteries[loop.anchorId];
                let index = Number(result[1]);
                if (action == WatchAction.CREATED) {
                    let context = new WebComponentTemplateContext(this.component, localContext, { [loop.index]: index });
                    let content = loop.template.template?.content.cloneNode(true);
                    let actions = loop.template.actions;
                    let instance = new WebComponentTemplateInstance(context, content, actions, this.component, loop.template.loops);
                    instance.render();
                    let anchor;
                    if (index < registry.length) {
                        anchor = registry[index].firstChild;
                    }
                    else {
                        anchor = this._components[loop.anchorId][0];
                    }
                    anchor.parentNode?.insertBefore(instance.content, anchor);
                    registry.splice(index, 0, instance);
                    for (let i = index + 1; i < registry.length; i++) {
                        registry[i].context.c[loop.index] = registry[i].context.c[loop.index] + 1;
                    }
                }
                else if (action == WatchAction.UPDATED) {
                    registry[index].render();
                }
                else if (action == WatchAction.DELETED) {
                    registry[index].destructor();
                    registry.splice(index, 1);
                    for (let i = index; i < registry.length; i++) {
                        registry[i].context.c[loop.index] = registry[i].context.c[loop.index] - 1;
                    }
                }
            }
        });
    }
}
WebComponentTemplateInstance.Namespace=`${moduleName}`;
_.WebComponentTemplateInstance=WebComponentTemplateInstance;
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
    * Get the unique type for the data. Define it as the namespace + class name
    */
    get $type() {
        return this.constructor['Fullname'];
    }
    __onChangeFct = {};
    __watch;
    __watchActions = {};
    __watchActionsCb = {};
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
        // TODO add missing info for destructor();
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
    __registerWatchesActions() {
        if (Object.keys(this.__watchActions).length > 0) {
            if (!this.__watch) {
                this.__watch = Watcher.get({}, (type, path, element) => {
                    let action = this.__watchActionsCb[path.split(".")[0]] || this.__watchActionsCb[path.split("[")[0]];
                    action(type, path, element);
                });
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
        addStyle("@general");
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
            staticInstance.__template = new WebComponentTemplate(staticInstance);
            this.__getHtml();
            this.__registerTemplateAction();
            staticInstance.__template.generateTemplate();
            staticInstance.__styleSheets = this.__renderStyles();
        }
        this.__templateInstance = staticInstance.__template.createInstance(this);
        let shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.adoptedStyleSheets = [...Object.values(staticInstance.__styleSheets), Style.noAnimation];
        shadowRoot.appendChild(this.__templateInstance.content);
        customElements.upgrade(shadowRoot);
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
            this.__templateInstance?.render();
            this.__removeNoAnimations();
        }
    }
    __removeNoAnimations() {
        if (document.readyState !== "loading") {
            this.offsetWidth;
            setTimeout(() => {
                this.postCreation();
                this._isReady = true;
                this.dispatchEvent(new CustomEvent('postCreationDone'));
                this.shadowRoot.adoptedStyleSheets = Object.values(this.__getStatic().__styleSheets);
                document.removeEventListener("DOMContentLoaded", this.__removeNoAnimations);
            }, 50);
        }
    }
    __defaultValues() { }
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
                this[prop] = false;
            }
        }
        else {
            if (this.hasAttribute(prop)) {
                let value = this.getAttribute(prop);
                delete this[prop];
                this[prop] = value;
            }
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
                    managerClass.subscribe(route, el);
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
        if (d instanceof Date) {
            return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
        }
        return null;
    }
    dateTimeToString(dt) {
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
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue || !this.isReady) {
            if (this.__onChangeFct.hasOwnProperty(name)) {
                for (let fct of this.__onChangeFct[name]) {
                    fct('');
                }
            }
        }
    }
    remove() {
        super.remove();
        this.postDestruction();
    }
    /**
     * Function triggered when the component is removed from the DOM
     */
    postDestruction() { }
    /**
     * Function triggered the first time the component is rendering inside DOM
     */
    postCreation() { }
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
WebComponent.Namespace=`${moduleName}`;
_.WebComponent=WebComponent;

for(let key in _) { Aventus[key] = _[key] }
})(Aventus);

var dependances;
(dependances||(dependances = {}));
(function (dependances) {
const moduleName = `dependances`;
const _ = {};


let _n;

const Message=class Message {
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
Message.Namespace=`${moduleName}`;
_.Message=Message;
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
ConfigurationEditor.Namespace=`${moduleName}`;
_.ConfigurationEditor=ConfigurationEditor;
if(!window.customElements.get('av-configuration-editor')){window.customElements.define('av-configuration-editor', ConfigurationEditor);Aventus.WebComponentInstance.registerDefinition(ConfigurationEditor);}

const Dependances = class Dependances extends Aventus.WebComponent {
    get 'no_deps'() {
                return this.hasAttribute('no_deps');
            }
            set 'no_deps'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('no_deps', 'true');
                } else{
                    this.removeAttribute('no_deps');
                }
            }    get 'dependances'() {
						return this.__watch["dependances"];
					}
					set 'dependances'(val) {
						this.__watch["dependances"] = val;
					}    __registerWatchesActions() {
                this.__addWatchesActions("dependances", ((target) => {
    target.no_deps = target.dependances.length == 0;
}));                super.__registerWatchesActions();
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
        blocks: { 'default':`<h3>Dependances</h3><p class="no-dependances-txt">Your project has no dependance</p><vscode-data-grid aria-label="Default">	<vscode-data-grid-row row-type="header">		<vscode-data-grid-cell cell-type="columnheader" grid-column="1">			Name		</vscode-data-grid-cell>		<vscode-data-grid-cell cell-type="columnheader" grid-column="2">			Version		</vscode-data-grid-cell>		<vscode-data-grid-cell cell-type="columnheader" grid-column="3">			Url		</vscode-data-grid-cell>		<vscode-data-grid-cell cell-type="columnheader" grid-column="4">			Action		</vscode-data-grid-cell>	</vscode-data-grid-row>	<template _id="dependances_1"></template>	<vscode-data-grid-row class="add-row">		<vscode-data-grid-cell grid-column="1"></vscode-data-grid-cell>		<vscode-data-grid-cell grid-column="2"></vscode-data-grid-cell>		<vscode-data-grid-cell grid-column="3"></vscode-data-grid-cell>		<vscode-data-grid-cell grid-column="4">			<vscode-button>Add</vscode-button>		</vscode-data-grid-cell>	</vscode-data-grid-row></vscode-data-grid>` }
    });
}
    get temp () { var list = Array.from(this.shadowRoot.querySelectorAll('[_id="dependances_0"]')); return list; }    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setSchema({globals:["dependances"]});const templ1 = new Aventus.WebComponentTemplate(this);templ1.setTemplate(`<vscode-data-grid-row _id="dependances_0">		<vscode-data-grid-cell grid-column="1" _id="dependances_2"></vscode-data-grid-cell>		<vscode-data-grid-cell grid-column="2" _id="dependances_3"></vscode-data-grid-cell>		<vscode-data-grid-cell grid-column="3">			<a target="_blank" _id="dependances_4"></a>		</vscode-data-grid-cell>		<vscode-data-grid-cell grid-column="4">			<av-icon class="trash"></av-icon>		</vscode-data-grid-cell>	</vscode-data-grid-row>`);templ1.setActions({
  "content": {
    "dep": [
      {
        "id": "dependances_2",
        "attrName": "@HTML",
        "render": (c) => `\r\n\t\t\t${c.__P(c.dep.name)}\r\n\t\t`,
        "path": "dep"
      },
      {
        "id": "dependances_3",
        "attrName": "@HTML",
        "render": (c) => `\r\n\t\t\t${c.__P(c.dep.version)}\r\n\t\t`,
        "path": "dep"
      },
      {
        "id": "dependances_4",
        "attrName": "href",
        "render": (c) => `${c.__P(c.dep.uri)}`,
        "path": "dep"
      },
      {
        "id": "dependances_4",
        "attrName": "@HTML",
        "render": (c) => `\r\n\t\t\t\t${c.__P(c.dep.uri)}\r\n\t\t\t`,
        "path": "dep"
      }
    ]
  }
});this.__getStatic().__template.addLoop({
                        anchorId: 'dependances_1',
                        data: 'dependances',
                        index: 'index_dependances_1',
                        item: 'dep',
                        template: templ1
                    }); }
    getClassName() {
        return "Dependances";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('no_deps')) { this.attributeChangedCallback('no_deps', false, false); }if(!this["dependances"]){ this["dependances"] = [{        name: "AventusUI",        version: "1.0.0",        uri: "https://aventusjs.com/aventusUI.def.avt"    }, {        name: "AventusUI2",        version: "1.0.0",        uri: "https://aventusjs.com/aventusUI.def.avt"    }];} }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('no_deps'); }
    __listBoolProps() { return ["no_deps"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
}
Dependances.Namespace=`${moduleName}`;
_.Dependances=Dependances;
if(!window.customElements.get('av-dependances')){window.customElements.define('av-dependances', Dependances);Aventus.WebComponentInstance.registerDefinition(Dependances);}

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
Icon.Namespace=`${moduleName}`;
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
GeneralInformation.Namespace=`${moduleName}`;
_.GeneralInformation=GeneralInformation;
if(!window.customElements.get('av-general-information')){window.customElements.define('av-general-information', GeneralInformation);Aventus.WebComponentInstance.registerDefinition(GeneralInformation);}


for(let key in _) { dependances[key] = _[key] }
})(dependances);
