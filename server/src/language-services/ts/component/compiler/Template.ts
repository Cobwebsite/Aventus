export function AventusWebcomponentTemplate() {
    return `$namespaceStart$$fullname$ = class $classname$ extends $parentClass$ {
    $watchingAttributes$
    
    $getterSetterAttr$
    $getterSetterProp$
    $getterSetterWatch$
    $variables$
    $watchesChangeCb$
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