class Dependances extends Aventus.WebComponent {
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
        "render": (c) => `\r\n\t\t\t${c.dep.name}\r\n\t\t`,
        "path": "dep"
      },
      {
        "id": "dependances_3",
        "attrName": "@HTML",
        "render": (c) => `\r\n\t\t\t${c.dep.version}\r\n\t\t`,
        "path": "dep"
      },
      {
        "id": "dependances_4",
        "attrName": "href",
        "render": (c) => `${c.dep.uri}`,
        "path": "dep"
      },
      {
        "id": "dependances_4",
        "attrName": "@HTML",
        "render": (c) => `\r\n\t\t\t\t${c.dep.uri}\r\n\t\t\t`,
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
    __listBoolProps() { return ["no_deps"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
}
if(!window.customElements.get('av-dependances')){window.customElements.define('av-dependances', Dependances);Aventus.WebComponentInstance.registerDefinition(Dependances);}

