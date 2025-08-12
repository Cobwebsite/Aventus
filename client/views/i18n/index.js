var npmCompilation;
(npmCompilation||(npmCompilation = {}));
(function (npmCompilation) {
	var _ = (function () {
    'use strict';

    /**
     * @license
     * Copyright 2019 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const t$4=globalThis,e$7=t$4.ShadowRoot&&(void 0===t$4.ShadyCSS||t$4.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s$3=Symbol(),o$6=new WeakMap;let n$4 = class n{constructor(t,e,o){if(this._$cssResult$=!0,o!==s$3)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e;}get styleSheet(){let t=this.o;const s=this.t;if(e$7&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=o$6.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&o$6.set(s,t));}return t}toString(){return this.cssText}};const r$6=t=>new n$4("string"==typeof t?t:t+"",void 0,s$3),i$4=(t,...e)=>{const o=1===t.length?t[0]:e.reduce(((e,s,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[o+1]),t[0]);return new n$4(o,t,s$3)},S$1=(s,o)=>{if(e$7)s.adoptedStyleSheets=o.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const e of o){const o=document.createElement("style"),n=t$4.litNonce;void 0!==n&&o.setAttribute("nonce",n),o.textContent=e.cssText,s.appendChild(o);}},c$3=e$7?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$6(e)})(t):t;

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */const{is:i$3,defineProperty:e$6,getOwnPropertyDescriptor:h$1,getOwnPropertyNames:r$5,getOwnPropertySymbols:o$5,getPrototypeOf:n$3}=Object,a$1=globalThis,c$2=a$1.trustedTypes,l$1=c$2?c$2.emptyScript:"",p$2=a$1.reactiveElementPolyfillSupport,d$1=(t,s)=>t,u$3={toAttribute(t,s){switch(s){case Boolean:t=t?l$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,s){let i=t;switch(s){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t);}catch(t){i=null;}}return i}},f$1=(t,s)=>!i$3(t,s),b={attribute:!0,type:String,converter:u$3,reflect:!1,useDefault:!1,hasChanged:f$1};Symbol.metadata??=Symbol("metadata"),a$1.litPropertyMetadata??=new WeakMap;let y$1 = class y extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t);}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=b){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),h=this.getPropertyDescriptor(t,i,s);void 0!==h&&e$6(this.prototype,t,h);}}static getPropertyDescriptor(t,s,i){const{get:e,set:r}=h$1(this.prototype,t)??{get(){return this[s]},set(t){this[s]=t;}};return {get:e,set(s){const h=e?.call(this);r?.call(this,s),this.requestUpdate(t,h,i);},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(d$1("elementProperties")))return;const t=n$3(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties);}static finalize(){if(this.hasOwnProperty(d$1("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(d$1("properties"))){const t=this.properties,s=[...r$5(t),...o$5(t)];for(const i of s)this.createProperty(i,t[i]);}const t=this[Symbol.metadata];if(null!==t){const s=litPropertyMetadata.get(t);if(void 0!==s)for(const[t,i]of s)this.elementProperties.set(t,i);}this._$Eh=new Map;for(const[t,s]of this.elementProperties){const i=this._$Eu(t,s);void 0!==i&&this._$Eh.set(i,t);}this.elementStyles=this.finalizeStyles(this.styles);}static finalizeStyles(s){const i=[];if(Array.isArray(s)){const e=new Set(s.flat(1/0).reverse());for(const s of e)i.unshift(c$3(s));}else void 0!==s&&i.push(c$3(s));return i}static _$Eu(t,s){const i=s.attribute;return !1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev();}_$Ev(){this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)));}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.();}removeController(t){this._$EO?.delete(t);}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t);}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S$1(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach((t=>t.hostConnected?.()));}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach((t=>t.hostDisconnected?.()));}attributeChangedCallback(t,s,i){this._$AK(t,i);}_$ET(t,s){const i=this.constructor.elementProperties.get(t),e=this.constructor._$Eu(t,i);if(void 0!==e&&!0===i.reflect){const h=(void 0!==i.converter?.toAttribute?i.converter:u$3).toAttribute(s,i.type);this._$Em=t,null==h?this.removeAttribute(e):this.setAttribute(e,h),this._$Em=null;}}_$AK(t,s){const i=this.constructor,e=i._$Eh.get(t);if(void 0!==e&&this._$Em!==e){const t=i.getPropertyOptions(e),h="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:u$3;this._$Em=e,this[e]=h.fromAttribute(s,t.type)??this._$Ej?.get(e)??null,this._$Em=null;}}requestUpdate(t,s,i){if(void 0!==t){const e=this.constructor,h=this[t];if(i??=e.getPropertyOptions(t),!((i.hasChanged??f$1)(h,s)||i.useDefault&&i.reflect&&h===this._$Ej?.get(t)&&!this.hasAttribute(e._$Eu(t,i))))return;this.C(t,s,i);}!1===this.isUpdatePending&&(this._$ES=this._$EP());}C(t,s,{useDefault:i,reflect:e,wrapped:h},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??s??this[t]),!0!==h||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(s=void 0),this._$AL.set(t,s)),!0===e&&this._$Em!==t&&(this._$Eq??=new Set).add(t));}async _$EP(){this.isUpdatePending=!0;try{await this._$ES;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,s]of this._$Ep)this[t]=s;this._$Ep=void 0;}const t=this.constructor.elementProperties;if(t.size>0)for(const[s,i]of t){const{wrapped:t}=i,e=this[s];!0!==t||this._$AL.has(s)||void 0===e||this.C(s,void 0,i,e);}}let t=!1;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach((t=>t.hostUpdate?.())),this.update(s)):this._$EM();}catch(s){throw t=!1,this._$EM(),s}t&&this._$AE(s);}willUpdate(t){}_$AE(t){this._$EO?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t);}_$EM(){this._$AL=new Map,this.isUpdatePending=!1;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return !0}update(t){this._$Eq&&=this._$Eq.forEach((t=>this._$ET(t,this[t]))),this._$EM();}updated(t){}firstUpdated(t){}};y$1.elementStyles=[],y$1.shadowRootOptions={mode:"open"},y$1[d$1("elementProperties")]=new Map,y$1[d$1("finalized")]=new Map,p$2?.({ReactiveElement:y$1}),(a$1.reactiveElementVersions??=[]).push("2.1.0");

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const t$3=globalThis,i$2=t$3.trustedTypes,s$2=i$2?i$2.createPolicy("lit-html",{createHTML:t=>t}):void 0,e$5="$lit$",h=`lit$${Math.random().toFixed(9).slice(2)}$`,o$4="?"+h,n$2=`<${o$4}>`,r$4=document,l=()=>r$4.createComment(""),c$1=t=>null===t||"object"!=typeof t&&"function"!=typeof t,a=Array.isArray,u$2=t=>a(t)||"function"==typeof t?.[Symbol.iterator],d="[ \t\n\f\r]",f=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,v$1=/-->/g,_=/>/g,m$1=RegExp(`>|${d}(?:([^\\s"'>=/]+)(${d}*=${d}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),p$1=/'/g,g=/"/g,$=/^(?:script|style|textarea|title)$/i,y=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),x=y(1),T=Symbol.for("lit-noChange"),E=Symbol.for("lit-nothing"),A=new WeakMap,C=r$4.createTreeWalker(r$4,129);function P(t,i){if(!a(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==s$2?s$2.createHTML(i):i}const V=(t,i)=>{const s=t.length-1,o=[];let r,l=2===i?"<svg>":3===i?"<math>":"",c=f;for(let i=0;i<s;i++){const s=t[i];let a,u,d=-1,y=0;for(;y<s.length&&(c.lastIndex=y,u=c.exec(s),null!==u);)y=c.lastIndex,c===f?"!--"===u[1]?c=v$1:void 0!==u[1]?c=_:void 0!==u[2]?($.test(u[2])&&(r=RegExp("</"+u[2],"g")),c=m$1):void 0!==u[3]&&(c=m$1):c===m$1?">"===u[0]?(c=r??f,d=-1):void 0===u[1]?d=-2:(d=c.lastIndex-u[2].length,a=u[1],c=void 0===u[3]?m$1:'"'===u[3]?g:p$1):c===g||c===p$1?c=m$1:c===v$1||c===_?c=f:(c=m$1,r=void 0);const x=c===m$1&&t[i+1].startsWith("/>")?" ":"";l+=c===f?s+n$2:d>=0?(o.push(a),s.slice(0,d)+e$5+s.slice(d)+h+x):s+h+(-2===d?i:x);}return [P(t,l+(t[s]||"<?>")+(2===i?"</svg>":3===i?"</math>":"")),o]};class N{constructor({strings:t,_$litType$:s},n){let r;this.parts=[];let c=0,a=0;const u=t.length-1,d=this.parts,[f,v]=V(t,s);if(this.el=N.createElement(f,n),C.currentNode=this.el.content,2===s||3===s){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes);}for(;null!==(r=C.nextNode())&&d.length<u;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(e$5)){const i=v[a++],s=r.getAttribute(t).split(h),e=/([.?@])?(.*)/.exec(i);d.push({type:1,index:c,name:e[2],strings:s,ctor:"."===e[1]?H:"?"===e[1]?I:"@"===e[1]?L:k}),r.removeAttribute(t);}else t.startsWith(h)&&(d.push({type:6,index:c}),r.removeAttribute(t));if($.test(r.tagName)){const t=r.textContent.split(h),s=t.length-1;if(s>0){r.textContent=i$2?i$2.emptyScript:"";for(let i=0;i<s;i++)r.append(t[i],l()),C.nextNode(),d.push({type:2,index:++c});r.append(t[s],l());}}}else if(8===r.nodeType)if(r.data===o$4)d.push({type:2,index:c});else {let t=-1;for(;-1!==(t=r.data.indexOf(h,t+1));)d.push({type:7,index:c}),t+=h.length-1;}c++;}}static createElement(t,i){const s=r$4.createElement("template");return s.innerHTML=t,s}}function S(t,i,s=t,e){if(i===T)return i;let h=void 0!==e?s._$Co?.[e]:s._$Cl;const o=c$1(i)?void 0:i._$litDirective$;return h?.constructor!==o&&(h?._$AO?.(!1),void 0===o?h=void 0:(h=new o(t),h._$AT(t,s,e)),void 0!==e?(s._$Co??=[])[e]=h:s._$Cl=h),void 0!==h&&(i=S(t,h._$AS(t,i.values),h,e)),i}let M$1 = class M{constructor(t,i){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:i},parts:s}=this._$AD,e=(t?.creationScope??r$4).importNode(i,!0);C.currentNode=e;let h=C.nextNode(),o=0,n=0,l=s[0];for(;void 0!==l;){if(o===l.index){let i;2===l.type?i=new R(h,h.nextSibling,this,t):1===l.type?i=new l.ctor(h,l.name,l.strings,this,t):6===l.type&&(i=new z(h,this,t)),this._$AV.push(i),l=s[++n];}o!==l?.index&&(h=C.nextNode(),o++);}return C.currentNode=r$4,e}p(t){let i=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}};class R{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,i,s,e){this.type=2,this._$AH=E,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cv=e?.isConnected??!0;}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t?.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=S(this,t,i),c$1(t)?t===E||null==t||""===t?(this._$AH!==E&&this._$AR(),this._$AH=E):t!==this._$AH&&t!==T&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):u$2(t)?this.k(t):this._(t);}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t));}_(t){this._$AH!==E&&c$1(this._$AH)?this._$AA.nextSibling.data=t:this.T(r$4.createTextNode(t)),this._$AH=t;}$(t){const{values:i,_$litType$:s}=t,e="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=N.createElement(P(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===e)this._$AH.p(i);else {const t=new M$1(e,this),s=t.u(this.options);t.p(i),this.T(s),this._$AH=t;}}_$AC(t){let i=A.get(t.strings);return void 0===i&&A.set(t.strings,i=new N(t)),i}k(t){a(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const h of t)e===i.length?i.push(s=new R(this.O(l()),this.O(l()),this,this.options)):s=i[e],s._$AI(h),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,i){for(this._$AP?.(!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i;}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t));}}class k{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,i,s,e,h){this.type=1,this._$AH=E,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=h,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=E;}_$AI(t,i=this,s,e){const h=this.strings;let o=!1;if(void 0===h)t=S(this,t,i,0),o=!c$1(t)||t!==this._$AH&&t!==T,o&&(this._$AH=t);else {const e=t;let n,r;for(t=h[0],n=0;n<h.length-1;n++)r=S(this,e[s+n],i,n),r===T&&(r=this._$AH[n]),o||=!c$1(r)||r!==this._$AH[n],r===E?t=E:t!==E&&(t+=(r??"")+h[n+1]),this._$AH[n]=r;}o&&!e&&this.j(t);}j(t){t===E?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"");}}class H extends k{constructor(){super(...arguments),this.type=3;}j(t){this.element[this.name]=t===E?void 0:t;}}class I extends k{constructor(){super(...arguments),this.type=4;}j(t){this.element.toggleAttribute(this.name,!!t&&t!==E);}}class L extends k{constructor(t,i,s,e,h){super(t,i,s,e,h),this.type=5;}_$AI(t,i=this){if((t=S(this,t,i,0)??E)===T)return;const s=this._$AH,e=t===E&&s!==E||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,h=t!==E&&(s===E||e);e&&this.element.removeEventListener(this.name,this,s),h&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t);}}class z{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){S(this,t);}}const Z={M:e$5,P:h,A:o$4,C:1,L:V,R:M$1,D:u$2,V:S,I:R,H:k,N:I,U:L,B:H,F:z},j=t$3.litHtmlPolyfillSupport;j?.(N,R),(t$3.litHtmlVersions??=[]).push("3.3.0");const B=(t,i,s)=>{const e=s?.renderBefore??i;let h=e._$litPart$;if(void 0===h){const t=s?.renderBefore??null;e._$litPart$=h=new R(i.insertBefore(l(),t),t,void 0,s??{});}return h._$AI(t),h};

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */const s$1=globalThis;let i$1 = class i extends y$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0;}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const r=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=B(r,this.renderRoot,this.renderOptions);}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0);}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1);}render(){return T}};i$1._$litElement$=!0,i$1["finalized"]=!0,s$1.litElementHydrateSupport?.({LitElement:i$1});const o$3=s$1.litElementPolyfillSupport;o$3?.({LitElement:i$1});(s$1.litElementVersions??=[]).push("4.2.0");

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const t$2=t=>(e,o)=>{void 0!==o?o.addInitializer((()=>{customElements.define(t,e);})):customElements.define(t,e);};

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */const o$2={attribute:!0,type:String,converter:u$3,reflect:!1,hasChanged:f$1},r$3=(t=o$2,e,r)=>{const{kind:n,metadata:i}=r;let s=globalThis.litPropertyMetadata.get(i);if(void 0===s&&globalThis.litPropertyMetadata.set(i,s=new Map),"setter"===n&&((t=Object.create(t)).wrapped=!0),s.set(r.name,t),"accessor"===n){const{name:o}=r;return {set(r){const n=e.get.call(this);e.set.call(this,r),this.requestUpdate(o,n,t);},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===n){const{name:o}=r;return function(r){const n=this[o];e.call(this,r),this.requestUpdate(o,n,t);}}throw Error("Unsupported decorator location: "+n)};function n$1(t){return (e,o)=>"object"==typeof o?r$3(t,e,o):((t,e,o)=>{const r=e.hasOwnProperty(o);return e.constructor.createProperty(o,t),r?Object.getOwnPropertyDescriptor(e,o):void 0})(t,e,o)}

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */function r$2(r){return n$1({...r,state:!0,attribute:!1})}

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const e$4=(e,t,c)=>(c.configurable=!0,c.enumerable=!0,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,c),c);

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */function e$3(e,r){return (n,s,i)=>{const o=t=>t.renderRoot?.querySelector(e)??null;if(r){const{get:e,set:r}="object"==typeof s?n:i??(()=>{const t=Symbol();return {get(){return this[t]},set(e){this[t]=e;}}})();return e$4(n,s,{get(){let t=e.call(this);return void 0===t&&(t=o(this),(null!==t||this.hasUpdated)&&r.call(this,t)),t}})}return e$4(n,s,{get(){return o(this)}})}}

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    let e$2;function r$1(r){return (n,o)=>e$4(n,o,{get(){return (this.renderRoot??(e$2??=document.createDocumentFragment())).querySelectorAll(r)}})}

    /**
     * @license
     * Copyright 2021 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */function o$1(o){return (e,n)=>{const{slot:r,selector:s}=o??{},c="slot"+(r?`[name=${r}]`:":not([name])");return e$4(e,n,{get(){const t=this.renderRoot?.querySelector(c),e=t?.assignedElements(o)??[];return void 0===s?e:e.filter((t=>t.matches(s)))}})}}

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */function n(n){return (o,r)=>{const{slot:e}=n??{},s="slot"+(e?`[name=${e}]`:":not([name])");return e$4(o,r,{get(){const t=this.renderRoot?.querySelector(s);return t?.assignedNodes(n)??[]}})}}

    const VERSION = '1.16.1';
    const CONFIG_KEY = '__vscodeElements_disableRegistryWarning__';
    class VscElement extends i$1 {
        /** VSCode Elements version */
        get version() {
            return VERSION;
        }
    }
    /**
     * Own implementation of Lit's customElement decorator.
     */
    const customElement = (tagName) => {
        return (classOrTarget) => {
            const customElementClass = customElements.get(tagName);
            if (!customElementClass) {
                customElements.define(tagName, classOrTarget);
                return;
            }
            if (CONFIG_KEY in window) {
                return;
            }
            const el = document.createElement(tagName);
            const anotherVersion = el?.version;
            let message = '';
            if (!anotherVersion) {
                console.warn(tagName, 'is already registered by an unknown custom element handler class.');
                message +=
                    'is already registered by an unknown custom element handler class.';
            }
            else if (anotherVersion !== VERSION) {
                message +=
                    'is already registered by a different version of VSCode Elements. ';
                message += `This version is "${VERSION}", while the other one is "${anotherVersion}".`;
            }
            else {
                message +=
                    'is already registered by the same version of VSCode Elements. ';
            }
            console.warn(`[VSCode Elements] ${tagName} ${message}\nTo suppress this warning, set window.${CONFIG_KEY} to true`);
        };
    };

    var defaultStyles = i$4 `
  :host([hidden]) {
    display: none;
  }

  :host([disabled]),
  :host(:disabled) {
    cursor: not-allowed;
    opacity: 0.4;
    pointer-events: none;
  }
`;

    const DEFAULT_LINE_HEIGHT = 16;
    const DEFAULT_FONT_SIZE = 13;
    const INPUT_LINE_HEIGHT_RATIO = DEFAULT_LINE_HEIGHT / DEFAULT_FONT_SIZE;
    function getDefaultFontStack() {
        if (navigator.userAgent.indexOf('Linux') > -1) {
            return 'system-ui, "Ubuntu", "Droid Sans", sans-serif';
        }
        else if (navigator.userAgent.indexOf('Mac') > -1) {
            return '-apple-system, BlinkMacSystemFont, sans-serif';
        }
        else if (navigator.userAgent.indexOf('Windows') > -1) {
            return '"Segoe WPC", "Segoe UI", sans-serif';
        }
        else {
            return 'sans-serif';
        }
    }

    const defaultFontStack$2 = r$6(getDefaultFontStack());
    const styles$x = [
        defaultStyles,
        i$4 `
    :host {
      background-color: var(--vscode-badge-background, #616161);
      border: 1px solid var(--vscode-contrastBorder, transparent);
      border-radius: 2px;
      box-sizing: border-box;
      color: var(--vscode-badge-foreground, #f8f8f8);
      display: inline-block;
      font-family: var(--vscode-font-family, ${defaultFontStack$2});
      font-size: 11px;
      font-weight: 400;
      line-height: 14px;
      min-width: 18px;
      padding: 2px 3px;
      text-align: center;
      white-space: nowrap;
    }

    :host([variant='counter']) {
      border-radius: 11px;
      line-height: 11px;
      min-height: 18px;
      min-width: 18px;
      padding: 3px 6px;
    }

    :host([variant='activity-bar-counter']) {
      background-color: var(--vscode-activityBarBadge-background, #0078d4);
      border-radius: 20px;
      color: var(--vscode-activityBarBadge-foreground, #ffffff);
      font-size: 9px;
      font-weight: 600;
      line-height: 16px;
      padding: 0 4px;
    }

    :host([variant='tab-header-counter']) {
      background-color: var(--vscode-activityBarBadge-background, #0078d4);
      border-radius: 10px;
      color: var(--vscode-activityBarBadge-foreground, #ffffff);
      line-height: 10px;
      min-height: 16px;
      min-width: 16px;
      padding: 3px 5px;
    }
  `,
    ];

    var __decorate$C = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Show counts or status information. Badges can also be used within [Textfield](https://vscode-elements.github.io/components/textfield) and [TabHeader](https://vscode-elements.github.io/components/tabs) components.
     *
     * @tag vscode-badge
     *
     * @cssprop [--vscode-font-family=sans-serif] - A sans-serif font type depends on the host OS.
     * @cssprop [--vscode-contrastBorder=transparent]
     * @cssprop [--vscode-badge-background=#616161] - default and counter variant background color
     * @cssprop [--vscode-badge-foreground=#f8f8f8] - default and counter variant foreground color
     * @cssprop [--vscode-activityBarBadge-background=#0078d4] - activity bar variant background color
     * @cssprop [--vscode-activityBarBadge-foreground=#ffffff] - activity bar variant foreground color
     */
    let VscodeBadge = class VscodeBadge extends VscElement {
        constructor() {
            super(...arguments);
            this.variant = 'default';
        }
        render() {
            return x ` <slot></slot> `;
        }
    };
    VscodeBadge.styles = styles$x;
    __decorate$C([
        n$1({ reflect: true })
    ], VscodeBadge.prototype, "variant", void 0);
    VscodeBadge = __decorate$C([
        customElement('vscode-badge')
    ], VscodeBadge);

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const t$1={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},e$1=t=>(...e)=>({_$litDirective$:t,values:e});class i{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i;}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}

    /**
     * @license
     * Copyright 2018 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */const e=e$1(class extends i{constructor(t){if(super(t),t.type!==t$1.ATTRIBUTE||"class"!==t.name||t.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(t){return " "+Object.keys(t).filter((s=>t[s])).join(" ")+" "}update(s,[i]){if(void 0===this.st){this.st=new Set,void 0!==s.strings&&(this.nt=new Set(s.strings.join(" ").split(/\s/).filter((t=>""!==t))));for(const t in i)i[t]&&!this.nt?.has(t)&&this.st.add(t);return this.render(i)}const r=s.element.classList;for(const t of this.st)t in i||(r.remove(t),this.st.delete(t));for(const t in i){const s=!!i[t];s===this.st.has(t)||this.nt?.has(t)||(s?(r.add(t),this.st.add(t)):(r.remove(t),this.st.delete(t)));}return T}});

    /**
     * @license
     * Copyright 2018 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */const o=o=>o??E;

    class StylePropertyMap extends i {
        constructor(partInfo) {
            super(partInfo);
            this._prevProperties = {};
            if (partInfo.type !== t$1.PROPERTY || partInfo.name !== 'style') {
                throw new Error('The `stylePropertyMap` directive must be used in the `style` property');
            }
        }
        update(part, [styleProps]) {
            Object.entries(styleProps).forEach(([key, val]) => {
                if (this._prevProperties[key] !== val) {
                    if (key.startsWith('--')) {
                        part.element.style.setProperty(key, val);
                    }
                    else {
                        // @ts-expect-error I'm so sick of these stupid unresolvable TS errors.
                        part.element.style[key] = val;
                    }
                    this._prevProperties[key] = val;
                }
            });
            return T;
        }
        render(_styleProps) {
            return T;
        }
    }
    /**
     * Implement a Lit directive similar to styleMap, but instead of setting styles via the style
     * attribute (which violates CSP), it should apply styles using the style property.
     *
     * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy#unsafe-inline)
     */
    const stylePropertyMap = e$1(StylePropertyMap);

    const styles$w = [
        defaultStyles,
        i$4 `
    :host {
      color: var(--vscode-icon-foreground, #cccccc);
      display: inline-block;
    }

    .codicon[class*='codicon-'] {
      display: block;
    }

    .icon,
    .button {
      background-color: transparent;
      display: block;
      padding: 0;
    }

    .button {
      border-color: transparent;
      border-style: solid;
      border-width: 1px;
      border-radius: 5px;
      color: currentColor;
      cursor: pointer;
      padding: 2px;
    }

    .button:hover {
      background-color: var(
        --vscode-toolbar-hoverBackground,
        rgba(90, 93, 94, 0.31)
      );
    }

    .button:active {
      background-color: var(
        --vscode-toolbar-activeBackground,
        rgba(99, 102, 103, 0.31)
      );
    }

    .button:focus {
      outline: none;
    }

    .button:focus-visible {
      border-color: var(--vscode-focusBorder, #0078d4);
    }

    @keyframes icon-spin {
      100% {
        transform: rotate(360deg);
      }
    }

    .spin {
      animation-name: icon-spin;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
  `,
    ];

    var __decorate$B = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var VscodeIcon_1;
    /**
     * Display a [Codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html).
     * In "action-icon" mode it behaves like a button. In this case, it is
     * recommended that a meaningful label is specified with the `label` property.
     *
     * @tag vscode-icon
     *
     * @cssprop [--vscode-icon-foreground=#cccccc]
     * @cssprop [--vscode-toolbar-hoverBackground=rgba(90, 93, 94, 0.31)] - Hover state background color in `active-icon` mode
     * @cssprop [--vscode-toolbar-activeBackground=rgba(99, 102, 103, 0.31)] - Active state background color in `active-icon` mode
     * @cssprop [--vscode-focusBorder=#0078d4]
     */
    let VscodeIcon = VscodeIcon_1 = class VscodeIcon extends VscElement {
        constructor() {
            super(...arguments);
            /**
             * Set a meaningful label in `action-icon` mode for the screen readers
             */
            this.label = '';
            /**
             * [Codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html) icon name.
             */
            this.name = '';
            /**
             * Icon size in pixels
             */
            this.size = 16;
            /**
             * Enable rotation animation
             */
            this.spin = false;
            /**
             * Animation duration in seconds
             */
            this.spinDuration = 1.5;
            /**
             * Behaves like a button
             */
            this.actionIcon = false;
            this._onButtonClick = (ev) => {
                this.dispatchEvent(new CustomEvent('vsc-click', { detail: { originalEvent: ev } }));
            };
        }
        connectedCallback() {
            super.connectedCallback();
            const { href, nonce } = this._getStylesheetConfig();
            VscodeIcon_1.stylesheetHref = href;
            VscodeIcon_1.nonce = nonce;
        }
        /**
         * For using web fonts in web components, the font stylesheet must be included
         * twice: on the page and in the web component. This function looks for the
         * font stylesheet on the page and returns the stylesheet URL and the nonce
         * id.
         */
        _getStylesheetConfig() {
            const linkElement = document.getElementById('vscode-codicon-stylesheet');
            const href = linkElement?.getAttribute('href') || undefined;
            const nonce = linkElement?.nonce || undefined;
            if (!linkElement) {
                let msg = '[VSCode Elements] To use the Icon component, the codicons.css file must be included in the page with the id `vscode-codicon-stylesheet`! ';
                msg +=
                    'See https://vscode-elements.github.io/components/icon/ for more details.';
                console.warn(msg);
            }
            return { nonce, href };
        }
        render() {
            const { stylesheetHref, nonce } = VscodeIcon_1;
            const content = x `<span
      class=${e({
            codicon: true,
            ['codicon-' + this.name]: true,
            spin: this.spin,
        })}
      .style=${stylePropertyMap({
            animationDuration: String(this.spinDuration) + 's',
            fontSize: this.size + 'px',
            height: this.size + 'px',
            width: this.size + 'px',
        })}
    ></span>`;
            const wrapped = this.actionIcon
                ? x ` <button
          class="button"
          @click=${this._onButtonClick}
          aria-label=${this.label}
        >
          ${content}
        </button>`
                : x ` <span class="icon" aria-hidden="true" role="presentation"
          >${content}</span
        >`;
            return x `
      <link
        rel="stylesheet"
        href=${o(stylesheetHref)}
        nonce=${o(nonce)}
      >
      ${wrapped}
    `;
        }
    };
    VscodeIcon.styles = styles$w;
    VscodeIcon.stylesheetHref = '';
    VscodeIcon.nonce = '';
    __decorate$B([
        n$1()
    ], VscodeIcon.prototype, "label", void 0);
    __decorate$B([
        n$1({ type: String })
    ], VscodeIcon.prototype, "name", void 0);
    __decorate$B([
        n$1({ type: Number })
    ], VscodeIcon.prototype, "size", void 0);
    __decorate$B([
        n$1({ type: Boolean, reflect: true })
    ], VscodeIcon.prototype, "spin", void 0);
    __decorate$B([
        n$1({ type: Number, attribute: 'spin-duration' })
    ], VscodeIcon.prototype, "spinDuration", void 0);
    __decorate$B([
        n$1({ type: Boolean, reflect: true, attribute: 'action-icon' })
    ], VscodeIcon.prototype, "actionIcon", void 0);
    VscodeIcon = VscodeIcon_1 = __decorate$B([
        customElement('vscode-icon')
    ], VscodeIcon);

    const defaultFontStack$1 = r$6(getDefaultFontStack());
    const styles$v = [
        defaultStyles,
        i$4 `
    :host {
      background-color: var(--vscode-button-background, #0078d4);
      border-color: var(--vscode-button-border, transparent);
      border-style: solid;
      border-radius: 2px;
      border-width: 1px;
      color: var(--vscode-button-foreground, #ffffff);
      cursor: pointer;
      display: inline-flex;
      font-family: var(--vscode-font-family, ${defaultFontStack$1});
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 22px;
      overflow: hidden;
      padding: 0;
      user-select: none;
      white-space: nowrap;
    }

    :host([secondary]) {
      color: var(--vscode-button-secondaryForeground, #cccccc);
      background-color: var(--vscode-button-secondaryBackground, #313131);
      border-color: var(
        --vscode-button-border,
        var(--vscode-button-secondaryBackground, rgba(255, 255, 255, 0.07))
      );
    }

    :host([disabled]) {
      cursor: default;
      opacity: 0.4;
      pointer-events: none;
    }

    :host(:hover) {
      background-color: var(--vscode-button-hoverBackground, #026ec1);
    }

    :host([disabled]:hover) {
      background-color: var(--vscode-button-background, #0078d4);
    }

    :host([secondary]:hover) {
      background-color: var(--vscode-button-secondaryHoverBackground, #3c3c3c);
    }

    :host([secondary][disabled]:hover) {
      background-color: var(--vscode-button-secondaryBackground, #313131);
    }

    :host(:focus),
    :host(:active) {
      outline: none;
    }

    :host(:focus) {
      background-color: var(--vscode-button-hoverBackground, #026ec1);
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: 2px;
    }

    :host([disabled]:focus) {
      background-color: var(--vscode-button-background, #0078d4);
      outline: 0;
    }

    :host([secondary]:focus) {
      background-color: var(--vscode-button-secondaryHoverBackground, #3c3c3c);
    }

    :host([secondary][disabled]:focus) {
      background-color: var(--vscode-button-secondaryBackground, #313131);
    }

    ::slotted(*) {
      display: inline-block;
      margin-left: 4px;
      margin-right: 4px;
    }

    ::slotted(*:first-child) {
      margin-left: 0;
    }

    ::slotted(*:last-child) {
      margin-right: 0;
    }

    ::slotted(vscode-icon) {
      color: inherit;
    }

    .wrapper {
      align-items: center;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      position: relative;
      width: 100%;
      height: 100%;
      padding: 1px 13px;
    }

    :host(:empty) .wrapper,
    :host([icon-only]) .wrapper {
      min-height: 24px;
      min-width: 16px;
      padding: 1px 5px;
    }

    slot {
      align-items: center;
      display: flex;
      height: 100%;
    }

    .icon,
    .icon-after {
      color: inherit;
      display: block;
    }

    :host(:not(:empty)) .icon {
      margin-right: 3px;
    }

    :host(:not(:empty)) .icon-after,
    :host([icon]) .icon-after {
      margin-left: 3px;
    }

    .divider {
      display: var(--divider-display, none);
      background-color: transparent;
      padding: 4px 0;
      box-sizing: border-box;
    }

    :host(:hover) .divider,
    :host(:focus) .divider {
      background-color: var(--vscode-button-hoverBackground, #026ec1);
    }

    :host([secondary]) .divider {
      background-color: var(--vscode-button-secondaryBackground, #313131);
    }

    :host([secondary]:hover) .divider,
    :host([secondary]:focus) .divider {
      background-color: var(--vscode-button-secondaryHoverBackground, #3c3c3c);
    }

    .divider > div {
      background-color: var(
        --vscode-button-separator,
        rgba(255, 255, 255, 0.4)
      );
      height: 100%;
      width: 1px;
      margin: 0;
    }

    :host([secondary]) .divider > div {
      background-color: var(--vscode-button-secondaryForeground, #cccccc);
      opacity: 0.4;
    }
  `,
    ];

    var __decorate$A = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Clickable element that are used to trigger actions.
     *
     * @tag vscode-button
     *
     * @fires vsc-click Dispatched only when button is not in disabled state.
     *
     * @cssprop [--vscode-button-background=#0078d4]
     * @cssprop [--vscode-button-foreground=#ffffff]
     * @cssprop [--vscode-button-border=var(--vscode-button-background, rgba(255, 255, 255, 0.07))]
     * @cssprop [--vscode-button-hoverBackground=#026ec1]
     * @cssprop [--vscode-font-family=sans-serif] - A sans-serif font type depends on the host OS.
     * @cssprop [--vscode-font-size=13px]
     * @cssprop [--vscode-font-weight=normal]
     * @cssprop [--vscode-button-secondaryForeground=#cccccc]
     * @cssprop [--vscode-button-secondaryBackground=#313131]
     * @cssprop [--vscode-button-secondaryHoverBackground=#3c3c3c]
     * @cssprop [--vscode-focusBorder=#0078d4]
     */
    let VscodeButton = class VscodeButton extends VscElement {
        get form() {
            return this._internals.form;
        }
        constructor() {
            super();
            this.autofocus = false;
            /** @internal */
            this.tabIndex = 0;
            /**
             * Button has a less prominent style.
             */
            this.secondary = false;
            /** @internal */
            this.role = 'button';
            this.disabled = false;
            /**
             * A [Codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html) before the label
             */
            this.icon = '';
            /**
             * Spin property for the icon
             */
            this.iconSpin = false;
            /**
             * A [Codicon](https://microsoft.github.io/vscode-codicons/dist/codicon.html) after the label
             */
            this.iconAfter = '';
            /**
             * Spin property for the after icon
             */
            this.iconAfterSpin = false;
            this.focused = false;
            this.name = undefined;
            this.iconOnly = false;
            this.type = 'button';
            this.value = '';
            this._prevTabindex = 0;
            this._handleFocus = () => {
                this.focused = true;
            };
            this._handleBlur = () => {
                this.focused = false;
            };
            this.addEventListener('keydown', this._handleKeyDown.bind(this));
            this.addEventListener('click', this._handleClick.bind(this));
            this._internals = this.attachInternals();
        }
        connectedCallback() {
            super.connectedCallback();
            if (this.autofocus) {
                if (this.tabIndex < 0) {
                    this.tabIndex = 0;
                }
                this.updateComplete.then(() => {
                    this.focus();
                    this.requestUpdate();
                });
            }
            this.addEventListener('focus', this._handleFocus);
            this.addEventListener('blur', this._handleBlur);
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            this.removeEventListener('focus', this._handleFocus);
            this.removeEventListener('blur', this._handleBlur);
        }
        update(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changedProperties) {
            super.update(changedProperties);
            if (changedProperties.has('value')) {
                this._internals.setFormValue(this.value);
            }
            if (changedProperties.has('disabled')) {
                if (this.disabled) {
                    // Save the original tabIndex, which may have been modified by the user.
                    this._prevTabindex = this.tabIndex;
                    // It's a native property, we don't care about re-rendering.
                    // eslint-disable-next-line lit/no-property-change-update
                    this.tabIndex = -1;
                }
                else {
                    // eslint-disable-next-line lit/no-property-change-update
                    this.tabIndex = this._prevTabindex;
                }
            }
        }
        _executeAction() {
            if (this.type === 'submit' && this._internals.form) {
                this._internals.form.requestSubmit();
            }
            if (this.type === 'reset' && this._internals.form) {
                this._internals.form.reset();
            }
        }
        _handleKeyDown(event) {
            if ((event.key === 'Enter' || event.key === ' ') &&
                !this.hasAttribute('disabled')) {
                /**
                 * @deprecated
                 * Please use the standard `click` event.
                 */
                this.dispatchEvent(new CustomEvent('vsc-click', {
                    detail: {
                        originalEvent: new MouseEvent('click'),
                    },
                }));
                const syntheticClick = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                });
                syntheticClick.synthetic = true;
                this.dispatchEvent(syntheticClick);
                this._executeAction();
            }
        }
        _handleClick(event) {
            if (event.synthetic) {
                return;
            }
            if (!this.hasAttribute('disabled')) {
                this.dispatchEvent(new CustomEvent('vsc-click', {
                    detail: {
                        originalEvent: event,
                    },
                }));
                this._executeAction();
            }
        }
        render() {
            const hasIcon = this.icon !== '';
            const hasIconAfter = this.iconAfter !== '';
            const wrapperClasses = {
                wrapper: true,
                'has-icon-before': hasIcon,
                'has-icon-after': hasIconAfter,
                'icon-only': this.iconOnly,
            };
            const iconElem = hasIcon
                ? x `<vscode-icon
          name=${this.icon}
          ?spin=${this.iconSpin}
          spin-duration=${o(this.iconSpinDuration)}
          class="icon"
        ></vscode-icon>`
                : E;
            const iconAfterElem = hasIconAfter
                ? x `<vscode-icon
          name=${this.iconAfter}
          ?spin=${this.iconAfterSpin}
          spin-duration=${o(this.iconAfterSpinDuration)}
          class="icon-after"
        ></vscode-icon>`
                : E;
            return x `
      <span class=${e(wrapperClasses)}>
        ${iconElem}
        <slot></slot>
        ${iconAfterElem}
      </span>
      <div class="divider"><div></div></div>
    `;
        }
    };
    VscodeButton.styles = styles$v;
    /** @internal */
    VscodeButton.formAssociated = true;
    __decorate$A([
        n$1({ type: Boolean, reflect: true })
    ], VscodeButton.prototype, "autofocus", void 0);
    __decorate$A([
        n$1({ type: Number, reflect: true })
    ], VscodeButton.prototype, "tabIndex", void 0);
    __decorate$A([
        n$1({ type: Boolean, reflect: true })
    ], VscodeButton.prototype, "secondary", void 0);
    __decorate$A([
        n$1({ reflect: true })
    ], VscodeButton.prototype, "role", void 0);
    __decorate$A([
        n$1({ type: Boolean, reflect: true })
    ], VscodeButton.prototype, "disabled", void 0);
    __decorate$A([
        n$1()
    ], VscodeButton.prototype, "icon", void 0);
    __decorate$A([
        n$1({ type: Boolean, reflect: true, attribute: 'icon-spin' })
    ], VscodeButton.prototype, "iconSpin", void 0);
    __decorate$A([
        n$1({ type: Number, reflect: true, attribute: 'icon-spin-duration' })
    ], VscodeButton.prototype, "iconSpinDuration", void 0);
    __decorate$A([
        n$1({ attribute: 'icon-after' })
    ], VscodeButton.prototype, "iconAfter", void 0);
    __decorate$A([
        n$1({ type: Boolean, reflect: true, attribute: 'icon-after-spin' })
    ], VscodeButton.prototype, "iconAfterSpin", void 0);
    __decorate$A([
        n$1({
            type: Number,
            reflect: true,
            attribute: 'icon-after-spin-duration',
        })
    ], VscodeButton.prototype, "iconAfterSpinDuration", void 0);
    __decorate$A([
        n$1({ type: Boolean, reflect: true })
    ], VscodeButton.prototype, "focused", void 0);
    __decorate$A([
        n$1({ type: String, reflect: true })
    ], VscodeButton.prototype, "name", void 0);
    __decorate$A([
        n$1({ type: Boolean, reflect: true, attribute: 'icon-only' })
    ], VscodeButton.prototype, "iconOnly", void 0);
    __decorate$A([
        n$1({ reflect: true })
    ], VscodeButton.prototype, "type", void 0);
    __decorate$A([
        n$1()
    ], VscodeButton.prototype, "value", void 0);
    VscodeButton = __decorate$A([
        customElement('vscode-button')
    ], VscodeButton);

    const styles$u = [
        defaultStyles,
        i$4 `
    :host {
      display: inline-flex;
      align-items: stretch;
      padding: 0;
      border: none;
    }

    ::slotted(vscode-button:not(:first-child)) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-left-width: 0;
    }

    ::slotted(vscode-button:not(:last-child)) {
      --divider-display: block;

      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      border-right-width: 0;
    }

    ::slotted(vscode-button:focus) {
      z-index: 1;
    }
  `,
    ];

    var __decorate$z = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Shows a split button, including several components in a single button. Commonly used to show a button with a dropdown to the right.
     *
     * @tag vscode-button-group
     *
     * @cssprop [--vscode-button-background=#0078d4]
     * @cssprop [--vscode-button-foreground=#ffffff]
     * @cssprop [--vscode-button-border=var(--vscode-button-background, rgba(255, 255, 255, 0.07))]
     * @cssprop [--vscode-button-hoverBackground=#026ec1]
     * @cssprop [--vscode-font-family=sans-serif] - A sans-serif font type depends on the host OS.
     * @cssprop [--vscode-font-size=13px]
     * @cssprop [--vscode-font-weight=normal]
     * @cssprop [--vscode-button-secondaryForeground=#cccccc]
     * @cssprop [--vscode-button-secondaryBackground=#313131]
     * @cssprop [--vscode-button-secondaryHoverBackground=#3c3c3c]
     * @cssprop [--vscode-focusBorder=#0078d4]
     */
    let VscodeButtonGroup = class VscodeButtonGroup extends VscElement {
        render() {
            return x ` <slot></slot> `;
        }
    };
    VscodeButtonGroup.styles = styles$u;
    VscodeButtonGroup = __decorate$z([
        t$2('vscode-button-group')
    ], VscodeButtonGroup);

    var __decorate$y = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    class FormButtonWidgetBase extends VscElement {
        constructor() {
            super();
            this.focused = false;
            this._prevTabindex = 0;
            this._handleFocus = () => {
                this.focused = true;
            };
            this._handleBlur = () => {
                this.focused = false;
            };
        }
        connectedCallback() {
            super.connectedCallback();
            this.addEventListener('focus', this._handleFocus);
            this.addEventListener('blur', this._handleBlur);
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            this.removeEventListener('focus', this._handleFocus);
            this.removeEventListener('blur', this._handleBlur);
        }
        attributeChangedCallback(name, oldVal, newVal) {
            super.attributeChangedCallback(name, oldVal, newVal);
            if (name === 'disabled' && this.hasAttribute('disabled')) {
                this._prevTabindex = this.tabIndex;
                this.tabIndex = -1;
            }
            else if (name === 'disabled' && !this.hasAttribute('disabled')) {
                this.tabIndex = this._prevTabindex;
            }
        }
    }
    __decorate$y([
        n$1({ type: Boolean, reflect: true })
    ], FormButtonWidgetBase.prototype, "focused", void 0);

    var __decorate$x = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    const LabelledCheckboxOrRadioMixin = (superClass) => {
        class LabelledCheckboxOrRadio extends superClass {
            constructor() {
                super(...arguments);
                this._label = '';
                this._slottedText = '';
            }
            set label(val) {
                this._label = val;
                if (this._slottedText === '') {
                    this.setAttribute('aria-label', val);
                }
            }
            get label() {
                return this._label;
            }
            _handleSlotChange() {
                this._slottedText = this.textContent ? this.textContent.trim() : '';
                if (this._slottedText !== '') {
                    this.setAttribute('aria-label', this._slottedText);
                }
            }
            _renderLabelAttribute() {
                return this._slottedText === ''
                    ? x `<span class="label-attr">${this._label}</span>`
                    : x `${E}`;
            }
        }
        __decorate$x([
            n$1()
        ], LabelledCheckboxOrRadio.prototype, "label", null);
        return LabelledCheckboxOrRadio;
    };

    var baseStyles = [
        i$4 `
    :host {
      color: var(--vscode-foreground, #cccccc);
      display: inline-block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 18px;
    }

    :host(:focus) {
      outline: none;
    }

    :host([disabled]) {
      opacity: 0.4;
    }

    .wrapper {
      cursor: pointer;
      display: block;
      font-size: var(--vscode-font-size, 13px);
      margin-bottom: 4px;
      margin-top: 4px;
      min-height: 18px;
      position: relative;
      user-select: none;
    }

    :host([disabled]) .wrapper {
      cursor: default;
    }

    input {
      position: absolute;
      height: 1px;
      left: 9px;
      margin: 0;
      top: 17px;
      width: 1px;
      overflow: hidden;
      clip: rect(1px, 1px, 1px, 1px);
      white-space: nowrap;
    }

    .icon {
      align-items: center;
      background-color: var(--vscode-settings-checkboxBackground, #313131);
      background-size: 16px;
      border: 1px solid var(--vscode-settings-checkboxBorder, #3c3c3c);
      box-sizing: border-box;
      color: var(--vscode-settings-checkboxForeground, #cccccc);
      display: flex;
      height: 18px;
      justify-content: center;
      left: 0;
      margin-left: 0;
      margin-right: 9px;
      padding: 0;
      pointer-events: none;
      position: absolute;
      top: 0;
      width: 18px;
    }

    .icon.before-empty-label {
      margin-right: 0;
    }

    .label {
      cursor: pointer;
      display: block;
      min-height: 18px;
      min-width: 18px;
    }

    .label-inner {
      display: block;
      opacity: 0.9;
      padding-left: 27px;
    }

    .label-inner.empty {
      padding-left: 0;
    }

    :host([disabled]) .label {
      cursor: default;
    }
  `,
    ];

    const styles$t = [
        defaultStyles,
        baseStyles,
        i$4 `
    :host(:invalid) .icon,
    :host([invalid]) .icon {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    .icon {
      border-radius: 3px;
    }

    .indeterminate-icon {
      background-color: currentColor;
      position: absolute;
      height: 1px;
      width: 12px;
    }

    :host(:focus):host(:not([disabled])) .icon {
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: -1px;
    }
  `,
    ];

    var __decorate$w = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Allows users to select one or more options from a set. When participating in a form, it supports
     * the `:invalid` pseudo class. Otherwise the error styles can be applied through the `invalid`
     * property.
     *
     * @tag vscode-checkbox
     *
     * @attr name - Name which is used as a variable name in the data of the form-container.
     * @attr label - Attribute pair of the `label` property.
     * @prop label - Label text. It is only applied if component's innerHTML doesn't contain any text.
     *
     * @fires {Event} change - Dispatched when checked state is changed. The event is bubbled, so it can be listened on a parent element like the `CheckboxGroup`.
     * @fires {Event} invalid - Dispatched when the element is invalid and `checkValidity()` has been called or the form containing this element is submitted.
     *
     * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/invalid_event)
     *
     * @cssprop [--vscode-font-family=sans-serif]
     * @cssprop [--vscode-font-size=13px]
     * @cssprop [--vscode-font-weight=normal]
     * @cssprop [--vscode-foreground=#cccccc]
     * @cssprop [--vscode-settings-checkboxBackground=#313131]
     * @cssprop [--vscode-settings-checkboxBorder=#3c3c3c]
     * @cssprop [--vscode-settings-checkboxForeground=#cccccc]
     * @cssprop [--vscode-focusBorder=#0078d4]
     * @cssprop [--vscode-inputValidation-errorBackground=#5a1d1d]
     * @cssprop [--vscode-inputValidation-errorBorder=#be1100]
     */
    let VscodeCheckbox = class VscodeCheckbox extends LabelledCheckboxOrRadioMixin(FormButtonWidgetBase) {
        set checked(newVal) {
            this._checked = newVal;
            this._manageRequired();
            this.requestUpdate();
        }
        get checked() {
            return this._checked;
        }
        set required(newVal) {
            this._required = newVal;
            this._manageRequired();
            this.requestUpdate();
        }
        get required() {
            return this._required;
        }
        get form() {
            return this._internals.form;
        }
        get validity() {
            return this._internals.validity;
        }
        get validationMessage() {
            return this._internals.validationMessage;
        }
        get willValidate() {
            return this._internals.willValidate;
        }
        /**
         * Returns `true` if the element's value is valid; otherwise, it returns `false`.
         * If the element's value is invalid, an invalid event is triggered on the element.
         *
         * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/checkValidity)
         */
        checkValidity() {
            return this._internals.checkValidity();
        }
        /**
         * Returns `true` if the element's value is valid; otherwise, it returns `false`.
         * If the element's value is invalid, an invalid event is triggered on the element, and the
         * browser displays an error message to the user.
         *
         * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/reportValidity)
         */
        reportValidity() {
            return this._internals.reportValidity();
        }
        constructor() {
            super();
            /**
             * Automatically focus on the element when the page loads.
             *
             * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus)
             */
            this.autofocus = false;
            this._checked = false;
            /**
             * The element's initial checked state, which will be restored when the containing form is reset.
             */
            this.defaultChecked = false;
            this.invalid = false;
            this.name = undefined;
            /**
             * Associate a value to the checkbox. According to the native checkbox [specification](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#value_2), If the component participates in a form:
             *
             * - If it is unchecked, the value will not be submitted.
             * - If it is checked but the value is not set, `on` will be submitted.
             * - If it is checked and value is set, the value will be submitted.
             */
            this.value = '';
            this.disabled = false;
            this.indeterminate = false;
            this._required = false;
            /** @internal */
            this.type = 'checkbox';
            this._handleClick = (ev) => {
                ev.preventDefault();
                if (this.disabled) {
                    return;
                }
                this._toggleState();
            };
            this._handleKeyDown = (ev) => {
                if (!this.disabled && (ev.key === 'Enter' || ev.key === ' ')) {
                    ev.preventDefault();
                    if (ev.key === ' ') {
                        this._toggleState();
                    }
                    if (ev.key === 'Enter') {
                        this._internals.form?.requestSubmit();
                    }
                }
            };
            this._internals = this.attachInternals();
        }
        connectedCallback() {
            super.connectedCallback();
            this.addEventListener('keydown', this._handleKeyDown);
            this.updateComplete.then(() => {
                this._manageRequired();
                this._setActualFormValue();
            });
        }
        disconnectedCallback() {
            this.removeEventListener('keydown', this._handleKeyDown);
        }
        update(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changedProperties) {
            super.update(changedProperties);
            if (changedProperties.has('checked')) {
                this.ariaChecked = this.checked ? 'true' : 'false';
            }
        }
        /** @internal */
        formResetCallback() {
            this.checked = this.defaultChecked;
        }
        /** @internal */
        formStateRestoreCallback(state, _mode) {
            if (state) {
                this.checked = true;
            }
        }
        // Sets the value of the control according to the native checkbox behavior.
        // - If the checkbox is unchecked, the value will be null, so the control will
        //   excluded from the form.
        // - If the control is checked but the value is not set, the value will be "on".
        // - If the control is checked and value is set, the value won't be changed.
        _setActualFormValue() {
            let actualValue = '';
            if (this.checked) {
                actualValue = !this.value ? 'on' : this.value;
            }
            else {
                actualValue = null;
            }
            this._internals.setFormValue(actualValue);
        }
        _toggleState() {
            this.checked = !this.checked;
            this.indeterminate = false;
            this._setActualFormValue();
            this._manageRequired();
            this.dispatchEvent(new Event('change', { bubbles: true }));
            /** @deprecated */
            this.dispatchEvent(new CustomEvent('vsc-change', {
                detail: {
                    checked: this.checked,
                    label: this.label,
                    value: this.value,
                },
                bubbles: true,
                composed: true,
            }));
        }
        _manageRequired() {
            if (!this.checked && this.required) {
                this._internals.setValidity({
                    valueMissing: true,
                }, 'Please check this box if you want to proceed.', this._inputEl ?? undefined);
            }
            else {
                this._internals.setValidity({});
            }
        }
        render() {
            const iconClasses = e({
                icon: true,
                checked: this.checked,
                indeterminate: this.indeterminate,
            });
            const labelInnerClasses = e({
                'label-inner': true,
            });
            const icon = x `<svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      class="check-icon"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z"
      />
    </svg>`;
            const check = this.checked && !this.indeterminate ? icon : E;
            const indeterminate = this.indeterminate
                ? x `<span class="indeterminate-icon"></span>`
                : E;
            return x `
      <div class="wrapper">
        <input
          ?autofocus=${this.autofocus}
          id="input"
          class="checkbox"
          type="checkbox"
          ?checked=${this.checked}
          value=${this.value}
        >
        <div class=${iconClasses}>${indeterminate}${check}</div>
        <label for="input" class="label" @click=${this._handleClick}>
          <span class=${labelInnerClasses}>
            ${this._renderLabelAttribute()}
            <slot @slotchange=${this._handleSlotChange}></slot>
          </span>
        </label>
      </div>
    `;
        }
    };
    VscodeCheckbox.styles = styles$t;
    /** @internal */
    VscodeCheckbox.formAssociated = true;
    /** @internal */
    VscodeCheckbox.shadowRootOptions = {
        ...i$1.shadowRootOptions,
        delegatesFocus: true,
    };
    __decorate$w([
        n$1({ type: Boolean, reflect: true })
    ], VscodeCheckbox.prototype, "autofocus", void 0);
    __decorate$w([
        n$1({ type: Boolean, reflect: true })
    ], VscodeCheckbox.prototype, "checked", null);
    __decorate$w([
        n$1({ type: Boolean, reflect: true, attribute: 'default-checked' })
    ], VscodeCheckbox.prototype, "defaultChecked", void 0);
    __decorate$w([
        n$1({ type: Boolean, reflect: true })
    ], VscodeCheckbox.prototype, "invalid", void 0);
    __decorate$w([
        n$1({ reflect: true })
    ], VscodeCheckbox.prototype, "name", void 0);
    __decorate$w([
        n$1()
    ], VscodeCheckbox.prototype, "value", void 0);
    __decorate$w([
        n$1({ type: Boolean, reflect: true })
    ], VscodeCheckbox.prototype, "disabled", void 0);
    __decorate$w([
        n$1({ type: Boolean, reflect: true })
    ], VscodeCheckbox.prototype, "indeterminate", void 0);
    __decorate$w([
        n$1({ type: Boolean, reflect: true })
    ], VscodeCheckbox.prototype, "required", null);
    __decorate$w([
        n$1()
    ], VscodeCheckbox.prototype, "type", void 0);
    __decorate$w([
        e$3('#input')
    ], VscodeCheckbox.prototype, "_inputEl", void 0);
    VscodeCheckbox = __decorate$w([
        customElement('vscode-checkbox')
    ], VscodeCheckbox);

    const styles$s = [
        defaultStyles,
        i$4 `
    :host {
      display: block;
    }

    .wrapper {
      display: flex;
      flex-wrap: wrap;
    }

    :host([variant='vertical']) .wrapper {
      display: block;
    }

    ::slotted(vscode-checkbox) {
      margin-right: 20px;
    }

    ::slotted(vscode-checkbox:last-child) {
      margin-right: 0;
    }

    :host([variant='vertical']) ::slotted(vscode-checkbox) {
      display: block;
      margin-bottom: 15px;
    }

    :host([variant='vertical']) ::slotted(vscode-checkbox:last-child) {
      margin-bottom: 0;
    }
  `,
    ];

    var __decorate$v = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Arranges a group of checkboxes horizontally or vertically.
     *
     * @tag vscode-checkbox-group
     */
    let VscodeCheckboxGroup = class VscodeCheckboxGroup extends VscElement {
        constructor() {
            super(...arguments);
            /** @internal */
            this.role = 'group';
            this.variant = 'horizontal';
        }
        render() {
            return x `
      <div class="wrapper">
        <slot></slot>
      </div>
    `;
        }
    };
    VscodeCheckboxGroup.styles = styles$s;
    __decorate$v([
        n$1({ reflect: true })
    ], VscodeCheckboxGroup.prototype, "role", void 0);
    __decorate$v([
        n$1({ reflect: true })
    ], VscodeCheckboxGroup.prototype, "variant", void 0);
    VscodeCheckboxGroup = __decorate$v([
        customElement('vscode-checkbox-group')
    ], VscodeCheckboxGroup);

    const styles$r = [
        defaultStyles,
        i$4 `
    .collapsible {
      background-color: var(--vscode-sideBar-background, #181818);
    }

    .collapsible-header {
      align-items: center;
      background-color: var(--vscode-sideBarSectionHeader-background, #181818);
      cursor: pointer;
      display: flex;
      height: 22px;
      line-height: 22px;
      user-select: none;
    }

    .collapsible-header:focus {
      opacity: 1;
      outline-offset: -1px;
      outline-style: solid;
      outline-width: 1px;
      outline-color: var(--vscode-focusBorder, #0078d4);
    }

    .title {
      color: var(--vscode-sideBarTitle-foreground, #cccccc);
      display: block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: 11px;
      font-weight: 700;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .title .description {
      font-weight: 400;
      margin-left: 10px;
      text-transform: none;
      opacity: 0.6;
    }

    .header-icon {
      color: var(--vscode-icon-foreground, #cccccc);
      display: block;
      flex-shrink: 0;
      margin: 0 3px;
    }

    .collapsible.open .header-icon {
      transform: rotate(90deg);
    }

    .header-slots {
      align-items: center;
      display: flex;
      height: 22px;
      margin-left: auto;
      margin-right: 4px;
    }

    .actions {
      display: none;
    }

    .collapsible.open .actions {
      display: block;
    }

    .header-slots slot {
      display: flex;
      max-height: 22px;
      overflow: hidden;
    }

    .header-slots slot::slotted(div) {
      align-items: center;
      display: flex;
    }

    .collapsible-body {
      display: none;
      overflow: hidden;
    }

    .collapsible.open .collapsible-body {
      display: block;
    }
  `,
    ];

    var __decorate$u = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Allows users to reveal or hide related content on a page.
     *
     * @tag vscode-collapsible
     *
     * @slot - Main content.
     * @slot actions - You can place any action icon in this slot in the header, but it's also possible to use any HTML element in it. It's only visible when the component is open.
     * @slot decorations - The elements placed in the decorations slot are always visible.
     *
     * @fires {VscCollapsibleToggleEvent} vsc-collapsible-toggle - Dispatched when the content visibility is changed.
     *
     * @cssprop [--vscode-sideBar-background=#181818] - Background color
     * @cssprop [--vscode-focusBorder=#0078d4] - Focus border color
     * @cssprop [--vscode-font-family=sans-serif] - Header font family
     * @cssprop [--vscode-sideBarSectionHeader-background=#181818] - Header background
     * @cssprop [--vscode-icon-foreground=#cccccc] - Arrow icon color
     * @cssprop [--vscode-sideBarTitle-foreground=#cccccc] - Header font color
     *
     * @csspart body - Container for the toggleable content of the component. The container's overflow content is hidden by default. This CSS part can serve as an escape hatch to modify this behavior.
     */
    let VscodeCollapsible = class VscodeCollapsible extends VscElement {
        constructor() {
            super(...arguments);
            /** Component heading text */
            this.title = '';
            /** Less prominent text than the title in the header */
            this.description = '';
            this.open = false;
        }
        _emitToggleEvent() {
            this.dispatchEvent(new CustomEvent('vsc-collapsible-toggle', {
                detail: { open: this.open },
            }));
        }
        _onHeaderClick() {
            this.open = !this.open;
            this._emitToggleEvent();
        }
        _onHeaderKeyDown(event) {
            if (event.key === 'Enter') {
                this.open = !this.open;
                this._emitToggleEvent();
            }
        }
        render() {
            const classes = e({ collapsible: true, open: this.open });
            const icon = x `<svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      class="header-icon"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M10.072 8.024L5.715 3.667l.618-.62L11 7.716v.618L6.333 13l-.618-.619 4.357-4.357z"
      />
    </svg>`;
            const descriptionMarkup = this.description
                ? x `<span class="description">${this.description}</span>`
                : E;
            return x `
      <div class=${classes}>
        <div
          class="collapsible-header"
          tabindex="0"
          title=${this.title}
          @click=${this._onHeaderClick}
          @keydown=${this._onHeaderKeyDown}
        >
          ${icon}
          <h3 class="title">${this.title}${descriptionMarkup}</h3>
          <div class="header-slots">
            <div class="actions"><slot name="actions"></slot></div>
            <div class="decorations"><slot name="decorations"></slot></div>
          </div>
        </div>
        <div class="collapsible-body" part="body">
          <slot></slot>
        </div>
      </div>
    `;
        }
    };
    VscodeCollapsible.styles = styles$r;
    __decorate$u([
        n$1({ type: String })
    ], VscodeCollapsible.prototype, "title", void 0);
    __decorate$u([
        n$1()
    ], VscodeCollapsible.prototype, "description", void 0);
    __decorate$u([
        n$1({ type: Boolean, reflect: true })
    ], VscodeCollapsible.prototype, "open", void 0);
    VscodeCollapsible = __decorate$u([
        customElement('vscode-collapsible')
    ], VscodeCollapsible);

    const styles$q = [
        defaultStyles,
        i$4 `
    :host {
      display: block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 1.4em;
      outline: none;
      position: relative;
    }

    .context-menu-item {
      background-color: var(--vscode-menu-background, #1f1f1f);
      color: var(--vscode-menu-foreground, #cccccc);
      display: flex;
      user-select: none;
      white-space: nowrap;
    }

    .ruler {
      border-bottom: 1px solid var(--vscode-menu-separatorBackground, #454545);
      display: block;
      margin: 0 0 4px;
      padding-top: 4px;
      width: 100%;
    }

    .context-menu-item a {
      align-items: center;
      border-color: transparent;
      border-radius: 3px;
      border-style: solid;
      border-width: 1px;
      box-sizing: border-box;
      color: var(--vscode-menu-foreground, #cccccc);
      cursor: pointer;
      display: flex;
      flex: 1 1 auto;
      height: 2em;
      margin-left: 4px;
      margin-right: 4px;
      outline: none;
      position: relative;
      text-decoration: inherit;
    }

    :host([selected]) .context-menu-item a {
      background-color: var(--vscode-menu-selectionBackground, #0078d4);
      border-color: var(--vscode-menu-selectionBorder, transparent);
      color: var(--vscode-menu-selectionForeground, #ffffff);
    }

    .label {
      background: none;
      display: flex;
      flex: 1 1 auto;
      font-size: 12px;
      line-height: 1;
      padding: 0 22px;
      text-decoration: none;
    }

    .keybinding {
      display: block;
      flex: 2 1 auto;
      line-height: 1;
      padding: 0 22px;
      text-align: right;
    }
  `,
    ];

    var __decorate$t = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-context-menu-item
     *
     * Child component of [ContextMenu](/components/context-menu/).
     *
     * @cssprop [--vscode-font-family=sans-serif]
     * @cssprop [--vscode-font-size=13px]
     * @cssprop [--vscode-font-weight=normal]
     * @cssprop [--vscode-menu-background=#1f1f1f]
     * @cssprop [--vscode-menu-selectionBorder=transparent]
     * @cssprop [--vscode-menu-foreground=#cccccc]
     * @cssprop [--vscode-menu-selectionBackground=#0078d4]
     * @cssprop [--vscode-menu-selectionForeground=#ffffff]
     * @cssprop [--vscode-menu-separatorBackground=#454545]
     */
    let VscodeContextMenuItem = class VscodeContextMenuItem extends VscElement {
        constructor() {
            super(...arguments);
            this.label = '';
            this.keybinding = '';
            this.value = '';
            this.separator = false;
            this.tabindex = 0;
        }
        onItemClick() {
            /** @internal */
            this.dispatchEvent(new CustomEvent('vsc-click', {
                detail: {
                    label: this.label,
                    keybinding: this.keybinding,
                    value: this.value || this.label,
                    separator: this.separator,
                    tabindex: this.tabindex,
                },
                bubbles: true,
                composed: true,
            }));
        }
        render() {
            return x `
      ${this.separator
            ? x `
            <div class="context-menu-item separator">
              <span class="ruler"></span>
            </div>
          `
            : x `
            <div class="context-menu-item">
              <a @click=${this.onItemClick}>
                ${this.label
                ? x `<span class="label">${this.label}</span>`
                : E}
                ${this.keybinding
                ? x `<span class="keybinding">${this.keybinding}</span>`
                : E}
              </a>
            </div>
          `}
    `;
        }
    };
    VscodeContextMenuItem.styles = styles$q;
    __decorate$t([
        n$1({ type: String })
    ], VscodeContextMenuItem.prototype, "label", void 0);
    __decorate$t([
        n$1({ type: String })
    ], VscodeContextMenuItem.prototype, "keybinding", void 0);
    __decorate$t([
        n$1({ type: String })
    ], VscodeContextMenuItem.prototype, "value", void 0);
    __decorate$t([
        n$1({ type: Boolean, reflect: true })
    ], VscodeContextMenuItem.prototype, "separator", void 0);
    __decorate$t([
        n$1({ type: Number })
    ], VscodeContextMenuItem.prototype, "tabindex", void 0);
    VscodeContextMenuItem = __decorate$t([
        customElement('vscode-context-menu-item')
    ], VscodeContextMenuItem);

    const styles$p = [
        defaultStyles,
        i$4 `
    :host {
      display: block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 1.4em;
      position: relative;
    }

    .context-menu {
      background-color: var(--vscode-menu-background, #1f1f1f);
      border-color: var(--vscode-menu-border, #454545);
      border-radius: 5px;
      border-style: solid;
      border-width: 1px;
      box-shadow: 0 2px 8px var(--vscode-widget-shadow, rgba(0, 0, 0, 0.36));
      color: var(--vscode-menu-foreground, #cccccc);
      padding: 4px 0;
      white-space: nowrap;
    }

    .context-menu:focus {
      outline: 0;
    }
  `,
    ];

    var __decorate$s = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-context-menu
     *
     * @fires {VscMenuSelectEvent} vsc-menu-select - Emitted when a menu item is clicked
     *
     * @cssprop [--vscode-font-family=sans-serif]
     * @cssprop [--vscode-font-size=13px]
     * @cssprop [--vscode-font-weight=normal]
     * @cssprop [--vscode-menu-background=#1f1f1f]
     * @cssprop [--vscode-menu-border=#454545]
     * @cssprop [--vscode-menu-foreground=#cccccc]
     * @cssprop [--vscode-widget-shadow=rgba(0, 0, 0, 0.36)]
     */
    let VscodeContextMenu = class VscodeContextMenu extends VscElement {
        set data(data) {
            this._data = data;
            const indexes = [];
            data.forEach((v, i) => {
                if (!v.separator) {
                    indexes.push(i);
                }
            });
            this._clickableItemIndexes = indexes;
        }
        get data() {
            return this._data;
        }
        set show(show) {
            this._show = show;
            this._selectedClickableItemIndex = -1;
            if (show) {
                this.updateComplete.then(() => {
                    if (this._wrapperEl) {
                        this._wrapperEl.focus();
                    }
                    requestAnimationFrame(() => {
                        document.addEventListener('click', this._onClickOutsideBound, {
                            once: true,
                        });
                    });
                });
            }
        }
        get show() {
            return this._show;
        }
        constructor() {
            super();
            /**
             * By default, the menu closes when an item is clicked. This attribute prevents the menu from closing.
             */
            this.preventClose = false;
            /** @internal */
            this.tabIndex = 0;
            /* connectedCallback(): void {
              super.connectedCallback();
              document.addEventListener('click', this._onClickOutsideBound);
            }
          
            disconnectedCallback(): void {
              super.disconnectedCallback();
              document.removeEventListener('click', this._onClickOutsideBound);
            } */
            this._selectedClickableItemIndex = -1;
            this._show = false;
            this._data = [];
            this._clickableItemIndexes = [];
            this._onClickOutsideBound = this._onClickOutside.bind(this);
            this.addEventListener('keydown', this._onKeyDown);
        }
        _onClickOutside(ev) {
            if (!ev.composedPath().includes(this)) {
                this.show = false;
            }
        }
        _onKeyDown(ev) {
            const { key } = ev;
            if (key === 'ArrowUp' ||
                key === 'ArrowDown' ||
                key === 'Escape' ||
                key === 'Enter') {
                ev.preventDefault();
            }
            switch (key) {
                case 'ArrowUp':
                    this._handleArrowUp();
                    break;
                case 'ArrowDown':
                    this._handleArrowDown();
                    break;
                case 'Escape':
                    this._handleEscape();
                    break;
                case 'Enter':
                    this._handleEnter();
                    break;
            }
        }
        _handleArrowUp() {
            if (this._selectedClickableItemIndex === 0) {
                this._selectedClickableItemIndex = this._clickableItemIndexes.length - 1;
            }
            else {
                this._selectedClickableItemIndex -= 1;
            }
        }
        _handleArrowDown() {
            if (this._selectedClickableItemIndex + 1 <
                this._clickableItemIndexes.length) {
                this._selectedClickableItemIndex += 1;
            }
            else {
                this._selectedClickableItemIndex = 0;
            }
        }
        _handleEscape() {
            this.show = false;
            document.removeEventListener('click', this._onClickOutsideBound);
        }
        _dispatchSelectEvent(selectedOption) {
            const { keybinding, label, value, separator, tabindex } = selectedOption;
            this.dispatchEvent(new CustomEvent('vsc-context-menu-select', {
                detail: {
                    keybinding,
                    label,
                    separator,
                    tabindex,
                    value,
                },
            }));
        }
        _dispatchLegacySelectEvent(selectedOption) {
            const { keybinding, label, value, separator, tabindex } = selectedOption;
            const detail = {
                keybinding,
                label,
                value,
                separator,
                tabindex,
            };
            /** @deprecated - Renamed to `vsc-context-menu-select` */
            this.dispatchEvent(new CustomEvent('vsc-select', {
                detail,
                bubbles: true,
                composed: true,
            }));
        }
        _handleEnter() {
            if (this._selectedClickableItemIndex === -1) {
                return;
            }
            const realItemIndex = this._clickableItemIndexes[this._selectedClickableItemIndex];
            const options = this._wrapperEl.querySelectorAll('vscode-context-menu-item');
            const selectedOption = options[realItemIndex];
            this._dispatchLegacySelectEvent(selectedOption);
            this._dispatchSelectEvent(selectedOption);
            if (!this.preventClose) {
                this.show = false;
                document.removeEventListener('click', this._onClickOutsideBound);
            }
        }
        _onItemClick(event) {
            const et = event.currentTarget;
            this._dispatchLegacySelectEvent(et);
            this._dispatchSelectEvent(et);
            if (!this.preventClose) {
                this.show = false;
            }
        }
        _onItemMouseOver(event) {
            const el = event.target;
            const index = el.dataset.index ? +el.dataset.index : -1;
            const found = this._clickableItemIndexes.findIndex((item) => item === index);
            if (found !== -1) {
                this._selectedClickableItemIndex = found;
            }
        }
        _onItemMouseOut() {
            this._selectedClickableItemIndex = -1;
        }
        render() {
            if (!this._show) {
                return x `${E}`;
            }
            const selectedIndex = this._clickableItemIndexes[this._selectedClickableItemIndex];
            return x `
      <div class="context-menu" tabindex="0">
        ${this.data
            ? this.data.map(({ label = '', keybinding = '', value = '', separator = false, tabindex = 0, }, index) => x `
                <vscode-context-menu-item
                  label=${label}
                  keybinding=${keybinding}
                  value=${value}
                  ?separator=${separator}
                  ?selected=${index === selectedIndex}
                  tabindex=${tabindex}
                  @vsc-click=${this._onItemClick}
                  @mouseover=${this._onItemMouseOver}
                  @mouseout=${this._onItemMouseOut}
                  data-index=${index}
                ></vscode-context-menu-item>
              `)
            : x `<slot></slot>`}
      </div>
    `;
        }
    };
    VscodeContextMenu.styles = styles$p;
    __decorate$s([
        n$1({ type: Array, attribute: false })
    ], VscodeContextMenu.prototype, "data", null);
    __decorate$s([
        n$1({ type: Boolean, reflect: true, attribute: 'prevent-close' })
    ], VscodeContextMenu.prototype, "preventClose", void 0);
    __decorate$s([
        n$1({ type: Boolean, reflect: true })
    ], VscodeContextMenu.prototype, "show", null);
    __decorate$s([
        n$1({ type: Number, reflect: true })
    ], VscodeContextMenu.prototype, "tabIndex", void 0);
    __decorate$s([
        r$2()
    ], VscodeContextMenu.prototype, "_selectedClickableItemIndex", void 0);
    __decorate$s([
        r$2()
    ], VscodeContextMenu.prototype, "_show", void 0);
    __decorate$s([
        e$3('.context-menu')
    ], VscodeContextMenu.prototype, "_wrapperEl", void 0);
    VscodeContextMenu = __decorate$s([
        customElement('vscode-context-menu')
    ], VscodeContextMenu);

    const styles$o = [
        defaultStyles,
        i$4 `
    :host {
      background-color: var(--vscode-foreground, #cccccc);
      display: block;
      height: 1px;
      margin-bottom: 10px;
      margin-top: 10px;
      opacity: 0.4;
    }
  `,
    ];

    var __decorate$r = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-divider
     *
     * @cssprop [--vscode-foreground=#cccccc]
     */
    let VscodeDivider = class VscodeDivider extends VscElement {
        constructor() {
            super(...arguments);
            this.role = 'separator';
        }
        render() {
            return x ``;
        }
    };
    VscodeDivider.styles = styles$o;
    __decorate$r([
        n$1({ reflect: true })
    ], VscodeDivider.prototype, "role", void 0);
    VscodeDivider = __decorate$r([
        customElement('vscode-divider')
    ], VscodeDivider);

    const styles$n = [
        defaultStyles,
        i$4 `
    :host {
      display: block;
      max-width: 727px;
    }
  `,
    ];

    var __decorate$q = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var FormGroupLayout;
    (function (FormGroupLayout) {
        FormGroupLayout["HORIZONTAL"] = "horizontal";
        FormGroupLayout["VERTICAL"] = "vertical";
    })(FormGroupLayout || (FormGroupLayout = {}));
    const isTextInput = (el) => {
        return ['vscode-textfield', 'vscode-textarea'].includes(el.tagName.toLocaleLowerCase());
    };
    const isSingleSelect = (el) => {
        return el.tagName.toLocaleLowerCase() === 'vscode-single-select';
    };
    const isMultiSelect = (el) => {
        return el.tagName.toLocaleLowerCase() === 'vscode-multi-select';
    };
    const isCheckbox = (el) => {
        return el.tagName.toLocaleLowerCase() === 'vscode-checkbox';
    };
    const isRadio = (el) => {
        return el.tagName.toLocaleLowerCase() === 'vscode-radio';
    };
    /**
     * @tag vscode-form-container
     */
    let VscodeFormContainer = class VscodeFormContainer extends VscElement {
        constructor() {
            super(...arguments);
            this.breakpoint = 490;
            this._responsive = false;
            this._firstUpdateComplete = false;
            this._resizeObserverCallbackBound = this._resizeObserverCallback.bind(this);
        }
        set responsive(isResponsive) {
            this._responsive = isResponsive;
            if (this._firstUpdateComplete) {
                if (isResponsive) {
                    this._activateResponsiveLayout();
                }
                else {
                    this._deactivateResizeObserver();
                }
            }
        }
        get responsive() {
            return this._responsive;
        }
        /** @deprecated - Use the native `<form>` element instead. */
        get data() {
            return this._collectFormData();
        }
        _collectFormData() {
            const query = [
                'vscode-textfield',
                'vscode-textarea',
                'vscode-single-select',
                'vscode-multi-select',
                'vscode-checkbox',
                'vscode-radio',
            ].join(',');
            const vscFormWidgets = this.querySelectorAll(query);
            const data = {};
            vscFormWidgets.forEach((widget) => {
                if (!widget.hasAttribute('name')) {
                    return;
                }
                const name = widget.getAttribute('name');
                if (!name) {
                    return;
                }
                if (isCheckbox(widget) && widget.checked) {
                    data[name] = Array.isArray(data[name])
                        ? [...data[name], widget.value]
                        : [widget.value];
                }
                else if (isMultiSelect(widget)) {
                    data[name] = widget.value;
                }
                else if (isCheckbox(widget) && !widget.checked) {
                    data[name] = Array.isArray(data[name]) ? data[name] : [];
                }
                else if ((isRadio(widget) && widget.checked) ||
                    isTextInput(widget) ||
                    isSingleSelect(widget)) {
                    data[name] = widget.value;
                }
                else if (isRadio(widget) && !widget.checked) {
                    data[name] = data[name] ? data[name] : '';
                }
            });
            return data;
        }
        _toggleCompactLayout(layout) {
            this._assignedFormGroups.forEach((group) => {
                if (!group.dataset.originalVariant) {
                    group.dataset.originalVariant = group.variant;
                }
                const oVariant = group.dataset.originalVariant;
                if (layout === FormGroupLayout.VERTICAL && oVariant === 'horizontal') {
                    group.variant = 'vertical';
                }
                else {
                    group.variant = oVariant;
                }
                const checkboxOrRadioGroup = group.querySelectorAll('vscode-checkbox-group, vscode-radio-group');
                checkboxOrRadioGroup.forEach((widgetGroup) => {
                    if (!widgetGroup.dataset.originalVariant) {
                        widgetGroup.dataset.originalVariant = widgetGroup.variant;
                    }
                    const originalVariant = widgetGroup.dataset.originalVariant;
                    if (layout === FormGroupLayout.HORIZONTAL &&
                        originalVariant === FormGroupLayout.HORIZONTAL) {
                        widgetGroup.variant = 'horizontal';
                    }
                    else {
                        widgetGroup.variant = 'vertical';
                    }
                });
            });
        }
        _resizeObserverCallback(entries) {
            let wrapperWidth = 0;
            for (const entry of entries) {
                wrapperWidth = entry.contentRect.width;
            }
            const nextLayout = wrapperWidth < this.breakpoint
                ? FormGroupLayout.VERTICAL
                : FormGroupLayout.HORIZONTAL;
            if (nextLayout !== this._currentFormGroupLayout) {
                this._toggleCompactLayout(nextLayout);
                this._currentFormGroupLayout = nextLayout;
            }
        }
        _activateResponsiveLayout() {
            this._resizeObserver = new ResizeObserver(this._resizeObserverCallbackBound);
            this._resizeObserver.observe(this._wrapperElement);
        }
        _deactivateResizeObserver() {
            this._resizeObserver?.disconnect();
            this._resizeObserver = null;
        }
        firstUpdated() {
            this._firstUpdateComplete = true;
            if (this._responsive) {
                this._activateResponsiveLayout();
            }
        }
        render() {
            return x `
      <div class="wrapper">
        <slot></slot>
      </div>
    `;
        }
    };
    VscodeFormContainer.styles = styles$n;
    __decorate$q([
        n$1({ type: Boolean, reflect: true })
    ], VscodeFormContainer.prototype, "responsive", null);
    __decorate$q([
        n$1({ type: Number })
    ], VscodeFormContainer.prototype, "breakpoint", void 0);
    __decorate$q([
        n$1({ type: Object })
    ], VscodeFormContainer.prototype, "data", null);
    __decorate$q([
        e$3('.wrapper')
    ], VscodeFormContainer.prototype, "_wrapperElement", void 0);
    __decorate$q([
        o$1({ selector: 'vscode-form-group' })
    ], VscodeFormContainer.prototype, "_assignedFormGroups", void 0);
    VscodeFormContainer = __decorate$q([
        customElement('vscode-form-container')
    ], VscodeFormContainer);

    const styles$m = [
        defaultStyles,
        i$4 `
    :host {
      --label-right-margin: 14px;
      --label-width: 150px;

      display: block;
      margin: 15px 0;
    }

    :host([variant='settings-group']) {
      margin: 0;
      padding: 12px 14px 18px;
      max-width: 727px;
    }

    .wrapper {
      display: flex;
      flex-wrap: wrap;
    }

    :host([variant='vertical']) .wrapper,
    :host([variant='settings-group']) .wrapper {
      display: block;
    }

    :host([variant='horizontal']) ::slotted(vscode-checkbox-group),
    :host([variant='horizontal']) ::slotted(vscode-radio-group) {
      width: calc(100% - calc(var(--label-width) + var(--label-right-margin)));
    }

    :host([variant='horizontal']) ::slotted(vscode-label) {
      margin-right: var(--label-right-margin);
      text-align: right;
      width: var(--label-width);
    }

    :host([variant='settings-group']) ::slotted(vscode-label) {
      height: 18px;
      line-height: 18px;
      margin-bottom: 4px;
      margin-right: 0;
      padding: 0;
    }

    ::slotted(vscode-form-helper) {
      margin-left: calc(var(--label-width) + var(--label-right-margin));
    }

    :host([variant='vertical']) ::slotted(vscode-form-helper),
    :host([variant='settings-group']) ::slotted(vscode-form-helper) {
      display: block;
      margin-left: 0;
    }

    :host([variant='settings-group']) ::slotted(vscode-form-helper) {
      margin-bottom: 0;
      margin-top: 0;
    }

    :host([variant='vertical']) ::slotted(vscode-label),
    :host([variant='settings-group']) ::slotted(vscode-label) {
      display: block;
      margin-left: 0;
      text-align: left;
    }

    :host([variant='settings-group']) ::slotted(vscode-inputbox),
    :host([variant='settings-group']) ::slotted(vscode-textfield),
    :host([variant='settings-group']) ::slotted(vscode-textarea),
    :host([variant='settings-group']) ::slotted(vscode-single-select),
    :host([variant='settings-group']) ::slotted(vscode-multi-select) {
      margin-top: 9px;
    }

    ::slotted(vscode-button:first-child) {
      margin-left: calc(var(--label-width) + var(--label-right-margin));
    }

    :host([variant='vertical']) ::slotted(vscode-button) {
      margin-left: 0;
    }

    ::slotted(vscode-button) {
      margin-right: 4px;
    }
  `,
    ];

    var __decorate$p = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-form-group
     *
     * @cssprop [--label-width=150px] - The width of the label in horizontal mode
     * @cssprop [--label-right-margin=14px] - The right margin of the label in horizontal mode
     */
    let VscodeFormGroup = class VscodeFormGroup extends VscElement {
        constructor() {
            super(...arguments);
            this.variant = 'horizontal';
        }
        render() {
            return x `
      <div class="wrapper">
        <slot></slot>
      </div>
    `;
        }
    };
    VscodeFormGroup.styles = styles$m;
    __decorate$p([
        n$1({ reflect: true })
    ], VscodeFormGroup.prototype, "variant", void 0);
    VscodeFormGroup = __decorate$p([
        customElement('vscode-form-group')
    ], VscodeFormGroup);

    const styles$l = [
        defaultStyles,
        i$4 `
    :host {
      display: block;
      line-height: 1.4em;
      margin-bottom: 4px;
      margin-top: 4px;
      max-width: 720px;
      opacity: 0.9;
    }

    :host([vertical]) {
      margin-left: 0;
    }
  `,
    ];

    var __decorate$o = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    const lightDOMStyles = new CSSStyleSheet();
    lightDOMStyles.replaceSync(`
  vscode-form-helper * {
    margin: 0;
  }

  vscode-form-helper *:not(:last-child) {
    margin-bottom: 8px;
  }
`);
    /**
     * Adds more detailed description to a [FromGroup](https://bendera.github.io/vscode-webview-elements/components/vscode-form-group/)
     *
     * @tag vscode-form-helper
     *
     * @cssprop --vsc-foreground-translucent - Default text color. 90% transparency version of `--vscode-foreground` by default.
     */
    let VscodeFormHelper = class VscodeFormHelper extends VscElement {
        constructor() {
            super();
            this._injectLightDOMStyles();
        }
        _injectLightDOMStyles() {
            const found = document.adoptedStyleSheets.find((s) => s === lightDOMStyles);
            if (!found) {
                document.adoptedStyleSheets.push(lightDOMStyles);
            }
        }
        render() {
            return x `<slot></slot>`;
        }
    };
    VscodeFormHelper.styles = styles$l;
    VscodeFormHelper = __decorate$o([
        customElement('vscode-form-helper')
    ], VscodeFormHelper);

    let counter = 0;
    const uniqueId = (prefix = '') => {
        counter++;
        return `${prefix}${counter}`;
    };

    const styles$k = [
        defaultStyles,
        i$4 `
    :host {
      display: block;
    }

    .wrapper {
      display: flex;
      flex-wrap: wrap;
    }

    :host([variant='vertical']) .wrapper {
      display: block;
    }

    ::slotted(vscode-radio) {
      margin-right: 20px;
    }

    ::slotted(vscode-radio:last-child) {
      margin-right: 0;
    }

    :host([variant='vertical']) ::slotted(vscode-radio) {
      display: block;
      margin-bottom: 15px;
    }

    :host([variant='vertical']) ::slotted(vscode-radio:last-child) {
      margin-bottom: 0;
    }
  `,
    ];

    var __decorate$n = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-radio-group
     *
     * @fires {Event} change - Dispatched when a child radio button is changed.
     */
    let VscodeRadioGroup = class VscodeRadioGroup extends VscElement {
        constructor() {
            super(...arguments);
            this.variant = 'horizontal';
            /** @internal */
            this.role = 'radiogroup';
            this._focusedRadio = -1;
            this._checkedRadio = -1;
            this._firstContentLoaded = false;
            this._onKeyDownBound = this._onKeyDown.bind(this);
        }
        connectedCallback() {
            super.connectedCallback();
            this.addEventListener('keydown', this._onKeyDownBound);
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            this.removeEventListener('keydown', this._onKeyDownBound);
        }
        _uncheckPreviousChecked(prevChecked, prevFocused) {
            if (prevChecked !== -1) {
                this._radios[prevChecked].checked = false;
            }
            if (prevFocused !== -1) {
                this._radios[prevFocused].tabIndex = -1;
            }
        }
        _afterCheck() {
            this._focusedRadio = this._checkedRadio;
            this._radios[this._checkedRadio].checked = true;
            this._radios[this._checkedRadio].tabIndex = 0;
            this._radios[this._checkedRadio].focus();
        }
        _checkPrev() {
            const prevChecked = this._radios.findIndex((r) => r.checked);
            const prevFocused = this._radios.findIndex((r) => r.focused);
            const startPos = prevFocused !== -1 ? prevFocused : prevChecked;
            this._uncheckPreviousChecked(prevChecked, prevFocused);
            if (startPos === -1) {
                this._checkedRadio = this._radios.length - 1;
            }
            else if (startPos - 1 >= 0) {
                this._checkedRadio = startPos - 1;
            }
            else {
                this._checkedRadio = this._radios.length - 1;
            }
            this._afterCheck();
        }
        _checkNext() {
            const prevChecked = this._radios.findIndex((r) => r.checked);
            const prevFocused = this._radios.findIndex((r) => r.focused);
            const startPos = prevFocused !== -1 ? prevFocused : prevChecked;
            this._uncheckPreviousChecked(prevChecked, prevFocused);
            if (startPos === -1) {
                this._checkedRadio = 0;
            }
            else if (startPos + 1 < this._radios.length) {
                this._checkedRadio = startPos + 1;
            }
            else {
                this._checkedRadio = 0;
            }
            this._afterCheck();
        }
        _onKeyDown(ev) {
            const { key } = ev;
            const listenedKeys = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'];
            if (listenedKeys.includes(key)) {
                ev.preventDefault();
            }
            if (key === 'ArrowRight' || key === 'ArrowDown') {
                this._checkNext();
            }
            if (key === 'ArrowLeft' || key === 'ArrowUp') {
                this._checkPrev();
            }
        }
        _onChange(ev) {
            const clickedIndex = this._radios.findIndex((r) => r === ev.target);
            if (clickedIndex !== -1) {
                if (this._focusedRadio !== -1) {
                    this._radios[this._focusedRadio].tabIndex = -1;
                }
                if (this._checkedRadio !== -1 && this._checkedRadio !== clickedIndex) {
                    this._radios[this._checkedRadio].checked = false;
                }
                this._focusedRadio = clickedIndex;
                this._checkedRadio = clickedIndex;
                this._radios[clickedIndex].tabIndex = 0;
            }
        }
        _onSlotChange() {
            if (!this._firstContentLoaded) {
                const autoFocusedRadio = this._radios.findIndex((r) => r.autofocus);
                if (autoFocusedRadio > -1) {
                    this._focusedRadio = autoFocusedRadio;
                }
                this._firstContentLoaded = true;
            }
            this._radios.forEach((r, i) => {
                // if _focusedRadio is not set, the first radio should be focusable
                if (this._focusedRadio > -1) {
                    r.tabIndex = i === this._focusedRadio ? 0 : -1;
                }
                else {
                    r.tabIndex = i === 0 ? 0 : -1;
                }
            });
        }
        render() {
            return x `
      <div class="wrapper">
        <slot
          @slotchange=${this._onSlotChange}
          @vsc-change=${this._onChange}
        ></slot>
      </div>
    `;
        }
    };
    VscodeRadioGroup.styles = styles$k;
    __decorate$n([
        n$1({ reflect: true })
    ], VscodeRadioGroup.prototype, "variant", void 0);
    __decorate$n([
        n$1({ reflect: true })
    ], VscodeRadioGroup.prototype, "role", void 0);
    __decorate$n([
        o$1({ selector: 'vscode-radio' })
    ], VscodeRadioGroup.prototype, "_radios", void 0);
    __decorate$n([
        r$2()
    ], VscodeRadioGroup.prototype, "_focusedRadio", void 0);
    __decorate$n([
        r$2()
    ], VscodeRadioGroup.prototype, "_checkedRadio", void 0);
    VscodeRadioGroup = __decorate$n([
        customElement('vscode-radio-group')
    ], VscodeRadioGroup);

    const styles$j = [
        defaultStyles,
        i$4 `
    :host {
      display: inline-block;
      height: 40px;
      position: relative;
      width: 320px;
    }

    :host([cols]) {
      width: auto;
    }

    :host([rows]) {
      height: auto;
    }

    .shadow {
      box-shadow: var(--vscode-scrollbar-shadow, #000000) 0 6px 6px -6px inset;
      display: none;
      inset: 0 0 auto 0;
      height: 6px;
      pointer-events: none;
      position: absolute;
      width: 100%;
    }

    .shadow.visible {
      display: block;
    }

    textarea {
      background-color: var(--vscode-settings-textInputBackground, #313131);
      border-color: var(--vscode-settings-textInputBorder, transparent);
      border-radius: 2px;
      border-style: solid;
      border-width: 1px;
      box-sizing: border-box;
      color: var(--vscode-settings-textInputForeground, #cccccc);
      display: block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      height: 100%;
      width: 100%;
    }

    :host([cols]) textarea {
      width: auto;
    }

    :host([rows]) textarea {
      height: auto;
    }

    :host([invalid]) textarea,
    :host(:invalid) textarea {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    textarea.monospace {
      background-color: var(--vscode-editor-background, #1f1f1f);
      color: var(--vscode-editor-foreground, #cccccc);
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: var(--vscode-editor-font-size, 14px);
      font-weight: var(--vscode-editor-font-weight, normal);
    }

    .textarea.monospace::placeholder {
      color: var(
        --vscode-editor-inlineValuesForeground,
        rgba(255, 255, 255, 0.5)
      );
    }

    textarea.cursor-pointer {
      cursor: pointer;
    }

    textarea:focus {
      border-color: var(--vscode-focusBorder, #0078d4);
      outline: none;
    }

    textarea::placeholder {
      color: var(--vscode-input-placeholderForeground, #989898);
      opacity: 1;
    }

    textarea::-webkit-scrollbar-track {
      background-color: transparent;
    }

    textarea::-webkit-scrollbar {
      width: 14px;
    }

    textarea::-webkit-scrollbar-thumb {
      background-color: transparent;
    }

    textarea:hover::-webkit-scrollbar-thumb {
      background-color: var(
        --vscode-scrollbarSlider-background,
        rgba(121, 121, 121, 0.4)
      );
    }

    textarea::-webkit-scrollbar-thumb:hover {
      background-color: var(
        --vscode-scrollbarSlider-hoverBackground,
        rgba(100, 100, 100, 0.7)
      );
    }

    textarea::-webkit-scrollbar-thumb:active {
      background-color: var(
        --vscode-scrollbarSlider-activeBackground,
        rgba(191, 191, 191, 0.4)
      );
    }

    textarea::-webkit-scrollbar-corner {
      background-color: transparent;
    }

    textarea::-webkit-resizer {
      background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAYAAADEUlfTAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAACJJREFUeJxjYMAOZuIQZ5j5//9/rJJESczEKYGsG6cEXgAAsEEefMxkua4AAAAASUVORK5CYII=');
      background-repeat: no-repeat;
      background-position: right bottom;
    }
  `,
    ];

    var __decorate$m = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Multi-line text input.
     *
     * When participating in a form, it supports the `:invalid` pseudo class. Otherwise the error styles
     * can be applied through the `invalid` property.
     *
     * @tag vscode-textarea
     *
     * @fires {InputEvent} input
     * @fires {Event} change
     *
     * @cssprop [--vscode-scrollbar-shadow=#000000]
     * @cssprop [--vscode-settings-textInputBackground=#313131]
     * @cssprop [--vscode-settings-textInputBorder=transparent]
     * @cssprop [--vscode-settings-textInputForeground=#cccccc]
     * @cssprop [--vscode-input-placeholderForeground=#989898]
     * @cssprop [--vscode-font-family=sans-serif]
     * @cssprop [--vscode-font-size=13px]
     * @cssprop [--vscode-font-weight=normal]
     * @cssprop [--vscode-editor-background=#1f1f1f]
     * @cssprop [--vscode-editor-foreground=#cccccc]
     * @cssprop [--vscode-editor-font-family=monospace]
     * @cssprop [--vscode-editor-font-size=14px]
     * @cssprop [--vscode-editor-font-weight=normal]
     * @cssprop [--vscode-editor-inlineValuesForeground=rgba(255, 255, 255, 0.5)]
     * @cssprop [--vscode-focusBorder=#0078d4]
     * @cssprop [--vscode-scrollbarSlider-background=rgba(121, 121, 121, 0.4)]
     * @cssprop [--vscode-scrollbarSlider-hoverBackground=rgba(100, 100, 100, 0.7)]
     * @cssprop [--vscode-scrollbarSlider-activeBackground=rgba(191, 191, 191, 0.4)]
     */
    let VscodeTextarea = class VscodeTextarea extends VscElement {
        set value(val) {
            this._value = val;
            this._internals.setFormValue(val);
        }
        get value() {
            return this._value;
        }
        /**
         * Getter for the inner textarea element if it needs to be accessed for some reason.
         */
        get wrappedElement() {
            return this._textareaEl;
        }
        get form() {
            return this._internals.form;
        }
        /** @internal */
        get type() {
            return 'textarea';
        }
        get validity() {
            return this._internals.validity;
        }
        get validationMessage() {
            return this._internals.validationMessage;
        }
        get willValidate() {
            return this._internals.willValidate;
        }
        /**
         * Lowercase alias to minLength
         */
        set minlength(val) {
            this.minLength = val;
        }
        get minlength() {
            return this.minLength;
        }
        /**
         * Lowercase alias to maxLength
         */
        set maxlength(val) {
            this.maxLength = val;
        }
        get maxlength() {
            return this.maxLength;
        }
        // #endregion
        constructor() {
            super();
            // #region properties, setters/getters
            this.autocomplete = undefined;
            this.autofocus = false;
            this.defaultValue = '';
            this.disabled = false;
            this.invalid = false;
            this.label = '';
            this.maxLength = undefined;
            this.minLength = undefined;
            this.rows = undefined;
            this.cols = undefined;
            this.name = undefined;
            this.placeholder = undefined;
            this.readonly = false;
            this.resize = 'none';
            this.required = false;
            this.spellcheck = false;
            /**
             * Use monospace fonts. The font family, weight, size, and color will be the same as set in the
             * VSCode code editor.
             */
            this.monospace = false;
            this._value = '';
            this._textareaPointerCursor = false;
            this._shadow = false;
            this._internals = this.attachInternals();
        }
        connectedCallback() {
            super.connectedCallback();
            this.updateComplete.then(() => {
                this._textareaEl.checkValidity();
                this._setValidityFromInput();
                this._internals.setFormValue(this._textareaEl.value);
            });
        }
        updated(changedProperties) {
            const validationRelatedProps = ['maxLength', 'minLength', 'required'];
            for (const key of changedProperties.keys()) {
                if (validationRelatedProps.includes(String(key))) {
                    this.updateComplete.then(() => {
                        this._setValidityFromInput();
                    });
                    break;
                }
            }
        }
        /** @internal */
        formResetCallback() {
            this.value = this.defaultValue;
        }
        /** @internal */
        formStateRestoreCallback(state, _mode) {
            this.updateComplete.then(() => {
                this._value = state;
            });
        }
        checkValidity() {
            return this._internals.checkValidity();
        }
        reportValidity() {
            return this._internals.reportValidity();
        }
        _setValidityFromInput() {
            this._internals.setValidity(this._textareaEl.validity, this._textareaEl.validationMessage, this._textareaEl);
        }
        _dataChanged() {
            this._value = this._textareaEl.value;
            this._internals.setFormValue(this._textareaEl.value);
        }
        _handleChange(ev) {
            this._dataChanged();
            this._setValidityFromInput();
            this.dispatchEvent(new Event('change'));
            /** @deprecated */
            this.dispatchEvent(new CustomEvent('vsc-change', {
                detail: { data: this.value, originalEvent: ev },
            }));
        }
        _handleInput(ev) {
            this._dataChanged();
            this._setValidityFromInput();
            /** @deprecated */
            this.dispatchEvent(new CustomEvent('vsc-input', {
                detail: { data: ev.data, originalEvent: ev },
            }));
        }
        _handleMouseMove(ev) {
            if (this._textareaEl.clientHeight >= this._textareaEl.scrollHeight) {
                this._textareaPointerCursor = false;
                return;
            }
            const SCROLLBAR_WIDTH = 14;
            const BORDER_WIDTH = 1;
            const br = this._textareaEl.getBoundingClientRect();
            const x = ev.clientX;
            this._textareaPointerCursor =
                x >= br.left + br.width - SCROLLBAR_WIDTH - BORDER_WIDTH * 2;
        }
        _handleScroll() {
            this._shadow = this._textareaEl.scrollTop > 0;
        }
        render() {
            return x `
      <div
        class=${e({
            shadow: true,
            visible: this._shadow,
        })}
      ></div>
      <textarea
        autocomplete=${o(this.autocomplete)}
        ?autofocus=${this.autofocus}
        ?disabled=${this.disabled}
        aria-label=${this.label}
        id="textarea"
        class=${e({
            monospace: this.monospace,
            'cursor-pointer': this._textareaPointerCursor,
        })}
        maxlength=${o(this.maxLength)}
        minlength=${o(this.minLength)}
        rows=${o(this.rows)}
        cols=${o(this.cols)}
        name=${o(this.name)}
        placeholder=${o(this.placeholder)}
        ?readonly=${this.readonly}
        .style=${stylePropertyMap({
            resize: this.resize,
        })}
        ?required=${this.required}
        spellcheck=${this.spellcheck}
        @change=${this._handleChange}
        @input=${this._handleInput}
        @mousemove=${this._handleMouseMove}
        @scroll=${this._handleScroll}
        .value=${this._value}
      ></textarea>
    `;
        }
    };
    VscodeTextarea.styles = styles$j;
    /**
     * @internal
     */
    VscodeTextarea.formAssociated = true;
    /** @internal */
    VscodeTextarea.shadowRootOptions = {
        ...i$1.shadowRootOptions,
        delegatesFocus: true,
    };
    __decorate$m([
        n$1()
    ], VscodeTextarea.prototype, "autocomplete", void 0);
    __decorate$m([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextarea.prototype, "autofocus", void 0);
    __decorate$m([
        n$1({ attribute: 'default-value' })
    ], VscodeTextarea.prototype, "defaultValue", void 0);
    __decorate$m([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextarea.prototype, "disabled", void 0);
    __decorate$m([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextarea.prototype, "invalid", void 0);
    __decorate$m([
        n$1({ attribute: false })
    ], VscodeTextarea.prototype, "label", void 0);
    __decorate$m([
        n$1({ type: Number })
    ], VscodeTextarea.prototype, "maxLength", void 0);
    __decorate$m([
        n$1({ type: Number })
    ], VscodeTextarea.prototype, "minLength", void 0);
    __decorate$m([
        n$1({ type: Number })
    ], VscodeTextarea.prototype, "rows", void 0);
    __decorate$m([
        n$1({ type: Number })
    ], VscodeTextarea.prototype, "cols", void 0);
    __decorate$m([
        n$1()
    ], VscodeTextarea.prototype, "name", void 0);
    __decorate$m([
        n$1()
    ], VscodeTextarea.prototype, "placeholder", void 0);
    __decorate$m([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextarea.prototype, "readonly", void 0);
    __decorate$m([
        n$1()
    ], VscodeTextarea.prototype, "resize", void 0);
    __decorate$m([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextarea.prototype, "required", void 0);
    __decorate$m([
        n$1({ type: Boolean })
    ], VscodeTextarea.prototype, "spellcheck", void 0);
    __decorate$m([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextarea.prototype, "monospace", void 0);
    __decorate$m([
        n$1()
    ], VscodeTextarea.prototype, "value", null);
    __decorate$m([
        e$3('#textarea')
    ], VscodeTextarea.prototype, "_textareaEl", void 0);
    __decorate$m([
        r$2()
    ], VscodeTextarea.prototype, "_value", void 0);
    __decorate$m([
        r$2()
    ], VscodeTextarea.prototype, "_textareaPointerCursor", void 0);
    __decorate$m([
        r$2()
    ], VscodeTextarea.prototype, "_shadow", void 0);
    VscodeTextarea = __decorate$m([
        customElement('vscode-textarea')
    ], VscodeTextarea);

    const defaultFontStack = r$6(getDefaultFontStack());
    const styles$i = [
        defaultStyles,
        i$4 `
    :host {
      align-items: center;
      background-color: var(--vscode-settings-textInputBackground, #313131);
      border-color: var(
        --vscode-settings-textInputBorder,
        var(--vscode-settings-textInputBackground, #3c3c3c)
      );
      border-radius: 2px;
      border-style: solid;
      border-width: 1px;
      box-sizing: border-box;
      color: var(--vscode-settings-textInputForeground, #cccccc);
      display: inline-flex;
      max-width: 100%;
      position: relative;
      width: 320px;
    }

    :host([focused]) {
      border-color: var(--vscode-focusBorder, #0078d4);
    }

    :host([invalid]),
    :host(:invalid) {
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    :host([invalid]) input,
    :host(:invalid) input {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
    }

    ::slotted([slot='content-before']) {
      display: block;
      margin-left: 2px;
    }

    ::slotted([slot='content-after']) {
      display: block;
      margin-right: 2px;
    }

    slot[name='content-before'],
    slot[name='content-after'] {
      align-items: center;
      display: flex;
    }

    input {
      background-color: var(--vscode-settings-textInputBackground, #313131);
      border: 0;
      box-sizing: border-box;
      color: var(--vscode-settings-textInputForeground, #cccccc);
      display: block;
      font-family: var(--vscode-font-family, ${defaultFontStack});
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, 'normal');
      line-height: 18px;
      outline: none;
      padding-bottom: 3px;
      padding-left: 4px;
      padding-right: 4px;
      padding-top: 3px;
      width: 100%;
    }

    input:read-only:not([type='file']) {
      cursor: not-allowed;
    }

    input::placeholder {
      color: var(--vscode-input-placeholderForeground, #989898);
      opacity: 1;
    }

    input[type='file'] {
      line-height: 24px;
      padding-bottom: 0;
      padding-left: 2px;
      padding-top: 0;
    }

    input[type='file']::file-selector-button {
      background-color: var(--vscode-button-background, #0078d4);
      border: 0;
      border-radius: 2px;
      color: var(--vscode-button-foreground, #ffffff);
      cursor: pointer;
      font-family: var(--vscode-font-family, ${defaultFontStack});
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, 'normal');
      line-height: 20px;
      padding: 0 14px;
    }

    input[type='file']::file-selector-button:hover {
      background-color: var(--vscode-button-hoverBackground, #026ec1);
    }
  `,
    ];

    var __decorate$l = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * A simple inline textfield
     *
     * When participating in a form, it supports the `:invalid` pseudo class. Otherwise the error styles
     * can be applied through the `invalid` property.
     *
     * @tag vscode-textfield
     *
     * @slot content-before - A slot before the editable area but inside of the component. It is used to place icons.
     * @slot content-after - A slot after the editable area but inside of the component. It is used to place icons.
     *
     * @fires {InputEvent} input
     * @fires {Event} change
     *
     * @cssprop [--vscode-settings-textInputBackground=#313131]
     * @cssprop [--vscode-settings-textInputBorder=var(--vscode-settings-textInputBackground, #3c3c3c)]
     * @cssprop [--vscode-settings-textInputForeground=#cccccc]
     * @cssprop [--vscode-settings-textInputBackground=#313131]
     * @cssprop [--vscode-focusBorder=#0078d4]
     * @cssprop [--vscode-font-family=sans-serif] - A sans-serif font type depends on the host OS.
     * @cssprop [--vscode-font-size=13px]
     * @cssprop [--vscode-font-weight=normal]
     * @cssprop [--vscode-inputValidation-errorBorder=#be1100]
     * @cssprop [--vscode-inputValidation-errorBackground=#5a1d1d]
     * @cssprop [--vscode-input-placeholderForeground=#989898]
     * @cssprop [--vscode-button-background=#0078d4]
     * @cssprop [--vscode-button-foreground=#ffffff]
     * @cssprop [--vscode-button-hoverBackground=#026ec1]
     */
    let VscodeTextfield = class VscodeTextfield extends VscElement {
        /**
         * Same as the `type` of the native `<input>` element but only a subset of types are supported.
         * The supported ones are: `color`,`date`,`datetime-local`,`email`,`file`,`month`,`number`,`password`,`search`,`tel`,`text`,`time`,`url`,`week`
         */
        set type(val) {
            const validTypes = [
                'color',
                'date',
                'datetime-local',
                'email',
                'file',
                'month',
                'number',
                'password',
                'search',
                'tel',
                'text',
                'time',
                'url',
                'week',
            ];
            this._type = (validTypes.includes(val) ? val : 'text');
        }
        get type() {
            return this._type;
        }
        set value(val) {
            if (this.type !== 'file') {
                this._value = val;
                this._internals.setFormValue(val);
            }
            this.updateComplete.then(() => {
                this._setValidityFromInput();
            });
        }
        get value() {
            return this._value;
        }
        /**
         * Lowercase alias to minLength
         */
        set minlength(val) {
            this.minLength = val;
        }
        get minlength() {
            return this.minLength;
        }
        /**
         * Lowercase alias to maxLength
         */
        set maxlength(val) {
            this.maxLength = val;
        }
        get maxlength() {
            return this.maxLength;
        }
        get form() {
            return this._internals.form;
        }
        get validity() {
            return this._internals.validity;
        }
        get validationMessage() {
            return this._internals.validationMessage;
        }
        get willValidate() {
            return this._internals.willValidate;
        }
        /**
         * Check the component's validity state when built-in validation is used.
         * Built-in validation is triggered when any validation-related attribute is set. Validation-related
         * attributes are: `max, maxlength, min, minlength, pattern, required, step`.
         * See this [the MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/checkValidity) for more details.
         * @returns {boolean}
         */
        checkValidity() {
            this._setValidityFromInput();
            return this._internals.checkValidity();
        }
        reportValidity() {
            this._setValidityFromInput();
            return this._internals.reportValidity();
        }
        get wrappedElement() {
            return this._inputEl;
        }
        constructor() {
            super();
            this.autocomplete = undefined;
            this.autofocus = false;
            this.defaultValue = '';
            this.disabled = false;
            this.focused = false;
            /**
             * Set error styles on the component. This is only intended to apply styles when custom error
             * validation is implemented. To check whether the component is valid, use the checkValidity method.
             */
            this.invalid = false;
            /**
             * @internal
             * Set `aria-label` for the inner input element. Should not be set,
             * vscode-label will do it automatically.
             */
            this.label = '';
            this.max = undefined;
            this.maxLength = undefined;
            this.min = undefined;
            this.minLength = undefined;
            this.multiple = false;
            this.name = undefined;
            /**
             * Specifies a regular expression the form control's value should match.
             * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern)
             */
            this.pattern = undefined;
            this.placeholder = undefined;
            this.readonly = false;
            this.required = false;
            this.step = undefined;
            this._value = '';
            this._type = 'text';
            this._internals = this.attachInternals();
        }
        connectedCallback() {
            super.connectedCallback();
            this.updateComplete.then(() => {
                this._inputEl.checkValidity();
                this._setValidityFromInput();
                this._internals.setFormValue(this._inputEl.value);
            });
        }
        attributeChangedCallback(name, old, value) {
            super.attributeChangedCallback(name, old, value);
            const validationRelatedAttributes = [
                'max',
                'maxlength',
                'min',
                'minlength',
                'pattern',
                'required',
                'step',
            ];
            if (validationRelatedAttributes.includes(name)) {
                this.updateComplete.then(() => {
                    this._setValidityFromInput();
                });
            }
        }
        /** @internal */
        formResetCallback() {
            this.value = this.defaultValue;
            this.requestUpdate();
        }
        /** @internal */
        formStateRestoreCallback(state, _mode) {
            this.value = state;
        }
        _dataChanged() {
            this._value = this._inputEl.value;
            if (this.type === 'file' && this._inputEl.files) {
                for (const f of this._inputEl.files) {
                    this._internals.setFormValue(f);
                }
            }
            else {
                this._internals.setFormValue(this._inputEl.value);
            }
        }
        _setValidityFromInput() {
            if (this._inputEl) {
                this._internals.setValidity(this._inputEl.validity, this._inputEl.validationMessage, this._inputEl);
            }
        }
        _onInput(ev) {
            this._dataChanged();
            this._setValidityFromInput();
            // native input event dispatched automatically
            /** @deprecated */
            this.dispatchEvent(new CustomEvent('vsc-input', { detail: { data: ev.data, originalEvent: ev } }));
        }
        _onChange(ev) {
            this._dataChanged();
            this._setValidityFromInput();
            this.dispatchEvent(new Event('change'));
            /** @deprecated */
            this.dispatchEvent(new CustomEvent('vsc-change', {
                detail: { data: this.value, originalEvent: ev },
            }));
        }
        _onFocus() {
            this.focused = true;
        }
        _onBlur() {
            this.focused = false;
        }
        _onKeyDown(ev) {
            if (ev.key === 'Enter' && this._internals.form) {
                this._internals.form?.requestSubmit();
            }
        }
        render() {
            return x `
      <slot name="content-before"></slot>
      <input
        id="input"
        type=${this.type}
        ?autofocus=${this.autofocus}
        autocomplete=${o(this.autocomplete)}
        aria-label=${this.label}
        ?disabled=${this.disabled}
        max=${o(this.max)}
        maxlength=${o(this.maxLength)}
        min=${o(this.min)}
        minlength=${o(this.minLength)}
        ?multiple=${this.multiple}
        name=${o(this.name)}
        pattern=${o(this.pattern)}
        placeholder=${o(this.placeholder)}
        ?readonly=${this.readonly}
        ?required=${this.required}
        step=${o(this.step)}
        .value=${this._value}
        @blur=${this._onBlur}
        @change=${this._onChange}
        @focus=${this._onFocus}
        @input=${this._onInput}
        @keydown=${this._onKeyDown}
      >
      <slot name="content-after"></slot>
    `;
        }
    };
    VscodeTextfield.styles = styles$i;
    /** @internal */
    VscodeTextfield.formAssociated = true;
    /** @internal */
    VscodeTextfield.shadowRootOptions = {
        ...i$1.shadowRootOptions,
        delegatesFocus: true,
    };
    __decorate$l([
        n$1()
    ], VscodeTextfield.prototype, "autocomplete", void 0);
    __decorate$l([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextfield.prototype, "autofocus", void 0);
    __decorate$l([
        n$1({ attribute: 'default-value' })
    ], VscodeTextfield.prototype, "defaultValue", void 0);
    __decorate$l([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextfield.prototype, "disabled", void 0);
    __decorate$l([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextfield.prototype, "focused", void 0);
    __decorate$l([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextfield.prototype, "invalid", void 0);
    __decorate$l([
        n$1({ attribute: false })
    ], VscodeTextfield.prototype, "label", void 0);
    __decorate$l([
        n$1({ type: Number })
    ], VscodeTextfield.prototype, "max", void 0);
    __decorate$l([
        n$1({ type: Number })
    ], VscodeTextfield.prototype, "maxLength", void 0);
    __decorate$l([
        n$1({ type: Number })
    ], VscodeTextfield.prototype, "min", void 0);
    __decorate$l([
        n$1({ type: Number })
    ], VscodeTextfield.prototype, "minLength", void 0);
    __decorate$l([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextfield.prototype, "multiple", void 0);
    __decorate$l([
        n$1({ reflect: true })
    ], VscodeTextfield.prototype, "name", void 0);
    __decorate$l([
        n$1()
    ], VscodeTextfield.prototype, "pattern", void 0);
    __decorate$l([
        n$1()
    ], VscodeTextfield.prototype, "placeholder", void 0);
    __decorate$l([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextfield.prototype, "readonly", void 0);
    __decorate$l([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTextfield.prototype, "required", void 0);
    __decorate$l([
        n$1({ type: Number })
    ], VscodeTextfield.prototype, "step", void 0);
    __decorate$l([
        n$1({ reflect: true })
    ], VscodeTextfield.prototype, "type", null);
    __decorate$l([
        n$1()
    ], VscodeTextfield.prototype, "value", null);
    __decorate$l([
        e$3('#input')
    ], VscodeTextfield.prototype, "_inputEl", void 0);
    __decorate$l([
        r$2()
    ], VscodeTextfield.prototype, "_value", void 0);
    __decorate$l([
        r$2()
    ], VscodeTextfield.prototype, "_type", void 0);
    VscodeTextfield = __decorate$l([
        customElement('vscode-textfield')
    ], VscodeTextfield);

    const styles$h = [
        defaultStyles,
        i$4 `
    :host {
      color: var(--vscode-foreground, #cccccc);
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: 600;
      line-height: ${INPUT_LINE_HEIGHT_RATIO};
      cursor: default;
      display: block;
      padding: 5px 0;
    }

    .wrapper {
      display: block;
    }

    .wrapper.required:after {
      content: ' *';
    }

    ::slotted(.normal) {
      font-weight: normal;
    }

    ::slotted(.lightened) {
      color: var(--vscode-foreground, #cccccc);
      opacity: 0.9;
    }
  `,
    ];

    var __decorate$k = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-label
     *
     * @cssprop [--vscode-font-family=sans-serif]
     * @cssprop [--vscode-font-size=13px]
     * @cssprop [--vscode-foreground=#cccccc]
     */
    let VscodeLabel = class VscodeLabel extends VscElement {
        constructor() {
            super(...arguments);
            this.required = false;
            this._id = '';
            this._htmlFor = '';
            this._connected = false;
        }
        set htmlFor(val) {
            this._htmlFor = val;
            this.setAttribute('for', val);
            if (this._connected) {
                this._connectWithTarget();
            }
        }
        get htmlFor() {
            return this._htmlFor;
        }
        set id(val) {
            this._id = val;
        }
        get id() {
            return this._id;
        }
        attributeChangedCallback(name, old, value) {
            super.attributeChangedCallback(name, old, value);
        }
        connectedCallback() {
            super.connectedCallback();
            this._connected = true;
            if (this._id === '') {
                this._id = uniqueId('vscode-label-');
                this.setAttribute('id', this._id);
            }
            this._connectWithTarget();
        }
        _getTarget() {
            let target = null;
            if (this._htmlFor) {
                const root = this.getRootNode({ composed: false });
                if (root) {
                    target = root.querySelector(`#${this._htmlFor}`);
                }
            }
            return target;
        }
        async _connectWithTarget() {
            await this.updateComplete;
            const target = this._getTarget();
            if (target instanceof VscodeRadioGroup ||
                target instanceof VscodeCheckboxGroup) {
                target.setAttribute('aria-labelledby', this._id);
            }
            let label = '';
            if (this.textContent) {
                label = this.textContent.trim();
            }
            if (target instanceof VscodeTextfield || target instanceof VscodeTextarea) {
                target.label = label;
            }
        }
        _handleClick() {
            const target = this._getTarget();
            if (target && 'focus' in target) {
                target.focus();
            }
        }
        render() {
            return x `
      <label
        class=${e({ wrapper: true, required: this.required })}
        @click=${this._handleClick}
        ><slot></slot
      ></label>
    `;
        }
    };
    VscodeLabel.styles = styles$h;
    __decorate$k([
        n$1({ reflect: true, attribute: 'for' })
    ], VscodeLabel.prototype, "htmlFor", null);
    __decorate$k([
        n$1()
    ], VscodeLabel.prototype, "id", null);
    __decorate$k([
        n$1({ type: Boolean, reflect: true })
    ], VscodeLabel.prototype, "required", void 0);
    VscodeLabel = __decorate$k([
        customElement('vscode-label')
    ], VscodeLabel);

    const chevronDownIcon = x `
  <span class="icon">
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z"
      />
    </svg>
  </span>
`;

    /**
     * @license
     * Copyright 2020 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */const {I:t}=Z,s=()=>document.createComment(""),r=(o,i,n)=>{const e=o._$AA.parentNode,l=void 0===i?o._$AB:i._$AA;if(void 0===n){const i=e.insertBefore(s(),l),c=e.insertBefore(s(),l);n=new t(i,c,o,o.options);}else {const t=n._$AB.nextSibling,i=n._$AM,c=i!==o;if(c){let t;n._$AQ?.(o),n._$AM=o,void 0!==n._$AP&&(t=o._$AU)!==i._$AU&&n._$AP(t);}if(t!==l||c){let o=n._$AA;for(;o!==t;){const t=o.nextSibling;e.insertBefore(o,l),o=t;}}}return n},v=(o,t,i=o)=>(o._$AI(t,i),o),u$1={},m=(o,t=u$1)=>o._$AH=t,p=o=>o._$AH,M=o=>{o._$AP?.(!1,!0);let t=o._$AA;const i=o._$AB.nextSibling;for(;t!==i;){const o=t.nextSibling;t.remove(),t=o;}};

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const u=(e,s,t)=>{const r=new Map;for(let l=s;l<=t;l++)r.set(e[l],l);return r},c=e$1(class extends i{constructor(e){if(super(e),e.type!==t$1.CHILD)throw Error("repeat() can only be used in text expressions")}dt(e,s,t){let r;void 0===t?t=s:void 0!==s&&(r=s);const l=[],o=[];let i=0;for(const s of e)l[i]=r?r(s,i):i,o[i]=t(s,i),i++;return {values:o,keys:l}}render(e,s,t){return this.dt(e,s,t).values}update(s,[t,r$1,c]){const d=p(s),{values:p$1,keys:a}=this.dt(t,r$1,c);if(!Array.isArray(d))return this.ut=a,p$1;const h=this.ut??=[],v$1=[];let m$1,y,x=0,j=d.length-1,k=0,w=p$1.length-1;for(;x<=j&&k<=w;)if(null===d[x])x++;else if(null===d[j])j--;else if(h[x]===a[k])v$1[k]=v(d[x],p$1[k]),x++,k++;else if(h[j]===a[w])v$1[w]=v(d[j],p$1[w]),j--,w--;else if(h[x]===a[w])v$1[w]=v(d[x],p$1[w]),r(s,v$1[w+1],d[x]),x++,w--;else if(h[j]===a[k])v$1[k]=v(d[j],p$1[k]),r(s,d[x],d[j]),j--,k++;else if(void 0===m$1&&(m$1=u(a,k,w),y=u(h,x,j)),m$1.has(h[x]))if(m$1.has(h[j])){const e=y.get(a[k]),t=void 0!==e?d[e]:null;if(null===t){const e=r(s,d[x]);v(e,p$1[k]),v$1[k]=e;}else v$1[k]=v(t,p$1[k]),r(s,d[x],t),d[e]=null;k++;}else M(d[j]),j--;else M(d[x]),x++;for(;k<=w;){const e=r(s,v$1[w+1]);v(e,p$1[k]),v$1[k++]=e;}for(;x<=j;){const e=d[x++];null!==e&&M(e);}return this.ut=a,m(s,v$1),T}});

    var __decorate$j = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-option
     */
    let VscodeOption = class VscodeOption extends VscElement {
        constructor() {
            super(...arguments);
            this.description = '';
            this.selected = false;
            this.disabled = false;
            this._initialized = false;
            this._handleSlotChange = () => {
                if (this._initialized) {
                    /** @internal */
                    this.dispatchEvent(new Event('vsc-option-state-change', { bubbles: true }));
                }
            };
        }
        connectedCallback() {
            super.connectedCallback();
            this.updateComplete.then(() => {
                this._initialized = true;
            });
        }
        willUpdate(changedProperties) {
            if (this._initialized &&
                (changedProperties.has('description') ||
                    changedProperties.has('value') ||
                    changedProperties.has('selected') ||
                    changedProperties.has('disabled'))) {
                /** @internal */
                this.dispatchEvent(new Event('vsc-option-state-change', { bubbles: true }));
            }
        }
        render() {
            return x `<slot @slotchange=${this._handleSlotChange}></slot>`;
        }
    };
    VscodeOption.styles = defaultStyles;
    __decorate$j([
        n$1({ type: String })
    ], VscodeOption.prototype, "value", void 0);
    __decorate$j([
        n$1({ type: String })
    ], VscodeOption.prototype, "description", void 0);
    __decorate$j([
        n$1({ type: Boolean, reflect: true })
    ], VscodeOption.prototype, "selected", void 0);
    __decorate$j([
        n$1({ type: Boolean, reflect: true })
    ], VscodeOption.prototype, "disabled", void 0);
    VscodeOption = __decorate$j([
        customElement('vscode-option')
    ], VscodeOption);

    const startsWithPerTermSearch = (subject, pattern) => {
        const result = {
            match: false,
            ranges: [],
        };
        const lcSubject = subject.toLowerCase();
        const lcPattern = pattern.toLowerCase();
        const terms = lcSubject.split(' ');
        let offset = 0;
        terms.forEach((t, i) => {
            if (i > 0) {
                offset += terms[i - 1].length + 1;
            }
            if (result.match) {
                return;
            }
            const foundIndex = t.indexOf(lcPattern);
            const patternLength = lcPattern.length;
            if (foundIndex === 0) {
                result.match = true;
                result.ranges.push([
                    offset + foundIndex,
                    Math.min(offset + foundIndex + patternLength, subject.length),
                ]);
            }
        });
        return result;
    };
    const startsWithSearch = (subject, pattern) => {
        const result = {
            match: false,
            ranges: [],
        };
        const foundIndex = subject.toLowerCase().indexOf(pattern.toLowerCase());
        if (foundIndex === 0) {
            result.match = true;
            result.ranges = [[0, pattern.length]];
        }
        return result;
    };
    const containsSearch = (subject, pattern) => {
        const result = {
            match: false,
            ranges: [],
        };
        const foundIndex = subject.toLowerCase().indexOf(pattern.toLowerCase());
        if (foundIndex > -1) {
            result.match = true;
            result.ranges = [[foundIndex, foundIndex + pattern.length]];
        }
        return result;
    };
    const fuzzySearch = (subject, pattern) => {
        const result = {
            match: false,
            ranges: [],
        };
        let fromIndex = 0;
        let foundIndex = 0;
        const iMax = pattern.length - 1;
        const lcSubject = subject.toLowerCase();
        const lcPattern = pattern.toLowerCase();
        for (let i = 0; i <= iMax; i++) {
            foundIndex = lcSubject.indexOf(lcPattern[i], fromIndex);
            if (foundIndex === -1) {
                return {
                    match: false,
                    ranges: [],
                };
            }
            result.match = true;
            result.ranges.push([foundIndex, foundIndex + 1]);
            fromIndex = foundIndex + 1;
        }
        return result;
    };
    const filterOptionsByPattern = (list, pattern, method) => {
        const filtered = [];
        list.forEach((op) => {
            let result;
            switch (method) {
                case 'startsWithPerTerm':
                    result = startsWithPerTermSearch(op.label, pattern);
                    break;
                case 'startsWith':
                    result = startsWithSearch(op.label, pattern);
                    break;
                case 'contains':
                    result = containsSearch(op.label, pattern);
                    break;
                default:
                    result = fuzzySearch(op.label, pattern);
            }
            if (result.match) {
                filtered.push({ ...op, ranges: result.ranges });
            }
        });
        return filtered;
    };
    const preventSpaces = (text) => {
        const res = [];
        if (text === ' ') {
            res.push(x `&nbsp;`);
            return res;
        }
        if (text.indexOf(' ') === 0) {
            res.push(x `&nbsp;`);
        }
        res.push(x `${text.trimStart().trimEnd()}`);
        if (text.lastIndexOf(' ') === text.length - 1) {
            res.push(x `&nbsp;`);
        }
        return res;
    };
    const highlightRanges = (text, ranges) => {
        const res = [];
        const rl = ranges.length;
        if (rl < 1) {
            return x `${text}`;
        }
        ranges.forEach((r, i) => {
            const match = text.substring(r[0], r[1]);
            if (i === 0 && r[0] !== 0) {
                // text before the first range
                res.push(...preventSpaces(text.substring(0, ranges[0][0])));
            }
            if (i > 0 && i < rl && r[0] - ranges[i - 1][1] !== 0) {
                // text before the current range
                res.push(...preventSpaces(text.substring(ranges[i - 1][1], r[0])));
            }
            res.push(x `<b>${preventSpaces(match)}</b>`);
            if (i === rl - 1 && r[1] < text.length) {
                // text after the last range
                res.push(...preventSpaces(text.substring(r[1], text.length)));
            }
        });
        return res;
    };
    function findNextSelectableOptionIndex(options, fromIndex) {
        let result = 0;
        if (fromIndex < 0 || !options[fromIndex] || !options[fromIndex + 1]) {
            return result;
        }
        for (let i = fromIndex + 1; i < options.length; i++) {
            if (!options[i].disabled) {
                result = i;
                break;
            }
        }
        return result;
    }
    function findPrevSelectableOptionIndex(options, fromIndex) {
        let result = 0;
        if (fromIndex < 0 || !options[fromIndex] || !options[fromIndex - 1]) {
            return result;
        }
        for (let i = fromIndex - 1; i >= 0; i--) {
            if (!options[i].disabled) {
                result = i;
                break;
            }
        }
        return result;
    }

    var __decorate$i = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    const VISIBLE_OPTS = 10;
    const OPT_HEIGHT = 22;
    /**
     * @cssprop --dropdown-z-index - workaround for dropdown z-index issues
     */
    class VscodeSelectBase extends VscElement {
        /**
         * The element cannot be used and is not focusable.
         */
        set disabled(newState) {
            this._disabled = newState;
            this.ariaDisabled = newState ? 'true' : 'false';
            if (newState === true) {
                this._originalTabIndex = this.tabIndex;
                this.tabIndex = -1;
            }
            else {
                this.tabIndex = this._originalTabIndex ?? 0;
                this._originalTabIndex = undefined;
            }
            this.requestUpdate();
        }
        get disabled() {
            return this._disabled;
        }
        /**
         * Search method in the filtered list within the combobox mode.
         *
         * - contains - The list item includes the searched pattern at any position.
         * - fuzzy - The list item contains the letters of the search pattern in the same order, but at any position.
         * - startsWith - The search pattern matches the beginning of the searched text.
         * - startsWithPerTerm - The search pattern matches the beginning of any word in the searched text.
         *
         * @default 'fuzzy'
         */
        set filter(val) {
            const validValues = [
                'contains',
                'fuzzy',
                'startsWith',
                'startsWithPerTerm',
            ];
            if (validValues.includes(val)) {
                this._filter = val;
            }
            else {
                this._filter = 'fuzzy';
                console.warn(`[VSCode Webview Elements] Invalid filter: "${val}", fallback to default. Valid values are: "contains", "fuzzy", "startsWith", "startsWithPerm".`, this);
            }
        }
        get filter() {
            return this._filter;
        }
        /**
         * @attr [options=[]]
         * @type {Option[]}
         */
        set options(opts) {
            this._options = opts.map((op, index) => ({ ...op, index }));
        }
        get options() {
            return this._options.map(({ label, value, description, selected, disabled }) => ({
                label,
                value,
                description,
                selected,
                disabled,
            }));
        }
        constructor() {
            super();
            /** @internal */
            this.ariaExpanded = 'false';
            this.creatable = false;
            /**
             * Options can be filtered by typing into a text input field.
             */
            this.combobox = false;
            /**
             * Sets the invalid state manually.
             */
            this.invalid = false;
            /**
             * Its value is true when element is focused.
             */
            this.focused = false;
            /**
             * Toggle the dropdown visibility.
             */
            this.open = false;
            /**
             * Position of the options list when visible.
             */
            this.position = 'below';
            /** @internal */
            this.tabIndex = 0;
            this._firstUpdateCompleted = false;
            this._activeIndex = -1;
            this._currentDescription = '';
            this._filter = 'fuzzy';
            this._filterPattern = '';
            this._selectedIndex = -1;
            this._selectedIndexes = [];
            this._options = [];
            this._value = '';
            this._values = [];
            this._listScrollTop = 0;
            this._isPlaceholderOptionActive = false;
            this._isBeingFiltered = false;
            /** @internal */
            this._multiple = false;
            /**
             * @internal
             * Quick-searchable map for searching a value in the options list.
             * Keys are the options values, values are the option indexes.
             */
            this._valueOptionIndexMap = {};
            this._isHoverForbidden = false;
            this._disabled = false;
            this._originalTabIndex = undefined;
            this._onClickOutside = (event) => {
                const path = event.composedPath();
                const found = path.findIndex((et) => et === this);
                if (found === -1) {
                    this._toggleDropdown(false);
                    window.removeEventListener('click', this._onClickOutside);
                }
            };
            this._onMouseMove = () => {
                this._isHoverForbidden = false;
                window.removeEventListener('mousemove', this._onMouseMove);
            };
            this._onComponentKeyDown = (event) => {
                if ([' ', 'ArrowUp', 'ArrowDown', 'Escape'].includes(event.key)) {
                    event.stopPropagation();
                    event.preventDefault();
                }
                if (event.key === 'Enter') {
                    this._onEnterKeyDown(event);
                }
                if (event.key === ' ') {
                    this._onSpaceKeyDown();
                }
                if (event.key === 'Escape') {
                    this._toggleDropdown(false);
                }
                if (event.key === 'ArrowUp') {
                    this._onArrowUpKeyDown();
                }
                if (event.key === 'ArrowDown') {
                    this._onArrowDownKeyDown();
                }
            };
            this._onComponentFocus = () => {
                this.focused = true;
            };
            this._onComponentBlur = () => {
                this.focused = false;
            };
            this.addEventListener('vsc-option-state-change', (ev) => {
                ev.stopPropagation();
                this._setStateFromSlottedElements();
                this.requestUpdate();
            });
        }
        connectedCallback() {
            super.connectedCallback();
            this.addEventListener('keydown', this._onComponentKeyDown);
            this.addEventListener('focus', this._onComponentFocus);
            this.addEventListener('blur', this._onComponentBlur);
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            this.removeEventListener('keydown', this._onComponentKeyDown);
            this.removeEventListener('focus', this._onComponentFocus);
            this.removeEventListener('blur', this._onComponentBlur);
        }
        firstUpdated(_changedProperties) {
            this._firstUpdateCompleted = true;
        }
        willUpdate(changedProperties) {
            if (changedProperties.has('required') && this._firstUpdateCompleted) {
                this._manageRequired();
            }
        }
        get _filteredOptions() {
            if (!this.combobox || this._filterPattern === '') {
                return this._options;
            }
            return filterOptionsByPattern(this._options, this._filterPattern, this._filter);
        }
        get _currentOptions() {
            return this.combobox ? this._filteredOptions : this._options;
        }
        get _isSuggestedOptionVisible() {
            if (!(this.combobox && this.creatable)) {
                return false;
            }
            const filterPatternExistsAsOption = typeof this._valueOptionIndexMap[this._filterPattern] !== 'undefined';
            const filtered = this._filterPattern.length > 0;
            return !filterPatternExistsAsOption && filtered;
        }
        _manageRequired() { }
        _setStateFromSlottedElements() {
            const options = [];
            let nextIndex = 0;
            const optionElements = this._assignedOptions ?? [];
            const selectedIndexes = [];
            const values = [];
            this._valueOptionIndexMap = {};
            optionElements.forEach((el, i) => {
                const { innerText, description, disabled } = el;
                const value = typeof el.value === 'string' ? el.value : innerText.trim();
                const selected = el.selected ?? false;
                const op = {
                    label: innerText.trim(),
                    value,
                    description,
                    selected,
                    index: nextIndex,
                    disabled,
                };
                nextIndex = options.push(op);
                if (selected && !this._multiple) {
                    this._activeIndex = i;
                }
                if (selected) {
                    selectedIndexes.push(options.length - 1);
                    values.push(value);
                }
                this._valueOptionIndexMap[op.value] = op.index;
            });
            this._options = options;
            if (selectedIndexes.length > 0) {
                this._selectedIndex = selectedIndexes[0];
                this._selectedIndexes = selectedIndexes;
                this._value = values[0];
                this._values = values;
            }
            if (!this._multiple && !this.combobox && selectedIndexes.length === 0) {
                this._selectedIndex = this._options.length > 0 ? 0 : -1;
            }
        }
        async _toggleDropdown(visible) {
            this.open = visible;
            this.ariaExpanded = String(visible);
            if (visible && !this._multiple) {
                this._activeIndex = this._selectedIndex;
            }
            if (visible && !this._multiple && !this.combobox) {
                this._activeIndex = this._selectedIndex;
                if (this._activeIndex > VISIBLE_OPTS - 1) {
                    await this.updateComplete;
                    this._listElement.scrollTop = Math.floor(this._activeIndex * OPT_HEIGHT);
                }
            }
            if (visible) {
                window.addEventListener('click', this._onClickOutside);
            }
            else {
                window.removeEventListener('click', this._onClickOutside);
            }
        }
        _createSuggestedOption() {
            const nextSelectedIndex = this._options.length;
            const op = document.createElement('vscode-option');
            op.value = this._filterPattern;
            B(this._filterPattern, op);
            this.appendChild(op);
            return nextSelectedIndex;
        }
        _dispatchChangeEvent() {
            if (!this._multiple) {
                /** @deprecated */
                this.dispatchEvent(new CustomEvent('vsc-change', {
                    detail: {
                        selectedIndex: this._selectedIndex,
                        value: this._value,
                    },
                }));
            }
            else {
                /** @deprecated */
                this.dispatchEvent(new CustomEvent('vsc-change', {
                    detail: {
                        selectedIndexes: this._selectedIndexes,
                        value: this._values,
                    },
                }));
            }
            this.dispatchEvent(new Event('change'));
            this.dispatchEvent(new Event('input'));
        }
        async _createAndSelectSuggestedOption() { }
        _onFaceClick() {
            this._toggleDropdown(!this.open);
            if (this._multiple) {
                this._activeIndex = 0;
            }
        }
        _toggleComboboxDropdown() {
            this._filterPattern = '';
            this._toggleDropdown(!this.open);
            if (this._multiple) {
                this._activeIndex = -1;
            }
        }
        _onComboboxButtonClick() {
            this._toggleComboboxDropdown();
        }
        _onComboboxButtonKeyDown(ev) {
            if (ev.key === 'Enter') {
                this._toggleComboboxDropdown();
            }
        }
        _onOptionMouseOver(ev) {
            if (this._isHoverForbidden) {
                return;
            }
            const el = ev.target;
            if (!el.matches('.option')) {
                return;
            }
            if (el.matches('.placeholder')) {
                this._isPlaceholderOptionActive = true;
                this._activeIndex = -1;
            }
            else {
                this._isPlaceholderOptionActive = false;
                this._activeIndex = Number(this.combobox ? el.dataset.filteredIndex : el.dataset.index);
            }
        }
        _onPlaceholderOptionMouseOut() {
            this._isPlaceholderOptionActive = false;
        }
        _onNoOptionsClick(ev) {
            ev.stopPropagation();
        }
        _onEnterKeyDown(ev) {
            this._isBeingFiltered = false;
            const clickedOnAcceptButton = ev?.composedPath
                ? ev
                    .composedPath()
                    .find((el) => el.matches
                    ? el.matches('vscode-button.button-accept')
                    : false)
                : false;
            if (clickedOnAcceptButton) {
                return;
            }
            const list = this.combobox ? this._filteredOptions : this._options;
            const showDropdownNext = !this.open;
            this._toggleDropdown(showDropdownNext);
            if (!this._multiple &&
                !showDropdownNext &&
                this._selectedIndex !== this._activeIndex) {
                this._selectedIndex =
                    this._activeIndex > -1 ? list[this._activeIndex].index : -1;
                this._value =
                    this._selectedIndex > -1
                        ? this._options[this._selectedIndex].value
                        : '';
                this._dispatchChangeEvent();
            }
            if (this.combobox) {
                if (this._isPlaceholderOptionActive) {
                    this._createAndSelectSuggestedOption();
                }
                else {
                    if (!this._multiple && !showDropdownNext) {
                        this._selectedIndex =
                            this._activeIndex > -1
                                ? this._filteredOptions[this._activeIndex].index
                                : -1;
                    }
                    if (!this._multiple && showDropdownNext) {
                        this.updateComplete.then(() => {
                            this._scrollActiveElementToTop();
                        });
                    }
                }
            }
            if (this._multiple && showDropdownNext) {
                this._activeIndex = 0;
            }
        }
        _onSpaceKeyDown() {
            if (!this.open) {
                this._toggleDropdown(true);
                return;
            }
            if (this.open && this._multiple && this._activeIndex > -1) {
                const opts = this.combobox ? this._filteredOptions : this._options;
                const selectedOption = opts[this._activeIndex];
                const nextSelectedIndexes = [];
                this._options[selectedOption.index].selected = !selectedOption.selected;
                opts.forEach(({ index }) => {
                    const { selected } = this._options[index];
                    if (selected) {
                        nextSelectedIndexes.push(index);
                    }
                });
                this._selectedIndexes = nextSelectedIndexes;
            }
        }
        _scrollActiveElementToTop() {
            this._listElement.scrollTop = Math.floor(this._activeIndex * OPT_HEIGHT);
        }
        async _adjustOptionListScrollPos(direction, optionIndex) {
            let numOpts = this.combobox
                ? this._filteredOptions.length
                : this._options.length;
            const suggestedOptionVisible = this._isSuggestedOptionVisible;
            if (suggestedOptionVisible) {
                numOpts += 1;
            }
            if (numOpts <= VISIBLE_OPTS) {
                return;
            }
            this._isHoverForbidden = true;
            window.addEventListener('mousemove', this._onMouseMove);
            const ulScrollTop = this._listElement.scrollTop;
            const liPosY = optionIndex * OPT_HEIGHT;
            const fullyVisible = liPosY >= ulScrollTop &&
                liPosY <= ulScrollTop + VISIBLE_OPTS * OPT_HEIGHT - OPT_HEIGHT;
            if (direction === 'down') {
                if (!fullyVisible) {
                    this._listElement.scrollTop =
                        optionIndex * OPT_HEIGHT - (VISIBLE_OPTS - 1) * OPT_HEIGHT;
                }
            }
            if (direction === 'up') {
                if (!fullyVisible) {
                    this._listElement.scrollTop = Math.floor(this._activeIndex * OPT_HEIGHT);
                }
            }
        }
        _onArrowUpKeyDown() {
            if (this.open) {
                if (this._activeIndex <= 0 && !(this.combobox && this.creatable)) {
                    return;
                }
                if (this._isPlaceholderOptionActive) {
                    const optionIndex = this._currentOptions.length - 1;
                    this._activeIndex = optionIndex;
                    this._isPlaceholderOptionActive = false;
                }
                else {
                    const currentOptions = this.combobox
                        ? this._filteredOptions
                        : this._options;
                    const prevSelectable = findPrevSelectableOptionIndex(currentOptions, this._activeIndex);
                    if (prevSelectable > -1) {
                        this._activeIndex = prevSelectable;
                        this._adjustOptionListScrollPos('up', prevSelectable);
                    }
                }
            }
        }
        _onArrowDownKeyDown() {
            let numOpts = this.combobox
                ? this._filteredOptions.length
                : this._options.length;
            const currentOptions = this.combobox
                ? this._filteredOptions
                : this._options;
            const suggestedOptionVisible = this._isSuggestedOptionVisible;
            if (suggestedOptionVisible) {
                numOpts += 1;
            }
            if (this.open) {
                if (this._isPlaceholderOptionActive && this._activeIndex === -1) {
                    return;
                }
                if (suggestedOptionVisible && this._activeIndex === numOpts - 2) {
                    this._isPlaceholderOptionActive = true;
                    this._adjustOptionListScrollPos('down', numOpts - 1);
                    this._activeIndex = -1;
                }
                else if (this._activeIndex < numOpts - 1) {
                    const nextSelectable = findNextSelectableOptionIndex(currentOptions, this._activeIndex);
                    if (nextSelectable > -1) {
                        this._activeIndex = nextSelectable;
                        this._adjustOptionListScrollPos('down', nextSelectable);
                    }
                }
            }
        }
        _onSlotChange() {
            this._setStateFromSlottedElements();
            this.requestUpdate();
        }
        _onComboboxInputFocus(ev) {
            ev.target.select();
            this._isBeingFiltered = false;
            this._filterPattern = '';
        }
        _onComboboxInputBlur() {
            this._isBeingFiltered = false;
        }
        _onComboboxInputInput(ev) {
            this._isBeingFiltered = true;
            this._filterPattern = ev.target.value;
            this._activeIndex = -1;
            this._toggleDropdown(true);
        }
        _onComboboxInputClick() {
            this._isBeingFiltered = this._filterPattern !== '';
            this._toggleDropdown(true);
        }
        _onOptionClick(_ev) {
            this._isBeingFiltered = false;
            return;
        }
        _renderOptions() {
            const list = this.combobox ? this._filteredOptions : this._options;
            return x `
      <ul
        class="options"
        @click=${this._onOptionClick}
        @mouseover=${this._onOptionMouseOver}
      >
        ${c(list, (op) => op.index, (op, index) => {
            const optionClasses = {
                active: index === this._activeIndex && !op.disabled,
                disabled: op.disabled,
                option: true,
                selected: op.selected,
            };
            const checkboxClasses = {
                'checkbox-icon': true,
                checked: op.selected,
            };
            const labelText = (op.ranges?.length ?? 0 > 0)
                ? highlightRanges(op.label, op.ranges ?? [])
                : op.label;
            return x `
              <li
                class=${e(optionClasses)}
                data-index=${op.index}
                data-filtered-index=${index}
              >
                ${this._multiple
                ? x `<span class=${e(checkboxClasses)}></span
                      ><span class="option-label">${labelText}</span>`
                : labelText}
              </li>
            `;
        })}
        ${this._renderPlaceholderOption(list.length < 1)}
      </ul>
    `;
        }
        _renderPlaceholderOption(isListEmpty) {
            if (!this.combobox) {
                return E;
            }
            if (this._valueOptionIndexMap[this._filterPattern]) {
                return E;
            }
            if (this.creatable && this._filterPattern.length > 0) {
                return x `<li
        class=${e({
                option: true,
                placeholder: true,
                active: this._isPlaceholderOptionActive,
            })}
        @mouseout=${this._onPlaceholderOptionMouseOut}
      >
        Add "${this._filterPattern}"
      </li>`;
            }
            else {
                return isListEmpty
                    ? x `<li class="no-options" @click=${this._onNoOptionsClick}>
            No options
          </li>`
                    : E;
            }
        }
        _renderDescription() {
            if (!this._options[this._activeIndex]) {
                return E;
            }
            const { description } = this._options[this._activeIndex];
            return description
                ? x `<div class="description">${description}</div>`
                : E;
        }
        _renderSelectFace() {
            return x `${E}`;
        }
        _renderMultiSelectLabel() {
            switch (this._selectedIndexes.length) {
                case 0:
                    return x `<span class="select-face-badge no-item"
          >No items selected</span
        >`;
                case 1:
                    return x `<span class="select-face-badge">1 item selected</span>`;
                default:
                    return x `<span class="select-face-badge"
          >${this._selectedIndexes.length} items selected</span
        >`;
            }
        }
        _renderComboboxFace() {
            let inputVal = '';
            if (this._isBeingFiltered) {
                inputVal = this._filterPattern;
            }
            else {
                inputVal =
                    this._selectedIndex > -1
                        ? (this._options[this._selectedIndex]?.label ?? '')
                        : '';
            }
            return x `
      <div class="combobox-face face">
        ${this._multiple ? this._renderMultiSelectLabel() : E}
        <input
          class="combobox-input"
          spellcheck="false"
          type="text"
          autocomplete="off"
          .value=${inputVal}
          @focus=${this._onComboboxInputFocus}
          @blur=${this._onComboboxInputBlur}
          @input=${this._onComboboxInputInput}
          @click=${this._onComboboxInputClick}
        >
        <button
          class="combobox-button"
          type="button"
          @click=${this._onComboboxButtonClick}
          @keydown=${this._onComboboxButtonKeyDown}
        >
          ${chevronDownIcon}
        </button>
      </div>
    `;
        }
        _renderDropdownControls() {
            return x `${E}`;
        }
        _renderDropdown() {
            const classes = e({
                dropdown: true,
                multiple: this._multiple,
            });
            return x `
      <div class=${classes}>
        ${this.position === 'above' ? this._renderDescription() : E}
        ${this._renderOptions()} ${this._renderDropdownControls()}
        ${this.position === 'below' ? this._renderDescription() : E}
      </div>
    `;
        }
        render() {
            return x `
      <slot class="main-slot" @slotchange=${this._onSlotChange}></slot>
      ${this.combobox ? this._renderComboboxFace() : this._renderSelectFace()}
      ${this.open ? this._renderDropdown() : E}
    `;
        }
    }
    __decorate$i([
        n$1({ type: String, reflect: true, attribute: 'aria-expanded' })
    ], VscodeSelectBase.prototype, "ariaExpanded", void 0);
    __decorate$i([
        n$1({ type: Boolean, reflect: true })
    ], VscodeSelectBase.prototype, "creatable", void 0);
    __decorate$i([
        n$1({ type: Boolean, reflect: true })
    ], VscodeSelectBase.prototype, "combobox", void 0);
    __decorate$i([
        n$1({ type: Boolean, reflect: true })
    ], VscodeSelectBase.prototype, "disabled", null);
    __decorate$i([
        n$1({ type: Boolean, reflect: true })
    ], VscodeSelectBase.prototype, "invalid", void 0);
    __decorate$i([
        n$1()
    ], VscodeSelectBase.prototype, "filter", null);
    __decorate$i([
        n$1({ type: Boolean, reflect: true })
    ], VscodeSelectBase.prototype, "focused", void 0);
    __decorate$i([
        n$1({ type: Boolean, reflect: true })
    ], VscodeSelectBase.prototype, "open", void 0);
    __decorate$i([
        n$1({ type: Array })
    ], VscodeSelectBase.prototype, "options", null);
    __decorate$i([
        n$1({ reflect: true })
    ], VscodeSelectBase.prototype, "position", void 0);
    __decorate$i([
        n$1({ type: Number, attribute: true, reflect: true })
    ], VscodeSelectBase.prototype, "tabIndex", void 0);
    __decorate$i([
        o$1({
            flatten: true,
            selector: 'vscode-option',
        })
    ], VscodeSelectBase.prototype, "_assignedOptions", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_activeIndex", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_currentDescription", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_filter", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_filteredOptions", null);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_filterPattern", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_selectedIndex", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_selectedIndexes", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_options", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_value", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_values", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_listScrollTop", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_isPlaceholderOptionActive", void 0);
    __decorate$i([
        r$2()
    ], VscodeSelectBase.prototype, "_isBeingFiltered", void 0);
    __decorate$i([
        e$3('.options')
    ], VscodeSelectBase.prototype, "_listElement", void 0);

    var styles$g = [
        defaultStyles,
        i$4 `
    :host {
      display: inline-block;
      max-width: 100%;
      outline: none;
      position: relative;
      width: 320px;
    }

    .main-slot {
      display: none;
    }

    .select-face,
    .combobox-face {
      background-color: var(--vscode-settings-dropdownBackground, #313131);
      border-color: var(--vscode-settings-dropdownBorder, #3c3c3c);
      border-radius: 2px;
      border-style: solid;
      border-width: 1px;
      box-sizing: border-box;
      color: var(--vscode-settings-dropdownForeground, #cccccc);
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 18px;
      position: relative;
      user-select: none;
      width: 100%;
    }

    :host([invalid]) .select-face,
    :host(:invalid) .select-face,
    :host([invalid]) .combobox-face,
    :host(:invalid) .combobox-face {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    .select-face {
      cursor: pointer;
      display: block;
      padding: 3px 4px;
    }

    .select-face .text {
      display: block;
      height: 18px;
      overflow: hidden;
    }

    .select-face.multiselect {
      padding: 0;
    }

    .select-face-badge {
      background-color: var(--vscode-badge-background, #616161);
      border-radius: 2px;
      color: var(--vscode-badge-foreground, #f8f8f8);
      display: inline-block;
      flex-shrink: 0;
      font-size: 11px;
      line-height: 16px;
      margin: 2px;
      padding: 2px 3px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .select-face-badge.no-item {
      background-color: transparent;
      color: inherit;
    }

    .combobox-face {
      display: flex;
    }

    :host(:focus) .select-face,
    :host(:focus) .combobox-face,
    :host([focused]) .select-face,
    :host([focused]) .combobox-face {
      border-color: var(--vscode-focusBorder, #0078d4);
      outline: none;
    }

    .combobox-input {
      background-color: transparent;
      box-sizing: border-box;
      border: 0;
      color: var(--vscode-foreground, #cccccc);
      display: block;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      line-height: 16px;
      padding: 4px;
      width: 100%;
    }

    .combobox-input:focus {
      outline: none;
    }

    .combobox-button {
      align-items: center;
      background-color: transparent;
      border: 0;
      border-radius: 2px;
      box-sizing: content-box;
      color: var(--vscode-foreground, #cccccc);
      cursor: pointer;
      display: flex;
      flex-shrink: 0;
      height: 16px;
      justify-content: center;
      margin: 1px 1px 0 0;
      padding: 3px;
      width: 22px;
    }

    .combobox-button:hover,
    .combobox-button:focus-visible {
      background-color: var(
        --vscode-toolbar-hoverBackground,
        rgba(90, 93, 94, 0.31)
      );
      outline-style: dashed;
      outline-color: var(--vscode-toolbar-hoverOutline, transparent);
    }

    .combobox-button:focus-visible {
      outline: none;
    }

    .icon {
      color: var(--vscode-foreground, #cccccc);
      display: block;
      height: 14px;
      pointer-events: none;
      width: 14px;
    }

    .select-face .icon {
      position: absolute;
      right: 6px;
      top: 5px;
    }

    .icon svg {
      color: var(--vscode-foreground, #cccccc);
      height: 100%;
      width: 100%;
    }

    .dropdown {
      background-color: var(--vscode-settings-dropdownBackground, #313131);
      border-color: var(--vscode-settings-dropdownListBorder, #454545);
      border-radius: 0 0 3px 3px;
      border-style: solid;
      border-width: 1px;
      box-sizing: border-box;
      left: 0;
      padding-bottom: 2px;
      position: absolute;
      top: 100%;
      width: 100%;
      z-index: var(--dropdown-z-index, 2);
    }

    :host([position='above']) .dropdown {
      border-radius: 3px 3px 0 0;
      bottom: 26px;
      padding-bottom: 0;
      padding-top: 2px;
      top: auto;
    }

    :host(:focus) .dropdown,
    :host([focused]) .dropdown {
      border-color: var(--vscode-focusBorder, #0078d4);
    }

    .options {
      box-sizing: border-box;
      cursor: pointer;
      list-style: none;
      margin: 0;
      max-height: 222px;
      overflow: auto;
      padding: 1px;
    }

    .option {
      align-items: center;
      box-sizing: border-box;
      color: var(--vscode-foreground, #cccccc);
      cursor: pointer;
      display: flex;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      height: 22px;
      line-height: 18px;
      min-height: calc(var(--vscode-font-size) * 1.3);
      padding: 1px 3px;
      user-select: none;
      outline-color: transparent;
      outline-offset: -1px;
      outline-style: solid;
      outline-width: 1px;
    }

    .option b {
      color: var(--vscode-list-highlightForeground, #2aaaff);
    }

    .option.active b {
      color: var(--vscode-list-focusHighlightForeground, #2aaaff);
    }

    .option:not(.disabled):hover {
      background-color: var(--vscode-list-hoverBackground, #2a2d2e);
      color: var(--vscode-list-hoverForeground, #ffffff);
    }

    :host-context(body[data-vscode-theme-kind='vscode-high-contrast'])
      .option:hover,
    :host-context(body[data-vscode-theme-kind='vscode-high-contrast-light'])
      .option:hover {
      outline-style: dotted;
      outline-color: var(--vscode-list-focusOutline, #0078d4);
      outline-width: 1px;
    }

    .option.disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }

    .option.active,
    .option.active:hover {
      background-color: var(--vscode-list-activeSelectionBackground, #04395e);
      color: var(--vscode-list-activeSelectionForeground, #ffffff);
      outline-color: var(--vscode-list-activeSelectionBackground, #04395e);
      outline-style: solid;
      outline-width: 1px;
    }

    .no-options {
      align-items: center;
      border-color: transparent;
      border-style: solid;
      border-width: 1px;
      color: var(--vscode-foreground, #cccccc);
      cursor: default;
      display: flex;
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 18px;
      min-height: calc(var(--vscode-font-size) * 1.3);
      opacity: 0.85;
      padding: 1px 3px;
      user-select: none;
    }

    .placeholder {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .placeholder span {
      font-weight: bold;
    }

    .placeholder:not(.disabled):hover {
      color: var(--vscode-list-activeSelectionForeground, #ffffff);
    }

    :host-context(body[data-vscode-theme-kind='vscode-high-contrast'])
      .option.active,
    :host-context(body[data-vscode-theme-kind='vscode-high-contrast-light'])
      .option.active:hover {
      outline-color: var(--vscode-list-focusOutline, #0078d4);
      outline-style: dashed;
    }

    .option-label {
      display: block;
      pointer-events: none;
      width: 100%;
    }

    .dropdown.multiple .option.selected {
      background-color: var(--vscode-list-hoverBackground, #2a2d2e);
      outline-color: var(--vscode-list-hoverBackground, #2a2d2e);
    }

    .dropdown.multiple .option.selected.active {
      background-color: var(--vscode-list-activeSelectionBackground, #04395e);
      color: var(--vscode-list-activeSelectionForeground, #ffffff);
      outline-color: var(--vscode-list-activeSelectionBackground, #04395e);
    }

    .checkbox-icon {
      background-color: var(--vscode-settings-checkboxBackground, #313131);
      border: 1px solid currentColor;
      border-radius: 2px;
      box-sizing: border-box;
      height: 14px;
      margin-right: 5px;
      overflow: hidden;
      position: relative;
      width: 14px;
    }

    .checkbox-icon.checked:before,
    .checkbox-icon.checked:after {
      content: '';
      display: block;
      height: 5px;
      position: absolute;
      transform: rotate(-45deg);
      width: 10px;
    }

    .checkbox-icon.checked:before {
      background-color: var(--vscode-foreground, #cccccc);
      left: 1px;
      top: 2.5px;
    }

    .checkbox-icon.checked:after {
      background-color: var(--vscode-settings-checkboxBackground, #313131);
      left: 1px;
      top: -0.5px;
    }

    .dropdown-controls {
      display: flex;
      justify-content: flex-end;
      padding: 4px;
    }

    .dropdown-controls :not(:last-child) {
      margin-right: 4px;
    }

    .action-icon {
      align-items: center;
      background-color: transparent;
      border: 0;
      color: var(--vscode-foreground, #cccccc);
      cursor: pointer;
      display: flex;
      height: 24px;
      justify-content: center;
      padding: 0;
      width: 24px;
    }

    .action-icon:focus {
      outline: none;
    }

    .action-icon:focus-visible {
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: -1px;
    }

    .description {
      border-color: var(--vscode-settings-dropdownBorder, #3c3c3c);
      border-style: solid;
      border-width: 1px 0 0;
      color: var(--vscode-foreground, #cccccc);
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 1.3;
      padding: 6px 4px;
      word-wrap: break-word;
    }

    :host([position='above']) .description {
      border-width: 0 0 1px;
    }
  `,
    ];

    var __decorate$h = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Allows to select multiple items from a list of options.
     *
     * When participating in a form, it supports the `:invalid` pseudo class. Otherwise the error styles
     * can be applied through the `invalid` property.
     *
     * @tag vscode-multi-select
     *
     * @prop {boolean} invalid
     * @attr {boolean} invalid
     * @attr name - Name which is used as a variable name in the data of the form-container.
     *
     * @cssprop [--dropdown-z-index=2]
     * @cssprop [--vscode-badge-background=#616161]
     * @cssprop [--vscode-badge-foreground=#f8f8f8]
     * @cssprop [--vscode-settings-dropdownBorder=#3c3c3c]
     * @cssprop [--vscode-settings-checkboxBackground=#313131]
     * @cssprop [--vscode-settings-dropdownBackground=#313131]
     * @cssprop [--vscode-settings-dropdownForeground=#cccccc]
     * @cssprop [--vscode-settings-dropdownListBorder=#454545]
     * @cssprop [--vscode-focusBorder=#0078d4]
     * @cssprop [--vscode-foreground=#cccccc]
     * @cssprop [--vscode-font-family=sans-serif]
     * @cssprop [--vscode-font-size=13px]
     * @cssprop [--vscode-font-weight=normal]
     * @cssprop [--vscode-inputValidation-errorBackground=#5a1d1d]
     * @cssprop [--vscode-inputValidation-errorBorder=#be1100]
     * @cssprop [--vscode-list-activeSelectionBackground=#04395e]
     * @cssprop [--vscode-list-activeSelectionForeground=#ffffff]
     * @cssprop [--vscode-list-focusOutline=#0078d4]
     * @cssprop [--vscode-list-focusHighlightForeground=#2aaaff]
     * @cssprop [--vscode-list-highlightForeground=#2aaaff]
     * @cssprop [--vscode-list-hoverBackground=#2a2d2e]
     * @cssprop [--vscode-list-hoverForeground=#ffffff]
     */
    let VscodeMultiSelect = class VscodeMultiSelect extends VscodeSelectBase {
        set selectedIndexes(val) {
            const newIndexes = [];
            val.forEach((v) => {
                if (typeof this._options[v] !== 'undefined') {
                    if (!newIndexes.includes(v)) {
                        this._options[v].selected = true;
                        newIndexes.push(v);
                    }
                }
            });
            this._selectedIndexes = newIndexes;
        }
        get selectedIndexes() {
            return this._selectedIndexes;
        }
        set value(val) {
            const sanitizedVal = Array.isArray(val)
                ? val.map((v) => String(v))
                : [String(val)];
            this._values = [];
            this._selectedIndexes.forEach((i) => {
                this._options[i].selected = false;
            });
            this._selectedIndexes = [];
            sanitizedVal.forEach((v) => {
                if (typeof this._valueOptionIndexMap[v] === 'number') {
                    this._selectedIndexes.push(this._valueOptionIndexMap[v]);
                    this._options[this._valueOptionIndexMap[v]].selected = true;
                    this._values.push(v);
                }
            });
            if (this._selectedIndexes.length > 0) {
                this._requestedValueToSetLater = [];
            }
            else {
                this._requestedValueToSetLater = Array.isArray(val) ? val : [val];
            }
            this._setFormValue();
            this._manageRequired();
        }
        get value() {
            return this._values;
        }
        get form() {
            return this._internals.form;
        }
        /** @internal */
        get type() {
            return 'select-multiple';
        }
        get validity() {
            return this._internals.validity;
        }
        get validationMessage() {
            return this._internals.validationMessage;
        }
        get willValidate() {
            return this._internals.willValidate;
        }
        checkValidity() {
            return this._internals.checkValidity();
        }
        reportValidity() {
            return this._internals.reportValidity();
        }
        constructor() {
            super();
            this.defaultValue = [];
            this.required = false;
            this.name = undefined;
            this._requestedValueToSetLater = [];
            this._onOptionClick = (ev) => {
                const composedPath = ev.composedPath();
                const optEl = composedPath.find((et) => {
                    if ('matches' in et) {
                        return et.matches('li.option');
                    }
                    return false;
                });
                if (!optEl) {
                    return;
                }
                const isPlaceholderOption = optEl.classList.contains('placeholder');
                if (isPlaceholderOption) {
                    this._createAndSelectSuggestedOption();
                    return;
                }
                const index = Number(optEl.dataset.index);
                if (this._options[index]) {
                    if (this._options[index].disabled) {
                        return;
                    }
                    this._options[index].selected = !this._options[index].selected;
                }
                this._selectedIndexes = [];
                this._values = [];
                this._options.forEach((op) => {
                    if (op.selected) {
                        this._selectedIndexes.push(op.index);
                        this._values.push(op.value);
                    }
                });
                this._setFormValue();
                this._manageRequired();
                this._dispatchChangeEvent();
            };
            /** @internal */
            this._multiple = true;
            this._internals = this.attachInternals();
        }
        connectedCallback() {
            super.connectedCallback();
            this.updateComplete.then(() => {
                this._setDefaultValue();
                this._manageRequired();
            });
        }
        /** @internal */
        formResetCallback() {
            this.updateComplete.then(() => {
                this.value = this.defaultValue;
            });
        }
        /** @internal */
        formStateRestoreCallback(state, _mode) {
            const entries = Array.from(state.entries()).map((e) => String(e[1]));
            this.updateComplete.then(() => {
                this.value = entries;
            });
        }
        _setDefaultValue() {
            if (Array.isArray(this.defaultValue) && this.defaultValue.length > 0) {
                const val = this.defaultValue.map((v) => String(v));
                this.value = val;
            }
        }
        _manageRequired() {
            const { value } = this;
            if (value.length === 0 && this.required) {
                this._internals.setValidity({
                    valueMissing: true,
                }, 'Please select an item in the list.', this._faceElement);
            }
            else {
                this._internals.setValidity({});
            }
        }
        _setFormValue() {
            const fd = new FormData();
            this._values.forEach((v) => {
                fd.append(this.name ?? '', v);
            });
            this._internals.setFormValue(fd);
        }
        async _createAndSelectSuggestedOption() {
            super._createAndSelectSuggestedOption();
            const nextIndex = this._createSuggestedOption();
            await this.updateComplete;
            this.selectedIndexes = [...this.selectedIndexes, nextIndex];
            this._dispatchChangeEvent();
            const opCreateEvent = new CustomEvent('vsc-multi-select-create-option', { detail: { value: this._options[nextIndex]?.value ?? '' } });
            this.dispatchEvent(opCreateEvent);
            this._toggleDropdown(false);
            this._isPlaceholderOptionActive = false;
        }
        _onSlotChange() {
            super._onSlotChange();
            if (this._requestedValueToSetLater.length > 0) {
                this.options.forEach((o, i) => {
                    if (this._requestedValueToSetLater.includes(o.value)) {
                        this._selectedIndexes.push(i);
                        this._values.push(o.value);
                        this._options[i].selected = true;
                        this._requestedValueToSetLater =
                            this._requestedValueToSetLater.filter((v) => v !== o.value);
                    }
                });
            }
        }
        _onMultiAcceptClick() {
            this._toggleDropdown(false);
        }
        _onMultiDeselectAllClick() {
            this._selectedIndexes = [];
            this._values = [];
            this._options = this._options.map((op) => ({ ...op, selected: false }));
            this._manageRequired();
            this._dispatchChangeEvent();
        }
        _onMultiSelectAllClick() {
            this._selectedIndexes = [];
            this._values = [];
            this._options = this._options.map((op) => ({ ...op, selected: true }));
            this._options.forEach((op, index) => {
                this._selectedIndexes.push(index);
                this._values.push(op.value);
                this._dispatchChangeEvent();
            });
            this._setFormValue();
            this._manageRequired();
        }
        _renderLabel() {
            switch (this._selectedIndexes.length) {
                case 0:
                    return x `<span class="select-face-badge no-item"
          >No items selected</span
        >`;
                case 1:
                    return x `<span class="select-face-badge">1 item selected</span>`;
                default:
                    return x `<span class="select-face-badge"
          >${this._selectedIndexes.length} items selected</span
        >`;
            }
        }
        _renderSelectFace() {
            return x `
      <div
        class="select-face face multiselect"
        @click=${this._onFaceClick}
        tabindex=${this.tabIndex > -1 ? 0 : -1}
      >
        ${this._renderLabel()} ${chevronDownIcon}
      </div>
    `;
        }
        _renderDropdownControls() {
            return this._filteredOptions.length > 0
                ? x `
          <div class="dropdown-controls">
            <button
              type="button"
              @click=${this._onMultiSelectAllClick}
              title="Select all"
              class="action-icon"
              id="select-all"
            >
              <vscode-icon name="checklist"></vscode-icon>
            </button>
            <button
              type="button"
              @click=${this._onMultiDeselectAllClick}
              title="Deselect all"
              class="action-icon"
              id="select-none"
            >
              <vscode-icon name="clear-all"></vscode-icon>
            </button>
            <vscode-button
              class="button-accept"
              @click=${this._onMultiAcceptClick}
              >OK</vscode-button
            >
          </div>
        `
                : x `${E}`;
        }
    };
    VscodeMultiSelect.styles = styles$g;
    /** @internal */
    VscodeMultiSelect.shadowRootOptions = {
        ...i$1.shadowRootOptions,
        delegatesFocus: true,
    };
    VscodeMultiSelect.formAssociated = true;
    __decorate$h([
        n$1({ type: Array, attribute: 'default-value' })
    ], VscodeMultiSelect.prototype, "defaultValue", void 0);
    __decorate$h([
        n$1({ type: Boolean, reflect: true })
    ], VscodeMultiSelect.prototype, "required", void 0);
    __decorate$h([
        n$1({ reflect: true })
    ], VscodeMultiSelect.prototype, "name", void 0);
    __decorate$h([
        n$1({ type: Array, attribute: false })
    ], VscodeMultiSelect.prototype, "selectedIndexes", null);
    __decorate$h([
        n$1({ type: Array })
    ], VscodeMultiSelect.prototype, "value", null);
    __decorate$h([
        e$3('.face')
    ], VscodeMultiSelect.prototype, "_faceElement", void 0);
    VscodeMultiSelect = __decorate$h([
        customElement('vscode-multi-select')
    ], VscodeMultiSelect);

    const styles$f = [
        defaultStyles,
        i$4 `
    :host {
      align-items: center;
      display: block;
      height: 28px;
      margin: 0;
      outline: none;
      width: 28px;
    }

    .progress {
      height: 100%;
      width: 100%;
    }

    .background {
      fill: none;
      stroke: transparent;
      stroke-width: 2px;
    }

    .indeterminate-indicator-1 {
      fill: none;
      stroke: var(--vscode-progressBar-background, #0078d4);
      stroke-width: 2px;
      stroke-linecap: square;
      transform-origin: 50% 50%;
      transform: rotate(-90deg);
      transition: all 0.2s ease-in-out;
      animation: spin-infinite 2s linear infinite;
    }

    @keyframes spin-infinite {
      0% {
        stroke-dasharray: 0.01px 43.97px;
        transform: rotate(0deg);
      }
      50% {
        stroke-dasharray: 21.99px 21.99px;
        transform: rotate(450deg);
      }
      100% {
        stroke-dasharray: 0.01px 43.97px;
        transform: rotate(1080deg);
      }
    }
  `,
    ];

    var __decorate$g = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-progress-ring
     *
     * @cssprop [--vscode-progressBar-background=#0078d4]
     */
    let VscodeProgressRing = class VscodeProgressRing extends VscElement {
        constructor() {
            super(...arguments);
            this.ariaLabel = 'Loading';
            this.ariaLive = 'assertive';
            this.role = 'alert';
        }
        render() {
            return x `<svg class="progress" part="progress" viewBox="0 0 16 16">
      <circle
        class="background"
        part="background"
        cx="8px"
        cy="8px"
        r="7px"
      ></circle>
      <circle
        class="indeterminate-indicator-1"
        part="indeterminate-indicator-1"
        cx="8px"
        cy="8px"
        r="7px"
      ></circle>
    </svg>`;
        }
    };
    VscodeProgressRing.styles = styles$f;
    __decorate$g([
        n$1({ reflect: true, attribute: 'aria-label' })
    ], VscodeProgressRing.prototype, "ariaLabel", void 0);
    __decorate$g([
        n$1({ reflect: true, attribute: 'aria-live' })
    ], VscodeProgressRing.prototype, "ariaLive", void 0);
    __decorate$g([
        n$1({ reflect: true })
    ], VscodeProgressRing.prototype, "role", void 0);
    VscodeProgressRing = __decorate$g([
        customElement('vscode-progress-ring')
    ], VscodeProgressRing);

    const styles$e = [
        defaultStyles,
        baseStyles,
        i$4 `
    :host(:invalid) .icon,
    :host([invalid]) .icon {
      background-color: var(--vscode-inputValidation-errorBackground, #5a1d1d);
      border-color: var(--vscode-inputValidation-errorBorder, #be1100);
    }

    .icon {
      border-radius: 9px;
    }

    .icon.checked:before {
      background-color: currentColor;
      border-radius: 4px;
      content: '';
      height: 8px;
      left: 50%;
      margin: -4px 0 0 -4px;
      position: absolute;
      top: 50%;
      width: 8px;
    }

    :host(:focus):host(:not([disabled])) .icon {
      outline: 1px solid var(--vscode-focusBorder, #0078d4);
      outline-offset: -1px;
    }
  `,
    ];

    var __decorate$f = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * When participating in a form, it supports the `:invalid` pseudo class. Otherwise the error styles
     * can be applied through the `invalid` property.
     *
     * @tag vscode-radio
     *
     * @attr name - Name which is used as a variable name in the data of the form-container.
     * @attr label - Attribute pair of the `label` property.
     *
     * @prop label - Label text. It is only applied if component's innerHTML doesn't contain any text.
     *
     * @fires {Event} change - Dispatched when checked state is changed.
     * @fires {Event} invalid - Dispatched when the element is invalid and `checkValidity()` has been called or the form containing this element is submitted.
     *
     * [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/invalid_event)
     *
     * @cssprop [--vscode-font-family=sans-serif]
     * @cssprop [--vscode-font-size=13px]
     * @cssprop [--vscode-font-weight=normal]
     * @cssprop [--vscode-settings-checkboxBackground=#313131]
     * @cssprop [--vscode-settings-checkboxBorder=#3c3c3c]
     * @cssprop [--vscode-settings-checkboxForeground=#cccccc]
     * @cssprop [--vscode-focusBorder=#0078d4]
     * @cssprop [--vscode-inputValidation-errorBackground=#5a1d1d]
     * @cssprop [--vscode-inputValidation-errorBorder=#be1100]
     */
    let VscodeRadio = class VscodeRadio extends LabelledCheckboxOrRadioMixin(FormButtonWidgetBase) {
        constructor() {
            super();
            this.autofocus = false;
            this.checked = false;
            this.defaultChecked = false;
            this.invalid = false;
            /**
             * Name which is used as a variable name in the data of the form-container.
             */
            this.name = '';
            this.value = '';
            this.disabled = false;
            this.required = false;
            /** @internal */
            this.role = 'radio';
            /** @internal */
            this.tabIndex = 0;
            this._slottedText = '';
            /** @internal */
            this.type = 'radio';
            this._handleClick = () => {
                if (this.disabled) {
                    return;
                }
                if (!this.checked) {
                    this._checkButton();
                    this._handleValueChange();
                    this._dispatchCustomEvent();
                    this.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };
            this._handleKeyDown = (ev) => {
                if (!this.disabled && (ev.key === 'Enter' || ev.key === ' ')) {
                    ev.preventDefault();
                    if (ev.key === ' ' && !this.checked) {
                        this.checked = true;
                        this._handleValueChange();
                        this._dispatchCustomEvent();
                        this.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    if (ev.key === 'Enter') {
                        this._internals.form?.requestSubmit();
                    }
                }
            };
            this._internals = this.attachInternals();
        }
        connectedCallback() {
            super.connectedCallback();
            this.addEventListener('keydown', this._handleKeyDown);
            this.addEventListener('click', this._handleClick);
            this._handleValueChange();
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            this.removeEventListener('keydown', this._handleKeyDown);
            this.removeEventListener('click', this._handleClick);
        }
        update(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        changedProperties) {
            super.update(changedProperties);
            if (changedProperties.has('checked')) {
                this._handleValueChange();
            }
            if (changedProperties.has('required')) {
                this._handleValueChange();
            }
        }
        get form() {
            return this._internals.form;
        }
        get validity() {
            return this._internals.validity;
        }
        get validationMessage() {
            return this._internals.validationMessage;
        }
        get willValidate() {
            return this._internals.willValidate;
        }
        checkValidity() {
            return this._internals.checkValidity();
        }
        reportValidity() {
            return this._internals.reportValidity();
        }
        /** @internal */
        formResetCallback() {
            const radios = this._getRadios();
            radios.forEach((r) => {
                r.checked = r.defaultChecked;
            });
            this.updateComplete.then(() => {
                this._handleValueChange();
            });
        }
        /** @internal */
        formStateRestoreCallback(state, _mode) {
            if (this.value === state && state !== '') {
                this.checked = true;
            }
        }
        _dispatchCustomEvent() {
            /** @deprecated - Use the native `change` event instead. */
            this.dispatchEvent(new CustomEvent('vsc-change', {
                detail: {
                    checked: this.checked,
                    label: this.label,
                    value: this.value,
                },
                bubbles: true,
                composed: true,
            }));
        }
        _getRadios() {
            const root = this.getRootNode({ composed: true });
            if (!root) {
                return [];
            }
            const radios = root.querySelectorAll(`vscode-radio[name="${this.name}"]`);
            return Array.from(radios);
        }
        _uncheckOthers(radios) {
            radios.forEach((r) => {
                if (r !== this) {
                    r.checked = false;
                }
            });
        }
        _checkButton() {
            const radios = this._getRadios();
            this.checked = true;
            radios.forEach((r) => {
                if (r !== this) {
                    r.checked = false;
                }
            });
        }
        /**
         * @internal
         */
        setComponentValidity(isValid) {
            if (isValid) {
                this._internals.setValidity({});
            }
            else {
                this._internals.setValidity({
                    valueMissing: true,
                }, 'Please select one of these options.', this._inputEl);
            }
        }
        _setGroupValidity(radios, isValid) {
            this.updateComplete.then(() => {
                radios.forEach((r) => {
                    r.setComponentValidity(isValid);
                });
            });
        }
        _setActualFormValue() {
            let actualValue = '';
            if (this.checked) {
                actualValue = !this.value ? 'on' : this.value;
            }
            else {
                actualValue = null;
            }
            this._internals.setFormValue(actualValue);
        }
        _handleValueChange() {
            const radios = this._getRadios();
            const anyRequired = radios.some((r) => {
                return r.required;
            });
            this._setActualFormValue();
            if (this.checked) {
                this._uncheckOthers(radios);
                this._setGroupValidity(radios, true);
            }
            else {
                const anyChecked = !!radios.find((r) => r.checked);
                const isInvalid = anyRequired && !anyChecked;
                this._setGroupValidity(radios, !isInvalid);
            }
        }
        render() {
            const iconClasses = e({
                icon: true,
                checked: this.checked,
            });
            const labelInnerClasses = e({
                'label-inner': true,
                'is-slot-empty': this._slottedText === '',
            });
            return x `
      <div class="wrapper">
        <input
          ?autofocus=${this.autofocus}
          id="input"
          class="radio"
          type="checkbox"
          ?checked=${this.checked}
          value=${this.value}
          tabindex=${this.tabIndex}
        >
        <div class=${iconClasses}></div>
        <label for="input" class="label" @click=${this._handleClick}>
          <span class=${labelInnerClasses}>
            ${this._renderLabelAttribute()}
            <slot @slotchange=${this._handleSlotChange}></slot>
          </span>
        </label>
      </div>
    `;
        }
    };
    VscodeRadio.styles = styles$e;
    /** @internal */
    VscodeRadio.formAssociated = true;
    /** @internal */
    VscodeRadio.shadowRootOptions = {
        ...i$1.shadowRootOptions,
        delegatesFocus: true,
    };
    __decorate$f([
        n$1({ type: Boolean, reflect: true })
    ], VscodeRadio.prototype, "autofocus", void 0);
    __decorate$f([
        n$1({ type: Boolean, reflect: true })
    ], VscodeRadio.prototype, "checked", void 0);
    __decorate$f([
        n$1({ type: Boolean, reflect: true, attribute: 'default-checked' })
    ], VscodeRadio.prototype, "defaultChecked", void 0);
    __decorate$f([
        n$1({ type: Boolean, reflect: true })
    ], VscodeRadio.prototype, "invalid", void 0);
    __decorate$f([
        n$1({ reflect: true })
    ], VscodeRadio.prototype, "name", void 0);
    __decorate$f([
        n$1()
    ], VscodeRadio.prototype, "value", void 0);
    __decorate$f([
        n$1({ type: Boolean, reflect: true })
    ], VscodeRadio.prototype, "disabled", void 0);
    __decorate$f([
        n$1({ type: Boolean, reflect: true })
    ], VscodeRadio.prototype, "required", void 0);
    __decorate$f([
        n$1({ reflect: true })
    ], VscodeRadio.prototype, "role", void 0);
    __decorate$f([
        n$1({ type: Number, reflect: true })
    ], VscodeRadio.prototype, "tabIndex", void 0);
    __decorate$f([
        r$2()
    ], VscodeRadio.prototype, "_slottedText", void 0);
    __decorate$f([
        e$3('#input')
    ], VscodeRadio.prototype, "_inputEl", void 0);
    __decorate$f([
        n$1()
    ], VscodeRadio.prototype, "type", void 0);
    VscodeRadio = __decorate$f([
        customElement('vscode-radio')
    ], VscodeRadio);

    var __decorate$e = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Allows to select an item from multiple options.
     *
     * When participating in a form, it supports the `:invalid` pseudo class. Otherwise the error styles
     * can be applied through the `invalid` property.
     *
     * @tag vscode-single-select
     *
     * ## Types
     *
     * ```typescript
     *interface Option {
     *  label: string;
     *  value: string;
     *  description: string;
     *  selected: boolean;
     *  disabled: boolean;
     *}
     * ```
     * @prop {boolean} invalid
     * @attr {boolean} invalid
     * @attr name - Name which is used as a variable name in the data of the form-container.
     *
     * @cssprop [--dropdown-z-index=2]
     * @cssprop [--vscode-badge-background=#616161]
     * @cssprop [--vscode-badge-foreground=#f8f8f8]
     * @cssprop [--vscode-settings-dropdownBorder=#3c3c3c]
     * @cssprop [--vscode-settings-checkboxBackground=#313131]
     * @cssprop [--vscode-settings-dropdownBackground=#313131]
     * @cssprop [--vscode-settings-dropdownForeground=#cccccc]
     * @cssprop [--vscode-settings-dropdownListBorder=#454545]
     * @cssprop [--vscode-focusBorder=#0078d4]
     * @cssprop [--vscode-foreground=#cccccc]
     * @cssprop [--vscode-font-family=sans-serif]
     * @cssprop [--vscode-font-size=13px]
     * @cssprop [--vscode-font-weight=normal]
     * @cssprop [--vscode-inputValidation-errorBackground=#5a1d1d]
     * @cssprop [--vscode-inputValidation-errorBorder=#be1100]
     * @cssprop [--vscode-list-activeSelectionBackground=#04395e]
     * @cssprop [--vscode-list-activeSelectionForeground=#ffffff]
     * @cssprop [--vscode-list-focusOutline=#0078d4]
     * @cssprop [--vscode-list-focusHighlightForeground=#2aaaff]
     * @cssprop [--vscode-list-highlightForeground=#2aaaff]
     * @cssprop [--vscode-list-hoverBackground=#2a2d2e]
     * @cssprop [--vscode-list-hoverForeground=#ffffff]
     */
    let VscodeSingleSelect = class VscodeSingleSelect extends VscodeSelectBase {
        set selectedIndex(val) {
            this._selectedIndex = val;
            if (this._options[val]) {
                this._activeIndex = val;
                this._value = this._options[val].value;
                this._internals.setFormValue(this._value);
                this._manageRequired();
            }
            else {
                this._value = '';
                this._internals.setFormValue('');
                this._manageRequired();
            }
        }
        get selectedIndex() {
            return this._selectedIndex;
        }
        set value(val) {
            if (this._options[this._selectedIndex]) {
                this._options[this._selectedIndex].selected = false;
            }
            this._selectedIndex = this._options.findIndex((op) => op.value === val);
            if (this._selectedIndex > -1) {
                this._options[this._selectedIndex].selected = true;
                this._value = val;
                this._requestedValueToSetLater = '';
            }
            else {
                this._value = '';
                this._requestedValueToSetLater = val;
            }
            this._internals.setFormValue(this._value);
            this._manageRequired();
        }
        get value() {
            if (this._options[this._selectedIndex]) {
                return this._options[this._selectedIndex]?.value ?? '';
            }
            return '';
        }
        get validity() {
            return this._internals.validity;
        }
        get validationMessage() {
            return this._internals.validationMessage;
        }
        get willValidate() {
            return this._internals.willValidate;
        }
        checkValidity() {
            return this._internals.checkValidity();
        }
        reportValidity() {
            return this._internals.reportValidity();
        }
        updateInputValue() {
            if (!this.combobox) {
                return;
            }
            const input = this.renderRoot.querySelector('.combobox-input');
            if (input) {
                input.value = this._options[this._selectedIndex]
                    ? this._options[this._selectedIndex].label
                    : '';
            }
        }
        constructor() {
            super();
            this.defaultValue = '';
            /** @internal */
            this.role = 'listbox';
            this.name = undefined;
            this.required = false;
            /**
             * This variable was introduced for cases where the value is set before the corresponding option
             * exists. This can happen while a framework like Vue or React is rendering the component.
             */
            this._requestedValueToSetLater = '';
            /** @internal */
            this._multiple = false;
            this._internals = this.attachInternals();
        }
        connectedCallback() {
            super.connectedCallback();
            this.updateComplete.then(() => {
                this._manageRequired();
            });
        }
        /** @internal */
        formResetCallback() {
            this.value = this.defaultValue;
        }
        /** @internal */
        formStateRestoreCallback(state, _mode) {
            this.updateComplete.then(() => {
                this.value = state;
            });
        }
        /** @internal */
        get type() {
            return 'select-one';
        }
        get form() {
            return this._internals.form;
        }
        async _createAndSelectSuggestedOption() {
            const nextIndex = this._createSuggestedOption();
            await this.updateComplete;
            this.selectedIndex = nextIndex;
            this._dispatchChangeEvent();
            const opCreateEvent = new CustomEvent('vsc-single-select-create-option', { detail: { value: this._options[nextIndex]?.value ?? '' } });
            this.dispatchEvent(opCreateEvent);
            this._toggleDropdown(false);
            this._isPlaceholderOptionActive = false;
        }
        _onSlotChange() {
            super._onSlotChange();
            if (this._requestedValueToSetLater) {
                // the value is set before the available options are appended
                const foundIndex = this._options.findIndex((op) => op.value === this._requestedValueToSetLater);
                if (foundIndex > 0) {
                    this._selectedIndex = foundIndex;
                    this._requestedValueToSetLater = '';
                }
            }
            if (this._selectedIndex > -1 && this._options.length > 0) {
                this._internals.setFormValue(this._options[this._selectedIndex].value);
                this._manageRequired();
            }
            else {
                this._internals.setFormValue(null);
                this._manageRequired();
            }
        }
        _onArrowUpKeyDown() {
            super._onArrowUpKeyDown();
            if (this.open || this._selectedIndex <= 0) {
                return;
            }
            const options = this.combobox ? this._filteredOptions : this._options;
            const prevIndex = findPrevSelectableOptionIndex(options, this._activeIndex);
            this._filterPattern = '';
            this._selectedIndex = prevIndex;
            this._activeIndex = prevIndex;
            this._value = prevIndex > -1 ? this._options[prevIndex].value : '';
            this._internals.setFormValue(this._value);
            this._manageRequired();
            this._dispatchChangeEvent();
        }
        _onArrowDownKeyDown() {
            super._onArrowDownKeyDown();
            if (this.open || this._selectedIndex >= this._options.length - 1) {
                return;
            }
            const options = this.combobox ? this._filteredOptions : this._options;
            const nextIndex = findNextSelectableOptionIndex(options, this._activeIndex);
            this._filterPattern = '';
            this._selectedIndex = nextIndex;
            this._activeIndex = nextIndex;
            this._value = nextIndex > -1 ? this._options[nextIndex].value : '';
            this._internals.setFormValue(this._value);
            this._manageRequired();
            this._dispatchChangeEvent();
        }
        _onEnterKeyDown(ev) {
            super._onEnterKeyDown(ev);
            this.updateInputValue();
            this._internals.setFormValue(this._value);
            this._manageRequired();
        }
        _onOptionClick(ev) {
            super._onOptionClick(ev);
            const composedPath = ev.composedPath();
            const optEl = composedPath.find((et) => {
                const el = et;
                if ('matches' in el) {
                    return el.matches('li.option');
                }
                return;
            });
            if (!optEl || optEl.matches('.disabled')) {
                return;
            }
            const isPlaceholderOption = optEl.classList.contains('placeholder');
            if (isPlaceholderOption) {
                if (this.creatable) {
                    this._createAndSelectSuggestedOption();
                }
            }
            else {
                this._selectedIndex = Number(optEl.dataset.index);
                this._value = this._options[this._selectedIndex].value;
                this._toggleDropdown(false);
                this._internals.setFormValue(this._value);
                this._manageRequired();
                this._dispatchChangeEvent();
            }
        }
        _manageRequired() {
            const { value } = this;
            if (value === '' && this.required) {
                this._internals.setValidity({ valueMissing: true }, 'Please select an item in the list.', this._face);
            }
            else {
                this._internals.setValidity({});
            }
        }
        _renderSelectFace() {
            const label = this._options[this._selectedIndex]?.label ?? '';
            return x `
      <div
        class="select-face face"
        @click=${this._onFaceClick}
        tabindex=${this.tabIndex > -1 ? 0 : -1}
      >
        <span class="text">${label}</span> ${chevronDownIcon}
      </div>
    `;
        }
    };
    VscodeSingleSelect.styles = styles$g;
    /** @internal */
    VscodeSingleSelect.shadowRootOptions = {
        ...i$1.shadowRootOptions,
        delegatesFocus: true,
    };
    /** @internal */
    VscodeSingleSelect.formAssociated = true;
    __decorate$e([
        n$1({ attribute: 'default-value' })
    ], VscodeSingleSelect.prototype, "defaultValue", void 0);
    __decorate$e([
        n$1({ type: String, attribute: true, reflect: true })
    ], VscodeSingleSelect.prototype, "role", void 0);
    __decorate$e([
        n$1({ reflect: true })
    ], VscodeSingleSelect.prototype, "name", void 0);
    __decorate$e([
        n$1({ type: Number, attribute: 'selected-index' })
    ], VscodeSingleSelect.prototype, "selectedIndex", null);
    __decorate$e([
        n$1({ type: String })
    ], VscodeSingleSelect.prototype, "value", null);
    __decorate$e([
        n$1({ type: Boolean, reflect: true })
    ], VscodeSingleSelect.prototype, "required", void 0);
    __decorate$e([
        e$3('.face')
    ], VscodeSingleSelect.prototype, "_face", void 0);
    VscodeSingleSelect = __decorate$e([
        customElement('vscode-single-select')
    ], VscodeSingleSelect);

    const styles$d = [
        defaultStyles,
        i$4 `
    :host {
      display: block;
      position: relative;
    }

    .scrollable-container {
      height: 100%;
      overflow: auto;
    }

    .scrollable-container::-webkit-scrollbar {
      cursor: default;
      width: 0;
    }

    .scrollable-container {
      scrollbar-width: none;
    }

    .shadow {
      box-shadow: var(--vscode-scrollbar-shadow, #000000) 0 6px 6px -6px inset;
      display: none;
      height: 3px;
      left: 0;
      pointer-events: none;
      position: absolute;
      top: 0;
      z-index: 1;
      width: 100%;
    }

    .shadow.visible {
      display: block;
    }

    .scrollbar-track {
      height: 100%;
      position: absolute;
      right: 0;
      top: 0;
      width: 10px;
      z-index: 100;
    }

    .scrollbar-track.hidden {
      display: none;
    }

    .scrollbar-thumb {
      background-color: transparent;
      min-height: var(--min-thumb-height, 20px);
      opacity: 0;
      position: absolute;
      right: 0;
      width: 10px;
    }

    .scrollbar-thumb.visible {
      background-color: var(
        --vscode-scrollbarSlider-background,
        rgba(121, 121, 121, 0.4)
      );
      opacity: 1;
      transition: opacity 100ms;
    }

    .scrollbar-thumb.fade {
      background-color: var(
        --vscode-scrollbarSlider-background,
        rgba(121, 121, 121, 0.4)
      );
      opacity: 0;
      transition: opacity 800ms;
    }

    .scrollbar-thumb.visible:hover {
      background-color: var(
        --vscode-scrollbarSlider-hoverBackground,
        rgba(100, 100, 100, 0.7)
      );
    }

    .scrollbar-thumb.visible.active,
    .scrollbar-thumb.visible.active:hover {
      background-color: var(
        --vscode-scrollbarSlider-activeBackground,
        rgba(191, 191, 191, 0.4)
      );
    }

    .prevent-interaction {
      bottom: 0;
      left: 0;
      right: 0;
      top: 0;
      position: absolute;
      z-index: 99;
    }

    .content {
      overflow: hidden;
    }
  `,
    ];

    var __decorate$d = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-scrollable
     *
     * @cssprop [--min-thumb-height=20px] - Scrollbar thumb minimum height
     * @cssprop [--vscode-scrollbar-shadow=#000000]
     * @cssprop [--vscode-scrollbarSlider-background=rgba(121, 121, 121, 0.4)]
     * @cssprop [--vscode-scrollbarSlider-hoverBackground=rgba(100, 100, 100, 0.7)]
     * @cssprop [--vscode-scrollbarSlider-activeBackground=rgba(191, 191, 191, 0.4)]
     */
    let VscodeScrollable = class VscodeScrollable extends VscElement {
        constructor() {
            super(...arguments);
            this.shadow = true;
            this.scrolled = false;
            this._isDragging = false;
            this._thumbHeight = 0;
            this._thumbY = 0;
            this._thumbVisible = false;
            this._thumbFade = false;
            this._thumbActive = false;
            this._scrollThumbStartY = 0;
            this._mouseStartY = 0;
            this._scrollbarVisible = true;
            this._scrollbarTrackZ = 0;
            this._resizeObserverCallback = () => {
                this._updateScrollbar();
            };
            this._onSlotChange = () => {
                this._zIndexFix();
            };
            this._onScrollThumbMouseMoveBound = this._onScrollThumbMouseMove.bind(this);
            this._onScrollThumbMouseUpBound = this._onScrollThumbMouseUp.bind(this);
            this._onComponentMouseOverBound = this._onComponentMouseOver.bind(this);
            this._onComponentMouseOutBound = this._onComponentMouseOut.bind(this);
        }
        set scrollPos(val) {
            this._scrollableContainer.scrollTop = val;
        }
        get scrollPos() {
            if (!this._scrollableContainer) {
                return 0;
            }
            return this._scrollableContainer.scrollTop;
        }
        get scrollMax() {
            if (!this._scrollableContainer) {
                return 0;
            }
            return this._scrollableContainer.scrollHeight;
        }
        connectedCallback() {
            super.connectedCallback();
            this._hostResizeObserver = new ResizeObserver(this._resizeObserverCallback);
            this._contentResizeObserver = new ResizeObserver(this._resizeObserverCallback);
            this.requestUpdate();
            this.updateComplete.then(() => {
                this._scrollableContainer.addEventListener('scroll', this._onScrollableContainerScroll.bind(this));
                this._hostResizeObserver.observe(this);
                this._contentResizeObserver.observe(this._contentElement);
            });
            this.addEventListener('mouseover', this._onComponentMouseOverBound);
            this.addEventListener('mouseout', this._onComponentMouseOutBound);
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            this._hostResizeObserver.unobserve(this);
            this._hostResizeObserver.disconnect();
            this._contentResizeObserver.unobserve(this._contentElement);
            this._contentResizeObserver.disconnect();
            this.removeEventListener('mouseover', this._onComponentMouseOverBound);
            this.removeEventListener('mouseout', this._onComponentMouseOutBound);
        }
        _updateScrollbar() {
            const compCr = this.getBoundingClientRect();
            const contentCr = this._contentElement.getBoundingClientRect();
            if (compCr.height >= contentCr.height) {
                this._scrollbarVisible = false;
            }
            else {
                this._scrollbarVisible = true;
                this._thumbHeight = compCr.height * (compCr.height / contentCr.height);
            }
            this.requestUpdate();
        }
        _zIndexFix() {
            let highestZ = 0;
            this._assignedElements.forEach((n) => {
                if ('style' in n) {
                    const computedZIndex = window.getComputedStyle(n).zIndex;
                    const isNumber = /([0-9-])+/g.test(computedZIndex);
                    if (isNumber) {
                        highestZ =
                            Number(computedZIndex) > highestZ
                                ? Number(computedZIndex)
                                : highestZ;
                    }
                }
            });
            this._scrollbarTrackZ = highestZ + 1;
            this.requestUpdate();
        }
        _onScrollThumbMouseDown(event) {
            const cmpCr = this.getBoundingClientRect();
            const thCr = this._scrollThumbElement.getBoundingClientRect();
            this._mouseStartY = event.screenY;
            this._scrollThumbStartY = thCr.top - cmpCr.top;
            this._isDragging = true;
            this._thumbActive = true;
            document.addEventListener('mousemove', this._onScrollThumbMouseMoveBound);
            document.addEventListener('mouseup', this._onScrollThumbMouseUpBound);
        }
        _onScrollThumbMouseMove(event) {
            const predictedPos = this._scrollThumbStartY + (event.screenY - this._mouseStartY);
            let nextPos = 0;
            const cmpH = this.getBoundingClientRect().height;
            const thumbH = this._scrollThumbElement.getBoundingClientRect().height;
            const contentH = this._contentElement.getBoundingClientRect().height;
            if (predictedPos < 0) {
                nextPos = 0;
            }
            else if (predictedPos > cmpH - thumbH) {
                nextPos = cmpH - thumbH;
            }
            else {
                nextPos = predictedPos;
            }
            this._thumbY = nextPos;
            this._scrollableContainer.scrollTop =
                (nextPos / (cmpH - thumbH)) * (contentH - cmpH);
        }
        _onScrollThumbMouseUp(event) {
            this._isDragging = false;
            this._thumbActive = false;
            const cr = this.getBoundingClientRect();
            const { x, y, width, height } = cr;
            const { pageX, pageY } = event;
            if (pageX > x + width || pageX < x || pageY > y + height || pageY < y) {
                this._thumbFade = true;
                this._thumbVisible = false;
            }
            document.removeEventListener('mousemove', this._onScrollThumbMouseMoveBound);
            document.removeEventListener('mouseup', this._onScrollThumbMouseUpBound);
        }
        _onScrollableContainerScroll() {
            const scrollTop = this._scrollableContainer.scrollTop;
            this.scrolled = scrollTop > 0;
            const cmpH = this.getBoundingClientRect().height;
            const thumbH = this._scrollThumbElement.getBoundingClientRect().height;
            const contentH = this._contentElement.getBoundingClientRect().height;
            const overflown = contentH - cmpH;
            const ratio = scrollTop / overflown;
            this._thumbY = ratio * (cmpH - thumbH);
        }
        _onComponentMouseOver() {
            this._thumbVisible = true;
            this._thumbFade = false;
        }
        _onComponentMouseOut() {
            if (!this._thumbActive) {
                this._thumbVisible = false;
                this._thumbFade = true;
            }
        }
        render() {
            return x `
      <div
        class="scrollable-container"
        .style=${stylePropertyMap({
            userSelect: this._isDragging ? 'none' : 'auto',
        })}
      >
        <div
          class=${e({ shadow: true, visible: this.scrolled })}
          .style=${stylePropertyMap({
            zIndex: String(this._scrollbarTrackZ),
        })}
        ></div>
        ${this._isDragging
            ? x `<div class="prevent-interaction"></div>`
            : E}
        <div
          class=${e({
            'scrollbar-track': true,
            hidden: !this._scrollbarVisible,
        })}
        >
          <div
            class=${e({
            'scrollbar-thumb': true,
            visible: this._thumbVisible,
            fade: this._thumbFade,
            active: this._thumbActive,
        })}
            .style=${stylePropertyMap({
            height: `${this._thumbHeight}px`,
            top: `${this._thumbY}px`,
        })}
            @mousedown=${this._onScrollThumbMouseDown}
          ></div>
        </div>
        <div class="content">
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `;
        }
    };
    VscodeScrollable.styles = styles$d;
    __decorate$d([
        n$1({ type: Boolean, reflect: true })
    ], VscodeScrollable.prototype, "shadow", void 0);
    __decorate$d([
        n$1({ type: Boolean, reflect: true })
    ], VscodeScrollable.prototype, "scrolled", void 0);
    __decorate$d([
        n$1({ type: Number, attribute: 'scroll-pos' })
    ], VscodeScrollable.prototype, "scrollPos", null);
    __decorate$d([
        n$1({ type: Number, attribute: 'scroll-max' })
    ], VscodeScrollable.prototype, "scrollMax", null);
    __decorate$d([
        r$2()
    ], VscodeScrollable.prototype, "_isDragging", void 0);
    __decorate$d([
        r$2()
    ], VscodeScrollable.prototype, "_thumbHeight", void 0);
    __decorate$d([
        r$2()
    ], VscodeScrollable.prototype, "_thumbY", void 0);
    __decorate$d([
        r$2()
    ], VscodeScrollable.prototype, "_thumbVisible", void 0);
    __decorate$d([
        r$2()
    ], VscodeScrollable.prototype, "_thumbFade", void 0);
    __decorate$d([
        r$2()
    ], VscodeScrollable.prototype, "_thumbActive", void 0);
    __decorate$d([
        e$3('.content')
    ], VscodeScrollable.prototype, "_contentElement", void 0);
    __decorate$d([
        e$3('.scrollbar-thumb', true)
    ], VscodeScrollable.prototype, "_scrollThumbElement", void 0);
    __decorate$d([
        e$3('.scrollable-container')
    ], VscodeScrollable.prototype, "_scrollableContainer", void 0);
    __decorate$d([
        o$1()
    ], VscodeScrollable.prototype, "_assignedElements", void 0);
    VscodeScrollable = __decorate$d([
        customElement('vscode-scrollable')
    ], VscodeScrollable);

    const styles$c = [
        defaultStyles,
        i$4 `
    :host {
      --separator-border: var(--vscode-editorWidget-border, #454545);

      border: 1px solid var(--vscode-editorWidget-border, #454545);
      display: block;
      overflow: hidden;
      position: relative;
    }

    ::slotted(*) {
      height: 100%;
      width: 100%;
    }

    ::slotted(vscode-split-layout) {
      border: 0;
    }

    .wrapper {
      display: flex;
      height: 100%;
      width: 100%;
    }

    .wrapper.horizontal {
      flex-direction: column;
    }

    .start {
      box-sizing: border-box;
      flex: 1;
      min-height: 0;
      min-width: 0;
    }

    :host([split='vertical']) .start {
      border-right: 1px solid var(--separator-border);
    }

    :host([split='horizontal']) .start {
      border-bottom: 1px solid var(--separator-border);
    }

    .end {
      flex: 1;
      min-height: 0;
      min-width: 0;
    }

    :host([split='vertical']) .start,
    :host([split='vertical']) .end {
      height: 100%;
    }

    :host([split='horizontal']) .start,
    :host([split='horizontal']) .end {
      width: 100%;
    }

    .handle-overlay {
      display: none;
      height: 100%;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
      z-index: 1;
    }

    .handle-overlay.active {
      display: block;
    }

    .handle-overlay.split-vertical {
      cursor: ew-resize;
    }

    .handle-overlay.split-horizontal {
      cursor: ns-resize;
    }

    .handle {
      background-color: transparent;
      position: absolute;
      z-index: 2;
    }

    .handle.hover {
      transition: background-color 0.1s ease-out 0.3s;
      background-color: var(--vscode-sash-hoverBorder, #0078d4);
    }

    .handle.hide {
      background-color: transparent;
      transition: background-color 0.1s ease-out;
    }

    .handle.split-vertical {
      cursor: ew-resize;
      height: 100%;
    }

    .handle.split-horizontal {
      cursor: ns-resize;
      width: 100%;
    }
  `,
    ];

    var __decorate$c = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var VscodeSplitLayout_1;
    const DEFAULT_INITIAL_POSITION = '50%';
    const DEFAULT_HANDLE_SIZE = 4;
    const parseValue = (raw) => {
        if (!raw) {
            return { value: 0, unit: 'pixel' };
        }
        let unit;
        let rawVal;
        if (raw.endsWith('%')) {
            unit = 'percent';
            rawVal = +raw.substring(0, raw.length - 1);
        }
        else if (raw.endsWith('px')) {
            unit = 'pixel';
            rawVal = +raw.substring(0, raw.length - 2);
        }
        else {
            unit = 'pixel';
            rawVal = +raw;
        }
        const value = isNaN(rawVal) ? 0 : rawVal;
        return { unit, value };
    };
    // Returns a percentage between 0 and 100
    const pxToPercent = (current, max) => {
        return max === 0 ? 0 : Math.min(100, (current / max) * 100);
    };
    const percentToPx = (current, max) => {
        return max * (current / 100);
    };
    /**
     * @tag vscode-split-layout
     *
     * @prop {'start' | 'end' | 'none'} fixedPane
     *
     * @cssprop [--separator-border=#454545]
     * @cssprop [--vscode-editorWidget-border=#454545]
     * @cssprop [--vscode-sash-hoverBorder=#0078d4]
     */
    let VscodeSplitLayout = VscodeSplitLayout_1 = class VscodeSplitLayout extends VscElement {
        /**
         * Direction of the divider.
         */
        set split(newVal) {
            if (this._split === newVal) {
                return;
            }
            this._split = newVal;
            this.resetHandlePosition();
        }
        get split() {
            return this._split;
        }
        /**
         * Set the handle position programmatically. The value must include a unit,
         * either `%` or `px`. If no unit is specified, the value is interpreted as
         * `px`.
         */
        set handlePosition(newVal) {
            this._rawHandlePosition = newVal;
            this._handlePositionPropChanged();
        }
        get handlePosition() {
            return this._rawHandlePosition;
        }
        /**
         * The size of the fixed pane will not change when the component is resized.
         */
        set fixedPane(newVal) {
            this._fixedPane = newVal;
            this._fixedPanePropChanged();
        }
        get fixedPane() {
            return this._fixedPane;
        }
        constructor() {
            super();
            this._split = 'vertical';
            /**
             * Controls whether the handle position should reset to the value set in the
             * `initialHandlePosition` when it is double-clicked.
             */
            this.resetOnDblClick = false;
            /**
             * Controls the draggable area size in pixels. it is intended to use the value
             * of `workbench.sash.size`.
             */
            this.handleSize = 4;
            /**
             * The handler position will reset to this position when it is double-clicked,
             * or the `resetHandlePosition()` is called.
             */
            this.initialHandlePosition = DEFAULT_INITIAL_POSITION;
            this._fixedPane = 'none';
            this._handlePosition = 0;
            this._isDragActive = false;
            this._hover = false;
            this._hide = false;
            this._boundRect = new DOMRect();
            this._handleOffset = 0;
            this._wrapperObserved = false;
            this._fixedPaneSize = 0;
            this._handleResize = (entries) => {
                const rect = entries[0].contentRect;
                const { width, height } = rect;
                this._boundRect = rect;
                const max = this.split === 'vertical' ? width : height;
                if (this.fixedPane === 'start') {
                    this._handlePosition = this._fixedPaneSize;
                }
                if (this.fixedPane === 'end') {
                    this._handlePosition = max - this._fixedPaneSize;
                }
            };
            this._handleMouseUp = (ev) => {
                this._isDragActive = false;
                if (ev.target !== this) {
                    this._hover = false;
                    this._hide = true;
                }
                window.removeEventListener('mouseup', this._handleMouseUp);
                window.removeEventListener('mousemove', this._handleMouseMove);
                const { width, height } = this._boundRect;
                const max = this.split === 'vertical' ? width : height;
                const positionInPercentage = pxToPercent(this._handlePosition, max);
                this.dispatchEvent(new CustomEvent('vsc-split-layout-change', {
                    detail: {
                        position: this._handlePosition,
                        positionInPercentage,
                    },
                    composed: true,
                }));
            };
            this._handleMouseMove = (event) => {
                const { clientX, clientY } = event;
                const { left, top, height, width } = this._boundRect;
                const vert = this.split === 'vertical';
                const maxPos = vert ? width : height;
                const mousePos = vert ? clientX - left : clientY - top;
                this._handlePosition = Math.max(0, Math.min(mousePos - this._handleOffset + this.handleSize / 2, maxPos));
                if (this.fixedPane === 'start') {
                    this._fixedPaneSize = this._handlePosition;
                }
                if (this.fixedPane === 'end') {
                    this._fixedPaneSize = maxPos - this._handlePosition;
                }
            };
            this._resizeObserver = new ResizeObserver(this._handleResize);
        }
        /**
         * Sets the handle position to the value specified in the `initialHandlePosition` property.
         */
        resetHandlePosition() {
            if (!this._wrapperEl) {
                this._handlePosition = 0;
                return;
            }
            const { width, height } = this._wrapperEl.getBoundingClientRect();
            const max = this.split === 'vertical' ? width : height;
            const { value, unit } = parseValue(this.initialHandlePosition ?? DEFAULT_INITIAL_POSITION);
            if (unit === 'percent') {
                this._handlePosition = percentToPx(value, max);
            }
            else {
                this._handlePosition = value;
            }
        }
        connectedCallback() {
            super.connectedCallback();
        }
        firstUpdated(_changedProperties) {
            if (this.fixedPane !== 'none') {
                this._resizeObserver.observe(this._wrapperEl);
                this._wrapperObserved = true;
            }
            this._boundRect = this._wrapperEl.getBoundingClientRect();
            const { value, unit } = this.handlePosition
                ? parseValue(this.handlePosition)
                : parseValue(this.initialHandlePosition);
            this._setPosition(value, unit);
            this._initFixedPane();
        }
        _handlePositionPropChanged() {
            if (this.handlePosition && this._wrapperEl) {
                this._boundRect = this._wrapperEl.getBoundingClientRect();
                const { value, unit } = parseValue(this.handlePosition);
                this._setPosition(value, unit);
            }
        }
        _fixedPanePropChanged() {
            if (!this._wrapperEl) {
                return;
            }
            this._initFixedPane();
        }
        _initFixedPane() {
            if (this.fixedPane === 'none') {
                if (this._wrapperObserved) {
                    this._resizeObserver.unobserve(this._wrapperEl);
                    this._wrapperObserved = false;
                }
            }
            else {
                const { width, height } = this._boundRect;
                const max = this.split === 'vertical' ? width : height;
                this._fixedPaneSize =
                    this.fixedPane === 'start'
                        ? this._handlePosition
                        : max - this._handlePosition;
                if (!this._wrapperObserved) {
                    this._resizeObserver.observe(this._wrapperEl);
                    this._wrapperObserved = true;
                }
            }
        }
        _setPosition(value, unit) {
            const { width, height } = this._boundRect;
            const max = this.split === 'vertical' ? width : height;
            this._handlePosition = unit === 'percent' ? percentToPx(value, max) : value;
        }
        _handleMouseOver() {
            this._hover = true;
            this._hide = false;
        }
        _handleMouseOut(event) {
            if (event.buttons !== 1) {
                this._hover = false;
                this._hide = true;
            }
        }
        _handleMouseDown(event) {
            event.stopPropagation();
            event.preventDefault();
            this._boundRect = this._wrapperEl.getBoundingClientRect();
            const { left, top } = this._boundRect;
            const { left: handleLeft, top: handleTop } = this._handleEl.getBoundingClientRect();
            const mouseXLocal = event.clientX - left;
            const mouseYLocal = event.clientY - top;
            if (this.split === 'vertical') {
                this._handleOffset = mouseXLocal - (handleLeft - left);
            }
            if (this.split === 'horizontal') {
                this._handleOffset = mouseYLocal - (handleTop - top);
            }
            this._isDragActive = true;
            window.addEventListener('mouseup', this._handleMouseUp);
            window.addEventListener('mousemove', this._handleMouseMove);
        }
        _handleDblClick() {
            if (!this.resetOnDblClick) {
                return;
            }
            this.resetHandlePosition();
        }
        _handleSlotChange() {
            const nestedLayouts = [
                ...this._nestedLayoutsAtStart,
                ...this._nestedLayoutsAtEnd,
            ];
            nestedLayouts.forEach((e) => {
                if (e instanceof VscodeSplitLayout_1) {
                    e.resetHandlePosition();
                }
            });
        }
        render() {
            const { width, height } = this._boundRect;
            const maxPos = this.split === 'vertical' ? width : height;
            const handlePosCss = this.fixedPane !== 'none'
                ? `${this._handlePosition}px`
                : `${pxToPercent(this._handlePosition, maxPos)}%`;
            let startPaneSize = '';
            if (this.fixedPane === 'start') {
                startPaneSize = `0 0 ${this._fixedPaneSize}px`;
            }
            else {
                startPaneSize = `1 1 ${pxToPercent(this._handlePosition, maxPos)}%`;
            }
            let endPaneSize = '';
            if (this.fixedPane === 'end') {
                endPaneSize = `0 0 ${this._fixedPaneSize}px`;
            }
            else {
                endPaneSize = `1 1 ${pxToPercent(maxPos - this._handlePosition, maxPos)}%`;
            }
            const handleStylesPropObj = {
                left: this.split === 'vertical' ? handlePosCss : '0',
                top: this.split === 'vertical' ? '0' : handlePosCss,
            };
            const handleSize = this.handleSize ?? DEFAULT_HANDLE_SIZE;
            if (this.split === 'vertical') {
                handleStylesPropObj.marginLeft = `${0 - handleSize / 2}px`;
                handleStylesPropObj.width = `${handleSize}px`;
            }
            if (this.split === 'horizontal') {
                handleStylesPropObj.height = `${handleSize}px`;
                handleStylesPropObj.marginTop = `${0 - handleSize / 2}px`;
            }
            const handleOverlayClasses = e({
                'handle-overlay': true,
                active: this._isDragActive,
                'split-vertical': this.split === 'vertical',
                'split-horizontal': this.split === 'horizontal',
            });
            const handleClasses = e({
                handle: true,
                hover: this._hover,
                hide: this._hide,
                'split-vertical': this.split === 'vertical',
                'split-horizontal': this.split === 'horizontal',
            });
            const wrapperClasses = {
                wrapper: true,
                horizontal: this.split === 'horizontal',
            };
            return x `
      <div class=${e(wrapperClasses)}>
        <div class="start" .style=${stylePropertyMap({ flex: startPaneSize })}>
          <slot name="start" @slotchange=${this._handleSlotChange}></slot>
        </div>
        <div class="end" .style=${stylePropertyMap({ flex: endPaneSize })}>
          <slot name="end" @slotchange=${this._handleSlotChange}></slot>
        </div>
        <div class=${handleOverlayClasses}></div>
        <div
          class=${handleClasses}
          .style=${stylePropertyMap(handleStylesPropObj)}
          @mouseover=${this._handleMouseOver}
          @mouseout=${this._handleMouseOut}
          @mousedown=${this._handleMouseDown}
          @dblclick=${this._handleDblClick}
        ></div>
      </div>
    `;
        }
    };
    VscodeSplitLayout.styles = styles$c;
    __decorate$c([
        n$1({ reflect: true })
    ], VscodeSplitLayout.prototype, "split", null);
    __decorate$c([
        n$1({ type: Boolean, reflect: true, attribute: 'reset-on-dbl-click' })
    ], VscodeSplitLayout.prototype, "resetOnDblClick", void 0);
    __decorate$c([
        n$1({ type: Number, reflect: true, attribute: 'handle-size' })
    ], VscodeSplitLayout.prototype, "handleSize", void 0);
    __decorate$c([
        n$1({ reflect: true, attribute: 'initial-handle-position' })
    ], VscodeSplitLayout.prototype, "initialHandlePosition", void 0);
    __decorate$c([
        n$1({ attribute: 'handle-position' })
    ], VscodeSplitLayout.prototype, "handlePosition", null);
    __decorate$c([
        n$1({ attribute: 'fixed-pane' })
    ], VscodeSplitLayout.prototype, "fixedPane", null);
    __decorate$c([
        r$2()
    ], VscodeSplitLayout.prototype, "_handlePosition", void 0);
    __decorate$c([
        r$2()
    ], VscodeSplitLayout.prototype, "_isDragActive", void 0);
    __decorate$c([
        r$2()
    ], VscodeSplitLayout.prototype, "_hover", void 0);
    __decorate$c([
        r$2()
    ], VscodeSplitLayout.prototype, "_hide", void 0);
    __decorate$c([
        e$3('.wrapper')
    ], VscodeSplitLayout.prototype, "_wrapperEl", void 0);
    __decorate$c([
        e$3('.handle')
    ], VscodeSplitLayout.prototype, "_handleEl", void 0);
    __decorate$c([
        o$1({ slot: 'start', selector: 'vscode-split-layout' })
    ], VscodeSplitLayout.prototype, "_nestedLayoutsAtStart", void 0);
    __decorate$c([
        o$1({ slot: 'end', selector: 'vscode-split-layout' })
    ], VscodeSplitLayout.prototype, "_nestedLayoutsAtEnd", void 0);
    VscodeSplitLayout = VscodeSplitLayout_1 = __decorate$c([
        customElement('vscode-split-layout')
    ], VscodeSplitLayout);

    const styles$b = [
        defaultStyles,
        i$4 `
    :host {
      border-bottom: 1px solid transparent;
      cursor: pointer;
      display: block;
      margin-bottom: -1px;
      overflow: hidden;
      padding: 7px 8px;
      text-overflow: ellipsis;
      user-select: none;
      white-space: nowrap;
    }

    :host([active]) {
      border-bottom-color: var(--vscode-panelTitle-activeForeground);
      color: var(--vscode-panelTitle-activeForeground);
    }

    :host([panel]) {
      border-bottom: 0;
      margin-bottom: 0;
      padding: 0;
    }

    :host(:focus-visible) {
      outline: none;
    }

    .wrapper {
      align-items: center;
      color: var(--vscode-foreground);
      display: flex;
      min-height: 20px;
      overflow: inherit;
      text-overflow: inherit;
      position: relative;
    }

    .wrapper.panel {
      color: var(--vscode-panelTitle-inactiveForeground);
    }

    .wrapper.panel.active,
    .wrapper.panel:hover {
      color: var(--vscode-panelTitle-activeForeground);
    }

    :host([panel]) .wrapper {
      display: flex;
      font-size: 11px;
      height: 31px;
      padding: 2px 10px;
      text-transform: uppercase;
    }

    .main {
      overflow: inherit;
      text-overflow: inherit;
    }

    .active-indicator {
      display: none;
    }

    .active-indicator.panel.active {
      border-top: 1px solid var(--vscode-panelTitle-activeBorder);
      bottom: 4px;
      display: block;
      left: 8px;
      pointer-events: none;
      position: absolute;
      right: 8px;
    }

    :host(:focus-visible) .wrapper {
      outline-color: var(--vscode-focusBorder);
      outline-offset: 3px;
      outline-style: solid;
      outline-width: 1px;
    }

    :host(:focus-visible) .wrapper.panel {
      outline-offset: -2px;
    }

    slot[name='content-before']::slotted(vscode-badge) {
      margin-right: 8px;
    }

    slot[name='content-after']::slotted(vscode-badge) {
      margin-left: 8px;
    }
  `,
    ];

    var __decorate$b = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-tab-header
     *
     * @cssprop --vscode-foreground
     * @cssprop --vscode-panelTitle-inactiveForeground
     * @cssprop --vscode-panelTitle-activeForeground
     * @cssprop --vscode-panelTitle-activeBorder
     * @cssprop --vscode-focusBorder
     * @cssprop --vscode-settings-headerForeground
     */
    let VscodeTabHeader = class VscodeTabHeader extends VscElement {
        constructor() {
            super(...arguments);
            this.active = false;
            /** @internal */
            this.ariaControls = '';
            /**
             * Panel-like look
             */
            this.panel = false;
            /** @internal */
            this.role = 'tab';
            /** @internal */
            this.tabId = -1;
        }
        attributeChangedCallback(name, old, value) {
            super.attributeChangedCallback(name, old, value);
            if (name === 'active') {
                const active = value !== null;
                this.ariaSelected = active ? 'true' : 'false';
                this.tabIndex = active ? 0 : -1;
            }
        }
        render() {
            return x `
      <div
        class=${e({
            wrapper: true,
            active: this.active,
            panel: this.panel,
        })}
      >
        <div class="before"><slot name="content-before"></slot></div>
        <div class="main"><slot></slot></div>
        <div class="after"><slot name="content-after"></slot></div>
        <span
          class=${e({
            'active-indicator': true,
            active: this.active,
            panel: this.panel,
        })}
        ></span>
      </div>
    `;
        }
    };
    VscodeTabHeader.styles = styles$b;
    __decorate$b([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTabHeader.prototype, "active", void 0);
    __decorate$b([
        n$1({ reflect: true, attribute: 'aria-controls' })
    ], VscodeTabHeader.prototype, "ariaControls", void 0);
    __decorate$b([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTabHeader.prototype, "panel", void 0);
    __decorate$b([
        n$1({ reflect: true })
    ], VscodeTabHeader.prototype, "role", void 0);
    __decorate$b([
        n$1({ type: Number, reflect: true, attribute: 'tab-id' })
    ], VscodeTabHeader.prototype, "tabId", void 0);
    VscodeTabHeader = __decorate$b([
        customElement('vscode-tab-header')
    ], VscodeTabHeader);

    const styles$a = [
        defaultStyles,
        i$4 `
    :host {
      display: block;
      overflow: hidden;
    }

    :host(:focus-visible) {
      outline-color: var(--vscode-focusBorder);
      outline-offset: 3px;
      outline-style: solid;
      outline-width: 1px;
    }

    :host([panel]) {
      background-color: var(--vscode-panel-background);
    }
  `,
    ];

    var __decorate$a = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-tab-panel
     *
     * @cssprop --vscode-panel--background
     * @cssprop --vscode-focusBorder
     */
    let VscodeTabPanel = class VscodeTabPanel extends VscElement {
        constructor() {
            super(...arguments);
            this.hidden = false;
            /** @internal */
            this.ariaLabelledby = '';
            /**
             * Panel-like look
             */
            this.panel = false;
            /** @internal */
            this.role = 'tabpanel';
            /** @internal */
            this.tabIndex = 0;
        }
        render() {
            return x ` <slot></slot> `;
        }
    };
    VscodeTabPanel.styles = styles$a;
    __decorate$a([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTabPanel.prototype, "hidden", void 0);
    __decorate$a([
        n$1({ reflect: true, attribute: 'aria-labelledby' })
    ], VscodeTabPanel.prototype, "ariaLabelledby", void 0);
    __decorate$a([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTabPanel.prototype, "panel", void 0);
    __decorate$a([
        n$1({ reflect: true })
    ], VscodeTabPanel.prototype, "role", void 0);
    __decorate$a([
        n$1({ type: Number, reflect: true })
    ], VscodeTabPanel.prototype, "tabIndex", void 0);
    VscodeTabPanel = __decorate$a([
        customElement('vscode-tab-panel')
    ], VscodeTabPanel);

    const styles$9 = [
        defaultStyles,
        i$4 `
    :host {
      display: table;
      table-layout: fixed;
      width: 100%;
    }

    ::slotted(vscode-table-row:nth-child(even)) {
      background-color: var(--vsc-row-even-background);
    }

    ::slotted(vscode-table-row:nth-child(odd)) {
      background-color: var(--vsc-row-odd-background);
    }
  `,
    ];

    var __decorate$9 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-table-body
     *
     * @cssprop --vscode-keybindingTable-rowsBackground
     */
    let VscodeTableBody = class VscodeTableBody extends VscElement {
        constructor() {
            super(...arguments);
            /** @internal */
            this.role = 'rowgroup';
        }
        render() {
            return x ` <slot></slot> `;
        }
    };
    VscodeTableBody.styles = styles$9;
    __decorate$9([
        n$1({ reflect: true })
    ], VscodeTableBody.prototype, "role", void 0);
    VscodeTableBody = __decorate$9([
        customElement('vscode-table-body')
    ], VscodeTableBody);

    const styles$8 = [
        defaultStyles,
        i$4 `
    :host {
      border-bottom-color: var(--vscode-editorGroup-border);
      border-bottom-style: solid;
      border-bottom-width: var(--vsc-row-border-bottom-width);
      box-sizing: border-box;
      color: var(--vscode-foreground);
      display: table-cell;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      height: 24px;
      overflow: hidden;
      padding-left: 10px;
      text-overflow: ellipsis;
      vertical-align: middle;
      white-space: nowrap;
    }

    :host([compact]) {
      display: block;
      height: auto;
      padding-bottom: 5px;
      width: 100% !important;
    }

    :host([compact]:first-child) {
      padding-top: 10px;
    }

    :host([compact]:last-child) {
      padding-bottom: 10px;
    }

    .wrapper {
      overflow: inherit;
      text-overflow: inherit;
      white-space: inherit;
      width: 100%;
    }

    .column-label {
      font-weight: bold;
    }
  `,
    ];

    var __decorate$8 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-table-cell
     *
     * @cssprop --vscode-editorGroup-border
     * @cssprop --vscode-foreground
     * @cssprop --vscode-font-family
     * @cssprop --vscode-font-size
     */
    let VscodeTableCell = class VscodeTableCell extends VscElement {
        constructor() {
            super(...arguments);
            /** @internal */
            this.role = 'cell';
            /**
             * Cell label in the compact view of the responsive mode. For internal use only.
             */
            this.columnLabel = '';
            /**
             * Enable compact view in the responsive mode. For internal use only.
             */
            this.compact = false;
        }
        render() {
            const columnLabelElement = this.columnLabel
                ? x `<div class="column-label" role="presentation">
          ${this.columnLabel}
        </div>`
                : E;
            return x `
      <div class="wrapper">
        ${columnLabelElement}
        <slot></slot>
      </div>
    `;
        }
    };
    VscodeTableCell.styles = styles$8;
    __decorate$8([
        n$1({ reflect: true })
    ], VscodeTableCell.prototype, "role", void 0);
    __decorate$8([
        n$1({ attribute: 'column-label' })
    ], VscodeTableCell.prototype, "columnLabel", void 0);
    __decorate$8([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTableCell.prototype, "compact", void 0);
    VscodeTableCell = __decorate$8([
        customElement('vscode-table-cell')
    ], VscodeTableCell);

    const styles$7 = [
        defaultStyles,
        i$4 `
    :host {
      background-color: var(--vscode-keybindingTable-headerBackground);
      display: table;
      table-layout: fixed;
      width: 100%;
    }
  `,
    ];

    var __decorate$7 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-table-header
     *
     * @cssprop --vscode-keybindingTable-headerBackground - Table header background
     */
    let VscodeTableHeader = class VscodeTableHeader extends VscElement {
        constructor() {
            super(...arguments);
            /** @internal */
            this.role = 'rowgroup';
        }
        render() {
            return x ` <slot></slot> `;
        }
    };
    VscodeTableHeader.styles = styles$7;
    __decorate$7([
        n$1({ reflect: true })
    ], VscodeTableHeader.prototype, "role", void 0);
    VscodeTableHeader = __decorate$7([
        customElement('vscode-table-header')
    ], VscodeTableHeader);

    const styles$6 = [
        defaultStyles,
        i$4 `
    :host {
      box-sizing: border-box;
      color: var(--vscode-foreground);
      display: table-cell;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      font-weight: bold;
      line-height: 20px;
      overflow: hidden;
      padding-bottom: 5px;
      padding-left: 10px;
      padding-right: 0;
      padding-top: 5px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .wrapper {
      box-sizing: inherit;
      overflow: inherit;
      text-overflow: inherit;
      white-space: inherit;
      width: 100%;
    }
  `,
    ];

    var __decorate$6 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-table-header-cell
     *
     * @cssprop --vscode-foreground
     * @cssprop --vscode-font-family
     * @cssprop --vscode-font-size
     */
    let VscodeTableHeaderCell = class VscodeTableHeaderCell extends VscElement {
        constructor() {
            super(...arguments);
            /** @internal */
            this.role = 'columnheader';
        }
        render() {
            return x `
      <div class="wrapper">
        <slot></slot>
      </div>
    `;
        }
    };
    VscodeTableHeaderCell.styles = styles$6;
    __decorate$6([
        n$1({ reflect: true })
    ], VscodeTableHeaderCell.prototype, "role", void 0);
    VscodeTableHeaderCell = __decorate$6([
        customElement('vscode-table-header-cell')
    ], VscodeTableHeaderCell);

    const styles$5 = [
        defaultStyles,
        i$4 `
    :host {
      border-top-color: var(--vscode-editorGroup-border);
      border-top-style: solid;
      border-top-width: var(--vsc-row-border-top-width);
      display: var(--vsc-row-display);
      width: 100%;
    }
  `,
    ];

    var __decorate$5 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-table-row
     *
     * @cssprop --vscode-editorGroup-border
     */
    let VscodeTableRow = class VscodeTableRow extends VscElement {
        constructor() {
            super(...arguments);
            /** @internal */
            this.role = 'row';
        }
        render() {
            return x ` <slot></slot> `;
        }
    };
    VscodeTableRow.styles = styles$5;
    __decorate$5([
        n$1({ reflect: true })
    ], VscodeTableRow.prototype, "role", void 0);
    VscodeTableRow = __decorate$5([
        customElement('vscode-table-row')
    ], VscodeTableRow);

    const rawValueToPercentage = (raw, base) => {
        if (typeof raw === 'number' && !Number.isNaN(raw)) {
            return (raw / base) * 100;
        }
        else if (typeof raw === 'string' && /^[0-9.]+$/.test(raw)) {
            const val = Number(raw);
            return (val / base) * 100;
        }
        else if (typeof raw === 'string' && /^[0-9.]+%$/.test(raw)) {
            return Number(raw.substring(0, raw.length - 1));
        }
        else if (typeof raw === 'string' && /^[0-9.]+px$/.test(raw)) {
            const val = Number(raw.substring(0, raw.length - 2));
            return (val / base) * 100;
        }
        else {
            return null;
        }
    };

    const styles$4 = [
        defaultStyles,
        i$4 `
    :host {
      display: block;
      --vsc-row-even-background: transparent;
      --vsc-row-odd-background: transparent;
      --vsc-row-border-bottom-width: 0;
      --vsc-row-border-top-width: 0;
      --vsc-row-display: table-row;
    }

    :host([bordered]),
    :host([bordered-rows]) {
      --vsc-row-border-bottom-width: 1px;
    }

    :host([compact]) {
      --vsc-row-display: block;
    }

    :host([bordered][compact]),
    :host([bordered-rows][compact]) {
      --vsc-row-border-bottom-width: 0;
      --vsc-row-border-top-width: 1px;
    }

    :host([zebra]) {
      --vsc-row-even-background: var(--vscode-keybindingTable-rowsBackground);
    }

    :host([zebra-odd]) {
      --vsc-row-odd-background: var(--vscode-keybindingTable-rowsBackground);
    }

    ::slotted(vscode-table-row) {
      width: 100%;
    }

    .wrapper {
      height: 100%;
      max-width: 100%;
      overflow: hidden;
      position: relative;
      width: 100%;
    }

    .wrapper.select-disabled {
      user-select: none;
    }

    .wrapper.resize-cursor {
      cursor: ew-resize;
    }

    .wrapper.compact-view .header-slot-wrapper {
      height: 0;
      overflow: hidden;
    }

    .scrollable {
      height: 100%;
    }

    .scrollable:before {
      background-color: transparent;
      content: '';
      display: block;
      height: 1px;
      position: absolute;
      width: 100%;
    }

    .wrapper:not(.compact-view) .scrollable:not([scrolled]):before {
      background-color: var(--vscode-editorGroup-border);
    }

    .sash {
      visibility: hidden;
    }

    :host([bordered-columns]) .sash,
    :host([bordered]) .sash {
      visibility: visible;
    }

    :host([resizable]) .wrapper:hover .sash {
      visibility: visible;
    }

    .sash {
      height: 100%;
      position: absolute;
      top: 0;
      width: 1px;
    }

    .wrapper.compact-view .sash {
      display: none;
    }

    .sash.resizable {
      cursor: ew-resize;
    }

    .sash-visible {
      background-color: var(--vscode-editorGroup-border);
      height: 100%;
      position: absolute;
      top: 30px;
      width: 1px;
    }

    .sash.hover .sash-visible {
      background-color: var(--vscode-sash-hoverBorder);
      transition: background-color 50ms linear 300ms;
    }

    .sash .sash-clickable {
      background-color: transparent;
      height: 100%;
      left: -2px;
      position: absolute;
      width: 5px;
    }
  `,
    ];

    var __decorate$4 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    const COMPONENT_WIDTH_PERCENTAGE = 100;
    /**
     * @tag vscode-table
     *
     * @cssprop [--border=var(--vscode-editorGroup-border)]
     * @cssprop [--foreground=var(--vscode-foreground)]
     * @cssprop [--resize-hover-border=var(--vscode-sash-hoverBorder)]
     * @cssprop [--tinted-row-background=var(--vscode-keybindingTable-rowsBackground)]
     * @cssprop [--header-background=var(--vscode-keybindingTable-headerBackground)]
     * @cssprop [--font-size=var(--vscode-font-size)]
     * @cssprop [--font-family=var(--vscode-font-family)]
     */
    let VscodeTable = class VscodeTable extends VscElement {
        constructor() {
            super(...arguments);
            /** @internal */
            this.role = 'table';
            this.resizable = false;
            this.responsive = false;
            /**
             * Both rows and columns are separated by borders.
             */
            this.bordered = false;
            /**
             * Columns are separated by borders.
             */
            this.borderedColumns = false;
            /**
             * Rows are separated by borders.
             */
            this.borderedRows = false;
            this.breakpoint = 300;
            /**
             * Minimum column width. Valid values are:
             * - number
             * - string-type number (ex.: "100")
             * - px value (ex.: "100px")
             * - percentage value (ex.: "50%")
             * - percentage value (ex.: "50%")
             * - "auto" keyword
             */
            this.minColumnWidth = '50px';
            this.delayedResizing = false;
            /**
             * @internal
             */
            this.compact = false;
            /**
             * Zebra stripes, even rows are tinted.
             */
            this.zebra = false;
            /**
             * Zebra stripes, odd rows are tinted.
             */
            this.zebraOdd = false;
            /**
             * Sash positions in percentage
             */
            this._sashPositions = [];
            this._isDragging = false;
            /**
             * Sash hover state flags, used in the render.
             */
            this._sashHovers = [];
            this._columns = [];
            this._activeSashElementIndex = -1;
            this._activeSashCursorOffset = 0;
            this._componentX = 0;
            this._componentH = 0;
            this._componentW = 0;
            /**
             * Cached querySelectorAll result. Updated when the header slot changes.
             * It shouldn't be used directly, check the "_getHeaderCells" function.
             */
            this._headerCells = [];
            /**
             * Cached querySelectorAll result. Updated when the body slot changes.
             * It shouldn't be used directly, check the "_getCellsOfFirstRow" function.
             */
            this._cellsOfFirstRow = [];
            this._prevHeaderHeight = 0;
            this._prevComponentHeight = 0;
            this._componentResizeObserverCallback = () => {
                this._memoizeComponentDimensions();
                this._updateResizeHandlersSize();
                if (this.responsive) {
                    this._toggleCompactView();
                }
                this._resizeTableBody();
            };
            this._headerResizeObserverCallback = () => {
                this._updateResizeHandlersSize();
            };
            this._bodyResizeObserverCallback = () => {
                this._resizeTableBody();
            };
            this._onResizingMouseMove = (event) => {
                event.stopPropagation();
                this._updateActiveSashPosition(event.pageX);
                if (!this.delayedResizing) {
                    this._resizeColumns(true);
                }
                else {
                    this._resizeColumns(false);
                }
            };
            this._onResizingMouseUp = (event) => {
                this._resizeColumns(true);
                this._updateActiveSashPosition(event.pageX);
                this._sashHovers[this._activeSashElementIndex] = false;
                this._isDragging = false;
                this._activeSashElementIndex = -1;
                document.removeEventListener('mousemove', this._onResizingMouseMove);
                document.removeEventListener('mouseup', this._onResizingMouseUp);
            };
        }
        /**
         * Initial column sizes in a JSON-encoded array.
         * Accepted values are:
         * - number
         * - string-type number (ex.: "100")
         * - px value (ex.: "100px")
         * - percentage value (ex.: "50%")
         * - percentage value (ex.: "50%")
         * - "auto" keyword
         */
        set columns(val) {
            this._columns = val;
            if (this.isConnected) {
                this._initDefaultColumnSizes();
            }
        }
        get columns() {
            return this._columns;
        }
        connectedCallback() {
            super.connectedCallback();
            this._memoizeComponentDimensions();
            this._initDefaultColumnSizes();
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            this._componentResizeObserver?.unobserve(this);
            this._componentResizeObserver?.disconnect();
            this._bodyResizeObserver?.disconnect();
        }
        _px2Percent(px) {
            return (px / this._componentW) * 100;
        }
        _percent2Px(percent) {
            return (this._componentW * percent) / 100;
        }
        _memoizeComponentDimensions() {
            const cr = this.getBoundingClientRect();
            this._componentH = cr.height;
            this._componentW = cr.width;
            this._componentX = cr.x;
        }
        _queryHeaderCells() {
            const headers = this._assignedHeaderElements;
            if (!(headers && headers[0])) {
                return [];
            }
            return Array.from(headers[0].querySelectorAll('vscode-table-header-cell'));
        }
        /**
         * Get cached header cells
         */
        _getHeaderCells() {
            if (!this._headerCells.length) {
                this._headerCells = this._queryHeaderCells();
            }
            return this._headerCells;
        }
        _queryCellsOfFirstRow() {
            const assignedBodyElements = this._assignedBodyElements;
            if (!(assignedBodyElements && assignedBodyElements[0])) {
                return [];
            }
            return Array.from(assignedBodyElements[0].querySelectorAll('vscode-table-row:first-child vscode-table-cell'));
        }
        /**
         * Get cached cells of first row
         */
        _getCellsOfFirstRow() {
            if (!this._cellsOfFirstRow.length) {
                this._cellsOfFirstRow = this._queryCellsOfFirstRow();
            }
            return this._cellsOfFirstRow;
        }
        _resizeTableBody() {
            let headerHeight = 0;
            let tbodyHeight = 0;
            const tableHeight = this.getBoundingClientRect().height;
            if (this._assignedHeaderElements && this._assignedHeaderElements.length) {
                headerHeight =
                    this._assignedHeaderElements[0].getBoundingClientRect().height;
            }
            if (this._assignedBodyElements && this._assignedBodyElements.length) {
                tbodyHeight =
                    this._assignedBodyElements[0].getBoundingClientRect().height;
            }
            const overflownContentHeight = tbodyHeight - headerHeight - tableHeight;
            this._scrollableElement.style.height =
                overflownContentHeight > 0 ? `${tableHeight - headerHeight}px` : 'auto';
        }
        _initResizeObserver() {
            this._componentResizeObserver = new ResizeObserver(this._componentResizeObserverCallback);
            this._componentResizeObserver.observe(this);
            this._headerResizeObserver = new ResizeObserver(this._headerResizeObserverCallback);
            this._headerResizeObserver.observe(this._headerElement);
        }
        _calcColWidthPercentages() {
            const numCols = this._getHeaderCells().length;
            let cols = this.columns.slice(0, numCols);
            const numAutoCols = cols.filter((c) => c === 'auto').length + numCols - cols.length;
            let availablePercent = 100;
            cols = cols.map((col) => {
                const percentage = rawValueToPercentage(col, this._componentW);
                if (percentage === null) {
                    return 'auto';
                }
                availablePercent -= percentage;
                return percentage;
            });
            if (cols.length < numCols) {
                for (let i = cols.length; i < numCols; i++) {
                    cols.push('auto');
                }
            }
            cols = cols.map((col) => {
                if (col === 'auto') {
                    return availablePercent / numAutoCols;
                }
                return col;
            });
            return cols;
        }
        _initHeaderCellSizes(colWidths) {
            this._getHeaderCells().forEach((cell, index) => {
                cell.style.width = `${colWidths[index]}%`;
            });
        }
        _initBodyColumnSizes(colWidths) {
            this._getCellsOfFirstRow().forEach((cell, index) => {
                cell.style.width = `${colWidths[index]}%`;
            });
        }
        _initSashes(colWidths) {
            const l = colWidths.length;
            let prevHandlerPos = 0;
            this._sashPositions = [];
            colWidths.forEach((collW, index) => {
                if (index < l - 1) {
                    const pos = prevHandlerPos + collW;
                    this._sashPositions.push(pos);
                    prevHandlerPos = pos;
                }
            });
        }
        _initDefaultColumnSizes() {
            const colWidths = this._calcColWidthPercentages();
            this._initHeaderCellSizes(colWidths);
            this._initBodyColumnSizes(colWidths);
            this._initSashes(colWidths);
        }
        _updateResizeHandlersSize() {
            const headerCr = this._headerElement.getBoundingClientRect();
            if (headerCr.height === this._prevHeaderHeight &&
                this._componentH === this._prevComponentHeight) {
                return;
            }
            this._prevHeaderHeight = headerCr.height;
            this._prevComponentHeight = this._componentH;
            const bodyHeight = this._componentH - headerCr.height;
            this._sashVisibleElements.forEach((el) => {
                el.style.height = `${bodyHeight}px`;
                el.style.top = `${headerCr.height}px`;
            });
        }
        _applyCompactViewColumnLabels() {
            const headerCells = this._getHeaderCells();
            const labels = headerCells.map((c) => c.innerText);
            const rows = this.querySelectorAll('vscode-table-row');
            rows.forEach((r) => {
                const cells = r.querySelectorAll('vscode-table-cell');
                cells.forEach((c, i) => {
                    c.columnLabel = labels[i];
                    c.compact = true;
                });
            });
        }
        _clearCompactViewColumnLabels() {
            this.querySelectorAll('vscode-table-cell').forEach((c) => {
                c.columnLabel = '';
                c.compact = false;
            });
        }
        _toggleCompactView() {
            const cr = this.getBoundingClientRect();
            const nextCompactView = cr.width < this.breakpoint;
            if (this.compact !== nextCompactView) {
                this.compact = nextCompactView;
                if (nextCompactView) {
                    this._applyCompactViewColumnLabels();
                }
                else {
                    this._clearCompactViewColumnLabels();
                }
            }
        }
        _onDefaultSlotChange() {
            this._assignedElements.forEach((el) => {
                if (el.tagName.toLowerCase() === 'vscode-table-header') {
                    el.slot = 'header';
                    return;
                }
                if (el.tagName.toLowerCase() === 'vscode-table-body') {
                    el.slot = 'body';
                    return;
                }
            });
        }
        _onHeaderSlotChange() {
            this._headerCells = this._queryHeaderCells();
        }
        _onBodySlotChange() {
            this._initDefaultColumnSizes();
            this._initResizeObserver();
            this._updateResizeHandlersSize();
            if (!this._bodyResizeObserver) {
                const tbody = this._assignedBodyElements[0] ?? null;
                if (tbody) {
                    this._bodyResizeObserver = new ResizeObserver(this._bodyResizeObserverCallback);
                    this._bodyResizeObserver.observe(tbody);
                }
            }
        }
        _onSashMouseOver(event) {
            if (this._isDragging) {
                return;
            }
            const target = event.currentTarget;
            const index = Number(target.dataset.index);
            this._sashHovers[index] = true;
            this.requestUpdate();
        }
        _onSashMouseOut(event) {
            event.stopPropagation();
            if (this._isDragging) {
                return;
            }
            const target = event.currentTarget;
            const index = Number(target.dataset.index);
            this._sashHovers[index] = false;
            this.requestUpdate();
        }
        _onSashMouseDown(event) {
            event.stopPropagation();
            const { pageX, currentTarget } = event;
            const el = currentTarget;
            const index = Number(el.dataset.index);
            const cr = el.getBoundingClientRect();
            const elX = cr.x;
            this._isDragging = true;
            this._activeSashElementIndex = index;
            this._sashHovers[this._activeSashElementIndex] = true;
            this._activeSashCursorOffset = this._px2Percent(pageX - elX);
            const headerCells = this._getHeaderCells();
            this._headerCellsToResize = [];
            this._headerCellsToResize.push(headerCells[index]);
            if (headerCells[index + 1]) {
                this._headerCellsToResize[1] = headerCells[index + 1];
            }
            const tbody = this._bodySlot.assignedElements()[0];
            const cells = tbody.querySelectorAll('vscode-table-row:first-child > vscode-table-cell');
            this._cellsToResize = [];
            this._cellsToResize.push(cells[index]);
            if (cells[index + 1]) {
                this._cellsToResize.push(cells[index + 1]);
            }
            document.addEventListener('mousemove', this._onResizingMouseMove);
            document.addEventListener('mouseup', this._onResizingMouseUp);
        }
        _updateActiveSashPosition(mouseX) {
            const { prevSashPos, nextSashPos } = this._getSashPositions();
            let minColumnWidth = rawValueToPercentage(this.minColumnWidth, this._componentW);
            if (minColumnWidth === null) {
                minColumnWidth = 0;
            }
            const minX = prevSashPos ? prevSashPos + minColumnWidth : minColumnWidth;
            const maxX = nextSashPos
                ? nextSashPos - minColumnWidth
                : COMPONENT_WIDTH_PERCENTAGE - minColumnWidth;
            let newX = this._px2Percent(mouseX - this._componentX - this._percent2Px(this._activeSashCursorOffset));
            newX = Math.max(newX, minX);
            newX = Math.min(newX, maxX);
            this._sashPositions[this._activeSashElementIndex] = newX;
            this.requestUpdate();
        }
        _getSashPositions() {
            const sashPos = this._sashPositions[this._activeSashElementIndex];
            const prevSashPos = this._sashPositions[this._activeSashElementIndex - 1] || 0;
            const nextSashPos = this._sashPositions[this._activeSashElementIndex + 1] ||
                COMPONENT_WIDTH_PERCENTAGE;
            return {
                sashPos,
                prevSashPos,
                nextSashPos,
            };
        }
        _resizeColumns(resizeBodyCells = true) {
            const { sashPos, prevSashPos, nextSashPos } = this._getSashPositions();
            const prevColW = sashPos - prevSashPos;
            const nextColW = nextSashPos - sashPos;
            const prevColCss = `${prevColW}%`;
            const nextColCss = `${nextColW}%`;
            this._headerCellsToResize[0].style.width = prevColCss;
            if (this._headerCellsToResize[1]) {
                this._headerCellsToResize[1].style.width = nextColCss;
            }
            if (resizeBodyCells) {
                this._cellsToResize[0].style.width = prevColCss;
                if (this._cellsToResize[1]) {
                    this._cellsToResize[1].style.width = nextColCss;
                }
            }
        }
        render() {
            const sashes = this._sashPositions.map((val, index) => {
                const classes = e({
                    sash: true,
                    hover: this._sashHovers[index],
                    resizable: this.resizable,
                });
                const left = `${val}%`;
                return this.resizable
                    ? x `
            <div
              class=${classes}
              data-index=${index}
              .style=${stylePropertyMap({ left })}
              @mousedown=${this._onSashMouseDown}
              @mouseover=${this._onSashMouseOver}
              @mouseout=${this._onSashMouseOut}
            >
              <div class="sash-visible"></div>
              <div class="sash-clickable"></div>
            </div>
          `
                    : x `<div
            class=${classes}
            data-index=${index}
            .style=${stylePropertyMap({ left })}
          >
            <div class="sash-visible"></div>
          </div>`;
            });
            const wrapperClasses = e({
                wrapper: true,
                'select-disabled': this._isDragging,
                'resize-cursor': this._isDragging,
                'compact-view': this.compact,
            });
            return x `
      <div class=${wrapperClasses}>
        <div class="header">
          <slot name="caption"></slot>
          <div class="header-slot-wrapper">
            <slot name="header" @slotchange=${this._onHeaderSlotChange}></slot>
          </div>
        </div>
        <vscode-scrollable class="scrollable">
          <div>
            <slot name="body" @slotchange=${this._onBodySlotChange}></slot>
          </div>
        </vscode-scrollable>
        ${sashes}
        <slot @slotchange=${this._onDefaultSlotChange}></slot>
      </div>
    `;
        }
    };
    VscodeTable.styles = styles$4;
    __decorate$4([
        n$1({ reflect: true })
    ], VscodeTable.prototype, "role", void 0);
    __decorate$4([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTable.prototype, "resizable", void 0);
    __decorate$4([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTable.prototype, "responsive", void 0);
    __decorate$4([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTable.prototype, "bordered", void 0);
    __decorate$4([
        n$1({ type: Boolean, reflect: true, attribute: 'bordered-columns' })
    ], VscodeTable.prototype, "borderedColumns", void 0);
    __decorate$4([
        n$1({ type: Boolean, reflect: true, attribute: 'bordered-rows' })
    ], VscodeTable.prototype, "borderedRows", void 0);
    __decorate$4([
        n$1({ type: Number })
    ], VscodeTable.prototype, "breakpoint", void 0);
    __decorate$4([
        n$1({ type: Array })
    ], VscodeTable.prototype, "columns", null);
    __decorate$4([
        n$1({ attribute: 'min-column-width' })
    ], VscodeTable.prototype, "minColumnWidth", void 0);
    __decorate$4([
        n$1({ type: Boolean, reflect: true, attribute: 'delayed-resizing' })
    ], VscodeTable.prototype, "delayedResizing", void 0);
    __decorate$4([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTable.prototype, "compact", void 0);
    __decorate$4([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTable.prototype, "zebra", void 0);
    __decorate$4([
        n$1({ type: Boolean, reflect: true, attribute: 'zebra-odd' })
    ], VscodeTable.prototype, "zebraOdd", void 0);
    __decorate$4([
        e$3('slot[name="body"]')
    ], VscodeTable.prototype, "_bodySlot", void 0);
    __decorate$4([
        e$3('.header')
    ], VscodeTable.prototype, "_headerElement", void 0);
    __decorate$4([
        e$3('.scrollable')
    ], VscodeTable.prototype, "_scrollableElement", void 0);
    __decorate$4([
        r$1('.sash-visible')
    ], VscodeTable.prototype, "_sashVisibleElements", void 0);
    __decorate$4([
        o$1({
            flatten: true,
            selector: 'vscode-table-header, vscode-table-body',
        })
    ], VscodeTable.prototype, "_assignedElements", void 0);
    __decorate$4([
        o$1({
            slot: 'header',
            flatten: true,
            selector: 'vscode-table-header',
        })
    ], VscodeTable.prototype, "_assignedHeaderElements", void 0);
    __decorate$4([
        o$1({
            slot: 'body',
            flatten: true,
            selector: 'vscode-table-body',
        })
    ], VscodeTable.prototype, "_assignedBodyElements", void 0);
    __decorate$4([
        r$2()
    ], VscodeTable.prototype, "_sashPositions", void 0);
    __decorate$4([
        r$2()
    ], VscodeTable.prototype, "_isDragging", void 0);
    VscodeTable = __decorate$4([
        customElement('vscode-table')
    ], VscodeTable);

    const styles$3 = [
        defaultStyles,
        i$4 `
    :host {
      display: block;
    }

    .header {
      align-items: center;
      display: flex;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      font-weight: var(--vscode-font-weight);
      width: 100%;
    }

    .header {
      border-bottom-color: var(--vscode-settings-headerBorder);
      border-bottom-style: solid;
      border-bottom-width: 1px;
    }

    .header.panel {
      background-color: var(--vscode-panel-background);
      border-bottom-width: 0;
      box-sizing: border-box;
      padding-left: 8px;
      padding-right: 8px;
    }

    slot[name='addons'] {
      display: block;
      margin-left: auto;
    }
  `,
    ];

    var __decorate$3 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * @tag vscode-tabs
     *
     * @slot - Default slot. It is used for tab panels.
     * @slot header - Slot for tab headers.
     * @slot addons - Right aligned area in the header.
     *
     * @fires {VscTabSelectEvent} vsc-tabs-select - Dispatched when the active tab is changed
     *
     * @cssprop --vscode-font-family
     * @cssprop --vscode-font-size
     * @cssprop --vscode-font-weight
     * @cssprop --vscode-settings-headerBorder
     * @cssprop --vscode-panel-background
     */
    let VscodeTabs = class VscodeTabs extends VscElement {
        constructor() {
            super();
            /**
             * Panel-like look
             */
            this.panel = false;
            /** @internal */
            this.role = 'tablist';
            this.selectedIndex = 0;
            this._tabHeaders = [];
            this._tabPanels = [];
            this._componentId = '';
            this._tabFocus = 0;
            this._componentId = uniqueId();
        }
        attributeChangedCallback(name, old, value) {
            super.attributeChangedCallback(name, old, value);
            if (name === 'selected-index') {
                this._setActiveTab();
            }
            if (name === 'panel') {
                this._tabHeaders.forEach((h) => (h.panel = value !== null));
                this._tabPanels.forEach((p) => (p.panel = value !== null));
            }
        }
        _dispatchSelectEvent() {
            /** @deprecated */
            this.dispatchEvent(new CustomEvent('vsc-select', {
                detail: {
                    selectedIndex: this.selectedIndex,
                },
                composed: true,
            }));
            this.dispatchEvent(new CustomEvent('vsc-tabs-select', {
                detail: {
                    selectedIndex: this.selectedIndex,
                },
                composed: true,
            }));
        }
        _setActiveTab() {
            this._tabFocus = this.selectedIndex;
            this._tabPanels.forEach((el, i) => {
                el.hidden = i !== this.selectedIndex;
            });
            this._tabHeaders.forEach((el, i) => {
                el.active = i === this.selectedIndex;
            });
        }
        _focusPrevTab() {
            if (this._tabFocus === 0) {
                this._tabFocus = this._tabHeaders.length - 1;
            }
            else {
                this._tabFocus -= 1;
            }
        }
        _focusNextTab() {
            if (this._tabFocus === this._tabHeaders.length - 1) {
                this._tabFocus = 0;
            }
            else {
                this._tabFocus += 1;
            }
        }
        _onHeaderKeyDown(ev) {
            if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
                ev.preventDefault();
                this._tabHeaders[this._tabFocus].setAttribute('tabindex', '-1');
                if (ev.key === 'ArrowLeft') {
                    this._focusPrevTab();
                }
                else if (ev.key === 'ArrowRight') {
                    this._focusNextTab();
                }
                this._tabHeaders[this._tabFocus].setAttribute('tabindex', '0');
                this._tabHeaders[this._tabFocus].focus();
            }
            if (ev.key === 'Enter') {
                ev.preventDefault();
                this.selectedIndex = this._tabFocus;
                this._dispatchSelectEvent();
            }
        }
        _moveHeadersToHeaderSlot() {
            const headers = this._mainSlotElements.filter((el) => el instanceof VscodeTabHeader);
            if (headers.length > 0) {
                headers.forEach((h) => h.setAttribute('slot', 'header'));
            }
        }
        _onMainSlotChange() {
            this._moveHeadersToHeaderSlot();
            this._tabPanels = this._mainSlotElements.filter((el) => el instanceof VscodeTabPanel);
            this._tabPanels.forEach((el, i) => {
                el.ariaLabelledby = `t${this._componentId}-h${i}`;
                el.id = `t${this._componentId}-p${i}`;
                el.panel = this.panel;
            });
            this._setActiveTab();
        }
        _onHeaderSlotChange() {
            this._tabHeaders = this._headerSlotElements.filter((el) => el instanceof VscodeTabHeader);
            this._tabHeaders.forEach((el, i) => {
                el.tabId = i;
                el.id = `t${this._componentId}-h${i}`;
                el.ariaControls = `t${this._componentId}-p${i}`;
                el.panel = this.panel;
                el.active = i === this.selectedIndex;
            });
        }
        _onHeaderClick(event) {
            const path = event.composedPath();
            const headerEl = path.find((et) => et instanceof VscodeTabHeader);
            if (headerEl) {
                this.selectedIndex = headerEl.tabId;
                this._setActiveTab();
                this._dispatchSelectEvent();
            }
        }
        render() {
            return x `
      <div
        class=${e({ header: true, panel: this.panel })}
        @click=${this._onHeaderClick}
        @keydown=${this._onHeaderKeyDown}
      >
        <slot name="header" @slotchange=${this._onHeaderSlotChange}></slot>
        <slot name="addons"></slot>
      </div>
      <slot @slotchange=${this._onMainSlotChange}></slot>
    `;
        }
    };
    VscodeTabs.styles = styles$3;
    __decorate$3([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTabs.prototype, "panel", void 0);
    __decorate$3([
        n$1({ reflect: true })
    ], VscodeTabs.prototype, "role", void 0);
    __decorate$3([
        n$1({ type: Number, reflect: true, attribute: 'selected-index' })
    ], VscodeTabs.prototype, "selectedIndex", void 0);
    __decorate$3([
        o$1({ slot: 'header' })
    ], VscodeTabs.prototype, "_headerSlotElements", void 0);
    __decorate$3([
        o$1()
    ], VscodeTabs.prototype, "_mainSlotElements", void 0);
    VscodeTabs = __decorate$3([
        customElement('vscode-tabs')
    ], VscodeTabs);

    const styles$2 = [
        defaultStyles,
        i$4 `
    :host {
      display: inline-flex;
    }

    button {
      align-items: center;
      background-color: transparent;
      border: 0;
      border-radius: 5px;
      color: var(--vscode-foreground, #cccccc);
      cursor: pointer;
      display: flex;
      outline-offset: -1px;
      outline-width: 1px;
      padding: 0;
      user-select: none;
    }

    button:focus-visible {
      outline-color: var(--vscode-focusBorder, #0078d4);
      outline-style: solid;
    }

    button:hover {
      background-color: var(
        --vscode-toolbar-hoverBackground,
        rgba(90, 93, 94, 0.31)
      );
      outline-style: dashed;
      outline-color: var(--vscode-toolbar-hoverOutline, transparent);
    }

    button:active {
      background-color: var(
        --vscode-toolbar-activeBackground,
        rgba(99, 102, 103, 0.31)
      );
    }

    button.checked {
      background-color: var(
        --vscode-inputOption-activeBackground,
        rgba(36, 137, 219, 0.51)
      );
      outline-color: var(--vscode-inputOption-activeBorder, #2488db);
      outline-style: solid;
      color: var(--vscode-inputOption-activeForeground, #ffffff);
    }

    button.checked vscode-icon {
      color: var(--vscode-inputOption-activeForeground, #ffffff);
    }

    vscode-icon {
      display: block;
      padding: 3px;
    }

    slot:not(.empty) {
      align-items: center;
      display: flex;
      height: 22px;
      padding: 0 5px 0 2px;
    }

    slot.textOnly:not(.empty) {
      padding: 0 5px;
    }
  `,
    ];

    var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Toolbar button
     *
     * @tag vscode-toolbar-button
     */
    let VscodeToolbarButton = class VscodeToolbarButton extends VscElement {
        constructor() {
            super(...arguments);
            this.icon = '';
            this.label = undefined;
            this.toggleable = false;
            this.checked = false;
            this._isSlotEmpty = true;
        }
        _handleSlotChange() {
            this._isSlotEmpty = !((this._assignedNodes?.length ?? 0) > 0);
        }
        _handleButtonClick() {
            if (!this.toggleable) {
                return;
            }
            this.checked = !this.checked;
            this.dispatchEvent(new Event('change'));
        }
        render() {
            const checked = this.checked ? 'true' : 'false';
            return x `
      <button
        type="button"
        aria-label=${o(this.label)}
        role=${o(this.toggleable ? 'switch' : undefined)}
        aria-checked=${o(this.toggleable ? checked : undefined)}
        class=${e({ checked: this.toggleable && this.checked })}
        @click=${this._handleButtonClick}
      >
        ${this.icon
            ? x `<vscode-icon name=${this.icon}></vscode-icon>`
            : E}
        <slot
          @slotchange=${this._handleSlotChange}
          class=${e({ empty: this._isSlotEmpty, textOnly: !this.icon })}
        ></slot>
      </button>
    `;
        }
    };
    VscodeToolbarButton.styles = styles$2;
    __decorate$2([
        n$1({ reflect: true })
    ], VscodeToolbarButton.prototype, "icon", void 0);
    __decorate$2([
        n$1()
    ], VscodeToolbarButton.prototype, "label", void 0);
    __decorate$2([
        n$1({ type: Boolean, reflect: true })
    ], VscodeToolbarButton.prototype, "toggleable", void 0);
    __decorate$2([
        n$1({ type: Boolean, reflect: true })
    ], VscodeToolbarButton.prototype, "checked", void 0);
    __decorate$2([
        r$2()
    ], VscodeToolbarButton.prototype, "_isSlotEmpty", void 0);
    __decorate$2([
        n()
    ], VscodeToolbarButton.prototype, "_assignedNodes", void 0);
    VscodeToolbarButton = __decorate$2([
        customElement('vscode-toolbar-button')
    ], VscodeToolbarButton);

    const styles$1 = [
        defaultStyles,
        i$4 `
    :host {
      gap: 4px;
      display: flex;
      align-items: center;
    }
  `,
    ];

    var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    /**
     * Simple container to arrange the toolar buttons
     *
     * @tag vscode-toolbar-container
     */
    let VscodeToolbarContainer = class VscodeToolbarContainer extends VscElement {
        render() {
            return x ` <slot></slot> `;
        }
    };
    VscodeToolbarContainer.styles = styles$1;
    VscodeToolbarContainer = __decorate$1([
        customElement('vscode-toolbar-container')
    ], VscodeToolbarContainer);

    const styles = [
        defaultStyles,
        i$4 `
    :host {
      --hover-outline-color: transparent;
      --hover-outline-style: solid;
      --hover-outline-width: 0;
      --selected-outline-color: transparent;
      --selected-outline-style: solid;
      --selected-outline-width: 0;

      display: block;
      outline: none;
      user-select: none;
    }

    .wrapper {
      height: 100%;
    }

    li {
      list-style: none;
    }

    ul,
    li {
      margin: 0;
      padding: 0;
    }

    ul {
      position: relative;
    }

    :host([indent-guides]) ul ul:before {
      content: '';
      display: block;
      height: 100%;
      position: absolute;
      bottom: 0;
      left: var(--indent-guide-pos);
      top: 0;
      pointer-events: none;
      width: 1px;
      z-index: 1;
    }

    .contents {
      align-items: center;
      display: flex;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      font-weight: var(--vscode-font-weight);
      outline-offset: -1px;
      padding-right: 12px;
    }

    .multi .contents {
      align-items: flex-start;
    }

    .contents:hover {
      cursor: pointer;
    }

    .arrow-container {
      align-items: center;
      display: flex;
      height: 22px;
      justify-content: center;
      padding-left: 8px;
      padding-right: 6px;
      width: 16px;
    }

    .icon-arrow {
      color: currentColor;
      display: block;
    }

    .theme-icon {
      display: block;
      flex-shrink: 0;
      margin-right: 6px;
    }

    .image-icon {
      background-repeat: no-repeat;
      background-position: 0 center;
      background-size: 16px;
      display: block;
      flex-shrink: 0;
      margin-right: 6px;
      height: 22px;
      width: 16px;
    }

    .multi .contents .theme-icon {
      margin-top: 3px;
    }

    .text-content {
      display: flex;
      line-height: 22px;
    }

    .single .text-content {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
    }

    .description {
      font-size: 0.9em;
      line-height: 22px;
      margin-left: 0.5em;
      opacity: 0.95;
      white-space: pre;
    }

    .actions {
      display: none;
    }

    .contents.selected > .actions,
    .contents.focused > .actions,
    .contents:hover > .actions {
      display: flex;
    }

    .decorations {
      align-items: center;
      display: flex;
      height: 22px;
      margin-left: 5px;
    }

    .filled-circle {
      margin-right: 3px;
      opacity: 0.4;
    }

    .decoration-text {
      font-size: 90%;
      font-weight: 600;
      margin-right: 3px;
      opacity: 0.75;
    }

    .filled-circle,
    .decoration-text {
      color: var(--color, currentColor);
    }

    .contents:hover .filled-circle,
    .contents:hover .decoration-text {
      color: var(--hover-color, var(--color));
    }

    .contents.focused .filled-circle,
    .contents.focused .decoration-text {
      color: var(--focused-color, var(--color));
    }

    .contents.selected .filled-circle,
    .contents.selected .decoration-text {
      color: var(--selected-color, var(--color));
    }

    /* Theme colors */
    :host(:focus) .wrapper.has-not-focused-item {
      outline: 1px solid var(--vscode-focusBorder);
    }

    :host(:focus) .contents.selected,
    :host(:focus) .contents.focused.selected {
      color: var(--vscode-list-activeSelectionForeground);
      background-color: var(--vscode-list-activeSelectionBackground);
    }

    :host(:focus) .contents.selected .icon-arrow,
    :host(:focus) .contents.selected.focused .icon-arrow,
    :host(:focus) .contents.selected .theme-icon,
    :host(:focus) .contents.selected.focused .theme-icon,
    :host(:focus) .contents.selected .action-icon,
    :host(:focus) .contents.selected.focused .action-icon {
      color: var(--vscode-list-activeSelectionIconForeground);
    }

    :host(:focus) .contents.focused {
      color: var(--vscode-list-focusForeground);
      background-color: var(--vscode-list-focusBackground);
    }

    :host(:focus) .contents.selected.focused {
      outline-color: var(
        --vscode-list-focusAndSelectionOutline,
        var(--vscode-list-focusOutline)
      );
    }

    .contents:hover {
      background-color: var(--vscode-list-hoverBackground);
      color: var(--vscode-list-hoverForeground);
    }

    .contents:hover,
    .contents.selected:hover {
      outline-color: var(--hover-outline-color);
      outline-style: var(--hover-outline-style);
      outline-width: var(--hover-outline-width);
    }

    .contents.selected,
    .contents.selected.focused {
      background-color: var(--vscode-list-inactiveSelectionBackground);
      color: var(--vscode-list-inactiveSelectionForeground);
    }

    .contents.selected,
    .contents.selected.focused {
      outline-color: var(--selected-outline-color);
      outline-style: var(--selected-outline-style);
      outline-width: var(--selected-outline-width);
    }

    .contents.selected .theme-icon {
      color: var(--vscode-list-inactiveSelectionIconForeground);
    }

    .contents.focused {
      background-color: var(--vscode-list-inactiveFocusBackground);
      outline: 1px dotted var(--vscode-list-inactiveFocusOutline);
    }

    :host(:focus) .contents.focused {
      outline: 1px solid var(--vscode-list-focusOutline);
    }

    :host([indent-guides]) ul ul:before {
      background-color: var(--vscode-tree-inactiveIndentGuidesStroke);
    }

    :host([indent-guides]) ul ul.has-active-item:before {
      background-color: var(--vscode-tree-indentGuidesStroke);
    }
  `,
    ];

    var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    const ARROW_OUTER_WIDTH = 30;
    const ARROW_ICON_WIDTH = 16;
    const CONTENT_PADDING = 3;
    const addPath = (tree, prevPath = []) => {
        const nextTree = [];
        tree.forEach((item, index) => {
            const path = [...prevPath, index];
            const nextItem = {
                ...item,
                path,
            };
            if (item.subItems) {
                nextItem.subItems = addPath(item.subItems, path);
            }
            nextTree.push(nextItem);
        });
        return nextTree;
    };
    const isBranch = (item) => {
        if (item.subItems &&
            Array.isArray(item.subItems) &&
            item?.subItems?.length > 0) {
            return true;
        }
        return false;
    };
    /**
     * @tag vscode-tree
     *
     * @fires vsc-select Dispatched when an item is selected.
     * @fires {VscTreeSelectEvent} vsc-tree-select Dispatched when an item is selected.
     * @fires vsc-run-action Dispatched when an action icon is clicked.
     * @fires {VscTreeActionEvent} vsc-tree-action Dispatched when an action icon is clicked.
     *
     * @cssprop --vscode-focusBorder
     * @cssprop --vscode-font-family
     * @cssprop --vscode-font-size
     * @cssprop --vscode-font-weight
     * @cssprop --vscode-list-hoverForeground
     * @cssprop --vscode-list-hoverBackground
     * @cssprop --vscode-list-inactiveSelectionBackground
     * @cssprop --vscode-list-inactiveSelectionForeground
     * @cssprop --vscode-list-activeSelectionBackground
     * @cssprop --vscode-list-activeSelectionForeground
     * @cssprop --vscode-list-inactiveSelectionIconForeground
     * @cssprop --vscode-list-inactiveFocusBackground
     * @cssprop --vscode-list-inactiveFocusOutline
     * @cssprop --vscode-list-focusOutline
     * @cssprop --vscode-tree-inactiveIndentGuidesStroke
     * @cssprop --vscode-tree-indentGuidesStroke
     *
     * @csspart text-content
     * @csspart description
     * @csspart counter-badge-decoration
     * @csspart filled-circle-decoration
     * @csspart caption-decoration
     * @csspart decorations Container of decorations
     */
    let VscodeTree = class VscodeTree extends VscElement {
        constructor() {
            super(...arguments);
            this.indent = 8;
            this.arrows = false;
            this.multiline = false;
            this.tabindex = 0;
            this.indentGuides = false;
            this._data = [];
            this._selectedItem = null;
            this._focusedItem = null;
            this._selectedBranch = null;
            this._focusedBranch = null;
            this._handleComponentKeyDownBound = this._handleComponentKeyDown.bind(this);
        }
        set data(val) {
            const oldVal = this._data;
            this._data = addPath(val);
            this.requestUpdate('data', oldVal);
        }
        get data() {
            return this._data;
        }
        /**
         * Closes all opened tree items recursively.
         */
        closeAll() {
            this._closeSubTreeRecursively(this.data);
            this.requestUpdate();
        }
        /**
         * Deselects all selected items.
         */
        deselectAll() {
            this._deselectItemsRecursively(this.data);
            this.requestUpdate();
        }
        /**
         * Returns a reference to a TreeItem object by path.
         * @param path
         * @returns
         */
        getItemByPath(path) {
            return this._getItemByPath(path);
        }
        connectedCallback() {
            super.connectedCallback();
            this.addEventListener('keydown', this._handleComponentKeyDownBound);
        }
        disconnectedCallback() {
            super.disconnectedCallback();
            this.removeEventListener('keydown', this._handleComponentKeyDownBound);
        }
        _getItemByPath(path) {
            let current = this._data;
            let item = null;
            path.forEach((el, i) => {
                if (i === path.length - 1) {
                    item = current[el];
                }
                else {
                    current = current[el].subItems;
                }
            });
            return item;
        }
        _handleActionClick(ev) {
            ev.stopPropagation();
            const el = ev.target;
            const itemPath = el.dataset.itemPath;
            const actionIndex = el.dataset.index;
            let item = null;
            let actionId = '';
            let value = '';
            if (itemPath) {
                const path = itemPath.split('/').map((p) => Number(p));
                item = this._getItemByPath(path);
                if (item?.actions) {
                    const index = Number(actionIndex);
                    if (item.actions[index]) {
                        actionId = item.actions[index].actionId;
                    }
                }
                if (item?.value) {
                    value = item.value;
                }
            }
            /** @deprecated Renamed to `vsc-tree-action` */
            this.dispatchEvent(new CustomEvent('vsc-run-action', {
                detail: {
                    actionId,
                    item,
                    value,
                },
            }));
            /**
             * Dispatched when an action icon is clicked.
             */
            this.dispatchEvent(new CustomEvent('vsc-tree-action', {
                detail: {
                    actionId,
                    item,
                    value,
                },
            }));
        }
        _renderIconVariant(variant) {
            const { type, value } = variant;
            if (type === 'themeicon') {
                return x `<vscode-icon name=${value} class="theme-icon"></vscode-icon>`;
            }
            else {
                return x `<span
        class="image-icon"
        .style=${stylePropertyMap({ backgroundImage: `url(${value})` })}
      ></span>`;
            }
        }
        _renderIcon(item) {
            const iconVariants = {
                branch: {
                    value: 'folder',
                    type: 'themeicon',
                },
                open: {
                    value: 'folder-opened',
                    type: 'themeicon',
                },
                leaf: {
                    value: 'file',
                    type: 'themeicon',
                },
            };
            if (item.iconUrls) {
                if (item.iconUrls.branch) {
                    iconVariants.branch = {
                        value: item.iconUrls.branch,
                        type: 'image',
                    };
                }
                if (item.iconUrls.leaf) {
                    iconVariants.leaf = {
                        value: item.iconUrls.leaf,
                        type: 'image',
                    };
                }
                if (item.iconUrls.open) {
                    iconVariants.open = {
                        value: item.iconUrls.open,
                        type: 'image',
                    };
                }
            }
            else if (typeof item.icons === 'object') {
                if (item.icons.branch) {
                    iconVariants.branch = {
                        value: item.icons.branch,
                        type: 'themeicon',
                    };
                }
                if (item.icons.leaf) {
                    iconVariants.leaf = {
                        value: item.icons.leaf,
                        type: 'themeicon',
                    };
                }
                if (item.icons.open) {
                    iconVariants.open = {
                        value: item.icons.open,
                        type: 'themeicon',
                    };
                }
            }
            else if (!item.icons) {
                return x `${E}`;
            }
            if (isBranch(item)) {
                if (item.open) {
                    return this._renderIconVariant(iconVariants.open);
                }
                else {
                    return this._renderIconVariant(iconVariants.branch);
                }
            }
            else {
                return this._renderIconVariant(iconVariants.leaf);
            }
        }
        _renderArrow(item) {
            if (!this.arrows || !isBranch(item)) {
                return x `${E}`;
            }
            const { open = false } = item;
            const arrowIconName = open ? 'chevron-down' : 'chevron-right';
            return x `
      <div class="arrow-container">
        <vscode-icon name=${arrowIconName} class="icon-arrow"></vscode-icon>
      </div>
    `;
        }
        _renderActions(item) {
            const actionButtons = [];
            if (item.actions && Array.isArray(item.actions)) {
                item.actions.forEach((action, index) => {
                    if (action.icon) {
                        const icon = x `<vscode-icon
            name=${action.icon}
            action-icon
            title=${o(action.tooltip)}
            data-item-path=${o(item.path?.join('/'))}
            data-index=${index}
            class="action-icon"
            @click=${this._handleActionClick}
          ></vscode-icon>`;
                        actionButtons.push(icon);
                    }
                });
            }
            if (actionButtons.length > 0) {
                return x `<div class="actions">${actionButtons}</div>`;
            }
            else {
                return x `${E}`;
            }
        }
        _renderDecorations(item) {
            const decorations = [];
            if (item.decorations && Array.isArray(item.decorations)) {
                item.decorations.forEach((decoration) => {
                    const { appearance = 'text', visibleWhen = 'always', content = '', color = '', focusedColor = '', hoverColor = '', selectedColor = '', } = decoration;
                    const visibleWhenClass = `visible-when-${visibleWhen}`;
                    const inlineStyles = {};
                    if (color) {
                        inlineStyles['--color'] = color;
                    }
                    if (focusedColor) {
                        inlineStyles['--focused-color'] = focusedColor;
                    }
                    if (hoverColor) {
                        inlineStyles['--hover-color'] = hoverColor;
                    }
                    if (selectedColor) {
                        inlineStyles['--selected-color'] = selectedColor;
                    }
                    switch (appearance) {
                        case 'counter-badge':
                            decorations.push(x `<vscode-badge
                variant="counter"
                class=${['counter-badge', visibleWhenClass].join(' ')}
                part="counter-badge-decoration"
                >${content}</vscode-badge
              >`);
                            break;
                        case 'filled-circle':
                            decorations.push(x `<vscode-icon
                name="circle-filled"
                size="14"
                class=${['filled-circle', visibleWhenClass].join(' ')}
                part="filled-circle-decoration"
                .style=${stylePropertyMap(inlineStyles)}
              ></vscode-icon>`);
                            break;
                        case 'text':
                            decorations.push(x `<div
                class=${['decoration-text', visibleWhenClass].join(' ')}
                part="caption-decoration"
                .style=${stylePropertyMap(inlineStyles)}
              >
                ${content}
              </div>`);
                            break;
                    }
                });
            }
            if (decorations.length > 0) {
                return x `<div class="decorations" part="decorations">
        ${decorations}
      </div>`;
            }
            else {
                return x `${E}`;
            }
        }
        _renderTreeItem(item, additionalOptions) {
            const { open = false, label, description = '', tooltip, selected = false, focused = false, subItems = [], } = item;
            const { path, itemType, hasFocusedItem = false, hasSelectedItem = false, } = additionalOptions;
            const indentLevel = path.length - 1;
            const contentsClasses = ['contents'];
            const liClasses = open ? ['open'] : [];
            const indentSize = indentLevel * this.indent;
            const padLeft = this.arrows && itemType === 'leaf'
                ? ARROW_OUTER_WIDTH + indentSize
                : indentSize;
            const arrowMarkup = this._renderArrow(item);
            const iconMarkup = this._renderIcon(item);
            const indentGuidePos = this.arrows
                ? indentSize + ARROW_ICON_WIDTH
                : indentSize + CONTENT_PADDING;
            const subTreeMarkup = open && itemType === 'branch'
                ? x `<ul
            .style=${stylePropertyMap({
                '--indent-guide-pos': `${indentGuidePos}px`,
            })}
            class=${e({
                'has-active-item': hasFocusedItem || hasSelectedItem,
            })}
          >
            ${this._renderTree(subItems, path)}
          </ul>`
                : E;
            const descriptionMarkup = description
                ? x `<span class="description" part="description">${description}</span>`
                : E;
            const actionsMarkup = this._renderActions(item);
            const decorationsMarkup = this._renderDecorations(item);
            liClasses.push(itemType);
            if (selected) {
                contentsClasses.push('selected');
            }
            if (focused) {
                contentsClasses.push('focused');
            }
            return x `
      <li data-path=${path.join('/')} class=${liClasses.join(' ')}>
        <div
          class=${contentsClasses.join(' ')}
          .style=${stylePropertyMap({
            paddingLeft: `${padLeft + CONTENT_PADDING}px`,
        })}
        >
          ${arrowMarkup}${iconMarkup}<span
            class="text-content"
            part="text-content"
            title=${o(tooltip)}
            >${label}${descriptionMarkup}</span
          >
          ${actionsMarkup} ${decorationsMarkup}
        </div>
        ${subTreeMarkup}
      </li>
    `;
        }
        _renderTree(tree, oldPath = []) {
            const ret = [];
            if (!tree) {
                return E;
            }
            tree.forEach((item, index) => {
                const path = [...oldPath, index];
                const itemType = isBranch(item) ? 'branch' : 'leaf';
                const { selected = false, focused = false, hasFocusedItem = false, hasSelectedItem = false, } = item;
                if (selected) {
                    this._selectedItem = item;
                }
                if (focused) {
                    this._focusedItem = item;
                }
                ret.push(this._renderTreeItem(item, {
                    path,
                    itemType,
                    hasFocusedItem,
                    hasSelectedItem,
                }));
            });
            return ret;
        }
        _selectItem(item) {
            if (this._selectedItem) {
                this._selectedItem.selected = false;
            }
            if (this._focusedItem) {
                this._focusedItem.focused = false;
            }
            this._selectedItem = item;
            item.selected = true;
            this._focusedItem = item;
            item.focused = true;
            if (this._selectedBranch) {
                this._selectedBranch.hasSelectedItem = false;
            }
            let parentBranch = null;
            if (item.path?.length && item.path.length > 1) {
                parentBranch = this._getItemByPath(item.path.slice(0, -1));
            }
            if (isBranch(item)) {
                this._selectedBranch = item;
                item.hasSelectedItem = true;
                item.open = !item.open;
                if (!item.open) {
                    if (parentBranch) {
                        this._selectedBranch = parentBranch;
                        parentBranch.hasSelectedItem = true;
                    }
                }
                else {
                    this._selectedBranch = item;
                    item.hasSelectedItem = true;
                }
            }
            else {
                if (item.path?.length && item.path.length > 1) {
                    const parentBranch = this._getItemByPath(item.path.slice(0, -1));
                    if (parentBranch) {
                        this._selectedBranch = parentBranch;
                        parentBranch.hasSelectedItem = true;
                    }
                }
                else {
                    this._selectedBranch = item;
                    item.hasSelectedItem = true;
                }
            }
            this._emitSelectEvent(this._selectedItem, this._selectedItem.path.join('/'));
            this.requestUpdate();
        }
        _focusItem(item) {
            if (this._focusedItem) {
                this._focusedItem.focused = false;
            }
            this._focusedItem = item;
            item.focused = true;
            const isBranch = !!item?.subItems?.length;
            if (this._focusedBranch) {
                this._focusedBranch.hasFocusedItem = false;
            }
            let parentBranch = null;
            if (item.path?.length && item.path.length > 1) {
                parentBranch = this._getItemByPath(item.path.slice(0, -1));
            }
            if (!isBranch) {
                if (parentBranch) {
                    this._focusedBranch = parentBranch;
                    parentBranch.hasFocusedItem = true;
                }
            }
            else {
                if (item.open) {
                    this._focusedBranch = item;
                    item.hasFocusedItem = true;
                }
                else if (!item.open && parentBranch) {
                    this._focusedBranch = parentBranch;
                    parentBranch.hasFocusedItem = true;
                }
            }
        }
        _closeSubTreeRecursively(tree) {
            tree.forEach((item) => {
                item.open = false;
                if (item.subItems && item.subItems.length > 0) {
                    this._closeSubTreeRecursively(item.subItems);
                }
            });
        }
        _deselectItemsRecursively(tree) {
            tree.forEach((item) => {
                if (item.selected) {
                    item.selected = false;
                }
                if (item.subItems && item.subItems.length > 0) {
                    this._deselectItemsRecursively(item.subItems);
                }
            });
        }
        _emitSelectEvent(item, path) {
            const { icons, label, open, value } = item;
            const detail = {
                icons,
                itemType: isBranch(item) ? 'branch' : 'leaf',
                label,
                open: open || false,
                value: value || label,
                path,
            };
            /** @deprecated Renamed to `vsc-tree-select` */
            this.dispatchEvent(new CustomEvent('vsc-select', {
                bubbles: true,
                composed: true,
                detail,
            }));
            this.dispatchEvent(new CustomEvent('vsc-tree-select', {
                detail,
            }));
        }
        _focusPrevItem() {
            if (!this._focusedItem) {
                this._focusItem(this._data[0]);
                return;
            }
            const { path } = this._focusedItem;
            if (path && path?.length > 0) {
                const currentItemIndex = path[path.length - 1];
                const hasParent = path.length > 1;
                if (currentItemIndex > 0) {
                    const newPath = [...path];
                    newPath[newPath.length - 1] = currentItemIndex - 1;
                    const prevSibling = this._getItemByPath(newPath);
                    let newFocusedItem = prevSibling;
                    if (prevSibling?.open && prevSibling.subItems?.length) {
                        const { subItems } = prevSibling;
                        newFocusedItem = subItems[subItems.length - 1];
                    }
                    this._focusItem(newFocusedItem);
                }
                else {
                    if (hasParent) {
                        const newPath = [...path];
                        newPath.pop();
                        this._focusItem(this._getItemByPath(newPath));
                    }
                }
            }
            else {
                this._focusItem(this._data[0]);
            }
        }
        _focusNextItem() {
            if (!this._focusedItem) {
                this._focusItem(this._data[0]);
                return;
            }
            const { path, open } = this._focusedItem;
            if (open &&
                Array.isArray(this._focusedItem.subItems) &&
                this._focusedItem.subItems.length > 0) {
                this._focusItem(this._focusedItem.subItems[0]);
                return;
            }
            const nextPath = [...path];
            nextPath[nextPath.length - 1] += 1;
            let nextFocusedItem = this._getItemByPath(nextPath);
            if (nextFocusedItem) {
                this._focusItem(nextFocusedItem);
            }
            else {
                nextPath.pop();
                if (nextPath.length > 0) {
                    nextPath[nextPath.length - 1] += 1;
                    nextFocusedItem = this._getItemByPath(nextPath);
                    if (nextFocusedItem) {
                        this._focusItem(nextFocusedItem);
                    }
                }
            }
        }
        _handleClick(event) {
            const composedPath = event.composedPath();
            const targetElement = composedPath.find((el) => el.tagName &&
                el.tagName.toUpperCase() === 'LI');
            if (targetElement) {
                const pathStr = targetElement.dataset.path || '';
                const path = pathStr.split('/').map((el) => Number(el));
                const item = this._getItemByPath(path);
                this._selectItem(item);
            }
            else {
                if (this._focusedItem) {
                    this._focusedItem.focused = false;
                }
                this._focusedItem = null;
            }
        }
        _handleComponentKeyDown(ev) {
            const keys = [
                ' ',
                'ArrowDown',
                'ArrowUp',
                'Enter',
                'Escape',
            ];
            const key = ev.key;
            if (keys.includes(ev.key)) {
                ev.stopPropagation();
                ev.preventDefault();
            }
            if (key === 'Escape') {
                this._focusedItem = null;
            }
            if (key === 'ArrowUp') {
                this._focusPrevItem();
            }
            if (key === 'ArrowDown') {
                this._focusNextItem();
            }
            if (key === 'Enter' || key === ' ') {
                if (this._focusedItem) {
                    this._selectItem(this._focusedItem);
                }
            }
        }
        render() {
            const classes = e({
                multi: this.multiline,
                single: !this.multiline,
                wrapper: true,
                'has-not-focused-item': !this._focusedItem,
                'selection-none': !this._selectedItem,
                'selection-single': this._selectedItem !== null,
            });
            return x `
      <div @click=${this._handleClick} class=${classes}>
        <ul>
          ${this._renderTree(this._data)}
        </ul>
      </div>
    `;
        }
    };
    VscodeTree.styles = styles;
    __decorate([
        n$1({ type: Array, reflect: false })
    ], VscodeTree.prototype, "data", null);
    __decorate([
        n$1({ type: Number })
    ], VscodeTree.prototype, "indent", void 0);
    __decorate([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTree.prototype, "arrows", void 0);
    __decorate([
        n$1({ type: Boolean, reflect: true })
    ], VscodeTree.prototype, "multiline", void 0);
    __decorate([
        n$1({ type: Number, reflect: true })
    ], VscodeTree.prototype, "tabindex", void 0);
    __decorate([
        n$1({ type: Boolean, reflect: true, attribute: 'indent-guides' })
    ], VscodeTree.prototype, "indentGuides", void 0);
    __decorate([
        r$2()
    ], VscodeTree.prototype, "_selectedItem", void 0);
    __decorate([
        r$2()
    ], VscodeTree.prototype, "_focusedItem", void 0);
    __decorate([
        r$2()
    ], VscodeTree.prototype, "_selectedBranch", void 0);
    __decorate([
        r$2()
    ], VscodeTree.prototype, "_focusedBranch", void 0);
    VscodeTree = __decorate([
        customElement('vscode-tree')
    ], VscodeTree);

    var _default = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get VscodeBadge () { return VscodeBadge; },
        get VscodeButton () { return VscodeButton; },
        get VscodeButtonGroup () { return VscodeButtonGroup; },
        get VscodeCheckbox () { return VscodeCheckbox; },
        get VscodeCheckboxGroup () { return VscodeCheckboxGroup; },
        get VscodeCollapsible () { return VscodeCollapsible; },
        get VscodeContextMenu () { return VscodeContextMenu; },
        get VscodeContextMenuItem () { return VscodeContextMenuItem; },
        get VscodeDivider () { return VscodeDivider; },
        get VscodeFormContainer () { return VscodeFormContainer; },
        get VscodeFormGroup () { return VscodeFormGroup; },
        get VscodeFormHelper () { return VscodeFormHelper; },
        get VscodeIcon () { return VscodeIcon; },
        get VscodeLabel () { return VscodeLabel; },
        get VscodeMultiSelect () { return VscodeMultiSelect; },
        get VscodeOption () { return VscodeOption; },
        get VscodeProgressRing () { return VscodeProgressRing; },
        get VscodeRadio () { return VscodeRadio; },
        get VscodeRadioGroup () { return VscodeRadioGroup; },
        get VscodeScrollable () { return VscodeScrollable; },
        get VscodeSingleSelect () { return VscodeSingleSelect; },
        get VscodeSplitLayout () { return VscodeSplitLayout; },
        get VscodeTabHeader () { return VscodeTabHeader; },
        get VscodeTabPanel () { return VscodeTabPanel; },
        get VscodeTable () { return VscodeTable; },
        get VscodeTableBody () { return VscodeTableBody; },
        get VscodeTableCell () { return VscodeTableCell; },
        get VscodeTableHeader () { return VscodeTableHeader; },
        get VscodeTableHeaderCell () { return VscodeTableHeaderCell; },
        get VscodeTableRow () { return VscodeTableRow; },
        get VscodeTabs () { return VscodeTabs; },
        get VscodeTextarea () { return VscodeTextarea; },
        get VscodeTextfield () { return VscodeTextfield; },
        get VscodeToolbarButton () { return VscodeToolbarButton; },
        get VscodeToolbarContainer () { return VscodeToolbarContainer; },
        get VscodeTree () { return VscodeTree; }
    });

    var _virtual_index = { _default };

    return _virtual_index;

})();


	npmCompilation['1608514c9acd4a97df63533df1b9d0fd'] = {};
npmCompilation['1608514c9acd4a97df63533df1b9d0fd']['VscodeElement'] = _['_default'];

})(npmCompilation);
Object.defineProperty(window, "AvInstance", {
	get() {return Aventus.Instance;}
});

(() => {
	Map.prototype._defaultHas = Map.prototype.has;
	Map.prototype._defaultSet = Map.prototype.set;
	Map.prototype._defaultGet = Map.prototype.get;
	Map.prototype.has = function(key) {
		if(Aventus.Watcher?.is(key)) {
			return Map.prototype._defaultHas.call(this,key.getTarget())
		}
		return Map.prototype._defaultHas.call(this,key);
	}

	Map.prototype.set = function(key, value) {
		if(Aventus.Watcher?.is(key)) {
			return Map.prototype._defaultSet.call(this, key.getTarget(), value)
		}
		return Map.prototype._defaultSet.call(this, key, value);
	}
	Map.prototype.get = function(key) {
		if(Aventus.Watcher?.is(key)) {
			return Map.prototype._defaultGet.call(this, key.getTarget())
		}
		return Map.prototype._defaultGet.call(this, key);
	}
})();

var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const moduleName = `Aventus`;
const _ = {};


let _n;
let DateConverter=class DateConverter {
    static __converter = new DateConverter();
    static get converter() {
        return this.__converter;
    }
    static set converter(value) {
        this.__converter = value;
    }
    isStringDate(txt) {
        return /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/.exec(txt) !== null;
    }
    fromString(txt) {
        return new Date(txt);
    }
    toString(date) {
        if (date.getFullYear() < 100) {
            return "0001-01-01T00:00:00.000Z";
        }
        return date.toISOString();
    }
}
DateConverter.Namespace=`Aventus`;
_.DateConverter=DateConverter;

var HttpErrorCode;
(function (HttpErrorCode) {
    HttpErrorCode[HttpErrorCode["unknow"] = 0] = "unknow";
})(HttpErrorCode || (HttpErrorCode = {}));
_.HttpErrorCode=HttpErrorCode;

var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["POST"] = "POST";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["OPTION"] = "OPTION";
})(HttpMethod || (HttpMethod = {}));
_.HttpMethod=HttpMethod;

let CallbackGroup=class CallbackGroup {
    callbacks = {};
    /**
     * Clear all callbacks
     */
    clearAll() {
        this.callbacks = {};
    }
    /**
     * Clear all callbacks for a specific group
     */
    clear(group) {
        delete this.callbacks[group];
    }
    /**
     * Add a callback for a group
     */
    add(group, cb, scope = null) {
        if (!this.callbacks[group]) {
            this.callbacks[group] = new Map();
        }
        if (!this.callbacks[group].has(cb)) {
            this.callbacks[group].set(cb, scope);
        }
    }
    /**
     * Remove a callback for a group
     */
    remove(group, cb) {
        if (this.callbacks[group]) {
            this.callbacks[group].delete(cb);
        }
    }
    /**
     * Trigger all callbacks inside a group
     */
    trigger(group, ...args) {
        if (this.callbacks[group]) {
            let cbs = [...this.callbacks[group]];
            for (let [cb, scope] of cbs) {
                cb.apply(scope, args);
            }
        }
    }
}
CallbackGroup.Namespace=`Aventus`;
_.CallbackGroup=CallbackGroup;

var RamErrorCode;
(function (RamErrorCode) {
    RamErrorCode[RamErrorCode["unknow"] = 0] = "unknow";
    RamErrorCode[RamErrorCode["noId"] = 1] = "noId";
    RamErrorCode[RamErrorCode["noItemInsideRam"] = 2] = "noItemInsideRam";
})(RamErrorCode || (RamErrorCode = {}));
_.RamErrorCode=RamErrorCode;

let isClass=function isClass(v) {
    return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
}
_.isClass=isClass;

let isSubclassOf=function isSubclassOf(subClass, superClass) {
    if (typeof subClass !== 'function' || typeof superClass !== 'function')
        return false;
    let proto = subClass.prototype;
    while (proto) {
        if (proto === superClass.prototype)
            return true;
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}
_.isSubclassOf=isSubclassOf;

let uuidv4=function uuidv4() {
    let uid = '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16));
    return uid;
}
_.uuidv4=uuidv4;

let sleep=function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
_.sleep=sleep;

let ActionGuard=class ActionGuard {
    /**
     * Map to store actions that are currently running.
     * @type {Map<any[], ((res: any) => void)[]>}
     * @private
     */
    runningAction = new Map();
    run(keys, action) {
        return new Promise(async (resolve) => {
            if (typeof keys == 'function') {
                action = keys;
                keys = [];
            }
            if (!action) {
                throw "No action inside the Mutex.run";
            }
            let actions = undefined;
            let runningKeys = Array.from(this.runningAction.keys());
            for (let runningKey of runningKeys) {
                if (runningKey.length == keys.length) {
                    let found = true;
                    for (let i = 0; i < keys.length; i++) {
                        if (runningKey[i] != keys[i]) {
                            found = false;
                            break;
                        }
                    }
                    if (found) {
                        actions = this.runningAction.get(runningKey);
                        break;
                    }
                }
            }
            if (actions) {
                actions.push((res) => {
                    resolve(res);
                });
            }
            else {
                this.runningAction.set(keys, []);
                let res = await action();
                let actions = this.runningAction.get(keys);
                if (actions) {
                    for (let action of actions) {
                        action(res);
                    }
                }
                this.runningAction.delete(keys);
                resolve(res);
            }
        });
    }
}
ActionGuard.Namespace=`Aventus`;
_.ActionGuard=ActionGuard;

let DragElementXYType= [SVGGElement, SVGRectElement, SVGEllipseElement, SVGTextElement];
_.DragElementXYType=DragElementXYType;

let DragElementLeftTopType= [HTMLElement, SVGSVGElement];
_.DragElementLeftTopType=DragElementLeftTopType;

let ElementExtension=class ElementExtension {
    /**
     * Find a parent by custom check
     */
    static findParent(element, check, untilNode) {
        let el = element;
        if (el) {
            if (el instanceof ShadowRoot) {
                el = el.host;
            }
            else {
                el = el.parentNode;
            }
        }
        while (el) {
            if (check(el)) {
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
     * Find a list of parent by custom check
     */
    static findParents(element, check, untilNode) {
        let result = [];
        let el = element;
        if (el) {
            if (el instanceof ShadowRoot) {
                el = el.host;
            }
            else {
                el = el.parentNode;
            }
        }
        while (el) {
            if (check(el)) {
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
     * Find a parent by tagname if exist Static.findParentByTag(this, "av-img")
     */
    static findParentByTag(element, tagname, untilNode) {
        if (Array.isArray(tagname)) {
            for (let i = 0; i < tagname.length; i++) {
                tagname[i] = tagname[i].toLowerCase();
            }
        }
        else {
            tagname = [tagname.toLowerCase()];
        }
        const checkFunc = (el) => {
            return tagname.indexOf((el.nodeName || el.tagName).toLowerCase()) != -1;
        };
        return this.findParent(element, checkFunc, untilNode);
    }
    /**
     * Find a parent by class name if exist Static.findParentByClass(this, "my-class-img") = querySelector('.my-class-img')
     */
    static findParentByClass(element, classname, untilNode) {
        if (!Array.isArray(classname)) {
            classname = [classname];
        }
        const check = (el) => {
            for (let classnameTemp of classname) {
                if (el['classList'] && el['classList'].contains(classnameTemp)) {
                    return true;
                }
            }
            return false;
        };
        return this.findParent(element, check, untilNode);
    }
    static findParentByType(element, types, untilNode) {
        if (!Array.isArray(types)) {
            types = [types];
        }
        let isValid = true;
        for (let type of types) {
            if (typeof type == "function" && type['prototype']['constructor'])
                continue;
            isValid = false;
        }
        if (isValid) {
            let checkFunc = (el) => {
                for (let type of types) {
                    const t = type;
                    if (el instanceof t) {
                        return true;
                    }
                }
                return false;
            };
            return this.findParent(element, checkFunc, untilNode);
        }
        console.error("you must provide a class inside this function");
        return null;
    }
    /**
     * Find list of parents by tagname
     */
    static findParentsByTag(element, tagname, untilNode) {
        let el = element;
        if (Array.isArray(tagname)) {
            for (let i = 0; i < tagname.length; i++) {
                tagname[i] = tagname[i].toLowerCase();
            }
        }
        else {
            tagname = [tagname.toLowerCase()];
        }
        let check = (el) => {
            return tagname.indexOf((el.nodeName || el['tagName']).toLowerCase()) != -1;
        };
        return this.findParents(element, check, untilNode);
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
     * Get element inside slot
     */
    static getNodesInSlot(element, slotName) {
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
                var listChild = Array.from(slotEl.assignedNodes());
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
                    else if (child instanceof Node) {
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
            styleNode.innerHTML = Style.getAsString(name);
            document.getElementsByTagName('head')[0].appendChild(styleNode);
        }
    }
    static refreshHead(name) {
        const styleNode = document.head.querySelector(`style[data-name="${name}"]`);
        if (styleNode) {
            styleNode.innerHTML = Style.getAsString(name);
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
            console.error(e);
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
            console.error(e);
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
                console.error(e);
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
                console.error(e);
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

let EffectNoRecomputed=class EffectNoRecomputed extends Effect {
    init() {
        this.isInit = true;
        Watcher._registering.push(this);
        this.fct();
        Watcher._registering.splice(Watcher._registering.length - 1, 1);
    }
    run() {
        if (!this.isInit) {
            this.init();
        }
    }
}
EffectNoRecomputed.Namespace=`Aventus`;
_.EffectNoRecomputed=EffectNoRecomputed;

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
    dragDirection;
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
        downActionDelay: (e) => { },
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
        this.dragDirection = 'XY';
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
        if (options.dragDirection !== undefined) {
            this.dragDirection = options.dragDirection;
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
        this.functionsBinded.downActionDelay = this.downActionDelay.bind(this);
        this.functionsBinded.moveAction = this.moveAction.bind(this);
        this.functionsBinded.upAction = this.upAction.bind(this);
        this.functionsBinded.childPressStart = this.childPressStart.bind(this);
        this.functionsBinded.childPressEnd = this.childPressEnd.bind(this);
        this.functionsBinded.childPressMove = this.childPressMove.bind(this);
    }
    init() {
        this.bindAllFunction();
        this.element.addEventListener("pointerdown", this.functionsBinded.downAction);
        this.element.addEventListener("touchstart", this.functionsBinded.downActionDelay);
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
        this.startPosition = { x: e.pageX, y: e.pageY };
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
    pointerEventTriggered = false;
    downActionDelay(ev) {
        if (!this.pointerEventTriggered) {
            this.downAction(ev);
        }
        else {
            ev.stopImmediatePropagation();
        }
        setTimeout(() => {
            this.pointerEventTriggered = false;
        }, 0);
    }
    downAction(ev) {
        this.pointerEventTriggered = true;
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
            let distance = 0;
            if (this.dragDirection == 'XY')
                distance = Math.sqrt(xDist * xDist + yDist * yDist);
            else if (this.dragDirection == 'X')
                distance = Math.abs(xDist);
            else
                distance = Math.abs(yDist);
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
        this.unregisterEvent(e.detail.realEvent.event);
        if (Object.values(this.pointersRecord).length == 0) {
            document.removeEventListener("pointerup", this.functionsBinded.upAction);
            document.removeEventListener("pointercancel", this.functionsBinded.upAction);
            document.removeEventListener("touchend", this.functionsBinded.upAction);
            document.removeEventListener("touchcancel", this.functionsBinded.upAction);
            document.removeEventListener("pointermove", this.functionsBinded.moveAction);
        }
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
    findParentsByTag(tagname, untilNode) {
        return ElementExtension.findParentsByTag(this, tagname, untilNode);
    }
    /**
     * Find list of parents by custom check
     */
    findParents(tagname, check, untilNode) {
        return ElementExtension.findParents(this, check, untilNode);
    }
    /**
     * Find list of parents by custom check
     */
    findParent(tagname, check, untilNode) {
        return ElementExtension.findParent(this, check, untilNode);
    }
    /**
     * Check if element contains a child
     */
    containsChild(el) {
        return ElementExtension.containsChild(this, el);
    }
    /**
     * Get elements inside slot
     */
    getElementsInSlot(slotName) {
        return ElementExtension.getElementsInSlot(this, slotName);
    }
    /**
     * Get nodes inside slot
     */
    getNodesInSlot(slotName) {
        return ElementExtension.getNodesInSlot(this, slotName);
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

let ResizeObserver=class ResizeObserver {
    callback;
    targets;
    fpsInterval = -1;
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
            ResizeObserver.getUniqueInstance().observe(target);
        }
        if (!ResizeObserver.resizeObserverClassByObject[target["sourceIndex"]]) {
            ResizeObserver.resizeObserverClassByObject[target["sourceIndex"]] = [];
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
ResizeObserver.Namespace=`Aventus`;
_.ResizeObserver=ResizeObserver;

let Animation=class Animation {
    /**
     * Default FPS for all Animation if not set inside options
     */
    static FPS_DEFAULT = 60;
    options;
    nextFrame = 0;
    fpsInterval;
    continueAnimation = false;
    frame_id = 0;
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
        this.fpsInterval = 1000 / options.fps;
    }
    animate() {
        let now = window.performance.now();
        let elapsed = now - this.nextFrame;
        if (elapsed <= this.fpsInterval) {
            this.frame_id = requestAnimationFrame(() => this.animate());
            return;
        }
        this.nextFrame = now - (elapsed % this.fpsInterval);
        setTimeout(() => {
            this.options.animate();
        }, 0);
        if (this.continueAnimation) {
            this.frame_id = requestAnimationFrame(() => this.animate());
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
     * Stop the animation
     */
    immediateStop() {
        cancelAnimationFrame(this.frame_id);
        this.continueAnimation = false;
        this.options.stopped();
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
Animation.Namespace=`Aventus`;
_.Animation=Animation;

let DragAndDrop=class DragAndDrop {
    /**
     * Default offset before drag element
     */
    static defaultOffsetDrag = 20;
    pressManager;
    options;
    startCursorPosition = { x: 0, y: 0 };
    startElementPosition = { x: 0, y: 0 };
    isEnable = true;
    draggableElement;
    constructor(options) {
        this.options = this.getDefaultOptions(options.element);
        this.mergeProperties(options);
        this.mergeFunctions(options);
        this.options.elementTrigger.style.touchAction = 'none';
        this.pressManager = new PressManager({
            element: this.options.elementTrigger,
            onPressStart: this.onPressStart.bind(this),
            onPressEnd: this.onPressEnd.bind(this),
            onDragStart: this.onDragStart.bind(this),
            onDrag: this.onDrag.bind(this),
            onDragEnd: this.onDragEnd.bind(this),
            offsetDrag: this.options.offsetDrag,
            dragDirection: this.options.dragDirection,
            stopPropagation: this.options.stopPropagation
        });
    }
    getDefaultOptions(element) {
        return {
            applyDrag: true,
            element: element,
            elementTrigger: element,
            offsetDrag: DragAndDrop.defaultOffsetDrag,
            dragDirection: 'XY',
            shadow: {
                enable: false,
                container: document.body,
                removeOnStop: true,
                transform: () => { },
                delete: (el) => {
                    el.remove();
                }
            },
            strict: false,
            targets: [],
            usePercent: false,
            stopPropagation: true,
            useMouseFinalPosition: false,
            useTransform: false,
            isDragEnable: () => true,
            getZoom: () => 1,
            getOffsetX: () => 0,
            getOffsetY: () => 0,
            onPointerDown: (e) => { },
            onPointerUp: (e) => { },
            onStart: (e) => { },
            onMove: (e) => { },
            onStop: (e) => { },
            onDrop: (element, targets) => { },
            correctPosition: (position) => position
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
        this.defaultMerge(options, "dragDirection");
        this.defaultMerge(options, "strict");
        this.defaultMerge(options, "targets");
        this.defaultMerge(options, "usePercent");
        this.defaultMerge(options, "stopPropagation");
        this.defaultMerge(options, "useMouseFinalPosition");
        this.defaultMerge(options, "useTransform");
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
            if (options.shadow.delete !== void 0) {
                this.options.shadow.delete = options.shadow.delete;
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
        this.defaultMerge(options, "correctPosition");
    }
    defaultMerge(options, name) {
        if (options[name] !== void 0) {
            this.options[name] = options[name];
        }
    }
    positionShadowRelativeToElement = { x: 0, y: 0 };
    onPressStart(e) {
        this.options.onPointerDown(e);
    }
    onPressEnd(e) {
        this.options.onPointerUp(e);
    }
    onDragStart(e) {
        this.isEnable = this.options.isDragEnable();
        if (!this.isEnable) {
            return false;
        }
        let draggableElement = this.options.element;
        this.startCursorPosition = {
            x: e.pageX,
            y: e.pageY
        };
        this.startElementPosition = this.getBoundingBoxRelative(draggableElement);
        if (this.options.shadow.enable) {
            draggableElement = this.options.element.cloneNode(true);
            let elBox = this.options.element.getBoundingClientRect();
            let containerBox = this.options.shadow.container.getBoundingClientRect();
            this.positionShadowRelativeToElement = {
                x: elBox.x - containerBox.x,
                y: elBox.y - containerBox.y
            };
            if (this.options.applyDrag) {
                draggableElement.style.position = "absolute";
                draggableElement.style.top = this.positionShadowRelativeToElement.y + this.options.getOffsetY() + 'px';
                draggableElement.style.left = this.positionShadowRelativeToElement.x + this.options.getOffsetX() + 'px';
                this.options.shadow.transform(draggableElement);
                this.options.shadow.container.appendChild(draggableElement);
            }
        }
        this.draggableElement = draggableElement;
        return this.options.onStart(e);
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
        let targets = this.options.useMouseFinalPosition ? this.getMatchingTargetsWithMousePosition({
            x: e.clientX,
            y: e.clientY
        }) : this.getMatchingTargets();
        let draggableElement = this.draggableElement;
        if (this.options.shadow.enable && this.options.shadow.removeOnStop) {
            this.options.shadow.delete(draggableElement);
        }
        if (targets.length > 0) {
            this.options.onDrop(this.options.element, targets);
        }
        this.options.onStop(e);
    }
    setPosition(position) {
        let draggableElement = this.draggableElement;
        if (this.options.usePercent) {
            let elementParent = this.getOffsetParent(draggableElement);
            if (elementParent instanceof HTMLElement) {
                let percentPosition = {
                    x: (position.x / elementParent.offsetWidth) * 100,
                    y: (position.y / elementParent.offsetHeight) * 100
                };
                percentPosition = this.options.correctPosition(percentPosition);
                if (this.options.applyDrag) {
                    draggableElement.style.left = percentPosition.x + '%';
                    draggableElement.style.top = percentPosition.y + '%';
                }
                return percentPosition;
            }
            else {
                console.error("Can't find parent. Contact an admin", draggableElement);
            }
        }
        else {
            position = this.options.correctPosition(position);
            if (this.options.applyDrag) {
                if (this.isLeftTopElement(draggableElement)) {
                    draggableElement.style.left = position.x + 'px';
                    draggableElement.style.top = position.y + 'px';
                }
                else {
                    if (this.options.useTransform) {
                        draggableElement.setAttribute("transform", `translate(${position.x},${position.y})`);
                    }
                    else {
                        draggableElement.style.left = position.x + 'px';
                        draggableElement.style.top = position.y + 'px';
                    }
                }
            }
        }
        return position;
    }
    getTargets() {
        if (typeof this.options.targets == "function") {
            return this.options.targets();
        }
        else {
            return this.options.targets;
        }
    }
    /**
     * Get targets within the current element position is matching
     */
    getMatchingTargets() {
        let draggableElement = this.draggableElement;
        let matchingTargets = [];
        let srcTargets = this.getTargets();
        for (let target of srcTargets) {
            let elementCoordinates = this.getBoundingBoxAbsolute(draggableElement);
            let targetCoordinates = this.getBoundingBoxAbsolute(target);
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
     * This function will return the targets that are matching with the mouse position
     * @param mouse The mouse position
     */
    getMatchingTargetsWithMousePosition(mouse) {
        let matchingTargets = [];
        if (this.options.shadow.enable == false || this.options.shadow.container == null) {
            console.warn("DragAndDrop : To use useMouseFinalPosition=true, you must enable shadow and set a container");
            return matchingTargets;
        }
        const container = this.options.shadow.container;
        let xCorrected = mouse.x - container.getBoundingClientRect().left;
        let yCorrected = mouse.y - container.getBoundingClientRect().top;
        for (let target of this.getTargets()) {
            if (this.isLeftTopElement(target)) {
                if (this.matchPosition(target, { x: mouse.x, y: mouse.y })) {
                    matchingTargets.push(target);
                }
            }
            else {
                if (this.matchPosition(target, { x: xCorrected, y: yCorrected })) {
                    matchingTargets.push(target);
                }
            }
        }
        return matchingTargets;
    }
    matchPosition(element, point) {
        let elementCoordinates = this.getBoundingBoxAbsolute(element);
        if (point.x >= elementCoordinates.x &&
            point.x <= elementCoordinates.x + elementCoordinates.width &&
            point.y >= elementCoordinates.y &&
            point.y <= elementCoordinates.y + elementCoordinates.height) {
            return true;
        }
        return false;
    }
    /**
     * Get element currently dragging
     */
    getElementDrag() {
        return this.options.element;
    }
    /**
     * Set targets where to drop
     */
    setTargets(targets) {
        this.options.targets = targets;
    }
    /**
     * Set targets where to drop
     */
    setTargetsFct(targets) {
        this.options.targets = targets;
    }
    /**
     * Destroy the current drag&drop instance
     */
    destroy() {
        this.pressManager.destroy();
    }
    isLeftTopElement(element) {
        for (let Type of DragElementLeftTopType) {
            if (element instanceof Type) {
                return true;
            }
        }
        return false;
    }
    isXYElement(element) {
        for (let Type of DragElementXYType) {
            if (element instanceof Type) {
                return true;
            }
        }
        return false;
    }
    getCoordinateFromAttribute(element) {
        if (this.options.useTransform) {
            const transform = element.getAttribute("transform");
            const tvalue = transform?.match(/translate\(([^,]+),([^,]+)\)/);
            const x = tvalue ? parseFloat(tvalue[1]) : 0;
            const y = tvalue ? parseFloat(tvalue[2]) : 0;
            return {
                x: x,
                y: y
            };
        }
        return {
            x: parseFloat(element.getAttribute("x")),
            y: parseFloat(element.getAttribute("y"))
        };
    }
    XYElementToRelativeBox(element) {
        let coordinates = this.getCoordinateFromAttribute(element);
        const width = parseFloat(element.getAttribute("width"));
        const height = parseFloat(element.getAttribute("height"));
        return {
            x: coordinates.x,
            y: coordinates.y,
            width: width,
            height: height,
            bottom: coordinates.y + height,
            right: coordinates.x + width,
            top: coordinates.y,
            left: coordinates.x,
            toJSON() {
                return JSON.stringify(this);
            }
        };
    }
    XYElementToAbsoluteBox(element) {
        let coordinates = this.getCoordinateFromAttribute(element);
        const parent = this.getOffsetParent(element);
        if (parent) {
            const box = parent.getBoundingClientRect();
            coordinates = {
                x: coordinates.x + box.x,
                y: coordinates.y + box.y
            };
        }
        const width = parseFloat(element.getAttribute("width"));
        const height = parseFloat(element.getAttribute("height"));
        return {
            x: coordinates.x,
            y: coordinates.y,
            width: width,
            height: height,
            bottom: coordinates.y + height,
            right: coordinates.x + width,
            top: coordinates.y,
            left: coordinates.x,
            toJSON() {
                return JSON.stringify(this);
            }
        };
    }
    getBoundingBoxAbsolute(element) {
        if (this.isLeftTopElement(element)) {
            if (element instanceof HTMLElement) {
                const bounds = element.getBoundingClientRect();
                return {
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    bottom: bounds.bottom,
                    right: bounds.right,
                    top: bounds.top,
                    left: bounds.left,
                    toJSON() {
                        return JSON.stringify(this);
                    }
                };
            }
        }
        else if (this.isXYElement(element)) {
            return this.XYElementToAbsoluteBox(element);
        }
        const parent = this.getOffsetParent(element);
        if (parent instanceof HTMLElement) {
            const rect = element.getBoundingClientRect();
            const rectParent = parent.getBoundingClientRect();
            const x = rect.left - rectParent.left;
            const y = rect.top - rectParent.top;
            return {
                x: x,
                y: y,
                width: rect.width,
                height: rect.height,
                bottom: y + rect.height,
                right: x + rect.width,
                left: rect.left - rectParent.left,
                top: rect.top - rectParent.top,
                toJSON() {
                    return JSON.stringify(this);
                }
            };
        }
        console.error("Element type not supported");
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            bottom: 0,
            right: 0,
            top: 0,
            left: 0,
            toJSON() {
                return JSON.stringify(this);
            }
        };
    }
    getBoundingBoxRelative(element) {
        if (this.isLeftTopElement(element)) {
            if (element instanceof HTMLElement) {
                return {
                    x: element.offsetLeft,
                    y: element.offsetTop,
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                    bottom: element.offsetTop + element.offsetHeight,
                    right: element.offsetLeft + element.offsetWidth,
                    top: element.offsetTop,
                    left: element.offsetLeft,
                    toJSON() {
                        return JSON.stringify(this);
                    }
                };
            }
        }
        else if (this.isXYElement(element)) {
            return this.XYElementToRelativeBox(element);
        }
        const parent = this.getOffsetParent(element);
        if (parent instanceof HTMLElement) {
            const rect = element.getBoundingClientRect();
            const rectParent = parent.getBoundingClientRect();
            const x = rect.left - rectParent.left;
            const y = rect.top - rectParent.top;
            return {
                x: x,
                y: y,
                width: rect.width,
                height: rect.height,
                bottom: y + rect.height,
                right: x + rect.width,
                left: rect.left - rectParent.left,
                top: rect.top - rectParent.top,
                toJSON() {
                    return JSON.stringify(this);
                }
            };
        }
        console.error("Element type not supported");
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            bottom: 0,
            right: 0,
            top: 0,
            left: 0,
            toJSON() {
                return JSON.stringify(this);
            }
        };
    }
    getOffsetParent(element) {
        if (element instanceof HTMLElement) {
            return element.offsetParent;
        }
        let current = element.parentNode;
        while (current) {
            if (current instanceof Element) {
                const style = getComputedStyle(current);
                if (style.position !== 'static') {
                    return current;
                }
            }
            if (current instanceof ShadowRoot) {
                current = current.host;
            }
            else {
                current = current.parentNode;
            }
        }
        return null;
    }
}
DragAndDrop.Namespace=`Aventus`;
_.DragAndDrop=DragAndDrop;

let ResourceLoader=class ResourceLoader {
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
                delete result.type;
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

let Async=function Async(el) {
    return new Promise((resolve) => {
        if (el instanceof Promise) {
            el.then(resolve);
        }
        else {
            resolve(el);
        }
    });
}
_.Async=Async;

let Json=class Json {
    /**
     * Converts a JavaScript class instance to a JSON object.
     * @template T - The type of the object to convert.
     * @param {T} obj - The object to convert to JSON.
     * @param {JsonToOptions} [options] - Options for JSON conversion.
     * @returns {{ [key: string | number]: any; }} Returns the JSON representation of the object.
     */
    static classToJson(obj, options) {
        const realOptions = {
            isValidKey: options?.isValidKey ?? (() => true),
            replaceKey: options?.replaceKey ?? ((key) => key),
            transformValue: options?.transformValue ?? ((key, value) => value),
            beforeEnd: options?.beforeEnd ?? ((res) => res)
        };
        return this.__classToJson(obj, realOptions);
    }
    static __classToJson(obj, options) {
        let result = {};
        let descriptors = Object.getOwnPropertyDescriptors(obj);
        for (let key in descriptors) {
            if (options.isValidKey(key))
                result[options.replaceKey(key)] = options.transformValue(key, descriptors[key].value);
        }
        let cst = obj.constructor;
        while (cst.prototype && cst != Object.prototype) {
            let descriptorsClass = Object.getOwnPropertyDescriptors(cst.prototype);
            for (let key in descriptorsClass) {
                if (options.isValidKey(key)) {
                    let descriptor = descriptorsClass[key];
                    if (descriptor?.get) {
                        result[options.replaceKey(key)] = options.transformValue(key, obj[key]);
                    }
                }
            }
            cst = Object.getPrototypeOf(cst);
        }
        result = options.beforeEnd(result);
        return result;
    }
    /**
    * Converts a JSON object to a JavaScript class instance.
    * @template T - The type of the object to convert.
    * @param {T} obj - The object to populate with JSON data.
    * @param {*} data - The JSON data to populate the object with.
    * @param {JsonFromOptions} [options] - Options for JSON deserialization.
    * @returns {T} Returns the populated object.
    */
    static classFromJson(obj, data, options) {
        let realOptions = {
            transformValue: options?.transformValue ?? ((key, value) => value),
            replaceUndefined: options?.replaceUndefined ?? false,
            replaceUndefinedWithKey: options?.replaceUndefinedWithKey ?? false,
        };
        return this.__classFromJson(obj, data, realOptions);
    }
    static __classFromJson(obj, data, options) {
        let props = Object.getOwnPropertyNames(obj);
        for (let prop of props) {
            let propUpperFirst = prop[0].toUpperCase() + prop.slice(1);
            let value = data[prop] === undefined ? data[propUpperFirst] : data[prop];
            if (value !== undefined || options.replaceUndefined || (options.replaceUndefinedWithKey && (Object.hasOwn(data, prop) || Object.hasOwn(data, propUpperFirst)))) {
                let propInfo = Object.getOwnPropertyDescriptor(obj, prop);
                if (propInfo?.writable) {
                    obj[prop] = options.transformValue(prop, value);
                }
            }
        }
        let cstTemp = obj.constructor;
        while (cstTemp.prototype && cstTemp != Object.prototype) {
            props = Object.getOwnPropertyNames(cstTemp.prototype);
            for (let prop of props) {
                let propUpperFirst = prop[0].toUpperCase() + prop.slice(1);
                let value = data[prop] === undefined ? data[propUpperFirst] : data[prop];
                if (value !== undefined || options.replaceUndefined || (options.replaceUndefinedWithKey && (Object.hasOwn(data, prop) || Object.hasOwn(data, propUpperFirst)))) {
                    let propInfo = Object.getOwnPropertyDescriptor(cstTemp.prototype, prop);
                    if (propInfo?.set) {
                        obj[prop] = options.transformValue(prop, value);
                    }
                }
            }
            cstTemp = Object.getPrototypeOf(cstTemp);
        }
        return obj;
    }
}
Json.Namespace=`Aventus`;
_.Json=Json;

let Data=class Data {
    /**
     * The schema for the class
     */
    static $schema;
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
     * Get the unique type for the data. Define it as the namespace + class name
     */
    get $type() {
        return this.constructor['Fullname'];
    }
    /**
     * Get the name of the class
     */
    get className() {
        return this.constructor.name;
    }
    /**
     * Get a JSON for the current object
     */
    toJSON() {
        let toAvoid = ['className', 'namespace'];
        return Json.classToJson(this, {
            isValidKey: (key) => !toAvoid.includes(key)
        });
    }
    /**
     * Clone the object by transforming a parsed JSON string back into the original type
     */
    clone() {
        return Converter.transform(JSON.parse(JSON.stringify(this)));
    }
}
Data.Namespace=`Aventus`;
_.Data=Data;

let ConverterTransform=class ConverterTransform {
    transform(data) {
        return this.transformLoop(data);
    }
    createInstance(data) {
        if (data.$type) {
            let cst = Converter.info.get(data.$type);
            if (cst) {
                return new cst();
            }
        }
        return undefined;
    }
    beforeTransformObject(obj) {
    }
    afterTransformObject(obj) {
    }
    transformLoop(data) {
        if (data === null) {
            return data;
        }
        if (Array.isArray(data)) {
            let result = [];
            for (let element of data) {
                result.push(this.transformLoop(element));
            }
            return result;
        }
        if (data instanceof Date) {
            return data;
        }
        if (typeof data === 'object' && !/^\s*class\s+/.test(data.toString())) {
            let objTemp = this.createInstance(data);
            if (objTemp) {
                if (objTemp instanceof Map) {
                    if (data.values) {
                        for (const keyValue of data.values) {
                            objTemp.set(this.transformLoop(keyValue[0]), this.transformLoop(keyValue[1]));
                        }
                    }
                    return objTemp;
                }
                let obj = objTemp;
                this.beforeTransformObject(obj);
                if (obj.fromJSON) {
                    obj = obj.fromJSON(data);
                }
                else {
                    obj = Json.classFromJson(obj, data, {
                        transformValue: (key, value) => {
                            if (obj[key] instanceof Date) {
                                return value ? new Date(value) : null;
                            }
                            else if (typeof value == 'string' && DateConverter.converter.isStringDate(value)) {
                                return value ? DateConverter.converter.fromString(value) : null;
                            }
                            else if (obj[key] instanceof Map) {
                                let map = new Map();
                                for (const keyValue of value) {
                                    map.set(this.transformLoop(keyValue[0]), this.transformLoop(keyValue[1]));
                                }
                                return map;
                            }
                            else if (obj instanceof Data) {
                                let cst = obj.constructor;
                                if (cst.$schema[key] == 'boolean') {
                                    return value ? true : false;
                                }
                                else if (cst.$schema[key] == 'number') {
                                    return isNaN(Number(value)) ? 0 : Number(value);
                                }
                                else if (cst.$schema[key] == 'number') {
                                    return isNaN(Number(value)) ? 0 : Number(value);
                                }
                                else if (cst.$schema[key] == 'Date') {
                                    return value ? new Date(value) : null;
                                }
                            }
                            return this.transformLoop(value);
                        }
                    });
                }
                this.afterTransformObject(obj);
                return obj;
            }
            let result = {};
            for (let key in data) {
                result[key] = this.transformLoop(data[key]);
            }
            return result;
        }
        if (typeof data == 'string' && /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z$/.exec(data)) {
            return new Date(data);
        }
        return data;
    }
    copyValuesClass(target, src, options) {
        const realOptions = {
            isValidKey: options?.isValidKey ?? (() => true),
            replaceKey: options?.replaceKey ?? ((key) => key),
            transformValue: options?.transformValue ?? ((key, value) => value),
        };
        this.__classCopyValues(target, src, realOptions);
    }
    __classCopyValues(target, src, options) {
        let props = Object.getOwnPropertyNames(target);
        for (let prop of props) {
            let propInfo = Object.getOwnPropertyDescriptor(target, prop);
            if (propInfo?.writable) {
                if (options.isValidKey(prop))
                    target[options.replaceKey(prop)] = options.transformValue(prop, src[prop]);
            }
        }
        let cstTemp = target.constructor;
        while (cstTemp.prototype && cstTemp != Object.prototype) {
            props = Object.getOwnPropertyNames(cstTemp.prototype);
            for (let prop of props) {
                let propInfo = Object.getOwnPropertyDescriptor(cstTemp.prototype, prop);
                if (propInfo?.set && propInfo.get) {
                    if (options.isValidKey(prop))
                        target[options.replaceKey(prop)] = options.transformValue(prop, src[prop]);
                }
            }
            cstTemp = Object.getPrototypeOf(cstTemp);
        }
    }
}
ConverterTransform.Namespace=`Aventus`;
_.ConverterTransform=ConverterTransform;

let Converter=class Converter {
    /**
    * Map storing information about registered types.
    */
    static info = new Map([["Aventus.Map", Map]]);
    /**
    * Map storing schemas for registered types.
    */
    static schema = new Map();
    /**
     * Internal converter instance.
     */
    static __converter = new ConverterTransform();
    /**
     * Getter for the internal converter instance.
     */
    static get converterTransform() {
        return this.__converter;
    }
    /**
    * Sets the converter instance.
    * @param converter The converter instance to set.
    */
    static setConverter(converter) {
        this.__converter = converter;
    }
    /**
    * Registers a unique string type for any class.
    * @param $type The unique string type identifier.
    * @param cst The constructor function for the class.
    * @param schema Optional schema for the registered type.
    */
    static register($type, cst, schema) {
        this.info.set($type, cst);
        if (schema) {
            this.schema.set($type, schema);
        }
    }
    /**
     * Transforms the provided data using the current converter instance.
     * @template T
     * @param {*} data The data to transform.
     * @param {IConverterTransform} [converter] Optional converter instance to use for transformation.
     * @returns {T} Returns the transformed data.
     */
    static transform(data, converter) {
        if (!converter) {
            converter = this.converterTransform;
        }
        return converter.transform(data);
    }
    /**
     * Copies values from one class instance to another using the current converter instance.
     * @template T
     * @param {T} to The destination class instance to copy values into.
     * @param {T} from The source class instance to copy values from.
     * @param {ClassCopyOptions} [options] Optional options for the copy operation.
     * @param {IConverterTransform} [converter] Optional converter instance to use for the copy operation.
     * @returns {T} Returns the destination class instance with copied values.
     */
    static copyValuesClass(to, from, options, converter) {
        if (!converter) {
            converter = this.converterTransform;
        }
        return converter.copyValuesClass(to, from, options);
    }
}
Converter.Namespace=`Aventus`;
_.Converter=Converter;

let GenericError=class GenericError {
    /**
     * Code for the error
     */
    code;
    /**
     * Description of the error
     */
    message;
    /**
     * Additional details related to the error.
     */
    details = [];
    /**
     * Creates a new instance of GenericError.
     * @param {EnumValue<T>} code - The error code.
     * @param {string} message - The error message.
     */
    constructor(code, message) {
        this.code = code;
        this.message = message + '';
    }
}
GenericError.Namespace=`Aventus`;
_.GenericError=GenericError;

let RamError=class RamError extends GenericError {
}
RamError.Namespace=`Aventus`;
_.RamError=RamError;

let HttpError=class HttpError extends GenericError {
}
HttpError.Namespace=`Aventus`;
_.HttpError=HttpError;

let VoidWithError=class VoidWithError {
    /**
     * Determine if the action is a success
     */
    get success() {
        return this.errors.length == 0;
    }
    /**
     * List of errors
     */
    errors = [];
    /**
     * Converts the current instance to a VoidWithError object.
     * @returns {VoidWithError} A new instance of VoidWithError with the same error list.
     */
    toGeneric() {
        const result = new VoidWithError();
        result.errors = this.errors;
        return result;
    }
    /**
    * Checks if the error list contains a specific error code.
    * @template U - The type of error, extending GenericError.
    * @template T - The type of the error code, which extends either number or Enum.
    * @param {EnumValue<T>} code - The error code to check for.
    * @param {new (...args: any[]) => U} [type] - Optional constructor function of the error type.
    * @returns {boolean} True if the error list contains the specified error code, otherwise false.
    */
    containsCode(code, type) {
        if (type) {
            for (let error of this.errors) {
                if (error instanceof type) {
                    if (error.code == code) {
                        return true;
                    }
                }
            }
        }
        else {
            for (let error of this.errors) {
                if (error.code == code) {
                    return true;
                }
            }
        }
        return false;
    }
}
VoidWithError.Namespace=`Aventus`;
_.VoidWithError=VoidWithError;

let VoidRamWithError=class VoidRamWithError extends VoidWithError {
}
VoidRamWithError.Namespace=`Aventus`;
_.VoidRamWithError=VoidRamWithError;

let ResultWithError=class ResultWithError extends VoidWithError {
    /**
      * The result value of the action.
      * @type {U | undefined}
      */
    result;
    /**
     * Converts the current instance to a ResultWithError object.
     * @returns {ResultWithError<U>} A new instance of ResultWithError with the same error list and result value.
     */
    toGeneric() {
        const result = new ResultWithError();
        result.errors = this.errors;
        result.result = this.result;
        return result;
    }
}
ResultWithError.Namespace=`Aventus`;
_.ResultWithError=ResultWithError;

let ResultRamWithError=class ResultRamWithError extends ResultWithError {
}
ResultRamWithError.Namespace=`Aventus`;
_.ResultRamWithError=ResultRamWithError;

let HttpRequest=class HttpRequest {
    request;
    url;
    constructor(url, method = HttpMethod.GET, body) {
        this.url = url;
        this.request = {};
        this.setMethod(method);
        this.prepareBody(body);
    }
    setUrl(url) {
        this.url = url;
    }
    toString() {
        return this.url + " : " + JSON.stringify(this.request);
    }
    setBody(body) {
        this.prepareBody(body);
    }
    setMethod(method) {
        this.request.method = method;
    }
    objectToFormData(obj, formData, parentKey) {
        formData = formData || new FormData();
        let byPass = obj;
        if (byPass.__isProxy) {
            obj = byPass.getTarget();
        }
        const keys = obj.toJSON ? Object.keys(obj.toJSON()) : Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            let value = obj[key];
            const newKey = parentKey ? `${parentKey}[${key}]` : key;
            if (value instanceof Date) {
                formData.append(newKey, DateConverter.converter.toString(value));
            }
            else if (typeof value === 'object' &&
                value !== null &&
                !(value instanceof File)) {
                if (Array.isArray(value)) {
                    for (let j = 0; j < value.length; j++) {
                        const arrayKey = `${newKey}[${j}]`;
                        this.objectToFormData({ [arrayKey]: value[j] }, formData);
                    }
                }
                else {
                    this.objectToFormData(value, formData, newKey);
                }
            }
            else {
                if (value === undefined || value === null) {
                    value = "";
                }
                else if (Watcher.is(value)) {
                    value = Watcher.extract(value);
                }
                formData.append(newKey, value);
            }
        }
        return formData;
    }
    jsonReplacer(key, value) {
        if (this[key] instanceof Date) {
            return DateConverter.converter.toString(this[key]);
        }
        return value;
    }
    prepareBody(data) {
        if (!data) {
            return;
        }
        else if (data instanceof FormData) {
            this.request.body = data;
        }
        else {
            let useFormData = false;
            const analyseFormData = (obj) => {
                for (let key in obj) {
                    if (obj[key] instanceof File) {
                        useFormData = true;
                        break;
                    }
                    else if (Array.isArray(obj[key]) && obj[key].length > 0 && obj[key][0] instanceof File) {
                        useFormData = true;
                        break;
                    }
                    else if (typeof obj[key] == 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
                        analyseFormData(obj[key]);
                        if (useFormData) {
                            break;
                        }
                    }
                }
            };
            analyseFormData(data);
            if (useFormData) {
                this.request.body = this.objectToFormData(data);
            }
            else {
                this.request.body = JSON.stringify(data, this.jsonReplacer);
                this.setHeader("Content-Type", "Application/json");
            }
        }
    }
    setHeader(name, value) {
        if (!this.request.headers) {
            this.request.headers = [];
        }
        this.request.headers.push([name, value]);
    }
    async query(router) {
        let result = new ResultWithError();
        try {
            if (!this.url.startsWith("/")) {
                this.url = "/" + this.url;
            }
            const fullUrl = router ? router.options.url + this.url : this.url;
            result.result = await fetch(fullUrl, this.request);
        }
        catch (e) {
            result.errors.push(new HttpError(HttpErrorCode.unknow, e));
        }
        return result;
    }
    async queryVoid(router) {
        let resultTemp = await this.query(router);
        let result = new VoidWithError();
        if (!resultTemp.success) {
            result.errors = resultTemp.errors;
            return result;
        }
        try {
            if (!resultTemp.result) {
                return result;
            }
            if (resultTemp.result.status != 204) {
                let tempResult = Converter.transform(await resultTemp.result.json());
                if (tempResult instanceof VoidWithError) {
                    for (let error of tempResult.errors) {
                        result.errors.push(error);
                    }
                }
            }
        }
        catch (e) {
        }
        return result;
    }
    async queryJSON(router) {
        let resultTemp = await this.query(router);
        let result = new ResultWithError();
        if (!resultTemp.success) {
            result.errors = resultTemp.errors;
            return result;
        }
        try {
            if (!resultTemp.result) {
                return result;
            }
            let tempResult = Converter.transform(await resultTemp.result.json());
            if (tempResult instanceof VoidWithError) {
                for (let error of tempResult.errors) {
                    result.errors.push(error);
                }
                if (tempResult instanceof ResultWithError) {
                    result.result = tempResult.result;
                }
            }
            else {
                result.result = tempResult;
            }
        }
        catch (e) {
            result.errors.push(new HttpError(HttpErrorCode.unknow, e));
        }
        return result;
    }
    async queryTxt(router) {
        let resultTemp = await this.query(router);
        let result = new ResultWithError();
        if (!resultTemp.success) {
            result.errors = resultTemp.errors;
            return result;
        }
        try {
            if (!resultTemp.result) {
                return result;
            }
            result.result = await resultTemp.result.text();
        }
        catch (e) {
            result.errors.push(new HttpError(HttpErrorCode.unknow, e));
        }
        return result;
    }
    async queryBlob(router) {
        let resultTemp = await this.query(router);
        let result = new ResultWithError();
        if (!resultTemp.success) {
            result.errors = resultTemp.errors;
            return result;
        }
        try {
            if (!resultTemp.result) {
                return result;
            }
            result.result = await resultTemp.result.blob();
        }
        catch (e) {
            result.errors.push(new HttpError(HttpErrorCode.unknow, e));
        }
        return result;
    }
}
HttpRequest.Namespace=`Aventus`;
_.HttpRequest=HttpRequest;

let HttpRouter=class HttpRouter {
    options;
    constructor() {
        this.options = this.defineOptions(this.defaultOptionsValue());
    }
    defaultOptionsValue() {
        return {
            url: location.protocol + "//" + location.host
        };
    }
    defineOptions(options) {
        return options;
    }
    async get(url) {
        return await new HttpRequest(url).queryJSON(this);
    }
    async post(url, data) {
        return await new HttpRequest(url, HttpMethod.POST, data).queryJSON(this);
    }
    async put(url, data) {
        return await new HttpRequest(url, HttpMethod.PUT, data).queryJSON(this);
    }
    async delete(url, data) {
        return await new HttpRequest(url, HttpMethod.DELETE, data).queryJSON(this);
    }
    async option(url, data) {
        return await new HttpRequest(url, HttpMethod.OPTION, data).queryJSON(this);
    }
}
HttpRouter.Namespace=`Aventus`;
_.HttpRouter=HttpRouter;

let HttpRoute=class HttpRoute {
    router;
    constructor(router) {
        this.router = router ?? new HttpRouter();
    }
    getPrefix() {
        return "";
    }
}
HttpRoute.Namespace=`Aventus`;
_.HttpRoute=HttpRoute;

let StorableRoute=class StorableRoute extends HttpRoute {
    async GetAll() {
        const request = new HttpRequest(`/${this.StorableName()}`, HttpMethod.GET);
        return await request.queryJSON(this.router);
    }
    async Create(body) {
        const request = new HttpRequest(`/${this.StorableName()}`, HttpMethod.POST);
        request.setBody(body);
        return await request.queryJSON(this.router);
    }
    async GetById(id) {
        const request = new HttpRequest(`/${this.StorableName()}/${id}`, HttpMethod.GET);
        return await request.queryJSON(this.router);
    }
    async Update(id, body) {
        const request = new HttpRequest(`/${this.StorableName()}/${id}`, HttpMethod.PUT);
        request.setBody(body);
        return await request.queryJSON(this.router);
    }
    async Delete(id) {
        const request = new HttpRequest(`/${this.StorableName()}/${id}`, HttpMethod.DELETE);
        return await request.queryJSON(this.router);
    }
}
StorableRoute.Namespace=`Aventus`;
_.StorableRoute=StorableRoute;

let GenericRam=class GenericRam {
    /**
     * The current namespace
     */
    static Namespace = "";
    // public static get Namespace(): string { return ""; }
    /**
     * Get the unique type for the data. Define it as the namespace + class name
     */
    static get Fullname() { return this.Namespace + "." + this.name; }
    subscribers = {
        created: [],
        updated: [],
        deleted: [],
    };
    recordsSubscribers = new Map();
    /**
     * List of stored item by index key
     */
    records = new Map();
    actionGuard = new ActionGuard();
    constructor() {
        if (this.constructor == GenericRam) {
            throw "can't instanciate an abstract class";
        }
    }
    /**
     * Get item id
     */
    getIdWithError(item) {
        let action = new ResultRamWithError();
        let idTemp = item[this.defineIndexKey()];
        if (idTemp !== undefined) {
            action.result = idTemp;
        }
        else {
            action.errors.push(new RamError(RamErrorCode.noId, "no key found for item"));
        }
        return action;
    }
    /**
     * Get item id
     */
    getId(item) {
        let result = this.getIdWithError(item);
        if (result.success) {
            return result.result;
        }
        throw 'no key found for item';
    }
    /**
     * Prevent adding Watch element
     */
    removeWatch(element) {
        let byPass = element;
        if (byPass.__isProxy) {
            return byPass.getTarget();
        }
        return element;
    }
    /**
     * Add function update, onUpdate, offUpdate, delete, onDelete, offDelete
     */
    addRamAction(Base) {
        let that = this;
        return class ActionClass extends Base {
            static get className() {
                return Base.className || Base.name;
            }
            get className() {
                return Base.className || Base.name;
            }
            async update(newData = {}) {
                let id = that.getId(this);
                let oldData = that.records.get(id);
                if (oldData) {
                    that.mergeObject(oldData, newData, { replaceUndefinedWithKey: true });
                    let result = await that.update(oldData);
                    return result;
                }
                return undefined;
            }
            async updateWithError(newData = {}) {
                const result = new ResultRamWithError();
                let queryId = that.getIdWithError(this);
                if (!queryId.success || !queryId.result) {
                    result.errors = queryId.errors;
                    return result;
                }
                let oldData = that.records.get(queryId.result);
                if (oldData) {
                    that.mergeObject(oldData, newData, { replaceUndefinedWithKey: true });
                    let result = await that.updateWithError(oldData);
                    return result;
                }
                result.errors.push(new RamError(RamErrorCode.noItemInsideRam, "Can't find this item inside the ram"));
                return result;
            }
            onUpdate(callback) {
                let id = that.getId(this);
                if (!that.recordsSubscribers.has(id)) {
                    that.recordsSubscribers.set(id, {
                        created: [],
                        updated: [],
                        deleted: []
                    });
                }
                let sub = that.recordsSubscribers.get(id);
                if (sub && !sub.updated.includes(callback)) {
                    sub.updated.push(callback);
                }
            }
            offUpdate(callback) {
                let id = that.getId(this);
                let sub = that.recordsSubscribers.get(id);
                if (sub) {
                    let index = sub.updated.indexOf(callback);
                    if (index != -1) {
                        sub.updated.splice(index, 1);
                    }
                }
            }
            async delete() {
                let id = that.getId(this);
                await that.deleteById(id);
            }
            async deleteWithError() {
                const result = new VoidRamWithError();
                let queryId = that.getIdWithError(this);
                if (!queryId.success || !queryId.result) {
                    result.errors = queryId.errors;
                    return result;
                }
                const queryDelete = await that.deleteByIdWithError(queryId.result);
                result.errors = queryDelete.errors;
                return result;
            }
            onDelete(callback) {
                let id = that.getId(this);
                if (!that.recordsSubscribers.has(id)) {
                    that.recordsSubscribers.set(id, {
                        created: [],
                        updated: [],
                        deleted: []
                    });
                }
                let sub = that.recordsSubscribers.get(id);
                if (sub && !sub.deleted.includes(callback)) {
                    sub.deleted.push(callback);
                }
            }
            offDelete(callback) {
                let id = that.getId(this);
                let sub = that.recordsSubscribers.get(id);
                if (sub) {
                    let index = sub.deleted.indexOf(callback);
                    if (index != -1) {
                        sub.deleted.splice(index, 1);
                    }
                }
            }
        };
    }
    /**
     * Transform the object into the object stored inside Ram
     */
    getObjectForRam(objJson) {
        let T = this.addRamAction(this.getTypeForData(objJson));
        let item = new T();
        this.mergeObject(item, objJson);
        return item;
    }
    /**
     * Add element inside Ram or update it. The instance inside the ram is unique and ll never be replaced
     */
    async addOrUpdateData(item, result) {
        let resultTemp = null;
        try {
            let idWithError = this.getIdWithError(item);
            if (idWithError.success && idWithError.result !== undefined) {
                let id = idWithError.result;
                if (this.records.has(id)) {
                    let uniqueRecord = this.records.get(id);
                    await this.beforeRecordSet(uniqueRecord);
                    this.mergeObject(uniqueRecord, item);
                    await this.afterRecordSet(uniqueRecord);
                    resultTemp = 'updated';
                }
                else {
                    let realObject = this.getObjectForRam(item);
                    await this.beforeRecordSet(realObject);
                    this.records.set(id, realObject);
                    await this.afterRecordSet(realObject);
                    resultTemp = 'created';
                }
                result.result = this.records.get(id);
            }
            else {
                result.errors = [...result.errors, ...idWithError.errors];
                resultTemp = null;
            }
        }
        catch (e) {
            result.errors.push(new RamError(RamErrorCode.unknow, e));
            resultTemp = null;
        }
        return resultTemp;
    }
    /**
     * Merge object and create real instance of class
     */
    mergeObject(item, objJson, options) {
        if (!item) {
            return;
        }
        if (!options) {
            options = {
                replaceUndefined: true
            };
        }
        Json.classFromJson(item, objJson, options);
    }
    /**
     * Create or update the item
     */
    async save(item, ...args) {
        let action = await this.saveWithError(item, ...args);
        if (action.success) {
            return action.result;
        }
        return undefined;
    }
    /**
     * Create or update the item
     */
    async saveWithError(item, ...args) {
        let action = new ResultRamWithError();
        let resultTemp = await this.getIdWithError(item);
        if (resultTemp.success && resultTemp.result !== undefined) {
            if (resultTemp.result) {
                return this.updateWithError(item, ...args);
            }
            else {
                return this.createWithError(item, ...args);
            }
        }
        else {
            action.errors = resultTemp.errors;
        }
        return action;
    }
    async beforeRecordSet(item) { }
    async afterRecordSet(item) { }
    async beforeRecordDelete(item) { }
    async afterRecordDelete(item) { }
    publish(type, data) {
        let callbacks = [...this.subscribers[type]];
        for (let callback of callbacks) {
            callback(data);
        }
        let sub = this.recordsSubscribers.get(this.getId(data));
        if (sub) {
            let localCallbacks = [...sub[type]];
            for (let localCallback of localCallbacks) {
                localCallback(data);
            }
        }
    }
    subscribe(type, cb) {
        if (!this.subscribers[type].includes(cb)) {
            this.subscribers[type].push(cb);
        }
    }
    unsubscribe(type, cb) {
        let index = this.subscribers[type].indexOf(cb);
        if (index != -1) {
            this.subscribers[type].splice(index, 1);
        }
    }
    /**
    * Add a callback that ll be triggered when a new item is stored
    */
    onCreated(cb) {
        this.subscribe('created', cb);
    }
    /**
     * Remove a created callback
     */
    offCreated(cb) {
        this.unsubscribe('created', cb);
    }
    /**
     * Add a callback that ll be triggered when an item is updated
     */
    onUpdated(cb) {
        this.subscribe('updated', cb);
    }
    /**
     * Remove an updated callback
     */
    offUpdated(cb) {
        this.unsubscribe('updated', cb);
    }
    /**
     * Add a callback that ll be triggered when an item is deleted
     */
    onDeleted(cb) {
        this.subscribe('deleted', cb);
    }
    /**
     * Remove an deleted callback
     */
    offDeleted(cb) {
        this.unsubscribe('deleted', cb);
    }
    /**
     * Get an item by id if exist (alias for getById)
     */
    async get(id) {
        return await this.getById(id);
    }
    ;
    /**
     * Get an item by id if exist (alias for getById)
     */
    async getWithError(id) {
        return await this.getByIdWithError(id);
    }
    ;
    /**
     * Get an item by id if exist
     */
    async getById(id) {
        let action = await this.getByIdWithError(id);
        if (action.success) {
            return action.result;
        }
        return undefined;
    }
    /**
     * Get an item by id if exist
     */
    async getByIdWithError(id) {
        return this.actionGuard.run(['getByIdWithError', id], async () => {
            let action = new ResultRamWithError();
            await this.beforeGetById(id, action);
            if (action.success) {
                if (this.records.has(id)) {
                    action.result = this.records.get(id);
                    await this.afterGetById(action);
                }
                else {
                    action.errors.push(new RamError(RamErrorCode.noItemInsideRam, "can't find the item " + id + " inside ram"));
                }
            }
            return action;
        });
    }
    /**
     * Trigger before getting an item by id
     */
    async beforeGetById(id, result) { }
    ;
    /**
     * Trigger after getting an item by id
     */
    async afterGetById(result) { }
    ;
    /**
     * Get multiple items by ids
     */
    async getByIds(ids) {
        let result = await this.getByIdsWithError(ids);
        if (result.success) {
            return result.result ?? [];
        }
        return [];
    }
    ;
    /**
     * Get multiple items by ids
     */
    async getByIdsWithError(ids) {
        return this.actionGuard.run(['getByIdsWithError', ids], async () => {
            let action = new ResultRamWithError();
            action.result = [];
            await this.beforeGetByIds(ids, action);
            if (action.success) {
                action.result = [];
                for (let id of ids) {
                    let rec = this.records.get(id);
                    if (rec) {
                        action.result.push(rec);
                    }
                    else {
                        action.errors.push(new RamError(RamErrorCode.noItemInsideRam, "can't find the item " + id + " inside ram"));
                    }
                }
                if (action.success) {
                    await this.afterGetByIds(action);
                }
            }
            return action;
        });
    }
    ;
    /**
     * Trigger before getting a list of items by id
     */
    async beforeGetByIds(ids, result) { }
    ;
    /**
     * Trigger after getting a list of items by id
     */
    async afterGetByIds(result) { }
    ;
    /**
     * Get all elements inside the Ram
     */
    async getAll() {
        let result = await this.getAllWithError();
        if (result.success) {
            return result.result ?? new Map();
        }
        return new Map();
    }
    ;
    /**
     * Get all elements inside the Ram
     */
    async getAllWithError() {
        return this.actionGuard.run(['getAllWithError'], async () => {
            let action = new ResultRamWithError();
            action.result = new Map();
            await this.beforeGetAll(action);
            if (action.success) {
                action.result = this.records;
                await this.afterGetAll(action);
            }
            return action;
        });
    }
    ;
    /**
     * Trigger before getting all items inside Ram
     */
    async beforeGetAll(result) { }
    ;
    /**
     * Trigger after getting all items inside Ram
     */
    async afterGetAll(result) { }
    ;
    /**
     * Get all elements inside the Ram
     */
    async getList() {
        let data = await this.getAll();
        return Array.from(data.values());
    }
    ;
    /**
     * Get all elements inside the Ram
     */
    async getListWithError() {
        let action = new ResultRamWithError();
        action.result = [];
        let result = await this.getAllWithError();
        if (result.success) {
            if (result.result) {
                action.result = Array.from(result.result.values());
            }
            else {
                action.result = [];
            }
        }
        else {
            action.errors = result.errors;
        }
        return action;
    }
    /**
     * Create a list of items inside ram
     */
    async createList(list) {
        let result = await this.createListWithError(list);
        return result.result ?? [];
    }
    /**
     * Create a list of items inside ram
     */
    async createListWithError(list) {
        list = this.removeWatch(list);
        let action = new ResultRamWithError();
        action.result = [];
        await this.beforeCreateList(list, action);
        if (action.success) {
            if (action.result.length > 0) {
                list = action.result;
                action.result = [];
            }
            for (let item of list) {
                let resultItem = await this._create(item, true);
                if (resultItem.success && resultItem.result) {
                    action.result.push(resultItem.result);
                }
                else {
                    action.errors = [...action.errors, ...resultItem.errors];
                }
            }
            if (action.success) {
                await this.afterCreateList(action);
            }
        }
        return action;
    }
    /**
     * Create an item inside ram
     */
    async create(item, ...args) {
        let action = await this.createWithError(item, args);
        if (action.success) {
            return action.result;
        }
        return undefined;
    }
    /**
     * Create an item inside ram
     */
    async createWithError(item, ...args) {
        return await this._create(item, false);
    }
    async _create(item, fromList) {
        item = this.removeWatch(item);
        return this.actionGuard.run(['_create', item], async () => {
            let action = new ResultRamWithError();
            await this.beforeCreateItem(item, fromList, action);
            if (action.success) {
                if (action.result) {
                    item = action.result;
                }
                let resultTemp = this.getIdWithError(item);
                if (resultTemp.success) {
                    await this.addOrUpdateData(item, action);
                    if (!action.success) {
                        return action;
                    }
                    await this.afterCreateItem(action, fromList);
                    if (!action.success) {
                        action.result = undefined;
                    }
                    else if (action.result) {
                        this.publish('created', action.result);
                    }
                }
                else {
                    action.errors = resultTemp.errors;
                }
            }
            return action;
        });
    }
    /**
     * Trigger before creating a list of items
     */
    async beforeCreateList(list, result) {
    }
    ;
    /**
     * Trigger before creating an item
     */
    async beforeCreateItem(item, fromList, result) {
    }
    ;
    /**
     * Trigger after creating an item
     */
    async afterCreateItem(result, fromList) {
    }
    ;
    /**
     * Trigger after creating a list of items
     */
    async afterCreateList(result) {
    }
    ;
    /**
     * Update a list of items inside ram
     */
    async updateList(list) {
        let result = await this.updateListWithError(list);
        return result.result ?? [];
    }
    ;
    /**
     * Update a list of items inside ram
     */
    async updateListWithError(list) {
        list = this.removeWatch(list);
        let action = new ResultRamWithError();
        action.result = [];
        await this.beforeUpdateList(list, action);
        if (action.success) {
            if (action.result.length > 0) {
                list = action.result;
                action.result = [];
            }
            for (let item of list) {
                let resultItem = await this._update(item, true);
                if (resultItem.success && resultItem.result) {
                    action.result.push(resultItem.result);
                }
                else {
                    action.errors = [...action.errors, ...resultItem.errors];
                }
            }
            if (action.success) {
                await this.afterUpdateList(action);
            }
        }
        return action;
    }
    ;
    /**
     * Update an item inside ram
     */
    async update(item, ...args) {
        let action = await this.updateWithError(item, args);
        if (action.success) {
            return action.result;
        }
        return undefined;
    }
    /**
     * Update an item inside ram
     */
    async updateWithError(item, ...args) {
        return await this._update(item, false);
    }
    async _update(item, fromList) {
        item = this.removeWatch(item);
        return this.actionGuard.run(['_update', item], async () => {
            let action = new ResultRamWithError();
            let resultTemp = await this.getIdWithError(item);
            if (resultTemp.success && resultTemp.result !== undefined) {
                let key = resultTemp.result;
                if (this.records.has(key)) {
                    if (this.records.get(key) == item) {
                        console.warn("You are updating the same item. You should clone the object first to avoid weird effect");
                    }
                    await this.beforeUpdateItem(item, fromList, action);
                    if (!action.success) {
                        return action;
                    }
                    if (action.result) {
                        item = action.result;
                    }
                    await this.addOrUpdateData(item, action);
                    if (!action.success) {
                        return action;
                    }
                    await this.afterUpdateItem(action, fromList);
                    if (!action.success) {
                        action.result = undefined;
                    }
                    else if (action.result) {
                        this.publish('updated', action.result);
                    }
                }
                else {
                    action.errors.push(new RamError(RamErrorCode.noItemInsideRam, "can't update the item " + key + " because it wasn't found inside ram"));
                }
            }
            else {
                action.errors = resultTemp.errors;
            }
            return action;
        });
    }
    ;
    /**
     * Trigger before updating a list of items
     */
    async beforeUpdateList(list, result) {
    }
    ;
    /**
    * Trigger before updating an item
    */
    async beforeUpdateItem(item, fromList, result) {
    }
    ;
    /**
     * Trigger after updating an item
     */
    async afterUpdateItem(result, fromList) {
    }
    ;
    /**
     * Trigger after updating a list of items
     */
    async afterUpdateList(result) {
    }
    ;
    /**
     * Delete a list of items inside ram
     */
    async deleteList(list) {
        let result = await this.deleteListWithError(list);
        return result.result ?? [];
    }
    ;
    /**
     * Delete a list of items inside ram
     */
    async deleteListWithError(list) {
        list = this.removeWatch(list);
        let action = new ResultRamWithError();
        action.result = [];
        let deleteResult = new VoidWithError();
        await this.beforeDeleteList(list, deleteResult);
        if (!deleteResult.success) {
            action.errors = deleteResult.errors;
        }
        for (let item of list) {
            let resultItem = await this._delete(item, true);
            if (resultItem.success && resultItem.result) {
                action.result.push(resultItem.result);
            }
            else {
                action.errors = [...action.errors, ...resultItem.errors];
            }
        }
        if (action.success) {
            await this.afterDeleteList(action);
        }
        return action;
    }
    ;
    /**
     * Delete an item inside ram
     */
    async delete(item, ...args) {
        let action = await this.deleteWithError(item, args);
        if (action.success) {
            return action.result;
        }
        return undefined;
    }
    ;
    /**
    * Delete an item inside ram
    */
    async deleteWithError(item, ...args) {
        return await this._delete(item, false);
    }
    ;
    /**
     * Delete an item by id inside ram
     */
    async deleteById(id) {
        let action = await this.deleteByIdWithError(id);
        if (action.success) {
            return action.result;
        }
        return undefined;
    }
    /**
    * Delete an item by id inside ram
    */
    async deleteByIdWithError(id) {
        let item = this.records.get(id);
        if (item) {
            return await this._delete(item, false);
        }
        let result = new ResultRamWithError();
        result.errors.push(new RamError(RamErrorCode.noItemInsideRam, "can't delete the item " + id + " because it wasn't found inside ram"));
        return result;
    }
    async _delete(item, fromList) {
        item = this.removeWatch(item);
        return this.actionGuard.run(['_delete', item], async () => {
            let action = new ResultRamWithError();
            let resultTemp = await this.getIdWithError(item);
            if (resultTemp.success && resultTemp.result) {
                let key = resultTemp.result;
                let oldItem = this.records.get(key);
                if (oldItem) {
                    let deleteResult = new VoidWithError();
                    await this.beforeDeleteItem(oldItem, fromList, deleteResult);
                    if (!deleteResult.success) {
                        action.errors = deleteResult.errors;
                        return action;
                    }
                    this.beforeRecordDelete(oldItem);
                    this.records.delete(key);
                    this.afterRecordDelete(oldItem);
                    action.result = oldItem;
                    await this.afterDeleteItem(action, fromList);
                    if (!action.success) {
                        action.result = undefined;
                    }
                    else {
                        this.publish('deleted', action.result);
                    }
                    this.recordsSubscribers.delete(key);
                }
                else {
                    action.errors.push(new RamError(RamErrorCode.noItemInsideRam, "can't delete the item " + key + " because it wasn't found inside ram"));
                }
            }
            else {
                action.errors = resultTemp.errors;
            }
            return action;
        });
    }
    /**
     * Trigger before deleting a list of items
     */
    async beforeDeleteList(list, result) { }
    ;
    /**
     * Trigger before deleting an item
     */
    async beforeDeleteItem(item, fromList, result) { }
    ;
    /**
     * Trigger after deleting an item
     */
    async afterDeleteItem(result, fromList) { }
    ;
    /**
     * Trigger after deleting a list of items
     */
    async afterDeleteList(result) { }
}
GenericRam.Namespace=`Aventus`;
_.GenericRam=GenericRam;

let Ram=class Ram extends GenericRam {
}
Ram.Namespace=`Aventus`;
_.Ram=Ram;


for(let key in _) { Aventus[key] = _[key] }
})(Aventus);

var VscodeView;
(VscodeView||(VscodeView = {}));
(function (VscodeView) {
const moduleName = `VscodeView`;
const _ = {};


let _n;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["unknow"] = 0] = "unknow";
    ErrorCode[ErrorCode["differentChannel"] = 1] = "differentChannel";
    ErrorCode[ErrorCode["timeout"] = 2] = "timeout";
})(ErrorCode || (ErrorCode = {}));
_.ErrorCode=ErrorCode;

let Error=class Error extends Aventus.GenericError {
}
Error.Namespace=`VscodeView`;
_.Error=Error;

let Router=class Router {
    static getInstance() {
        return Aventus.Instance.get(Router);
    }
    routes = {};
    waitingList = {};
    vscode;
    constructor() {
        this.vscode = acquireVsCodeApi();
        window.addEventListener('message', (e) => this.onMessage(e));
    }
    addRoute(route) {
        if (!this.routes.hasOwnProperty(route.channel)) {
            this.routes[route.channel] = [];
        }
        for (let info of this.routes[route.channel]) {
            if (info.callback == route.callback) {
                return;
            }
        }
        const { params, regex } = Aventus.Uri.prepare(route.channel);
        let prepared = {
            callback: route.callback,
            channel: route.channel,
            regex,
            params
        };
        this.routes[route.channel].push(prepared);
    }
    removeRoute(route) {
        for (let i = 0; i < this.routes[route.channel].length; i++) {
            let info = this.routes[route.channel][i];
            if (info.callback == route.callback) {
                this.routes[route.channel].splice(i, 1);
                i--;
            }
        }
    }
    onMessage(event) {
        let response = event.data;
        let data = {};
        try {
            data = Aventus.Converter.transform(response.data);
        }
        catch (e) {
            console.error(e);
        }
        for (let channel in this.routes) {
            let current = this.routes[channel];
            for (let info of current) {
                let params = Aventus.Uri.getParams(info, response.channel);
                if (params) {
                    let valueCb = data;
                    if (data instanceof Aventus.ResultWithError) {
                        valueCb = data.result;
                    }
                    else if (data instanceof Aventus.VoidWithError) {
                        valueCb = undefined;
                    }
                    info.callback(valueCb, params, response.uid);
                }
            }
        }
        if (response.uid) {
            if (this.waitingList.hasOwnProperty(response.uid)) {
                this.waitingList[response.uid](response.channel, data);
                delete this.waitingList[response.uid];
            }
        }
    }
    send(options) {
        let result = new Aventus.VoidWithError();
        try {
            let message = {
                channel: options.channel,
            };
            if (options.uid) {
                message.uid = options.uid;
            }
            if (options.body) {
                message.data = options.body;
            }
            this.vscode.postMessage(message);
        }
        catch (e) {
            result.errors.push(new Error(ErrorCode.unknow, e));
        }
        return result;
    }
    sendWithResponse(options) {
        return new Promise(async (resolve) => {
            let result = new Aventus.ResultWithError();
            try {
                let _uid = options.uid ? options.uid : Aventus.uuidv4();
                options.uid = _uid;
                let timeoutInfo;
                this.waitingList[_uid] = (channel, data) => {
                    clearTimeout(timeoutInfo);
                    if (channel.toLowerCase() != options.channel.toLowerCase()) {
                        result.errors.push(new Error(ErrorCode.differentChannel, `We sent a message on ${options.channel} but we receive on ${channel}`));
                        resolve(result);
                    }
                    else {
                        if (data instanceof Aventus.VoidWithError) {
                            for (let error of data.errors) {
                                result.errors.push(error);
                            }
                            if (data instanceof Aventus.ResultWithError) {
                                result.result = data.result;
                            }
                        }
                        else {
                            result.result = data;
                        }
                        resolve(result);
                    }
                };
                if (options.timeout !== undefined) {
                    timeoutInfo = setTimeout(() => {
                        delete this.waitingList[_uid];
                        result.errors.push(new Error(ErrorCode.timeout, "No message received after " + options.timeout + "ms"));
                        resolve(result);
                    }, options.timeout);
                }
                let sendMessageResult = this.send(options);
                if (!sendMessageResult.success) {
                    for (let error of sendMessageResult.errors) {
                        result.errors.push(error);
                    }
                    resolve(result);
                }
            }
            catch (e) {
                result.errors.push(new Error(ErrorCode.unknow, e));
                resolve(result);
            }
        });
    }
}
Router.Namespace=`VscodeView`;
_.Router=Router;


for(let key in _) { VscodeView[key] = _[key] }
})(VscodeView);

var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const moduleName = `Aventus`;
const _ = {};

let Layout = {};
_.Layout = Aventus.Layout ?? {};
let _n;
let Tracker=class Tracker {
    velocityMultiplier = window.devicePixelRatio;
    updateTime = Date.now();
    delta = { x: 0, y: 0 };
    velocity = { x: 0, y: 0 };
    lastPosition = { x: 0, y: 0 };
    constructor(touch) {
        this.lastPosition = this.getPosition(touch);
    }
    update(touch) {
        const { velocity, updateTime, lastPosition, } = this;
        const now = Date.now();
        const position = this.getPosition(touch);
        const delta = {
            x: -(position.x - lastPosition.x),
            y: -(position.y - lastPosition.y),
        };
        const duration = (now - updateTime) || 16.7;
        const vx = delta.x / duration * 16.7;
        const vy = delta.y / duration * 16.7;
        velocity.x = vx * this.velocityMultiplier;
        velocity.y = vy * this.velocityMultiplier;
        this.delta = delta;
        this.updateTime = now;
        this.lastPosition = position;
    }
    getPointerData(evt) {
        return evt.touches ? evt.touches[evt.touches.length - 1] : evt;
    }
    getPosition(evt) {
        const data = this.getPointerData(evt);
        return {
            x: data.clientX,
            y: data.clientY,
        };
    }
}
Tracker.Namespace=`Aventus`;
_.Tracker=Tracker;

let TouchRecord=class TouchRecord {
    _activeTouchID;
    _touchList = {};
    get _primitiveValue() {
        return { x: 0, y: 0 };
    }
    isActive() {
        return this._activeTouchID !== undefined;
    }
    getDelta() {
        const tracker = this._getActiveTracker();
        if (!tracker) {
            return this._primitiveValue;
        }
        return { ...tracker.delta };
    }
    getVelocity() {
        const tracker = this._getActiveTracker();
        if (!tracker) {
            return this._primitiveValue;
        }
        return { ...tracker.velocity };
    }
    getNbOfTouches() {
        return Object.values(this._touchList).length;
    }
    getTouches() {
        return Object.values(this._touchList);
    }
    getEasingDistance(damping) {
        const deAcceleration = 1 - damping;
        let distance = {
            x: 0,
            y: 0,
        };
        const vel = this.getVelocity();
        Object.keys(vel).forEach(dir => {
            let v = Math.abs(vel[dir]) <= 10 ? 0 : vel[dir];
            while (v !== 0) {
                distance[dir] += v;
                v = (v * deAcceleration) | 0;
            }
        });
        return distance;
    }
    track(evt) {
        if ('TouchEvent' in window && evt instanceof TouchEvent) {
            const { targetTouches, } = evt;
            Array.from(targetTouches).forEach(touch => {
                this._add(touch);
            });
        }
        else {
            this._add(evt);
        }
        return this._touchList;
    }
    update(evt) {
        if ('TouchEvent' in window && evt instanceof TouchEvent) {
            const { touches, changedTouches, } = evt;
            Array.from(touches).forEach(touch => {
                this._renew(touch);
            });
            this._setActiveID(changedTouches);
        }
        else if (evt instanceof PointerEvent) {
            this._renew(evt);
            this._setActiveID(evt);
        }
        return this._touchList;
    }
    release(evt) {
        if ('TouchEvent' in window && evt instanceof TouchEvent) {
            Array.from(evt.changedTouches).forEach(touch => {
                this._delete(touch);
            });
        }
        else {
            this._delete(evt);
        }
    }
    _getIdentifier(touch) {
        if ('Touch' in window && touch instanceof Touch)
            return touch.identifier;
        if (touch instanceof PointerEvent)
            return touch.pointerId;
        return touch.button;
    }
    _add(touch) {
        if (this._has(touch)) {
            this._delete(touch);
        }
        const tracker = new Tracker(touch);
        const identifier = this._getIdentifier(touch);
        this._touchList[identifier] = tracker;
    }
    _renew(touch) {
        if (!this._has(touch)) {
            return;
        }
        const identifier = this._getIdentifier(touch);
        const tracker = this._touchList[identifier];
        tracker.update(touch);
    }
    _delete(touch) {
        const identifier = this._getIdentifier(touch);
        delete this._touchList[identifier];
        if (this._activeTouchID == identifier) {
            this._activeTouchID = undefined;
        }
    }
    _has(touch) {
        const identifier = this._getIdentifier(touch);
        return this._touchList.hasOwnProperty(identifier);
    }
    _setActiveID(touches) {
        if (touches instanceof PointerEvent || touches instanceof MouseEvent) {
            this._activeTouchID = this._getIdentifier(touches);
        }
        else {
            this._activeTouchID = touches[touches.length - 1].identifier;
        }
    }
    _getActiveTracker() {
        const { _touchList, _activeTouchID, } = this;
        if (_activeTouchID !== undefined) {
            return _touchList[_activeTouchID];
        }
        return undefined;
    }
}
TouchRecord.Namespace=`Aventus`;
_.TouchRecord=TouchRecord;

Layout.Scrollable = class Scrollable extends Aventus.WebComponent {
    static get observedAttributes() {return ["zoom"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'min_zoom'() { return this.getNumberAttr('min_zoom') }
    set 'min_zoom'(val) { this.setNumberAttr('min_zoom', val) }get 'max_zoom'() { return this.getNumberAttr('max_zoom') }
    set 'max_zoom'(val) { this.setNumberAttr('max_zoom', val) }get 'y_scroll_visible'() { return this.getBoolAttr('y_scroll_visible') }
    set 'y_scroll_visible'(val) { this.setBoolAttr('y_scroll_visible', val) }get 'x_scroll_visible'() { return this.getBoolAttr('x_scroll_visible') }
    set 'x_scroll_visible'(val) { this.setBoolAttr('x_scroll_visible', val) }get 'floating_scroll'() { return this.getBoolAttr('floating_scroll') }
    set 'floating_scroll'(val) { this.setBoolAttr('floating_scroll', val) }get 'x_scroll'() { return this.getBoolAttr('x_scroll') }
    set 'x_scroll'(val) { this.setBoolAttr('x_scroll', val) }get 'y_scroll'() { return this.getBoolAttr('y_scroll') }
    set 'y_scroll'(val) { this.setBoolAttr('y_scroll', val) }get 'auto_hide'() { return this.getBoolAttr('auto_hide') }
    set 'auto_hide'(val) { this.setBoolAttr('auto_hide', val) }get 'break'() { return this.getNumberAttr('break') }
    set 'break'(val) { this.setNumberAttr('break', val) }get 'disable'() { return this.getBoolAttr('disable') }
    set 'disable'(val) { this.setBoolAttr('disable', val) }get 'no_user_select'() { return this.getBoolAttr('no_user_select') }
    set 'no_user_select'(val) { this.setBoolAttr('no_user_select', val) }get 'mouse_drag'() { return this.getBoolAttr('mouse_drag') }
    set 'mouse_drag'(val) { this.setBoolAttr('mouse_drag', val) }get 'pinch'() { return this.getBoolAttr('pinch') }
    set 'pinch'(val) { this.setBoolAttr('pinch', val) }    get 'zoom'() { return this.getNumberProp('zoom') }
    set 'zoom'(val) { this.setNumberAttr('zoom', val) }    observer;
    display = { x: 0, y: 0 };
    max = {
        x: 0,
        y: 0
    };
    margin = {
        x: 0,
        y: 0
    };
    position = {
        x: 0,
        y: 0
    };
    momentum = { x: 0, y: 0 };
    contentWrapperSize = { x: 0, y: 0 };
    scroller = {
        x: () => {
            if (!this.horizontalScroller) {
                throw 'can\'t find the horizontalScroller';
            }
            return this.horizontalScroller;
        },
        y: () => {
            if (!this.verticalScroller) {
                throw 'can\'t find the verticalScroller';
            }
            return this.verticalScroller;
        }
    };
    scrollerContainer = {
        x: () => {
            if (!this.horizontalScrollerContainer) {
                throw 'can\'t find the horizontalScrollerContainer';
            }
            return this.horizontalScrollerContainer;
        },
        y: () => {
            if (!this.verticalScrollerContainer) {
                throw 'can\'t find the verticalScrollerContainer';
            }
            return this.verticalScrollerContainer;
        }
    };
    hideDelay = { x: 0, y: 0 };
    touchRecord;
    pointerCount = 0;
    loadedOnce = false;
    savedPercent;
    isDragScroller = false;
    cachedSvg;
    previousMidPoint;
    previousDistance;
    startTranslate = { x: 0, y: 0 };
    get x() {
        return this.position.x;
    }
    get y() {
        return this.position.y;
    }
    get xMax() {
        return this.max.x;
    }
    get yMax() {
        return this.max.y;
    }
    onScrollChange = new Aventus.Callback();
    onZoomChange = new Aventus.Callback();
    renderAnimation;
    autoScrollInterval = {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    };
    autoScrollSpeed = {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    };
    pressManager;
    __registerPropertiesActions() { super.__registerPropertiesActions(); this.__addPropertyActions("zoom", ((target) => {
    target.changeZoom();
})); }
    static __style = `:host{--internal-scrollbar-container-color: var(--scrollbar-container-color, transparent);--internal-scrollbar-color: var(--scrollbar-color, #757575);--internal-scrollbar-active-color: var(--scrollbar-active-color, #858585);--internal-scroller-width: var(--scroller-width, 6px);--internal-scroller-top: var(--scroller-top, 3px);--internal-scroller-bottom: var(--scroller-bottom, 3px);--internal-scroller-right: var(--scroller-right, 3px);--internal-scroller-left: var(--scroller-left, 3px);--_scrollbar-content-padding: var(--scrollbar-content-padding, 0);--_scrollbar-container-display: var(--scrollbar-container-display, inline-block)}:host{display:block;height:100%;min-height:inherit;min-width:inherit;overflow:hidden;position:relative;-webkit-user-drag:none;-khtml-user-drag:none;-moz-user-drag:none;-o-user-drag:none;width:100%}:host .scroll-main-container{display:block;height:100%;min-height:inherit;min-width:inherit;position:relative;width:100%}:host .scroll-main-container .content-zoom{display:block;height:100%;min-height:inherit;min-width:inherit;position:relative;transform-origin:0 0;width:100%;z-index:4}:host .scroll-main-container .content-zoom .content-hidder{display:block;height:100%;min-height:inherit;min-width:inherit;overflow:hidden;position:relative;width:100%}:host .scroll-main-container .content-zoom .content-hidder .content-wrapper{display:var(--_scrollbar-container-display);height:100%;min-height:inherit;min-width:inherit;padding:var(--_scrollbar-content-padding);position:relative;width:100%}:host .scroll-main-container .scroller-wrapper .container-scroller{display:none;overflow:hidden;position:absolute;transition:transform .2s linear;z-index:5}:host .scroll-main-container .scroller-wrapper .container-scroller .shadow-scroller{background-color:var(--internal-scrollbar-container-color);border-radius:5px}:host .scroll-main-container .scroller-wrapper .container-scroller .shadow-scroller .scroller{background-color:var(--internal-scrollbar-color);border-radius:5px;cursor:pointer;position:absolute;-webkit-tap-highlight-color:rgba(0,0,0,0);touch-action:none;z-index:5}:host .scroll-main-container .scroller-wrapper .container-scroller .scroller.active{background-color:var(--internal-scrollbar-active-color)}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical{height:calc(100% - var(--internal-scroller-bottom)*2 - var(--internal-scroller-width));padding-left:var(--internal-scroller-left);right:var(--internal-scroller-right);top:var(--internal-scroller-bottom);transform:0;width:calc(var(--internal-scroller-width) + var(--internal-scroller-left))}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical.hide{transform:translateX(calc(var(--internal-scroller-width) + var(--internal-scroller-left)))}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical .shadow-scroller{height:100%}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical .shadow-scroller .scroller{width:calc(100% - var(--internal-scroller-left))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal{bottom:var(--internal-scroller-bottom);height:calc(var(--internal-scroller-width) + var(--internal-scroller-top));left:var(--internal-scroller-right);padding-top:var(--internal-scroller-top);transform:0;width:calc(100% - var(--internal-scroller-right)*2 - var(--internal-scroller-width))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal.hide{transform:translateY(calc(var(--internal-scroller-width) + var(--internal-scroller-top)))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal .shadow-scroller{height:100%}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal .shadow-scroller .scroller{height:calc(100% - var(--internal-scroller-top))}:host([y_scroll]) .scroll-main-container .content-zoom .content-hidder .content-wrapper{height:auto}:host([x_scroll]) .scroll-main-container .content-zoom .content-hidder .content-wrapper{width:auto}:host([y_scroll_visible]) .scroll-main-container .scroller-wrapper .container-scroller.vertical{display:block}:host([x_scroll_visible]) .scroll-main-container .scroller-wrapper .container-scroller.horizontal{display:block}:host([no_user_select]) .content-wrapper *{user-select:none}:host([no_user_select]) ::slotted{user-select:none}`;
    constructor() {
        super();
        this.renderAnimation = this.createAnimation();
        this.onWheel = this.onWheel.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMovePointer = this.onTouchMovePointer.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchMovePointer = this.onTouchMovePointer.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onTouchEndPointer = this.onTouchEndPointer.bind(this);
        this.touchRecord = new TouchRecord();
    }
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
        blocks: { 'default':`<div class="scroll-main-container" _id="scrollable_0">    <div class="content-zoom" _id="scrollable_1">        <div class="content-hidder" _id="scrollable_2">            <div class="content-wrapper" part="content-wrapper" _id="scrollable_3">                <slot></slot>            </div>        </div>    </div>    <div class="scroller-wrapper">        <div class="container-scroller vertical" _id="scrollable_4">            <div class="shadow-scroller">                <div class="scroller" _id="scrollable_5"></div>            </div>        </div>        <div class="container-scroller horizontal" _id="scrollable_6">            <div class="shadow-scroller">                <div class="scroller" _id="scrollable_7"></div>            </div>        </div>    </div></div>` }
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
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('min_zoom')){ this['min_zoom'] = 1; }if(!this.hasAttribute('max_zoom')){ this['max_zoom'] = undefined; }if(!this.hasAttribute('y_scroll_visible')) { this.attributeChangedCallback('y_scroll_visible', false, false); }if(!this.hasAttribute('x_scroll_visible')) { this.attributeChangedCallback('x_scroll_visible', false, false); }if(!this.hasAttribute('floating_scroll')) { this.attributeChangedCallback('floating_scroll', false, false); }if(!this.hasAttribute('x_scroll')) { this.attributeChangedCallback('x_scroll', false, false); }if(!this.hasAttribute('y_scroll')) {this.setAttribute('y_scroll' ,'true'); }if(!this.hasAttribute('auto_hide')) { this.attributeChangedCallback('auto_hide', false, false); }if(!this.hasAttribute('break')){ this['break'] = 0.1; }if(!this.hasAttribute('disable')) { this.attributeChangedCallback('disable', false, false); }if(!this.hasAttribute('no_user_select')) { this.attributeChangedCallback('no_user_select', false, false); }if(!this.hasAttribute('mouse_drag')) { this.attributeChangedCallback('mouse_drag', false, false); }if(!this.hasAttribute('pinch')) { this.attributeChangedCallback('pinch', false, false); }if(!this.hasAttribute('zoom')){ this['zoom'] = 1; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('x');this.__correctGetter('y');this.__correctGetter('xMax');this.__correctGetter('yMax');this.__upgradeProperty('min_zoom');this.__upgradeProperty('max_zoom');this.__upgradeProperty('y_scroll_visible');this.__upgradeProperty('x_scroll_visible');this.__upgradeProperty('floating_scroll');this.__upgradeProperty('x_scroll');this.__upgradeProperty('y_scroll');this.__upgradeProperty('auto_hide');this.__upgradeProperty('break');this.__upgradeProperty('disable');this.__upgradeProperty('no_user_select');this.__upgradeProperty('mouse_drag');this.__upgradeProperty('pinch');this.__upgradeProperty('zoom'); }
    __listBoolProps() { return ["y_scroll_visible","x_scroll_visible","floating_scroll","x_scroll","y_scroll","auto_hide","disable","no_user_select","mouse_drag","pinch"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    createAnimation() {
        return new Aventus.Animation({
            fps: 60,
            animate: () => {
                const nextX = this.nextPosition('x');
                const nextY = this.nextPosition('y');
                this.momentum.x = nextX.momentum;
                this.momentum.y = nextY.momentum;
                this.scrollDirection('x', nextX.position);
                this.scrollDirection('y', nextY.position);
                if (!this.momentum.x && !this.momentum.y) {
                    this.renderAnimation.stop();
                }
            },
            stopped: () => {
                if (this.momentum.x || this.momentum.y) {
                    this.renderAnimation.start();
                }
            }
        });
    }
    nextPosition(direction) {
        const current = this.position[direction];
        const remain = this.momentum[direction];
        let result = {
            momentum: 0,
            position: 0,
        };
        if (Math.abs(remain) <= 0.1) {
            result.position = current + remain;
        }
        else {
            const _break = this.pointerCount > 0 ? 0.5 : this.break;
            let nextMomentum = remain * (1 - _break);
            nextMomentum |= 0;
            result.momentum = nextMomentum;
            result.position = current + remain - nextMomentum;
        }
        let correctPosition = this.correctScrollValue(result.position, direction);
        if (correctPosition != result.position) {
            result.position = correctPosition;
            result.momentum = 0;
        }
        return result;
    }
    scrollDirection(direction, value) {
        const max = this.max[direction];
        if (max != 0) {
            this.position[direction] = this.correctScrollValue(value, direction);
        }
        else {
            this.position[direction] = 0;
        }
        let container = this.scrollerContainer[direction]();
        let scroller = this.scroller[direction]();
        if (this.auto_hide) {
            container.classList.remove("hide");
            clearTimeout(this.hideDelay[direction]);
            this.hideDelay[direction] = setTimeout(() => {
                container.classList.add("hide");
            }, 1000);
        }
        let containerSize = direction == 'y' ? container.offsetHeight : container.offsetWidth;
        if (this.contentWrapperSize[direction] != 0) {
            let scrollPosition = this.position[direction] / this.contentWrapperSize[direction] * containerSize;
            scroller.style.transform = `translate${direction.toUpperCase()}(${scrollPosition}px)`;
            this.contentWrapper.style.transform = `translate3d(${-1 * this.x}px, ${-1 * this.y}px, 0)`;
        }
        this.triggerScrollChange();
    }
    scrollDirectionPercent(direction, percent) {
        const max = this.max[direction];
        this.scrollDirection(direction, max * percent / 100);
    }
    correctScrollValue(value, direction) {
        if (value < 0) {
            value = 0;
        }
        else if (value > this.max[direction]) {
            value = this.max[direction];
        }
        return value;
    }
    triggerScrollChange() {
        this.onScrollChange.trigger(this.x, this.y);
    }
    scrollToPosition(x, y) {
        this.scrollDirection('x', x);
        this.scrollDirection('y', y);
    }
    scrollX(x) {
        this.scrollDirection('x', x);
    }
    scrollXPercent(x) {
        this.scrollDirectionPercent('x', x);
    }
    scrollY(y) {
        this.scrollDirection('y', y);
    }
    scrollYPercent(y) {
        this.scrollDirectionPercent('y', y);
    }
    startAutoScrollRight() {
        if (!this.autoScrollInterval.right) {
            this.stopAutoScrollLeft();
            this.autoScrollInterval.right = setInterval(() => {
                if (this.x == this.max.x) {
                    this.stopAutoScrollRight();
                    return;
                }
                this.addDelta({
                    x: this.autoScrollSpeed.right,
                    y: 0
                });
            }, 100);
        }
    }
    autoScrollRight(percent = 50) {
        let slow = this.max.x * 1 / 100;
        let fast = this.max.x * 10 / 100;
        this.autoScrollSpeed.right = (fast - slow) * (percent / 100) + slow;
        this.startAutoScrollRight();
    }
    stopAutoScrollRight() {
        if (this.autoScrollInterval.right) {
            clearInterval(this.autoScrollInterval.right);
            this.autoScrollInterval.right = 0;
        }
    }
    startAutoScrollLeft() {
        if (!this.autoScrollInterval.left) {
            this.stopAutoScrollRight();
            this.autoScrollInterval.left = setInterval(() => {
                if (this.x == 0) {
                    this.stopAutoScrollLeft();
                    return;
                }
                this.addDelta({
                    x: this.autoScrollSpeed.left * -1,
                    y: 0
                });
            }, 100);
        }
    }
    autoScrollLeft(percent = 50) {
        let slow = this.max.x * 1 / 100;
        let fast = this.max.x * 10 / 100;
        this.autoScrollSpeed.left = (fast - slow) * (percent / 100) + slow;
        this.startAutoScrollLeft();
    }
    stopAutoScrollLeft() {
        if (this.autoScrollInterval.left) {
            clearInterval(this.autoScrollInterval.left);
            this.autoScrollInterval.left = 0;
        }
    }
    startAutoScrollTop() {
        if (!this.autoScrollInterval.top) {
            this.stopAutoScrollBottom();
            this.autoScrollInterval.top = setInterval(() => {
                if (this.y == 0) {
                    this.stopAutoScrollTop();
                    return;
                }
                this.addDelta({
                    x: 0,
                    y: this.autoScrollSpeed.top * -1
                });
            }, 100);
        }
    }
    autoScrollTop(percent = 50) {
        let slow = this.max.y * 1 / 100;
        let fast = this.max.y * 10 / 100;
        this.autoScrollSpeed.top = (fast - slow) * (percent / 100) + slow;
        this.startAutoScrollTop();
    }
    stopAutoScrollTop() {
        if (this.autoScrollInterval.top) {
            clearInterval(this.autoScrollInterval.top);
            this.autoScrollInterval.top = 0;
        }
    }
    startAutoScrollBottom() {
        if (!this.autoScrollInterval.bottom) {
            this.stopAutoScrollTop();
            this.autoScrollInterval.bottom = setInterval(() => {
                if (this.y == this.max.y) {
                    this.stopAutoScrollBottom();
                    return;
                }
                this.addDelta({
                    x: 0,
                    y: this.autoScrollSpeed.bottom
                });
            }, 100);
        }
    }
    autoScrollBottom(percent = 50) {
        let slow = this.max.y * 1 / 100;
        let fast = this.max.y * 10 / 100;
        this.autoScrollSpeed.bottom = (fast - slow) * (percent / 100) + slow;
        this.startAutoScrollBottom();
    }
    stopAutoScrollBottom() {
        if (this.autoScrollInterval.bottom) {
            clearInterval(this.autoScrollInterval.bottom);
            this.autoScrollInterval.bottom = 0;
        }
    }
    createMatrix() {
        if (!this.cachedSvg) {
            this.cachedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        }
        return this.cachedSvg.createSVGMatrix();
    }
    getMidPoint(a, b) {
        return {
            x: (a.lastPosition.x + b.lastPosition.x) / 2,
            y: (a.lastPosition.y + b.lastPosition.y) / 2,
        };
    }
    getDistance(a, b) {
        return Math.sqrt((b.lastPosition.x - a.lastPosition.x) ** 2 + (b.lastPosition.y - a.lastPosition.y) ** 2);
    }
    zoomOnPoint(clientX, clientY, newZoom) {
        let targetCoordinates = this.getBoundingClientRect();
        let mousePositionRelativeToTarget = {
            x: targetCoordinates.x - clientX,
            y: targetCoordinates.y - clientY
        };
        let oldScale = this.zoom;
        let newScale;
        if (this.max_zoom > 0) {
            newScale = Math.max(this.min_zoom, Math.min(this.max_zoom, newZoom));
        }
        else {
            newScale = Math.max(this.min_zoom, newZoom);
        }
        let scaleDiff = newScale / oldScale;
        const matrix = this.createMatrix()
            .translate(this.x, this.y)
            .translate(mousePositionRelativeToTarget.x, mousePositionRelativeToTarget.y)
            .scale(scaleDiff)
            .translate(-mousePositionRelativeToTarget.x, -mousePositionRelativeToTarget.y)
            .scale(this.zoom);
        const newZoomFinal = matrix.a || 1;
        const newX = matrix.e || 0;
        const newY = matrix.f || 0;
        this.zoom = newZoomFinal;
        this.onZoomChange.trigger(newZoomFinal);
        this.scrollDirection('x', newX);
        this.scrollDirection('y', newY);
    }
    pinchAction() {
        const touches = this.touchRecord.getTouches();
        if (touches.length == 2) {
            const newMidpoint = this.getMidPoint(touches[0], touches[1]);
            const prevMidpoint = this.previousMidPoint ?? newMidpoint;
            const positioningElRect = this.getBoundingClientRect();
            const originX = (positioningElRect.left + this.x - this.startTranslate.x) - prevMidpoint.x;
            const originY = (positioningElRect.top + this.y - this.startTranslate.y) - prevMidpoint.y;
            const newDistance = this.getDistance(touches[0], touches[1]);
            const prevDistance = this.previousDistance;
            let scaleDiff = prevDistance ? newDistance / prevDistance : 1;
            const panX = prevMidpoint.x - newMidpoint.x;
            const panY = prevMidpoint.y - newMidpoint.y;
            let oldScale = this.zoom;
            let newScale;
            if (this.max_zoom > 0) {
                newScale = Math.max(this.min_zoom, Math.min(this.max_zoom, oldScale * scaleDiff));
            }
            else {
                newScale = Math.max(this.min_zoom, oldScale * scaleDiff);
            }
            scaleDiff = newScale / oldScale;
            const matrix = this.createMatrix()
                .translate(panX, panY)
                .translate(originX, originY)
                .translate(this.x, this.y)
                .scale(scaleDiff)
                .translate(-originX, -originY)
                .scale(this.zoom);
            const newZoom = matrix.a || 1;
            const newX = matrix.e || 0;
            const newY = matrix.f || 0;
            this.zoom = newZoom;
            this.onZoomChange.trigger(newZoom);
            this.scrollDirection('x', newX);
            this.scrollDirection('y', newY);
            this.previousMidPoint = newMidpoint;
            this.previousDistance = newDistance;
        }
        return null;
    }
    addAction() {
        this.addEventListener("wheel", this.onWheel, { passive: false });
        this.pressManager = new Aventus.PressManager({
            element: this,
            offsetDrag: 0,
            onPressStart: (e) => {
                this.touchRecord.track(e.event);
                this.pointerCount = this.touchRecord.getNbOfTouches();
            },
            onPressEnd: (e) => {
                this.touchRecord.release(e.event);
                this.pointerCount = this.touchRecord.getNbOfTouches();
            },
            onDragStart: (e) => {
                if (!this.pinch && !this.x_scroll_visible && !this.y_scroll_visible) {
                    return false;
                }
                return this.onTouchStartPointer(e);
            },
            onDrag: (e) => {
                this.onTouchMovePointer(e);
            },
            onDragEnd: (e) => {
                this.onTouchEndPointer(e);
            }
        });
        // this.addEventListener("touchstart", this.onTouchStart);
        // this.addEventListener("trigger_pointer_pressstart", this.onTouchStartPointer);
        if (this.mouse_drag) {
            // this.addEventListener("mousedown", this.onTouchStart);
        }
        this.addScrollDrag('x');
        this.addScrollDrag('y');
    }
    addActionMove() {
        // document.body.addEventListener("touchmove", this.onTouchMove);
        // document.body.addEventListener("trigger_pointer_pressmove", this.onTouchMovePointer);
        // document.body.addEventListener("touchcancel", this.onTouchEnd);
        // document.body.addEventListener("touchend", this.onTouchEnd);
        // document.body.addEventListener("trigger_pointer_pressend", this.onTouchEndPointer);
        if (this.mouse_drag) {
            // document.body.addEventListener("mousemove", this.onTouchMove);
            // document.body.addEventListener("mouseup", this.onTouchEnd);
        }
    }
    removeActionMove() {
        // document.body.removeEventListener("touchmove", this.onTouchMove);
        // document.body.removeEventListener("trigger_pointer_pressmove", this.onTouchMovePointer);
        // document.body.removeEventListener("touchcancel", this.onTouchEnd);
        // document.body.removeEventListener("touchend", this.onTouchEnd);
        // document.body.removeEventListener("trigger_pointer_pressend", this.onTouchEndPointer);
        // document.body.removeEventListener("mousemove", this.onTouchMove);
        // document.body.removeEventListener("mouseup", this.onTouchEnd);
    }
    addScrollDrag(direction) {
        let scroller = this.scroller[direction]();
        let startPosition = 0;
        new Aventus.DragAndDrop({
            element: scroller,
            applyDrag: false,
            usePercent: true,
            offsetDrag: 0,
            isDragEnable: () => !this.disable,
            onStart: (e) => {
                this.isDragScroller = true;
                this.no_user_select = true;
                scroller.classList.add("active");
                startPosition = this.position[direction];
            },
            onMove: (e, position) => {
                let delta = position[direction] / 100 * this.contentWrapperSize[direction];
                let value = startPosition + delta;
                this.scrollDirection(direction, value);
            },
            onStop: () => {
                this.no_user_select = false;
                scroller.classList.remove("active");
                this.isDragScroller = false;
            }
        });
    }
    shouldStopPropagation(e, delta) {
        if (!this.y_scroll && this.x_scroll) {
            if ((delta.x > 0 && this.x != this.max.x) ||
                (delta.x <= 0 && this.x != 0)) {
                e.stopPropagation();
            }
        }
        else {
            if ((delta.y > 0 && this.y != this.max.y) ||
                (delta.y <= 0 && this.y != 0)) {
                e.stopPropagation();
            }
        }
    }
    addDelta(delta) {
        if (this.disable) {
            return;
        }
        this.momentum.x += delta.x;
        this.momentum.y += delta.y;
        this.renderAnimation?.start();
    }
    onWheel(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            if (this.pinch) {
                let factor = 0.9;
                if (e.deltaY < 0) {
                    factor = 1.1;
                }
                this.zoomOnPoint(e.clientX, e.clientY, this.zoom * factor);
            }
            return;
        }
        const DELTA_MODE = [1.0, 28.0, 500.0];
        const mode = DELTA_MODE[e.deltaMode] || DELTA_MODE[0];
        let newValue = {
            x: 0,
            y: e.deltaY * mode,
        };
        if (!this.y_scroll && this.x_scroll) {
            newValue = {
                x: e.deltaY * mode,
                y: 0,
            };
        }
        else if (this.x_scroll && e.altKey) {
            newValue = {
                x: e.deltaY * mode,
                y: 0,
            };
        }
        this.shouldStopPropagation(e, newValue);
        this.addDelta(newValue);
    }
    onTouchStartPointer(e) {
        const ev = e.event;
        if ('TouchEvent' in window && ev instanceof TouchEvent) {
            this.onTouchStart(ev);
            return true;
        }
        else if (ev instanceof PointerEvent) {
            if (this.mouse_drag || ev.pointerType == "touch") {
                this.onTouchStart(ev);
                return true;
            }
        }
        return false;
    }
    onTouchStart(e) {
        if (this.isDragScroller)
            return;
        this.touchRecord.track(e);
        this.momentum = {
            x: 0,
            y: 0
        };
        if (this.pointerCount === 0) {
            this.addActionMove();
        }
        this.pointerCount = this.touchRecord.getNbOfTouches();
        if (this.pinch && this.pointerCount == 2) {
            this.startTranslate = { x: this.x, y: this.y };
        }
    }
    onTouchMovePointer(e) {
        const ev = e.event;
        if ('TouchEvent' in window && ev instanceof TouchEvent) {
            this.onTouchMove(ev);
        }
        else if (ev instanceof PointerEvent) {
            if (this.mouse_drag || ev.pointerType == "touch") {
                this.onTouchMove(ev);
            }
        }
    }
    onTouchMove(e) {
        if (this.isDragScroller)
            return;
        this.touchRecord.update(e);
        if (this.pinch && this.pointerCount == 2) {
            // zoom
            e.stopPropagation();
            this.renderAnimation?.stop();
            this.pinchAction();
        }
        else {
            const delta = this.touchRecord.getDelta();
            this.shouldStopPropagation(e, delta);
            this.addDelta(delta);
        }
    }
    onTouchEndPointer(e) {
        const ev = e.event;
        if ('TouchEvent' in window && ev instanceof TouchEvent) {
            this.onTouchEnd(ev);
        }
        else if (ev instanceof PointerEvent) {
            if (this.mouse_drag || ev.pointerType == "touch") {
                this.onTouchEnd(ev);
            }
        }
    }
    onTouchEnd(e) {
        if (this.isDragScroller)
            return;
        const delta = this.touchRecord.getEasingDistance(this.break);
        this.shouldStopPropagation(e, delta);
        this.addDelta(delta);
        this.touchRecord.release(e);
        this.pointerCount = this.touchRecord.getNbOfTouches();
        if (this.pointerCount === 0) {
            this.removeActionMove();
        }
        if (this.pointerCount < 2) {
            this.previousMidPoint = undefined;
            this.previousDistance = undefined;
        }
    }
    calculateRealSize() {
        if (!this.contentZoom || !this.mainContainer || !this.contentWrapper) {
            return false;
        }
        const currentOffsetWidth = this.contentZoom.offsetWidth;
        const currentOffsetHeight = this.contentZoom.offsetHeight;
        let hasChanged = false;
        if (this.contentWrapper.offsetWidth != this.contentWrapperSize.x || this.contentWrapper.offsetHeight != this.contentWrapperSize.y)
            hasChanged = true;
        this.contentWrapperSize.x = this.contentWrapper.offsetWidth;
        this.contentWrapperSize.y = this.contentWrapper.offsetHeight;
        if (this.zoom < 1) {
            // scale the container for zoom
            this.contentZoom.style.width = this.mainContainer.offsetWidth / this.zoom + 'px';
            this.contentZoom.style.height = this.mainContainer.offsetHeight / this.zoom + 'px';
            this.contentZoom.style.maxHeight = this.mainContainer.offsetHeight / this.zoom + 'px';
            if (currentOffsetHeight != this.display.y || currentOffsetWidth != this.display.x)
                hasChanged = true;
            this.display.y = currentOffsetHeight;
            this.display.x = currentOffsetWidth;
        }
        else {
            const newX = currentOffsetWidth / this.zoom;
            const newY = currentOffsetHeight / this.zoom;
            if (newY != this.display.y || newX != this.display.x)
                hasChanged = true;
            this.display.y = newY;
            this.display.x = newX;
            this.contentZoom.style.width = '';
            this.contentZoom.style.height = '';
            this.contentZoom.style.maxHeight = '';
        }
        return hasChanged;
    }
    calculatePositionScrollerContainer(direction) {
        if (direction == 'y') {
            this.calculatePositionScrollerContainerY();
        }
        else {
            this.calculatePositionScrollerContainerX();
        }
    }
    calculatePositionScrollerContainerY() {
        const leftMissing = this.mainContainer.offsetWidth - this.verticalScrollerContainer.offsetLeft;
        if (leftMissing > 0 && this.y_scroll_visible && !this.floating_scroll) {
            this.contentHidder.style.width = 'calc(100% - ' + leftMissing + 'px)';
            this.contentHidder.style.marginRight = leftMissing + 'px';
            this.margin.x = leftMissing;
        }
        else {
            this.contentHidder.style.width = '';
            this.contentHidder.style.marginRight = '';
            this.margin.x = 0;
        }
    }
    calculatePositionScrollerContainerX() {
        const topMissing = this.mainContainer.offsetHeight - this.horizontalScrollerContainer.offsetTop;
        if (topMissing > 0 && this.x_scroll_visible && !this.floating_scroll) {
            this.contentHidder.style.height = 'calc(100% - ' + topMissing + 'px)';
            this.contentHidder.style.marginBottom = topMissing + 'px';
            this.margin.y = topMissing;
        }
        else {
            this.contentHidder.style.height = '';
            this.contentHidder.style.marginBottom = '';
            this.margin.y = 0;
        }
    }
    calculateSizeScroller(direction) {
        const scrollerSize = ((this.display[direction] - this.margin[direction]) / this.contentWrapperSize[direction] * 100);
        if (direction == "y") {
            this.scroller[direction]().style.height = scrollerSize + '%';
        }
        else {
            this.scroller[direction]().style.width = scrollerSize + '%';
        }
        let maxScrollContent = this.contentWrapperSize[direction] - this.display[direction];
        if (maxScrollContent < 0) {
            maxScrollContent = 0;
        }
        this.max[direction] = maxScrollContent + this.margin[direction];
    }
    changeZoom() {
        this.contentZoom.style.transform = 'scale(' + this.zoom + ')';
        this.dimensionRefreshed(true);
    }
    dimensionRefreshed(force = false) {
        if (this.contentWrapper.offsetHeight > 0 && this.contentWrapper.offsetWidth > 0) {
            this.loadedOnce = true;
            if (this.savedPercent) {
                this.position.x = this.contentWrapper.offsetWidth * this.savedPercent.x;
                this.position.y = this.contentWrapper.offsetHeight * this.savedPercent.y;
                this.savedPercent = undefined;
            }
        }
        else if (this.loadedOnce) {
            this.savedPercent = {
                x: this.position.x / this.contentWrapperSize.x,
                y: this.position.y / this.contentWrapperSize.y
            };
        }
        if (!this.calculateRealSize() && !force) {
            return;
        }
        if (this.contentWrapperSize.y - this.display.y > 0) {
            if (!this.y_scroll_visible) {
                this.y_scroll_visible = true;
                this.calculatePositionScrollerContainer('y');
            }
            this.calculateSizeScroller('y');
            this.scrollDirection('y', this.y);
        }
        else if (this.y_scroll_visible) {
            this.y_scroll_visible = false;
            this.calculatePositionScrollerContainer('y');
            this.calculateSizeScroller('y');
            this.scrollDirection('y', 0);
        }
        if (this.contentWrapperSize.x - this.display.x > 0) {
            if (!this.x_scroll_visible) {
                this.x_scroll_visible = true;
                this.calculatePositionScrollerContainer('x');
            }
            this.calculateSizeScroller('x');
            this.scrollDirection('x', this.x);
        }
        else if (this.x_scroll_visible) {
            this.x_scroll_visible = false;
            this.calculatePositionScrollerContainer('x');
            this.calculateSizeScroller('x');
            this.scrollDirection('x', 0);
        }
    }
    createResizeObserver() {
        let inProgress = false;
        return new Aventus.ResizeObserver({
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
            this.observer = this.createResizeObserver();
        }
        this.observer.observe(this.contentWrapper);
        this.observer.observe(this);
    }
    postCreation() {
        this.dimensionRefreshed();
        this.addResizeObserver();
        this.addAction();
    }
    static lock(element) {
        const container = element.findParentByType(Layout.Scrollable);
        if (container) {
            container.disable = true;
        }
    }
    static unlock(element) {
        const container = element.findParentByType(Layout.Scrollable);
        if (container) {
            container.disable = false;
        }
    }
}
Layout.Scrollable.Namespace=`Aventus.Layout`;
Layout.Scrollable.Tag=`av-scrollable`;
_.Layout.Scrollable=Layout.Scrollable;
if(!window.customElements.get('av-scrollable')){window.customElements.define('av-scrollable', Layout.Scrollable);Aventus.WebComponentInstance.registerDefinition(Layout.Scrollable);}


for(let key in _) { Aventus[key] = _[key] }
})(Aventus);

var AventusI18nView;
(AventusI18nView||(AventusI18nView = {}));
(function (AventusI18nView) {
const moduleName = `AventusI18nView`;
const _ = {};

let Components = {};
_.Components = AventusI18nView.Components ?? {};
let _n;
Components.Tooltip = class Tooltip extends Aventus.WebComponent {
    get 'visible'() { return this.getBoolAttr('visible') }
    set 'visible'(val) { this.setBoolAttr('visible', val) }get 'position'() { return this.getStringAttr('position') }
    set 'position'(val) { this.setStringAttr('position', val) }get 'use_absolute'() { return this.getBoolAttr('use_absolute') }
    set 'use_absolute'(val) { this.setBoolAttr('use_absolute', val) }get 'delay'() { return this.getNumberAttr('delay') }
    set 'delay'(val) { this.setNumberAttr('delay', val) }get 'delay_touch'() { return this.getNumberAttr('delay_touch') }
    set 'delay_touch'(val) { this.setNumberAttr('delay_touch', val) }get 'no_caret'() { return this.getBoolAttr('no_caret') }
    set 'no_caret'(val) { this.setBoolAttr('no_caret', val) }    parent = null;
    parentEv = null;
    isDestroyed = false;
    timeoutEnter = false;
    timeout = 0;
    pressManager;
    screenMargin = 10;
    elementsMoved = new Map();
    static __style = `:host{--local-tooltip-from-y: 0;--local-tooltip-from-x: 0;--local-tooltip-to-y: 0;--local-tooltip-to-x: 0;--local-offset-carret-x: 0px;--local-offset-carret-y: 0px;--_tooltip-background-color: var(--tooltip-background-color, var(--vscode-menu-background));--_tooltip-color: var(--tooltip-color, var(--vscode-menu-foreground));--_tooltip-border: var(--tooltip-border, var(--vscode-menu-border))}:host{background-color:var(--_tooltip-background-color);border:1px solid var(--_tooltip-border);border-radius:2px;color:var(--_tooltip-color);opacity:0;padding:5px 15px;pointer-events:none;position:absolute;transition:.3s opacity ease-in-out,.3s visibility ease-in-out,.3s top ease-in-out,.3s bottom ease-in-out,.3s right ease-in-out,.3s left ease-in-out,.3s transform ease-in-out;visibility:hidden;width:max-content;z-index:1}:host::after{content:"";position:absolute}:host([no_caret])::after{display:none}:host([visible]){opacity:1;visibility:visible}:host([position=bottom]){transform:translateX(-50%)}:host([position=bottom])::after{border-bottom:9px solid var(--_tooltip-background-color);border-left:6px solid rgba(0,0,0,0);border-right:6px solid rgba(0,0,0,0);left:calc(50% + var(--local-offset-carret-x));top:-8px;transform:translateX(-50%)}:host([use_absolute][position=bottom]){left:var(--local-tooltip-from-x);max-height:calc(100% - var(--local-tooltip-to-y) - 10px);top:var(--local-tooltip-from-y)}:host([use_absolute][visible][position=bottom]){top:var(--local-tooltip-to-y)}:host([position=bottom]:not([use_absolute])){bottom:0px;left:50%;transform:translateX(-50%) translateY(calc(100% - 10px))}:host([position=bottom][visible]:not([use_absolute])){transform:translateX(-50%) translateY(calc(100% + 10px))}:host([no_caret][use_absolute][position=bottom]){top:calc(var(--local-tooltip-from-y) - 8px)}:host([no_caret][use_absolute][visible][position=bottom]){top:calc(var(--local-tooltip-to-y) - 8px)}:host([position=top]){transform:translateX(-50%)}:host([position=top])::after{border-left:6px solid rgba(0,0,0,0);border-right:6px solid rgba(0,0,0,0);border-top:9px solid var(--_tooltip-background-color);bottom:-8px;left:calc(50% + var(--local-offset-carret-x));transform:translateX(-50%)}:host([use_absolute][position=top]){bottom:var(--local-tooltip-from-y);left:var(--local-tooltip-from-x);max-height:calc(100% - var(--local-tooltip-to-y) - 10px)}:host([use_absolute][visible][position=top]){bottom:var(--local-tooltip-to-y)}:host([position=top]:not([use_absolute])){left:50%;top:0px;transform:translateX(-50%) translateY(calc(-100% + 10px))}:host([position=top][visible]:not([use_absolute])){transform:translateX(-50%) translateY(calc(-100% - 10px))}:host([no_caret][use_absolute][position=top]){bottom:calc(var(--local-tooltip-from-y) - 6px)}:host([no_caret][use_absolute][visible][position=top]){bottom:calc(var(--local-tooltip-to-y) - 6px)}:host([position=right]){transform:translateY(-50%)}:host([position=right])::after{border-bottom:6px solid rgba(0,0,0,0);border-right:9px solid var(--_tooltip-background-color);border-top:6px solid rgba(0,0,0,0);left:-8px;top:calc(50% + var(--local-offset-carret-y));transform:translateY(-50%)}:host([use_absolute][position=right]){left:var(--local-tooltip-from-x);max-width:calc(100% - var(--local-tooltip-to-x) - 10px);top:var(--local-tooltip-from-y)}:host([use_absolute][visible][position=right]){left:var(--local-tooltip-to-x)}:host([position=right]:not([use_absolute])){right:0;top:50%;transform:translateX(calc(100% - 10px)) translateY(-50%)}:host([visible][position=right]:not([use_absolute])){transform:translateX(calc(100% + 10px)) translateY(-50%)}:host([no_caret][use_absolute][position=right]){left:calc(var(--local-tooltip-from-x) - 6px)}:host([no_caret][use_absolute][visible][position=right]){left:calc(var(--local-tooltip-to-x) - 6px)}:host([position=left]){right:var(--local-tooltip-from-x);top:var(--local-tooltip-from-y);transform:translateY(-50%)}:host([position=left])::after{border-bottom:6px solid rgba(0,0,0,0);border-left:9px solid var(--_tooltip-background-color);border-top:6px solid rgba(0,0,0,0);right:-8px;top:calc(50% + var(--local-offset-carret-y));transform:translateY(-50%)}:host([use_absolute][position=left]){max-width:calc(100% - var(--local-tooltip-to-x) - 10px);right:var(--local-tooltip-from-x);top:var(--local-tooltip-from-y)}:host([use_absolute][visible][position=left]){right:var(--local-tooltip-to-x)}:host([position=left]:not([use_absolute])){left:0;top:50%;transform:translateX(calc(-100% + 10px)) translateY(-50%)}:host([visible][position=left]:not([use_absolute])){transform:translateX(calc(-100% - 10px)) translateY(-50%)}:host([no_caret][use_absolute][position=left]){right:calc(var(--local-tooltip-from-x) - 6px)}:host([no_caret][use_absolute][visible][position=left]){right:calc(var(--local-tooltip-to-x) - 6px)}`;
    constructor() {
        super();
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
        this.onTransitionEnd = this.onTransitionEnd.bind(this);
    }
    __getStatic() {
        return Tooltip;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Tooltip.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Tooltip";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('visible')) { this.attributeChangedCallback('visible', false, false); }if(!this.hasAttribute('position')){ this['position'] = 'top'; }if(!this.hasAttribute('use_absolute')) { this.attributeChangedCallback('use_absolute', false, false); }if(!this.hasAttribute('delay')){ this['delay'] = 700; }if(!this.hasAttribute('delay_touch')){ this['delay_touch'] = 700; }if(!this.hasAttribute('no_caret')) { this.attributeChangedCallback('no_caret', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('visible');this.__upgradeProperty('position');this.__upgradeProperty('use_absolute');this.__upgradeProperty('delay');this.__upgradeProperty('delay_touch');this.__upgradeProperty('no_caret'); }
    __listBoolProps() { return ["visible","use_absolute","no_caret"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    calculatePosition() {
        if (!this.parentEv || !this.use_absolute)
            return;
        let rect = this.parentEv.getBoundingClientRect();
        let center = {
            x: rect.left + rect.width / 2,
            y: rect.y + rect.height / 2
        };
        if (this.use_absolute) {
            const diffMinX = center.x - this.offsetWidth / 2;
            const diffMaxX = center.x + this.offsetWidth / 2;
            const maxX = document.body.offsetWidth - this.screenMargin;
            const minX = this.screenMargin;
            if (diffMinX < minX) {
                center.x += minX - diffMinX;
                this.style.setProperty("--local-offset-carret-x", diffMinX - minX + 'px');
            }
            else if (diffMaxX > maxX) {
                center.x += maxX - diffMaxX;
                this.style.setProperty("--local-offset-carret-x", diffMaxX - maxX + 'px');
            }
            const diffMinY = center.y - this.offsetHeight / 2;
            const diffMaxY = center.y + this.offsetHeight / 2;
            const maxY = document.body.offsetHeight - this.screenMargin;
            const minY = this.screenMargin;
            if (diffMinY < minY) {
                center.y += minY - diffMinY;
                this.style.setProperty("--local-offset-carret-y", diffMinY - minY + 'px');
            }
            else if (diffMaxY > maxY) {
                center.y += maxY - diffMaxY;
                this.style.setProperty("--local-offset-carret-y", diffMaxY - maxY + 'px');
            }
        }
        if (this.position == 'bottom') {
            let bottom = rect.y + rect.height;
            this.style.setProperty("--local-tooltip-from-y", bottom - 10 + 'px');
            this.style.setProperty("--local-tooltip-from-x", center.x + 'px');
            this.style.setProperty("--local-tooltip-to-x", center.x + 'px');
            this.style.setProperty("--local-tooltip-to-y", bottom + 10 + 'px');
        }
        else if (this.position == 'top') {
            let bottom = document.body.offsetHeight - rect.top;
            this.style.setProperty("--local-tooltip-from-y", bottom - 10 + 'px');
            this.style.setProperty("--local-tooltip-from-x", center.x + 'px');
            this.style.setProperty("--local-tooltip-to-x", center.x + 'px');
            this.style.setProperty("--local-tooltip-to-y", bottom + 10 + 'px');
        }
        else if (this.position == 'right') {
            let left = rect.x + rect.width;
            this.style.setProperty("--local-tooltip-from-y", center.y + 'px');
            this.style.setProperty("--local-tooltip-from-x", left - 10 + 'px');
            this.style.setProperty("--local-tooltip-to-x", left + 10 + 'px');
            this.style.setProperty("--local-tooltip-to-y", center.y + 10 + 'px');
        }
        else if (this.position == 'left') {
            let left = document.body.offsetWidth - rect.left;
            this.style.setProperty("--local-tooltip-from-y", center.y + 'px');
            this.style.setProperty("--local-tooltip-from-x", left - 10 + 'px');
            this.style.setProperty("--local-tooltip-to-x", left + 10 + 'px');
            this.style.setProperty("--local-tooltip-to-y", center.y + 'px');
        }
    }
    moveNodesToThis() {
        if (this.use_absolute) {
            const elements = this.getNodesInSlot();
            for (let element of elements) {
                this.elementsMoved.set(element, element.parentElement);
                this.shadowRoot.appendChild(element);
            }
        }
    }
    removeNodesFromThis() {
        if (this.use_absolute) {
            for (const [node, parent] of this.elementsMoved) {
                // TODO solution simpliste voir si ça marche vrm
                parent.appendChild(node);
            }
        }
    }
    onMouseEnter() {
        this.moveNodesToThis();
        this.calculatePosition();
        let delay = this.delay == 0 ? 50 : this.delay;
        if (this.use_absolute) {
            document.body.appendChild(this);
            this.timeoutEnter = false;
            this.timeout = setTimeout(() => {
                this.timeoutEnter = true;
                this.visible = true;
            }, delay);
        }
        else {
            if (delay == 0) {
                this.visible = true;
            }
            else {
                this.timeoutEnter = false;
                this.timeout = setTimeout(() => {
                    this.timeoutEnter = true;
                    this.visible = true;
                }, delay);
            }
        }
    }
    onMouseLeave() {
        this.visible = false;
        if (this.use_absolute) {
            if (!this.timeoutEnter) {
                clearTimeout(this.timeout);
                this.onTransitionEnd();
            }
        }
        else if (this.delay != 0) {
            if (!this.timeoutEnter) {
                clearTimeout(this.timeout);
                this.onTransitionEnd();
            }
        }
    }
    onTransitionEnd() {
        if (!this.use_absolute || this.visible)
            return;
        this.removeNodesFromThis();
        if (this.parent && !this.isDestroyed)
            this.parent?.appendChild(this);
        else
            this.remove();
    }
    onLongPress() {
        this.calculatePosition();
        if (this.use_absolute) {
            document.body.appendChild(this);
            this.timeoutEnter = false;
            this.timeout = setTimeout(() => {
                this.timeoutEnter = true;
                this.visible = true;
            }, 50);
        }
        else {
            this.visible = true;
        }
    }
    registerAction() {
        if (!this.parentEv)
            return;
        this.parentEv.addEventListener("mouseenter", this.onMouseEnter);
        this.parentEv.addEventListener("mouseleave", this.onMouseLeave);
        this.addEventListener("transitionend", this.onTransitionEnd);
    }
    postCreation() {
        let parentEv = this.parentNode;
        if (parentEv instanceof ShadowRoot) {
            parentEv = parentEv.host;
        }
        if (parentEv instanceof HTMLElement) {
            this.parentEv = parentEv;
        }
        this.parent = this.parentNode;
        this.registerAction();
    }
    postDestruction() {
        this.isDestroyed = true;
        super.postDestruction();
        if (!this.parentEv)
            return;
        this.parentEv.removeEventListener("mouseenter", this.onMouseEnter);
        this.parentEv.removeEventListener("mouseleave", this.onMouseLeave);
    }
}
Components.Tooltip.Namespace=`AventusI18nView.Components`;
Components.Tooltip.Tag=`av-tooltip`;
_.Components.Tooltip=Components.Tooltip;
if(!window.customElements.get('av-tooltip')){window.customElements.define('av-tooltip', Components.Tooltip);Aventus.WebComponentInstance.registerDefinition(Components.Tooltip);}

const TranslationColHeader = class TranslationColHeader extends Aventus.WebComponent {
    get 'locale'() {
						return this.__watch["locale"];
					}
					set 'locale'(val) {
						this.__watch["locale"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("locale", ((target) => {
    target.style.setProperty("--translation-col-width", "var(--col-width-" + target.locale + ")");
}));    super.__registerWatchesActions();
}
    static __style = `:host{--_translation-col-width: var(--translation-col-width, 200px)}:host{align-items:center;border-right:1px solid var(--vscode-widget-border);display:flex;flex-shrink:0;gap:10px;justify-content:center;margin:0;padding:10px 20px;position:relative;width:var(--translation-col-width);min-width:200px}`;
    __getStatic() {
        return TranslationColHeader;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TranslationColHeader.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot><av-resize _id="translationcolheader_0"></av-resize>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "translationcolheader_0°locale": {
      "fct": (c) => `${c.print(c.comp.__c0f6c43ffbd917481fc06076601eea8amethod0())}`,
      "once": true
    }
  }
}); }
    getClassName() {
        return "TranslationColHeader";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["locale"] = ""; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('locale'); }
    __c0f6c43ffbd917481fc06076601eea8amethod0() {
        return this.locale;
    }
}
TranslationColHeader.Namespace=`AventusI18nView`;
TranslationColHeader.Tag=`av-translation-col-header`;
_.TranslationColHeader=TranslationColHeader;
if(!window.customElements.get('av-translation-col-header')){window.customElements.define('av-translation-col-header', TranslationColHeader);Aventus.WebComponentInstance.registerDefinition(TranslationColHeader);}

let StringTools=class StringTools {
    static removeAccents(value) {
        return value
            .replace(/[áàãâä]/gi, "a")
            .replace(/[éè¨ê]/gi, "e")
            .replace(/[íìïî]/gi, "i")
            .replace(/[óòöôõ]/gi, "o")
            .replace(/[úùüû]/gi, "u")
            .replace(/[ç]/gi, "c")
            .replace(/[ñ]/gi, "n")
            .replace(/[^a-zA-Z0-9]/g, " ");
    }
    static contains(src, search) {
        if (src === undefined)
            return false;
        const _src = this.removeAccents((src + '').toLowerCase());
        const _search = this.removeAccents((search + '').toLowerCase());
        return _src.includes(_search);
    }
    static search(src, search) {
        const terms = search.split(" ");
        for (let _term of terms) {
            const term = _term.trim();
            if (term) {
                if (this.contains(src, term)) {
                    return true;
                }
            }
        }
        return false;
    }
    static firstLetterUpper(txt) {
        return txt.slice(0, 1).toUpperCase() + txt.slice(1);
    }
}
StringTools.Namespace=`AventusI18nView`;
_.StringTools=StringTools;

const Textarea = class Textarea extends Aventus.WebComponent {
    static get observedAttributes() {return ["error"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'error'() { return this.getBoolProp('error') }
    set 'error'(val) { this.setBoolAttr('error', val) }    get 'value'() {
						return this.__watch["value"];
					}
					set 'value'(val) {
						this.__watch["value"] = val;
					}    preventDrag;
    change = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("value", ((target) => {
    target.textarea.value = target.value;
}));    super.__registerWatchesActions();
}
    static __style = `:host{width:100%}:host vscode-textarea{width:100%}`;
    __getStatic() {
        return Textarea;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Textarea.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<vscode-textarea resize="vertical" rows="1" _id="textarea_0"></vscode-textarea>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "textarea",
      "ids": [
        "textarea_0"
      ]
    }
  ],
  "injection": [
    {
      "id": "textarea_0",
      "injectionName": "invalid",
      "inject": (c) => c.comp.__9affda56eddd377764c7a23adf1303f8method0(),
      "once": true
    }
  ],
  "events": [
    {
      "eventName": "change",
      "id": "textarea_0",
      "fct": (e, c) => c.comp.onChange(e)
    }
  ]
}); }
    getClassName() {
        return "Textarea";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('error')) { this.attributeChangedCallback('error', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["value"] = "salut"; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('error');this.__correctGetter('value'); }
    __listBoolProps() { return ["error"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    preventDragFct() {
        this.preventDrag = new Aventus.DragAndDrop({
            element: this,
            applyDrag: false,
            offsetDrag: 0,
            onMove: () => {
            }
        });
    }
    onChange() {
        debugger;
        this.value = this.textarea.value;
        this.change.trigger(this.value);
    }
    postCreation() {
        super.postCreation();
        this.preventDragFct();
    }
    __9affda56eddd377764c7a23adf1303f8method0() {
        return this.error;
    }
}
Textarea.Namespace=`AventusI18nView`;
Textarea.Tag=`av-textarea`;
_.Textarea=Textarea;
if(!window.customElements.get('av-textarea')){window.customElements.define('av-textarea', Textarea);Aventus.WebComponentInstance.registerDefinition(Textarea);}

let DemoData= {
    "click me1": {
        "en-GB": "click me",
        "fr-CH": "presse moi"
    },
    "click me2": {
        "en-GB": "ⵌⵌ",
        "fr-CH": "presse moi"
    }
};
_.DemoData=DemoData;

const Loading = class Loading extends Aventus.WebComponent {
    get 'visible'() { return this.getBoolAttr('visible') }
    set 'visible'(val) { this.setBoolAttr('visible', val) }    static _instance;
    static _minTimeDisplay;
    static _minTimeShow;
    static _showTime;
    static __style = `:host{--_loading-dot-size: var(--loading-dot-size, 16px);--_loading-size: var(--loading-size, 84px)}:host{align-items:center;background-color:rgba(0,0,0,.3);display:none;inset:0;justify-content:center;position:fixed;z-index:999}@keyframes l4{to{transform:rotate(1turn)}}:host .loader{animation:l4 1s infinite steps(10);aspect-ratio:1;background:conic-gradient(rgba(0, 0, 0, 0) 10%, var(--vscode-input-foreground)) content-box;border-radius:50%;-webkit-mask:repeating-conic-gradient(rgba(0, 0, 0, 0) 0deg, #000 1deg 20deg, rgba(0, 0, 0, 0) 21deg 36deg),radial-gradient(farthest-side, rgba(0, 0, 0, 0) calc(100% - var(--_loading-dot-size) - 1px), #000 calc(100% - var(--_loading-dot-size)));-webkit-mask-composite:destination-in;mask-composite:intersect;padding:1px;width:var(--_loading-size)}:host([visible]){display:flex}`;
    __getStatic() {
        return Loading;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Loading.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="loader"></div>` }
    });
}
    getClassName() {
        return "Loading";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('visible')) { this.attributeChangedCallback('visible', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('visible'); }
    __listBoolProps() { return ["visible"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    static show(minTimeShow = 100, minTimeDisplay = 1000) {
        this._minTimeDisplay = minTimeDisplay;
        this._minTimeShow = minTimeShow;
        if (!this._instance) {
            this._instance = new Loading();
            document.body.appendChild(this._instance);
        }
        if (this._minTimeDisplay) {
            const d = new Date();
            this._showTime = d.getTime();
        }
        this._instance.visible = true;
    }
    static hide() {
        if (this._minTimeDisplay && this._showTime && this._instance) {
            const now = new Date();
            const diff = now.getTime() - this._showTime;
            if (diff > this._minTimeDisplay) {
                this._instance.visible = false;
            }
            else {
                const instance = this._instance;
                const delay = this._minTimeDisplay - diff;
                setTimeout(() => {
                    instance.visible = false;
                }, delay);
            }
        }
    }
}
Loading.Namespace=`AventusI18nView`;
Loading.Tag=`av-loading`;
_.Loading=Loading;
if(!window.customElements.get('av-loading')){window.customElements.define('av-loading', Loading);Aventus.WebComponentInstance.registerDefinition(Loading);}

const IconTooltip = class IconTooltip extends Aventus.WebComponent {
    static get observedAttributes() {return ["name"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'notif'() { return this.getBoolAttr('notif') }
    set 'notif'(val) { this.setBoolAttr('notif', val) }get 'active'() { return this.getBoolAttr('active') }
    set 'active'(val) { this.setBoolAttr('active', val) }    get 'name'() { return this.getStringProp('name') }
    set 'name'(val) { this.setStringAttr('name', val) }    static __style = `:host{border-radius:6px;cursor:pointer;height:32px;padding:8px;position:relative;transition:background-color .2s linear;width:32px}:host vscode-icon{height:100%;width:100%}:host .notif{background-color:var(--vscode-icon-foreground);border-radius:10px;display:none;height:10px;position:absolute;right:3px;top:3px;width:10px}:host([active])::after{border:1px solid var(--vscode-button-secondaryHoverBackground);border-radius:6px;content:"";height:100%;left:50%;pointer-events:none;position:absolute;top:50%;transform:translate(-50%, -50%);width:100%}:host(:hover){background-color:var(--vscode-button-secondaryHoverBackground)}:host([notif]) .notif{display:block}`;
    __getStatic() {
        return IconTooltip;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(IconTooltip.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<vscode-icon _id="icontooltip_0"></vscode-icon><av-tooltip use_absolute no_caret>    <slot></slot></av-tooltip><div class="notif"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "content": {
    "icontooltip_0°name": {
      "fct": (c) => `${c.print(c.comp.__6b93c63e12520a69df7261ff7f843c0fmethod0())}`,
      "once": true
    }
  }
}); }
    getClassName() {
        return "IconTooltip";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('notif')) { this.attributeChangedCallback('notif', false, false); }if(!this.hasAttribute('active')) { this.attributeChangedCallback('active', false, false); }if(!this.hasAttribute('name')){ this['name'] = "symbol-array"; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('notif');this.__upgradeProperty('active');this.__upgradeProperty('name'); }
    __listBoolProps() { return ["notif","active"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    postCreation() {
        super.postCreation();
    }
    __6b93c63e12520a69df7261ff7f843c0fmethod0() {
        return this.name;
    }
}
IconTooltip.Namespace=`AventusI18nView`;
IconTooltip.Tag=`av-icon-tooltip`;
_.IconTooltip=IconTooltip;
if(!window.customElements.get('av-icon-tooltip')){window.customElements.define('av-icon-tooltip', IconTooltip);Aventus.WebComponentInstance.registerDefinition(IconTooltip);}

const GenericPopup = class GenericPopup extends Aventus.WebComponent {
    static get observedAttributes() {return ["popup_title"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'popup_title'() { return this.getStringProp('popup_title') }
    set 'popup_title'(val) { this.setStringAttr('popup_title', val) }    cb;
    static __style = `:host{align-items:center;background-color:rgba(0,0,0,.3);display:flex;inset:0;justify-content:center;position:fixed;z-index:999}:host .popup{background-color:var(--vscode-panel-background);border:var(--vscode-panel-border);border-radius:4px;box-shadow:var(--elevation-8);max-width:min(800px,100% - 100px);min-width:400px;padding:15px}:host .popup .title{font-size:24px;font-weight:bold;margin-bottom:10px}:host .popup .content{font-size:16px}:host .popup .actions{align-items:center;display:flex;font-size:16px;gap:10px;justify-content:flex-end;margin-top:10px}`;
    __getStatic() {
        return GenericPopup;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(GenericPopup.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>`,'actions':`<slot name="actions">            <vscode-button _id="genericpopup_1">Close</vscode-button>        </slot>` }, 
        blocks: { 'default':`<div class="popup">    <div class="title" _id="genericpopup_0"></div>    <div class="content">        <slot></slot>    </div>    <div class="actions">        <slot name="actions">            <vscode-button _id="genericpopup_1">Close</vscode-button>        </slot>    </div></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "closeBtn",
      "ids": [
        "genericpopup_1"
      ]
    }
  ],
  "content": {
    "genericpopup_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__e07b11b2e32632baaa472cf6cd242d2fmethod0())}`,
      "once": true
    }
  },
  "pressEvents": [
    {
      "id": "genericpopup_1",
      "onPress": (e, pressInstance, c) => { c.comp.close(e, pressInstance); }
    }
  ]
}); }
    getClassName() {
        return "GenericPopup";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('popup_title')){ this['popup_title'] = undefined; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('popup_title'); }
    close() {
        this.remove();
        if (this.cb) {
            this.cb();
        }
    }
    __e07b11b2e32632baaa472cf6cd242d2fmethod0() {
        return this.popup_title;
    }
    static show(popup) {
        return new Promise((resolve) => {
            popup.cb = resolve;
            document.body.appendChild(popup);
        });
    }
}
GenericPopup.Namespace=`AventusI18nView`;
GenericPopup.Tag=`av-generic-popup`;
_.GenericPopup=GenericPopup;
if(!window.customElements.get('av-generic-popup')){window.customElements.define('av-generic-popup', GenericPopup);Aventus.WebComponentInstance.registerDefinition(GenericPopup);}

const Popup = class Popup extends GenericPopup {
    static __style = ``;
    __getStatic() {
        return Popup;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Popup.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`` }
    });
}
    getClassName() {
        return "Popup";
    }
}
Popup.Namespace=`AventusI18nView`;
Popup.Tag=`av-popup`;
_.Popup=Popup;
if(!window.customElements.get('av-popup')){window.customElements.define('av-popup', Popup);Aventus.WebComponentInstance.registerDefinition(Popup);}

const ApiKeyPopup = class ApiKeyPopup extends GenericPopup {
    static get observedAttributes() {return ["popup_title"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'popup_title'() { return this.getStringProp('popup_title') }
    set 'popup_title'(val) { this.setStringAttr('popup_title', val) }    apiKeySet = false;
    static __style = `:host vscode-textfield{width:calc(100% - 32px);margin:16px}:host .cancel{--vscode-button-background: var(--vscode-editorError-foreground);--vscode-button-hoverBackground: #f45d5d}`;
    __getStatic() {
        return ApiKeyPopup;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ApiKeyPopup.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'actions':`	<vscode-button class="cancel" _id="apikeypopup_1">Close</vscode-button>	<vscode-button _id="apikeypopup_2">Save</vscode-button>`,'default':`<vscode-textfield placeholder="Deepl Api Key" _id="apikeypopup_0"></vscode-textfield>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "keyInput",
      "ids": [
        "apikeypopup_0"
      ]
    },
    {
      "name": "closeBtn",
      "ids": [
        "apikeypopup_1"
      ]
    },
    {
      "name": "saveBtn",
      "ids": [
        "apikeypopup_2"
      ]
    }
  ],
  "pressEvents": [
    {
      "id": "apikeypopup_1",
      "onPress": (e, pressInstance, c) => { c.comp.close(e, pressInstance); }
    },
    {
      "id": "apikeypopup_2",
      "onPress": (e, pressInstance, c) => { c.comp.save(e, pressInstance); }
    }
  ]
}); }
    getClassName() {
        return "ApiKeyPopup";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('popup_title')){ this['popup_title'] = "Deepl api key is missing"; } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('popup_title'); }
    async save() {
        const value = this.keyInput.value.trim();
        this.apiKeySet = value != '';
        const result = await VscodeView.Router.getInstance().sendWithResponse({
            channel: "setApiKey",
            body: {
                key: value,
            }
        });
        this.close();
    }
}
ApiKeyPopup.Namespace=`AventusI18nView`;
ApiKeyPopup.Tag=`av-api-key-popup`;
_.ApiKeyPopup=ApiKeyPopup;
if(!window.customElements.get('av-api-key-popup')){window.customElements.define('av-api-key-popup', ApiKeyPopup);Aventus.WebComponentInstance.registerDefinition(ApiKeyPopup);}

const Alert = class Alert extends GenericPopup {
    static __style = ``;
    __getStatic() {
        return Alert;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Alert.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Alert";
    }
    static make(title, content) {
        return new Promise((resolve) => {
            const el = new Alert();
            el.popup_title = title;
            el.innerHTML = content;
            el.cb = resolve;
            document.body.appendChild(el);
        });
    }
}
Alert.Namespace=`AventusI18nView`;
Alert.Tag=`av-alert`;
_.Alert=Alert;
if(!window.customElements.get('av-alert')){window.customElements.define('av-alert', Alert);Aventus.WebComponentInstance.registerDefinition(Alert);}

let Translator=class Translator {
    static async translate(value, source, destination, askKey = true) {
        const result = await VscodeView.Router.getInstance().sendWithResponse({
            channel: "translate",
            body: {
                value,
                source,
                destination
            }
        });
        if (!result.result)
            return null;
        if (askKey && result.result.error == "No api key") {
            let popup = new ApiKeyPopup();
            await ApiKeyPopup.show(popup);
            if (popup.apiKeySet) {
                return await this.translate(value, source, destination, false);
            }
            return null;
        }
        else if (result.result.error) {
            await Alert.make("Error", result.result.error);
            return null;
        }
        return result.result.result;
    }
}
Translator.Namespace=`AventusI18nView`;
_.Translator=Translator;

const TranslateAllPopup = class TranslateAllPopup extends GenericPopup {
    static get observedAttributes() {return ["is_running"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'is_running'() { return this.getBoolProp('is_running') }
    set 'is_running'(val) { this.setBoolAttr('is_running', val) }    get 'fallback'() {
						return this.__watch["fallback"];
					}
					set 'fallback'(val) {
						this.__watch["fallback"] = val;
					}    parsed = {};
    locales = [];
    __registerWatchesActions() {
    this.__addWatchesActions("fallback");    super.__registerWatchesActions();
}
    static __style = `:host .popup{height:calc(100% - 50px);max-width:calc(100% - 100px);min-width:auto;width:100%}:host .popup .content{height:calc(100% - 45px)}:host .header{display:flex;gap:20px;justify-content:stretch}:host .header .left{width:100%}:host .header .right{position:relative;width:100px}:host .header .right av-loading{--loading-size: 40px;--loading-dot-size: 5px;background-color:rgba(0,0,0,0);position:absolute}:host .sub-title{font-size:calc(var(--vscode-font-size)*.9)}:host .list{border:1px solid var(--vscode-widget-border);border-radius:5px;display:flex;flex-direction:column;height:calc(100% - 78px);margin-top:15px;overflow:hidden}:host .list .item{align-items:stretch;display:flex;padding:0 15px}:host .list .item .source{align-items:center;border-right:1px solid var(--vscode-widget-border);display:flex;flex-shrink:0;padding:5px 10px;width:50%}:host .list .item .result{display:flex;flex-direction:column;flex-shrink:0;gap:2px;justify-content:center;padding:5px 10px;width:50%}:host .list .item .result span:nth-child(2){color:var(--vscode-settings-textInputForeground);font-size:calc(var(--vscode-font-size)*.8)}:host .list .item:nth-child(odd){background-color:var(--vscode-editorWidget-background)}:host .list .item:last-child{border-bottom:1px solid var(--vscode-widget-border)}:host .list .item.head{background-color:rgba(0,0,0,0);border-bottom:1px solid var(--vscode-widget-border);border-left:1px solid var(--vscode-widget-border);border-right:1px solid var(--vscode-widget-border)}:host .list .item.head .result,:host .list .item.head .source{flex-direction:row;font-weight:bold;justify-content:center;padding:10px 0}:host .scroll{height:calc(100% - 40px)}`;
    __getStatic() {
        return TranslateAllPopup;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TranslateAllPopup.__style);
        return arrStyle;
    }
    __getHtml() {super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="header">	<div class="left">		<div class="title">Translate all</div>		<div class="sub-title" _id="translateallpopup_0"></div>	</div>	<div class="right">		<av-loading _id="translateallpopup_1"></av-loading>	</div></div><div class="list">	<div class="item head">		<div class="source" _id="translateallpopup_2"></div>		<div class="result">Result</div>	</div>	<av-scrollable class="scroll" floating_scroll auto_hide mouse_drag _id="translateallpopup_3">	</av-scrollable></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "scrollEl",
      "ids": [
        "translateallpopup_3"
      ]
    }
  ],
  "content": {
    "translateallpopup_0°@HTML": {
      "fct": (c) => `Source lang : ${c.print(c.comp.__68a6f2046cb9c9d100a4c888b5011073method0())}`,
      "once": true
    },
    "translateallpopup_2°@HTML": {
      "fct": (c) => `Source (${c.print(c.comp.__68a6f2046cb9c9d100a4c888b5011073method0())})`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "translateallpopup_1",
      "injectionName": "visible",
      "inject": (c) => c.comp.__68a6f2046cb9c9d100a4c888b5011073method1(),
      "once": true
    }
  ]
}); }
    getClassName() {
        return "TranslateAllPopup";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('is_running')) { this.attributeChangedCallback('is_running', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["fallback"] = ""; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('is_running');this.__correctGetter('fallback'); }
    __listBoolProps() { return ["is_running"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    async run() {
        this.closeBtn['disabled'] = true;
        this.is_running = true;
        await Aventus.sleep(5000);
        for (let key in this.parsed) {
            for (let locale of this.locales) {
                if (!this.parsed[key][locale] || this.parsed[key][locale] == TranslationPage.KeyUndefined) {
                    if (locale == this.fallback) {
                        this.parsed[key][locale] = key;
                        this.addTranslation(key, locale, key);
                    }
                    else {
                        const result = await Translator.translate(key, this.fallback, locale);
                        if (result) {
                            this.parsed[key][locale] = result;
                            this.addTranslation(key, locale, result);
                        }
                    }
                }
            }
        }
        this.closeBtn['disabled'] = false;
        this.is_running = false;
    }
    addTranslation(key, locale, result) {
        const el = document.createElement("div");
        el.classList.add("item");
        el.innerHTML = `<div class="source">${key}</div><div class="result"><span>${result}</span><span>${locale}</span></div>`;
        this.scrollEl.prepend(el);
    }
    postCreation() {
        super.postCreation();
    }
    __68a6f2046cb9c9d100a4c888b5011073method0() {
        return this.fallback;
    }
    __68a6f2046cb9c9d100a4c888b5011073method1() {
        return this.is_running;
    }
}
TranslateAllPopup.Namespace=`AventusI18nView`;
TranslateAllPopup.Tag=`av-translate-all-popup`;
_.TranslateAllPopup=TranslateAllPopup;
if(!window.customElements.get('av-translate-all-popup')){window.customElements.define('av-translate-all-popup', TranslateAllPopup);Aventus.WebComponentInstance.registerDefinition(TranslateAllPopup);}

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
      "fct": (c, ...args) => c.comp.onChange.apply(c.comp, ...args),
      "isCallback": true
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

const TranslationRow = class TranslationRow extends Aventus.WebComponent {
    get 'key'() {
						return this.__watch["key"];
					}
					set 'key'(val) {
						this.__watch["key"] = val;
					}get 'locales'() {
						return this.__watch["locales"];
					}
					set 'locales'(val) {
						this.__watch["locales"] = val;
					}    parsedItem;
    hasChanged = false;
    cols = {};
    change = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("key");this.__addWatchesActions("locales");    super.__registerWatchesActions();
}
    static __style = `:host{align-items:stretch;border-left:1px solid var(--vscode-widget-border);border-right:1px solid var(--vscode-widget-border);display:flex;gap:0px}:host .col{border-right:1px solid var(--vscode-widget-border);padding:10px 20px}:host .inputs{display:flex;gap:0px}:host .key{flex-shrink:0;position:relative;width:var(--_translation-page-key-width);min-width:100px}:host(:nth-child(odd)){background-color:rgba(87,87,87,.2);background-color:var(--vscode-editorWidget-background)}:host(:nth-last-child(1)){border-bottom:1px solid var(--vscode-widget-border);border-bottom-left-radius:5px;border-bottom-right-radius:5px}`;
    __getStatic() {
        return TranslationRow;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TranslationRow.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="col key">	<vscode-label _id="translationrow_0"></vscode-label>	<av-resize is_key></av-resize></div><div class="inputs" _id="translationrow_1"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "inputsEl",
      "ids": [
        "translationrow_1"
      ]
    }
  ],
  "content": {
    "translationrow_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__c86b13a0b49a096fc47a9596b8ca6beemethod0())}`,
      "once": true
    }
  }
}); }
    getClassName() {
        return "TranslationRow";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["key"] = undefined;w["locales"] = undefined; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('key');this.__correctGetter('locales'); }
    loadData() {
        this.hasChanged = false;
        for (let locale of this.locales) {
            this.createCol(locale);
        }
    }
    updateData(data) {
        this.parsedItem = data;
        for (let locale of this.locales) {
            if (this.cols[locale]) {
                this.cols[locale].value = this.parsedItem[locale];
                this.cols[locale].initialValue = this.parsedItem[locale];
            }
        }
    }
    createCol(locale) {
        const col = new TranslationCol();
        col.locale = locale;
        col.value = this.parsedItem[locale];
        col.initialValue = this.parsedItem[locale];
        col.change.add((value) => {
            debugger;
            this.parsedItem[locale] = value;
            const hasChanged = value != col.initialValue;
            if (this.hasChanged != hasChanged) {
                this.hasChanged = hasChanged;
            }
            this.change.trigger();
        });
        col.classList.add("col");
        this.cols[locale] = col;
        this.inputsEl.appendChild(col);
    }
    search(txt, onlyMissing) {
        let isVisible = false;
        if (txt == "") {
            isVisible = true;
        }
        else if (StringTools.search(this.key, txt)) {
            isVisible = true;
        }
        else {
            for (let locale in this.parsedItem) {
                const value = this.parsedItem[locale];
                if (StringTools.search(value, txt)) {
                    isVisible = true;
                    break;
                }
            }
        }
        if (!isVisible) {
            this.style.display = 'none';
        }
        else {
            if (onlyMissing) {
                isVisible = false;
                for (let locale of this.locales) {
                    const value = this.parsedItem[locale];
                    if (value == TranslationPage.KeyUndefined || !value) {
                        isVisible = true;
                        break;
                    }
                }
            }
            if (isVisible) {
                this.style.display = '';
            }
            else {
                this.style.display = 'none';
            }
        }
    }
    postCreation() {
        this.loadData();
    }
    __c86b13a0b49a096fc47a9596b8ca6beemethod0() {
        return this.key;
    }
}
TranslationRow.Namespace=`AventusI18nView`;
TranslationRow.Tag=`av-translation-row`;
_.TranslationRow=TranslationRow;
if(!window.customElements.get('av-translation-row')){window.customElements.define('av-translation-row', TranslationRow);Aventus.WebComponentInstance.registerDefinition(TranslationRow);}

const TranslationRowHeader = class TranslationRowHeader extends Aventus.WebComponent {
    get 'locales'() {
						return this.__watch["locales"];
					}
					set 'locales'(val) {
						this.__watch["locales"] = val;
					}    __registerWatchesActions() {
    this.__addWatchesActions("locales");    super.__registerWatchesActions();
}
    static __style = `:host{align-items:stretch;border-bottom:1px solid var(--vscode-widget-border);border-left:1px solid var(--vscode-widget-border);border-right:1px solid var(--vscode-widget-border);display:flex;font-weight:bold;gap:0px;height:39px;text-align:center;user-select:none}:host .key{align-items:center;border-right:1px solid var(--vscode-widget-border);display:flex;flex-shrink:0;justify-content:center;min-width:100px;padding:10px 20px;position:relative;width:var(--_translation-page-key-width)}:host .inputs{display:flex;gap:0px}`;
    __getStatic() {
        return TranslationRowHeader;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TranslationRowHeader.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="key">    <span>Key</span>    <av-resize is_key></av-resize></div><div class="inputs"><template _id="translationrowheader_0"></template></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();const templ0 = new Aventus.Template(this);templ0.setTemplate(`    <av-translation-col-header _id="translationrowheader_1"></av-translation-col-header>`);templ0.setActions({
  "content": {
    "translationrowheader_1°@HTML": {
      "fct": (c) => `${c.print(c.comp.__189fa087d6daa05734acb2853341f755method2(c.data.locale))}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "translationrowheader_1",
      "injectionName": "locale",
      "inject": (c) => c.comp.__189fa087d6daa05734acb2853341f755method1(c.data.locale),
      "once": true
    }
  ]
});this.__getStatic().__template.addLoop({
                    anchorId: 'translationrowheader_0',
                    template: templ0,
                simple:{data: "this.locales",item:"locale"}}); }
    getClassName() {
        return "TranslationRowHeader";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["locales"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('locales'); }
    __189fa087d6daa05734acb2853341f755method2(locale) {
        return locale;
    }
    __189fa087d6daa05734acb2853341f755method1(locale) {
        return locale;
    }
}
TranslationRowHeader.Namespace=`AventusI18nView`;
TranslationRowHeader.Tag=`av-translation-row-header`;
_.TranslationRowHeader=TranslationRowHeader;
if(!window.customElements.get('av-translation-row-header')){window.customElements.define('av-translation-row-header', TranslationRowHeader);Aventus.WebComponentInstance.registerDefinition(TranslationRowHeader);}

const TranslationPage = class TranslationPage extends Aventus.WebComponent {
    static get observedAttributes() {return ["need_save", "has_empty"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'is_init'() { return this.getBoolAttr('is_init') }
    set 'is_init'(val) { this.setBoolAttr('is_init', val) }    get 'need_save'() { return this.getBoolProp('need_save') }
    set 'need_save'(val) { this.setBoolAttr('need_save', val) }get 'has_empty'() { return this.getBoolProp('has_empty') }
    set 'has_empty'(val) { this.setBoolAttr('has_empty', val) }    get 'fallback'() {
						return this.__watch["fallback"];
					}
					set 'fallback'(val) {
						this.__watch["fallback"] = val;
					}get 'searchTxt'() {
						return this.__watch["searchTxt"];
					}
					set 'searchTxt'(val) {
						this.__watch["searchTxt"] = val;
					}get 'onlyMissing'() {
						return this.__watch["onlyMissing"];
					}
					set 'onlyMissing'(val) {
						this.__watch["onlyMissing"] = val;
					}get 'importMissingBtn'() {
						return this.__watch["importMissingBtn"];
					}
					set 'importMissingBtn'(val) {
						this.__watch["importMissingBtn"] = val;
					}get 'pageName'() {
						return this.__watch["pageName"];
					}
					set 'pageName'(val) {
						this.__watch["pageName"] = val;
					}get 'locales'() {
						return this.__watch["locales"];
					}
					set 'locales'(val) {
						this.__watch["locales"] = val;
					}    static KeyUndefined = "ⵌⵌ";
    parsed = {};
    guard = new Aventus.ActionGuard();
    rows = {};
    __registerWatchesActions() {
    this.__addWatchesActions("fallback");this.__addWatchesActions("searchTxt", ((target) => {
    target.search();
}));this.__addWatchesActions("onlyMissing", ((target) => {
    target.search();
}));this.__addWatchesActions("importMissingBtn");this.__addWatchesActions("pageName");this.__addWatchesActions("locales");    super.__registerWatchesActions();
}
    static __style = `:host{--_translation-page-key-width: var(--translation-page-key-width, 300px)}:host{display:none;flex-direction:column;height:100%;margin:0;margin-block:0 !important;width:100%}:host vscode-scrollable{height:calc(100% - 190px);margin:0 20px;width:calc(100% - 40px)}:host av-scrollable{--scroller-width: 0;height:min-content;min-height:0}:host .header{flex-shrink:0;height:177px;padding:20px;padding-bottom:0}:host .header .bar{display:flex;justify-content:space-between;width:100%;gap:20px}:host .header .bar .menu-actions{display:flex;flex-wrap:nowrap;gap:50px}:host .header .bar .menu-actions div{display:flex;margin:15px 0;white-space:nowrap;height:26px}:host .header .bar .menu-actions div vscode-label{margin-right:14px;text-align:right;width:auto}:host .header .bar .menu-actions div vscode-textfield{width:auto}:host .header .menu{border:1px solid var(--vscode-widget-border);padding:8px}:host .header .menu vscode-icon{background-color:rgba(0,0,0,0);cursor:pointer;padding:8px;transition:background-color linear .2s}:host .header .menu vscode-icon:hover{background-color:var(--vscode-button-secondaryBackground)}:host .content{display:flex;flex-direction:column}:host([is_init]){display:flex}`;
    constructor() {
        super();
        this.triggerChange = this.triggerChange.bind(this);
    }
    __getStatic() {
        return TranslationPage;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(TranslationPage.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="header">    <div class="bar">        <h1 class="title" _id="translationpage_0"></h1>        <div class="menu-actions">            <div>                <vscode-label>Recherche:</vscode-label>                <vscode-textfield _id="translationpage_1"></vscode-textfield>            </div>        </div>    </div>    <div class="menu">        <av-icon-tooltip name="save" _id="translationpage_2">Save</av-icon-tooltip>        <av-icon-tooltip name="bug" _id="translationpage_3">Only missing</av-icon-tooltip>        <template _id="translationpage_4"></template>        <template _id="translationpage_6"></template>    </div>    <av-scrollable x_scroll y_scroll="true" mouse_drag auto_hide _id="translationpage_8">        <av-translation-row-header _id="translationpage_9"></av-translation-row-header>    </av-scrollable></div><vscode-scrollable>    <av-scrollable x_scroll y_scroll="true" mouse_drag auto_hide _id="translationpage_10">        <div class="content" _id="translationpage_11">        </div>    </av-scrollable></vscode-scrollable>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();this.__getStatic().__template.setActions({
  "elements": [
    {
      "name": "headerEl",
      "ids": [
        "translationpage_8"
      ]
    },
    {
      "name": "bodyEl",
      "ids": [
        "translationpage_10"
      ]
    },
    {
      "name": "contentEl",
      "ids": [
        "translationpage_11"
      ]
    }
  ],
  "content": {
    "translationpage_0°@HTML": {
      "fct": (c) => `${c.print(c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method2())}`,
      "once": true
    }
  },
  "injection": [
    {
      "id": "translationpage_2",
      "injectionName": "notif",
      "inject": (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method5(),
      "once": true
    },
    {
      "id": "translationpage_3",
      "injectionName": "active",
      "inject": (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method6(),
      "once": true
    },
    {
      "id": "translationpage_9",
      "injectionName": "locales",
      "inject": (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method8(),
      "once": true
    }
  ],
  "bindings": [
    {
      "id": "translationpage_1",
      "injectionName": "value",
      "eventNames": [
        "keyup"
      ],
      "inject": (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method3(),
      "extract": (c, v) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method4(v),
      "once": true
    }
  ],
  "pressEvents": [
    {
      "id": "translationpage_2",
      "onPress": (e, pressInstance, c) => { c.comp.save(e, pressInstance); }
    },
    {
      "id": "translationpage_3",
      "onPress": (e, pressInstance, c) => { c.comp.toogleOnlyMissing(e, pressInstance); }
    }
  ]
});const templ0 = new Aventus.Template(this);templ0.setTemplate(`            <av-icon-tooltip name="check-all" _id="translationpage_5">Translate all</av-icon-tooltip>        `);templ0.setActions({
  "injection": [
    {
      "id": "translationpage_5",
      "injectionName": "active",
      "inject": (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method7(),
      "once": true
    }
  ],
  "pressEvents": [
    {
      "id": "translationpage_5",
      "onPress": (e, pressInstance, c) => { c.comp.translateAll(e, pressInstance); }
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'translationpage_4',
                    parts: [{once: true,
                    condition: (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method0(),
                    template: templ0
                }]
            });const templ1 = new Aventus.Template(this);templ1.setTemplate(`            <av-icon-tooltip name="warning" _id="translationpage_7">Import missing</av-icon-tooltip>        `);templ1.setActions({
  "pressEvents": [
    {
      "id": "translationpage_7",
      "onPress": (e, pressInstance, c) => { c.comp.importMissing(e, pressInstance); }
    }
  ]
});this.__getStatic().__template.addIf({
                    anchorId: 'translationpage_6',
                    parts: [{once: true,
                    condition: (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method1(),
                    template: templ1
                }]
            }); }
    getClassName() {
        return "TranslationPage";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('is_init')) { this.attributeChangedCallback('is_init', false, false); }if(!this.hasAttribute('need_save')) { this.attributeChangedCallback('need_save', false, false); }if(!this.hasAttribute('has_empty')) { this.attributeChangedCallback('has_empty', false, false); } }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["fallback"] = "en-GB";w["searchTxt"] = "";w["onlyMissing"] = false;w["importMissingBtn"] = false;w["pageName"] = "";w["locales"] = []; }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('is_init');this.__upgradeProperty('need_save');this.__upgradeProperty('has_empty');this.__correctGetter('fallback');this.__correctGetter('searchTxt');this.__correctGetter('onlyMissing');this.__correctGetter('importMissingBtn');this.__correctGetter('pageName');this.__correctGetter('locales'); }
    __listBoolProps() { return ["is_init","need_save","has_empty"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    syncScroll() {
        this.headerEl?.onScrollChange.add((x, y) => {
            if (this.bodyEl?.x != x) {
                this.bodyEl?.scrollX(x);
            }
        });
        this.bodyEl?.onScrollChange.add((x, y) => {
            if (this.headerEl?.x != x) {
                this.headerEl?.scrollX(x);
            }
        });
        new Aventus.ResizeObserver(() => {
            this.style.setProperty("--content-width", this.headerEl.offsetWidth - 2 + "px");
        }).observe(this.headerEl);
        this.style.setProperty("--content-width", this.headerEl.offsetWidth - 2 + "px");
    }
    async triggerChange() {
        debugger;
        this.guard.run(['triggerChange'], async () => {
            // Loading.show();
            try {
                const promise = VscodeView.Router.getInstance().sendWithResponse({
                    channel: "triggerChange",
                    body: this.parsed
                });
                this.calculateEmpty();
                await promise;
            }
            catch { }
            // Loading.hide();
        });
    }
    async save() {
        if (!this.need_save)
            return;
        this.guard.run(['save'], async () => {
            Loading.show();
            try {
                await VscodeView.Router.getInstance().sendWithResponse({
                    channel: "save"
                });
            }
            catch { }
            Loading.hide();
        });
    }
    addRoutes() {
        VscodeView.Router.getInstance().addRoute({
            channel: 'has_missing',
            callback: (value) => {
                this.importMissingBtn = value;
            }
        });
    }
    importMissing() {
        this.guard.run(['import_missing'], async () => {
            Loading.show();
            try {
                const result = await VscodeView.Router.getInstance().sendWithResponse({
                    channel: "import_missing",
                    body: {}
                });
                if (result.result)
                    this.parsed = result.result;
            }
            catch { }
            Loading.hide();
        });
    }
    search() {
        const txt = this.searchTxt;
        const onlyMissing = this.onlyMissing;
        for (let key in this.rows) {
            this.rows[key].search(txt, onlyMissing);
        }
    }
    calculateEmpty() {
        let result = false;
        for (let key in this.parsed) {
            for (let locale of this.locales) {
                if (!this.parsed[key][locale] || this.parsed[key][locale] == TranslationPage.KeyUndefined) {
                    result = true;
                    break;
                }
            }
            if (result) {
                break;
            }
        }
        this.has_empty = result;
    }
    render() {
        while (this.contentEl.lastElementChild) {
            this.contentEl.lastElementChild.remove();
        }
        let search = this.searchTxt != "";
        for (let key in this.parsed) {
            const row = new TranslationRow();
            row.key = key;
            row.parsedItem = this.parsed[key];
            row.locales = this.locales;
            row.change.add(this.triggerChange);
            this.rows[key] = row;
            this.contentEl.appendChild(row);
            if (search)
                row.search(this.searchTxt, this.onlyMissing);
        }
        const w = "calc((var(--content-width) - var(--_translation-page-key-width)) / " + this.locales.length + ")";
        for (let locale of this.locales) {
            this.style.setProperty("--col-width-" + locale, w);
        }
        this.calculateEmpty();
    }
    async init() {
        await this.guard.run(['init'], async () => {
            Loading.show();
            const result = await VscodeView.Router.getInstance().sendWithResponse({
                channel: "init",
                body: {}
            });
            if (result.result) {
                this.locales = result.result.locales;
                this.searchTxt = result.result.filter ?? '';
                this.parsed = result.result.content;
                this.pageName = result.result.pageName;
                this.render();
            }
            this.is_init = true;
            Loading.hide();
        });
        VscodeView.Router.getInstance().addRoute({
            channel: "is_dirty",
            callback: (data) => {
                this.need_save = data;
            }
        });
        VscodeView.Router.getInstance().addRoute({
            channel: "update_content",
            callback: (data) => {
                const oldKeys = Object.keys(this.parsed);
                this.parsed = data;
                for (let key in this.parsed) {
                    if (this.rows[key]) {
                        let index = oldKeys.indexOf(key);
                        if (index > -1) {
                            oldKeys.splice(index, 1);
                        }
                        this.rows[key].updateData(this.parsed[key]);
                    }
                    else {
                        const row = new TranslationRow();
                        row.key = key;
                        row.parsedItem = this.parsed[key];
                        row.locales = this.locales;
                        row.change.add(this.triggerChange);
                        this.rows[key] = row;
                        this.contentEl.appendChild(row);
                    }
                }
                for (let key of oldKeys) {
                    if (this.rows[key]) {
                        this.rows[key].remove();
                        delete this.rows[key];
                    }
                }
            }
        });
    }
    toogleOnlyMissing() {
        this.onlyMissing = !this.onlyMissing;
    }
    async translateAll() {
        await this.guard.run(['translateAll'], async () => {
            let popup = new TranslateAllPopup();
            popup.parsed = this.parsed;
            popup.locales = this.locales;
            popup.fallback = this.fallback;
            this.shadowRoot.appendChild(popup);
            await popup.run();
            this.calculateEmpty();
            this.render();
            await this.triggerChange();
        });
    }
    postCreation() {
        super.postCreation();
        let vscodeElements = npmCompilation['1608514c9acd4a97df63533df1b9d0fd'].VscodeElement;
        this.syncScroll();
        this.init();
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method2() {
        return this.pageName;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method0() {
        return this.has_empty;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method1() {
        return this.importMissingBtn;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method5() {
        return this.need_save;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method6() {
        return this.onlyMissing;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method7() {
        return this.onlyMissing;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method8() {
        return this.locales;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method3() {
        return this.searchTxt;
    }
    __30556103ea6c6df6f19f3f0f01bfbf73method4(v) {
        if (this) {
            this.searchTxt = v;
        }
    }
}
TranslationPage.Namespace=`AventusI18nView`;
TranslationPage.Tag=`av-translation-page`;
_.TranslationPage=TranslationPage;
if(!window.customElements.get('av-translation-page')){window.customElements.define('av-translation-page', TranslationPage);Aventus.WebComponentInstance.registerDefinition(TranslationPage);}

const Resize = class Resize extends Aventus.WebComponent {
    static get observedAttributes() {return ["locale", "is_key"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'locale'() { return this.getStringProp('locale') }
    set 'locale'(val) { this.setStringAttr('locale', val) }get 'is_key'() { return this.getBoolProp('is_key') }
    set 'is_key'(val) { this.setBoolAttr('is_key', val) }    static __style = `:host{bottom:0;cursor:col-resize;position:absolute;right:-4px;top:0;width:8px}`;
    __getStatic() {
        return Resize;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(Resize.__style);
        return arrStyle;
    }
    __getHtml() {
    this.__getStatic().__template.setHTML({
        slots: { 'default':`<slot></slot>` }, 
        blocks: { 'default':`<slot></slot>` }
    });
}
    getClassName() {
        return "Resize";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('locale')){ this['locale'] = ""; }if(!this.hasAttribute('is_key')) { this.attributeChangedCallback('is_key', false, false); } }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('locale');this.__upgradeProperty('is_key'); }
    __listBoolProps() { return ["is_key"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    postCreation() {
        let page = this.findParentByType(TranslationPage);
        let width = 0;
        let startX = 0;
        let _parent = this.parentNode;
        if (_parent instanceof ShadowRoot) {
            _parent = _parent.host;
        }
        const parent = _parent;
        new Aventus.DragAndDrop({
            element: this,
            applyDrag: false,
            offsetDrag: 0,
            onStart: (e) => {
                width = parent.offsetWidth;
                startX = e.clientX;
            },
            onMove: (e) => {
                let newW = width + (e.clientX - startX);
                if (this.is_key) {
                    if (newW > page.offsetWidth / 2) {
                        newW = page.offsetWidth / 2;
                    }
                    page.style.setProperty("--translation-page-key-width", newW + 'px');
                }
                else {
                    page.style.setProperty("--col-width-" + this.locale, newW + 'px');
                }
            }
        });
    }
}
Resize.Namespace=`AventusI18nView`;
Resize.Tag=`av-resize`;
_.Resize=Resize;
if(!window.customElements.get('av-resize')){window.customElements.define('av-resize', Resize);Aventus.WebComponentInstance.registerDefinition(Resize);}


for(let key in _) { AventusI18nView[key] = _[key] }
})(AventusI18nView);
