# Nom de lib

## Overview

| Nom | Type | Namesapce | Description |
| --- | --- | --- |  --- |
| [Aventus.Lib](#aventus.lib) | Class | Il s'agit d'une lib permettant la création de contenu dynamique |
| Aventus.WebComponent | Class | Composant racine pour les webcomponent |

## Aventus.Lib

 - Type : Class (Webcomponent)
 - Tag : `<om-test></om-test>`
 - Description : Il s'agit d'une lib permettant la création de contenu dynamique
 - Import : import { Lib } from "Aventus@Main:Aventus.package.avt";
 - Parent : Aventus.Webcomponent
 - Implements : ITest

### CSS Props

| Nom | Type | Description |
| --- | --- | --- |
| --btn-color | string | permet de définir la couleur d'un bouton

### JS Props

| Nom | Type | Description | Decorator |
| --- | --- | --- | --- |
| color | Aventus.Color | permet de définir la couleur d'un bouton | Attribute

### Methods

### JS Props Static

### Methods Static

### Example

```ts
const nb: Number = 5
```