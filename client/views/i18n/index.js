var npmCompilation;
(npmCompilation||(npmCompilation = {}));
(function (npmCompilation) {
	var _=(()=>{var Lt=Object.defineProperty;var Bs=Object.getOwnPropertyDescriptor;var Ts=Object.getOwnPropertyNames;var zs=Object.prototype.hasOwnProperty;var to=(r,e)=>{for(var t in e)Lt(r,t,{get:e[t],enumerable:!0})},Ds=(r,e,t,o)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of Ts(e))!zs.call(r,i)&&i!==t&&Lt(r,i,{get:()=>e[i],enumerable:!(o=Bs(e,i))||o.enumerable});return r};var Ls=r=>Ds(Lt({},"__esModule",{value:!0}),r);var Zi={};to(Zi,{default:()=>Xi});var eo={};to(eo,{VscodeBadge:()=>Oe,VscodeButton:()=>V,VscodeCheckbox:()=>F,VscodeCheckboxGroup:()=>ce,VscodeCollapsible:()=>ue,VscodeContextMenu:()=>Q,VscodeContextMenuItem:()=>ie,VscodeDivider:()=>Re,VscodeFormContainer:()=>re,VscodeFormGroup:()=>Be,VscodeFormHelper:()=>Ge,VscodeIcon:()=>Y,VscodeLabel:()=>fe,VscodeMultiSelect:()=>X,VscodeOption:()=>de,VscodeProgressRing:()=>me,VscodeRadio:()=>T,VscodeRadioGroup:()=>ee,VscodeScrollable:()=>L,VscodeSingleSelect:()=>N,VscodeSplitLayout:()=>M,VscodeTabHeader:()=>K,VscodeTabPanel:()=>te,VscodeTable:()=>I,VscodeTableBody:()=>ze,VscodeTableCell:()=>ve,VscodeTableHeader:()=>De,VscodeTableHeaderCell:()=>Le,VscodeTableRow:()=>Me,VscodeTabs:()=>ne,VscodeTextarea:()=>E,VscodeTextfield:()=>C,VscodeToolbarButton:()=>se,VscodeToolbarContainer:()=>tt,VscodeTree:()=>q});var pt=globalThis,ut=pt.ShadowRoot&&(pt.ShadyCSS===void 0||pt.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,Mt=Symbol(),oo=new WeakMap,ot=class{constructor(e,t,o){if(this._$cssResult$=!0,o!==Mt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(ut&&e===void 0){let o=t!==void 0&&t.length===1;o&&(e=oo.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),o&&oo.set(t,e))}return e}toString(){return this.cssText}},be=r=>new ot(typeof r=="string"?r:r+"",void 0,Mt),h=(r,...e)=>{let t=r.length===1?r[0]:e.reduce(((o,i,s)=>o+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+r[s+1]),r[0]);return new ot(t,r,Mt)},so=(r,e)=>{if(ut)r.adoptedStyleSheets=e.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(let t of e){let o=document.createElement("style"),i=pt.litNonce;i!==void 0&&o.setAttribute("nonce",i),o.textContent=t.cssText,r.appendChild(o)}},Ft=ut?r=>r:r=>r instanceof CSSStyleSheet?(e=>{let t="";for(let o of e.cssRules)t+=o.cssText;return be(t)})(r):r;var{is:Ms,defineProperty:Fs,getOwnPropertyDescriptor:Hs,getOwnPropertyNames:js,getOwnPropertySymbols:qs,getPrototypeOf:Ns}=Object,ft=globalThis,io=ft.trustedTypes,Us=io?io.emptyScript:"",Ws=ft.reactiveElementPolyfillSupport,st=(r,e)=>r,it={toAttribute(r,e){switch(e){case Boolean:r=r?Us:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,e){let t=r;switch(e){case Boolean:t=r!==null;break;case Number:t=r===null?null:Number(r);break;case Object:case Array:try{t=JSON.parse(r)}catch{t=null}}return t}},mt=(r,e)=>!Ms(r,e),ro={attribute:!0,type:String,converter:it,reflect:!1,useDefault:!1,hasChanged:mt};Symbol.metadata??=Symbol("metadata"),ft.litPropertyMetadata??=new WeakMap;var he=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ro){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let o=Symbol(),i=this.getPropertyDescriptor(e,o,t);i!==void 0&&Fs(this.prototype,e,i)}}static getPropertyDescriptor(e,t,o){let{get:i,set:s}=Hs(this.prototype,e)??{get(){return this[t]},set(n){this[t]=n}};return{get:i,set(n){let l=i?.call(this);s?.call(this,n),this.requestUpdate(e,l,o)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ro}static _$Ei(){if(this.hasOwnProperty(st("elementProperties")))return;let e=Ns(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(st("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(st("properties"))){let t=this.properties,o=[...js(t),...qs(t)];for(let i of o)this.createProperty(i,t[i])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[o,i]of t)this.elementProperties.set(o,i)}this._$Eh=new Map;for(let[t,o]of this.elementProperties){let i=this._$Eu(t,o);i!==void 0&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let o=new Set(e.flat(1/0).reverse());for(let i of o)t.unshift(Ft(i))}else e!==void 0&&t.push(Ft(e));return t}static _$Eu(e,t){let o=t.attribute;return o===!1?void 0:typeof o=="string"?o:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise((e=>this.enableUpdating=e)),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach((e=>e(this)))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let o of t.keys())this.hasOwnProperty(o)&&(e.set(o,this[o]),delete this[o]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return so(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach((e=>e.hostConnected?.()))}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach((e=>e.hostDisconnected?.()))}attributeChangedCallback(e,t,o){this._$AK(e,o)}_$ET(e,t){let o=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,o);if(i!==void 0&&o.reflect===!0){let s=(o.converter?.toAttribute!==void 0?o.converter:it).toAttribute(t,o.type);this._$Em=e,s==null?this.removeAttribute(i):this.setAttribute(i,s),this._$Em=null}}_$AK(e,t){let o=this.constructor,i=o._$Eh.get(e);if(i!==void 0&&this._$Em!==i){let s=o.getPropertyOptions(i),n=typeof s.converter=="function"?{fromAttribute:s.converter}:s.converter?.fromAttribute!==void 0?s.converter:it;this._$Em=i,this[i]=n.fromAttribute(t,s.type)??this._$Ej?.get(i)??null,this._$Em=null}}requestUpdate(e,t,o){if(e!==void 0){let i=this.constructor,s=this[e];if(o??=i.getPropertyOptions(e),!((o.hasChanged??mt)(s,t)||o.useDefault&&o.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(i._$Eu(e,o))))return;this.C(e,t,o)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:o,reflect:i,wrapped:s},n){o&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),s!==!0||n!==void 0)||(this._$AL.has(e)||(this.hasUpdated||o||(t=void 0),this._$AL.set(e,t)),i===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,s]of this._$Ep)this[i]=s;this._$Ep=void 0}let o=this.constructor.elementProperties;if(o.size>0)for(let[i,s]of o){let{wrapped:n}=s,l=this[i];n!==!0||this._$AL.has(i)||l===void 0||this.C(i,void 0,s,l)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach((o=>o.hostUpdate?.())),this.update(t)):this._$EM()}catch(o){throw e=!1,this._$EM(),o}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach((t=>this._$ET(t,this[t]))),this._$EM()}updated(e){}firstUpdated(e){}};he.elementStyles=[],he.shadowRootOptions={mode:"open"},he[st("elementProperties")]=new Map,he[st("finalized")]=new Map,Ws?.({ReactiveElement:he}),(ft.reactiveElementVersions??=[]).push("2.1.0");var jt=globalThis,vt=jt.trustedTypes,no=vt?vt.createPolicy("lit-html",{createHTML:r=>r}):void 0,qt="$lit$",pe=`lit$${Math.random().toFixed(9).slice(2)}$`,Nt="?"+pe,Ks=`<${Nt}>`,$e=document,nt=()=>$e.createComment(""),lt=r=>r===null||typeof r!="object"&&typeof r!="function",Ut=Array.isArray,uo=r=>Ut(r)||typeof r?.[Symbol.iterator]=="function",Ht=`[ 	
\f\r]`,rt=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,lo=/-->/g,ao=/>/g,ke=RegExp(`>|${Ht}(?:([^\\s"'>=/]+)(${Ht}*=${Ht}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),co=/'/g,ho=/"/g,fo=/^(?:script|style|textarea|title)$/i,Wt=r=>(e,...t)=>({_$litType$:r,strings:e,values:t}),c=Wt(1),sr=Wt(2),ir=Wt(3),G=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),po=new WeakMap,Ee=$e.createTreeWalker($e,129);function mo(r,e){if(!Ut(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return no!==void 0?no.createHTML(e):e}var vo=(r,e)=>{let t=r.length-1,o=[],i,s=e===2?"<svg>":e===3?"<math>":"",n=rt;for(let l=0;l<t;l++){let d=r[l],b,y,v=-1,x=0;for(;x<d.length&&(n.lastIndex=x,y=n.exec(d),y!==null);)x=n.lastIndex,n===rt?y[1]==="!--"?n=lo:y[1]!==void 0?n=ao:y[2]!==void 0?(fo.test(y[2])&&(i=RegExp("</"+y[2],"g")),n=ke):y[3]!==void 0&&(n=ke):n===ke?y[0]===">"?(n=i??rt,v=-1):y[1]===void 0?v=-2:(v=n.lastIndex-y[2].length,b=y[1],n=y[3]===void 0?ke:y[3]==='"'?ho:co):n===ho||n===co?n=ke:n===lo||n===ao?n=rt:(n=ke,i=void 0);let w=n===ke&&r[l+1].startsWith("/>")?" ":"";s+=n===rt?d+Ks:v>=0?(o.push(b),d.slice(0,v)+qt+d.slice(v)+pe+w):d+pe+(v===-2?l:w)}return[mo(r,s+(r[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),o]},at=class r{constructor({strings:e,_$litType$:t},o){let i;this.parts=[];let s=0,n=0,l=e.length-1,d=this.parts,[b,y]=vo(e,t);if(this.el=r.createElement(b,o),Ee.currentNode=this.el.content,t===2||t===3){let v=this.el.content.firstChild;v.replaceWith(...v.childNodes)}for(;(i=Ee.nextNode())!==null&&d.length<l;){if(i.nodeType===1){if(i.hasAttributes())for(let v of i.getAttributeNames())if(v.endsWith(qt)){let x=y[n++],w=i.getAttribute(v).split(pe),z=/([.?@])?(.*)/.exec(x);d.push({type:1,index:s,name:z[2],strings:w,ctor:z[1]==="."?_t:z[1]==="?"?gt:z[1]==="@"?yt:Ie}),i.removeAttribute(v)}else v.startsWith(pe)&&(d.push({type:6,index:s}),i.removeAttribute(v));if(fo.test(i.tagName)){let v=i.textContent.split(pe),x=v.length-1;if(x>0){i.textContent=vt?vt.emptyScript:"";for(let w=0;w<x;w++)i.append(v[w],nt()),Ee.nextNode(),d.push({type:2,index:++s});i.append(v[x],nt())}}}else if(i.nodeType===8)if(i.data===Nt)d.push({type:2,index:s});else{let v=-1;for(;(v=i.data.indexOf(pe,v+1))!==-1;)d.push({type:7,index:s}),v+=pe.length-1}s++}}static createElement(e,t){let o=$e.createElement("template");return o.innerHTML=e,o}};function Se(r,e,t=r,o){if(e===G)return e;let i=o!==void 0?t._$Co?.[o]:t._$Cl,s=lt(e)?void 0:e._$litDirective$;return i?.constructor!==s&&(i?._$AO?.(!1),s===void 0?i=void 0:(i=new s(r),i._$AT(r,t,o)),o!==void 0?(t._$Co??=[])[o]=i:t._$Cl=i),i!==void 0&&(e=Se(r,i._$AS(r,e.values),i,o)),e}var bt=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:o}=this._$AD,i=(e?.creationScope??$e).importNode(t,!0);Ee.currentNode=i;let s=Ee.nextNode(),n=0,l=0,d=o[0];for(;d!==void 0;){if(n===d.index){let b;d.type===2?b=new je(s,s.nextSibling,this,e):d.type===1?b=new d.ctor(s,d.name,d.strings,this,e):d.type===6&&(b=new xt(s,this,e)),this._$AV.push(b),d=o[++l]}n!==d?.index&&(s=Ee.nextNode(),n++)}return Ee.currentNode=$e,i}p(e){let t=0;for(let o of this._$AV)o!==void 0&&(o.strings!==void 0?(o._$AI(e,o,t),t+=o.strings.length-2):o._$AI(e[t])),t++}},je=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,o,i){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=o,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Se(this,e,t),lt(e)?e===m||e==null||e===""?(this._$AH!==m&&this._$AR(),this._$AH=m):e!==this._$AH&&e!==G&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):uo(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==m&&lt(this._$AH)?this._$AA.nextSibling.data=e:this.T($e.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:o}=e,i=typeof o=="number"?this._$AC(e):(o.el===void 0&&(o.el=at.createElement(mo(o.h,o.h[0]),this.options)),o);if(this._$AH?._$AD===i)this._$AH.p(t);else{let s=new bt(i,this),n=s.u(this.options);s.p(t),this.T(n),this._$AH=s}}_$AC(e){let t=po.get(e.strings);return t===void 0&&po.set(e.strings,t=new at(e)),t}k(e){Ut(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,o,i=0;for(let s of e)i===t.length?t.push(o=new r(this.O(nt()),this.O(nt()),this,this.options)):o=t[i],o._$AI(s),i++;i<t.length&&(this._$AR(o&&o._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e&&e!==this._$AB;){let o=e.nextSibling;e.remove(),e=o}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},Ie=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,o,i,s){this.type=1,this._$AH=m,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=s,o.length>2||o[0]!==""||o[1]!==""?(this._$AH=Array(o.length-1).fill(new String),this.strings=o):this._$AH=m}_$AI(e,t=this,o,i){let s=this.strings,n=!1;if(s===void 0)e=Se(this,e,t,0),n=!lt(e)||e!==this._$AH&&e!==G,n&&(this._$AH=e);else{let l=e,d,b;for(e=s[0],d=0;d<s.length-1;d++)b=Se(this,l[o+d],t,d),b===G&&(b=this._$AH[d]),n||=!lt(b)||b!==this._$AH[d],b===m?e=m:e!==m&&(e+=(b??"")+s[d+1]),this._$AH[d]=b}n&&!i&&this.j(e)}j(e){e===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},_t=class extends Ie{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===m?void 0:e}},gt=class extends Ie{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==m)}},yt=class extends Ie{constructor(e,t,o,i,s){super(e,t,o,i,s),this.type=5}_$AI(e,t=this){if((e=Se(this,e,t,0)??m)===G)return;let o=this._$AH,i=e===m&&o!==m||e.capture!==o.capture||e.once!==o.once||e.passive!==o.passive,s=e!==m&&(o===m||i);i&&this.element.removeEventListener(this.name,this,o),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},xt=class{constructor(e,t,o){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=o}get _$AU(){return this._$AM._$AU}_$AI(e){Se(this,e)}},bo={M:qt,P:pe,A:Nt,C:1,L:vo,R:bt,D:uo,V:Se,I:je,H:Ie,N:gt,U:yt,B:_t,F:xt},Gs=jt.litHtmlPolyfillSupport;Gs?.(at,je),(jt.litHtmlVersions??=[]).push("3.3.0");var wt=(r,e,t)=>{let o=t?.renderBefore??e,i=o._$litPart$;if(i===void 0){let s=t?.renderBefore??null;o._$litPart$=i=new je(e.insertBefore(nt(),s),s,void 0,t??{})}return i._$AI(r),i};var Kt=globalThis,D=class extends he{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=wt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}};D._$litElement$=!0,D.finalized=!0,Kt.litElementHydrateSupport?.({LitElement:D});var Ys=Kt.litElementPolyfillSupport;Ys?.({LitElement:D});(Kt.litElementVersions??=[]).push("4.2.0");var Xs={attribute:!0,type:String,converter:it,reflect:!1,hasChanged:mt},Zs=(r=Xs,e,t)=>{let{kind:o,metadata:i}=t,s=globalThis.litPropertyMetadata.get(i);if(s===void 0&&globalThis.litPropertyMetadata.set(i,s=new Map),o==="setter"&&((r=Object.create(r)).wrapped=!0),s.set(t.name,r),o==="accessor"){let{name:n}=t;return{set(l){let d=e.get.call(this);e.set.call(this,l),this.requestUpdate(n,d,r)},init(l){return l!==void 0&&this.C(n,void 0,r,l),l}}}if(o==="setter"){let{name:n}=t;return function(l){let d=this[n];e.call(this,l),this.requestUpdate(n,d,r)}}throw Error("Unsupported decorator location: "+o)};function a(r){return(e,t)=>typeof t=="object"?Zs(r,e,t):((o,i,s)=>{let n=i.hasOwnProperty(s);return i.constructor.createProperty(s,o),n?Object.getOwnPropertyDescriptor(i,s):void 0})(r,e,t)}function _(r){return a({...r,state:!0,attribute:!1})}var ae=(r,e,t)=>(t.configurable=!0,t.enumerable=!0,Reflect.decorate&&typeof e!="object"&&Object.defineProperty(r,e,t),t);function S(r,e){return(t,o,i)=>{let s=n=>n.renderRoot?.querySelector(r)??null;if(e){let{get:n,set:l}=typeof o=="object"?t:i??(()=>{let d=Symbol();return{get(){return this[d]},set(b){this[d]=b}}})();return ae(t,o,{get(){let d=n.call(this);return d===void 0&&(d=s(this),(d!==null||this.hasUpdated)&&l.call(this,d)),d}})}return ae(t,o,{get(){return s(this)}})}}var Js;function _o(r){return(e,t)=>ae(e,t,{get(){return(this.renderRoot??(Js??=document.createDocumentFragment())).querySelectorAll(r)}})}function H(r){return(e,t)=>{let{slot:o,selector:i}=r??{},s="slot"+(o?`[name=${o}]`:":not([name])");return ae(e,t,{get(){let n=this.renderRoot?.querySelector(s),l=n?.assignedElements(r)??[];return i===void 0?l:l.filter((d=>d.matches(i)))}})}}function go(r){return(e,t)=>{let{slot:o}=r??{},i="slot"+(o?`[name=${o}]`:":not([name])");return ae(e,t,{get(){return this.renderRoot?.querySelector(i)?.assignedNodes(r)??[]}})}}var Gt="1.15.0",yo="__vscodeElements_disableRegistryWarning__",u=class extends D{get version(){return Gt}},p=r=>e=>{if(!customElements.get(r)){customElements.define(r,e);return}if(yo in window)return;let i=document.createElement(r)?.version,s="";i?i!==Gt?(s+="is already registered by a different version of VSCode Elements. ",s+=`This version is "${Gt}", while the other one is "${i}".`):s+="is already registered by the same version of VSCode Elements. ":(console.warn(r,"is already registered by an unknown custom element handler class."),s+="is already registered by an unknown custom element handler class."),console.warn(`[VSCode Elements] ${r} ${s}
To suppress this warning, set window.${yo} to true`)};var f=h`
  :host([hidden]) {
    display: none;
  }

  :host([disabled]),
  :host(:disabled) {
    cursor: not-allowed;
    opacity: 0.4;
    pointer-events: none;
  }
`;var xo=1.2307692307692308;function qe(){return navigator.userAgent.indexOf("Linux")>-1?'system-ui, "Ubuntu", "Droid Sans", sans-serif':navigator.userAgent.indexOf("Mac")>-1?"-apple-system, BlinkMacSystemFont, sans-serif":navigator.userAgent.indexOf("Windows")>-1?'"Segoe WPC", "Segoe UI", sans-serif':"sans-serif"}var Qs=be(qe()),ei=[f,h`
    :host {
      background-color: var(--vscode-badge-background, #616161);
      border: 1px solid var(--vscode-contrastBorder, transparent);
      border-radius: 2px;
      box-sizing: border-box;
      color: var(--vscode-badge-foreground, #f8f8f8);
      display: inline-block;
      font-family: var(--vscode-font-family, ${Qs});
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
  `],wo=ei;var Co=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Oe=class extends u{constructor(){super(...arguments),this.variant="default"}render(){return c` <slot></slot> `}};Oe.styles=wo;Co([a({reflect:!0})],Oe.prototype,"variant",void 0);Oe=Co([p("vscode-badge")],Oe);var Ne={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Ue=r=>(...e)=>({_$litDirective$:r,values:e}),_e=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,o){this._$Ct=e,this._$AM=t,this._$Ci=o}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var g=Ue(class extends _e{constructor(r){if(super(r),r.type!==Ne.ATTRIBUTE||r.name!=="class"||r.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(r){return" "+Object.keys(r).filter((e=>r[e])).join(" ")+" "}update(r,[e]){if(this.st===void 0){this.st=new Set,r.strings!==void 0&&(this.nt=new Set(r.strings.join(" ").split(/\s/).filter((o=>o!==""))));for(let o in e)e[o]&&!this.nt?.has(o)&&this.st.add(o);return this.render(e)}let t=r.element.classList;for(let o of this.st)o in e||(t.remove(o),this.st.delete(o));for(let o in e){let i=!!e[o];i===this.st.has(o)||this.nt?.has(o)||(i?(t.add(o),this.st.add(o)):(t.remove(o),this.st.delete(o)))}return G}});var k=r=>r??m;var Yt=class extends _e{constructor(e){if(super(e),this._prevProperties={},e.type!==Ne.PROPERTY||e.name!=="style")throw new Error("The `stylePropertyMap` directive must be used in the `style` property")}update(e,[t]){return Object.entries(t).forEach(([o,i])=>{this._prevProperties[o]!==i&&(o.startsWith("--")?e.element.style.setProperty(o,i):e.element.style[o]=i,this._prevProperties[o]=i)}),G}render(e){return G}},B=Ue(Yt);var ti=[f,h`
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
  `],ko=ti;var Ae=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},ct,Y=ct=class extends u{constructor(){super(...arguments),this.label="",this.name="",this.size=16,this.spin=!1,this.spinDuration=1.5,this.actionIcon=!1,this._onButtonClick=e=>{this.dispatchEvent(new CustomEvent("vsc-click",{detail:{originalEvent:e}}))}}connectedCallback(){super.connectedCallback();let{href:e,nonce:t}=this._getStylesheetConfig();ct.stylesheetHref=e,ct.nonce=t}_getStylesheetConfig(){let e=document.getElementById("vscode-codicon-stylesheet"),t=e?.getAttribute("href")||void 0,o=e?.nonce||void 0;if(!e){let i="[VSCode Elements] To use the Icon component, the codicons.css file must be included in the page with the id `vscode-codicon-stylesheet`! ";i+="See https://vscode-elements.github.io/components/icon/ for more details.",console.warn(i)}return{nonce:o,href:t}}render(){let{stylesheetHref:e,nonce:t}=ct,o=c`<span
      class=${g({codicon:!0,["codicon-"+this.name]:!0,spin:this.spin})}
      .style=${B({animationDuration:String(this.spinDuration)+"s",fontSize:this.size+"px",height:this.size+"px",width:this.size+"px"})}
    ></span>`,i=this.actionIcon?c` <button
          class="button"
          @click=${this._onButtonClick}
          aria-label=${this.label}
        >
          ${o}
        </button>`:c` <span class="icon" aria-hidden="true" role="presentation"
          >${o}</span
        >`;return c`
      <link
        rel="stylesheet"
        href=${k(e)}
        nonce=${k(t)}
      >
      ${i}
    `}};Y.styles=ko;Y.stylesheetHref="";Y.nonce="";Ae([a()],Y.prototype,"label",void 0);Ae([a({type:String})],Y.prototype,"name",void 0);Ae([a({type:Number})],Y.prototype,"size",void 0);Ae([a({type:Boolean,reflect:!0})],Y.prototype,"spin",void 0);Ae([a({type:Number,attribute:"spin-duration"})],Y.prototype,"spinDuration",void 0);Ae([a({type:Boolean,reflect:!0,attribute:"action-icon"})],Y.prototype,"actionIcon",void 0);Y=ct=Ae([p("vscode-icon")],Y);var oi=be(qe()),si=[f,h`
    :host {
      background-color: var(--vscode-button-background, #0078d4);
      border-color: var(--vscode-button-border, transparent);
      border-style: solid;
      border-radius: 2px;
      border-width: 1px;
      color: var(--vscode-button-foreground, #ffffff);
      cursor: pointer;
      display: inline-block;
      font-family: var(--vscode-font-family, ${oi});
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, normal);
      line-height: 22px;
      overflow: hidden;
      padding: 1px 13px;
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
    }

    slot {
      align-items: center;
      display: flex;
      height: 100%;
    }

    .icon {
      color: inherit;
      display: block;
      margin-right: 3px;
    }

    .icon-after {
      color: inherit;
      display: block;
      margin-left: 3px;
    }
  `],Eo=si;var j=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},V=class extends u{get form(){return this._internals.form}constructor(){super(),this.autofocus=!1,this.tabIndex=0,this.secondary=!1,this.role="button",this.disabled=!1,this.icon="",this.iconSpin=!1,this.iconAfter="",this.iconAfterSpin=!1,this.focused=!1,this.name=void 0,this.type="button",this.value="",this._prevTabindex=0,this._handleFocus=()=>{this.focused=!0},this._handleBlur=()=>{this.focused=!1},this.addEventListener("keydown",this._handleKeyDown.bind(this)),this.addEventListener("click",this._handleClick.bind(this)),this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.autofocus&&(this.tabIndex<0&&(this.tabIndex=0),this.updateComplete.then(()=>{this.focus(),this.requestUpdate()})),this.addEventListener("focus",this._handleFocus),this.addEventListener("blur",this._handleBlur)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("focus",this._handleFocus),this.removeEventListener("blur",this._handleBlur)}update(e){super.update(e),e.has("value")&&this._internals.setFormValue(this.value),e.has("disabled")&&(this.disabled?(this._prevTabindex=this.tabIndex,this.tabIndex=-1):this.tabIndex=this._prevTabindex)}_executeAction(){this.type==="submit"&&this._internals.form&&this._internals.form.requestSubmit(),this.type==="reset"&&this._internals.form&&this._internals.form.reset()}_handleKeyDown(e){if((e.key==="Enter"||e.key===" ")&&!this.hasAttribute("disabled")){this.dispatchEvent(new CustomEvent("vsc-click",{detail:{originalEvent:new MouseEvent("click")}}));let t=new MouseEvent("click",{bubbles:!0,cancelable:!0});t.synthetic=!0,this.dispatchEvent(t),this._executeAction()}}_handleClick(e){e.synthetic||this.hasAttribute("disabled")||(this.dispatchEvent(new CustomEvent("vsc-click",{detail:{originalEvent:e}})),this._executeAction())}render(){let e=this.icon!=="",t=this.iconAfter!=="",o={wrapper:!0,"has-icon-before":e,"has-icon-after":t},i=e?c`<vscode-icon
          name=${this.icon}
          ?spin=${this.iconSpin}
          spin-duration=${k(this.iconSpinDuration)}
          class="icon"
        ></vscode-icon>`:m,s=t?c`<vscode-icon
          name=${this.iconAfter}
          ?spin=${this.iconAfterSpin}
          spin-duration=${k(this.iconAfterSpinDuration)}
          class="icon-after"
        ></vscode-icon>`:m;return c`
      <span class=${g(o)}>
        ${i}
        <slot></slot>
        ${s}
      </span>
    `}};V.styles=Eo;V.formAssociated=!0;j([a({type:Boolean,reflect:!0})],V.prototype,"autofocus",void 0);j([a({type:Number,reflect:!0})],V.prototype,"tabIndex",void 0);j([a({type:Boolean,reflect:!0})],V.prototype,"secondary",void 0);j([a({reflect:!0})],V.prototype,"role",void 0);j([a({type:Boolean,reflect:!0})],V.prototype,"disabled",void 0);j([a()],V.prototype,"icon",void 0);j([a({type:Boolean,reflect:!0,attribute:"icon-spin"})],V.prototype,"iconSpin",void 0);j([a({type:Number,reflect:!0,attribute:"icon-spin-duration"})],V.prototype,"iconSpinDuration",void 0);j([a({attribute:"icon-after"})],V.prototype,"iconAfter",void 0);j([a({type:Boolean,reflect:!0,attribute:"icon-after-spin"})],V.prototype,"iconAfterSpin",void 0);j([a({type:Number,reflect:!0,attribute:"icon-after-spin-duration"})],V.prototype,"iconAfterSpinDuration",void 0);j([a({type:Boolean,reflect:!0})],V.prototype,"focused",void 0);j([a({type:String,reflect:!0})],V.prototype,"name",void 0);j([a({reflect:!0})],V.prototype,"type",void 0);j([a()],V.prototype,"value",void 0);V=j([p("vscode-button")],V);var ii=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Pe=class extends u{constructor(){super(),this.focused=!1,this._prevTabindex=0,this._handleFocus=()=>{this.focused=!0},this._handleBlur=()=>{this.focused=!1}}connectedCallback(){super.connectedCallback(),this.addEventListener("focus",this._handleFocus),this.addEventListener("blur",this._handleBlur)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("focus",this._handleFocus),this.removeEventListener("blur",this._handleBlur)}attributeChangedCallback(e,t,o){super.attributeChangedCallback(e,t,o),e==="disabled"&&this.hasAttribute("disabled")?(this._prevTabindex=this.tabIndex,this.tabIndex=-1):e==="disabled"&&!this.hasAttribute("disabled")&&(this.tabIndex=this._prevTabindex)}};ii([a({type:Boolean,reflect:!0})],Pe.prototype,"focused",void 0);var ri=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Ct=r=>{class e extends r{constructor(){super(...arguments),this._label="",this._slottedText=""}set label(o){this._label=o,this._slottedText===""&&this.setAttribute("aria-label",o)}get label(){return this._label}_handleSlotChange(){this._slottedText=this.textContent?this.textContent.trim():"",this._slottedText!==""&&this.setAttribute("aria-label",this._slottedText)}_renderLabelAttribute(){return this._slottedText===""?c`<span class="label-attr">${this._label}</span>`:c`${m}`}}return ri([a()],e.prototype,"label",null),e};var kt=[h`
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
  `];var ni=[f,kt,h`
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
  `],$o=ni;var oe=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},F=class extends Ct(Pe){set checked(e){this._checked=e,this._manageRequired(),this.requestUpdate()}get checked(){return this._checked}set required(e){this._required=e,this._manageRequired(),this.requestUpdate()}get required(){return this._required}get form(){return this._internals.form}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}checkValidity(){return this._internals.checkValidity()}reportValidity(){return this._internals.reportValidity()}constructor(){super(),this.autofocus=!1,this._checked=!1,this.defaultChecked=!1,this.invalid=!1,this.name=void 0,this.value="",this.disabled=!1,this.indeterminate=!1,this._required=!1,this.type="checkbox",this._handleClick=e=>{e.preventDefault(),!this.disabled&&this._toggleState()},this._handleKeyDown=e=>{!this.disabled&&(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),e.key===" "&&this._toggleState(),e.key==="Enter"&&this._internals.form?.requestSubmit())},this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.addEventListener("keydown",this._handleKeyDown),this.updateComplete.then(()=>{this._manageRequired(),this._setActualFormValue()})}disconnectedCallback(){this.removeEventListener("keydown",this._handleKeyDown)}update(e){super.update(e),e.has("checked")&&(this.ariaChecked=this.checked?"true":"false")}formResetCallback(){this.checked=this.defaultChecked}formStateRestoreCallback(e,t){e&&(this.checked=!0)}_setActualFormValue(){let e="";this.checked?e=this.value?this.value:"on":e=null,this._internals.setFormValue(e)}_toggleState(){this.checked=!this.checked,this.indeterminate=!1,this._setActualFormValue(),this._manageRequired(),this.dispatchEvent(new Event("change",{bubbles:!0})),this.dispatchEvent(new CustomEvent("vsc-change",{detail:{checked:this.checked,label:this.label,value:this.value},bubbles:!0,composed:!0}))}_manageRequired(){!this.checked&&this.required?this._internals.setValidity({valueMissing:!0},"Please check this box if you want to proceed.",this._inputEl??void 0):this._internals.setValidity({})}render(){let e=g({icon:!0,checked:this.checked,indeterminate:this.indeterminate}),t=g({"label-inner":!0}),o=c`<svg
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
    </svg>`,i=this.checked&&!this.indeterminate?o:m,s=this.indeterminate?c`<span class="indeterminate-icon"></span>`:m;return c`
      <div class="wrapper">
        <input
          ?autofocus=${this.autofocus}
          id="input"
          class="checkbox"
          type="checkbox"
          ?checked=${this.checked}
          value=${this.value}
        >
        <div class=${e}>${s}${i}</div>
        <label for="input" class="label" @click=${this._handleClick}>
          <span class=${t}>
            ${this._renderLabelAttribute()}
            <slot @slotchange=${this._handleSlotChange}></slot>
          </span>
        </label>
      </div>
    `}};F.styles=$o;F.formAssociated=!0;F.shadowRootOptions={...D.shadowRootOptions,delegatesFocus:!0};oe([a({type:Boolean,reflect:!0})],F.prototype,"autofocus",void 0);oe([a({type:Boolean,reflect:!0})],F.prototype,"checked",null);oe([a({type:Boolean,reflect:!0,attribute:"default-checked"})],F.prototype,"defaultChecked",void 0);oe([a({type:Boolean,reflect:!0})],F.prototype,"invalid",void 0);oe([a({reflect:!0})],F.prototype,"name",void 0);oe([a()],F.prototype,"value",void 0);oe([a({type:Boolean,reflect:!0})],F.prototype,"disabled",void 0);oe([a({type:Boolean,reflect:!0})],F.prototype,"indeterminate",void 0);oe([a({type:Boolean,reflect:!0})],F.prototype,"required",null);oe([a()],F.prototype,"type",void 0);oe([S("#input")],F.prototype,"_inputEl",void 0);F=oe([p("vscode-checkbox")],F);var li=[f,h`
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
  `],So=li;var Xt=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},ce=class extends u{constructor(){super(...arguments),this.role="group",this.variant="horizontal"}render(){return c`
      <div class="wrapper">
        <slot></slot>
      </div>
    `}};ce.styles=So;Xt([a({reflect:!0})],ce.prototype,"role",void 0);Xt([a({reflect:!0})],ce.prototype,"variant",void 0);ce=Xt([p("vscode-checkbox-group")],ce);var ai=[f,h`
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
  `],Io=ai;var Et=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},ue=class extends u{constructor(){super(...arguments),this.title="",this.description="",this.open=!1}_emitToggleEvent(){this.dispatchEvent(new CustomEvent("vsc-collapsible-toggle",{detail:{open:this.open}}))}_onHeaderClick(){this.open=!this.open,this._emitToggleEvent()}_onHeaderKeyDown(e){e.key==="Enter"&&(this.open=!this.open,this._emitToggleEvent())}render(){let e=g({collapsible:!0,open:this.open}),t=c`<svg
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
    </svg>`,o=this.description?c`<span class="description">${this.description}</span>`:m;return c`
      <div class=${e}>
        <div
          class="collapsible-header"
          tabindex="0"
          title=${this.title}
          @click=${this._onHeaderClick}
          @keydown=${this._onHeaderKeyDown}
        >
          ${t}
          <h3 class="title">${this.title}${o}</h3>
          <div class="header-slots">
            <div class="actions"><slot name="actions"></slot></div>
            <div class="decorations"><slot name="decorations"></slot></div>
          </div>
        </div>
        <div class="collapsible-body" part="body">
          <slot></slot>
        </div>
      </div>
    `}};ue.styles=Io;Et([a({type:String})],ue.prototype,"title",void 0);Et([a()],ue.prototype,"description",void 0);Et([a({type:Boolean,reflect:!0})],ue.prototype,"open",void 0);ue=Et([p("vscode-collapsible")],ue);var ci=[f,h`
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
  `],Oo=ci;var We=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},ie=class extends u{constructor(){super(...arguments),this.label="",this.keybinding="",this.value="",this.separator=!1,this.tabindex=0}onItemClick(){this.dispatchEvent(new CustomEvent("vsc-click",{detail:{label:this.label,keybinding:this.keybinding,value:this.value||this.label,separator:this.separator,tabindex:this.tabindex},bubbles:!0,composed:!0}))}render(){return c`
      ${this.separator?c`
            <div class="context-menu-item separator">
              <span class="ruler"></span>
            </div>
          `:c`
            <div class="context-menu-item">
              <a @click=${this.onItemClick}>
                ${this.label?c`<span class="label">${this.label}</span>`:m}
                ${this.keybinding?c`<span class="keybinding">${this.keybinding}</span>`:m}
              </a>
            </div>
          `}
    `}};ie.styles=Oo;We([a({type:String})],ie.prototype,"label",void 0);We([a({type:String})],ie.prototype,"keybinding",void 0);We([a({type:String})],ie.prototype,"value",void 0);We([a({type:Boolean,reflect:!0})],ie.prototype,"separator",void 0);We([a({type:Number})],ie.prototype,"tabindex",void 0);ie=We([p("vscode-context-menu-item")],ie);var di=[f,h`
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
  `],Ao=di;var ge=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Q=class extends u{set data(e){this._data=e;let t=[];e.forEach((o,i)=>{o.separator||t.push(i)}),this._clickableItemIndexes=t}get data(){return this._data}set show(e){this._show=e,this._selectedClickableItemIndex=-1,e&&this.updateComplete.then(()=>{this._wrapperEl&&this._wrapperEl.focus(),requestAnimationFrame(()=>{document.addEventListener("click",this._onClickOutsideBound,{once:!0})})})}get show(){return this._show}constructor(){super(),this.preventClose=!1,this.tabIndex=0,this._selectedClickableItemIndex=-1,this._show=!1,this._data=[],this._clickableItemIndexes=[],this._onClickOutsideBound=this._onClickOutside.bind(this),this.addEventListener("keydown",this._onKeyDown)}_onClickOutside(e){e.composedPath().includes(this)||(this.show=!1)}_onKeyDown(e){let{key:t}=e;switch((t==="ArrowUp"||t==="ArrowDown"||t==="Escape"||t==="Enter")&&e.preventDefault(),t){case"ArrowUp":this._handleArrowUp();break;case"ArrowDown":this._handleArrowDown();break;case"Escape":this._handleEscape();break;case"Enter":this._handleEnter();break;default:}}_handleArrowUp(){this._selectedClickableItemIndex===0?this._selectedClickableItemIndex=this._clickableItemIndexes.length-1:this._selectedClickableItemIndex-=1}_handleArrowDown(){this._selectedClickableItemIndex+1<this._clickableItemIndexes.length?this._selectedClickableItemIndex+=1:this._selectedClickableItemIndex=0}_handleEscape(){this.show=!1,document.removeEventListener("click",this._onClickOutsideBound)}_dispatchSelectEvent(e){let{keybinding:t,label:o,value:i,separator:s,tabindex:n}=e;this.dispatchEvent(new CustomEvent("vsc-context-menu-select",{detail:{keybinding:t,label:o,separator:s,tabindex:n,value:i}}))}_dispatchLegacySelectEvent(e){let{keybinding:t,label:o,value:i,separator:s,tabindex:n}=e,l={keybinding:t,label:o,value:i,separator:s,tabindex:n};this.dispatchEvent(new CustomEvent("vsc-select",{detail:l,bubbles:!0,composed:!0}))}_handleEnter(){if(this._selectedClickableItemIndex===-1)return;let e=this._clickableItemIndexes[this._selectedClickableItemIndex],o=this._wrapperEl.querySelectorAll("vscode-context-menu-item")[e];this._dispatchLegacySelectEvent(o),this._dispatchSelectEvent(o),this.preventClose||(this.show=!1,document.removeEventListener("click",this._onClickOutsideBound))}_onItemClick(e){let t=e.currentTarget;this._dispatchLegacySelectEvent(t),this._dispatchSelectEvent(t),this.preventClose||(this.show=!1)}_onItemMouseOver(e){let t=e.target,o=t.dataset.index?+t.dataset.index:-1,i=this._clickableItemIndexes.findIndex(s=>s===o);i!==-1&&(this._selectedClickableItemIndex=i)}_onItemMouseOut(){this._selectedClickableItemIndex=-1}render(){if(!this._show)return c`${m}`;let e=this._clickableItemIndexes[this._selectedClickableItemIndex];return c`
      <div class="context-menu" tabindex="0">
        ${this.data?this.data.map(({label:t="",keybinding:o="",value:i="",separator:s=!1,tabindex:n=0},l)=>c`
                <vscode-context-menu-item
                  label=${t}
                  keybinding=${o}
                  value=${i}
                  ?separator=${s}
                  ?selected=${l===e}
                  tabindex=${n}
                  @vsc-click=${this._onItemClick}
                  @mouseover=${this._onItemMouseOver}
                  @mouseout=${this._onItemMouseOut}
                  data-index=${l}
                ></vscode-context-menu-item>
              `):c`<slot></slot>`}
      </div>
    `}};Q.styles=Ao;ge([a({type:Array,attribute:!1})],Q.prototype,"data",null);ge([a({type:Boolean,reflect:!0,attribute:"prevent-close"})],Q.prototype,"preventClose",void 0);ge([a({type:Boolean,reflect:!0})],Q.prototype,"show",null);ge([a({type:Number,reflect:!0})],Q.prototype,"tabIndex",void 0);ge([_()],Q.prototype,"_selectedClickableItemIndex",void 0);ge([_()],Q.prototype,"_show",void 0);ge([S(".context-menu")],Q.prototype,"_wrapperEl",void 0);Q=ge([p("vscode-context-menu")],Q);var hi=[f,h`
    :host {
      background-color: var(--vscode-foreground, #cccccc);
      display: block;
      height: 1px;
      margin-bottom: 10px;
      margin-top: 10px;
      opacity: 0.4;
    }
  `],Po=hi;var Ro=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Re=class extends u{constructor(){super(...arguments),this.role="separator"}render(){return c``}};Re.styles=Po;Ro([a({reflect:!0})],Re.prototype,"role",void 0);Re=Ro([p("vscode-divider")],Re);var pi=[f,h`
    :host {
      display: block;
      max-width: 727px;
    }
  `],Vo=pi;var Ke=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Ve;(function(r){r.HORIZONTAL="horizontal",r.VERTICAL="vertical"})(Ve||(Ve={}));var ui=r=>["vscode-textfield","vscode-textarea"].includes(r.tagName.toLocaleLowerCase()),fi=r=>r.tagName.toLocaleLowerCase()==="vscode-single-select",mi=r=>r.tagName.toLocaleLowerCase()==="vscode-multi-select",Bo=r=>r.tagName.toLocaleLowerCase()==="vscode-checkbox",To=r=>r.tagName.toLocaleLowerCase()==="vscode-radio",re=class extends u{constructor(){super(...arguments),this.breakpoint=490,this._responsive=!1,this._firstUpdateComplete=!1,this._resizeObserverCallbackBound=this._resizeObserverCallback.bind(this)}set responsive(e){this._responsive=e,this._firstUpdateComplete&&(e?this._activateResponsiveLayout():this._deactivateResizeObserver())}get responsive(){return this._responsive}get data(){return this._collectFormData()}_collectFormData(){let e=["vscode-textfield","vscode-textarea","vscode-single-select","vscode-multi-select","vscode-checkbox","vscode-radio"].join(","),t=this.querySelectorAll(e),o={};return t.forEach(i=>{if(!i.hasAttribute("name"))return;let s=i.getAttribute("name");s&&(Bo(i)&&i.checked?o[s]=Array.isArray(o[s])?[...o[s],i.value]:[i.value]:mi(i)?o[s]=i.value:Bo(i)&&!i.checked?o[s]=Array.isArray(o[s])?o[s]:[]:To(i)&&i.checked||ui(i)||fi(i)?o[s]=i.value:To(i)&&!i.checked&&(o[s]=o[s]?o[s]:""))}),o}_toggleCompactLayout(e){this._assignedFormGroups.forEach(t=>{t.dataset.originalVariant||(t.dataset.originalVariant=t.variant);let o=t.dataset.originalVariant;e===Ve.VERTICAL&&o==="horizontal"?t.variant="vertical":t.variant=o,t.querySelectorAll("vscode-checkbox-group, vscode-radio-group").forEach(s=>{s.dataset.originalVariant||(s.dataset.originalVariant=s.variant);let n=s.dataset.originalVariant;e===Ve.HORIZONTAL&&n===Ve.HORIZONTAL?s.variant="horizontal":s.variant="vertical"})})}_resizeObserverCallback(e){let t=0;for(let i of e)t=i.contentRect.width;let o=t<this.breakpoint?Ve.VERTICAL:Ve.HORIZONTAL;o!==this._currentFormGroupLayout&&(this._toggleCompactLayout(o),this._currentFormGroupLayout=o)}_activateResponsiveLayout(){this._resizeObserver=new ResizeObserver(this._resizeObserverCallbackBound),this._resizeObserver.observe(this._wrapperElement)}_deactivateResizeObserver(){this._resizeObserver?.disconnect(),this._resizeObserver=null}firstUpdated(){this._firstUpdateComplete=!0,this._responsive&&this._activateResponsiveLayout()}render(){return c`
      <div class="wrapper">
        <slot></slot>
      </div>
    `}};re.styles=Vo;Ke([a({type:Boolean,reflect:!0})],re.prototype,"responsive",null);Ke([a({type:Number})],re.prototype,"breakpoint",void 0);Ke([a({type:Object})],re.prototype,"data",null);Ke([S(".wrapper")],re.prototype,"_wrapperElement",void 0);Ke([H({selector:"vscode-form-group"})],re.prototype,"_assignedFormGroups",void 0);re=Ke([p("vscode-form-container")],re);var vi=[f,h`
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
  `],zo=vi;var Do=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Be=class extends u{constructor(){super(...arguments),this.variant="horizontal"}render(){return c`
      <div class="wrapper">
        <slot></slot>
      </div>
    `}};Be.styles=zo;Do([a({reflect:!0})],Be.prototype,"variant",void 0);Be=Do([p("vscode-form-group")],Be);var bi=[f,h`
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
  `],Lo=bi;var _i=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Zt=new CSSStyleSheet;Zt.replaceSync(`
  vscode-form-helper * {
    margin: 0;
  }

  vscode-form-helper *:not(:last-child) {
    margin-bottom: 8px;
  }
`);var Ge=class extends u{constructor(){super(),this._injectLightDOMStyles()}_injectLightDOMStyles(){document.adoptedStyleSheets.find(t=>t===Zt)||document.adoptedStyleSheets.push(Zt)}render(){return c`<slot></slot>`}};Ge.styles=Lo;Ge=_i([p("vscode-form-helper")],Ge);var Mo=0,gi=(r="")=>(Mo++,`${r}${Mo}`),$t=gi;var yi=[f,h`
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
  `],Fo=yi;var Ye=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},ee=class extends u{constructor(){super(...arguments),this.variant="horizontal",this.role="radiogroup",this._focusedRadio=-1,this._checkedRadio=-1,this._firstContentLoaded=!1,this._onKeyDownBound=this._onKeyDown.bind(this)}connectedCallback(){super.connectedCallback(),this.addEventListener("keydown",this._onKeyDownBound)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("keydown",this._onKeyDownBound)}_uncheckPreviousChecked(e,t){e!==-1&&(this._radios[e].checked=!1),t!==-1&&(this._radios[t].tabIndex=-1)}_afterCheck(){this._focusedRadio=this._checkedRadio,this._radios[this._checkedRadio].checked=!0,this._radios[this._checkedRadio].tabIndex=0,this._radios[this._checkedRadio].focus()}_checkPrev(){let e=this._radios.findIndex(i=>i.checked),t=this._radios.findIndex(i=>i.focused),o=t!==-1?t:e;this._uncheckPreviousChecked(e,t),o===-1?this._checkedRadio=this._radios.length-1:o-1>=0?this._checkedRadio=o-1:this._checkedRadio=this._radios.length-1,this._afterCheck()}_checkNext(){let e=this._radios.findIndex(i=>i.checked),t=this._radios.findIndex(i=>i.focused),o=t!==-1?t:e;this._uncheckPreviousChecked(e,t),o===-1?this._checkedRadio=0:o+1<this._radios.length?this._checkedRadio=o+1:this._checkedRadio=0,this._afterCheck()}_onKeyDown(e){let{key:t}=e;["ArrowLeft","ArrowUp","ArrowRight","ArrowDown"].includes(t)&&e.preventDefault(),(t==="ArrowRight"||t==="ArrowDown")&&this._checkNext(),(t==="ArrowLeft"||t==="ArrowUp")&&this._checkPrev()}_onChange(e){let t=this._radios.findIndex(o=>o===e.target);t!==-1&&(this._focusedRadio!==-1&&(this._radios[this._focusedRadio].tabIndex=-1),this._checkedRadio!==-1&&this._checkedRadio!==t&&(this._radios[this._checkedRadio].checked=!1),this._focusedRadio=t,this._checkedRadio=t,this._radios[t].tabIndex=0)}_onSlotChange(){if(!this._firstContentLoaded){let e=this._radios.findIndex(t=>t.autofocus);e>-1&&(this._focusedRadio=e),this._firstContentLoaded=!0}this._radios.forEach((e,t)=>{this._focusedRadio>-1?e.tabIndex=t===this._focusedRadio?0:-1:e.tabIndex=t===0?0:-1})}render(){return c`
      <div class="wrapper">
        <slot
          @slotchange=${this._onSlotChange}
          @vsc-change=${this._onChange}
        ></slot>
      </div>
    `}};ee.styles=Fo;Ye([a({reflect:!0})],ee.prototype,"variant",void 0);Ye([a({reflect:!0})],ee.prototype,"role",void 0);Ye([H({selector:"vscode-radio"})],ee.prototype,"_radios",void 0);Ye([_()],ee.prototype,"_focusedRadio",void 0);Ye([_()],ee.prototype,"_checkedRadio",void 0);ee=Ye([p("vscode-radio-group")],ee);var xi=[f,h`
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
  `],Ho=xi;var P=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},E=class extends u{set value(e){this._value=e,this._internals.setFormValue(e)}get value(){return this._value}get wrappedElement(){return this._textareaEl}get form(){return this._internals.form}get type(){return"textarea"}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}set minlength(e){this.minLength=e}get minlength(){return this.minLength}set maxlength(e){this.maxLength=e}get maxlength(){return this.maxLength}constructor(){super(),this.autocomplete=void 0,this.autofocus=!1,this.defaultValue="",this.disabled=!1,this.invalid=!1,this.label="",this.maxLength=void 0,this.minLength=void 0,this.rows=void 0,this.cols=void 0,this.name=void 0,this.placeholder=void 0,this.readonly=!1,this.resize="none",this.required=!1,this.spellcheck=!1,this.monospace=!1,this._value="",this._textareaPointerCursor=!1,this._shadow=!1,this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this._textareaEl.checkValidity(),this._setValidityFromInput(),this._internals.setFormValue(this._textareaEl.value)})}updated(e){let t=["maxLength","minLength","required"];for(let o of e.keys())if(t.includes(String(o))){this.updateComplete.then(()=>{this._setValidityFromInput()});break}}formResetCallback(){this.value=this.defaultValue}formStateRestoreCallback(e,t){this.updateComplete.then(()=>{this._value=e})}checkValidity(){return this._internals.checkValidity()}reportValidity(){return this._internals.reportValidity()}_setValidityFromInput(){this._internals.setValidity(this._textareaEl.validity,this._textareaEl.validationMessage,this._textareaEl)}_dataChanged(){this._value=this._textareaEl.value,this._internals.setFormValue(this._textareaEl.value)}_handleChange(e){this._dataChanged(),this._setValidityFromInput(),this.dispatchEvent(new Event("change")),this.dispatchEvent(new CustomEvent("vsc-change",{detail:{data:this.value,originalEvent:e}}))}_handleInput(e){this._dataChanged(),this._setValidityFromInput(),this.dispatchEvent(new CustomEvent("vsc-input",{detail:{data:e.data,originalEvent:e}}))}_handleMouseMove(e){if(this._textareaEl.clientHeight>=this._textareaEl.scrollHeight){this._textareaPointerCursor=!1;return}let t=14,o=1,i=this._textareaEl.getBoundingClientRect(),s=e.clientX;this._textareaPointerCursor=s>=i.left+i.width-t-o*2}_handleScroll(){this._shadow=this._textareaEl.scrollTop>0}render(){return c`
      <div
        class=${g({shadow:!0,visible:this._shadow})}
      ></div>
      <textarea
        autocomplete=${k(this.autocomplete)}
        ?autofocus=${this.autofocus}
        ?disabled=${this.disabled}
        aria-label=${this.label}
        id="textarea"
        class=${g({monospace:this.monospace,"cursor-pointer":this._textareaPointerCursor})}
        maxlength=${k(this.maxLength)}
        minlength=${k(this.minLength)}
        rows=${k(this.rows)}
        cols=${k(this.cols)}
        name=${k(this.name)}
        placeholder=${k(this.placeholder)}
        ?readonly=${this.readonly}
        .style=${B({resize:this.resize})}
        ?required=${this.required}
        spellcheck=${this.spellcheck}
        @change=${this._handleChange}
        @input=${this._handleInput}
        @mousemove=${this._handleMouseMove}
        @scroll=${this._handleScroll}
        .value=${this._value}
      ></textarea>
    `}};E.styles=Ho;E.formAssociated=!0;E.shadowRootOptions={...D.shadowRootOptions,delegatesFocus:!0};P([a()],E.prototype,"autocomplete",void 0);P([a({type:Boolean,reflect:!0})],E.prototype,"autofocus",void 0);P([a({attribute:"default-value"})],E.prototype,"defaultValue",void 0);P([a({type:Boolean,reflect:!0})],E.prototype,"disabled",void 0);P([a({type:Boolean,reflect:!0})],E.prototype,"invalid",void 0);P([a({attribute:!1})],E.prototype,"label",void 0);P([a({type:Number})],E.prototype,"maxLength",void 0);P([a({type:Number})],E.prototype,"minLength",void 0);P([a({type:Number})],E.prototype,"rows",void 0);P([a({type:Number})],E.prototype,"cols",void 0);P([a()],E.prototype,"name",void 0);P([a()],E.prototype,"placeholder",void 0);P([a({type:Boolean,reflect:!0})],E.prototype,"readonly",void 0);P([a()],E.prototype,"resize",void 0);P([a({type:Boolean,reflect:!0})],E.prototype,"required",void 0);P([a({type:Boolean})],E.prototype,"spellcheck",void 0);P([a({type:Boolean,reflect:!0})],E.prototype,"monospace",void 0);P([a()],E.prototype,"value",null);P([S("#textarea")],E.prototype,"_textareaEl",void 0);P([_()],E.prototype,"_value",void 0);P([_()],E.prototype,"_textareaPointerCursor",void 0);P([_()],E.prototype,"_shadow",void 0);E=P([p("vscode-textarea")],E);var jo=be(qe()),wi=[f,h`
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
      font-family: var(--vscode-font-family, ${jo});
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
      font-family: var(--vscode-font-family, ${jo});
      font-size: var(--vscode-font-size, 13px);
      font-weight: var(--vscode-font-weight, 'normal');
      line-height: 20px;
      padding: 0 14px;
    }

    input[type='file']::file-selector-button:hover {
      background-color: var(--vscode-button-hoverBackground, #026ec1);
    }
  `],qo=wi;var A=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},C=class extends u{set type(e){let t=["color","date","datetime-local","email","file","month","number","password","search","tel","text","time","url","week"];this._type=t.includes(e)?e:"text"}get type(){return this._type}set value(e){this.type!=="file"&&(this._value=e,this._internals.setFormValue(e)),this.updateComplete.then(()=>{this._setValidityFromInput()})}get value(){return this._value}set minlength(e){this.minLength=e}get minlength(){return this.minLength}set maxlength(e){this.maxLength=e}get maxlength(){return this.maxLength}get form(){return this._internals.form}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}checkValidity(){return this._setValidityFromInput(),this._internals.checkValidity()}reportValidity(){return this._setValidityFromInput(),this._internals.reportValidity()}get wrappedElement(){return this._inputEl}constructor(){super(),this.autocomplete=void 0,this.autofocus=!1,this.defaultValue="",this.disabled=!1,this.focused=!1,this.invalid=!1,this.label="",this.max=void 0,this.maxLength=void 0,this.min=void 0,this.minLength=void 0,this.multiple=!1,this.name=void 0,this.pattern=void 0,this.placeholder=void 0,this.readonly=!1,this.required=!1,this.step=void 0,this._value="",this._type="text",this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this._inputEl.checkValidity(),this._setValidityFromInput(),this._internals.setFormValue(this._inputEl.value)})}attributeChangedCallback(e,t,o){super.attributeChangedCallback(e,t,o),["max","maxlength","min","minlength","pattern","required","step"].includes(e)&&this.updateComplete.then(()=>{this._setValidityFromInput()})}formResetCallback(){this.value=this.defaultValue,this.requestUpdate()}formStateRestoreCallback(e,t){this.value=e}_dataChanged(){if(this._value=this._inputEl.value,this.type==="file"&&this._inputEl.files)for(let e of this._inputEl.files)this._internals.setFormValue(e);else this._internals.setFormValue(this._inputEl.value)}_setValidityFromInput(){this._inputEl&&this._internals.setValidity(this._inputEl.validity,this._inputEl.validationMessage,this._inputEl)}_onInput(e){this._dataChanged(),this._setValidityFromInput(),this.dispatchEvent(new CustomEvent("vsc-input",{detail:{data:e.data,originalEvent:e}}))}_onChange(e){this._dataChanged(),this._setValidityFromInput(),this.dispatchEvent(new Event("change")),this.dispatchEvent(new CustomEvent("vsc-change",{detail:{data:this.value,originalEvent:e}}))}_onFocus(){this.focused=!0}_onBlur(){this.focused=!1}_onKeyDown(e){e.key==="Enter"&&this._internals.form&&this._internals.form?.requestSubmit()}render(){return c`
      <slot name="content-before"></slot>
      <input
        id="input"
        type=${this.type}
        ?autofocus=${this.autofocus}
        autocomplete=${k(this.autocomplete)}
        aria-label=${this.label}
        ?disabled=${this.disabled}
        max=${k(this.max)}
        maxlength=${k(this.maxLength)}
        min=${k(this.min)}
        minlength=${k(this.minLength)}
        ?multiple=${this.multiple}
        name=${k(this.name)}
        pattern=${k(this.pattern)}
        placeholder=${k(this.placeholder)}
        ?readonly=${this.readonly}
        ?required=${this.required}
        step=${k(this.step)}
        .value=${this._value}
        @blur=${this._onBlur}
        @change=${this._onChange}
        @focus=${this._onFocus}
        @input=${this._onInput}
        @keydown=${this._onKeyDown}
      >
      <slot name="content-after"></slot>
    `}};C.styles=qo;C.formAssociated=!0;C.shadowRootOptions={...D.shadowRootOptions,delegatesFocus:!0};A([a()],C.prototype,"autocomplete",void 0);A([a({type:Boolean,reflect:!0})],C.prototype,"autofocus",void 0);A([a({attribute:"default-value"})],C.prototype,"defaultValue",void 0);A([a({type:Boolean,reflect:!0})],C.prototype,"disabled",void 0);A([a({type:Boolean,reflect:!0})],C.prototype,"focused",void 0);A([a({type:Boolean,reflect:!0})],C.prototype,"invalid",void 0);A([a({attribute:!1})],C.prototype,"label",void 0);A([a({type:Number})],C.prototype,"max",void 0);A([a({type:Number})],C.prototype,"maxLength",void 0);A([a({type:Number})],C.prototype,"min",void 0);A([a({type:Number})],C.prototype,"minLength",void 0);A([a({type:Boolean,reflect:!0})],C.prototype,"multiple",void 0);A([a({reflect:!0})],C.prototype,"name",void 0);A([a()],C.prototype,"pattern",void 0);A([a()],C.prototype,"placeholder",void 0);A([a({type:Boolean,reflect:!0})],C.prototype,"readonly",void 0);A([a({type:Boolean,reflect:!0})],C.prototype,"required",void 0);A([a({type:Number})],C.prototype,"step",void 0);A([a({reflect:!0})],C.prototype,"type",null);A([a()],C.prototype,"value",null);A([S("#input")],C.prototype,"_inputEl",void 0);A([_()],C.prototype,"_value",void 0);A([_()],C.prototype,"_type",void 0);C=A([p("vscode-textfield")],C);var Ci=[f,h`
    :host {
      color: var(--vscode-foreground, #cccccc);
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      font-weight: 600;
      line-height: ${xo};
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
  `],No=Ci;var St=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},fe=class extends u{constructor(){super(...arguments),this.required=!1,this._id="",this._htmlFor="",this._connected=!1}set htmlFor(e){this._htmlFor=e,this.setAttribute("for",e),this._connected&&this._connectWithTarget()}get htmlFor(){return this._htmlFor}set id(e){this._id=e}get id(){return this._id}attributeChangedCallback(e,t,o){super.attributeChangedCallback(e,t,o)}connectedCallback(){super.connectedCallback(),this._connected=!0,this._id===""&&(this._id=$t("vscode-label-"),this.setAttribute("id",this._id)),this._connectWithTarget()}_getTarget(){let e=null;if(this._htmlFor){let t=this.getRootNode({composed:!1});t&&(e=t.querySelector(`#${this._htmlFor}`))}return e}async _connectWithTarget(){await this.updateComplete;let e=this._getTarget();(e instanceof ee||e instanceof ce)&&e.setAttribute("aria-labelledby",this._id);let t="";this.textContent&&(t=this.textContent.trim()),(e instanceof C||e instanceof E)&&(e.label=t)}_handleClick(){let e=this._getTarget();e&&"focus"in e&&e.focus()}render(){return c`
      <label
        class=${g({wrapper:!0,required:this.required})}
        @click=${this._handleClick}
        ><slot></slot
      ></label>
    `}};fe.styles=No;St([a({reflect:!0,attribute:"for"})],fe.prototype,"htmlFor",null);St([a()],fe.prototype,"id",null);St([a({type:Boolean,reflect:!0})],fe.prototype,"required",void 0);fe=St([p("vscode-label")],fe);var Xe=c`
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
`;var{I:ki}=bo;var Uo=()=>document.createComment(""),Ze=(r,e,t)=>{let o=r._$AA.parentNode,i=e===void 0?r._$AB:e._$AA;if(t===void 0){let s=o.insertBefore(Uo(),i),n=o.insertBefore(Uo(),i);t=new ki(s,n,r,r.options)}else{let s=t._$AB.nextSibling,n=t._$AM,l=n!==r;if(l){let d;t._$AQ?.(r),t._$AM=r,t._$AP!==void 0&&(d=r._$AU)!==n._$AU&&t._$AP(d)}if(s!==i||l){let d=t._$AA;for(;d!==s;){let b=d.nextSibling;o.insertBefore(d,i),d=b}}}return t},ye=(r,e,t=r)=>(r._$AI(e,t),r),Ei={},Wo=(r,e=Ei)=>r._$AH=e,Ko=r=>r._$AH,It=r=>{r._$AP?.(!1,!0);let e=r._$AA,t=r._$AB.nextSibling;for(;e!==t;){let o=e.nextSibling;e.remove(),e=o}};var Go=(r,e,t)=>{let o=new Map;for(let i=e;i<=t;i++)o.set(r[i],i);return o},Yo=Ue(class extends _e{constructor(r){if(super(r),r.type!==Ne.CHILD)throw Error("repeat() can only be used in text expressions")}dt(r,e,t){let o;t===void 0?t=e:e!==void 0&&(o=e);let i=[],s=[],n=0;for(let l of r)i[n]=o?o(l,n):n,s[n]=t(l,n),n++;return{values:s,keys:i}}render(r,e,t){return this.dt(r,e,t).values}update(r,[e,t,o]){let i=Ko(r),{values:s,keys:n}=this.dt(e,t,o);if(!Array.isArray(i))return this.ut=n,s;let l=this.ut??=[],d=[],b,y,v=0,x=i.length-1,w=0,z=s.length-1;for(;v<=x&&w<=z;)if(i[v]===null)v++;else if(i[x]===null)x--;else if(l[v]===n[w])d[w]=ye(i[v],s[w]),v++,w++;else if(l[x]===n[z])d[z]=ye(i[x],s[z]),x--,z--;else if(l[v]===n[z])d[z]=ye(i[v],s[z]),Ze(r,d[z+1],i[v]),v++,z--;else if(l[x]===n[w])d[w]=ye(i[x],s[w]),Ze(r,i[v],i[x]),x--,w++;else if(b===void 0&&(b=Go(n,w,z),y=Go(l,v,x)),b.has(l[v]))if(b.has(l[x])){let J=y.get(n[w]),He=J!==void 0?i[J]:null;if(He===null){let Ce=Ze(r,i[v]);ye(Ce,s[w]),d[w]=Ce}else d[w]=ye(He,s[w]),Ze(r,i[v],He),i[J]=null;w++}else It(i[x]),x--;else It(i[v]),v++;for(;w<=z;){let J=Ze(r,d[z+1]);ye(J,s[w]),d[w++]=J}for(;v<=x;){let J=i[v++];J!==null&&It(J)}return this.ut=n,Wo(r,d),G}});var Xo=f;var dt=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},de=class extends u{constructor(){super(...arguments),this.description="",this.selected=!1,this.disabled=!1,this._initialized=!1,this._handleSlotChange=()=>{this._initialized&&this.dispatchEvent(new Event("vsc-option-state-change",{bubbles:!0}))}}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this._initialized=!0})}willUpdate(e){this._initialized&&(e.has("description")||e.has("value")||e.has("selected")||e.has("disabled"))&&this.dispatchEvent(new Event("vsc-option-state-change",{bubbles:!0}))}render(){return c`<slot @slotchange=${this._handleSlotChange}></slot>`}};de.styles=Xo;dt([a({type:String})],de.prototype,"value",void 0);dt([a({type:String})],de.prototype,"description",void 0);dt([a({type:Boolean,reflect:!0})],de.prototype,"selected",void 0);dt([a({type:Boolean,reflect:!0})],de.prototype,"disabled",void 0);de=dt([p("vscode-option")],de);var $i=(r,e)=>{let t={match:!1,ranges:[]},o=r.toLowerCase(),i=e.toLowerCase(),s=o.split(" "),n=0;return s.forEach((l,d)=>{if(d>0&&(n+=s[d-1].length+1),t.match)return;let b=l.indexOf(i),y=i.length;b===0&&(t.match=!0,t.ranges.push([n+b,Math.min(n+b+y,r.length)]))}),t},Si=(r,e)=>{let t={match:!1,ranges:[]};return r.toLowerCase().indexOf(e.toLowerCase())===0&&(t.match=!0,t.ranges=[[0,e.length]]),t},Ii=(r,e)=>{let t={match:!1,ranges:[]},o=r.toLowerCase().indexOf(e.toLowerCase());return o>-1&&(t.match=!0,t.ranges=[[o,o+e.length]]),t},Oi=(r,e)=>{let t={match:!1,ranges:[]},o=0,i=0,s=e.length-1,n=r.toLowerCase(),l=e.toLowerCase();for(let d=0;d<=s;d++){if(i=n.indexOf(l[d],o),i===-1)return{match:!1,ranges:[]};t.match=!0,t.ranges.push([i,i+1]),o=i+1}return t},Zo=(r,e,t)=>{let o=[];return r.forEach(i=>{let s;switch(t){case"startsWithPerTerm":s=$i(i.label,e);break;case"startsWith":s=Si(i.label,e);break;case"contains":s=Ii(i.label,e);break;default:s=Oi(i.label,e)}s.match&&o.push({...i,ranges:s.ranges})}),o},Ot=r=>{let e=[];return r===" "?(e.push(c`&nbsp;`),e):(r.indexOf(" ")===0&&e.push(c`&nbsp;`),e.push(c`${r.trimStart().trimEnd()}`),r.lastIndexOf(" ")===r.length-1&&e.push(c`&nbsp;`),e)},Jo=(r,e)=>{let t=[],o=e.length;return o<1?c`${r}`:(e.forEach((i,s)=>{let n=r.substring(i[0],i[1]);s===0&&i[0]!==0&&t.push(...Ot(r.substring(0,e[0][0]))),s>0&&s<o&&i[0]-e[s-1][1]!==0&&t.push(...Ot(r.substring(e[s-1][1],i[0]))),t.push(c`<b>${Ot(n)}</b>`),s===o-1&&i[1]<r.length&&t.push(...Ot(r.substring(i[1],r.length)))}),t)};function At(r,e){let t=0;if(e<0||!r[e]||!r[e+1])return t;for(let o=e+1;o<r.length;o++)if(!r[o].disabled){t=o;break}return t}function Pt(r,e){let t=0;if(e<0||!r[e]||!r[e-1])return t;for(let o=e-1;o>=0;o--)if(!r[o].disabled){t=o;break}return t}var O=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Rt=10,xe=22,$=class extends u{set disabled(e){this._disabled=e,this.ariaDisabled=e?"true":"false",e===!0?(this._originalTabIndex=this.tabIndex,this.tabIndex=-1):(this.tabIndex=this._originalTabIndex??0,this._originalTabIndex=void 0),this.requestUpdate()}get disabled(){return this._disabled}set filter(e){["contains","fuzzy","startsWith","startsWithPerTerm"].includes(e)?this._filter=e:(this._filter="fuzzy",console.warn(`[VSCode Webview Elements] Invalid filter: "${e}", fallback to default. Valid values are: "contains", "fuzzy", "startsWith", "startsWithPerm".`,this))}get filter(){return this._filter}set options(e){this._options=e.map((t,o)=>({...t,index:o}))}get options(){return this._options.map(({label:e,value:t,description:o,selected:i,disabled:s})=>({label:e,value:t,description:o,selected:i,disabled:s}))}constructor(){super(),this.ariaExpanded="false",this.creatable=!1,this.combobox=!1,this.invalid=!1,this.focused=!1,this.open=!1,this.position="below",this.tabIndex=0,this._firstUpdateCompleted=!1,this._activeIndex=-1,this._currentDescription="",this._filter="fuzzy",this._filterPattern="",this._selectedIndex=-1,this._selectedIndexes=[],this._options=[],this._value="",this._values=[],this._listScrollTop=0,this._isPlaceholderOptionActive=!1,this._isBeingFiltered=!1,this._multiple=!1,this._valueOptionIndexMap={},this._isHoverForbidden=!1,this._disabled=!1,this._originalTabIndex=void 0,this._onClickOutside=e=>{e.composedPath().findIndex(i=>i===this)===-1&&(this._toggleDropdown(!1),window.removeEventListener("click",this._onClickOutside))},this._onMouseMove=()=>{this._isHoverForbidden=!1,window.removeEventListener("mousemove",this._onMouseMove)},this._onComponentKeyDown=e=>{[" ","ArrowUp","ArrowDown","Escape"].includes(e.key)&&(e.stopPropagation(),e.preventDefault()),e.key==="Enter"&&this._onEnterKeyDown(e),e.key===" "&&this._onSpaceKeyDown(),e.key==="Escape"&&this._toggleDropdown(!1),e.key==="ArrowUp"&&this._onArrowUpKeyDown(),e.key==="ArrowDown"&&this._onArrowDownKeyDown()},this._onComponentFocus=()=>{this.focused=!0},this._onComponentBlur=()=>{this.focused=!1},this.addEventListener("vsc-option-state-change",e=>{e.stopPropagation(),this._setStateFromSlottedElements(),this.requestUpdate()})}connectedCallback(){super.connectedCallback(),this.addEventListener("keydown",this._onComponentKeyDown),this.addEventListener("focus",this._onComponentFocus),this.addEventListener("blur",this._onComponentBlur)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("keydown",this._onComponentKeyDown),this.removeEventListener("focus",this._onComponentFocus),this.removeEventListener("blur",this._onComponentBlur)}firstUpdated(e){this._firstUpdateCompleted=!0}willUpdate(e){e.has("required")&&this._firstUpdateCompleted&&this._manageRequired()}get _filteredOptions(){return!this.combobox||this._filterPattern===""?this._options:Zo(this._options,this._filterPattern,this._filter)}get _currentOptions(){return this.combobox?this._filteredOptions:this._options}get _isSuggestedOptionVisible(){if(!(this.combobox&&this.creatable))return!1;let e=typeof this._valueOptionIndexMap[this._filterPattern]<"u",t=this._filterPattern.length>0;return!e&&t}_manageRequired(){}_setStateFromSlottedElements(){let e=[],t=0,o=this._assignedOptions??[],i=[],s=[];this._valueOptionIndexMap={},o.forEach((n,l)=>{let{innerText:d,description:b,disabled:y}=n,v=typeof n.value=="string"?n.value:d.trim(),x=n.selected??!1,w={label:d.trim(),value:v,description:b,selected:x,index:t,disabled:y};t=e.push(w),x&&!this._multiple&&(this._activeIndex=l),x&&(i.push(e.length-1),s.push(v)),this._valueOptionIndexMap[w.value]=w.index}),this._options=e,i.length>0&&(this._selectedIndex=i[0],this._selectedIndexes=i,this._value=s[0],this._values=s),!this._multiple&&!this.combobox&&i.length===0&&(this._selectedIndex=this._options.length>0?0:-1)}async _toggleDropdown(e){this.open=e,this.ariaExpanded=String(e),e&&!this._multiple&&(this._activeIndex=this._selectedIndex),e&&!this._multiple&&!this.combobox&&(this._activeIndex=this._selectedIndex,this._activeIndex>Rt-1&&(await this.updateComplete,this._listElement.scrollTop=Math.floor(this._activeIndex*xe))),e?window.addEventListener("click",this._onClickOutside):window.removeEventListener("click",this._onClickOutside)}_createSuggestedOption(){let e=this._options.length,t=document.createElement("vscode-option");return t.value=this._filterPattern,wt(this._filterPattern,t),this.appendChild(t),e}_dispatchChangeEvent(){this._multiple?this.dispatchEvent(new CustomEvent("vsc-change",{detail:{selectedIndexes:this._selectedIndexes,value:this._values}})):this.dispatchEvent(new CustomEvent("vsc-change",{detail:{selectedIndex:this._selectedIndex,value:this._value}})),this.dispatchEvent(new Event("change")),this.dispatchEvent(new Event("input"))}async _createAndSelectSuggestedOption(){}_onFaceClick(){this._toggleDropdown(!this.open),this._multiple&&(this._activeIndex=0)}_toggleComboboxDropdown(){this._filterPattern="",this._toggleDropdown(!this.open),this._multiple&&(this._activeIndex=-1)}_onComboboxButtonClick(){this._toggleComboboxDropdown()}_onComboboxButtonKeyDown(e){e.key==="Enter"&&this._toggleComboboxDropdown()}_onOptionMouseOver(e){if(this._isHoverForbidden)return;let t=e.target;t.matches(".option")&&(t.matches(".placeholder")?(this._isPlaceholderOptionActive=!0,this._activeIndex=-1):(this._isPlaceholderOptionActive=!1,this._activeIndex=Number(this.combobox?t.dataset.filteredIndex:t.dataset.index)))}_onPlaceholderOptionMouseOut(){this._isPlaceholderOptionActive=!1}_onNoOptionsClick(e){e.stopPropagation()}_onEnterKeyDown(e){if(this._isBeingFiltered=!1,e?.composedPath?e.composedPath().find(s=>s.matches?s.matches("vscode-button.button-accept"):!1):!1)return;let o=this.combobox?this._filteredOptions:this._options,i=!this.open;this._toggleDropdown(i),!this._multiple&&!i&&this._selectedIndex!==this._activeIndex&&(this._selectedIndex=this._activeIndex>-1?o[this._activeIndex].index:-1,this._value=this._selectedIndex>-1?this._options[this._selectedIndex].value:"",this._dispatchChangeEvent()),this.combobox&&(this._isPlaceholderOptionActive?this._createAndSelectSuggestedOption():(!this._multiple&&!i&&(this._selectedIndex=this._activeIndex>-1?this._filteredOptions[this._activeIndex].index:-1),!this._multiple&&i&&this.updateComplete.then(()=>{this._scrollActiveElementToTop()}))),this._multiple&&i&&(this._activeIndex=0)}_onSpaceKeyDown(){if(!this.open){this._toggleDropdown(!0);return}if(this.open&&this._multiple&&this._activeIndex>-1){let e=this.combobox?this._filteredOptions:this._options,t=e[this._activeIndex],o=[];this._options[t.index].selected=!t.selected,e.forEach(({index:i})=>{let{selected:s}=this._options[i];s&&o.push(i)}),this._selectedIndexes=o}}_scrollActiveElementToTop(){this._listElement.scrollTop=Math.floor(this._activeIndex*xe)}async _adjustOptionListScrollPos(e,t){let o=this.combobox?this._filteredOptions.length:this._options.length;if(this._isSuggestedOptionVisible&&(o+=1),o<=Rt)return;this._isHoverForbidden=!0,window.addEventListener("mousemove",this._onMouseMove);let s=this._listElement.scrollTop,n=t*xe,l=n>=s&&n<=s+Rt*xe-xe;e==="down"&&(l||(this._listElement.scrollTop=t*xe-(Rt-1)*xe)),e==="up"&&(l||(this._listElement.scrollTop=Math.floor(this._activeIndex*xe)))}_onArrowUpKeyDown(){if(this.open){if(this._activeIndex<=0&&!(this.combobox&&this.creatable))return;if(this._isPlaceholderOptionActive){let e=this._currentOptions.length-1;this._activeIndex=e,this._isPlaceholderOptionActive=!1}else{let e=this.combobox?this._filteredOptions:this._options,t=Pt(e,this._activeIndex);t>-1&&(this._activeIndex=t,this._adjustOptionListScrollPos("up",t))}}}_onArrowDownKeyDown(){let e=this.combobox?this._filteredOptions.length:this._options.length,t=this.combobox?this._filteredOptions:this._options,o=this._isSuggestedOptionVisible;if(o&&(e+=1),this.open){if(this._isPlaceholderOptionActive&&this._activeIndex===-1)return;if(o&&this._activeIndex===e-2)this._isPlaceholderOptionActive=!0,this._adjustOptionListScrollPos("down",e-1),this._activeIndex=-1;else if(this._activeIndex<e-1){let i=At(t,this._activeIndex);i>-1&&(this._activeIndex=i,this._adjustOptionListScrollPos("down",i))}}}_onSlotChange(){this._setStateFromSlottedElements(),this.requestUpdate()}_onComboboxInputFocus(e){e.target.select(),this._isBeingFiltered=!1,this._filterPattern=""}_onComboboxInputBlur(){this._isBeingFiltered=!1}_onComboboxInputInput(e){this._isBeingFiltered=!0,this._filterPattern=e.target.value,this._activeIndex=-1,this._toggleDropdown(!0)}_onComboboxInputClick(){this._isBeingFiltered=this._filterPattern!=="",this._toggleDropdown(!0)}_onOptionClick(e){this._isBeingFiltered=!1}_renderOptions(){let e=this.combobox?this._filteredOptions:this._options;return c`
      <ul
        class="options"
        @click=${this._onOptionClick}
        @mouseover=${this._onOptionMouseOver}
      >
        ${Yo(e,t=>t.index,(t,o)=>{let i={active:o===this._activeIndex&&!t.disabled,disabled:t.disabled,option:!0,selected:t.selected},s={"checkbox-icon":!0,checked:t.selected},n=t.ranges?.length??!1?Jo(t.label,t.ranges??[]):t.label;return c`
              <li
                class=${g(i)}
                data-index=${t.index}
                data-filtered-index=${o}
              >
                ${this._multiple?c`<span class=${g(s)}></span
                      ><span class="option-label">${n}</span>`:n}
              </li>
            `})}
        ${this._renderPlaceholderOption(e.length<1)}
      </ul>
    `}_renderPlaceholderOption(e){return this.combobox?this._valueOptionIndexMap[this._filterPattern]?m:this.creatable&&this._filterPattern.length>0?c`<li
        class=${g({option:!0,placeholder:!0,active:this._isPlaceholderOptionActive})}
        @mouseout=${this._onPlaceholderOptionMouseOut}
      >
        Add "${this._filterPattern}"
      </li>`:e?c`<li class="no-options" @click=${this._onNoOptionsClick}>
            No options
          </li>`:m:m}_renderDescription(){if(!this._options[this._activeIndex])return m;let{description:e}=this._options[this._activeIndex];return e?c`<div class="description">${e}</div>`:m}_renderSelectFace(){return c`${m}`}_renderMultiSelectLabel(){switch(this._selectedIndexes.length){case 0:return c`<span class="select-face-badge no-item"
          >No items selected</span
        >`;case 1:return c`<span class="select-face-badge">1 item selected</span>`;default:return c`<span class="select-face-badge"
          >${this._selectedIndexes.length} items selected</span
        >`}}_renderComboboxFace(){let e="";return this._isBeingFiltered?e=this._filterPattern:e=this._selectedIndex>-1?this._options[this._selectedIndex]?.label??"":"",c`
      <div class="combobox-face face">
        ${this._multiple?this._renderMultiSelectLabel():m}
        <input
          class="combobox-input"
          spellcheck="false"
          type="text"
          autocomplete="off"
          .value=${e}
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
          ${Xe}
        </button>
      </div>
    `}_renderDropdownControls(){return c`${m}`}_renderDropdown(){let e=g({dropdown:!0,multiple:this._multiple});return c`
      <div class=${e}>
        ${this.position==="above"?this._renderDescription():m}
        ${this._renderOptions()} ${this._renderDropdownControls()}
        ${this.position==="below"?this._renderDescription():m}
      </div>
    `}render(){return c`
      <slot class="main-slot" @slotchange=${this._onSlotChange}></slot>
      ${this.combobox?this._renderComboboxFace():this._renderSelectFace()}
      ${this.open?this._renderDropdown():m}
    `}};O([a({type:String,reflect:!0,attribute:"aria-expanded"})],$.prototype,"ariaExpanded",void 0);O([a({type:Boolean,reflect:!0})],$.prototype,"creatable",void 0);O([a({type:Boolean,reflect:!0})],$.prototype,"combobox",void 0);O([a({type:Boolean,reflect:!0})],$.prototype,"disabled",null);O([a({type:Boolean,reflect:!0})],$.prototype,"invalid",void 0);O([a()],$.prototype,"filter",null);O([a({type:Boolean,reflect:!0})],$.prototype,"focused",void 0);O([a({type:Boolean,reflect:!0})],$.prototype,"open",void 0);O([a({type:Array})],$.prototype,"options",null);O([a({reflect:!0})],$.prototype,"position",void 0);O([a({type:Number,attribute:!0,reflect:!0})],$.prototype,"tabIndex",void 0);O([H({flatten:!0,selector:"vscode-option"})],$.prototype,"_assignedOptions",void 0);O([_()],$.prototype,"_activeIndex",void 0);O([_()],$.prototype,"_currentDescription",void 0);O([_()],$.prototype,"_filter",void 0);O([_()],$.prototype,"_filteredOptions",null);O([_()],$.prototype,"_filterPattern",void 0);O([_()],$.prototype,"_selectedIndex",void 0);O([_()],$.prototype,"_selectedIndexes",void 0);O([_()],$.prototype,"_options",void 0);O([_()],$.prototype,"_value",void 0);O([_()],$.prototype,"_values",void 0);O([_()],$.prototype,"_listScrollTop",void 0);O([_()],$.prototype,"_isPlaceholderOptionActive",void 0);O([_()],$.prototype,"_isBeingFiltered",void 0);O([S(".options")],$.prototype,"_listElement",void 0);var Vt=[f,h`
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
  `];var Qo=Vt;var Te=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},X=class extends ${set selectedIndexes(e){let t=[];e.forEach(o=>{typeof this._options[o]<"u"&&(t.includes(o)||(this._options[o].selected=!0,t.push(o)))}),this._selectedIndexes=t}get selectedIndexes(){return this._selectedIndexes}set value(e){let t=Array.isArray(e)?e.map(o=>String(o)):[String(e)];this._values=[],this._selectedIndexes.forEach(o=>{this._options[o].selected=!1}),this._selectedIndexes=[],t.forEach(o=>{typeof this._valueOptionIndexMap[o]=="number"&&(this._selectedIndexes.push(this._valueOptionIndexMap[o]),this._options[this._valueOptionIndexMap[o]].selected=!0,this._values.push(o))}),this._selectedIndexes.length>0?this._requestedValueToSetLater=[]:this._requestedValueToSetLater=Array.isArray(e)?e:[e],this._setFormValue(),this._manageRequired()}get value(){return this._values}get form(){return this._internals.form}get type(){return"select-multiple"}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}checkValidity(){return this._internals.checkValidity()}reportValidity(){return this._internals.reportValidity()}constructor(){super(),this.defaultValue=[],this.required=!1,this.name=void 0,this._requestedValueToSetLater=[],this._onOptionClick=e=>{let o=e.composedPath().find(n=>"matches"in n?n.matches("li.option"):!1);if(!o)return;if(o.classList.contains("placeholder")){this._createAndSelectSuggestedOption();return}let s=Number(o.dataset.index);if(this._options[s]){if(this._options[s].disabled)return;this._options[s].selected=!this._options[s].selected}this._selectedIndexes=[],this._values=[],this._options.forEach(n=>{n.selected&&(this._selectedIndexes.push(n.index),this._values.push(n.value))}),this._setFormValue(),this._manageRequired(),this._dispatchChangeEvent()},this._multiple=!0,this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this._setDefaultValue(),this._manageRequired()})}formResetCallback(){this.updateComplete.then(()=>{this.value=this.defaultValue})}formStateRestoreCallback(e,t){let o=Array.from(e.entries()).map(i=>String(i[1]));this.updateComplete.then(()=>{this.value=o})}_setDefaultValue(){if(Array.isArray(this.defaultValue)&&this.defaultValue.length>0){let e=this.defaultValue.map(t=>String(t));this.value=e}}_manageRequired(){let{value:e}=this;e.length===0&&this.required?this._internals.setValidity({valueMissing:!0},"Please select an item in the list.",this._faceElement):this._internals.setValidity({})}_setFormValue(){let e=new FormData;this._values.forEach(t=>{e.append(this.name??"",t)}),this._internals.setFormValue(e)}async _createAndSelectSuggestedOption(){super._createAndSelectSuggestedOption();let e=this._createSuggestedOption();await this.updateComplete,this.selectedIndexes=[...this.selectedIndexes,e],this._dispatchChangeEvent();let t=new CustomEvent("vsc-multi-select-create-option",{detail:{value:this._options[e]?.value??""}});this.dispatchEvent(t),this._toggleDropdown(!1),this._isPlaceholderOptionActive=!1}_onSlotChange(){super._onSlotChange(),this._requestedValueToSetLater.length>0&&this.options.forEach((e,t)=>{this._requestedValueToSetLater.includes(e.value)&&(this._selectedIndexes.push(t),this._values.push(e.value),this._options[t].selected=!0,this._requestedValueToSetLater=this._requestedValueToSetLater.filter(o=>o!==e.value))})}_onMultiAcceptClick(){this._toggleDropdown(!1)}_onMultiDeselectAllClick(){this._selectedIndexes=[],this._values=[],this._options=this._options.map(e=>({...e,selected:!1})),this._manageRequired(),this._dispatchChangeEvent()}_onMultiSelectAllClick(){this._selectedIndexes=[],this._values=[],this._options=this._options.map(e=>({...e,selected:!0})),this._options.forEach((e,t)=>{this._selectedIndexes.push(t),this._values.push(e.value),this._dispatchChangeEvent()}),this._setFormValue(),this._manageRequired()}_renderLabel(){switch(this._selectedIndexes.length){case 0:return c`<span class="select-face-badge no-item"
          >No items selected</span
        >`;case 1:return c`<span class="select-face-badge">1 item selected</span>`;default:return c`<span class="select-face-badge"
          >${this._selectedIndexes.length} items selected</span
        >`}}_renderSelectFace(){return c`
      <div
        class="select-face face multiselect"
        @click=${this._onFaceClick}
        tabindex=${this.tabIndex>-1?0:-1}
      >
        ${this._renderLabel()} ${Xe}
      </div>
    `}_renderDropdownControls(){return this._filteredOptions.length>0?c`
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
        `:c`${m}`}};X.styles=Qo;X.shadowRootOptions={...D.shadowRootOptions,delegatesFocus:!0};X.formAssociated=!0;Te([a({type:Array,attribute:"default-value"})],X.prototype,"defaultValue",void 0);Te([a({type:Boolean,reflect:!0})],X.prototype,"required",void 0);Te([a({reflect:!0})],X.prototype,"name",void 0);Te([a({type:Array,attribute:!1})],X.prototype,"selectedIndexes",null);Te([a({type:Array})],X.prototype,"value",null);Te([S(".face")],X.prototype,"_faceElement",void 0);X=Te([p("vscode-multi-select")],X);var Ai=[f,h`
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
  `],es=Ai;var Bt=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},me=class extends u{constructor(){super(...arguments),this.ariaLabel="Loading",this.ariaLive="assertive",this.role="alert"}render(){return c`<svg class="progress" part="progress" viewBox="0 0 16 16">
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
    </svg>`}};me.styles=es;Bt([a({reflect:!0,attribute:"aria-label"})],me.prototype,"ariaLabel",void 0);Bt([a({reflect:!0,attribute:"aria-live"})],me.prototype,"ariaLive",void 0);Bt([a({reflect:!0})],me.prototype,"role",void 0);me=Bt([p("vscode-progress-ring")],me);var Pi=[f,kt,h`
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
  `],ts=Pi;var Z=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},T=class extends Ct(Pe){constructor(){super(),this.autofocus=!1,this.checked=!1,this.defaultChecked=!1,this.invalid=!1,this.name="",this.value="",this.disabled=!1,this.required=!1,this.role="radio",this.tabIndex=0,this._slottedText="",this.type="radio",this._handleClick=()=>{this.disabled||this.checked||(this._checkButton(),this._handleValueChange(),this._dispatchCustomEvent(),this.dispatchEvent(new Event("change",{bubbles:!0})))},this._handleKeyDown=e=>{!this.disabled&&(e.key==="Enter"||e.key===" ")&&(e.preventDefault(),e.key===" "&&!this.checked&&(this.checked=!0,this._handleValueChange(),this._dispatchCustomEvent(),this.dispatchEvent(new Event("change",{bubbles:!0}))),e.key==="Enter"&&this._internals.form?.requestSubmit())},this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.addEventListener("keydown",this._handleKeyDown),this.addEventListener("click",this._handleClick),this._handleValueChange()}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("keydown",this._handleKeyDown),this.removeEventListener("click",this._handleClick)}update(e){super.update(e),e.has("checked")&&this._handleValueChange(),e.has("required")&&this._handleValueChange()}get form(){return this._internals.form}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}checkValidity(){return this._internals.checkValidity()}reportValidity(){return this._internals.reportValidity()}formResetCallback(){this._getRadios().forEach(t=>{t.checked=t.defaultChecked}),this.updateComplete.then(()=>{this._handleValueChange()})}formStateRestoreCallback(e,t){this.value===e&&e!==""&&(this.checked=!0)}_dispatchCustomEvent(){this.dispatchEvent(new CustomEvent("vsc-change",{detail:{checked:this.checked,label:this.label,value:this.value},bubbles:!0,composed:!0}))}_getRadios(){let e=this.getRootNode({composed:!0});if(!e)return[];let t=e.querySelectorAll(`vscode-radio[name="${this.name}"]`);return Array.from(t)}_uncheckOthers(e){e.forEach(t=>{t!==this&&(t.checked=!1)})}_checkButton(){let e=this._getRadios();this.checked=!0,e.forEach(t=>{t!==this&&(t.checked=!1)})}setComponentValidity(e){e?this._internals.setValidity({}):this._internals.setValidity({valueMissing:!0},"Please select one of these options.",this._inputEl)}_setGroupValidity(e,t){this.updateComplete.then(()=>{e.forEach(o=>{o.setComponentValidity(t)})})}_setActualFormValue(){let e="";this.checked?e=this.value?this.value:"on":e=null,this._internals.setFormValue(e)}_handleValueChange(){let e=this._getRadios(),t=e.some(o=>o.required);if(this._setActualFormValue(),this.checked)this._uncheckOthers(e),this._setGroupValidity(e,!0);else{let o=!!e.find(s=>s.checked),i=t&&!o;this._setGroupValidity(e,!i)}}render(){let e=g({icon:!0,checked:this.checked}),t=g({"label-inner":!0,"is-slot-empty":this._slottedText===""});return c`
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
        <div class=${e}></div>
        <label for="input" class="label" @click=${this._handleClick}>
          <span class=${t}>
            ${this._renderLabelAttribute()}
            <slot @slotchange=${this._handleSlotChange}></slot>
          </span>
        </label>
      </div>
    `}};T.styles=ts;T.formAssociated=!0;T.shadowRootOptions={...D.shadowRootOptions,delegatesFocus:!0};Z([a({type:Boolean,reflect:!0})],T.prototype,"autofocus",void 0);Z([a({type:Boolean,reflect:!0})],T.prototype,"checked",void 0);Z([a({type:Boolean,reflect:!0,attribute:"default-checked"})],T.prototype,"defaultChecked",void 0);Z([a({type:Boolean,reflect:!0})],T.prototype,"invalid",void 0);Z([a({reflect:!0})],T.prototype,"name",void 0);Z([a()],T.prototype,"value",void 0);Z([a({type:Boolean,reflect:!0})],T.prototype,"disabled",void 0);Z([a({type:Boolean,reflect:!0})],T.prototype,"required",void 0);Z([a({reflect:!0})],T.prototype,"role",void 0);Z([a({type:Number,reflect:!0})],T.prototype,"tabIndex",void 0);Z([_()],T.prototype,"_slottedText",void 0);Z([S("#input")],T.prototype,"_inputEl",void 0);Z([a()],T.prototype,"type",void 0);T=Z([p("vscode-radio")],T);var os=Vt;var we=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},N=class extends ${set selectedIndex(e){this._selectedIndex=e,this._options[e]?(this._activeIndex=e,this._value=this._options[e].value,this._internals.setFormValue(this._value),this._manageRequired()):(this._value="",this._internals.setFormValue(""),this._manageRequired())}get selectedIndex(){return this._selectedIndex}set value(e){this._options[this._selectedIndex]&&(this._options[this._selectedIndex].selected=!1),this._selectedIndex=this._options.findIndex(t=>t.value===e),this._selectedIndex>-1?(this._options[this._selectedIndex].selected=!0,this._value=e,this._requestedValueToSetLater=""):(this._value="",this._requestedValueToSetLater=e),this._internals.setFormValue(this._value),this._manageRequired()}get value(){return this._options[this._selectedIndex]?this._options[this._selectedIndex]?.value??"":""}get validity(){return this._internals.validity}get validationMessage(){return this._internals.validationMessage}get willValidate(){return this._internals.willValidate}checkValidity(){return this._internals.checkValidity()}reportValidity(){return this._internals.reportValidity()}updateInputValue(){if(!this.combobox)return;let e=this.renderRoot.querySelector(".combobox-input");e&&(e.value=this._options[this._selectedIndex]?this._options[this._selectedIndex].label:"")}constructor(){super(),this.defaultValue="",this.role="listbox",this.name=void 0,this.required=!1,this._requestedValueToSetLater="",this._multiple=!1,this._internals=this.attachInternals()}connectedCallback(){super.connectedCallback(),this.updateComplete.then(()=>{this._manageRequired()})}formResetCallback(){this.value=this.defaultValue}formStateRestoreCallback(e,t){this.updateComplete.then(()=>{this.value=e})}get type(){return"select-one"}get form(){return this._internals.form}async _createAndSelectSuggestedOption(){let e=this._createSuggestedOption();await this.updateComplete,this.selectedIndex=e,this._dispatchChangeEvent();let t=new CustomEvent("vsc-single-select-create-option",{detail:{value:this._options[e]?.value??""}});this.dispatchEvent(t),this._toggleDropdown(!1),this._isPlaceholderOptionActive=!1}_onSlotChange(){if(super._onSlotChange(),this._requestedValueToSetLater){let e=this._options.findIndex(t=>t.value===this._requestedValueToSetLater);e>0&&(this._selectedIndex=e,this._requestedValueToSetLater="")}this._selectedIndex>-1&&this._options.length>0?(this._internals.setFormValue(this._options[this._selectedIndex].value),this._manageRequired()):(this._internals.setFormValue(null),this._manageRequired())}_onArrowUpKeyDown(){if(super._onArrowUpKeyDown(),this.open||this._selectedIndex<=0)return;let e=this.combobox?this._filteredOptions:this._options,t=Pt(e,this._activeIndex);this._filterPattern="",this._selectedIndex=t,this._activeIndex=t,this._value=t>-1?this._options[t].value:"",this._internals.setFormValue(this._value),this._manageRequired(),this._dispatchChangeEvent()}_onArrowDownKeyDown(){if(super._onArrowDownKeyDown(),this.open||this._selectedIndex>=this._options.length-1)return;let e=this.combobox?this._filteredOptions:this._options,t=At(e,this._activeIndex);this._filterPattern="",this._selectedIndex=t,this._activeIndex=t,this._value=t>-1?this._options[t].value:"",this._internals.setFormValue(this._value),this._manageRequired(),this._dispatchChangeEvent()}_onEnterKeyDown(e){super._onEnterKeyDown(e),this.updateInputValue(),this._internals.setFormValue(this._value),this._manageRequired()}_onOptionClick(e){super._onOptionClick(e);let o=e.composedPath().find(s=>{let n=s;if("matches"in n)return n.matches("li.option")});if(!o||o.matches(".disabled"))return;o.classList.contains("placeholder")?this.creatable&&this._createAndSelectSuggestedOption():(this._selectedIndex=Number(o.dataset.index),this._value=this._options[this._selectedIndex].value,this._toggleDropdown(!1),this._internals.setFormValue(this._value),this._manageRequired(),this._dispatchChangeEvent())}_manageRequired(){let{value:e}=this;e===""&&this.required?this._internals.setValidity({valueMissing:!0},"Please select an item in the list.",this._face):this._internals.setValidity({})}_renderSelectFace(){let e=this._options[this._selectedIndex]?.label??"";return c`
      <div
        class="select-face face"
        @click=${this._onFaceClick}
        tabindex=${this.tabIndex>-1?0:-1}
      >
        <span class="text">${e}</span> ${Xe}
      </div>
    `}};N.styles=os;N.shadowRootOptions={...D.shadowRootOptions,delegatesFocus:!0};N.formAssociated=!0;we([a({attribute:"default-value"})],N.prototype,"defaultValue",void 0);we([a({type:String,attribute:!0,reflect:!0})],N.prototype,"role",void 0);we([a({reflect:!0})],N.prototype,"name",void 0);we([a({type:Number,attribute:"selected-index"})],N.prototype,"selectedIndex",null);we([a({type:String})],N.prototype,"value",null);we([a({type:Boolean,reflect:!0})],N.prototype,"required",void 0);we([S(".face")],N.prototype,"_face",void 0);N=we([p("vscode-single-select")],N);var Ri=[f,h`
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
  `],ss=Ri;var U=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},L=class extends u{constructor(){super(...arguments),this.shadow=!0,this.scrolled=!1,this._isDragging=!1,this._thumbHeight=0,this._thumbY=0,this._thumbVisible=!1,this._thumbFade=!1,this._thumbActive=!1,this._scrollThumbStartY=0,this._mouseStartY=0,this._scrollbarVisible=!0,this._scrollbarTrackZ=0,this._resizeObserverCallback=()=>{this._updateScrollbar()},this._onSlotChange=()=>{this._zIndexFix()},this._onScrollThumbMouseMoveBound=this._onScrollThumbMouseMove.bind(this),this._onScrollThumbMouseUpBound=this._onScrollThumbMouseUp.bind(this),this._onComponentMouseOverBound=this._onComponentMouseOver.bind(this),this._onComponentMouseOutBound=this._onComponentMouseOut.bind(this)}set scrollPos(e){this._scrollableContainer.scrollTop=e}get scrollPos(){return this._scrollableContainer?this._scrollableContainer.scrollTop:0}get scrollMax(){return this._scrollableContainer?this._scrollableContainer.scrollHeight:0}connectedCallback(){super.connectedCallback(),this._hostResizeObserver=new ResizeObserver(this._resizeObserverCallback),this._contentResizeObserver=new ResizeObserver(this._resizeObserverCallback),this.requestUpdate(),this.updateComplete.then(()=>{this._scrollableContainer.addEventListener("scroll",this._onScrollableContainerScroll.bind(this)),this._hostResizeObserver.observe(this),this._contentResizeObserver.observe(this._contentElement)}),this.addEventListener("mouseover",this._onComponentMouseOverBound),this.addEventListener("mouseout",this._onComponentMouseOutBound)}disconnectedCallback(){super.disconnectedCallback(),this._hostResizeObserver.unobserve(this),this._hostResizeObserver.disconnect(),this._contentResizeObserver.unobserve(this._contentElement),this._contentResizeObserver.disconnect(),this.removeEventListener("mouseover",this._onComponentMouseOverBound),this.removeEventListener("mouseout",this._onComponentMouseOutBound)}_updateScrollbar(){let e=this.getBoundingClientRect(),t=this._contentElement.getBoundingClientRect();e.height>=t.height?this._scrollbarVisible=!1:(this._scrollbarVisible=!0,this._thumbHeight=e.height*(e.height/t.height)),this.requestUpdate()}_zIndexFix(){let e=0;this._assignedElements.forEach(t=>{if("style"in t){let o=window.getComputedStyle(t).zIndex;/([0-9-])+/g.test(o)&&(e=Number(o)>e?Number(o):e)}}),this._scrollbarTrackZ=e+1,this.requestUpdate()}_onScrollThumbMouseDown(e){let t=this.getBoundingClientRect(),o=this._scrollThumbElement.getBoundingClientRect();this._mouseStartY=e.screenY,this._scrollThumbStartY=o.top-t.top,this._isDragging=!0,this._thumbActive=!0,document.addEventListener("mousemove",this._onScrollThumbMouseMoveBound),document.addEventListener("mouseup",this._onScrollThumbMouseUpBound)}_onScrollThumbMouseMove(e){let t=this._scrollThumbStartY+(e.screenY-this._mouseStartY),o=0,i=this.getBoundingClientRect().height,s=this._scrollThumbElement.getBoundingClientRect().height,n=this._contentElement.getBoundingClientRect().height;t<0?o=0:t>i-s?o=i-s:o=t,this._thumbY=o,this._scrollableContainer.scrollTop=o/(i-s)*(n-i)}_onScrollThumbMouseUp(e){this._isDragging=!1,this._thumbActive=!1;let t=this.getBoundingClientRect(),{x:o,y:i,width:s,height:n}=t,{pageX:l,pageY:d}=e;(l>o+s||l<o||d>i+n||d<i)&&(this._thumbFade=!0,this._thumbVisible=!1),document.removeEventListener("mousemove",this._onScrollThumbMouseMoveBound),document.removeEventListener("mouseup",this._onScrollThumbMouseUpBound)}_onScrollableContainerScroll(){let e=this._scrollableContainer.scrollTop;this.scrolled=e>0;let t=this.getBoundingClientRect().height,o=this._scrollThumbElement.getBoundingClientRect().height,s=this._contentElement.getBoundingClientRect().height-t,n=e/s;this._thumbY=n*(t-o)}_onComponentMouseOver(){this._thumbVisible=!0,this._thumbFade=!1}_onComponentMouseOut(){this._thumbActive||(this._thumbVisible=!1,this._thumbFade=!0)}render(){return c`
      <div
        class="scrollable-container"
        .style=${B({userSelect:this._isDragging?"none":"auto"})}
      >
        <div
          class=${g({shadow:!0,visible:this.scrolled})}
          .style=${B({zIndex:String(this._scrollbarTrackZ)})}
        ></div>
        ${this._isDragging?c`<div class="prevent-interaction"></div>`:m}
        <div
          class=${g({"scrollbar-track":!0,hidden:!this._scrollbarVisible})}
        >
          <div
            class=${g({"scrollbar-thumb":!0,visible:this._thumbVisible,fade:this._thumbFade,active:this._thumbActive})}
            .style=${B({height:`${this._thumbHeight}px`,top:`${this._thumbY}px`})}
            @mousedown=${this._onScrollThumbMouseDown}
          ></div>
        </div>
        <div class="content">
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `}};L.styles=ss;U([a({type:Boolean,reflect:!0})],L.prototype,"shadow",void 0);U([a({type:Boolean,reflect:!0})],L.prototype,"scrolled",void 0);U([a({type:Number,attribute:"scroll-pos"})],L.prototype,"scrollPos",null);U([a({type:Number,attribute:"scroll-max"})],L.prototype,"scrollMax",null);U([_()],L.prototype,"_isDragging",void 0);U([_()],L.prototype,"_thumbHeight",void 0);U([_()],L.prototype,"_thumbY",void 0);U([_()],L.prototype,"_thumbVisible",void 0);U([_()],L.prototype,"_thumbFade",void 0);U([_()],L.prototype,"_thumbActive",void 0);U([S(".content")],L.prototype,"_contentElement",void 0);U([S(".scrollbar-thumb",!0)],L.prototype,"_scrollThumbElement",void 0);U([S(".scrollable-container")],L.prototype,"_scrollableContainer",void 0);U([H()],L.prototype,"_assignedElements",void 0);L=U([p("vscode-scrollable")],L);var Vi=[f,h`
    :host {
      --separator-border: var(--vscode-editorWidget-border, transparent);

      border: 1px solid var(--vscode-editorWidget-border);
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
      background-color: var(--vscode-sash-hoverBorder);
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
  `],is=Vi;var W=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Jt,rs="50%",Bi=4,Tt=r=>{if(!r)return{value:0,unit:"pixel"};let e,t;r.endsWith("%")?(e="percent",t=+r.substring(0,r.length-1)):r.endsWith("px")?(e="pixel",t=+r.substring(0,r.length-2)):(e="pixel",t=+r);let o=isNaN(t)?0:t;return{unit:e,value:o}},zt=(r,e)=>e===0?0:Math.min(100,r/e*100),ns=(r,e)=>e*(r/100),M=Jt=class extends u{set split(e){this._split!==e&&(this._split=e,this.resetHandlePosition())}get split(){return this._split}set handlePosition(e){this._rawHandlePosition=e,this._handlePositionPropChanged()}get handlePosition(){return this._rawHandlePosition}set fixedPane(e){this._fixedPane=e,this._fixedPanePropChanged()}get fixedPane(){return this._fixedPane}constructor(){super(),this._split="vertical",this.resetOnDblClick=!1,this.handleSize=4,this.initialHandlePosition=rs,this._fixedPane="none",this._handlePosition=0,this._isDragActive=!1,this._hover=!1,this._hide=!1,this._boundRect=new DOMRect,this._handleOffset=0,this._wrapperObserved=!1,this._fixedPaneSize=0,this._handleResize=e=>{let t=e[0].contentRect,{width:o,height:i}=t;this._boundRect=t;let s=this.split==="vertical"?o:i;this.fixedPane==="start"&&(this._handlePosition=this._fixedPaneSize),this.fixedPane==="end"&&(this._handlePosition=s-this._fixedPaneSize)},this._handleMouseUp=e=>{this._isDragActive=!1,e.target!==this&&(this._hover=!1,this._hide=!0),window.removeEventListener("mouseup",this._handleMouseUp),window.removeEventListener("mousemove",this._handleMouseMove);let{width:t,height:o}=this._boundRect,i=this.split==="vertical"?t:o,s=zt(this._handlePosition,i);this.dispatchEvent(new CustomEvent("vsc-split-layout-change",{detail:{position:this._handlePosition,positionInPercentage:s},composed:!0}))},this._handleMouseMove=e=>{let{clientX:t,clientY:o}=e,{left:i,top:s,height:n,width:l}=this._boundRect,d=this.split==="vertical",b=d?l:n,y=d?t-i:o-s;this._handlePosition=Math.max(0,Math.min(y-this._handleOffset+this.handleSize/2,b)),this.fixedPane==="start"&&(this._fixedPaneSize=this._handlePosition),this.fixedPane==="end"&&(this._fixedPaneSize=b-this._handlePosition)},this._resizeObserver=new ResizeObserver(this._handleResize)}resetHandlePosition(){if(!this._wrapperEl){this._handlePosition=0;return}let{width:e,height:t}=this._wrapperEl.getBoundingClientRect(),o=this.split==="vertical"?e:t,{value:i,unit:s}=Tt(this.initialHandlePosition??rs);s==="percent"?this._handlePosition=ns(i,o):this._handlePosition=i}connectedCallback(){super.connectedCallback()}firstUpdated(e){this.fixedPane!=="none"&&(this._resizeObserver.observe(this._wrapperEl),this._wrapperObserved=!0),this._boundRect=this._wrapperEl.getBoundingClientRect();let{value:t,unit:o}=this.handlePosition?Tt(this.handlePosition):Tt(this.initialHandlePosition);this._setPosition(t,o),this._initFixedPane()}_handlePositionPropChanged(){if(this.handlePosition&&this._wrapperEl){this._boundRect=this._wrapperEl.getBoundingClientRect();let{value:e,unit:t}=Tt(this.handlePosition);this._setPosition(e,t)}}_fixedPanePropChanged(){this._wrapperEl&&this._initFixedPane()}_initFixedPane(){if(this.fixedPane==="none")this._wrapperObserved&&(this._resizeObserver.unobserve(this._wrapperEl),this._wrapperObserved=!1);else{let{width:e,height:t}=this._boundRect,o=this.split==="vertical"?e:t;this._fixedPaneSize=this.fixedPane==="start"?this._handlePosition:o-this._handlePosition,this._wrapperObserved||(this._resizeObserver.observe(this._wrapperEl),this._wrapperObserved=!0)}}_setPosition(e,t){let{width:o,height:i}=this._boundRect,s=this.split==="vertical"?o:i;this._handlePosition=t==="percent"?ns(e,s):e}_handleMouseOver(){this._hover=!0,this._hide=!1}_handleMouseOut(e){e.buttons!==1&&(this._hover=!1,this._hide=!0)}_handleMouseDown(e){e.stopPropagation(),e.preventDefault(),this._boundRect=this._wrapperEl.getBoundingClientRect();let{left:t,top:o}=this._boundRect,{left:i,top:s}=this._handleEl.getBoundingClientRect(),n=e.clientX-t,l=e.clientY-o;this.split==="vertical"&&(this._handleOffset=n-(i-t)),this.split==="horizontal"&&(this._handleOffset=l-(s-o)),this._isDragActive=!0,window.addEventListener("mouseup",this._handleMouseUp),window.addEventListener("mousemove",this._handleMouseMove)}_handleDblClick(){this.resetOnDblClick&&this.resetHandlePosition()}_handleSlotChange(){[...this._nestedLayoutsAtStart,...this._nestedLayoutsAtEnd].forEach(t=>{t instanceof Jt&&t.resetHandlePosition()})}render(){let{width:e,height:t}=this._boundRect,o=this.split==="vertical"?e:t,i=this.fixedPane!=="none"?`${this._handlePosition}px`:`${zt(this._handlePosition,o)}%`,s="";this.fixedPane==="start"?s=`0 0 ${this._fixedPaneSize}px`:s=`1 1 ${zt(this._handlePosition,o)}%`;let n="";this.fixedPane==="end"?n=`0 0 ${this._fixedPaneSize}px`:n=`1 1 ${zt(o-this._handlePosition,o)}%`;let l={left:this.split==="vertical"?i:"0",top:this.split==="vertical"?"0":i},d=this.handleSize??Bi;this.split==="vertical"&&(l.marginLeft=`${0-d/2}px`,l.width=`${d}px`),this.split==="horizontal"&&(l.height=`${d}px`,l.marginTop=`${0-d/2}px`);let b=g({"handle-overlay":!0,active:this._isDragActive,"split-vertical":this.split==="vertical","split-horizontal":this.split==="horizontal"}),y=g({handle:!0,hover:this._hover,hide:this._hide,"split-vertical":this.split==="vertical","split-horizontal":this.split==="horizontal"}),v={wrapper:!0,horizontal:this.split==="horizontal"};return c`
      <div class=${g(v)}>
        <div class="start" .style=${B({flex:s})}>
          <slot name="start" @slotchange=${this._handleSlotChange}></slot>
        </div>
        <div class="end" .style=${B({flex:n})}>
          <slot name="end" @slotchange=${this._handleSlotChange}></slot>
        </div>
        <div class=${b}></div>
        <div
          class=${y}
          .style=${B(l)}
          @mouseover=${this._handleMouseOver}
          @mouseout=${this._handleMouseOut}
          @mousedown=${this._handleMouseDown}
          @dblclick=${this._handleDblClick}
        ></div>
      </div>
    `}};M.styles=is;W([a({reflect:!0})],M.prototype,"split",null);W([a({type:Boolean,reflect:!0,attribute:"reset-on-dbl-click"})],M.prototype,"resetOnDblClick",void 0);W([a({type:Number,reflect:!0,attribute:"handle-size"})],M.prototype,"handleSize",void 0);W([a({reflect:!0,attribute:"initial-handle-position"})],M.prototype,"initialHandlePosition",void 0);W([a({attribute:"handle-position"})],M.prototype,"handlePosition",null);W([a({attribute:"fixed-pane"})],M.prototype,"fixedPane",null);W([_()],M.prototype,"_handlePosition",void 0);W([_()],M.prototype,"_isDragActive",void 0);W([_()],M.prototype,"_hover",void 0);W([_()],M.prototype,"_hide",void 0);W([S(".wrapper")],M.prototype,"_wrapperEl",void 0);W([S(".handle")],M.prototype,"_handleEl",void 0);W([H({slot:"start",selector:"vscode-split-layout"})],M.prototype,"_nestedLayoutsAtStart",void 0);W([H({slot:"end",selector:"vscode-split-layout"})],M.prototype,"_nestedLayoutsAtEnd",void 0);M=Jt=W([p("vscode-split-layout")],M);var Ti=[f,h`
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
  `],ls=Ti;var Je=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},K=class extends u{constructor(){super(...arguments),this.active=!1,this.ariaControls="",this.panel=!1,this.role="tab",this.tabId=-1}attributeChangedCallback(e,t,o){if(super.attributeChangedCallback(e,t,o),e==="active"){let i=o!==null;this.ariaSelected=i?"true":"false",this.tabIndex=i?0:-1}}render(){return c`
      <div
        class=${g({wrapper:!0,active:this.active,panel:this.panel})}
      >
        <div class="before"><slot name="content-before"></slot></div>
        <div class="main"><slot></slot></div>
        <div class="after"><slot name="content-after"></slot></div>
        <span
          class=${g({"active-indicator":!0,active:this.active,panel:this.panel})}
        ></span>
      </div>
    `}};K.styles=ls;Je([a({type:Boolean,reflect:!0})],K.prototype,"active",void 0);Je([a({reflect:!0,attribute:"aria-controls"})],K.prototype,"ariaControls",void 0);Je([a({type:Boolean,reflect:!0})],K.prototype,"panel",void 0);Je([a({reflect:!0})],K.prototype,"role",void 0);Je([a({type:Number,reflect:!0,attribute:"tab-id"})],K.prototype,"tabId",void 0);K=Je([p("vscode-tab-header")],K);var zi=[f,h`
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
  `],as=zi;var Qe=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},te=class extends u{constructor(){super(...arguments),this.hidden=!1,this.ariaLabelledby="",this.panel=!1,this.role="tabpanel",this.tabIndex=0}render(){return c` <slot></slot> `}};te.styles=as;Qe([a({type:Boolean,reflect:!0})],te.prototype,"hidden",void 0);Qe([a({reflect:!0,attribute:"aria-labelledby"})],te.prototype,"ariaLabelledby",void 0);Qe([a({type:Boolean,reflect:!0})],te.prototype,"panel",void 0);Qe([a({reflect:!0})],te.prototype,"role",void 0);Qe([a({type:Number,reflect:!0})],te.prototype,"tabIndex",void 0);te=Qe([p("vscode-tab-panel")],te);var Di=[f,h`
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
  `],cs=Di;var ds=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},ze=class extends u{constructor(){super(...arguments),this.role="rowgroup"}render(){return c` <slot></slot> `}};ze.styles=cs;ds([a({reflect:!0})],ze.prototype,"role",void 0);ze=ds([p("vscode-table-body")],ze);var Li=[f,h`
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
  `],hs=Li;var Dt=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},ve=class extends u{constructor(){super(...arguments),this.role="cell",this.columnLabel="",this.compact=!1}render(){let e=this.columnLabel?c`<div class="column-label" role="presentation">
          ${this.columnLabel}
        </div>`:m;return c`
      <div class="wrapper">
        ${e}
        <slot></slot>
      </div>
    `}};ve.styles=hs;Dt([a({reflect:!0})],ve.prototype,"role",void 0);Dt([a({attribute:"column-label"})],ve.prototype,"columnLabel",void 0);Dt([a({type:Boolean,reflect:!0})],ve.prototype,"compact",void 0);ve=Dt([p("vscode-table-cell")],ve);var Mi=[f,h`
    :host {
      background-color: var(--vscode-keybindingTable-headerBackground);
      display: table;
      table-layout: fixed;
      width: 100%;
    }
  `],ps=Mi;var us=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},De=class extends u{constructor(){super(...arguments),this.role="rowgroup"}render(){return c` <slot></slot> `}};De.styles=ps;us([a({reflect:!0})],De.prototype,"role",void 0);De=us([p("vscode-table-header")],De);var Fi=[f,h`
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
  `],fs=Fi;var ms=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Le=class extends u{constructor(){super(...arguments),this.role="columnheader"}render(){return c`
      <div class="wrapper">
        <slot></slot>
      </div>
    `}};Le.styles=fs;ms([a({reflect:!0})],Le.prototype,"role",void 0);Le=ms([p("vscode-table-header-cell")],Le);var Hi=[f,h`
    :host {
      border-top-color: var(--vscode-editorGroup-border);
      border-top-style: solid;
      border-top-width: var(--vsc-row-border-top-width);
      display: var(--vsc-row-display);
      width: 100%;
    }
  `],vs=Hi;var bs=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Me=class extends u{constructor(){super(...arguments),this.role="row"}render(){return c` <slot></slot> `}};Me.styles=vs;bs([a({reflect:!0})],Me.prototype,"role",void 0);Me=bs([p("vscode-table-row")],Me);var Qt=(r,e)=>typeof r=="number"&&!Number.isNaN(r)?r/e*100:typeof r=="string"&&/^[0-9.]+$/.test(r)?Number(r)/e*100:typeof r=="string"&&/^[0-9.]+%$/.test(r)?Number(r.substring(0,r.length-1)):typeof r=="string"&&/^[0-9.]+px$/.test(r)?Number(r.substring(0,r.length-2))/e*100:null;var ji=[f,h`
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
  `],_s=ji;var R=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},gs=100,I=class extends u{constructor(){super(...arguments),this.role="table",this.resizable=!1,this.responsive=!1,this.bordered=!1,this.borderedColumns=!1,this.borderedRows=!1,this.breakpoint=300,this.minColumnWidth="50px",this.delayedResizing=!1,this.compact=!1,this.zebra=!1,this.zebraOdd=!1,this._sashPositions=[],this._isDragging=!1,this._sashHovers=[],this._columns=[],this._activeSashElementIndex=-1,this._activeSashCursorOffset=0,this._componentX=0,this._componentH=0,this._componentW=0,this._headerCells=[],this._cellsOfFirstRow=[],this._prevHeaderHeight=0,this._prevComponentHeight=0,this._componentResizeObserverCallback=()=>{this._memoizeComponentDimensions(),this._updateResizeHandlersSize(),this.responsive&&this._toggleCompactView(),this._resizeTableBody()},this._headerResizeObserverCallback=()=>{this._updateResizeHandlersSize()},this._bodyResizeObserverCallback=()=>{this._resizeTableBody()},this._onResizingMouseMove=e=>{e.stopPropagation(),this._updateActiveSashPosition(e.pageX),this.delayedResizing?this._resizeColumns(!1):this._resizeColumns(!0)},this._onResizingMouseUp=e=>{this._resizeColumns(!0),this._updateActiveSashPosition(e.pageX),this._sashHovers[this._activeSashElementIndex]=!1,this._isDragging=!1,this._activeSashElementIndex=-1,document.removeEventListener("mousemove",this._onResizingMouseMove),document.removeEventListener("mouseup",this._onResizingMouseUp)}}set columns(e){this._columns=e,this.isConnected&&this._initDefaultColumnSizes()}get columns(){return this._columns}connectedCallback(){super.connectedCallback(),this._memoizeComponentDimensions(),this._initDefaultColumnSizes()}disconnectedCallback(){super.disconnectedCallback(),this._componentResizeObserver?.unobserve(this),this._componentResizeObserver?.disconnect(),this._bodyResizeObserver?.disconnect()}_px2Percent(e){return e/this._componentW*100}_percent2Px(e){return this._componentW*e/100}_memoizeComponentDimensions(){let e=this.getBoundingClientRect();this._componentH=e.height,this._componentW=e.width,this._componentX=e.x}_queryHeaderCells(){let e=this._assignedHeaderElements;return e&&e[0]?Array.from(e[0].querySelectorAll("vscode-table-header-cell")):[]}_getHeaderCells(){return this._headerCells.length||(this._headerCells=this._queryHeaderCells()),this._headerCells}_queryCellsOfFirstRow(){let e=this._assignedBodyElements;return e&&e[0]?Array.from(e[0].querySelectorAll("vscode-table-row:first-child vscode-table-cell")):[]}_getCellsOfFirstRow(){return this._cellsOfFirstRow.length||(this._cellsOfFirstRow=this._queryCellsOfFirstRow()),this._cellsOfFirstRow}_resizeTableBody(){let e=0,t=0,o=this.getBoundingClientRect().height;this._assignedHeaderElements&&this._assignedHeaderElements.length&&(e=this._assignedHeaderElements[0].getBoundingClientRect().height),this._assignedBodyElements&&this._assignedBodyElements.length&&(t=this._assignedBodyElements[0].getBoundingClientRect().height);let i=t-e-o;this._scrollableElement.style.height=i>0?`${o-e}px`:"auto"}_initResizeObserver(){this._componentResizeObserver=new ResizeObserver(this._componentResizeObserverCallback),this._componentResizeObserver.observe(this),this._headerResizeObserver=new ResizeObserver(this._headerResizeObserverCallback),this._headerResizeObserver.observe(this._headerElement)}_calcColWidthPercentages(){let e=this._getHeaderCells().length,t=this.columns.slice(0,e),o=t.filter(s=>s==="auto").length+e-t.length,i=100;if(t=t.map(s=>{let n=Qt(s,this._componentW);return n===null?"auto":(i-=n,n)}),t.length<e)for(let s=t.length;s<e;s++)t.push("auto");return t=t.map(s=>s==="auto"?i/o:s),t}_initHeaderCellSizes(e){this._getHeaderCells().forEach((t,o)=>{t.style.width=`${e[o]}%`})}_initBodyColumnSizes(e){this._getCellsOfFirstRow().forEach((t,o)=>{t.style.width=`${e[o]}%`})}_initSashes(e){let t=e.length,o=0;this._sashPositions=[],e.forEach((i,s)=>{if(s<t-1){let n=o+i;this._sashPositions.push(n),o=n}})}_initDefaultColumnSizes(){let e=this._calcColWidthPercentages();this._initHeaderCellSizes(e),this._initBodyColumnSizes(e),this._initSashes(e)}_updateResizeHandlersSize(){let e=this._headerElement.getBoundingClientRect();if(e.height===this._prevHeaderHeight&&this._componentH===this._prevComponentHeight)return;this._prevHeaderHeight=e.height,this._prevComponentHeight=this._componentH;let t=this._componentH-e.height;this._sashVisibleElements.forEach(o=>{o.style.height=`${t}px`,o.style.top=`${e.height}px`})}_applyCompactViewColumnLabels(){let t=this._getHeaderCells().map(i=>i.innerText);this.querySelectorAll("vscode-table-row").forEach(i=>{i.querySelectorAll("vscode-table-cell").forEach((n,l)=>{n.columnLabel=t[l],n.compact=!0})})}_clearCompactViewColumnLabels(){this.querySelectorAll("vscode-table-cell").forEach(e=>{e.columnLabel="",e.compact=!1})}_toggleCompactView(){let t=this.getBoundingClientRect().width<this.breakpoint;this.compact!==t&&(this.compact=t,t?this._applyCompactViewColumnLabels():this._clearCompactViewColumnLabels())}_onDefaultSlotChange(){this._assignedElements.forEach(e=>{if(e.tagName.toLowerCase()==="vscode-table-header"){e.slot="header";return}if(e.tagName.toLowerCase()==="vscode-table-body"){e.slot="body";return}})}_onHeaderSlotChange(){this._headerCells=this._queryHeaderCells()}_onBodySlotChange(){if(this._initDefaultColumnSizes(),this._initResizeObserver(),this._updateResizeHandlersSize(),!this._bodyResizeObserver){let e=this._assignedBodyElements[0]??null;e&&(this._bodyResizeObserver=new ResizeObserver(this._bodyResizeObserverCallback),this._bodyResizeObserver.observe(e))}}_onSashMouseOver(e){if(this._isDragging)return;let t=e.currentTarget,o=Number(t.dataset.index);this._sashHovers[o]=!0,this.requestUpdate()}_onSashMouseOut(e){if(e.stopPropagation(),this._isDragging)return;let t=e.currentTarget,o=Number(t.dataset.index);this._sashHovers[o]=!1,this.requestUpdate()}_onSashMouseDown(e){e.stopPropagation();let{pageX:t,currentTarget:o}=e,i=o,s=Number(i.dataset.index),l=i.getBoundingClientRect().x;this._isDragging=!0,this._activeSashElementIndex=s,this._sashHovers[this._activeSashElementIndex]=!0,this._activeSashCursorOffset=this._px2Percent(t-l);let d=this._getHeaderCells();this._headerCellsToResize=[],this._headerCellsToResize.push(d[s]),d[s+1]&&(this._headerCellsToResize[1]=d[s+1]);let y=this._bodySlot.assignedElements()[0].querySelectorAll("vscode-table-row:first-child > vscode-table-cell");this._cellsToResize=[],this._cellsToResize.push(y[s]),y[s+1]&&this._cellsToResize.push(y[s+1]),document.addEventListener("mousemove",this._onResizingMouseMove),document.addEventListener("mouseup",this._onResizingMouseUp)}_updateActiveSashPosition(e){let{prevSashPos:t,nextSashPos:o}=this._getSashPositions(),i=Qt(this.minColumnWidth,this._componentW);i===null&&(i=0);let s=t?t+i:i,n=o?o-i:gs-i,l=this._px2Percent(e-this._componentX-this._percent2Px(this._activeSashCursorOffset));l=Math.max(l,s),l=Math.min(l,n),this._sashPositions[this._activeSashElementIndex]=l,this.requestUpdate()}_getSashPositions(){let e=this._sashPositions[this._activeSashElementIndex],t=this._sashPositions[this._activeSashElementIndex-1]||0,o=this._sashPositions[this._activeSashElementIndex+1]||gs;return{sashPos:e,prevSashPos:t,nextSashPos:o}}_resizeColumns(e=!0){let{sashPos:t,prevSashPos:o,nextSashPos:i}=this._getSashPositions(),s=t-o,n=i-t,l=`${s}%`,d=`${n}%`;this._headerCellsToResize[0].style.width=l,this._headerCellsToResize[1]&&(this._headerCellsToResize[1].style.width=d),e&&(this._cellsToResize[0].style.width=l,this._cellsToResize[1]&&(this._cellsToResize[1].style.width=d))}render(){let e=this._sashPositions.map((o,i)=>{let s=g({sash:!0,hover:this._sashHovers[i],resizable:this.resizable}),n=`${o}%`;return this.resizable?c`
            <div
              class=${s}
              data-index=${i}
              .style=${B({left:n})}
              @mousedown=${this._onSashMouseDown}
              @mouseover=${this._onSashMouseOver}
              @mouseout=${this._onSashMouseOut}
            >
              <div class="sash-visible"></div>
              <div class="sash-clickable"></div>
            </div>
          `:c`<div
            class=${s}
            data-index=${i}
            .style=${B({left:n})}
          >
            <div class="sash-visible"></div>
          </div>`}),t=g({wrapper:!0,"select-disabled":this._isDragging,"resize-cursor":this._isDragging,"compact-view":this.compact});return c`
      <div class=${t}>
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
        ${e}
        <slot @slotchange=${this._onDefaultSlotChange}></slot>
      </div>
    `}};I.styles=_s;R([a({reflect:!0})],I.prototype,"role",void 0);R([a({type:Boolean,reflect:!0})],I.prototype,"resizable",void 0);R([a({type:Boolean,reflect:!0})],I.prototype,"responsive",void 0);R([a({type:Boolean,reflect:!0})],I.prototype,"bordered",void 0);R([a({type:Boolean,reflect:!0,attribute:"bordered-columns"})],I.prototype,"borderedColumns",void 0);R([a({type:Boolean,reflect:!0,attribute:"bordered-rows"})],I.prototype,"borderedRows",void 0);R([a({type:Number})],I.prototype,"breakpoint",void 0);R([a({type:Array})],I.prototype,"columns",null);R([a({attribute:"min-column-width"})],I.prototype,"minColumnWidth",void 0);R([a({type:Boolean,reflect:!0,attribute:"delayed-resizing"})],I.prototype,"delayedResizing",void 0);R([a({type:Boolean,reflect:!0})],I.prototype,"compact",void 0);R([a({type:Boolean,reflect:!0})],I.prototype,"zebra",void 0);R([a({type:Boolean,reflect:!0,attribute:"zebra-odd"})],I.prototype,"zebraOdd",void 0);R([S('slot[name="body"]')],I.prototype,"_bodySlot",void 0);R([S(".header")],I.prototype,"_headerElement",void 0);R([S(".scrollable")],I.prototype,"_scrollableElement",void 0);R([_o(".sash-visible")],I.prototype,"_sashVisibleElements",void 0);R([H({flatten:!0,selector:"vscode-table-header, vscode-table-body"})],I.prototype,"_assignedElements",void 0);R([H({slot:"header",flatten:!0,selector:"vscode-table-header"})],I.prototype,"_assignedHeaderElements",void 0);R([H({slot:"body",flatten:!0,selector:"vscode-table-body"})],I.prototype,"_assignedBodyElements",void 0);R([_()],I.prototype,"_sashPositions",void 0);R([_()],I.prototype,"_isDragging",void 0);I=R([p("vscode-table")],I);var qi=[f,h`
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
  `],ys=qi;var et=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},ne=class extends u{constructor(){super(),this.panel=!1,this.role="tablist",this.selectedIndex=0,this._tabHeaders=[],this._tabPanels=[],this._componentId="",this._tabFocus=0,this._componentId=$t()}attributeChangedCallback(e,t,o){super.attributeChangedCallback(e,t,o),e==="selected-index"&&this._setActiveTab(),e==="panel"&&(this._tabHeaders.forEach(i=>i.panel=o!==null),this._tabPanels.forEach(i=>i.panel=o!==null))}_dispatchSelectEvent(){this.dispatchEvent(new CustomEvent("vsc-select",{detail:{selectedIndex:this.selectedIndex},composed:!0})),this.dispatchEvent(new CustomEvent("vsc-tabs-select",{detail:{selectedIndex:this.selectedIndex},composed:!0}))}_setActiveTab(){this._tabFocus=this.selectedIndex,this._tabPanels.forEach((e,t)=>{e.hidden=t!==this.selectedIndex}),this._tabHeaders.forEach((e,t)=>{e.active=t===this.selectedIndex})}_focusPrevTab(){this._tabFocus===0?this._tabFocus=this._tabHeaders.length-1:this._tabFocus-=1}_focusNextTab(){this._tabFocus===this._tabHeaders.length-1?this._tabFocus=0:this._tabFocus+=1}_onHeaderKeyDown(e){(e.key==="ArrowLeft"||e.key==="ArrowRight")&&(e.preventDefault(),this._tabHeaders[this._tabFocus].setAttribute("tabindex","-1"),e.key==="ArrowLeft"?this._focusPrevTab():e.key==="ArrowRight"&&this._focusNextTab(),this._tabHeaders[this._tabFocus].setAttribute("tabindex","0"),this._tabHeaders[this._tabFocus].focus()),e.key==="Enter"&&(e.preventDefault(),this.selectedIndex=this._tabFocus,this._dispatchSelectEvent())}_moveHeadersToHeaderSlot(){let e=this._mainSlotElements.filter(t=>t instanceof K);e.length>0&&e.forEach(t=>t.setAttribute("slot","header"))}_onMainSlotChange(){this._moveHeadersToHeaderSlot(),this._tabPanels=this._mainSlotElements.filter(e=>e instanceof te),this._tabPanels.forEach((e,t)=>{e.ariaLabelledby=`t${this._componentId}-h${t}`,e.id=`t${this._componentId}-p${t}`,e.panel=this.panel}),this._setActiveTab()}_onHeaderSlotChange(){this._tabHeaders=this._headerSlotElements.filter(e=>e instanceof K),this._tabHeaders.forEach((e,t)=>{e.tabId=t,e.id=`t${this._componentId}-h${t}`,e.ariaControls=`t${this._componentId}-p${t}`,e.panel=this.panel,e.active=t===this.selectedIndex})}_onHeaderClick(e){let o=e.composedPath().find(i=>i instanceof K);o&&(this.selectedIndex=o.tabId,this._setActiveTab(),this._dispatchSelectEvent())}render(){return c`
      <div
        class=${g({header:!0,panel:this.panel})}
        @click=${this._onHeaderClick}
        @keydown=${this._onHeaderKeyDown}
      >
        <slot name="header" @slotchange=${this._onHeaderSlotChange}></slot>
        <slot name="addons"></slot>
      </div>
      <slot @slotchange=${this._onMainSlotChange}></slot>
    `}};ne.styles=ys;et([a({type:Boolean,reflect:!0})],ne.prototype,"panel",void 0);et([a({reflect:!0})],ne.prototype,"role",void 0);et([a({type:Number,reflect:!0,attribute:"selected-index"})],ne.prototype,"selectedIndex",void 0);et([H({slot:"header"})],ne.prototype,"_headerSlotElements",void 0);et([H()],ne.prototype,"_mainSlotElements",void 0);ne=et([p("vscode-tabs")],ne);var Ni=[f,h`
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
  `],xs=Ni;var Fe=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},se=class extends u{constructor(){super(...arguments),this.icon="",this.label=void 0,this.toggleable=!1,this.checked=!1,this._isSlotEmpty=!0}_handleSlotChange(){this._isSlotEmpty=!((this._assignedNodes?.length??0)>0)}_handleButtonClick(){this.toggleable&&(this.checked=!this.checked,this.dispatchEvent(new Event("change")))}render(){let e=this.checked?"true":"false";return c`
      <button
        type="button"
        aria-label=${k(this.label)}
        role=${k(this.toggleable?"switch":void 0)}
        aria-checked=${k(this.toggleable?e:void 0)}
        class=${g({checked:this.toggleable&&this.checked})}
        @click=${this._handleButtonClick}
      >
        ${this.icon?c`<vscode-icon name=${this.icon}></vscode-icon>`:m}
        <slot
          @slotchange=${this._handleSlotChange}
          class=${g({empty:this._isSlotEmpty,textOnly:!this.icon})}
        ></slot>
      </button>
    `}};se.styles=xs;Fe([a({reflect:!0})],se.prototype,"icon",void 0);Fe([a()],se.prototype,"label",void 0);Fe([a({type:Boolean,reflect:!0})],se.prototype,"toggleable",void 0);Fe([a({type:Boolean,reflect:!0})],se.prototype,"checked",void 0);Fe([_()],se.prototype,"_isSlotEmpty",void 0);Fe([go()],se.prototype,"_assignedNodes",void 0);se=Fe([p("vscode-toolbar-button")],se);var Ui=[f,h`
    :host {
      gap: 4px;
      display: flex;
      align-items: center;
    }
  `],ws=Ui;var Wi=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},tt=class extends u{render(){return c` <slot></slot> `}};tt.styles=ws;tt=Wi([p("vscode-toolbar-container")],tt);var Ki=[f,h`
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
  `],Cs=Ki;var le=function(r,e,t,o){var i=arguments.length,s=i<3?e:o===null?o=Object.getOwnPropertyDescriptor(e,t):o,n;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(r,e,t,o);else for(var l=r.length-1;l>=0;l--)(n=r[l])&&(s=(i<3?n(s):i>3?n(e,t,s):n(e,t))||s);return i>3&&s&&Object.defineProperty(e,t,s),s},Gi=30,Yi=16,ks=3,Es=(r,e=[])=>{let t=[];return r.forEach((o,i)=>{let s=[...e,i],n={...o,path:s};o.subItems&&(n.subItems=Es(o.subItems,s)),t.push(n)}),t},ht=r=>!!(r.subItems&&Array.isArray(r.subItems)&&r?.subItems?.length>0),q=class extends u{constructor(){super(...arguments),this.indent=8,this.arrows=!1,this.multiline=!1,this.tabindex=0,this.indentGuides=!1,this._data=[],this._selectedItem=null,this._focusedItem=null,this._selectedBranch=null,this._focusedBranch=null,this._handleComponentKeyDownBound=this._handleComponentKeyDown.bind(this)}set data(e){let t=this._data;this._data=Es(e),this.requestUpdate("data",t)}get data(){return this._data}closeAll(){this._closeSubTreeRecursively(this.data),this.requestUpdate()}deselectAll(){this._deselectItemsRecursively(this.data),this.requestUpdate()}getItemByPath(e){return this._getItemByPath(e)}connectedCallback(){super.connectedCallback(),this.addEventListener("keydown",this._handleComponentKeyDownBound)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("keydown",this._handleComponentKeyDownBound)}_getItemByPath(e){let t=this._data,o=null;return e.forEach((i,s)=>{s===e.length-1?o=t[i]:t=t[i].subItems}),o}_handleActionClick(e){e.stopPropagation();let t=e.target,o=t.dataset.itemPath,i=t.dataset.index,s=null,n="",l="";if(o){let d=o.split("/").map(b=>Number(b));if(s=this._getItemByPath(d),s?.actions){let b=Number(i);s.actions[b]&&(n=s.actions[b].actionId)}s?.value&&(l=s.value)}this.dispatchEvent(new CustomEvent("vsc-run-action",{detail:{actionId:n,item:s,value:l}})),this.dispatchEvent(new CustomEvent("vsc-tree-action",{detail:{actionId:n,item:s,value:l}}))}_renderIconVariant(e){let{type:t,value:o}=e;return t==="themeicon"?c`<vscode-icon name=${o} class="theme-icon"></vscode-icon>`:c`<span
        class="image-icon"
        .style=${B({backgroundImage:`url(${o})`})}
      ></span>`}_renderIcon(e){let t={branch:{value:"folder",type:"themeicon"},open:{value:"folder-opened",type:"themeicon"},leaf:{value:"file",type:"themeicon"}};if(e.iconUrls)e.iconUrls.branch&&(t.branch={value:e.iconUrls.branch,type:"image"}),e.iconUrls.leaf&&(t.leaf={value:e.iconUrls.leaf,type:"image"}),e.iconUrls.open&&(t.open={value:e.iconUrls.open,type:"image"});else if(typeof e.icons=="object")e.icons.branch&&(t.branch={value:e.icons.branch,type:"themeicon"}),e.icons.leaf&&(t.leaf={value:e.icons.leaf,type:"themeicon"}),e.icons.open&&(t.open={value:e.icons.open,type:"themeicon"});else if(!e.icons)return c`${m}`;return ht(e)?e.open?this._renderIconVariant(t.open):this._renderIconVariant(t.branch):this._renderIconVariant(t.leaf)}_renderArrow(e){if(!this.arrows||!ht(e))return c`${m}`;let{open:t=!1}=e;return c`
      <div class="arrow-container">
        <vscode-icon name=${t?"chevron-down":"chevron-right"} class="icon-arrow"></vscode-icon>
      </div>
    `}_renderActions(e){let t=[];return e.actions&&Array.isArray(e.actions)&&e.actions.forEach((o,i)=>{if(o.icon){let s=c`<vscode-icon
            name=${o.icon}
            action-icon
            title=${k(o.tooltip)}
            data-item-path=${k(e.path?.join("/"))}
            data-index=${i}
            class="action-icon"
            @click=${this._handleActionClick}
          ></vscode-icon>`;t.push(s)}}),t.length>0?c`<div class="actions">${t}</div>`:c`${m}`}_renderDecorations(e){let t=[];return e.decorations&&Array.isArray(e.decorations)&&e.decorations.forEach(o=>{let{appearance:i="text",visibleWhen:s="always",content:n="",color:l="",focusedColor:d="",hoverColor:b="",selectedColor:y=""}=o,v=`visible-when-${s}`,x={};switch(l&&(x["--color"]=l),d&&(x["--focused-color"]=d),b&&(x["--hover-color"]=b),y&&(x["--selected-color"]=y),i){case"counter-badge":t.push(c`<vscode-badge
                variant="counter"
                class=${["counter-badge",v].join(" ")}
                part="counter-badge-decoration"
                >${n}</vscode-badge
              >`);break;case"filled-circle":t.push(c`<vscode-icon
                name="circle-filled"
                size="14"
                class=${["filled-circle",v].join(" ")}
                part="filled-circle-decoration"
                .style=${B(x)}
              ></vscode-icon>`);break;case"text":t.push(c`<div
                class=${["decoration-text",v].join(" ")}
                part="caption-decoration"
                .style=${B(x)}
              >
                ${n}
              </div>`);break;default:}}),t.length>0?c`<div class="decorations" part="decorations">
        ${t}
      </div>`:c`${m}`}_renderTreeItem(e,t){let{open:o=!1,label:i,description:s="",tooltip:n,selected:l=!1,focused:d=!1,subItems:b=[]}=e,{path:y,itemType:v,hasFocusedItem:x=!1,hasSelectedItem:w=!1}=t,z=y.length-1,J=["contents"],He=o?["open"]:[],Ce=z*this.indent,$s=this.arrows&&v==="leaf"?Gi+Ce:Ce,Ss=this._renderArrow(e),Is=this._renderIcon(e),Os=this.arrows?Ce+Yi:Ce+ks,As=o&&v==="branch"?c`<ul
            .style=${B({"--indent-guide-pos":`${Os}px`})}
            class=${g({"has-active-item":x||w})}
          >
            ${this._renderTree(b,y)}
          </ul>`:m,Ps=s?c`<span class="description" part="description">${s}</span>`:m,Rs=this._renderActions(e),Vs=this._renderDecorations(e);return He.push(v),l&&J.push("selected"),d&&J.push("focused"),c`
      <li data-path=${y.join("/")} class=${He.join(" ")}>
        <div
          class=${J.join(" ")}
          .style=${B({paddingLeft:`${$s+ks}px`})}
        >
          ${Ss}${Is}<span
            class="text-content"
            part="text-content"
            title=${k(n)}
            >${i}${Ps}</span
          >
          ${Rs} ${Vs}
        </div>
        ${As}
      </li>
    `}_renderTree(e,t=[]){let o=[];return e?(e.forEach((i,s)=>{let n=[...t,s],l=ht(i)?"branch":"leaf",{selected:d=!1,focused:b=!1,hasFocusedItem:y=!1,hasSelectedItem:v=!1}=i;d&&(this._selectedItem=i),b&&(this._focusedItem=i),o.push(this._renderTreeItem(i,{path:n,itemType:l,hasFocusedItem:y,hasSelectedItem:v}))}),o):m}_selectItem(e){this._selectedItem&&(this._selectedItem.selected=!1),this._focusedItem&&(this._focusedItem.focused=!1),this._selectedItem=e,e.selected=!0,this._focusedItem=e,e.focused=!0,this._selectedBranch&&(this._selectedBranch.hasSelectedItem=!1);let t=null;if(e.path?.length&&e.path.length>1&&(t=this._getItemByPath(e.path.slice(0,-1))),ht(e))this._selectedBranch=e,e.hasSelectedItem=!0,e.open=!e.open,e.open?(this._selectedBranch=e,e.hasSelectedItem=!0):t&&(this._selectedBranch=t,t.hasSelectedItem=!0);else if(e.path?.length&&e.path.length>1){let o=this._getItemByPath(e.path.slice(0,-1));o&&(this._selectedBranch=o,o.hasSelectedItem=!0)}else this._selectedBranch=e,e.hasSelectedItem=!0;this._emitSelectEvent(this._selectedItem,this._selectedItem.path.join("/")),this.requestUpdate()}_focusItem(e){this._focusedItem&&(this._focusedItem.focused=!1),this._focusedItem=e,e.focused=!0;let t=!!e?.subItems?.length;this._focusedBranch&&(this._focusedBranch.hasFocusedItem=!1);let o=null;e.path?.length&&e.path.length>1&&(o=this._getItemByPath(e.path.slice(0,-1))),t?e.open?(this._focusedBranch=e,e.hasFocusedItem=!0):!e.open&&o&&(this._focusedBranch=o,o.hasFocusedItem=!0):o&&(this._focusedBranch=o,o.hasFocusedItem=!0)}_closeSubTreeRecursively(e){e.forEach(t=>{t.open=!1,t.subItems&&t.subItems.length>0&&this._closeSubTreeRecursively(t.subItems)})}_deselectItemsRecursively(e){e.forEach(t=>{t.selected&&(t.selected=!1),t.subItems&&t.subItems.length>0&&this._deselectItemsRecursively(t.subItems)})}_emitSelectEvent(e,t){let{icons:o,label:i,open:s,value:n}=e,l={icons:o,itemType:ht(e)?"branch":"leaf",label:i,open:s||!1,value:n||i,path:t};this.dispatchEvent(new CustomEvent("vsc-select",{bubbles:!0,composed:!0,detail:l})),this.dispatchEvent(new CustomEvent("vsc-tree-select",{detail:l}))}_focusPrevItem(){if(!this._focusedItem){this._focusItem(this._data[0]);return}let{path:e}=this._focusedItem;if(e&&e?.length>0){let t=e[e.length-1],o=e.length>1;if(t>0){let i=[...e];i[i.length-1]=t-1;let s=this._getItemByPath(i),n=s;if(s?.open&&s.subItems?.length){let{subItems:l}=s;n=l[l.length-1]}this._focusItem(n)}else if(o){let i=[...e];i.pop(),this._focusItem(this._getItemByPath(i))}}else this._focusItem(this._data[0])}_focusNextItem(){if(!this._focusedItem){this._focusItem(this._data[0]);return}let{path:e,open:t}=this._focusedItem;if(t&&Array.isArray(this._focusedItem.subItems)&&this._focusedItem.subItems.length>0){this._focusItem(this._focusedItem.subItems[0]);return}let o=[...e];o[o.length-1]+=1;let i=this._getItemByPath(o);i?this._focusItem(i):(o.pop(),o.length>0&&(o[o.length-1]+=1,i=this._getItemByPath(o),i&&this._focusItem(i)))}_handleClick(e){let o=e.composedPath().find(i=>i.tagName&&i.tagName.toUpperCase()==="LI");if(o){let s=(o.dataset.path||"").split("/").map(l=>Number(l)),n=this._getItemByPath(s);this._selectItem(n)}else this._focusedItem&&(this._focusedItem.focused=!1),this._focusedItem=null}_handleComponentKeyDown(e){let t=[" ","ArrowDown","ArrowUp","Enter","Escape"],o=e.key;t.includes(e.key)&&(e.stopPropagation(),e.preventDefault()),o==="Escape"&&(this._focusedItem=null),o==="ArrowUp"&&this._focusPrevItem(),o==="ArrowDown"&&this._focusNextItem(),(o==="Enter"||o===" ")&&this._focusedItem&&this._selectItem(this._focusedItem)}render(){let e=g({multi:this.multiline,single:!this.multiline,wrapper:!0,"has-not-focused-item":!this._focusedItem,"selection-none":!this._selectedItem,"selection-single":this._selectedItem!==null});return c`
      <div @click=${this._handleClick} class=${e}>
        <ul>
          ${this._renderTree(this._data)}
        </ul>
      </div>
    `}};q.styles=Cs;le([a({type:Array,reflect:!1})],q.prototype,"data",null);le([a({type:Number})],q.prototype,"indent",void 0);le([a({type:Boolean,reflect:!0})],q.prototype,"arrows",void 0);le([a({type:Boolean,reflect:!0})],q.prototype,"multiline",void 0);le([a({type:Number,reflect:!0})],q.prototype,"tabindex",void 0);le([a({type:Boolean,reflect:!0,attribute:"indent-guides"})],q.prototype,"indentGuides",void 0);le([_()],q.prototype,"_selectedItem",void 0);le([_()],q.prototype,"_focusedItem",void 0);le([_()],q.prototype,"_selectedBranch",void 0);le([_()],q.prototype,"_focusedBranch",void 0);q=le([p("vscode-tree")],q);var Xi={_default:eo};return Ls(Zi);})();


	npmCompilation['1608514c9acd4a97df63533df1b9d0fd'] = {};
npmCompilation['1608514c9acd4a97df63533df1b9d0fd']['VscodeElement'] = _.default['_default'];

})(npmCompilation);
if(!Object.hasOwn(window, "AvInstance")) {
	Object.defineProperty(window, "AvInstance", {
		get() {return Aventus?.Instance;}
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
}
var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `Aventus`;
const _ = {};


let _n;
let uuidv4=function uuidv4() {
    let uid = '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (Number(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(c) / 4).toString(16));
    return uid;
}
__as1(_, 'uuidv4', uuidv4);

let DateConverter=class DateConverter {
    static __converter = new DateConverter();
    static get converter() {
        return this.__converter;
    }
    static set converter(value) {
        this.__converter = value;
    }
    isStringDate(txt) {
        return /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3,6})Z$/.exec(txt) !== null;
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
__as1(_, 'DateConverter', DateConverter);

let DragElementXYType= [SVGGElement, SVGRectElement, SVGEllipseElement, SVGTextElement];
__as1(_, 'DragElementXYType', DragElementXYType);

let DragElementLeftTopType= [HTMLElement, SVGSVGElement];
__as1(_, 'DragElementLeftTopType', DragElementLeftTopType);

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
__as1(_, 'ActionGuard', ActionGuard);

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
            if (el instanceof Element) {
                return tagname.indexOf((el.nodeName || el.tagName).toLowerCase()) != -1;
            }
            return tagname.indexOf(el.nodeName.toLowerCase()) != -1;
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
                if (el instanceof Element && el['classList'].contains(classnameTemp)) {
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
            if (el instanceof Element) {
                return tagname.indexOf((el.nodeName || el.tagName).toLowerCase()) != -1;
            }
            return tagname.indexOf(el.nodeName.toLowerCase()) != -1;
        };
        return this.findParents(element, check, untilNode);
    }
    /**
     * Check if element contains a child
     */
    static containsChild(element, child) {
        let rootScope = element.getRootNode();
        let elScope = child.getRootNode();
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
        const _realTarget = (el, i = 0) => {
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
__as1(_, 'ElementExtension', ElementExtension);

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
__as1(_, 'Style', Style);

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
__as1(_, 'setValueToObject', setValueToObject);

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
__as1(_, 'Mutex', Mutex);

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
__as1(_, 'NormalizedEvent', NormalizedEvent);

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
__as1(_, 'Callback', Callback);

let compareObject=function compareObject(obj1, obj2, tableOrder = true) {
    if (Array.isArray(obj1)) {
        if (!Array.isArray(obj2)) {
            return false;
        }
        obj2 = obj2.slice();
        if (obj1.length !== obj2.length) {
            return false;
        }
        if (tableOrder) {
            for (let i = 0; i < obj1.length; i++) {
                if (!compareObject(obj1[i], obj2[i])) {
                    return false;
                }
            }
            return true;
        }
        else {
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
__as1(_, 'compareObject', compareObject);

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
__as1(_, 'getValueFromObject', getValueFromObject);

var WatchAction;
(function (WatchAction) {
    WatchAction[WatchAction["CREATED"] = 0] = "CREATED";
    WatchAction[WatchAction["UPDATED"] = 1] = "UPDATED";
    WatchAction[WatchAction["DELETED"] = 2] = "DELETED";
})(WatchAction || (WatchAction = {}));
__as1(_, 'WatchAction', WatchAction);

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
                if (changePath == path || changePath.startsWith(path + ".") || changePath.startsWith(path + "[")) {
                    // if(changePath == path) {
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
__as1(_, 'Effect', Effect);

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
__as1(_, 'Signal', Signal);

let Watcher=class Watcher {
    static isNative(obj) {
        if (obj instanceof Blob ||
            obj instanceof Element ||
            obj instanceof Window)
            return true;
        return false;
    }
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
                        let result = this.isNative(target) ? Reflect.set(target, prop, unbindElement) : Reflect.set(target, prop, unbindElement, receiver);
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
                            trigger(type, target, newReceiver, value, newProp ?? '', dones);
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
                            Watcher.clearReservedNames(target);
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
                    return Watcher.isNative(target) ? Reflect.get(target, prop) : Reflect.get(target, prop, receiver);
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
                                    const dones2 = [];
                                    if (out.otherRoot) {
                                        dones.push(out.otherRoot);
                                        dones2.push(out.otherRoot);
                                    }
                                    trigger('CREATED', target, receiver, receiver[index], "[" + (index) + "]", dones);
                                    trigger('UPDATED', target, receiver, target.length, "length", dones2);
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
                        // else if(prop == 'find') {
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
                                    let dones2 = [];
                                    key = Watcher.extract(key);
                                    value = replaceByAlias(target, value, key + '', receiver, false, out);
                                    if (out.otherRoot) {
                                        dones.push(out.otherRoot);
                                        dones2.push(out.otherRoot);
                                    }
                                    let result = target.set(key, value);
                                    trigger('CREATED', target, receiver, receiver.get(key), key + '', dones);
                                    trigger('UPDATED', target, receiver, target.size, "size", dones2);
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
                return Watcher.isNative(target) ? Reflect.get(target, prop) : Reflect.get(target, prop, receiver);
            },
            set(target, prop, value, receiver) {
                if (typeof prop == 'symbol') {
                    if (Watcher.isNative(target))
                        return Reflect.set(target, prop, value);
                    return Reflect.set(target, prop, value, receiver);
                }
                let oldValue = Watcher.isNative(target) ? Reflect.get(target, prop) : Reflect.get(target, prop, receiver);
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
                let result = Watcher.isNative(target) ? Reflect.set(target, prop, value) : Reflect.set(target, prop, value, receiver);
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
                        Watcher.clearReservedNames(oldValue);
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
            const callbacks = { ...proxyData.callbacks };
            for (let name in callbacks) {
                callbacks[name] = [...callbacks[name]];
            }
            for (let name in callbacks) {
                // for(let name in proxyData.callbacks) {
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
                let cbs = callbacks[name];
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
    static clearReservedNames(data) {
        if (data instanceof Object && !data.__isProxy) {
            for (let key in this.__reservedName) {
                delete data[key];
            }
            for (let key in data) {
                this.clearReservedNames(data[key]);
            }
        }
        else if (Array.isArray(data)) {
            for (let item of data) {
                this.clearReservedNames(item);
            }
        }
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
__as1(_, 'Watcher', Watcher);

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
__as1(_, 'Computed', Computed);

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
__as1(_, 'ComputedNoRecomputed', ComputedNoRecomputed);

let PressManager=class PressManager {
    static globalConfig = {
        delayDblPress: 250,
        delayLongPress: 700,
        offsetDrag: 20
    };
    static configure(options) {
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
    downActionDelay(_ev) {
        const ev = _ev;
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
    downAction(_ev) {
        const ev = _ev;
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
    upAction(_ev) {
        const ev = _ev;
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
    moveAction(_ev) {
        const ev = _ev;
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
    childPressStart(_e) {
        const e = _e;
        if (this.lastEmitEvent == e.detail.realEvent)
            return;
        this.genericDownAction(e.detail.state, e.detail.realEvent);
        if (this.options.onPressStart) {
            this.options.onPressStart(e.detail.realEvent, this);
        }
    }
    childPressEnd(_e) {
        const e = _e;
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
    childPressMove(_e) {
        const e = _e;
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
            this.element.removeEventListener("touchstart", this.functionsBinded.downActionDelay);
            this.element.removeEventListener("trigger_pointer_pressstart", this.functionsBinded.childPressStart);
            this.element.removeEventListener("trigger_pointer_pressend", this.functionsBinded.childPressEnd);
            this.element.removeEventListener("trigger_pointer_pressmove", this.functionsBinded.childPressMove);
            document.removeEventListener("pointerup", this.functionsBinded.upAction);
            document.removeEventListener("pointercancel", this.functionsBinded.upAction);
            document.removeEventListener("touchend", this.functionsBinded.upAction);
            document.removeEventListener("touchcancel", this.functionsBinded.upAction);
            document.removeEventListener("pointermove", this.functionsBinded.moveAction);
        }
    }
}
PressManager.Namespace=`Aventus`;
__as1(_, 'PressManager', PressManager);

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
__as1(_, 'Uri', Uri);

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
__as1(_, 'State', State);

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
__as1(_, 'EmptyState', EmptyState);

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
__as1(_, 'StateManager', StateManager);

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
__as1(_, 'TemplateContext', TemplateContext);

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
                if (!cb && el.tagName.includes('-')) {
                    customElements.upgrade(el);
                    cb = getValueFromObject(event.eventName, el);
                }
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
                    const ev = event;
                    if (ev[temp] instanceof Function) {
                        clone[temp] = (e, pressInstance) => { ev[temp](e, pressInstance, this.context); };
                    }
                    else {
                        clone[temp] = ev[temp];
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
                customElements.upgrade(el);
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
                customElements.upgrade(el);
                el[binding.injectionName] = computed.value;
            }
        });
        if (binding.isCallback) {
            this.firstRenderCb.push(() => {
                for (var el of this._components[binding.id]) {
                    for (let fct of binding.eventNames) {
                        let cb = getValueFromObject(fct, el);
                        if (!cb && el.tagName.includes('-')) {
                            customElements.upgrade(el);
                            cb = getValueFromObject(binding.injectionName, el);
                        }
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
                    customElements.upgrade(el);
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
                if (this.isDestroyed)
                    return;
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
__as1(_, 'TemplateInstance', TemplateInstance);

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
__as1(_, 'Template', Template);

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
__as1(_, 'Instance', Instance);

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
            this.postDisconnect();
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
        const t = this;
        if (boolProps.indexOf(prop) != -1) {
            if (this.hasAttribute(prop) && (this.getAttribute(prop) === "true" || this.getAttribute(prop) === "")) {
                let value = this.getAttribute(prop);
                delete t[prop];
                t[prop] = value;
            }
            else {
                this.removeAttribute(prop);
                delete t[prop];
                t[prop] = false;
            }
        }
        else {
            if (this.hasAttribute(prop)) {
                let value = this.getAttribute(prop);
                delete t[prop];
                t[prop] = value;
            }
            else if (Object.hasOwn(this, prop)) {
                const value = t[prop];
                delete t[prop];
                t[prop] = value;
            }
        }
    }
    __correctGetter(prop) {
        if (Object.hasOwn(this, prop)) {
            const t = this;
            const value = t[prop];
            delete t[prop];
            t[prop] = value;
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
                        fct(WatchAction.UPDATED, name, that[name], []);
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
    postDisconnect() { }
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
__as1(_, 'WebComponent', WebComponent);

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
__as1(_, 'WebComponentInstance', WebComponentInstance);

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
                    const target = entry.target;
                    let index = target['sourceIndex'];
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
        const _target = target;
        if (!_target["sourceIndex"]) {
            _target["sourceIndex"] = Math.random().toString(36);
            this.targets.push(_target);
            ResizeObserver.getUniqueInstance().observe(_target);
        }
        if (!ResizeObserver.resizeObserverClassByObject[_target["sourceIndex"]]) {
            ResizeObserver.resizeObserverClassByObject[_target["sourceIndex"]] = [];
        }
        if (ResizeObserver.resizeObserverClassByObject[_target["sourceIndex"]].indexOf(this) == -1) {
            ResizeObserver.resizeObserverClassByObject[_target["sourceIndex"]].push(this);
        }
    }
    /**
     * Stop observing size changing for the element
     */
    unobserve(target) {
        const _target = target;
        for (let i = 0; this.targets.length; i++) {
            let tempTarget = this.targets[i];
            if (tempTarget == _target) {
                let position = ResizeObserver.resizeObserverClassByObject[_target['sourceIndex']].indexOf(this);
                if (position != -1) {
                    ResizeObserver.resizeObserverClassByObject[_target['sourceIndex']].splice(position, 1);
                }
                if (ResizeObserver.resizeObserverClassByObject[_target['sourceIndex']].length == 0) {
                    delete ResizeObserver.resizeObserverClassByObject[_target['sourceIndex']];
                }
                ResizeObserver.getUniqueInstance().unobserve(_target);
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
        const _target = entry.target;
        let index = _target.sourceIndex;
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
            this.callback(changed, ResizeObserver.uniqueInstance);
        }, 0);
    }
}
ResizeObserver.Namespace=`Aventus`;
__as1(_, 'ResizeObserver', ResizeObserver);

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
__as1(_, 'Animation', Animation);

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
            const opts = this.options;
            opts[name] = options[name];
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
        const result = this.options.onStart(e);
        if (result !== false) {
            document.body.style.userSelect = 'none';
            if (window.getSelection) {
                window.getSelection()?.removeAllRanges();
            }
        }
        return result;
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
        document.body.style.userSelect = '';
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
__as1(_, 'DragAndDrop', DragAndDrop);

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
                                if ("$type" in value && value['$type'] == "Aventus.Map") {
                                    value = value.values;
                                }
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
                if (options.isValidKey(prop)) {
                    const _target = target;
                    const _src = src;
                    _target[options.replaceKey(prop)] = options.transformValue(prop, _src[prop]);
                }
            }
        }
        let cstTemp = target.constructor;
        while (cstTemp.prototype && cstTemp != Object.prototype) {
            props = Object.getOwnPropertyNames(cstTemp.prototype);
            for (let prop of props) {
                let propInfo = Object.getOwnPropertyDescriptor(cstTemp.prototype, prop);
                if (propInfo?.set && propInfo.get) {
                    if (options.isValidKey(prop)) {
                        const _target = target;
                        const _src = src;
                        _target[options.replaceKey(prop)] = options.transformValue(prop, _src[prop]);
                    }
                }
            }
            cstTemp = Object.getPrototypeOf(cstTemp);
        }
    }
}
ConverterTransform.Namespace=`Aventus`;
__as1(_, 'ConverterTransform', ConverterTransform);

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
                        const o = obj;
                        result[options.replaceKey(key)] = options.transformValue(key, o[key]);
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
                    const o = obj;
                    o[prop] = options.transformValue(prop, value);
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
                        const o = obj;
                        o[prop] = options.transformValue(prop, value);
                    }
                }
            }
            cstTemp = Object.getPrototypeOf(cstTemp);
        }
        return obj;
    }
}
Json.Namespace=`Aventus`;
__as1(_, 'Json', Json);

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
__as1(_, 'Converter', Converter);

let Data=// @Dependencies([{ type: Aventus.Converter, strong: true }, { type: Converter, strong: true }])
class Data {
    static converter = new Converter();
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
Data.$schema={"namespace":"string","$type":"string","className":"string"};
Converter.register(Data.Fullname, Data);
__as1(_, 'Data', Data);

let GenericError=// @Dependencies([{ type: Aventus.Converter, strong: true }, { type: Converter, strong: true }])
class GenericError {
    static converter = new Converter();
    static get Fullname() { return "Aventus.GenericError"; }
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
     * @param {string | Error | unknown} message - The error message.
     */
    constructor(code, message) {
        this.code = code;
        if (message instanceof Error) {
            this.message = message.message;
        }
        else {
            this.message = message + '';
        }
    }
}
GenericError.Namespace=`Aventus`;
GenericError.$schema={"code":"Aventus.EnumValue","message":"string"};
Converter.register(GenericError.Fullname, GenericError);
__as1(_, 'GenericError', GenericError);

let VoidWithError=class VoidWithError {
    static get Fullname() { return "Aventus.VoidWithError"; }
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
    run(fct) {
        if (this.success) {
            let result = fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
        }
        return this;
    }
    async runAsync(fct) {
        if (this.success) {
            let result = await fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
        }
        return this;
    }
    extract(fct) {
        if (this.success) {
            let result = fct();
            if (result.success && result.result) {
                return result.result;
            }
            this.errors = [...this.errors, ...result.errors];
        }
        return undefined;
    }
    async extractAsync(fct) {
        if (this.success) {
            let result = await fct();
            if (result.success && result.result) {
                return result.result;
            }
            this.errors = [...this.errors, ...result.errors];
        }
        return undefined;
    }
}
VoidWithError.Namespace=`Aventus`;
VoidWithError.$schema={"success":"boolean","errors":"T[]"};
Converter.register(VoidWithError.Fullname, VoidWithError);
__as1(_, 'VoidWithError', VoidWithError);

let ResultWithError=class ResultWithError extends VoidWithError {
    static get Fullname() { return "Aventus.ResultWithError"; }
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
    run(fct) {
        if (this.success) {
            let result = fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
            if (result instanceof ResultWithError && result.success && result.result) {
                this.result = result.result;
            }
        }
        return this;
    }
    async runAsync(fct) {
        if (this.success) {
            let result = await fct();
            if (!Array.isArray(result)) {
                result = result.errors;
            }
            if (result.length > 0) {
                this.errors = [...this.errors, ...result];
            }
            if (result instanceof ResultWithError && result.success && result.result) {
                this.result = result.result;
            }
        }
        return this;
    }
}
ResultWithError.Namespace=`Aventus`;
ResultWithError.$schema={...(VoidWithError?.$schema ?? {}), };
Converter.register(ResultWithError.Fullname, ResultWithError);
__as1(_, 'ResultWithError', ResultWithError);


for(let key in _) { Aventus[key] = _[key] }
})(Aventus);

var VscodeView;
(VscodeView||(VscodeView = {}));
(function (VscodeView) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `VscodeView`;
const _ = {};


let _n;
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["unknow"] = 0] = "unknow";
    ErrorCode[ErrorCode["differentChannel"] = 1] = "differentChannel";
    ErrorCode[ErrorCode["timeout"] = 2] = "timeout";
})(ErrorCode || (ErrorCode = {}));
__as1(_, 'ErrorCode', ErrorCode);

let Error=class Error extends Aventus.GenericError {
}
Error.Namespace=`VscodeView`;
Error.$schema={...(Aventus.GenericError?.$schema ?? {}), };
Aventus.Converter.register(Error.Fullname, Error);
__as1(_, 'Error', Error);

let Router=class Router {
    static get isVscode() {
        return 'acquireVsCodeApi' in window;
    }
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
                let _uid = options.uid;
                if (!_uid) {
                    _uid = Aventus.uuidv4();
                }
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
__as1(_, 'Router', Router);


for(let key in _) { VscodeView[key] = _[key] }
})(VscodeView);

var Aventus;
(Aventus||(Aventus = {}));
(function (Aventus) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `Aventus`;
const _ = {};

let Layout = {};
_.Layout = Aventus.Layout ?? {};
let _n;
let Tracker=class Tracker {
    /**
     * Multiplier for velocity calculations based on device pixel ratio.
     */
    velocityMultiplier = window.devicePixelRatio;
    /**
     * Timestamp of the last update.
     */
    updateTime = Date.now();
    /**
     * Change in position since the last update.
     */
    delta = { x: 0, y: 0 };
    /**
     * Current velocity of the tracker.
     */
    velocity = { x: 0, y: 0 };
    /**
     * Last recorded position.
     */
    lastPosition = { x: 0, y: 0 };
    /**
     * Initializes a new Tracker instance.
     */
    constructor(touch) {
        this.lastPosition = this.getPosition(touch);
    }
    /**
     * Updates the tracker's position, delta, and velocity.
     */
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
    /**
     * Extracts pointer data from a given event.
     */
    getPointerData(evt) {
        return evt.touches ? evt.touches[evt.touches.length - 1] : evt;
    }
    /**
     * Retrieves the client coordinates from a pointer event.
     */
    getPosition(evt) {
        const data = this.getPointerData(evt);
        return {
            x: data.clientX,
            y: data.clientY,
        };
    }
}
Tracker.Namespace=`Aventus`;
__as1(_, 'Tracker', Tracker);

let TouchRecord=class TouchRecord {
    /**
     * The identifier of the currently active touch/pointer.
     */
    _activeTouchID;
    /**
     * A map of active touch/pointer IDs to their respective Trackers.
     */
    _touchList = {};
    /**
     * Returns a primitive zero-value coordinate object.
     */
    get _primitiveValue() {
        return { x: 0, y: 0 };
    }
    /**
     * Checks if there is an active touch/pointer event.
     */
    isActive() {
        return this._activeTouchID !== undefined;
    }
    /**
     * Retrieves the delta movement of the active tracker.
     */
    getDelta() {
        const tracker = this._getActiveTracker();
        if (!tracker) {
            return this._primitiveValue;
        }
        return { ...tracker.delta };
    }
    /**
     * Retrieves the velocity of the active tracker.
     */
    getVelocity() {
        const tracker = this._getActiveTracker();
        if (!tracker) {
            return this._primitiveValue;
        }
        return { ...tracker.velocity };
    }
    /**
     * Returns the number of active touch/pointer events.
     */
    getNbOfTouches() {
        return Object.values(this._touchList).length;
    }
    /**
     * Returns an array of active Tracker instances.
     */
    getTouches() {
        return Object.values(this._touchList);
    }
    /**
     * Calculates the easing distance based on current velocity and damping.
     */
    getEasingDistance(damping) {
        const deAcceleration = 1 - damping;
        let distance = {
            x: 0,
            y: 0,
        };
        const vel = this.getVelocity();
        Object.keys(vel).forEach((_dir) => {
            const dir = _dir;
            let v = Math.abs(vel[dir]) <= 10 ? 0 : vel[dir];
            while (v !== 0) {
                distance[dir] += v;
                v = (v * deAcceleration) | 0;
            }
        });
        return distance;
    }
    /**
     * Starts tracking new touch/pointer events.
     */
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
    /**
     * Updates existing tracked touch/pointer events.
     */
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
    /**
     * Releases tracking for ended touch/pointer events.
     */
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
    /**
     * Retrieves a unique identifier for a touch or pointer event.
     */
    _getIdentifier(touch) {
        if ('Touch' in window && touch instanceof Touch)
            return touch.identifier;
        if (touch instanceof PointerEvent)
            return touch.pointerId;
        return touch.button;
    }
    /**
     * Adds a new touch/pointer event to the tracker list.
     */
    _add(touch) {
        if (this._has(touch)) {
            this._delete(touch);
        }
        const tracker = new Tracker(touch);
        const identifier = this._getIdentifier(touch);
        this._touchList[identifier] = tracker;
    }
    /**
     * Renews an existing touch/pointer event in the tracker list.
     */
    _renew(touch) {
        if (!this._has(touch)) {
            return;
        }
        const identifier = this._getIdentifier(touch);
        const tracker = this._touchList[identifier];
        tracker.update(touch);
    }
    /**
     * Deletes a touch/pointer event from the tracker list.
     */
    _delete(touch) {
        const identifier = this._getIdentifier(touch);
        delete this._touchList[identifier];
        if (this._activeTouchID == identifier) {
            this._activeTouchID = undefined;
        }
    }
    /**
     * Checks if a touch/pointer event is being tracked.
     */
    _has(touch) {
        const identifier = this._getIdentifier(touch);
        return this._touchList.hasOwnProperty(identifier);
    }
    /**
     * Sets the identifier of the currently active touch/pointer event.
     */
    _setActiveID(touches) {
        if (touches instanceof PointerEvent || touches instanceof MouseEvent) {
            this._activeTouchID = this._getIdentifier(touches);
        }
        else {
            this._activeTouchID = touches[touches.length - 1].identifier;
        }
    }
    /**
     * Retrieves the currently active Tracker instance.
     */
    _getActiveTracker() {
        const { _touchList, _activeTouchID, } = this;
        if (_activeTouchID !== undefined) {
            return _touchList[_activeTouchID];
        }
        return undefined;
    }
}
TouchRecord.Namespace=`Aventus`;
__as1(_, 'TouchRecord', TouchRecord);

Layout.Scrollable = class Scrollable extends Aventus.WebComponent {
    static get observedAttributes() {return ["zoom"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'min_zoom'() { return this.getNumberAttr('min_zoom') }
    set 'min_zoom'(val) { this.setNumberAttr('min_zoom', val) }
get 'max_zoom'() { return this.getNumberAttr('max_zoom') }
    set 'max_zoom'(val) { this.setNumberAttr('max_zoom', val) }
get 'y_scroll_visible'() { return this.getBoolAttr('y_scroll_visible') }
    set 'y_scroll_visible'(val) { this.setBoolAttr('y_scroll_visible', val) }
get 'x_scroll_visible'() { return this.getBoolAttr('x_scroll_visible') }
    set 'x_scroll_visible'(val) { this.setBoolAttr('x_scroll_visible', val) }
get 'floating_scroll'() { return this.getBoolAttr('floating_scroll') }
    set 'floating_scroll'(val) { this.setBoolAttr('floating_scroll', val) }
get 'x_scroll'() { return this.getBoolAttr('x_scroll') }
    set 'x_scroll'(val) { this.setBoolAttr('x_scroll', val) }
get 'y_scroll'() { return this.getBoolAttr('y_scroll') }
    set 'y_scroll'(val) { this.setBoolAttr('y_scroll', val) }
get 'auto_hide'() { return this.getBoolAttr('auto_hide') }
    set 'auto_hide'(val) { this.setBoolAttr('auto_hide', val) }
get 'break'() { return this.getNumberAttr('break') }
    set 'break'(val) { this.setNumberAttr('break', val) }
get 'disable'() { return this.getBoolAttr('disable') }
    set 'disable'(val) { this.setBoolAttr('disable', val) }
get 'no_user_select'() { return this.getBoolAttr('no_user_select') }
    set 'no_user_select'(val) { this.setBoolAttr('no_user_select', val) }
get 'mouse_drag'() { return this.getBoolAttr('mouse_drag') }
    set 'mouse_drag'(val) { this.setBoolAttr('mouse_drag', val) }
get 'pinch'() { return this.getBoolAttr('pinch') }
    set 'pinch'(val) { this.setBoolAttr('pinch', val) }
get 'flex'() { return this.getBoolAttr('flex') }
    set 'flex'(val) { this.setBoolAttr('flex', val) }
    get 'zoom'() { return this.getNumberProp('zoom') }
    set 'zoom'(val) { this.setNumberAttr('zoom', val) }
    observer;
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
}));
 }
    static __style = `:host{--internal-scrollbar-container-color: var(--scrollbar-container-color, transparent);--internal-scrollbar-color: var(--scrollbar-color, #757575);--internal-scrollbar-active-color: var(--scrollbar-active-color, #858585);--internal-scroller-width: var(--scroller-width, 6px);--internal-scroller-top: var(--scroller-top, 3px);--internal-scroller-bottom: var(--scroller-bottom, 3px);--internal-scroller-right: var(--scroller-right, 3px);--internal-scroller-left: var(--scroller-left, 3px);--_scrollbar-content-padding: var(--scrollbar-content-padding, 0);--_scrollbar-container-display: var(--scrollbar-container-display, inline-block)}:host{display:block;height:100%;min-height:inherit;min-width:inherit;overflow:clip;position:relative;-webkit-user-drag:none;-khtml-user-drag:none;-moz-user-drag:none;-o-user-drag:none;width:100%}:host .scroll-main-container{display:block;height:100%;min-height:inherit;min-width:inherit;position:relative;width:100%}:host .scroll-main-container .content-zoom{display:block;height:100%;min-height:inherit;min-width:inherit;position:relative;transform-origin:0 0;width:100%;z-index:4}:host .scroll-main-container .content-zoom .content-hidder{display:block;height:100%;min-height:inherit;min-width:inherit;overflow:clip;position:relative;width:100%}:host .scroll-main-container .content-zoom .content-hidder .content-wrapper{display:var(--_scrollbar-container-display);height:100%;min-height:inherit;min-width:inherit;padding:var(--_scrollbar-content-padding);position:relative;width:100%}:host .scroll-main-container .scroller-wrapper .container-scroller{display:none;overflow:hidden;position:absolute;transition:transform .2s linear;z-index:5}:host .scroll-main-container .scroller-wrapper .container-scroller .shadow-scroller{background-color:var(--internal-scrollbar-container-color);border-radius:5px}:host .scroll-main-container .scroller-wrapper .container-scroller .shadow-scroller .scroller{background-color:var(--internal-scrollbar-color);border-radius:5px;cursor:pointer;position:absolute;-webkit-tap-highlight-color:rgba(0,0,0,0);touch-action:none;z-index:5}:host .scroll-main-container .scroller-wrapper .container-scroller .scroller.active{background-color:var(--internal-scrollbar-active-color)}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical{height:calc(100% - var(--internal-scroller-bottom)*2 - var(--internal-scroller-width));padding-left:var(--internal-scroller-left);right:var(--internal-scroller-right);top:var(--internal-scroller-bottom);transform:0;width:calc(var(--internal-scroller-width) + var(--internal-scroller-left))}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical.hide{transform:translateX(calc(var(--internal-scroller-width) + var(--internal-scroller-left)))}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical .shadow-scroller{height:100%}:host .scroll-main-container .scroller-wrapper .container-scroller.vertical .shadow-scroller .scroller{width:calc(100% - var(--internal-scroller-left))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal{bottom:var(--internal-scroller-bottom);height:calc(var(--internal-scroller-width) + var(--internal-scroller-top));left:var(--internal-scroller-right);padding-top:var(--internal-scroller-top);transform:0;width:calc(100% - var(--internal-scroller-right)*2 - var(--internal-scroller-width))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal.hide{transform:translateY(calc(var(--internal-scroller-width) + var(--internal-scroller-top)))}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal .shadow-scroller{height:100%}:host .scroll-main-container .scroller-wrapper .container-scroller.horizontal .shadow-scroller .scroller{height:calc(100% - var(--internal-scroller-top))}:host([y_scroll]) .scroll-main-container .content-zoom .content-hidder .content-wrapper{height:auto}:host([x_scroll]) .scroll-main-container .content-zoom .content-hidder .content-wrapper{width:auto}:host([y_scroll_visible]) .scroll-main-container .scroller-wrapper .container-scroller.vertical{display:block}:host([x_scroll_visible]) .scroll-main-container .scroller-wrapper .container-scroller.horizontal{display:block}:host([no_user_select]) .content-wrapper *{user-select:none}:host([no_user_select]) ::slotted{user-select:none}:host([flex]){display:flex;flex-direction:column;min-height:0}:host([flex]) .scroll-main-container{display:flex;flex-direction:column}:host([flex]) .scroll-main-container .content-zoom{display:flex;flex-direction:column}`;
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
        blocks: { 'default':`<div class="scroll-main-container" _id="scrollable_0">
    <div class="content-zoom" _id="scrollable_1">
        <div class="content-hidder" _id="scrollable_2">
            <div class="content-wrapper" part="content-wrapper" _id="scrollable_3">
                <slot></slot>
            </div>
        </div>
    </div>
    <div class="scroller-wrapper">
        <div class="container-scroller vertical" _id="scrollable_4">
            <div class="shadow-scroller">
                <div class="scroller" _id="scrollable_5"></div>
            </div>
        </div>
        <div class="container-scroller horizontal" _id="scrollable_6">
            <div class="shadow-scroller">
                <div class="scroller" _id="scrollable_7"></div>
            </div>
        </div>
    </div>
</div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();
this.__getStatic().__template.setActions({
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
});
 }
    getClassName() {
        return "Scrollable";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('min_zoom')){ this['min_zoom'] = 1; }
if(!this.hasAttribute('max_zoom')){ this['max_zoom'] = undefined; }
if(!this.hasAttribute('y_scroll_visible')) { this.attributeChangedCallback('y_scroll_visible', false, false); }
if(!this.hasAttribute('x_scroll_visible')) { this.attributeChangedCallback('x_scroll_visible', false, false); }
if(!this.hasAttribute('floating_scroll')) { this.attributeChangedCallback('floating_scroll', false, false); }
if(!this.hasAttribute('x_scroll')) { this.attributeChangedCallback('x_scroll', false, false); }
if(!this.hasAttribute('y_scroll')) {this.setAttribute('y_scroll' ,'true'); }
if(!this.hasAttribute('auto_hide')) { this.attributeChangedCallback('auto_hide', false, false); }
if(!this.hasAttribute('break')){ this['break'] = 0.1; }
if(!this.hasAttribute('disable')) { this.attributeChangedCallback('disable', false, false); }
if(!this.hasAttribute('no_user_select')) { this.attributeChangedCallback('no_user_select', false, false); }
if(!this.hasAttribute('mouse_drag')) { this.attributeChangedCallback('mouse_drag', false, false); }
if(!this.hasAttribute('pinch')) { this.attributeChangedCallback('pinch', false, false); }
if(!this.hasAttribute('flex')) { this.attributeChangedCallback('flex', false, false); }
if(!this.hasAttribute('zoom')){ this['zoom'] = 1; }
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('x');
this.__correctGetter('y');
this.__correctGetter('xMax');
this.__correctGetter('yMax');
this.__upgradeProperty('min_zoom');
this.__upgradeProperty('max_zoom');
this.__upgradeProperty('y_scroll_visible');
this.__upgradeProperty('x_scroll_visible');
this.__upgradeProperty('floating_scroll');
this.__upgradeProperty('x_scroll');
this.__upgradeProperty('y_scroll');
this.__upgradeProperty('auto_hide');
this.__upgradeProperty('break');
this.__upgradeProperty('disable');
this.__upgradeProperty('no_user_select');
this.__upgradeProperty('mouse_drag');
this.__upgradeProperty('pinch');
this.__upgradeProperty('flex');
this.__upgradeProperty('zoom');
 }
    __listBoolProps() { return ["y_scroll_visible","x_scroll_visible","floating_scroll","x_scroll","y_scroll","auto_hide","disable","no_user_select","mouse_drag","pinch","flex"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
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
            let scrollPosition = this.div(this.position[direction], this.contentWrapperSize[direction]) * containerSize;
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
        let scaleDiff = this.div(newScale, oldScale);
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
            let scaleDiff = prevDistance ? this.div(newDistance, prevDistance) : 1;
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
            scaleDiff = this.div(newScale, oldScale);
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
            this.contentZoom.style.width = this.div(this.mainContainer.offsetWidth, this.zoom) + 'px';
            this.contentZoom.style.height = this.div(this.mainContainer.offsetHeight, this.zoom) + 'px';
            this.contentZoom.style.maxHeight = this.div(this.mainContainer.offsetHeight, this.zoom) + 'px';
            if (currentOffsetHeight != this.display.y || currentOffsetWidth != this.display.x)
                hasChanged = true;
            this.display.y = currentOffsetHeight;
            this.display.x = currentOffsetWidth;
        }
        else {
            const newX = this.div(currentOffsetWidth, this.zoom);
            const newY = this.div(currentOffsetHeight, this.zoom);
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
        const scrollerSize = (this.div((this.display[direction] - this.margin[direction]), this.contentWrapperSize[direction]) * 100);
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
                x: this.div(this.position.x, this.contentWrapperSize.x),
                y: this.div(this.position.y, this.contentWrapperSize.y)
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
    div(nb1, nb2) {
        if (!nb2)
            return nb1;
        return nb1 / nb2;
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
__as1(_.Layout, 'Scrollable', Layout.Scrollable);
if(!window.customElements.get('av-scrollable')){window.customElements.define('av-scrollable', Layout.Scrollable);Aventus.WebComponentInstance.registerDefinition(Layout.Scrollable);}


for(let key in _) { Aventus[key] = _[key] }
})(Aventus);

var AventusI18nView;
(AventusI18nView||(AventusI18nView = {}));
(function (AventusI18nView) {
const __as1 = (o, k, c) => { if (o[k] !== undefined) for (let w in o[k]) { c[w] = o[k][w] } o[k] = c; }
const moduleName = `AventusI18nView`;
const _ = {};

let Components = {};
_.Components = AventusI18nView.Components ?? {};
let _n;
const TranslationColHeader = class TranslationColHeader extends Aventus.WebComponent {
    get 'locale'() {
						return this.__watch["locale"];
					}
					set 'locale'(val) {
						this.__watch["locale"] = val;
					}
    __registerWatchesActions() {
    this.__addWatchesActions("locale", ((target) => {
    target.style.setProperty("--translation-col-width", "var(--col-width-" + target.locale + ")");
}));
    super.__registerWatchesActions();
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
    __registerTemplateAction() { super.__registerTemplateAction();
this.__getStatic().__template.setActions({
  "content": {
    "translationcolheader_0°locale": {
      "fct": (c) => `${c.print(c.comp.__c0f6c43ffbd917481fc06076601eea8amethod0())}`,
      "once": true
    }
  }
});
 }
    getClassName() {
        return "TranslationColHeader";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["locale"] = "";
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('locale');
 }
    __c0f6c43ffbd917481fc06076601eea8amethod0() {
        return this.locale;
    }
}
TranslationColHeader.Namespace=`AventusI18nView`;
TranslationColHeader.Tag=`av-translation-col-header`;
__as1(_, 'TranslationColHeader', TranslationColHeader);
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
__as1(_, 'StringTools', StringTools);

const Textarea = class Textarea extends Aventus.WebComponent {
    static get observedAttributes() {return ["error"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'error'() { return this.getBoolProp('error') }
    set 'error'(val) { this.setBoolAttr('error', val) }
    get 'value'() {
						return this.__watch["value"];
					}
					set 'value'(val) {
						this.__watch["value"] = val;
					}
    preventDrag;
    change = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("value", ((target) => {
    target.textarea.value = target.value;
}));
    super.__registerWatchesActions();
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
    __registerTemplateAction() { super.__registerTemplateAction();
this.__getStatic().__template.setActions({
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
});
 }
    getClassName() {
        return "Textarea";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('error')) { this.attributeChangedCallback('error', false, false); }
 }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["value"] = "salut";
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('error');
this.__correctGetter('value');
 }
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
__as1(_, 'Textarea', Textarea);
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
__as1(_, 'DemoData', DemoData);

const Loading = class Loading extends Aventus.WebComponent {
    get 'visible'() { return this.getBoolAttr('visible') }
    set 'visible'(val) { this.setBoolAttr('visible', val) }
    static _instance;
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
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('visible')) { this.attributeChangedCallback('visible', false, false); }
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('visible');
 }
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
__as1(_, 'Loading', Loading);
if(!window.customElements.get('av-loading')){window.customElements.define('av-loading', Loading);Aventus.WebComponentInstance.registerDefinition(Loading);}

Components.Tooltip = class Tooltip extends Aventus.WebComponent {
    get 'visible'() { return this.getBoolAttr('visible') }
    set 'visible'(val) { this.setBoolAttr('visible', val) }
get 'position'() { return this.getStringAttr('position') }
    set 'position'(val) { this.setStringAttr('position', val) }
get 'use_absolute'() { return this.getBoolAttr('use_absolute') }
    set 'use_absolute'(val) { this.setBoolAttr('use_absolute', val) }
get 'delay'() { return this.getNumberAttr('delay') }
    set 'delay'(val) { this.setNumberAttr('delay', val) }
get 'delay_touch'() { return this.getNumberAttr('delay_touch') }
    set 'delay_touch'(val) { this.setNumberAttr('delay_touch', val) }
get 'no_caret'() { return this.getBoolAttr('no_caret') }
    set 'no_caret'(val) { this.setBoolAttr('no_caret', val) }
    parent = null;
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
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('visible')) { this.attributeChangedCallback('visible', false, false); }
if(!this.hasAttribute('position')){ this['position'] = 'top'; }
if(!this.hasAttribute('use_absolute')) { this.attributeChangedCallback('use_absolute', false, false); }
if(!this.hasAttribute('delay')){ this['delay'] = 700; }
if(!this.hasAttribute('delay_touch')){ this['delay_touch'] = 700; }
if(!this.hasAttribute('no_caret')) { this.attributeChangedCallback('no_caret', false, false); }
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('visible');
this.__upgradeProperty('position');
this.__upgradeProperty('use_absolute');
this.__upgradeProperty('delay');
this.__upgradeProperty('delay_touch');
this.__upgradeProperty('no_caret');
 }
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
__as1(_.Components, 'Tooltip', Components.Tooltip);
if(!window.customElements.get('av-tooltip')){window.customElements.define('av-tooltip', Components.Tooltip);Aventus.WebComponentInstance.registerDefinition(Components.Tooltip);}

const GenericPopup = class GenericPopup extends Aventus.WebComponent {
    static get observedAttributes() {return ["popup_title"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'popup_title'() { return this.getStringProp('popup_title') }
    set 'popup_title'(val) { this.setStringAttr('popup_title', val) }
    cb;
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
        slots: { 'default':`<slot></slot>`,'actions':`<slot name="actions">
            <vscode-button _id="genericpopup_1">Close</vscode-button>
        </slot>` }, 
        blocks: { 'default':`<div class="popup">
    <div class="title" _id="genericpopup_0"></div>
    <div class="content">
        <slot></slot>
    </div>
    <div class="actions">
        <slot name="actions">
            <vscode-button _id="genericpopup_1">Close</vscode-button>
        </slot>
    </div>
</div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();
this.__getStatic().__template.setActions({
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
});
 }
    getClassName() {
        return "GenericPopup";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('popup_title')){ this['popup_title'] = undefined; }
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('popup_title');
 }
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
__as1(_, 'GenericPopup', GenericPopup);
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
    __getHtml() {
super.__getHtml();
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
__as1(_, 'Popup', Popup);
if(!window.customElements.get('av-popup')){window.customElements.define('av-popup', Popup);Aventus.WebComponentInstance.registerDefinition(Popup);}

const ApiKeyPopup = class ApiKeyPopup extends GenericPopup {
    static get observedAttributes() {return ["popup_title"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'popup_title'() { return this.getStringProp('popup_title') }
    set 'popup_title'(val) { this.setStringAttr('popup_title', val) }
    apiKeySet = false;
    static __style = `:host vscode-textfield{width:calc(100% - 32px);margin:16px}:host .cancel{--vscode-button-background: var(--vscode-editorError-foreground);--vscode-button-hoverBackground: #f45d5d}`;
    __getStatic() {
        return ApiKeyPopup;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push(ApiKeyPopup.__style);
        return arrStyle;
    }
    __getHtml() {
super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'actions':`
	<vscode-button class="cancel" _id="apikeypopup_1">Close</vscode-button>
	<vscode-button _id="apikeypopup_2">Save</vscode-button>
`,'default':`<vscode-textfield placeholder="Deepl Api Key" _id="apikeypopup_0"></vscode-textfield>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();
this.__getStatic().__template.setActions({
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
});
 }
    getClassName() {
        return "ApiKeyPopup";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('popup_title')){ this['popup_title'] = "Deepl api key is missing"; }
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('popup_title');
 }
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
__as1(_, 'ApiKeyPopup', ApiKeyPopup);
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
    __getHtml() {
super.__getHtml();
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
__as1(_, 'Alert', Alert);
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
__as1(_, 'Translator', Translator);

const TranslateAllPopup = class TranslateAllPopup extends GenericPopup {
    static get observedAttributes() {return ["is_running"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'is_running'() { return this.getBoolProp('is_running') }
    set 'is_running'(val) { this.setBoolAttr('is_running', val) }
    get 'fallback'() {
						return this.__watch["fallback"];
					}
					set 'fallback'(val) {
						this.__watch["fallback"] = val;
					}
    parsed = {};
    locales = [];
    __registerWatchesActions() {
    this.__addWatchesActions("fallback");
    super.__registerWatchesActions();
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
    __getHtml() {
super.__getHtml();
    this.__getStatic().__template.setHTML({
        blocks: { 'default':`<div class="header">
	<div class="left">
		<div class="title">Translate all</div>
		<div class="sub-title" _id="translateallpopup_0"></div>
	</div>
	<div class="right">
		<av-loading _id="translateallpopup_1"></av-loading>
	</div>
</div><div class="list">
	<div class="item head">
		<div class="source" _id="translateallpopup_2"></div>
		<div class="result">Result</div>
	</div>
	<av-scrollable class="scroll" floating_scroll auto_hide mouse_drag _id="translateallpopup_3">
	</av-scrollable>
</div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();
this.__getStatic().__template.setActions({
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
});
 }
    getClassName() {
        return "TranslateAllPopup";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('is_running')) { this.attributeChangedCallback('is_running', false, false); }
 }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["fallback"] = "";
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('is_running');
this.__correctGetter('fallback');
 }
    __listBoolProps() { return ["is_running"].concat(super.__listBoolProps()).filter((v, i, a) => a.indexOf(v) === i); }
    async run() {
        let closeBtn = this.closeBtn;
        closeBtn['disabled'] = true;
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
        closeBtn['disabled'] = false;
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
__as1(_, 'TranslateAllPopup', TranslateAllPopup);
if(!window.customElements.get('av-translate-all-popup')){window.customElements.define('av-translate-all-popup', TranslateAllPopup);Aventus.WebComponentInstance.registerDefinition(TranslateAllPopup);}

const IconTooltip = class IconTooltip extends Aventus.WebComponent {
    static get observedAttributes() {return ["name"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'notif'() { return this.getBoolAttr('notif') }
    set 'notif'(val) { this.setBoolAttr('notif', val) }
get 'active'() { return this.getBoolAttr('active') }
    set 'active'(val) { this.setBoolAttr('active', val) }
    get 'name'() { return this.getStringProp('name') }
    set 'name'(val) { this.setStringAttr('name', val) }
    static __style = `:host{border-radius:6px;cursor:pointer;height:32px;padding:8px;position:relative;transition:background-color .2s linear;width:32px}:host vscode-icon{height:100%;width:100%}:host .notif{background-color:var(--vscode-icon-foreground);border-radius:10px;display:none;height:10px;position:absolute;right:3px;top:3px;width:10px}:host([active])::after{border:1px solid var(--vscode-button-secondaryHoverBackground);border-radius:6px;content:"";height:100%;left:50%;pointer-events:none;position:absolute;top:50%;transform:translate(-50%, -50%);width:100%}:host(:hover){background-color:var(--vscode-button-secondaryHoverBackground)}:host([notif]) .notif{display:block}`;
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
        blocks: { 'default':`<vscode-icon _id="icontooltip_0"></vscode-icon><av-tooltip use_absolute no_caret>
    <slot></slot>
</av-tooltip><div class="notif"></div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();
this.__getStatic().__template.setActions({
  "content": {
    "icontooltip_0°name": {
      "fct": (c) => `${c.print(c.comp.__6b93c63e12520a69df7261ff7f843c0fmethod0())}`,
      "once": true
    }
  }
});
 }
    getClassName() {
        return "IconTooltip";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('notif')) { this.attributeChangedCallback('notif', false, false); }
if(!this.hasAttribute('active')) { this.attributeChangedCallback('active', false, false); }
if(!this.hasAttribute('name')){ this['name'] = "symbol-array"; }
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('notif');
this.__upgradeProperty('active');
this.__upgradeProperty('name');
 }
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
__as1(_, 'IconTooltip', IconTooltip);
if(!window.customElements.get('av-icon-tooltip')){window.customElements.define('av-icon-tooltip', IconTooltip);Aventus.WebComponentInstance.registerDefinition(IconTooltip);}

const TranslationCol = class TranslationCol extends Aventus.WebComponent {
    static get observedAttributes() {return ["error"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'icon_btn'() { return this.getBoolAttr('icon_btn') }
    set 'icon_btn'(val) { this.setBoolAttr('icon_btn', val) }
    get 'error'() { return this.getBoolProp('error') }
    set 'error'(val) { this.setBoolAttr('error', val) }
    get 'locale'() {
						return this.__watch["locale"];
					}
					set 'locale'(val) {
						this.__watch["locale"] = val;
					}
get 'value'() {
						return this.__watch["value"];
					}
					set 'value'(val) {
						this.__watch["value"] = val;
					}
    initialValue;
    change = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("locale", ((target) => {
    target.style.setProperty("--translation-col-width", "var(--col-width-" + target.locale + ")");
}));
this.__addWatchesActions("value", ((target) => {
    target.showIcon();
}));
    super.__registerWatchesActions();
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
        blocks: { 'default':`<av-textarea _id="translationcol_0"></av-textarea><div class="action">
    <vscode-icon name="book" _id="translationcol_1"></vscode-icon>
</div><av-resize _id="translationcol_2"></av-resize>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();
this.__getStatic().__template.setActions({
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
});
 }
    getClassName() {
        return "TranslationCol";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('icon_btn')) { this.attributeChangedCallback('icon_btn', false, false); }
if(!this.hasAttribute('error')) { this.attributeChangedCallback('error', false, false); }
 }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["locale"] = undefined;
w["value"] = undefined;
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('icon_btn');
this.__upgradeProperty('error');
this.__correctGetter('locale');
this.__correctGetter('value');
 }
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
__as1(_, 'TranslationCol', TranslationCol);
if(!window.customElements.get('av-translation-col')){window.customElements.define('av-translation-col', TranslationCol);Aventus.WebComponentInstance.registerDefinition(TranslationCol);}

const TranslationRow = class TranslationRow extends Aventus.WebComponent {
    get 'key'() {
						return this.__watch["key"];
					}
					set 'key'(val) {
						this.__watch["key"] = val;
					}
get 'locales'() {
						return this.__watch["locales"];
					}
					set 'locales'(val) {
						this.__watch["locales"] = val;
					}
    parsedItem;
    hasChanged = false;
    cols = {};
    change = new Aventus.Callback();
    __registerWatchesActions() {
    this.__addWatchesActions("key");
this.__addWatchesActions("locales");
    super.__registerWatchesActions();
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
        blocks: { 'default':`<div class="col key">
	<vscode-label _id="translationrow_0"></vscode-label>
	<av-resize is_key></av-resize>
</div><div class="inputs" _id="translationrow_1">
</div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();
this.__getStatic().__template.setActions({
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
});
 }
    getClassName() {
        return "TranslationRow";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["key"] = undefined;
w["locales"] = undefined;
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('key');
this.__correctGetter('locales');
 }
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
__as1(_, 'TranslationRow', TranslationRow);
if(!window.customElements.get('av-translation-row')){window.customElements.define('av-translation-row', TranslationRow);Aventus.WebComponentInstance.registerDefinition(TranslationRow);}

const TranslationRowHeader = class TranslationRowHeader extends Aventus.WebComponent {
    get 'locales'() {
						return this.__watch["locales"];
					}
					set 'locales'(val) {
						this.__watch["locales"] = val;
					}
    __registerWatchesActions() {
    this.__addWatchesActions("locales");
    super.__registerWatchesActions();
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
        blocks: { 'default':`<div class="key">
    <span>Key</span>
    <av-resize is_key></av-resize>
</div><div class="inputs">
<template _id="translationrowheader_0"></template>
</div>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();
const templ0 = new Aventus.Template(this);
templ0.setTemplate(`
    <av-translation-col-header _id="translationrowheader_1"></av-translation-col-header>
`);
templ0.setActions({
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
});
this.__getStatic().__template.addLoop({
                    anchorId: 'translationrowheader_0',
                    template: templ0,
                simple:{data: "this.locales",item:"locale"}
});
 }
    getClassName() {
        return "TranslationRowHeader";
    }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["locales"] = [];
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__correctGetter('locales');
 }
    __189fa087d6daa05734acb2853341f755method2(locale) {
        return locale;
    }
    __189fa087d6daa05734acb2853341f755method1(locale) {
        return locale;
    }
}
TranslationRowHeader.Namespace=`AventusI18nView`;
TranslationRowHeader.Tag=`av-translation-row-header`;
__as1(_, 'TranslationRowHeader', TranslationRowHeader);
if(!window.customElements.get('av-translation-row-header')){window.customElements.define('av-translation-row-header', TranslationRowHeader);Aventus.WebComponentInstance.registerDefinition(TranslationRowHeader);}

const TranslationPage = class TranslationPage extends Aventus.WebComponent {
    static get observedAttributes() {return ["need_save", "has_empty"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'is_init'() { return this.getBoolAttr('is_init') }
    set 'is_init'(val) { this.setBoolAttr('is_init', val) }
    get 'need_save'() { return this.getBoolProp('need_save') }
    set 'need_save'(val) { this.setBoolAttr('need_save', val) }
get 'has_empty'() { return this.getBoolProp('has_empty') }
    set 'has_empty'(val) { this.setBoolAttr('has_empty', val) }
    get 'fallback'() {
						return this.__watch["fallback"];
					}
					set 'fallback'(val) {
						this.__watch["fallback"] = val;
					}
get 'searchTxt'() {
						return this.__watch["searchTxt"];
					}
					set 'searchTxt'(val) {
						this.__watch["searchTxt"] = val;
					}
get 'onlyMissing'() {
						return this.__watch["onlyMissing"];
					}
					set 'onlyMissing'(val) {
						this.__watch["onlyMissing"] = val;
					}
get 'importMissingBtn'() {
						return this.__watch["importMissingBtn"];
					}
					set 'importMissingBtn'(val) {
						this.__watch["importMissingBtn"] = val;
					}
get 'pageName'() {
						return this.__watch["pageName"];
					}
					set 'pageName'(val) {
						this.__watch["pageName"] = val;
					}
get 'locales'() {
						return this.__watch["locales"];
					}
					set 'locales'(val) {
						this.__watch["locales"] = val;
					}
    static KeyUndefined = "ⵌⵌ";
    parsed = {};
    guard = new Aventus.ActionGuard();
    rows = {};
    __registerWatchesActions() {
    this.__addWatchesActions("fallback");
this.__addWatchesActions("searchTxt", ((target) => {
    target.search();
}));
this.__addWatchesActions("onlyMissing", ((target) => {
    target.search();
}));
this.__addWatchesActions("importMissingBtn");
this.__addWatchesActions("pageName");
this.__addWatchesActions("locales");
    super.__registerWatchesActions();
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
        blocks: { 'default':`<div class="header">
    <div class="bar">
        <h1 class="title" _id="translationpage_0"></h1>
        <div class="menu-actions">
            <div>
                <vscode-label>Recherche:</vscode-label>
                <vscode-textfield _id="translationpage_1"></vscode-textfield>
            </div>
        </div>
    </div>
    <div class="menu">
        <av-icon-tooltip name="save" _id="translationpage_2">Save</av-icon-tooltip>
        <av-icon-tooltip name="bug" _id="translationpage_3">Only missing</av-icon-tooltip>
        <template _id="translationpage_4"></template>
        <template _id="translationpage_6"></template>
    </div>
    <av-scrollable x_scroll y_scroll="true" mouse_drag auto_hide _id="translationpage_8">
        <av-translation-row-header _id="translationpage_9"></av-translation-row-header>
    </av-scrollable>
</div><vscode-scrollable>
    <av-scrollable x_scroll y_scroll="true" mouse_drag auto_hide _id="translationpage_10">
        <div class="content" _id="translationpage_11">
        </div>
    </av-scrollable>
</vscode-scrollable>` }
    });
}
    __registerTemplateAction() { super.__registerTemplateAction();
this.__getStatic().__template.setActions({
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
});
const templ0 = new Aventus.Template(this);
templ0.setTemplate(`
            <av-icon-tooltip name="check-all" _id="translationpage_5">Translate all</av-icon-tooltip>
        `);
templ0.setActions({
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
});
this.__getStatic().__template.addIf({
                    anchorId: 'translationpage_4',
                    parts: [{once: true,
                    condition: (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method0(),
                    template: templ0
                }]
            });
const templ1 = new Aventus.Template(this);
templ1.setTemplate(`
            <av-icon-tooltip name="warning" _id="translationpage_7">Import missing</av-icon-tooltip>
        `);
templ1.setActions({
  "pressEvents": [
    {
      "id": "translationpage_7",
      "onPress": (e, pressInstance, c) => { c.comp.importMissing(e, pressInstance); }
    }
  ]
});
this.__getStatic().__template.addIf({
                    anchorId: 'translationpage_6',
                    parts: [{once: true,
                    condition: (c) => c.comp.__30556103ea6c6df6f19f3f0f01bfbf73method1(),
                    template: templ1
                }]
            });
 }
    getClassName() {
        return "TranslationPage";
    }
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('is_init')) { this.attributeChangedCallback('is_init', false, false); }
if(!this.hasAttribute('need_save')) { this.attributeChangedCallback('need_save', false, false); }
if(!this.hasAttribute('has_empty')) { this.attributeChangedCallback('has_empty', false, false); }
 }
    __defaultValuesWatch(w) { super.__defaultValuesWatch(w); w["fallback"] = "en-GB";
w["searchTxt"] = "";
w["onlyMissing"] = false;
w["importMissingBtn"] = false;
w["pageName"] = "";
w["locales"] = [];
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('is_init');
this.__upgradeProperty('need_save');
this.__upgradeProperty('has_empty');
this.__correctGetter('fallback');
this.__correctGetter('searchTxt');
this.__correctGetter('onlyMissing');
this.__correctGetter('importMissingBtn');
this.__correctGetter('pageName');
this.__correctGetter('locales');
 }
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
                this.fallback = result.result.fallback;
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
__as1(_, 'TranslationPage', TranslationPage);
if(!window.customElements.get('av-translation-page')){window.customElements.define('av-translation-page', TranslationPage);Aventus.WebComponentInstance.registerDefinition(TranslationPage);}

const Resize = class Resize extends Aventus.WebComponent {
    static get observedAttributes() {return ["locale", "is_key"].concat(super.observedAttributes).filter((v, i, a) => a.indexOf(v) === i);}
    get 'locale'() { return this.getStringProp('locale') }
    set 'locale'(val) { this.setStringAttr('locale', val) }
get 'is_key'() { return this.getBoolProp('is_key') }
    set 'is_key'(val) { this.setBoolAttr('is_key', val) }
    static __style = `:host{bottom:0;cursor:col-resize;position:absolute;right:-4px;top:0;width:8px}`;
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
    __defaultValues() { super.__defaultValues(); if(!this.hasAttribute('locale')){ this['locale'] = ""; }
if(!this.hasAttribute('is_key')) { this.attributeChangedCallback('is_key', false, false); }
 }
    __upgradeAttributes() { super.__upgradeAttributes(); this.__upgradeProperty('locale');
this.__upgradeProperty('is_key');
 }
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
__as1(_, 'Resize', Resize);
if(!window.customElements.get('av-resize')){window.customElements.define('av-resize', Resize);Aventus.WebComponentInstance.registerDefinition(Resize);}


for(let key in _) { AventusI18nView[key] = _[key] }
})(AventusI18nView);
