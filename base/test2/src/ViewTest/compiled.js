class ViewTest extends Aventus.WebComponent {
    static get observedAttributes() {return ["my_prop"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'my_prop'() {
                    return this.getAttribute('my_prop');
                }
                set 'my_prop'(val) {
                    if(val === undefined || val === null){this.removeAttribute('my_prop')}
                    else{this.setAttribute('my_prop',val)}
                }    get 'data'() {
						return this.__watch["data"];
					}
					set 'data'(val) {
						this.__watch["data"] = val;
					}get 'dataLoop'() {
						return this.__watch["dataLoop"];
					}
					set 'dataLoop'(val) {
						this.__watch["dataLoop"] = val;
					}    __registerWatchesActions() {
                this.__addWatchesActions("data", ((target) => {
    console.log("in");
}));this.__addWatchesActions("dataLoop");                super.__registerWatchesActions();
            }
    static __style = ``;
    __getStatic() {
        return ViewTest;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ViewTest.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<h1 _id="viewtest_0"></h1><div _id="viewtest_1"></div><input _id="viewtest_2" /><av-input _id="viewtest_3"></av-input><div class="list"><template _id="viewtest_5"></template></div>` }
    });
}
    get itemEl () { var list = Array.from(this.shadowRoot.querySelectorAll('[_id="viewtest_4"]')); return list; }    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "titleEl",
      "ids": [
        "viewtest_0"
      ]
    }
  ],
  "content": {
    "my_prop": [
      {
        "id": "viewtest_0",
        "attrName": "label",
        "render": (c) => `${c.my_prop}`
      },
      {
        "id": "viewtest_0",
        "attrName": "@HTML",
        "render": (c) => `Test - ${c.my_prop} - ${c.data.lvl1}`
      }
    ],
    "data": [
      {
        "id": "viewtest_0",
        "attrName": "@HTML",
        "render": (c) => `Test - ${c.my_prop} - ${c.data.lvl1}`,
        "path": "data"
      }
    ]
  },
  "injection": {
    "my_prop": [
      {
        "id": "viewtest_1",
        "injectionName": "data3",
        "inject": (c) => c.my_prop
      }
    ],
    "data": [
      {
        "id": "viewtest_1",
        "injectionName": "data4",
        "inject": (c) => c.data.lvl1,
        "path": "data.lvl1"
      }
    ]
  },
  "bindings": {
    "my_prop": [
      {
        "id": "viewtest_2",
        "valueName": "value",
        "eventNames": [
          "change",
          "input"
        ]
      }
    ],
    "data": [
      {
        "id": "viewtest_3",
        "valueName": "val",
        "eventNames": [
          "customChange"
        ],
        "path": "data.lvl1",
        "isCallback": true
      }
    ]
  },
  "events": [
    {
      "eventName": "click",
      "id": "viewtest_0",
      "fct": (e) => this.fctTest(e)
    }
  ],
  "pressEvents": [
    {
      "id": "viewtest_0",
      "onPress": (e, pressInstance) => { this.fctTest(e, pressInstance); }
    }
  ]
});this.__getStatic().__template.setSchema({globals:["my_prop","data","dataLoop"]});const templ1 = new Aventus.WebComponentTemplate(this);templ1.setTemplate(`<div class="list-item" _id="viewtest_4"><div _id="viewtest_6"></div><template _id="viewtest_8"></template></div>`);templ1.setActions({
  "content": {
    "my_prop": [
      {
        "id": "viewtest_4",
        "attrName": "label2",
        "render": (c) => `${c.my_prop}`
      },
      {
        "id": "viewtest_6",
        "attrName": "label",
        "render": (c) => `${c.my_prop}`
      }
    ],
    "item": [
      {
        "id": "viewtest_6",
        "attrName": "@HTML",
        "render": (c) => `My name "&dollar;{s}" is ${c.item.name}`,
        "path": "item"
      }
    ]
  },
  "injection": {
    "item": [
      {
        "id": "viewtest_6",
        "injectionName": "data",
        "inject": (c) => c.item,
        "path": "item"
      }
    ]
  }
});this.__getStatic().__template.addLoop({
                        anchorId: 'viewtest_5',
                        data: 'dataLoop',
                        index: 'index_viewtest_5',
                        item: 'item',
                        template: templ1
                    });const templ2 = new Aventus.WebComponentTemplate(this);templ2.setTemplate(`<div _id="viewtest_7"></div>`);templ2.setActions({
  "content": {
    "index": [
      {
        "id": "viewtest_7",
        "attrName": "@HTML",
        "render": (c) => `${c.index}.${c.item.name} - ${c.color}`,
        "path": "index"
      }
    ],
    "item": [
      {
        "id": "viewtest_7",
        "attrName": "@HTML",
        "render": (c) => `${c.index}.${c.item.name} - ${c.color}`,
        "path": "item"
      }
    ],
    "color": [
      {
        "id": "viewtest_7",
        "attrName": "@HTML",
        "render": (c) => `${c.index}.${c.item.name} - ${c.color}`,
        "path": "color"
      }
    ]
  }
});templ1.addLoop({
                        anchorId: 'viewtest_8',
                        data: 'item.colors',
                        index: 'index',
                        item: 'color',
                        template: templ2
                    }); }
    getClassName() {
        return "ViewTest";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('my_prop')){ this['my_prop'] = "myProp"; }if(!this["data"]){ this["data"] = {"lvl1":"lvl1","lvl2":{"lvl21":"lvl2.1","lvl22":"lvl2.2"}};}if(!this["dataLoop"]){ this["dataLoop"] = [{"name":"Maxime","colors":["red","blue"]},{"name":"Benjamin","colors":["yellow","green"]}];} }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('my_prop'); }
    fctTest() {
        throw new Error("Method not implemented.2");
    }
}
window.customElements.define('av-view-test', ViewTest);Aventus.WebComponentInstance.registerDefinition(ViewTest);

