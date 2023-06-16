class Input extends Aventus.WebComponent {
    static get observedAttributes() {return ["val"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'val'() {
                    return this.getAttribute('val');
                }
                set 'val'(val) {
                    if(val === undefined || val === null){this.removeAttribute('val')}
                    else{this.setAttribute('val',val)}
                }    customChange = new Aventus.CallbackManager();
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("val", ((target) => {
    target.inputEl.value = target.val;
})); }
    static __style = ``;
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
        blocks: { 'default':`<input _id="input_0" />` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "inputEl",
      "ids": [
        "input_0"
      ]
    }
  ],
  "events": [
    {
      "eventName": "input",
      "id": "input_0",
      "fct": (e) => this.triggerChange(e)
    }
  ]
}); }
    getClassName() {
        return "Input";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('val')){ this['val'] = ""; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('val'); }
    triggerChange() {
        this.val = this.inputEl.value;
        this.customChange.trigger([this.val]);
        this.dispatchEvent(new CustomEvent("bla"));
    }
}
window.customElements.define('av-input', Input);Aventus.WebComponentInstance.registerDefinition(Input);

