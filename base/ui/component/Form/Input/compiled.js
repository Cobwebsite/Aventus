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

