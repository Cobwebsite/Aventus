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
      "fct": (e, c) => c.comp.onChange(e)
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
_.TranslationCol=TranslationCol;
if(!window.customElements.get('av-translation-col')){window.customElements.define('av-translation-col', TranslationCol);Aventus.WebComponentInstance.registerDefinition(TranslationCol);}

