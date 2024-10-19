export function AventusWebcomponentTemplate() {
    return `$namespaceStart$$fullname$ = class $classname$ extends $parentClass$ {
    $watchingAttributes$
    
    $getterSetterAttr$
    $getterSetterProp$
    $getterSetterWatch$
    $getterSetterSignal$
    $variables$
    $watchesChangeCb$
    $registerSignal$
    $propertiesChangeCb$
    static __style = \`$style$\`;
    $constructor$
    __getStatic() {
        return $classname$;
    }
    __getStyle() {
        let arrStyle = super.__getStyle();
        arrStyle.push($classname$.__style);
        return arrStyle;
    }
    $slotBlock$

    $states$
    
    $variablesInViewDynamic$
    $templateAction$

    getClassName() {
        return "$classname$";
    }

    $defaultValue$
    $defaultValueWatch$
    $defaultValueSignal$
    $upgradeAttributes$
    $listBool$

    $methods$
}//todelete for hmr °
$namespace$
$tag$
$exported$
$definition$
$namespaceEnd$
`
}

export function AventusSimpleWebcomponentTemplate() {
    return `$namespaceStart$$fullname$ = class $classname$ extends $parentClass$ {
    $watchingAttributes$

    $getterSetterAttr$
    $getterSetterProp$
    $getterSetterWatch$
    $variables$
    $propertiesChangeCb$
    
    $variablesInViewDynamic$
    $templateAction$


    $defaultValue$
    $upgradeAttributes$
    $listBool$

    constructor() {
        super();
        let template = document.createElement('template');
        template.innerHTML = this.__getHtml();
        let content = template.content.cloneNode(true);
        document.adoptNode(content);
        customElements.upgrade(content);

        let style = new CSSStyleSheet();
        style.replaceSync(this.__getStyle());
  
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.adoptedStyleSheets = []
        shadowRoot.appendChild(templateContent.cloneNode(true));
    }

    __getHtml() {
        return \`$html$\`;
    }

    __getStyle() {
        return \`$style$\`;
    }

    $methods$
}//todelete for hmr °
$namespace$
$tag$
$exported$
$definition$
$namespaceEnd$
`
}