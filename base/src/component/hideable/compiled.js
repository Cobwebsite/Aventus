class AvHideable extends WebComponent {
    get 'isVisible'() {
						return this.__watch["isVisible"];
					}
					set 'isVisible'(val) {
						this.__watch["isVisible"] = val;
					}    oldParent = undefined;
    actionInProgress = false;
    options;
    checkCloseBinded;
    pressManager;
    onVisibilityChangeCallbacks = [];
    __registerWatchesActions() {
                this.__addWatchesActions("isVisible", ((target) => {
    if (target.onVisibilityChangeCallbacks)
        target.onVisibilityChangeCallbacks.forEach(callback => callback(target.isVisible));
}));                super.__registerWatchesActions();
            }
    static __style = `:host{display:none;height:0;left:0;overflow:visible;top:0;width:0;z-index:1000}::slotted(.context-menu .context-menu-item){background-color:red}:host{--inserted: "here"}`;
    constructor() {        super();        this.options = {            noHideItems: [this],            container: document.body,            beforeHide: this.defaultBeforeHide,            afterHide: this.defaultAfterHide,            canHide: this.defaultCanHide        };        this.checkCloseBinded = this.checkClose.bind(this);    }
    __getStatic() {
        return AvHideable;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(AvHideable.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot><div _id="avhideable_0"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "content",
      "ids": [
        "avhideable_0"
      ]
    }
  ]
}); }
    getClassName() {
        return "AvHideable";
    }
    __defaultValues() { super.__defaultValues(); if(!this["isVisible"]){ this["isVisible"] = false;} }
    async defaultBeforeHide() { }
    async defaultAfterHide() { }
    async defaultCanHide() { return true; }
    configure(options) {
        if (options.noHideItems) {
            this.options.noHideItems = options.noHideItems;
        }
        if (options.beforeHide) {
            this.options.beforeHide = options.beforeHide;
        }
        if (options.afterHide) {
            this.options.afterHide = options.afterHide;
        }
        if (options.canHide) {
            this.options.canHide = options.canHide;
        }
        if (options.container) {
            this.options.container = options.container;
        }
    }
    show() {
        if (this.actionInProgress) {
            return;
        }
        this.actionInProgress = true;
        if (this.isVisible) {
            this.actionInProgress = false;
            return;
        }
        this.isVisible = true;
        this.oldParent = this.parentNode;
        if (this.shadowRoot.querySelector("style").innerText.indexOf(":host{--inserted: \"here\"}") != -1) {
            // insert style from
            let newStyle = "";
            if (this.oldParent instanceof ShadowRoot) {
                let matchingArr = this.oldParent.querySelector("style").innerText.match(/av-hideable.*?\{.*?\}/g);
                if (matchingArr) {
                    newStyle = matchingArr.join("").replace(/av-hideable/g, ":host");
                }
            }
            else {
                const parentShadowRoot = ElementExtension.findParentByType(this.oldParent, ShadowRoot);
                if (parentShadowRoot instanceof ShadowRoot) {
                    let matchingArr = parentShadowRoot.querySelector("style").innerText.match(/av-hideable.*?\{.*?\}/g);
                    if (matchingArr) {
                        newStyle = matchingArr.join("").replace(/av-hideable/g, ":host");
                    }
                }
            }
            this.shadowRoot.querySelector("style").innerText = this.shadowRoot.querySelector("style").innerText.replace(":host{--inserted: \"here\"}", newStyle);
        }
        this.loadCSSVariables();
        this.style.display = 'block';
        this.options.container.appendChild(this);
        this.options.container.addEventListener("pressaction_trigger", this.checkCloseBinded);
        this.pressManager = new PressManager({
            element: this.options.container,
            onPress: (e) => {
                this.checkCloseBinded(e);
            }
        });
        this.actionInProgress = false;
    }
    getVisibility() {
        return this.isVisible;
    }
    onVisibilityChange(callback) {
        this.onVisibilityChangeCallbacks.push(callback);
    }
    offVisibilityChange(callback) {
        this.onVisibilityChangeCallbacks = this.onVisibilityChangeCallbacks.filter(cb => cb !== callback);
    }
    loadCSSVariables() {
        let styleSheets = this.shadowRoot.styleSheets;
        let realStyle = getComputedStyle(this);
        let propsToAdd = {};
        for (let i = 0; i < styleSheets.length; i++) {
            let rules = styleSheets[i].cssRules;
            for (let j = 0; j < rules.length; j++) {
                for (let indexTxt in rules[j]["style"]) {
                    let index = Number(indexTxt);
                    if (isNaN(index)) {
                        break;
                    }
                    let prop = rules[j]["style"][index];
                    let value = rules[j]["style"][prop];
                    if (value !== undefined && value.startsWith("var(")) {
                        let varToDef = value.match(/var\(.*?(\,|\))/g)[0].replace("var(", "").slice(0, -1);
                        let realValue = realStyle.getPropertyValue(varToDef);
                        propsToAdd[varToDef] = realValue.trim();
                    }
                }
            }
        }
        for (let key in propsToAdd) {
            this.style.setProperty(key, propsToAdd[key]);
        }
    }
    async hide(options) {
        if (this.actionInProgress) {
            return;
        }
        this.actionInProgress = true;
        if (this.isVisible) {
            if (options?.force || await this.options.canHide(options?.target)) {
                await this.options.beforeHide();
                this.isVisible = false;
                this.style.display = 'none';
                this.oldParent.appendChild(this);
                this.options.container.removeEventListener("pressaction_trigger", this.checkCloseBinded);
                this.pressManager.destroy();
                await this.options.afterHide();
            }
        }
        this.actionInProgress = false;
    }
    checkClose(e) {
        let realTargetEl;
        if (e instanceof PointerEvent) {
            realTargetEl = ElementExtension.getElementAtPosition(e.pageX, e.pageY, e.target);
        }
        else {
            realTargetEl = ElementExtension.getElementAtPosition(e.detail.realEvent.pageX, e.detail.realEvent.pageY, e.detail.realEvent.target);
        }
        for (var i = 0; i < this.options.noHideItems.length; i++) {
            if (ElementExtension.containsChild(this.options.noHideItems[i], realTargetEl)) {
                return;
            }
        }
        this.hide({
            target: realTargetEl
        });
    }
    postCreation() {
        var listChild = ElementExtension.getElementsInSlot(this);
        for (let i = 0; i < listChild.length; i++) {
            this.content.appendChild(listChild[i]);
        }
    }
}
window.customElements.define('av-hideable', AvHideable);WebComponentInstance.registerDefinition(AvHideable);

