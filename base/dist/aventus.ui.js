var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const moduleName = `Aventus`;

class WebComponentInstance {
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
}

class ElementExtension {
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
    static getElementsInSlot(element, slotName = null) {
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
    static getElementAtPosition(x, y, startFrom = null) {
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

class Instance {
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

class Style {
    static instance;
    static defaultStyleSheets = {
        "@general": `:host{display:inline-block;box-sizing:border-box}:host *{box-sizing:border-box}`
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
    }
    stylesheets = new Map();
    async load(name, url) {
        try {
            if (!this.stylesheets.has(name) || this.stylesheets.get(name).cssRules.length == 0) {
                let txt = await (await fetch(url)).text();
                this.store(name, txt);
            }
        }
        catch (e) {
        }
    }
    store(name, content) {
        if (!this.stylesheets.has(name)) {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(content);
            this.stylesheets.set(name, sheet);
        }
        else {
            this.stylesheets.get(name).replaceSync(content);
        }
    }
    get(name) {
        if (!this.stylesheets.has(name)) {
            this.store(name, "");
        }
        return this.stylesheets.get(name);
    }
}

class WebComponent extends HTMLElement {
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
    static get Namespace() { return ""; }
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
        shadowRoot.adoptedStyleSheets = Object.values(staticInstance.__styleSheets);
        this.shadowRoot.appendChild(this.__templateInstance.content);
        customElements.upgrade(this.shadowRoot);
    }
    __registerTemplateAction() {
    }
    connectedCallback() {
        if (this._first) {
            WebComponentInstance.addInstance(this);
            this._first = false;
            this.__defaultValues();
            this.__upgradeAttributes();
            this.__templateInstance.render();
            setTimeout(() => {
                this.postCreation();
                this._isReady = true;
                this.dispatchEvent(new CustomEvent('postCreationDone'));
            });
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
        this.__defaultActiveState.get(mClass).push(cb);
    }
    __addInactiveDefState(managerClass, cb) {
        let mClass = this.__getStateManager(managerClass);
        if (!this.__defaultInactiveState.has(mClass)) {
            this.__defaultInactiveState.set(mClass, []);
        }
        this.__defaultInactiveState.get(mClass).push(cb);
    }
    __addActiveState(statePattern, managerClass, cb) {
        let mClass = this.__getStateManager(managerClass);
        this.__statesList[statePattern].get(mClass).active.push(cb);
    }
    __addInactiveState(statePattern, managerClass, cb) {
        let mClass = this.__getStateManager(managerClass);
        this.__statesList[statePattern].get(mClass).inactive.push(cb);
    }
    __addAskChangeState(statePattern, managerClass, cb) {
        let mClass = this.__getStateManager(managerClass);
        this.__statesList[statePattern].get(mClass).askChange.push(cb);
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
                let fcts = this.__defaultInactiveState.get(mClass);
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
                let fcts = this.__defaultActiveState.get(mClass);
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
                managerClass.subscribe(route, this.__statesList[route].get(managerClass));
            }
        }
    }
    __stateCleared;
    __unsubscribeState() {
        for (let route in this.__statesList) {
            for (const managerClass of this.__statesList[route].keys()) {
                managerClass.unsubscribe(route, this.__statesList[route].get(managerClass));
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
    getElementsInSlot(slotName = null) {
        return ElementExtension.getElementsInSlot(this, slotName);
    }
}

class Callback {
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
        for (let callback of this.callbacks) {
            result.push(callback.apply(null, args));
        }
        return result;
    }
}

class Mutex {
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
            lastFct(true);
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
        let result = null;
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

class StateManager {
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
                    if (this.subscribers[statePattern].isActive) {
                        let slugs = this.getInternalStateSlugs(this.subscribers[statePattern], this.activeState.name);
                        activeFct(this.activeState, slugs);
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
        return await this.changeStateMutex.safeRunLastAsync(async () => {
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
                            for (let i = 0; i < clone.length; i++) {
                                let askChange = clone[i];
                                if (!await askChange(this.activeState, stateToUse, currentSlug)) {
                                    canChange = false;
                                    break;
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
                        [...subscriber.callbacks.inactive].forEach(callback => {
                            callback(oldState, stateToUse, oldSlug);
                        });
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
                        this.subscribers[key].isActive = true;
                        [...this.subscribers[key].callbacks.active].forEach(callback => {
                            callback(stateToUse, slugs);
                        });
                    }
                }
                stateToUse.onActivate();
            }
            this.afterStateChanged.trigger([]);
            return true;
        });
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
        return StateManager.prepareStateString(statePattern).regex.test(this.activeState.name);
    }
    /**
     * Get slugs information for the current state, return null if state isn't active
     */
    getStateSlugs(statePattern) {
        let prepared = StateManager.prepareStateString(statePattern);
        return this.getInternalStateSlugs({
            regex: prepared.regex,
            params: prepared.params,
            isActive: false,
            callbacks: {
                active: [],
                inactive: [],
                askChange: [],
            }
        }, this.activeState.name);
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

var WatchAction;
(function (WatchAction) {
    WatchAction[WatchAction["CREATED"] = 0] = "CREATED";
    WatchAction[WatchAction["UPDATED"] = 1] = "UPDATED";
    WatchAction[WatchAction["DELETED"] = 2] = "DELETED";
})(WatchAction || (WatchAction = {}));

class Watcher {
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
        let currentTrace = new Error().stack.split("\n");
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
                let allStacks = new Error().stack.split("\n");
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

class PressManager {
    options;
    element;
    subPressManager = [];
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
        if (Array.isArray(options.element)) {
            for (let el of options.element) {
                let cloneOpt = { ...options };
                cloneOpt.element = el;
                this.subPressManager.push(new PressManager(cloneOpt));
            }
        }
        else {
            this.element = options.element;
            this.checkDragConstraint(options);
            this.assignValueOption(options);
            this.options = options;
            this.init();
        }
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
        e.stopImmediatePropagation();
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
                    this.emitTriggerFunction("longpress", e);
                }
            }
        }, this.delayLongPress);
        if (this.options.onPressStart) {
            this.options.onPressStart(e, this);
            this.emitTriggerFunction("pressstart", e, this.element.parentElement);
        }
        else {
            this.emitTriggerFunction("pressstart", e);
        }
    }
    upAction(e) {
        e.stopImmediatePropagation();
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
                            this.emitTriggerFunction("dblpress", e);
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
                                this.emitTriggerFunction("press", e);
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
            this.emitTriggerFunction("pressend", e, this.element.parentElement);
        }
        else {
            this.emitTriggerFunction("pressend", e);
        }
    }
    moveAction(e) {
        if (!this.state.isMoving && !this.state.oneActionTriggered) {
            e.stopImmediatePropagation();
            let xDist = e.pageX - this.startPosition.x;
            let yDist = e.pageY - this.startPosition.y;
            let distance = Math.sqrt(xDist * xDist + yDist * yDist);
            if (distance > this.offsetDrag) {
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
            e.stopImmediatePropagation();
            e.detail.state.oneActionTriggered = true;
            this.options.onPress(e.detail.realEvent, this);
            this.triggerEventToParent(this.actionsName.press, e.detail.realEvent);
        }
    }
    childDblPress(e) {
        if (this.options.onDblPress) {
            e.stopImmediatePropagation();
            if (e.detail.state) {
                e.detail.state.oneActionTriggered = true;
            }
            this.options.onDblPress(e.detail.realEvent, this);
            this.triggerEventToParent(this.actionsName.dblPress, e.detail.realEvent);
        }
    }
    childLongPress(e) {
        if (this.options.onLongPress) {
            e.stopImmediatePropagation();
            e.detail.state.oneActionTriggered = true;
            this.options.onLongPress(e.detail.realEvent, this);
            this.triggerEventToParent(this.actionsName.longPress, e.detail.realEvent);
        }
    }
    childDragStart(e) {
        if (this.options.onDragStart) {
            e.stopImmediatePropagation();
            e.detail.state.isMoving = true;
            e.detail.customFcts.src = this;
            e.detail.customFcts.onDrag = this.options.onDrag;
            e.detail.customFcts.onDragEnd = this.options.onDragEnd;
            e.detail.customFcts.offsetDrag = this.options.offsetDrag;
            this.options.onDragStart(e.detail.realEvent, this);
            this.triggerEventToParent(this.actionsName.drag, e.detail.realEvent);
        }
    }
    emitTriggerFunction(action, e, el = null) {
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
        for (let sub of this.subPressManager) {
            sub.destroy();
        }
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

class State {
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

class EmptyState extends State {
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

class WebComponentTemplateContext {
    __changes = {};
    component;
    fctsToRemove = [];
    c = {};
    isRendered = false;
    schema;
    constructor(component, schema, locals) {
        this.component = component;
        this.schema = { ...schema };
        this.schema.locals = [...this.schema.locals, ...locals];
        5;
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
        for (let loop of this.schema.loops) {
            this.createLoop(loop);
        }
        for (let local of this.schema.locals) {
            this.createLocal(local);
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
    createLoop(loop) {
        Object.defineProperty(this.c, loop.item, {
            get() {
                let indexValue = this[loop.index];
                return WebComponentTemplate.getValueFromItem(loop.data, this)[indexValue];
            }
        });
        let name = loop.data.split(".")[0];
        this.__changes[loop.item] = [];
        this.__changes[name].push((path) => {
            if (this.isRendered) {
                let currentPath = `${loop.data}[${this.c[loop.index]}]`;
                if (path.startsWith(currentPath)) {
                    let localPath = path.replace(currentPath, loop.item);
                    for (let change of this.__changes[loop.item]) {
                        change(localPath);
                    }
                }
            }
        });
    }
    createLocal(local) {
        let localValue = local.value;
        let changes = this.__changes;
        Object.defineProperty(this.c, local.name, {
            get() {
                return localValue;
            },
            set(value) {
                localValue = value;
                if (changes[local.name]) {
                    for (let change of changes[local.name]) {
                        change(local.name);
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

class WebComponentTemplate {
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
        locals: [],
        loops: []
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
                            this.actions.content[contextProp] = { ...actions.content[contextProp], ...this.actions.content[contextProp] };
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
            this.contextSchema.globals = [...this.contextSchema.globals, ...contextSchema.globals];
        }
        if (contextSchema.locals) {
            this.contextSchema.locals = [...this.contextSchema.locals, ...contextSchema.locals];
        }
        if (contextSchema.loops) {
            this.contextSchema.loops = [...this.contextSchema.loops, ...contextSchema.loops];
        }
    }
    createInstance(component) {
        let context = new WebComponentTemplateContext(component, this.contextSchema, []);
        let content = this.template.content.cloneNode(true);
        let actions = this.actions;
        let instance = new WebComponentTemplateInstance(context, content, actions, component, this.loops);
        return instance;
    }
    addLoop(loop) {
        this.loops.push(loop);
    }
}

class WebComponentTemplateInstance {
    context;
    content;
    actions;
    component;
    _components;
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
        this.transformActionsListening();
        this.selectElements();
        this.bindEvents();
    }
    render() {
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
                else {
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
        if (id) {
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
            new PressManager(clone);
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
        let key = change.id + "_" + change.attrName;
        if (change.attrName == "@HTML") {
            if (change.path) {
                this.context.addChange(name, (path) => {
                    if (WebComponentTemplate.validatePath(path, change.path)) {
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
                    if (WebComponentTemplate.validatePath(path, change.path)) {
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
        if (injection.path) {
            this.context.addChange(name, (path) => {
                if (WebComponentTemplate.validatePath(path, injection.path)) {
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
        if (binding.path) {
            this.context.addChange(name, (path) => {
                if (WebComponentTemplate.validatePath(path, binding.path)) {
                    let valueToSet = WebComponentTemplate.getValueFromItem(binding.path, this.context.c);
                    for (const el of this._components[binding.id]) {
                        WebComponentTemplate.setValueToItem(binding.valueName, el, valueToSet);
                    }
                }
            });
        }
        else {
            binding.path = name;
            this.context.addChange(name, (path) => {
                let valueToSet = WebComponentTemplate.getValueFromItem(binding.path, this.context.c);
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
                            WebComponentTemplate.setValueToItem(binding.path, this.context.c, value);
                        });
                    }
                    let valueToSet = WebComponentTemplate.getValueFromItem(binding.path, this.context.c);
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
                            WebComponentTemplate.setValueToItem(binding.path, this.context.c, valueToSet);
                        });
                    }
                    let valueToSet = WebComponentTemplate.getValueFromItem(binding.path, this.context.c);
                    WebComponentTemplate.setValueToItem(binding.valueName, el, valueToSet);
                }
            });
        }
    }
    renderSubTemplate() {
        for (let loop of this.loops) {
            let localContext = JSON.parse(JSON.stringify(this.context.schema));
            localContext.loops.push({
                data: loop.data,
                index: loop.index,
                item: loop.item
            });
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
            let context = new WebComponentTemplateContext(this.component, localContext, [{ name: loop.index, value: i }]);
            let content = loop.template.template.content.cloneNode(true);
            let actions = loop.template.actions;
            let instance = new WebComponentTemplateInstance(context, content, actions, this.component, loop.template.loops);
            instance.render();
            anchor.parentNode.insertBefore(instance.content, anchor);
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
                    let context = new WebComponentTemplateContext(this.component, localContext, [{ name: loop.index, value: index }]);
                    let content = loop.template.template.content.cloneNode(true);
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
                    anchor.parentNode.insertBefore(instance.content, anchor);
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

class ResizeObserver {
    callback;
    targets;
    fpsInterval;
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
            ResizeObserver.resizeObserverClassByObject[target["sourceIndex"]] = [];
            ResizeObserver.getUniqueInstance().observe(target);
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

class ResourceLoader {
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

class DragAndDrop {
    /**
     * Default offset before drag element
     */
    static defaultOffsetDrag = 20;
    pressManager;
    options;
    startCursorPosition;
    startElementPosition;
    isEnable = true;
    constructor(options) {
        this.options = this.getDefaultOptions();
        this.mergeProperties(options);
        this.mergeFunctions(options);
        this.init();
    }
    getDefaultOptions() {
        return {
            applyDrag: true,
            element: null,
            elementTrigger: null,
            offsetDrag: DragAndDrop.defaultOffsetDrag,
            shadow: {
                enable: false,
                container: document.body,
                removeOnStop: true,
                transform: () => { }
            },
            strict: false,
            targets: [],
            usePercent: false,
            isDragEnable: () => true,
            getZoom: () => 1,
            getOffsetX: () => 0,
            getOffsetY: () => 0,
            onPointerDown: (e) => { },
            onPointerUp: (e) => { },
            onStart: (e) => { },
            onMove: (e) => { },
            onStop: (e) => { },
            onDrop: (element, targets) => { }
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
        this.defaultMerge(options, "strict");
        this.defaultMerge(options, "targets");
        this.defaultMerge(options, "usePercent");
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
    }
    defaultMerge(options, name) {
        if (options[name] !== void 0) {
            this.options[name] = options[name];
        }
    }
    init() {
        this.options.elementTrigger.style.touchAction = 'none';
        this.pressManager = new PressManager({
            element: this.options.elementTrigger,
            onPressStart: this.onPressStart.bind(this),
            onPressEnd: this.onPressEnd.bind(this),
            onDragStart: this.onDragStart.bind(this),
            onDrag: this.onDrag.bind(this),
            onDragEnd: this.onDragEnd.bind(this),
            offsetDrag: this.options.offsetDrag
        });
    }
    draggableElement;
    positionShadowRelativeToElement;
    onPressStart(e) {
        this.options.onPointerDown(e);
    }
    onPressEnd(e) {
        this.options.onPointerUp(e);
    }
    onDragStart(e) {
        this.isEnable = this.options.isDragEnable();
        if (!this.isEnable) {
            return;
        }
        this.draggableElement = this.options.element;
        this.startCursorPosition = {
            x: e.pageX,
            y: e.pageY
        };
        this.startElementPosition = {
            x: this.draggableElement.offsetLeft,
            y: this.draggableElement.offsetTop
        };
        if (this.options.shadow.enable) {
            this.draggableElement = this.options.element.cloneNode(true);
            let elBox = this.options.element.getBoundingClientRect();
            let containerBox = this.options.shadow.container.getBoundingClientRect();
            this.positionShadowRelativeToElement = {
                x: elBox.x - containerBox.x,
                y: elBox.y - containerBox.y
            };
            if (this.options.applyDrag) {
                this.draggableElement.style.position = "absolute";
                this.draggableElement.style.top = this.positionShadowRelativeToElement.y + this.options.getOffsetY() + 'px';
                this.draggableElement.style.left = this.positionShadowRelativeToElement.x + this.options.getOffsetX() + 'px';
            }
            this.options.shadow.transform(this.draggableElement);
            this.options.shadow.container.appendChild(this.draggableElement);
        }
        this.options.onStart(e);
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
        let targets = this.getMatchingTargets();
        if (this.options.shadow.enable && this.options.shadow.removeOnStop) {
            this.draggableElement.parentNode?.removeChild(this.draggableElement);
        }
        if (targets.length > 0) {
            this.options.onDrop(this.draggableElement, targets);
        }
        this.options.onStop(e);
    }
    setPosition(position) {
        if (this.options.usePercent) {
            let elementParent = this.draggableElement.offsetParent;
            const percentLeft = (position.x / elementParent.offsetWidth) * 100;
            const percentTop = (position.y / elementParent.offsetHeight) * 100;
            if (this.options.applyDrag) {
                this.draggableElement.style.left = percentLeft + '%';
                this.draggableElement.style.top = percentTop + '%';
            }
            return {
                x: percentLeft,
                y: percentTop
            };
        }
        else {
            if (this.options.applyDrag) {
                this.draggableElement.style.left = position.x + 'px';
                this.draggableElement.style.top = position.y + 'px';
            }
        }
        return position;
    }
    /**
     * Get targets within the current element position is matching
     */
    getMatchingTargets() {
        let matchingTargets = [];
        for (let target of this.options.targets) {
            const elementCoordinates = this.draggableElement.getBoundingClientRect();
            const targetCoordinates = target.getBoundingClientRect();
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
     * Get element currently dragging
     */
    getElementDrag() {
        return this.draggableElement;
    }
    /**
     * Set targets where to drop
     */
    setTargets(targets) {
        this.options.targets = targets;
    }
    /**
     * Destroy the current drag&drop instance
     */
    destroy() {
        this.pressManager.destroy();
    }
}

class Animation {
    /**
     * Default FPS for all Animation if not set inside options
     */
    static FPS_DEFAULT = 60;
    options;
    nextFrame;
    fpsInterval;
    continueAnimation = false;
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
        this.fpsInterval = 1000 / this.options.fps;
    }
    animate() {
        let now = window.performance.now();
        let elapsed = now - this.nextFrame;
        if (elapsed <= this.fpsInterval) {
            requestAnimationFrame(() => this.animate());
            return;
        }
        this.nextFrame = now - (elapsed % this.fpsInterval);
        setTimeout(() => {
            this.options.animate();
        }, 0);
        if (this.continueAnimation) {
            requestAnimationFrame(() => this.animate());
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
Aventus.WebComponentInstance=WebComponentInstance;
WebComponentInstance.Namespace='Aventus';
Aventus.ElementExtension=ElementExtension;
ElementExtension.Namespace='Aventus';
Aventus.Instance=Instance;
Instance.Namespace='Aventus';
Aventus.Style=Style;
Style.Namespace='Aventus';
Aventus.WebComponent=WebComponent;
WebComponent.Namespace='Aventus';
Aventus.Callback=Callback;
Callback.Namespace='Aventus';
Aventus.Mutex=Mutex;
Mutex.Namespace='Aventus';
Aventus.StateManager=StateManager;
StateManager.Namespace='Aventus';
Aventus.WatchAction=WatchAction;
Aventus.Watcher=Watcher;
Watcher.Namespace='Aventus';
Aventus.PressManager=PressManager;
PressManager.Namespace='Aventus';
Aventus.State=State;
State.Namespace='Aventus';
Aventus.EmptyState=EmptyState;
EmptyState.Namespace='Aventus';
Aventus.WebComponentTemplateContext=WebComponentTemplateContext;
WebComponentTemplateContext.Namespace='Aventus';
Aventus.WebComponentTemplate=WebComponentTemplate;
WebComponentTemplate.Namespace='Aventus';
Aventus.WebComponentTemplateInstance=WebComponentTemplateInstance;
WebComponentTemplateInstance.Namespace='Aventus';
Aventus.ResizeObserver=ResizeObserver;
ResizeObserver.Namespace='Aventus';
Aventus.ResourceLoader=ResourceLoader;
ResourceLoader.Namespace='Aventus';
Aventus.DragAndDrop=DragAndDrop;
DragAndDrop.Namespace='Aventus';
Aventus.Animation=Animation;
Animation.Namespace='Aventus';
})(Aventus);

var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const moduleName = `Aventus`;


class App extends Aventus.WebComponent {
    static __style = `:host{display:flex;margin-left:400px;margin-top:200px}`;
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
        blocks: { 'default':`<av-checkbox label="My checkbox"></av-checkbox>` }
    });
}
    getClassName() {
        return "App";
    }
}
if(!window.customElements.get('av-app')){window.customElements.define('av-app', App);Aventus.WebComponentInstance.registerDefinition(App);}

class RouterLink extends Aventus.WebComponent {
    get 'state'() {
                    return this.getAttribute('state');
                }
                set 'state'(val) {
                    if(val === undefined || val === null){this.removeAttribute('state')}
                    else{this.setAttribute('state',val)}
                }get 'active_state'() {
                    return this.getAttribute('active_state');
                }
                set 'active_state'(val) {
                    if(val === undefined || val === null){this.removeAttribute('active_state')}
                    else{this.setAttribute('active_state',val)}
                }    onActiveChange = new Aventus.Callback();
    static __style = ``;
    __getStatic() {
        return RouterLink;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(RouterLink.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "RouterLink";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('state')){ this['state'] = ""; }if(!this.hasAttribute('active_state')){ this['active_state'] = ""; } }
    addClickEvent() {
        new Aventus.PressManager({
            element: this,
            onPress: () => {
                Aventus.State.activate(this.state, Aventus.Instance.get(RouterStateManager));
            }
        });
    }
    registerActiveStateListener() {
        let activeState = this.state;
        if (this.active_state) {
            activeState = this.active_state;
        }
        Aventus.Instance.get(RouterStateManager).subscribe(activeState, {
            active: () => {
                this.classList.add("active");
                this.onActiveChange.trigger([true]);
            },
            inactive: () => {
                this.classList.remove("active");
                this.onActiveChange.trigger([false]);
            }
        });
    }
    postCreation() {
        this.registerActiveStateListener();
        this.addClickEvent();
    }
}
if(!window.customElements.get('av-router-link')){window.customElements.define('av-router-link', RouterLink);Aventus.WebComponentInstance.registerDefinition(RouterLink);}

class RouterStateManager extends Aventus.StateManager {
    static getInstance() {
        return Aventus.Instance.get(RouterStateManager);
    }
}

class Router extends Aventus.WebComponent {
    oldPage;
    allRoutes = {};
    activePath = "";
    oneStateActive = false;
    showPageMutex = new Aventus.Mutex();
    get stateManager() {
        return Aventus.Instance.get(RouterStateManager);
    }
    page404;
    static __style = `:host{display:block}`;
    constructor() {            super();            this.validError404 = this.validError404.bind(this);if (this.constructor == Router) { throw "can't instanciate an abstract class"; } }
    __getStatic() {
        return Router;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Router.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'before':`<slot name="before"></slot>`,'after':`<slot name="after"></slot>` }, 
        blocks: { 'default':`<slot name="before"></slot><div class="content" _id="router_0"></div><slot name="after"></slot>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "contentEl",
      "ids": [
        "router_0"
      ]
    }
  ]
}); }
    getClassName() {
        return "Router";
    }
    addRouteAsync(options) {
        this.allRoutes[options.route] = options;
    }
    addRoute(route, elementCtr) {
        this.allRoutes[route] = {
            route: route,
            scriptUrl: '',
            render: () => elementCtr
        };
    }
    register() {
        try {
            this.defineRoutes();
            this.stateManager.onAfterStateChanged(this.validError404);
            for (let key in this.allRoutes) {
                this.initRoute(key);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    initRoute(path) {
        let element = undefined;
        let allRoutes = this.allRoutes;
        this.stateManager.subscribe(path, {
            active: (currentState) => {
                this.oneStateActive = true;
                this.showPageMutex.safeRunLastAsync(async () => {
                    if (!element) {
                        let options = allRoutes[path];
                        if (options.scriptUrl != "") {
                            await Aventus.ResourceLoader.loadInHead(options.scriptUrl);
                        }
                        let constructor = options.render();
                        element = new constructor;
                        element.currentRouter = this;
                        this.contentEl.appendChild(element);
                    }
                    if (this.oldPage && this.oldPage != element) {
                        await this.oldPage.hide();
                    }
                    let oldPage = this.oldPage;
                    let oldUrl = this.activePath;
                    await element.show();
                    this.oldPage = element;
                    this.activePath = path;
                    if (window.location.pathname != currentState.name) {
                        let newUrl = window.location.origin + currentState.name;
                        document.title = element.pageTitle();
                        window.history.pushState({}, element.pageTitle(), newUrl);
                    }
                    this.onNewPage(oldUrl, oldPage, path, element);
                });
            },
            inactive: () => {
                this.oneStateActive = false;
            }
        });
    }
    async validError404() {
        if (!this.oneStateActive) {
            let Page404 = this.error404(this.stateManager.getState());
            if (Page404) {
                if (!this.page404) {
                    this.page404 = new Page404();
                    this.page404.currentRouter = this;
                    this.contentEl.appendChild(this.page404);
                }
                if (this.oldPage && this.oldPage != this.page404) {
                    await this.oldPage.hide();
                }
                await this.page404.show();
                this.oldPage = this.page404;
                this.activePath = '';
            }
        }
    }
    error404(state) {
        return null;
    }
    onNewPage(oldUrl, oldPage, newUrl, newPage) {
    }
    getSlugs() {
        return this.stateManager.getStateSlugs(this.activePath);
    }
    postCreation() {
        this.register();
        if (window.localStorage.getItem("navigation_url")) {
            Aventus.State.activate(window.localStorage.getItem("navigation_url"), this.stateManager);
            window.localStorage.removeItem("navigation_url");
        }
        else {
            Aventus.State.activate(window.location.pathname, this.stateManager);
        }
        window.onpopstate = (e) => {
            if (window.location.pathname != this.stateManager.getState().name) {
                Aventus.State.activate(window.location.pathname, this.stateManager);
            }
        };
    }
}

class Page extends Aventus.WebComponent {
    static get observedAttributes() {return ["visible"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'visible'() {
                return this.hasAttribute('visible');
            }
            set 'visible'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('visible', 'true');
                } else{
                    this.removeAttribute('visible');
                }
            }    currentRouter;
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("visible", ((target) => {
    if (target.visible) {
        target.onShow();
    }
    else {
        target.onHide();
    }
})); }
    static __style = `:host{display:none}:host([visible]){display:block}`;
    constructor() { super(); if (this.constructor == Page) { throw "can't instanciate an abstract class"; } }
    __getStatic() {
        return Page;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Page.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Page";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('visible')) { this.attributeChangedCallback('visible', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('visible'); }
    __listBoolProps() { return ["visible"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    async show() {
        this.visible = true;
    }
    async hide() {
        this.visible = false;
    }
}

class Scrollable extends Aventus.WebComponent {
    static get observedAttributes() {return ["zoom"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'y_scroll_visible'() {
                return this.hasAttribute('y_scroll_visible');
            }
            set 'y_scroll_visible'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('y_scroll_visible', 'true');
                } else{
                    this.removeAttribute('y_scroll_visible');
                }
            }get 'x_scroll_visible'() {
                return this.hasAttribute('x_scroll_visible');
            }
            set 'x_scroll_visible'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('x_scroll_visible', 'true');
                } else{
                    this.removeAttribute('x_scroll_visible');
                }
            }get 'x'() {
                    return Number(this.getAttribute('x'));
                }
                set 'x'(val) {
                    if(val === undefined || val === null){this.removeAttribute('x')}
                    else{this.setAttribute('x',val)}
                }get 'y'() {
                    return Number(this.getAttribute('y'));
                }
                set 'y'(val) {
                    if(val === undefined || val === null){this.removeAttribute('y')}
                    else{this.setAttribute('y',val)}
                }get 'floating_scroll'() {
                return this.hasAttribute('floating_scroll');
            }
            set 'floating_scroll'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('floating_scroll', 'true');
                } else{
                    this.removeAttribute('floating_scroll');
                }
            }get 'allow_x_scroll'() {
                return this.hasAttribute('allow_x_scroll');
            }
            set 'allow_x_scroll'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('allow_x_scroll', 'true');
                } else{
                    this.removeAttribute('allow_x_scroll');
                }
            }get 'auto_hide'() {
                return this.hasAttribute('auto_hide');
            }
            set 'auto_hide'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('auto_hide', 'true');
                } else{
                    this.removeAttribute('auto_hide');
                }
            }get 'no_transition'() {
                return this.hasAttribute('no_transition');
            }
            set 'no_transition'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('no_transition', 'true');
                } else{
                    this.removeAttribute('no_transition');
                }
            }get 'no_user_select'() {
                return this.hasAttribute('no_user_select');
            }
            set 'no_user_select'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('no_user_select', 'true');
                } else{
                    this.removeAttribute('no_user_select');
                }
            }    get 'zoom'() {
                    return Number(this.getAttribute('zoom'));
                }
                set 'zoom'(val) {
                    if(val === undefined || val === null){this.removeAttribute('zoom')}
                    else{this.setAttribute('zoom',val)}
                }    observer;
    displayWidth = 0;
    displayHeight = 0;
    maxX = 0;
    marginX = 0;
    maxY = 0;
    marginY = 0;
    hideDelayX;
    hideDelayY;
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("zoom", ((target) => {
    target.changeZoom();
})); }
    static __style = `:host{--internal-scrollbar-container-color: var(--scrollbar-container-color, transparent);--internal-scrollbar-color: var(--scrollbar-color, #757575);--internal-scrollbar-active-color: var(--scrollbar-active-color, #858585);--internal-scroller-width: var(--scroller-width, 6px);--internal-scroller-top: var(--scroller-top, 3px);--internal-scroller-bottom: var(--scroller-bottom, 3px);--internal-scroller-right: var(--scroller-right, 3px);--internal-scroller-left: var(--scroller-left, 3px);--internal-scroller-transition: var(--scroller-transition, 0.5s)}:host{display:block;height:100%;overflow:hidden;position:relative;-webkit-user-drag:none;-khtml-user-drag:none;-moz-user-drag:none;-o-user-drag:none;width:100%}:host .scroll-main-container{display:block;height:100%;position:relative;width:100%}:host .scroll-main-container .content-zoom{display:block;height:100%;position:relative;transform-origin:0 0;width:100%;z-index:4}:host .scroll-main-container .content-zoom .content-hidder{display:block;height:100%;overflow:hidden;position:relative;width:100%}:host .scroll-main-container .content-zoom .content-hidder .content-wrapper{display:inline-block;height:auto;min-width:100%;position:relative;transition:transform var(--internal-scroller-transition);width:100%}:host .scroll-main-container .scroller-wrapper .container-scroller{display:none;overflow:hidden;position:absolute;z-index:5}:host .scroll-main-container .scroller-wrapper .container-scroller .shadow-scroller{background-color:var(--internal-scrollbar-container-color);border-radius:5px}:host .scroll-main-container .scroller-wrapper .container-scroller .shadow-scroller .scroller{background-color:var(--internal-scrollbar-color);border-radius:5px;cursor:pointer;position:absolute;-webkit-tap-highlight-color:rgba(0,0,0,0);touch-action:none;z-index:5}:host .scroll-main-container .scroller-wrapper .container-scroller .scroller.active{background-color:var(--internal-scrollbar-active-color);transition:none !important}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical{height:calc(100% - var(--internal-scroller-bottom)*2 - var(--internal-scroller-width));padding-left:var(--internal-scroller-left);right:var(--internal-scroller-right);top:var(--internal-scroller-bottom);transform:0;transition:transform .2s ease-in-out;width:calc(var(--internal-scroller-width) + var(--internal-scroller-left))}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical.hide{transform:translateX(calc(var(--internal-scroller-width) + var(--internal-scroller-left)))}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical .shadow-scroller{height:100%}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical .shadow-scroller .scroller{transition:top var(--internal-scroller-transition) linear;width:calc(100% - var(--internal-scroller-left))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal{bottom:var(--internal-scroller-bottom);height:calc(var(--internal-scroller-width) + var(--internal-scroller-top));left:var(--internal-scroller-right);padding-top:var(--internal-scroller-top);transform:0;transition:transform .2s ease-in-out;width:calc(100% - var(--internal-scroller-right)*2 - var(--internal-scroller-width))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal.hide{transform:translateY(calc(var(--internal-scroller-width) + var(--internal-scroller-top)))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal .shadow-scroller{height:100%}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal .shadow-scroller .scroller{height:calc(100% - var(--internal-scroller-top));transition:left var(--internal-scroller-transition) linear}:host([allow_x_scroll]) .scroll-main-container .content-zoom .content-hidder .content-wrapper{width:auto}:host([y_scroll_visible]) .scroll-main-container .scroller-wrapper .container-scroller.vertical{display:block}:host([x_scroll_visible]) .scroll-main-container .scroller-wrapper .container-scroller.horizontal{display:block}:host([no_transition]){--internal-scroller-transition: 0ms}:host([no_user_select]) .content-wrapper *{user-select:none}:host([no_user_select]) ::slotted{user-select:none}`;
    constructor() {            super();            this.wheelAction = this.wheelAction.bind(this);            this.touchWheelAction = this.touchWheelAction.bind(this);        }
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
        blocks: { 'default':`<div class="scroll-main-container" _id="scrollable_0">    <div class="content-zoom" _id="scrollable_1">        <div class="content-hidder" _id="scrollable_2">            <div class="content-wrapper" _id="scrollable_3">                <slot></slot>            </div>        </div>    </div>    <div class="scroller-wrapper">        <div class="container-scroller vertical" _id="scrollable_4">            <div class="shadow-scroller">                <div class="scroller" _id="scrollable_5"></div>            </div>        </div>        <div class="container-scroller horizontal" _id="scrollable_6">            <div class="shadow-scroller">                <div class="scroller" _id="scrollable_7"></div>            </div>        </div>    </div></div>` }
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
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('y_scroll_visible')) { this.attributeChangedCallback('y_scroll_visible', false, false); }if(!this.hasAttribute('x_scroll_visible')) { this.attributeChangedCallback('x_scroll_visible', false, false); }if(!this.hasAttribute('x')){ this['x'] = undefined; }if(!this.hasAttribute('y')){ this['y'] = undefined; }if(!this.hasAttribute('floating_scroll')) { this.attributeChangedCallback('floating_scroll', false, false); }if(!this.hasAttribute('allow_x_scroll')) { this.attributeChangedCallback('allow_x_scroll', false, false); }if(!this.hasAttribute('auto_hide')) { this.attributeChangedCallback('auto_hide', false, false); }if(!this.hasAttribute('no_transition')) { this.attributeChangedCallback('no_transition', false, false); }if(!this.hasAttribute('no_user_select')) { this.attributeChangedCallback('no_user_select', false, false); }if(!this.hasAttribute('zoom')){ this['zoom'] = 1; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('zoom'); }
    __listBoolProps() { return ["y_scroll_visible","x_scroll_visible","floating_scroll","allow_x_scroll","auto_hide","no_transition","no_user_select"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    correctVerticalScrollValue(value) {
        if (value < 0) {
            value = 0;
        }
        else if (value > this.maxY) {
            value = this.maxY;
        }
        return value;
    }
    scrollVerticalScrollbar(percentValue) {
        let verticalValue = percentValue / 100 * this.contentWrapper.offsetHeight;
        this.scrollY(verticalValue);
    }
    scrollY(value) {
        if (this.maxY != 0) {
            this.y = this.correctVerticalScrollValue(value);
        }
        else {
            this.y = 0;
        }
        let scrollPosition = this.y / this.contentWrapper.offsetHeight * 100;
        if (this.auto_hide) {
            this.verticalScrollerContainer.classList.remove("hide");
            clearTimeout(this.hideDelayY);
            this.hideDelayY = setTimeout(() => {
                this.verticalScrollerContainer.classList.add("hide");
            }, 1000);
        }
        this.verticalScroller.style.top = `${scrollPosition}%`;
        this.contentWrapper.style.transform = `translate3d(${-1 * this.x}px, ${-1 * this.y}px, 0)`;
    }
    correctHorizontalScrollValue(value) {
        if (value < 0) {
            value = 0;
        }
        else if (value > this.maxX) {
            value = this.maxX;
        }
        return value;
    }
    scrollHorizontalScrollbar(percentValue) {
        let value = percentValue / 100 * this.contentWrapper.offsetWidth;
        this.scrollX(value);
    }
    scrollX(value) {
        if (this.maxX != 0) {
            this.x = this.correctHorizontalScrollValue(value);
        }
        else {
            this.x = 0;
        }
        let scrollPosition = this.x / this.contentWrapper.offsetWidth * 100;
        if (this.auto_hide) {
            this.horizontalScrollerContainer.classList.remove("hide");
            clearTimeout(this.hideDelayX);
            this.hideDelayX = setTimeout(() => {
                this.horizontalScrollerContainer.classList.add("hide");
            }, 1000);
        }
        this.horizontalScroller.style.left = `${scrollPosition}%`;
        this.contentWrapper.style.transform = `translate3d(${-1 * this.x}px, ${-1 * this.y}px, 0)`;
    }
    scrollToPosition(x, y) {
        this.scrollX(x);
        this.scrollY(y);
    }
    addAction() {
        this.addEventListener("wheel", this.wheelAction);
        this.addEventListener("touchstart", this.touchWheelAction);
        this.addVerticalScrollDrag();
        this.addHorizontalScrollDrag();
    }
    addVerticalScrollDrag() {
        this.verticalScroller.addEventListener("touchstart", (e) => {
            e.stopPropagation();
        });
        new Aventus.DragAndDrop({
            element: this.verticalScroller,
            applyDrag: false,
            usePercent: true,
            offsetDrag: 0,
            onStart: (e) => {
                this.no_transition = true;
                this.no_user_select = true;
                this.verticalScroller.classList.add("active");
            },
            onMove: (e, position) => {
                this.scrollVerticalScrollbar(position.y);
            },
            onStop: () => {
                this.no_transition = false;
                this.no_user_select = false;
                this.verticalScroller.classList.remove("active");
            },
        });
    }
    addHorizontalScrollDrag() {
        this.horizontalScroller.addEventListener("touchstart", (e) => {
            e.stopPropagation();
        });
        new Aventus.DragAndDrop({
            element: this.horizontalScroller,
            applyDrag: false,
            usePercent: true,
            offsetDrag: 0,
            onStart: (e) => {
                this.no_transition = true;
                this.no_user_select = true;
                this.horizontalScroller.classList.add("active");
            },
            onMove: (e, position) => {
                this.scrollHorizontalScrollbar(position.x);
            },
            onStop: () => {
                this.no_transition = false;
                this.no_user_select = false;
                this.horizontalScroller.classList.remove("active");
            },
        });
    }
    wheelAction(e) {
        if (e.altKey) {
            if (this.x_scroll_visible) {
                let triggerEvent = (this.x == 0 && e.deltaY < 0) || (this.x == this.maxX && e.deltaY > 0);
                this.scrollX(this.x + e.deltaY);
                if (!triggerEvent) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }
        else {
            if (this.y_scroll_visible) {
                let triggerEvent = (this.y == 0 && e.deltaY < 0) || (this.y == this.maxY && e.deltaY > 0);
                this.scrollY(this.y + e.deltaY);
                if (!triggerEvent) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }
    }
    touchWheelAction(e) {
        let startX = e.touches[0].pageX;
        let startY = e.touches[0].pageY;
        let startHorizontal = this.x;
        let startVertical = this.y;
        this.no_transition = true;
        let inertiaArrayY = new Map();
        let inertiaArrayX = new Map();
        let averageY = 0;
        let averageX = 0;
        let lastDiffY = 0;
        let lastDiffX = 0;
        let touchMove = (e) => {
            let diffX = startX - e.touches[0].pageX;
            let diffY = startY - e.touches[0].pageY;
            // inertia
            if (inertiaArrayY.size == 5) {
                inertiaArrayY.delete(inertiaArrayY.keys()[0]);
            }
            if (inertiaArrayX.size == 5) {
                inertiaArrayX.delete(inertiaArrayX.keys()[0]);
            }
            inertiaArrayX.set(new Date(), diffX - lastDiffX);
            inertiaArrayY.set(new Date(), diffY - lastDiffY);
            lastDiffX = diffX;
            lastDiffY = diffY;
            this.scrollX(startHorizontal + diffX);
            this.scrollY(startVertical + diffY);
        };
        let touchEnd = (e) => {
            window.removeEventListener("touchmove", touchMove);
            window.removeEventListener("touchend", touchEnd);
            let date = new Date();
            let totX = 0;
            let totY = 0;
            let inertiaXRunning = false;
            let inertiaYRunning = false;
            for (let [dateEvent, value] of inertiaArrayX) {
                let factor = (1000) - (date.getTime() - dateEvent.getTime());
                if (factor < 0) {
                    factor = 0;
                }
                factor /= 1000;
                totX += value * factor;
            }
            for (let [dateEvent, value] of inertiaArrayY) {
                let factor = (1000) - (date.getTime() - dateEvent.getTime());
                if (factor < 0) {
                    factor = 0;
                }
                factor /= 1000;
                totY += value * factor;
            }
            if (inertiaArrayX.size > 0) {
                inertiaXRunning = true;
                averageX = Math.round(totX / inertiaArrayX.size);
                let breakX = averageX > 0 ? 1 : -1;
                let checkX = averageX > 0 ? () => averageX <= 0 : () => averageX >= 0;
                let intervalInertia = new Aventus.Animation({
                    animate: () => {
                        if (checkX()) {
                            intervalInertia.stop();
                        }
                        else {
                            averageX -= breakX;
                            lastDiffX += averageX;
                            this.scrollX(startHorizontal + lastDiffX);
                        }
                    },
                    stopped: () => {
                        inertiaXRunning = false;
                        if (!inertiaXRunning && !inertiaYRunning) {
                            this.no_transition = false;
                        }
                    },
                    fps: 60,
                });
                intervalInertia.start();
            }
            if (inertiaArrayY.size > 0) {
                inertiaYRunning = true;
                averageY = Math.round(totY / inertiaArrayY.size);
                let breakY = averageY > 0 ? 1 : -1;
                let checkY = averageY > 0 ? () => averageY <= 0 : () => averageY >= 0;
                let intervalInertia = new Aventus.Animation({
                    animate: () => {
                        if (checkY()) {
                            intervalInertia.stop();
                        }
                        else {
                            averageY -= breakY;
                            lastDiffY += averageY;
                            this.scrollY(startVertical + lastDiffY);
                        }
                    },
                    stopped: () => {
                        inertiaYRunning = false;
                        if (!inertiaXRunning && !inertiaYRunning) {
                            this.no_transition = false;
                        }
                    },
                    fps: 60,
                });
                intervalInertia.start();
            }
            if (!inertiaXRunning && !inertiaYRunning) {
                this.no_transition = false;
            }
        };
        window.addEventListener("touchmove", touchMove);
        window.addEventListener("touchend", touchEnd);
    }
    calculateRealSize() {
        const currentOffsetWidth = this.contentZoom.offsetWidth;
        const currentOffsetHeight = this.contentZoom.offsetHeight;
        if (this.zoom < 1) {
            // scale the container for zoom
            this.contentZoom.style.width = this.mainContainer.offsetWidth / this.zoom + 'px';
            this.contentZoom.style.height = this.mainContainer.offsetHeight / this.zoom + 'px';
            this.displayHeight = currentOffsetHeight;
            this.displayWidth = currentOffsetWidth;
        }
        else {
            this.displayHeight = currentOffsetHeight / this.zoom;
            this.displayWidth = currentOffsetWidth / this.zoom;
        }
    }
    calculatePositionHorizontalScrollerContainer() {
        const topMissing = this.mainContainer.offsetHeight - this.horizontalScrollerContainer.offsetTop;
        if (topMissing > 0 && this.x_scroll_visible && !this.floating_scroll) {
            this.contentHidder.style.height = 'calc(100% - ' + topMissing + 'px)';
            this.contentHidder.style.marginBottom = topMissing + 'px';
            this.marginX = topMissing;
        }
        else {
            this.contentHidder.style.height = '';
            this.contentHidder.style.marginBottom = '';
            this.marginX = 0;
        }
    }
    calculateSizeHorizontalScroller() {
        const horizontalScrollerHeight = ((this.displayWidth - this.marginX) / this.contentWrapper.offsetWidth * 100);
        this.horizontalScroller.style.width = horizontalScrollerHeight + '%';
        let maxScrollContent = this.contentWrapper.offsetWidth - this.displayWidth;
        if (maxScrollContent < 0) {
            maxScrollContent = 0;
        }
        this.maxX = maxScrollContent + this.marginX;
    }
    calculatePositionVerticalScrollerContainer() {
        const leftMissing = this.mainContainer.offsetWidth - this.verticalScrollerContainer.offsetLeft;
        if (leftMissing > 0 && this.y_scroll_visible && !this.floating_scroll) {
            this.contentHidder.style.width = 'calc(100% - ' + leftMissing + 'px)';
            this.contentHidder.style.marginRight = leftMissing + 'px';
            this.marginY = leftMissing;
        }
        else {
            this.contentHidder.style.width = '';
            this.contentHidder.style.marginRight = '';
            this.marginY = 0;
        }
    }
    calculateSizeVerticalScroller() {
        const verticalScrollerHeight = ((this.displayHeight - this.marginY) / this.contentWrapper.offsetHeight * 100);
        this.verticalScroller.style.height = verticalScrollerHeight + '%';
        let maxScrollContent = this.contentWrapper.offsetHeight - this.displayHeight;
        if (maxScrollContent < 0) {
            maxScrollContent = 0;
        }
        this.maxY = maxScrollContent + this.marginY;
    }
    changeZoom() {
        this.contentZoom.style.transform = 'scale(' + this.zoom + ')';
        this.dimensionRefreshed();
    }
    dimensionRefreshed() {
        this.calculateRealSize();
        if (this.contentWrapper.offsetHeight - this.displayHeight > 0) {
            if (!this.y_scroll_visible) {
                this.y_scroll_visible = true;
                this.calculatePositionVerticalScrollerContainer();
            }
            this.calculateSizeVerticalScroller();
            this.scrollY(this.y);
        }
        else if (this.y_scroll_visible) {
            this.y_scroll_visible = false;
            // clear space created by scrollbar
            this.contentHidder.style.width = '';
            this.contentHidder.style.marginRight = '';
            this.scrollY(0);
        }
        if (this.contentWrapper.offsetWidth - this.displayWidth > 0) {
            if (!this.x_scroll_visible) {
                this.x_scroll_visible = true;
                this.calculatePositionHorizontalScrollerContainer();
            }
            this.calculateSizeHorizontalScroller();
            this.scrollX(this.x);
        }
        else if (this.x_scroll_visible) {
            this.x_scroll_visible = false;
            // clear space created by scrollbar
            this.contentHidder.style.height = '';
            this.contentHidder.style.marginBottom = '';
            this.scrollX(0);
        }
    }
    createResizeObserver() {
        let inProgress = false;
        this.observer = new Aventus.ResizeObserver({
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
            this.createResizeObserver();
        }
        this.observer.observe(this.contentWrapper);
        this.observer.observe(this);
    }
    postCreation() {
        this.addResizeObserver();
        this.addAction();
        window['temp1'] = this;
    }
}
if(!window.customElements.get('av-scrollable')){window.customElements.define('av-scrollable', Scrollable);Aventus.WebComponentInstance.registerDefinition(Scrollable);}

class GridCol extends Aventus.WebComponent {
    get 'column'() {
                    return this.getAttribute('column');
                }
                set 'column'(val) {
                    if(val === undefined || val === null){this.removeAttribute('column')}
                    else{this.setAttribute('column',val)}
                }get 'row'() {
                    return this.getAttribute('row');
                }
                set 'row'(val) {
                    if(val === undefined || val === null){this.removeAttribute('row')}
                    else{this.setAttribute('row',val)}
                }get 'c_start'() {
                    return Number(this.getAttribute('c_start'));
                }
                set 'c_start'(val) {
                    if(val === undefined || val === null){this.removeAttribute('c_start')}
                    else{this.setAttribute('c_start',val)}
                }get 'c_end'() {
                    return Number(this.getAttribute('c_end'));
                }
                set 'c_end'(val) {
                    if(val === undefined || val === null){this.removeAttribute('c_end')}
                    else{this.setAttribute('c_end',val)}
                }    static __style = ``;
    __getStatic() {
        return GridCol;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(GridCol.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "GridCol";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('column')){ this['column'] = undefined; }if(!this.hasAttribute('row')){ this['row'] = undefined; }if(!this.hasAttribute('c_start')){ this['c_start'] = undefined; }if(!this.hasAttribute('c_end')){ this['c_end'] = undefined; } }
}
if(!window.customElements.get('av-grid-col')){window.customElements.define('av-grid-col', GridCol);Aventus.WebComponentInstance.registerDefinition(GridCol);}

class Grid extends Aventus.WebComponent {
    static get observedAttributes() {return ["cols"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'cols'() {
                    return Number(this.getAttribute('cols'));
                }
                set 'cols'(val) {
                    if(val === undefined || val === null){this.removeAttribute('cols')}
                    else{this.setAttribute('cols',val)}
                }    static __style = `:host{display:grid}:host([cols=j]){grid-template-columns:repeat(1, minmax(0, 1fr))}:host([cols=j]){grid-template-columns:repeat(2, minmax(0, 1fr))}:host([cols=j]){grid-template-columns:repeat(3, minmax(0, 1fr))}:host([cols=j]){grid-template-columns:repeat(4, minmax(0, 1fr))}:host([cols=j]){grid-template-columns:repeat(5, minmax(0, 1fr))}:host([cols=j]){grid-template-columns:repeat(6, minmax(0, 1fr))}:host([cols=j]){grid-template-columns:repeat(7, minmax(0, 1fr))}:host([cols=j]){grid-template-columns:repeat(8, minmax(0, 1fr))}:host([cols=j]){grid-template-columns:repeat(9, minmax(0, 1fr))}:host([cols=j]){grid-template-columns:repeat(10, minmax(0, 1fr))}:host([cols=j]){grid-template-columns:repeat(11, minmax(0, 1fr))}:host([cols=j]){grid-template-columns:repeat(12, minmax(0, 1fr))}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="0"]){margin-left:0%}::slotted(av-grid-col[offset_right_xs="0"]){margin-right:0%}::slotted(av-grid-col[size_xs="0"]){width:0%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="1"]){margin-left:8.3333333333%}::slotted(av-grid-col[offset_right_xs="1"]){margin-right:8.3333333333%}::slotted(av-grid-col[size_xs="1"]){width:8.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="2"]){margin-left:16.6666666667%}::slotted(av-grid-col[offset_right_xs="2"]){margin-right:16.6666666667%}::slotted(av-grid-col[size_xs="2"]){width:16.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="3"]){margin-left:25%}::slotted(av-grid-col[offset_right_xs="3"]){margin-right:25%}::slotted(av-grid-col[size_xs="3"]){width:25%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="4"]){margin-left:33.3333333333%}::slotted(av-grid-col[offset_right_xs="4"]){margin-right:33.3333333333%}::slotted(av-grid-col[size_xs="4"]){width:33.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="5"]){margin-left:41.6666666667%}::slotted(av-grid-col[offset_right_xs="5"]){margin-right:41.6666666667%}::slotted(av-grid-col[size_xs="5"]){width:41.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="6"]){margin-left:50%}::slotted(av-grid-col[offset_right_xs="6"]){margin-right:50%}::slotted(av-grid-col[size_xs="6"]){width:50%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="7"]){margin-left:58.3333333333%}::slotted(av-grid-col[offset_right_xs="7"]){margin-right:58.3333333333%}::slotted(av-grid-col[size_xs="7"]){width:58.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="8"]){margin-left:66.6666666667%}::slotted(av-grid-col[offset_right_xs="8"]){margin-right:66.6666666667%}::slotted(av-grid-col[size_xs="8"]){width:66.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="9"]){margin-left:75%}::slotted(av-grid-col[offset_right_xs="9"]){margin-right:75%}::slotted(av-grid-col[size_xs="9"]){width:75%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="10"]){margin-left:83.3333333333%}::slotted(av-grid-col[offset_right_xs="10"]){margin-right:83.3333333333%}::slotted(av-grid-col[size_xs="10"]){width:83.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="11"]){margin-left:91.6666666667%}::slotted(av-grid-col[offset_right_xs="11"]){margin-right:91.6666666667%}::slotted(av-grid-col[size_xs="11"]){width:91.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xs="12"]){margin-left:100%}::slotted(av-grid-col[offset_right_xs="12"]){margin-right:100%}::slotted(av-grid-col[size_xs="12"]){width:100%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="0"]){margin-left:0%}::slotted(av-grid-col[offset_right_sm="0"]){margin-right:0%}::slotted(av-grid-col[size_sm="0"]){width:0%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="1"]){margin-left:8.3333333333%}::slotted(av-grid-col[offset_right_sm="1"]){margin-right:8.3333333333%}::slotted(av-grid-col[size_sm="1"]){width:8.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="2"]){margin-left:16.6666666667%}::slotted(av-grid-col[offset_right_sm="2"]){margin-right:16.6666666667%}::slotted(av-grid-col[size_sm="2"]){width:16.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="3"]){margin-left:25%}::slotted(av-grid-col[offset_right_sm="3"]){margin-right:25%}::slotted(av-grid-col[size_sm="3"]){width:25%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="4"]){margin-left:33.3333333333%}::slotted(av-grid-col[offset_right_sm="4"]){margin-right:33.3333333333%}::slotted(av-grid-col[size_sm="4"]){width:33.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="5"]){margin-left:41.6666666667%}::slotted(av-grid-col[offset_right_sm="5"]){margin-right:41.6666666667%}::slotted(av-grid-col[size_sm="5"]){width:41.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="6"]){margin-left:50%}::slotted(av-grid-col[offset_right_sm="6"]){margin-right:50%}::slotted(av-grid-col[size_sm="6"]){width:50%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="7"]){margin-left:58.3333333333%}::slotted(av-grid-col[offset_right_sm="7"]){margin-right:58.3333333333%}::slotted(av-grid-col[size_sm="7"]){width:58.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="8"]){margin-left:66.6666666667%}::slotted(av-grid-col[offset_right_sm="8"]){margin-right:66.6666666667%}::slotted(av-grid-col[size_sm="8"]){width:66.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="9"]){margin-left:75%}::slotted(av-grid-col[offset_right_sm="9"]){margin-right:75%}::slotted(av-grid-col[size_sm="9"]){width:75%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="10"]){margin-left:83.3333333333%}::slotted(av-grid-col[offset_right_sm="10"]){margin-right:83.3333333333%}::slotted(av-grid-col[size_sm="10"]){width:83.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="11"]){margin-left:91.6666666667%}::slotted(av-grid-col[offset_right_sm="11"]){margin-right:91.6666666667%}::slotted(av-grid-col[size_sm="11"]){width:91.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_sm="12"]){margin-left:100%}::slotted(av-grid-col[offset_right_sm="12"]){margin-right:100%}::slotted(av-grid-col[size_sm="12"]){width:100%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="0"]){margin-left:0%}::slotted(av-grid-col[offset_right_md="0"]){margin-right:0%}::slotted(av-grid-col[size_md="0"]){width:0%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="1"]){margin-left:8.3333333333%}::slotted(av-grid-col[offset_right_md="1"]){margin-right:8.3333333333%}::slotted(av-grid-col[size_md="1"]){width:8.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="2"]){margin-left:16.6666666667%}::slotted(av-grid-col[offset_right_md="2"]){margin-right:16.6666666667%}::slotted(av-grid-col[size_md="2"]){width:16.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="3"]){margin-left:25%}::slotted(av-grid-col[offset_right_md="3"]){margin-right:25%}::slotted(av-grid-col[size_md="3"]){width:25%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="4"]){margin-left:33.3333333333%}::slotted(av-grid-col[offset_right_md="4"]){margin-right:33.3333333333%}::slotted(av-grid-col[size_md="4"]){width:33.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="5"]){margin-left:41.6666666667%}::slotted(av-grid-col[offset_right_md="5"]){margin-right:41.6666666667%}::slotted(av-grid-col[size_md="5"]){width:41.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="6"]){margin-left:50%}::slotted(av-grid-col[offset_right_md="6"]){margin-right:50%}::slotted(av-grid-col[size_md="6"]){width:50%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="7"]){margin-left:58.3333333333%}::slotted(av-grid-col[offset_right_md="7"]){margin-right:58.3333333333%}::slotted(av-grid-col[size_md="7"]){width:58.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="8"]){margin-left:66.6666666667%}::slotted(av-grid-col[offset_right_md="8"]){margin-right:66.6666666667%}::slotted(av-grid-col[size_md="8"]){width:66.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="9"]){margin-left:75%}::slotted(av-grid-col[offset_right_md="9"]){margin-right:75%}::slotted(av-grid-col[size_md="9"]){width:75%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="10"]){margin-left:83.3333333333%}::slotted(av-grid-col[offset_right_md="10"]){margin-right:83.3333333333%}::slotted(av-grid-col[size_md="10"]){width:83.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="11"]){margin-left:91.6666666667%}::slotted(av-grid-col[offset_right_md="11"]){margin-right:91.6666666667%}::slotted(av-grid-col[size_md="11"]){width:91.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_md="12"]){margin-left:100%}::slotted(av-grid-col[offset_right_md="12"]){margin-right:100%}::slotted(av-grid-col[size_md="12"]){width:100%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="0"]){margin-left:0%}::slotted(av-grid-col[offset_right_lg="0"]){margin-right:0%}::slotted(av-grid-col[size_lg="0"]){width:0%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="1"]){margin-left:8.3333333333%}::slotted(av-grid-col[offset_right_lg="1"]){margin-right:8.3333333333%}::slotted(av-grid-col[size_lg="1"]){width:8.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="2"]){margin-left:16.6666666667%}::slotted(av-grid-col[offset_right_lg="2"]){margin-right:16.6666666667%}::slotted(av-grid-col[size_lg="2"]){width:16.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="3"]){margin-left:25%}::slotted(av-grid-col[offset_right_lg="3"]){margin-right:25%}::slotted(av-grid-col[size_lg="3"]){width:25%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="4"]){margin-left:33.3333333333%}::slotted(av-grid-col[offset_right_lg="4"]){margin-right:33.3333333333%}::slotted(av-grid-col[size_lg="4"]){width:33.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="5"]){margin-left:41.6666666667%}::slotted(av-grid-col[offset_right_lg="5"]){margin-right:41.6666666667%}::slotted(av-grid-col[size_lg="5"]){width:41.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="6"]){margin-left:50%}::slotted(av-grid-col[offset_right_lg="6"]){margin-right:50%}::slotted(av-grid-col[size_lg="6"]){width:50%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="7"]){margin-left:58.3333333333%}::slotted(av-grid-col[offset_right_lg="7"]){margin-right:58.3333333333%}::slotted(av-grid-col[size_lg="7"]){width:58.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="8"]){margin-left:66.6666666667%}::slotted(av-grid-col[offset_right_lg="8"]){margin-right:66.6666666667%}::slotted(av-grid-col[size_lg="8"]){width:66.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="9"]){margin-left:75%}::slotted(av-grid-col[offset_right_lg="9"]){margin-right:75%}::slotted(av-grid-col[size_lg="9"]){width:75%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="10"]){margin-left:83.3333333333%}::slotted(av-grid-col[offset_right_lg="10"]){margin-right:83.3333333333%}::slotted(av-grid-col[size_lg="10"]){width:83.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="11"]){margin-left:91.6666666667%}::slotted(av-grid-col[offset_right_lg="11"]){margin-right:91.6666666667%}::slotted(av-grid-col[size_lg="11"]){width:91.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_lg="12"]){margin-left:100%}::slotted(av-grid-col[offset_right_lg="12"]){margin-right:100%}::slotted(av-grid-col[size_lg="12"]){width:100%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="0"]){margin-left:0%}::slotted(av-grid-col[offset_right_xl="0"]){margin-right:0%}::slotted(av-grid-col[size_xl="0"]){width:0%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="1"]){margin-left:8.3333333333%}::slotted(av-grid-col[offset_right_xl="1"]){margin-right:8.3333333333%}::slotted(av-grid-col[size_xl="1"]){width:8.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="2"]){margin-left:16.6666666667%}::slotted(av-grid-col[offset_right_xl="2"]){margin-right:16.6666666667%}::slotted(av-grid-col[size_xl="2"]){width:16.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="3"]){margin-left:25%}::slotted(av-grid-col[offset_right_xl="3"]){margin-right:25%}::slotted(av-grid-col[size_xl="3"]){width:25%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="4"]){margin-left:33.3333333333%}::slotted(av-grid-col[offset_right_xl="4"]){margin-right:33.3333333333%}::slotted(av-grid-col[size_xl="4"]){width:33.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="5"]){margin-left:41.6666666667%}::slotted(av-grid-col[offset_right_xl="5"]){margin-right:41.6666666667%}::slotted(av-grid-col[size_xl="5"]){width:41.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="6"]){margin-left:50%}::slotted(av-grid-col[offset_right_xl="6"]){margin-right:50%}::slotted(av-grid-col[size_xl="6"]){width:50%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="7"]){margin-left:58.3333333333%}::slotted(av-grid-col[offset_right_xl="7"]){margin-right:58.3333333333%}::slotted(av-grid-col[size_xl="7"]){width:58.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="8"]){margin-left:66.6666666667%}::slotted(av-grid-col[offset_right_xl="8"]){margin-right:66.6666666667%}::slotted(av-grid-col[size_xl="8"]){width:66.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="9"]){margin-left:75%}::slotted(av-grid-col[offset_right_xl="9"]){margin-right:75%}::slotted(av-grid-col[size_xl="9"]){width:75%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="10"]){margin-left:83.3333333333%}::slotted(av-grid-col[offset_right_xl="10"]){margin-right:83.3333333333%}::slotted(av-grid-col[size_xl="10"]){width:83.3333333333%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="11"]){margin-left:91.6666666667%}::slotted(av-grid-col[offset_right_xl="11"]){margin-right:91.6666666667%}::slotted(av-grid-col[size_xl="11"]){width:91.6666666667%}}@media screen and (max-width: 100px){::slotted(av-grid-col[offset_xl="12"]){margin-left:100%}::slotted(av-grid-col[offset_right_xl="12"]){margin-right:100%}::slotted(av-grid-col[size_xl="12"]){width:100%}}`;
    __getStatic() {
        return Grid;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Grid.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Grid";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('cols')){ this['cols'] = 12; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('cols'); }
}
if(!window.customElements.get('av-grid')){window.customElements.define('av-grid', Grid);Aventus.WebComponentInstance.registerDefinition(Grid);}

class DynamicRow extends Aventus.WebComponent {
    get 'max_width'() {
                    return this.getAttribute('max_width');
                }
                set 'max_width'(val) {
                    if(val === undefined || val === null){this.removeAttribute('max_width')}
                    else{this.setAttribute('max_width',val)}
                }    sizes = { "xs": 300, "sm": 540, "md": 720, "lg": 960, "xl": 1140 };
    static __style = `:host{display:flex;flex-wrap:wrap;flex-direction:row;width:100%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="0"]){margin-left:0%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="0"]){margin-right:0%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="0"]){width:0%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="1"]){margin-left:8.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="1"]){margin-right:8.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="1"]){width:8.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="2"]){margin-left:16.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="2"]){margin-right:16.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="2"]){width:16.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="3"]){margin-left:25%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="3"]){margin-right:25%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="3"]){width:25%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="4"]){margin-left:33.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="4"]){margin-right:33.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="4"]){width:33.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="5"]){margin-left:41.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="5"]){margin-right:41.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="5"]){width:41.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="6"]){margin-left:50%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="6"]){margin-right:50%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="6"]){width:50%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="7"]){margin-left:58.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="7"]){margin-right:58.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="7"]){width:58.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="8"]){margin-left:66.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="8"]){margin-right:66.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="8"]){width:66.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="9"]){margin-left:75%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="9"]){margin-right:75%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="9"]){width:75%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="10"]){margin-left:83.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="10"]){margin-right:83.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="10"]){width:83.3333333333%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="11"]){margin-left:91.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="11"]){margin-right:91.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="11"]){width:91.6666666667%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_xs="12"]){margin-left:100%}:host([max_width=""]) ::slotted(av-dynamic-col[offset_right_xs="12"]){margin-right:100%}:host([max_width=""]) ::slotted(av-dynamic-col[size_xs="12"]){width:100%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="0"]){margin-left:0%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="0"]){margin-right:0%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="0"]){width:0%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="1"]){margin-left:8.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="1"]){margin-right:8.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="1"]){width:8.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="2"]){margin-left:16.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="2"]){margin-right:16.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="2"]){width:16.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="3"]){margin-left:25%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="3"]){margin-right:25%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="3"]){width:25%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="4"]){margin-left:33.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="4"]){margin-right:33.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="4"]){width:33.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="5"]){margin-left:41.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="5"]){margin-right:41.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="5"]){width:41.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="6"]){margin-left:50%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="6"]){margin-right:50%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="6"]){width:50%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="7"]){margin-left:58.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="7"]){margin-right:58.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="7"]){width:58.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="8"]){margin-left:66.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="8"]){margin-right:66.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="8"]){width:66.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="9"]){margin-left:75%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="9"]){margin-right:75%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="9"]){width:75%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="10"]){margin-left:83.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="10"]){margin-right:83.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="10"]){width:83.3333333333%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="11"]){margin-left:91.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="11"]){margin-right:91.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="11"]){width:91.6666666667%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_xs="12"]){margin-left:100%}:host([max_width~=xs]) ::slotted(av-dynamic-col[offset_right_xs="12"]){margin-right:100%}:host([max_width~=xs]) ::slotted(av-dynamic-col[size_xs="12"]){width:100%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="0"]){margin-left:0%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="0"]){margin-right:0%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="0"]){width:0%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="1"]){margin-left:8.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="1"]){margin-right:8.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="1"]){width:8.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="2"]){margin-left:16.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="2"]){margin-right:16.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="2"]){width:16.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="3"]){margin-left:25%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="3"]){margin-right:25%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="3"]){width:25%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="4"]){margin-left:33.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="4"]){margin-right:33.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="4"]){width:33.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="5"]){margin-left:41.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="5"]){margin-right:41.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="5"]){width:41.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="6"]){margin-left:50%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="6"]){margin-right:50%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="6"]){width:50%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="7"]){margin-left:58.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="7"]){margin-right:58.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="7"]){width:58.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="8"]){margin-left:66.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="8"]){margin-right:66.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="8"]){width:66.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="9"]){margin-left:75%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="9"]){margin-right:75%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="9"]){width:75%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="10"]){margin-left:83.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="10"]){margin-right:83.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="10"]){width:83.3333333333%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="11"]){margin-left:91.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="11"]){margin-right:91.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="11"]){width:91.6666666667%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_sm="12"]){margin-left:100%}:host([max_width~=sm]) ::slotted(av-dynamic-col[offset_right_sm="12"]){margin-right:100%}:host([max_width~=sm]) ::slotted(av-dynamic-col[size_sm="12"]){width:100%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="0"]){margin-left:0%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="0"]){margin-right:0%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="0"]){width:0%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="1"]){margin-left:8.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="1"]){margin-right:8.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="1"]){width:8.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="2"]){margin-left:16.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="2"]){margin-right:16.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="2"]){width:16.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="3"]){margin-left:25%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="3"]){margin-right:25%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="3"]){width:25%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="4"]){margin-left:33.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="4"]){margin-right:33.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="4"]){width:33.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="5"]){margin-left:41.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="5"]){margin-right:41.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="5"]){width:41.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="6"]){margin-left:50%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="6"]){margin-right:50%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="6"]){width:50%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="7"]){margin-left:58.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="7"]){margin-right:58.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="7"]){width:58.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="8"]){margin-left:66.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="8"]){margin-right:66.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="8"]){width:66.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="9"]){margin-left:75%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="9"]){margin-right:75%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="9"]){width:75%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="10"]){margin-left:83.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="10"]){margin-right:83.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="10"]){width:83.3333333333%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="11"]){margin-left:91.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="11"]){margin-right:91.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="11"]){width:91.6666666667%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_md="12"]){margin-left:100%}:host([max_width~=md]) ::slotted(av-dynamic-col[offset_right_md="12"]){margin-right:100%}:host([max_width~=md]) ::slotted(av-dynamic-col[size_md="12"]){width:100%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="0"]){margin-left:0%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="0"]){margin-right:0%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="0"]){width:0%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="1"]){margin-left:8.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="1"]){margin-right:8.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="1"]){width:8.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="2"]){margin-left:16.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="2"]){margin-right:16.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="2"]){width:16.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="3"]){margin-left:25%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="3"]){margin-right:25%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="3"]){width:25%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="4"]){margin-left:33.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="4"]){margin-right:33.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="4"]){width:33.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="5"]){margin-left:41.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="5"]){margin-right:41.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="5"]){width:41.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="6"]){margin-left:50%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="6"]){margin-right:50%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="6"]){width:50%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="7"]){margin-left:58.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="7"]){margin-right:58.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="7"]){width:58.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="8"]){margin-left:66.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="8"]){margin-right:66.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="8"]){width:66.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="9"]){margin-left:75%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="9"]){margin-right:75%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="9"]){width:75%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="10"]){margin-left:83.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="10"]){margin-right:83.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="10"]){width:83.3333333333%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="11"]){margin-left:91.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="11"]){margin-right:91.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="11"]){width:91.6666666667%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_lg="12"]){margin-left:100%}:host([max_width~=lg]) ::slotted(av-dynamic-col[offset_right_lg="12"]){margin-right:100%}:host([max_width~=lg]) ::slotted(av-dynamic-col[size_lg="12"]){width:100%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="0"]){margin-left:0%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="0"]){margin-right:0%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="0"]){width:0%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="1"]){margin-left:8.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="1"]){margin-right:8.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="1"]){width:8.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="2"]){margin-left:16.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="2"]){margin-right:16.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="2"]){width:16.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="3"]){margin-left:25%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="3"]){margin-right:25%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="3"]){width:25%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="4"]){margin-left:33.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="4"]){margin-right:33.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="4"]){width:33.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="5"]){margin-left:41.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="5"]){margin-right:41.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="5"]){width:41.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="6"]){margin-left:50%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="6"]){margin-right:50%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="6"]){width:50%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="7"]){margin-left:58.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="7"]){margin-right:58.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="7"]){width:58.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="8"]){margin-left:66.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="8"]){margin-right:66.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="8"]){width:66.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="9"]){margin-left:75%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="9"]){margin-right:75%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="9"]){width:75%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="10"]){margin-left:83.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="10"]){margin-right:83.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="10"]){width:83.3333333333%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="11"]){margin-left:91.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="11"]){margin-right:91.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="11"]){width:91.6666666667%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_xl="12"]){margin-left:100%}:host([max_width~=xl]) ::slotted(av-dynamic-col[offset_right_xl="12"]){margin-right:100%}:host([max_width~=xl]) ::slotted(av-dynamic-col[size_xl="12"]){width:100%}`;
    __getStatic() {
        return DynamicRow;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(DynamicRow.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "DynamicRow";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('max_width')){ this['max_width'] = undefined; } }
    calculateWidth() {
        let size = this.offsetWidth;
        let labels = [];
        for (let key in this.sizes) {
            let value = this.sizes[key];
            if (size > value) {
                labels.push(key);
            }
            else {
                break;
            }
        }
        this.max_width = labels.join(" ");
    }
    postCreation() {
        this.calculateWidth();
        new Aventus.ResizeObserver(entries => {
            this.calculateWidth();
        }).observe(this);
    }
}
if(!window.customElements.get('av-dynamic-row')){window.customElements.define('av-dynamic-row', DynamicRow);Aventus.WebComponentInstance.registerDefinition(DynamicRow);}

class DynamicCol extends Aventus.WebComponent {
    get 'size'() {
                    return Number(this.getAttribute('size'));
                }
                set 'size'(val) {
                    if(val === undefined || val === null){this.removeAttribute('size')}
                    else{this.setAttribute('size',val)}
                }get 'size_xs'() {
                    return Number(this.getAttribute('size_xs'));
                }
                set 'size_xs'(val) {
                    if(val === undefined || val === null){this.removeAttribute('size_xs')}
                    else{this.setAttribute('size_xs',val)}
                }get 'size_sm'() {
                    return Number(this.getAttribute('size_sm'));
                }
                set 'size_sm'(val) {
                    if(val === undefined || val === null){this.removeAttribute('size_sm')}
                    else{this.setAttribute('size_sm',val)}
                }get 'size_md'() {
                    return Number(this.getAttribute('size_md'));
                }
                set 'size_md'(val) {
                    if(val === undefined || val === null){this.removeAttribute('size_md')}
                    else{this.setAttribute('size_md',val)}
                }get 'size_lg'() {
                    return Number(this.getAttribute('size_lg'));
                }
                set 'size_lg'(val) {
                    if(val === undefined || val === null){this.removeAttribute('size_lg')}
                    else{this.setAttribute('size_lg',val)}
                }get 'size_xl'() {
                    return Number(this.getAttribute('size_xl'));
                }
                set 'size_xl'(val) {
                    if(val === undefined || val === null){this.removeAttribute('size_xl')}
                    else{this.setAttribute('size_xl',val)}
                }get 'offset'() {
                    return Number(this.getAttribute('offset'));
                }
                set 'offset'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset')}
                    else{this.setAttribute('offset',val)}
                }get 'offset_xs'() {
                    return Number(this.getAttribute('offset_xs'));
                }
                set 'offset_xs'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset_xs')}
                    else{this.setAttribute('offset_xs',val)}
                }get 'offset_sm'() {
                    return Number(this.getAttribute('offset_sm'));
                }
                set 'offset_sm'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset_sm')}
                    else{this.setAttribute('offset_sm',val)}
                }get 'offset_md'() {
                    return Number(this.getAttribute('offset_md'));
                }
                set 'offset_md'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset_md')}
                    else{this.setAttribute('offset_md',val)}
                }get 'offset_lg'() {
                    return Number(this.getAttribute('offset_lg'));
                }
                set 'offset_lg'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset_lg')}
                    else{this.setAttribute('offset_lg',val)}
                }get 'offset_xl'() {
                    return Number(this.getAttribute('offset_xl'));
                }
                set 'offset_xl'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset_xl')}
                    else{this.setAttribute('offset_xl',val)}
                }get 'offset_right'() {
                    return Number(this.getAttribute('offset_right'));
                }
                set 'offset_right'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset_right')}
                    else{this.setAttribute('offset_right',val)}
                }get 'offset_right_xs'() {
                    return Number(this.getAttribute('offset_right_xs'));
                }
                set 'offset_right_xs'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset_right_xs')}
                    else{this.setAttribute('offset_right_xs',val)}
                }get 'offset_right_sm'() {
                    return Number(this.getAttribute('offset_right_sm'));
                }
                set 'offset_right_sm'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset_right_sm')}
                    else{this.setAttribute('offset_right_sm',val)}
                }get 'offset_right_md'() {
                    return Number(this.getAttribute('offset_right_md'));
                }
                set 'offset_right_md'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset_right_md')}
                    else{this.setAttribute('offset_right_md',val)}
                }get 'offset_right_lg'() {
                    return Number(this.getAttribute('offset_right_lg'));
                }
                set 'offset_right_lg'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset_right_lg')}
                    else{this.setAttribute('offset_right_lg',val)}
                }get 'offset_right_xl'() {
                    return Number(this.getAttribute('offset_right_xl'));
                }
                set 'offset_right_xl'(val) {
                    if(val === undefined || val === null){this.removeAttribute('offset_right_xl')}
                    else{this.setAttribute('offset_right_xl',val)}
                }get 'nobreak'() {
                return this.hasAttribute('nobreak');
            }
            set 'nobreak'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('nobreak', 'true');
                } else{
                    this.removeAttribute('nobreak');
                }
            }get 'center'() {
                return this.hasAttribute('center');
            }
            set 'center'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('center', 'true');
                } else{
                    this.removeAttribute('center');
                }
            }    static __style = `:host{display:flex;flex-direction:column;padding:0 10px;width:100%;margin-left:0;margin-right:0}:host([nobreak]){white-space:nowrap;text-overflow:ellipsis;overflow:hidden}:host([center]){text-align:center}:host([size="0"]){width:0%;display:flex}:host([offset="0"]){margin-left:0%}:host([offset-right="0"]){margin-right:0%}:host([size="1"]){width:8.3333333333%;display:flex}:host([offset="1"]){margin-left:8.3333333333%}:host([offset-right="1"]){margin-right:8.3333333333%}:host([size="2"]){width:16.6666666667%;display:flex}:host([offset="2"]){margin-left:16.6666666667%}:host([offset-right="2"]){margin-right:16.6666666667%}:host([size="3"]){width:25%;display:flex}:host([offset="3"]){margin-left:25%}:host([offset-right="3"]){margin-right:25%}:host([size="4"]){width:33.3333333333%;display:flex}:host([offset="4"]){margin-left:33.3333333333%}:host([offset-right="4"]){margin-right:33.3333333333%}:host([size="5"]){width:41.6666666667%;display:flex}:host([offset="5"]){margin-left:41.6666666667%}:host([offset-right="5"]){margin-right:41.6666666667%}:host([size="6"]){width:50%;display:flex}:host([offset="6"]){margin-left:50%}:host([offset-right="6"]){margin-right:50%}:host([size="7"]){width:58.3333333333%;display:flex}:host([offset="7"]){margin-left:58.3333333333%}:host([offset-right="7"]){margin-right:58.3333333333%}:host([size="8"]){width:66.6666666667%;display:flex}:host([offset="8"]){margin-left:66.6666666667%}:host([offset-right="8"]){margin-right:66.6666666667%}:host([size="9"]){width:75%;display:flex}:host([offset="9"]){margin-left:75%}:host([offset-right="9"]){margin-right:75%}:host([size="10"]){width:83.3333333333%;display:flex}:host([offset="10"]){margin-left:83.3333333333%}:host([offset-right="10"]){margin-right:83.3333333333%}:host([size="11"]){width:91.6666666667%;display:flex}:host([offset="11"]){margin-left:91.6666666667%}:host([offset-right="11"]){margin-right:91.6666666667%}:host([size="12"]){width:100%;display:flex}:host([offset="12"]){margin-left:100%}:host([offset-right="12"]){margin-right:100%}`;
    __getStatic() {
        return DynamicCol;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(DynamicCol.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "DynamicCol";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('size')){ this['size'] = undefined; }if(!this.hasAttribute('size_xs')){ this['size_xs'] = undefined; }if(!this.hasAttribute('size_sm')){ this['size_sm'] = undefined; }if(!this.hasAttribute('size_md')){ this['size_md'] = undefined; }if(!this.hasAttribute('size_lg')){ this['size_lg'] = undefined; }if(!this.hasAttribute('size_xl')){ this['size_xl'] = undefined; }if(!this.hasAttribute('offset')){ this['offset'] = undefined; }if(!this.hasAttribute('offset_xs')){ this['offset_xs'] = undefined; }if(!this.hasAttribute('offset_sm')){ this['offset_sm'] = undefined; }if(!this.hasAttribute('offset_md')){ this['offset_md'] = undefined; }if(!this.hasAttribute('offset_lg')){ this['offset_lg'] = undefined; }if(!this.hasAttribute('offset_xl')){ this['offset_xl'] = undefined; }if(!this.hasAttribute('offset_right')){ this['offset_right'] = undefined; }if(!this.hasAttribute('offset_right_xs')){ this['offset_right_xs'] = undefined; }if(!this.hasAttribute('offset_right_sm')){ this['offset_right_sm'] = undefined; }if(!this.hasAttribute('offset_right_md')){ this['offset_right_md'] = undefined; }if(!this.hasAttribute('offset_right_lg')){ this['offset_right_lg'] = undefined; }if(!this.hasAttribute('offset_right_xl')){ this['offset_right_xl'] = undefined; }if(!this.hasAttribute('nobreak')) { this.attributeChangedCallback('nobreak', false, false); }if(!this.hasAttribute('center')) { this.attributeChangedCallback('center', false, false); } }
    __listBoolProps() { return ["nobreak","center"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
}
if(!window.customElements.get('av-dynamic-col')){window.customElements.define('av-dynamic-col', DynamicCol);Aventus.WebComponentInstance.registerDefinition(DynamicCol);}

class Img extends Aventus.WebComponent {
    static get observedAttributes() {return ["src", "mode"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'no_save'() {
                return this.hasAttribute('no_save');
            }
            set 'no_save'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('no_save', 'true');
                } else{
                    this.removeAttribute('no_save');
                }
            }    get 'src'() {
                    return this.getAttribute('src');
                }
                set 'src'(val) {
                    if(val === undefined || val === null){this.removeAttribute('src')}
                    else{this.setAttribute('src',val)}
                }get 'mode'() {
                    return this.getAttribute('mode');
                }
                set 'mode'(val) {
                    if(val === undefined || val === null){this.removeAttribute('mode')}
                    else{this.setAttribute('mode',val)}
                }    isCalculing;
    maxCalculateSize = 10;
    ratio = 1;
    resizeObserver;
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("src", ((target) => {
    target.onSrcChanged();
}));this.__addPropertyActions("mode", ((target) => {
    if (target.src != "") {
        target.calculateSize();
    }
})); }
    static __style = `:host{--internal-img-color: var(--img-color);--internal-img-stroke-color: var(--img-stroke-color, var(--internal-img-color));--internal-img-fill-color: var(--img-fill-color, var(--internal-img-color));--internal-img-color-transition: var(--img-color-transition, none)}:host{display:inline-block;overflow:hidden;font-size:0}:host *{box-sizing:border-box}:host img{opacity:0;transition:filter .3s linear}:host .svg{display:none;height:100%;width:100%}:host .svg svg{height:100%;width:100%}:host([src$=".svg"]) img{display:none}:host([src$=".svg"]) .svg{display:flex}:host([src$=".svg"]) .svg svg{transition:var(--internal-img-color-transition);stroke:var(--internal-img-stroke-color);fill:var(--internal-img-fill-color)}:host([display_bigger]) img{cursor:pointer}:host([display_bigger]) img:hover{filter:brightness(50%)}`;
    __getStatic() {
        return Img;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Img.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<img _id="img_0" /><div class="svg" _id="img_1"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "imgEl",
      "ids": [
        "img_0"
      ]
    },
    {
      "name": "svgEl",
      "ids": [
        "img_1"
      ]
    }
  ]
}); }
    getClassName() {
        return "Img";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('no_save')) { this.attributeChangedCallback('no_save', false, false); }if(!this.hasAttribute('src')){ this['src'] = undefined; }if(!this.hasAttribute('mode')){ this['mode'] = "contains"; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('src');this.__upgradeProperty('mode'); }
    __listBoolProps() { return ["no_save"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    calculateSize(attempt = 0) {
        if (this.isCalculing) {
            return;
        }
        if (this.src == "") {
            return;
        }
        this.isCalculing = true;
        if (getComputedStyle(this).display == 'none') {
            return;
        }
        if (attempt == this.maxCalculateSize) {
            this.isCalculing = false;
            return;
        }
        let element = this.imgEl;
        if (this.src.endsWith(".svg")) {
            element = this.svgEl;
        }
        this.style.width = '';
        this.style.height = '';
        element.style.width = '';
        element.style.height = '';
        if (element.offsetWidth == 0 && element.offsetHeight == 0) {
            setTimeout(() => {
                this.isCalculing = false;
                this.calculateSize(attempt + 1);
            }, 100);
            return;
        }
        let style = getComputedStyle(this);
        let addedY = Number(style.paddingTop.replace("px", "")) + Number(style.paddingBottom.replace("px", "")) + Number(style.borderTopWidth.replace("px", "")) + Number(style.borderBottomWidth.replace("px", ""));
        let addedX = Number(style.paddingLeft.replace("px", "")) + Number(style.paddingRight.replace("px", "")) + Number(style.borderLeftWidth.replace("px", "")) + Number(style.borderRightWidth.replace("px", ""));
        let availableHeight = this.offsetHeight - addedY;
        let availableWidth = this.offsetWidth - addedX;
        let sameWidth = (element.offsetWidth == availableWidth);
        let sameHeight = (element.offsetHeight == availableHeight);
        this.ratio = element.offsetWidth / element.offsetHeight;
        if (sameWidth && !sameHeight) {
            // height is set
            element.style.width = (availableHeight * this.ratio) + 'px';
            element.style.height = availableHeight + 'px';
        }
        else if (!sameWidth && sameHeight) {
            // width is set
            element.style.width = availableWidth + 'px';
            element.style.height = (availableWidth / this.ratio) + 'px';
        }
        else if (!sameWidth && !sameHeight) {
            if (this.mode == "stretch") {
                element.style.width = '100%';
                element.style.height = '100%';
            }
            else if (this.mode == "contains") {
                // suppose this height is max
                let newWidth = (availableHeight * this.ratio);
                if (newWidth <= availableWidth) {
                    //we can apply this value
                    element.style.width = newWidth + 'px';
                    element.style.height = availableHeight + 'px';
                }
                else {
                    element.style.width = availableWidth + 'px';
                    element.style.height = (availableWidth / this.ratio) + 'px';
                }
            }
            else if (this.mode == "cover") {
                // suppose this height is min
                let newWidth = (availableHeight * this.ratio);
                if (newWidth >= availableWidth) {
                    //we can apply this value
                    element.style.width = newWidth + 'px';
                    element.style.height = availableHeight + 'px';
                }
                else {
                    element.style.width = availableWidth + 'px';
                    element.style.height = (availableWidth / this.ratio) + 'px';
                }
            }
        }
        //center img
        let diffTop = (this.offsetHeight - element.offsetHeight - addedY) / 2;
        let diffLeft = (this.offsetWidth - element.offsetWidth - addedX) / 2;
        element.style.transform = "translate(" + diffLeft + "px, " + diffTop + "px)";
        element.style.opacity = '1';
        this.isCalculing = false;
    }
    async onSrcChanged() {
        if (this.src.endsWith(".svg")) {
            let svgContent = await Aventus.ResourceLoader.load(this.src);
            this.svgEl.innerHTML = svgContent;
            this.calculateSize();
        }
        else if (this.src != "" && !this.no_save) {
            let base64 = await Aventus.ResourceLoader.load(this.src);
            this.imgEl.setAttribute("src", base64);
            this.calculateSize();
        }
        else {
            this.imgEl.setAttribute("src", this.src);
            this.calculateSize();
        }
    }
    postDestruction() {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
    }
    postCreation() {
        this.resizeObserver = new Aventus.ResizeObserver({
            fps: 10,
            callback: () => {
                this.calculateSize();
            }
        });
        this.resizeObserver.observe(this);
    }
}
if(!window.customElements.get('av-img')){window.customElements.define('av-img', Img);Aventus.WebComponentInstance.registerDefinition(Img);}

class Form extends Aventus.WebComponent {
    static __style = ``;
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
}
if(!window.customElements.get('av-form')){window.customElements.define('av-form', Form);Aventus.WebComponentInstance.registerDefinition(Form);}

class Input extends Aventus.WebComponent {
    static get observedAttributes() {return ["value", "label"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'required'() {
                return this.hasAttribute('required');
            }
            set 'required'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('required', 'true');
                } else{
                    this.removeAttribute('required');
                }
            }get 'disabled'() {
                return this.hasAttribute('disabled');
            }
            set 'disabled'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('disabled', 'true');
                } else{
                    this.removeAttribute('disabled');
                }
            }get 'min_length'() {
                    return Number(this.getAttribute('min_length'));
                }
                set 'min_length'(val) {
                    if(val === undefined || val === null){this.removeAttribute('min_length')}
                    else{this.setAttribute('min_length',val)}
                }get 'max_length'() {
                    return Number(this.getAttribute('max_length'));
                }
                set 'max_length'(val) {
                    if(val === undefined || val === null){this.removeAttribute('max_length')}
                    else{this.setAttribute('max_length',val)}
                }get 'pattern'() {
                    return this.getAttribute('pattern');
                }
                set 'pattern'(val) {
                    if(val === undefined || val === null){this.removeAttribute('pattern')}
                    else{this.setAttribute('pattern',val)}
                }    get 'value'() {
                    return this.getAttribute('value');
                }
                set 'value'(val) {
                    if(val === undefined || val === null){this.removeAttribute('value')}
                    else{this.setAttribute('value',val)}
                }get 'label'() {
                    return this.getAttribute('label');
                }
                set 'label'(val) {
                    if(val === undefined || val === null){this.removeAttribute('label')}
                    else{this.setAttribute('label',val)}
                }    customValidationRules = [];
    onChange = new Aventus.Callback();
    errors = [];
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("value", ((target) => {
    target.onAttrChange();
})); }
    static __style = `:host{--internal-input-font-size: var(--input-font-size, 16px);--internal-input-label-font-size: var(--input-label-font-size, 12px);--internal-input-label-spacing: var(--input-label-spacing, 2px)}:host{margin:16px;position:relative}:host input{background-color:rgba(0,0,0,0);background-image:linear-gradient(#3d5afe, #3d5afe),linear-gradient(to top, transparent 1px, #afafaf 1px);background-position:center bottom;background-repeat:no-repeat;background-size:0% 2px,100% 2px;border:none;border-radius:0;color:#212121;display:inline-block;font:inherit;font-size:var(--internal-input-font-size);font-weight:400;margin:0;outline:none;padding:0;padding-bottom:2px;padding-top:calc(var(--internal-input-label-font-size) + var(--internal-input-label-spacing));touch-action:manipulation;-webkit-transform:translate3d(0, 0, 0);user-select:auto;vertical-align:middle;width:100%}:host input:focus{background-size:100% 2px,100% 2px;transition:background-size .3s ease}:host label{color:#3d5afe;font-size:var(--internal-input-label-font-size);-webkit-font-smoothing:antialiased;font-weight:400;left:0;pointer-events:none;position:absolute;top:0;transition:top .1s ease-in,color .1s ease-in,font-size .1s ease-in;user-select:none}:host .grid{display:grid;grid-template-rows:1fr}:host .error{color:red;display:grid;font-size:12px;margin-top:5px;transition:all linear .5s;grid-column:1;grid-row:1}:host([value=""]) label{color:#afafaf;font-size:var(--internal-input-font-size);top:calc(var(--internal-input-label-font-size) + var(--internal-input-label-spacing))}`;
    __getStatic() {
        return Input;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Input.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<input id="input" _id="input_0" /><label for="input" _id="input_1"></label><div class="grid">	<div class="error" _id="input_2"></div></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "inputEl",
      "ids": [
        "input_0"
      ]
    },
    {
      "name": "errorEl",
      "ids": [
        "input_2"
      ]
    }
  ],
  "content": {
    "label": [
      {
        "id": "input_1",
        "attrName": "@HTML",
        "render": (c) => `${c.label}`
      }
    ]
  },
  "events": [
    {
      "eventName": "blur",
      "id": "input_0",
      "fct": (e, c) => c.component.validate(e)
    },
    {
      "eventName": "focus",
      "id": "input_0",
      "fct": (e, c) => c.component.clearErrors(e)
    },
    {
      "eventName": "input",
      "id": "input_0",
      "fct": (e, c) => c.component.inputChange(e)
    }
  ]
});this.__getStatic().__template.setSchema({globals:["label"]}); }
    getClassName() {
        return "Input";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('required')) { this.attributeChangedCallback('required', false, false); }if(!this.hasAttribute('disabled')) { this.attributeChangedCallback('disabled', false, false); }if(!this.hasAttribute('min_length')){ this['min_length'] = undefined; }if(!this.hasAttribute('max_length')){ this['max_length'] = undefined; }if(!this.hasAttribute('pattern')){ this['pattern'] = undefined; }if(!this.hasAttribute('value')){ this['value'] = ""; }if(!this.hasAttribute('label')){ this['label'] = ""; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('value');this.__upgradeProperty('label'); }
    __listBoolProps() { return ["required","disabled"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    onAttrChange() {
        if (this.inputEl.value != this.value) {
            this.inputEl.value = this.value;
        }
        this.validate();
    }
    inputChange() {
        this.validate();
        if (this.inputEl.value != this.value) {
            this.value = this.inputEl.value;
            this.onChange.trigger([this.value]);
        }
    }
    addValidationRule(cb) {
        if (this.customValidationRules.includes(cb)) {
            this.customValidationRules.push(cb);
        }
    }
    removeValidationRule(cb) {
        let index = this.customValidationRules.indexOf(cb);
        if (index > -1) {
            this.customValidationRules.slice(index, 1);
        }
    }
    addError(msg) {
        this.errors.push(msg);
    }
    clearErrors() {
        this.errors = [];
        this.printErrors();
    }
    printErrors() {
        this.errorEl.innerHTML = this.errors.join("<br />");
    }
    validate() {
        this.errors = [];
        if (!this.isReady) {
            return false;
        }
        if (this.disabled) {
            return true;
        }
        if (this.required) {
            if (!this.value) {
                this.addError("The field is required");
                this.printErrors();
                return false;
            }
        }
        if (this.min_length) {
            if (this.value.length < this.min_length) {
                this.addError("The length must be at least " + this.min_length + " characters");
            }
        }
        if (this.max_length) {
            if (this.value.length > this.max_length) {
                this.addError("The length must be less thant " + this.max_length + " characters");
            }
        }
        if (this.pattern) {
            let reg = new RegExp(this.pattern);
            if (!this.value.match(reg)) {
                this.addError("The field isn't valide");
            }
        }
        for (let fct of this.customValidationRules) {
            let result = fct(this.value);
            if (result instanceof Object) {
                if (!result.success) {
                    this.addError(result.error);
                }
            }
            else if (!result) {
                this.addError("The field isn't valide");
            }
        }
        this.printErrors();
        return this.errors.length == 0;
    }
}
if(!window.customElements.get('av-input')){window.customElements.define('av-input', Input);Aventus.WebComponentInstance.registerDefinition(Input);}

class Checkbox extends Aventus.WebComponent {
    static get observedAttributes() {return ["label", "checked"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'disabled'() {
                return this.hasAttribute('disabled');
            }
            set 'disabled'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('disabled', 'true');
                } else{
                    this.removeAttribute('disabled');
                }
            }get 'reverse'() {
                return this.hasAttribute('reverse');
            }
            set 'reverse'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('reverse', 'true');
                } else{
                    this.removeAttribute('reverse');
                }
            }    get 'label'() {
                    return this.getAttribute('label');
                }
                set 'label'(val) {
                    if(val === undefined || val === null){this.removeAttribute('label')}
                    else{this.setAttribute('label',val)}
                }get 'checked'() {
                return this.hasAttribute('checked');
            }
            set 'checked'(val) {
                val = this.getBoolean(val);
                if (val) {
                    this.setAttribute('checked', 'true');
                } else{
                    this.removeAttribute('checked');
                }
            }    get 'value'() {
						return this.__watch["value"];
					}
					set 'value'(val) {
						this.__watch["value"] = val;
					}    onChange = new Aventus.Callback();
    __registerWatchesActions() {
                this.__addWatchesActions("value", ((target) => {
    target.syncValue('value');
}));                super.__registerWatchesActions();
            }
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("checked", ((target) => {
    target.syncValue('checked');
})); }
    static __style = `:host{--internal-checkbox-size: var(--checkbox-size, 18px);--internal-checkbox-label-space: var(--checkbox-label-space, 8px);--internal-checkbox-border-size: var(--checkbox-border-size, 2px);--internal-checkbox-tick-size: var(--checkbox-tick-size, var(--internal-checkbox-size));--internal-checkbox-tick-stroke-size: var(--checkbox-tick-stroke-size, 2px);--internal-checkbox-border-radius: var(--checkbox-border-radius, 2px)}:host{color:#212121;cursor:pointer;display:flex;font-family:inherit;-webkit-font-smoothing:antialiased;font-weight:400;position:relative;user-select:none;align-items:center}:host .checkbox{align-items:center;border:var(--internal-checkbox-border-size) solid #37474f;border-radius:var(--internal-checkbox-border-radius);display:flex;height:var(--internal-checkbox-size);justify-content:center;overflow:visible;position:relative;-webkit-tap-highlight-color:rgba(0,0,0,0);transition:background-color .1s linear;width:var(--internal-checkbox-size)}:host .checkbox .tick{flex-shrink:0;height:var(--internal-checkbox-tick-size);stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:var(--internal-checkbox-tick-stroke-size);transform:scale(0);transition:transform .2s ease;width:var(--internal-checkbox-tick-size)}:host label:not(:empty){cursor:pointer;margin-left:var(--internal-checkbox-label-space)}:host([checked]) .checkbox{background-color:#37474f}:host([checked]) .checkbox .tick{transform:scale(1)}:host([reverse]) .checkbox{order:2}:host([reverse]) label:not(:empty){order:1;margin-right:var(--internal-checkbox-label-space);margin-left:0}`;
    __getStatic() {
        return Checkbox;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Checkbox.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<span class="checkbox" _id="checkbox_0">	<svg class="tick" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">		<path d="M4.89163 13.2687L9.16582 17.5427L18.7085 8"></path>	</svg></span><label _id="checkbox_1"></label>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "checkboxEl",
      "ids": [
        "checkbox_0"
      ]
    }
  ],
  "content": {
    "label": [
      {
        "id": "checkbox_1",
        "attrName": "@HTML",
        "render": (c) => `${c.label}`
      }
    ]
  }
});this.__getStatic().__template.setSchema({globals:["label"]}); }
    getClassName() {
        return "Checkbox";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('disabled')) { this.attributeChangedCallback('disabled', false, false); }if(!this.hasAttribute('reverse')) { this.attributeChangedCallback('reverse', false, false); }if(!this.hasAttribute('label')){ this['label'] = ""; }if(!this.hasAttribute('checked')) { this.attributeChangedCallback('checked', false, false); }if(!this["value"]){ this["value"] = false;} }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('label');this.__upgradeProperty('checked'); }
    __listBoolProps() { return ["disabled","reverse","checked"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    syncValue(master) {
        if (this.checked != this.value) {
            if (master == 'checked') {
                this.value = this.checked;
            }
            else {
                this.checked = this.value;
            }
        }
        if (this.checkboxEl.checked != this.checked) {
            this.checkboxEl.checked = this.checked;
        }
    }
    validate() {
        return true;
    }
    postCreation() {
        new Aventus.PressManager({
            element: this,
            onPress: () => {
                this.checked = !this.checked;
                this.onChange.trigger([this.checked]);
            }
        });
    }
}
if(!window.customElements.get('av-checkbox')){window.customElements.define('av-checkbox', Checkbox);Aventus.WebComponentInstance.registerDefinition(Checkbox);}
Aventus.App=App;
App.Namespace='Aventus';
(Aventus.Navigation||(Aventus.Navigation = {}));
Aventus.Navigation.RouterLink=RouterLink;
RouterLink.Namespace='Aventus.Navigation';
Aventus.RouterStateManager=RouterStateManager;
RouterStateManager.Namespace='Aventus';
Aventus.Navigation.Router=Router;
Router.Namespace='Aventus.Navigation';
Aventus.Navigation.Page=Page;
Page.Namespace='Aventus.Navigation';
(Aventus.Layout||(Aventus.Layout = {}));
Aventus.Layout.Scrollable=Scrollable;
Scrollable.Namespace='Aventus.Layout';
Aventus.Layout.GridCol=GridCol;
GridCol.Namespace='Aventus.Layout';
Aventus.Layout.Grid=Grid;
Grid.Namespace='Aventus.Layout';
Aventus.Layout.DynamicRow=DynamicRow;
DynamicRow.Namespace='Aventus.Layout';
Aventus.Layout.DynamicCol=DynamicCol;
DynamicCol.Namespace='Aventus.Layout';
Aventus.Img=Img;
Img.Namespace='Aventus';
(Aventus.Form||(Aventus.Form = {}));
Aventus.Form.Form=Form;
Form.Namespace='Aventus.Form';
Aventus.Form.Input=Input;
Input.Namespace='Aventus.Form';
Aventus.Form.Checkbox=Checkbox;
Checkbox.Namespace='Aventus.Form';
})(Aventus);
