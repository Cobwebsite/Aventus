# Comment utiliser ce document

Ce document définit uniquement les règles du langage et du framework AventusJs.

Il ne définit pas une architecture logicielle, un style de code ou une organisation de projet.

Lorsqu'une règle de ce document entre en conflit avec une habitude TypeScript ou JavaScript, la règle Aventus prévaut.

Lorsqu'une information n'est pas présente dans ce document, ne pas inventer une syntaxe Aventus. En cas de doute entre plusieurs syntaxes valides, toujours choisir la syntaxe Aventus la plus spécifique plutôt qu'une syntaxe TypeScript générique.
Utiliser uniquement les API documentées ou demander une précision.

Ne jamais remplacer une fonctionnalité Aventus par une alternative provenant de React, Angular, Vue, Svelte ou d'un autre framework.

## Règle fondamentale

Lorsqu'une fonctionnalité Aventus existe pour résoudre un problème, elle doit être utilisée à la place d'une solution TypeScript ou JavaScript générique.

Ne revenir à TypeScript ou JavaScript que lorsqu'Aventus ne fournit aucune fonctionnalité équivalente.

## Priorité des règles

Ordre de priorité :

1. cette documentation
2. les définitions générées dans `.aventus/dependencies`
3. TypeScript
4. JavaScript

Une fonctionnalité TypeScript ne doit être utilisée que lorsqu'Aventus ne fournit pas d'alternative.

# Guide de Développement et Règles de Gestion d'AventusJs

Ce document rassemble de manière exhaustive et structurée les règles d'architecture, la syntaxe, les contraintes, les types de fichiers et les outils du framework **AventusJs**. Il est conçu pour être fourni à un assistant IA afin qu'il puisse générer du code conforme, propre et performant.

---

## Nomenclature et Rôles des Fichiers AventusJS

AventusJS utilise des extensions spécifiques pour identifier les rôles de chaque fichier dans le cycle de vie du framework :

| Extension / Nom | Rôle et Description |
| :--- | :--- |
| `aventus.conf.avt` | **Fichier de configuration principal** du projet (modules, builds, dépendances). |
| `aventus.sharp.avt` | Configuration de génération/export de code **C# (AventusSharp)** vers TypeScript. |
| `aventus.php.avt` | Configuration de génération/export de code **PHP (Laraventus)** vers TypeScript. |
| `.wc.avt` | **Composant Web unique (Single-File)** contenant à la fois `<script>`, `<template>`, et `<style>`. |
| `.wcl.avt` | **Composant Logique (WebComponent Logic)** contenant la classe TypeScript du composant. |
| `.wcv.avt` | **Composant Vue (WebComponent View)** contenant le template HTML compilé du composant. |
| `.wcs.avt` | **Composant Style (WebComponent Style)** contenant le SCSS scoped du composant. |
| `.gs.avt` | **Style Global (Global Style)** compilé directement en CSS standard pour le theming/variables. |
| `.data.avt` | **Structure de données pure** étendant `Aventus.Data` (pas de logique, initialisations strictes). |
| `.lib.avt` | **Bibliothèque générique** de code TypeScript (helpers, contrôleurs de route HTTP...). |
| `.ram.avt` | **In-Memory Storage (RAM)** agissant comme cache de base de données locale synchrone et réactive. |
| `.state.avt` | **État applicatif** étendant `Aventus.State` pour la machine à états et la navigation. |
| `.static.avt` | **Script JavaScript statique** compilé tel quel. |
| `.def.avt` | **Déclaration TypeScript (`.d.ts`)** décrivant les types pour un fichier `.static.avt` local. |
| `.defnpm.avt` | **Déclaration TypeScript pour export NPM** associée à un fichier `.static.avt`. |
| `template.avt.ts` | **Script de template de création** décrivant comment générer des fichiers à partir de variables. |
| `!aventus.conf.avt` | **Modèle de configuration de démarrage** copié lors du scaffolding du projet. |
| `.package.avt` | **Fichier de package compilé** contenant le livrable réutilisable par d'autres builds/libs. |
| `.i18n.avt` | **Fichier de traductions JSON** pour l'internationalisation. |
| `.avt` | **Fichier Aventus générique** de base. |

---

## Fichier de Configuration Principal (`aventus.conf.avt`)

Le fichier `aventus.conf.avt` décrit la structure du projet. C'est un fichier JSON dont voici les propriétés :

### 2.1 Propriétés de Base
* **`module`** *(Requis)* : Nom de l'espace de noms global dans lequel le code compilé sera encapsulé. (Regex: `^[a-zA-Z0-9_]+$`).
* **`version`** : Version sémantique de votre build. Par défaut `1.0.0`. (Regex: `^[0-9]+\.[0-9]+\.[0-9]+$`).
* **`organization`** : Nom de l'organisation pour la publication sur le store. (Regex: `^[a-zA-Z0-9_@]+$`).
* **`componentPrefix`** : Préfixe appliqué aux balises HTML de vos composants (ex: `"av"` pour `<av-my-button>`). Par défaut, utilise le nom du module. (Regex: `^[a-z]{2,}$`).
* **`hideWarnings`** : Masque les avertissements. Si positionné à `false`, vous devez documenter (JSDoc) chaque méthode publique sous peine de warning.
* **`avoidParsingInsideTags`** : Tableau de chaînes (tags HTML) dans lesquels le compilateur ne doit pas évaluer les interpolations ou directives (ex: `["av-code"]`).
* **`aliases`** : Mappages de chemins (ex: `{"@root": "./src/"}`) utilisables dans vos imports.
* **`build`** *(Requis)* : Tableau de configurations de sous-modules (Builds).
* **`dependencies`** : Dépendances externes ou locales utilisées par le projet.
* **`static`** : Liste de dossiers d'assets statiques à copier directement dans le dossier de distribution.

### Options de Build
Chaque build permet de regrouper et compiler une partie du code :
```json
{
    "build": [
        {
            "name": "Main",
            "src": ["./src/*"],
            "compile": [
                {
                    "output": "./dist/main.js",
                    "package": "./dist/main.package.avt"
                }
            ],
            "namespaceStrategy": "followFolders",
            "namespaceRoot": "./src",
            "i18n": {
                "locales": ["fr-fr", "en-gb"],
                "fallback": "en-gb",
                "autoRegister": true
            }
        }
    ]
}
```
* **`compile.output`** : Chemin du fichier JavaScript bundle produit.
* **`compile.package`** : Fichier `.package.avt` de sortie pour export.
* **`namespaceStrategy`** :
  * `manual` : Le développeur écrit le namespace à la main.
  * `followFolders` : Génération automatique basée sur la structure de dossiers depuis `namespaceRoot`.
  * `followFoldersCamelCase` : Identique à `followFolders` mais converti en CamelCase.
  * `rules` : Défini via des motifs d'URI dans la propriété `namespaceRules`.

---

## Gestion des Dépendances (Packages & Store)

### Déclaration des Dépendances
Dans `aventus.conf.avt`, l'objet `dependencies` permet de charger des dépendances :
```json
"dependencies": {
    "Aventus@UI": {}, // Bibliothèque prédéfinie
    "MaterialIcon": "1.0.0", // Package téléchargé depuis le Store
    "MyLocalLib@Main": {
        "isLocal": true // Recherche dans les packages locaux (@locals)
    },
    "CustomLib": {
        "uri": "./libs/CustomLib@Main.package.avt" // Chargement direct par chemin de fichier
    }
}
```
Options de dépendance :
* **`version`** : Version spécifique demandée.
* **`isLocal`** : Recherche locale dans le stockage local d'Aventus (`packages/@locals`).
* **`include`** : `"none" | "need" | "full"` (définit comment le code de la dépendance est packagé dans le fichier final compilé). Par défaut `"need"`.

### Bibliothèques Prédéfinies
Aventus fournit nativement plusieurs bibliothèques :
* `Aventus@Main` : Le cœur du framework (chargé automatiquement).
* `Aventus@UI` : Composants graphiques réutilisables.
* `Aventus@I18n` : Outils d'internationalisation.
* `Aventus@Php` : Base de code pour l'intégration Laraventus.
* `Aventus@Sharp` : Base de code pour l'intégration AventusSharp (C#).

---

## Lecture des Dépendances par l'IA (CRITICAL)

Pour savoir quelles classes, méthodes et composants sont disponibles dans une dépendance ou un package importé :

1. **Vérifier le dossier `.aventus/dependencies/`** : Ce dossier est automatiquement généré à la racine du projet et contient des fichiers `.md` décrivant l'API typée exacte de chaque dépendance déclarée.
2. **Générer les définitions via CLI** : Si ces fichiers sont manquants ou obsolètes, exécutez la commande suivante pour les recréer :
   ```bash
   av dependencies help-llm
   ```
   L'IA **doit** lire ces fichiers `.md` pour connaître l'API disponible avant d'implémenter des appels à des modules tiers.

Si une API n'apparaît ni dans cette documentation ni dans les fichiers `.md` générés, elle doit être considérée comme inexistante.

---

## Système d'Imports et Syntaxe

Le système d'import d'Aventus diffère de TypeScript standard pour les packages Aventus compilés :

### Import Aventus Package
Pour importer un élément d'un package Aventus compilé, utilisez la syntaxe `"$NomPackage:$Namespace.package.avt"` :
```typescript
// Importe le composant TopBar du package "OneMoreUI" dans le namespace "OneMoreUI.Components.Layout"
import { TopBar } from "OneMoreUI:OneMoreUI.Components.Layout.package.avt";
```

### Import Local
Les imports de fichiers locaux (au sein de vos sources) s'écrivent avec des chemins relatifs ou des alias. **L'extension du fichier est OBLIGATOIRE** :
```typescript
import { User } from "./User.data.avt";
import { Theme } from "@/core/Theme.lib.avt"; // Import via alias
```

---

## Règles générales de compatibilité TypeScript

Aventus est basé sur TypeScript.

Toute syntaxe TypeScript valide peut être utilisée sauf lorsqu'Aventus fournit sa propre syntaxe.

Exemples :

✔ classes
✔ interfaces
✔ generics
✔ async/await
✔ enum
✔ namespace TS si aucune alternative Aventus

✘ JSX
✘ TSX
✘ Angular decorators
✘ Vue directives
✘ React Hooks
✘ Svelte syntax

### Éléments interdits

Ne jamais utiliser :

- JSX
- TSX
- ngIf
- ngFor
- @Input
- @Output
- v-if
- v-for
- React.FC
- useState
- useEffect
- createSignal

---

## Internationalisation (I18n) (`.i18n.avt`)

L'internationalisation dans AventusJs repose sur des fichiers JSON structurés contenant des paires clé/locale-valeur. Elle est intégrée dans le LSP (erreurs si clés manquantes, autocomplétion des clés).

### Fichiers de Traduction Globaux
* **Nommage** : Le nom du fichier doit commencer par un `@` (ex : `@Default.i18n.avt`).
* **Format** :
  ```json
  {
      "{qty} liters": {
          "en-gb": "{qty} liters",
          "fr-fr": "{qty} litres"
      }
  }
  ```
* **Utilisation globale** : Via la fonction globale `t()` injectée par `Aventus@Main` :
  ```typescript
  t("{qty} liters", { qty: "5" }); // Retourne "5 litres" si la locale est fr-fr
  ```

### Fichiers de Traduction de Composant
* **Nommage** : Doit correspondre exactement au nom du composant logique (ex: `MyButton.i18n.avt` placé dans le même répertoire que `MyButton.wcl.avt`).
* **Utilisation locale** : À l'intérieur de la classe du composant, utilisez **obligatoirement** `this.t()` :
  ```typescript
  this.writeLog(this.t("submit_error")); // Utilise le dictionnaire local au composant
  ```

### Changement de Langue au Runtime
```typescript
Aventus.I18n.setLocale("fr-fr"); // Charge dynamiquement les fichiers i18n et rafraîchit la réactivité
```

---

## Styles Génériques et Globaux (`.gs.avt`)

Les fichiers `.gs.avt` (Global Style) servent à déclarer des styles globaux, des utilitaires CSS, ou un thème centralisé pour l'application.

* **Compilation** : Ils sont placés dans le dossier statique et compilés directement en fichiers CSS standards.
* **Scope** : Contrairement aux fichiers `.wcs.avt` scoped, les styles déclarés dans les `.gs.avt` s'appliquent à l'ensemble du document HTML (hors Shadow DOM, sauf si des variables CSS y sont définies).
* **Variables CSS et Thémage** : C'est le lieu idéal pour déclarer vos variables CSS applicatives dans le bloc `:root`.
  ```scss
  /* theme.gs.avt */
  :root {
      --primary-color: #e5540e;
      --secondary-color: #2c3e50;
      --font-family: 'Outfit', sans-serif;
  }
  ```
  Ces variables traversent la frontière du Shadow DOM et peuvent être appelées dans n'importe quel fichier de style de composant (`.wcs.avt`) :
  ```scss
  /* MyButton.wcs.avt */
  :host {
      button {
          background-color: var(--primary-color);
      }
  }
  ```

---

## Générateurs de Code C# et PHP (`.sharp.avt` & `.php.avt`)

AventusJS propose des passerelles de code permettant de générer automatiquement du typage TypeScript à partir de classes C# ou PHP.

### Fichier C# Export (`aventus.sharp.avt`)
Ce fichier permet de coupler votre front Aventus avec une application .NET (C#) via la commande `av build` ou la commande manuelle du LSP `aventus.sharp.export` :
* **csProj** *(Requis)* : Chemin vers le fichier `.csproj` C#.
* **outputPath** *(Requis)* : Répertoire de destination des fichiers TypeScript générés.
* **Options par défaut** : Définissent si Aventus doit exporter par défaut les Enums (`exportEnumByDefault`), les modèles stockables (`exportStorableByDefault`), ou les routes HTTP (`exportHttpRouteByDefault`).

### Fichier PHP Export (`aventus.php.avt`)
Identique au système C#, mais permet de lire vos modèles et routes PHP (Laraventus) pour générer le code client correspondant :
* **output** *(Requis)* : Dossier où les fichiers générés seront écrits.
* **exportAsTs** : Si à `true`, génère du TypeScript.

---

## Définition officielle d'un composant Aventus (`.wcl.avt`, `.wcv.avt`, `.wcs.avt`)

### Invariants d'un composant

Tous les composants Aventus respectent les règles suivantes :

- toutes les propriétés sont initialisées
- les callbacks utilisent @BindThis
- les styles résident dans `.wcs.avt`
- les vues résident dans `.wcv.avt`
- la logique réside dans `.wcl.avt`

---

### Fichier Logique (`.wcl.avt`)
La structure de la classe doit être organisée en blocs `#region` explicites. Tout attribut ou propriété **DOIT** posséder un initialiseur.

```typescript
export class MyButton extends Aventus.WebComponent implements Aventus.DefaultComponent {
    //#region static
    //#endregion

    //#region props
    @Property()
    public label: string = "Valider"; // Initialiseur obligatoire

    @Attribute()
    public disabled: boolean = false;
    //#endregion

    //#region variables
    @ViewElement()
    protected buttonEl!: HTMLButtonElement;

    @Watch((target: MyButton, action: Aventus.WatchAction, path: string, value: any) => {
        console.log(`Donnée modifiée au chemin: ${path}`);
    })
    public data: any = {};
    //#endregion

    //#region constructor
    //#endregion

    //#region methods
    @BindThis()
    protected handleClick(event: PointerEvent) {
        if (this.disabled) return;
        this.dispatchEvent(new CustomEvent("submit", { detail: this.data }));
    }

    protected override postCreation(): void {
        // Appelé une fois que le composant est inséré dans le DOM
    }

    protected override postDestruction(): void {
        // Nettoyage automatique des abonnements
    }
    //#endregion
}
```

#### Différences clés entre les Décorateurs Réactifs :
* **`@Property()`** : Réactivité bidirectionnelle (Propriété <-> Vue). Limitée aux types primitifs (`string`, `number`, `boolean`, `Date`, `datetime`, littéraux). Ne se répercute pas sur l'attribut HTML dans le DOM par souci de performance.
* **`@Attribute()`** : Similaire à `@Property()`, mais se synchronise activement avec l'attribut HTML dans le DOM (permettant le ciblage CSS via `:host([disabled])`).
* **`@Signal(cb?)`** : Réactivité de premier niveau uniquement. Si une propriété interne d'un objet signalisé change, la vue ne se mettra pas à jour. Le callback ne prend qu'un argument : `(target) => void`.
* **`@Watch(cb?)`** : Observe en profondeur via des proxies JavaScript. Idéal pour les tableaux ou objets complexes. Détecte les modifications imbriquées. Callback complet : `(target, action, path, value) => void`.
* **`@Injectable()`** : Permet à un attribut d'être injecté depuis la vue du composant parent (ex: `:myField="this.someData"`).
* **`@ViewElement()`** : Associe le champ de classe à un élément HTML du template marqué avec `@element="nomChamp"`.
* **`@BindThis()`** : Indispensable sur toute méthode transmise comme callback ou écouteur d'événement pour garantir la conservation du contexte `this`.

### Fichier Vue (`.wcv.avt`)
Le template HTML n'utilise pas de syntaxe complexe à base d'attributs de boucle (ex: `ngFor`, `v-for`). Il utilise directement la syntaxe **JavaScript native**.

```html
<div class="container">
    <h1>{{ this.label }}</h1>

    <!-- Conditionnel en JavaScript natif -->
    if(this.disabled) {
        <span class="warning">Désactivé</span>
    } else {
        <button @element="buttonEl" @click="handleClick">Cliquez ici</button>
    }

    <!-- Boucle en JavaScript natif sans @Context -->
    <ul class="list">
        for(let item of this.items) {
            <li class="item" @click="selectItem" data-id="{{ item.id }}">
                {{ item.title }}
            </li>
        }
    </ul>

    <!-- Boucle en JavaScript natif avec @Context -->
    <ul class="list">
        for(let i = 0; i < this.items.length; i++) {
            @Context('row', item)
            <li class="item" @click="selectItem" data-id="{{ row.id }}">
                {{ row.title }}
            </li>
        }
    </ul>
</div>
```

> [!IMPORTANT]
> **Pas de paramètres dans les liaisons d'événements** : Dans les templates `.wcv.avt`, vous ne pouvez passer **que le nom de la fonction** (ex: `@click="selectItem"`), sans parenthèses ni paramètres. Pour passer des données (comme l'élément courant d'une boucle), stockez l'information dans des attributs HTML personnalisés (ex: `data-id="{{ row.id }}"`) et récupérez-les dans votre classe logique via l'événement (ex: `const id = (e.currentTarget as HTMLElement).dataset.id;`).

#### Directives et Liaisons Spécifiques :
1. **Interpolation** : `{{ this.property }}`
2. **Référence d'élément** : `@element="nameRef"` (exige `@ViewElement() protected nameRef!: HTMLElement` dans le fichier `.wcl.avt`).
3. **Événements** : `@click="methodName"`. Supporte également les `Aventus.Callback` (le compilateur cherche une propriété `customClick`, `onCustomClick` ou `oncustomClick` sur l'enfant).
4. **Liaison ascendante (One-way Injection)** : `:childProp="this.parentProp"`
5. **Liaison bidirectionnelle (Two-way Binding)** :
   * `@bind="this.parentProp"` : Liaison par défaut (valeur synchro sur événement `change`/`input`).
   * `@bind:childProp="this.parentProp"` : Liaison de la propriété spécifique `childProp` de l'enfant vers le parent.
   * `@bind_eventName="this.parentProp"` : Écoute l'événement ou le `Callback` nommé `eventName` pour mettre à jour la valeur.
   * `@bind_eventName:childProp="this.parentProp"` : Syntaxe complète pour spécifier à la fois la propriété de l'enfant et l'événement déclencheur.

### Fichier Style (`.wcs.avt`)
Tous les styles d'un composant **doivent** être scopés dans le sélecteur `:host`.

> [!TIP]
> **Déclaration des variables CSS** : Déclarez toujours les variables de variables CSS privées à votre composant (commençant par `--_`) au tout début du fichier dans un sélecteur `:host` distinct. Associez-les à des variables globales personnalisables (ex: `--_btn-bg-color: var(--btn-bg-color, var(--primary-color, #e5540e));`), puis implémentez le reste des styles et sélecteurs imbriqués dans un second sélecteur `:host` séparé.

```scss
/* Déclaration des variables CSS du composant (séparée au début du fichier) */
:host {
    --_btn-bg-color: var(--btn-bg-color, var(--primary-color, #e5540e));
    --_btn-padding: var(--btn-padding, 10px 20px);
}

/* Reste des styles du composant */
:host {
    display: block;
    padding: 10px;

    button {
        background-color: var(--_btn-bg-color);
        padding: var(--_btn-padding);
        border: none;
        
        &:hover {
            opacity: 0.9;
        }
    }
}
:host([disabled]) {
    pointer-events: none;
    opacity: 0.5;
}
```

## Héritage de Composants et View Composition

AventusJs gère l'héritage de composants de deux manières distinctes au niveau de l'affichage :

### Composition de Vue par Défaut (Slots & Blocks)
Lorsqu'un composant enfant hérite d'un composant parent :
* Le contenu de la vue de l'enfant (`.wcv.avt`) va automatiquement remplacer la balise `<slot></slot>` présente dans la vue du parent.
* Si le parent définit des slots nommés (ex: `<slot name="footer"></slot>`), l'enfant peut écraser spécifiquement ces zones en utilisant la balise `<block>` :
  ```html
  <block name="footer">
      <p>Contenu personnalisé du footer dans l'enfant</p>
  </block>
  ```
  Le contenu non enveloppé dans un `<block>` remplacera le slot par défaut.

### Remplacement de Vue complet (`@OverrideView`)
Si l'enfant souhaite réutiliser uniquement la logique du parent sans hériter de sa structure HTML, ajoutez le décorateur `@OverrideView()` au-dessus de la classe de l'enfant. Aventus ignorera alors totalement la vue du parent pour n'afficher que celle de l'enfant.

---

## Types fondamentaux : Data et RAM

### Fichier Data (`*.data.avt`)
Les structures de données doivent étendre `Aventus.Data` et implémenter `Aventus.IData`.

Objectif

Pas de logique complexe (uniquement des propriétés).
Initialisez tous les champs (utilisez `undefined` pour les champs optionnels).

Invariants

- uniquement des propriétés
- toutes initialisées
- aucune logique métier
- aucun accès HTTP
- aucun accès au DOM
- aucun accès à la RAM

```typescript
export class User extends Aventus.Data implements Aventus.IData {
    public id: number = 0;
    public firstname: string = "";
    public lastname: string = "";
    public email?: string = undefined; // Optionnel
}
```


### RAM (Base en mémoire) (`*.ram.avt`)
Le gestionnaire de RAM gère le cache et les opérations CRUD locales de manière synchrone et réactive.
* **Méthodes requises** : `defineIndexKey()` et `getTypeForData()`.
* **Règle d'accès** : Accès singleton via `Aventus.Instance.get()`.

Objectif : Fournir un stockage mémoire réactif.

Responsabilités

✔ stocke
✔ indexe
✔ retrouve

Ne doit pas

✘ faire des appels HTTP
✘ contenir une logique métier
✘ manipuler le DOM

```typescript
import { User } from "../data/User.data.avt";

export class UserRAM extends Aventus.Ram<User> implements Aventus.IRam {
    public static getInstance() {
        return Aventus.Instance.get(UserRAM);
    }

    public override defineIndexKey(): keyof User {
        return 'id';
    }

    protected override getTypeForData(json: any): new () => User {
        return User;
    }
}
```

---

## Machine à États (Navigation & Cycles de Vie)

### Définition des États (`*.state.avt`)
Chaque état est modélisé par une classe héritant de `Aventus.State`.
Un State représente un état de navigation de l'application.
Il peut également contenir les informations nécessaires aux composants associés à cet état (ViewModel de navigation).
Le State est responsable :

- de la navigation
- du cycle de vie de l'état
- des données liées à cet état de navigation

Il ne doit pas contenir de logique métier indépendante de cet état.

```typescript
export class ProfileState extends Aventus.State implements Aventus.IState {
    public override get name(): string {
        return "/profile/{userId:number}";
    }

    public override onActivate(): void {
        console.log("Navigation vers le profil lancée");
    }

    public override onInactivate(nextState: Aventus.State): void {
        console.log("Sortie du profil");
    }

    public override async askChange(state: Aventus.State, nextState: Aventus.State): Promise<boolean> {
        // Retourne false pour bloquer la transition (ex: formulaire non sauvegardé)
        return true;
    }
}

export class UserState extends Aventus.State implements Aventus.IState {
    public user: User = new User();
    public loading: boolean = false;
}
```

### Décorateurs de Méthodes de Composants
Les composants peuvent écouter les transitions des états via des décorateurs :
```typescript
import { Router } from "../states/Router.state.avt";

export class ProfileView extends Aventus.WebComponent implements Aventus.DefaultComponent {
    @StateActive("/profile/{userId:number}", Router)
    protected onProfileActive(state: Aventus.State, slugs: Aventus.StateSlug) {
        const id = slugs.userId;
        this.loadProfile(id);
    }

    @StateInactive("/profile/*", Router)
    protected onProfileInactive() {
        this.clearData();
    }

    @StateChange("/profile/*", Router)
    protected async confirmLeave() {
        return confirm("Quitter sans enregistrer ?");
    }
}
```

---

## Communication HTTP et Gestion des Erreurs

AventusJs propose une surcouche typée au-dessus de l'API `fetch` et interdit l'usage abusif de `try/catch` grâce à des structures de retours sécurisées.

### Abstraction HTTP (`HttpRouter` & `HttpRoute`)
Les requêtes réseau s'organisent en routeurs et contrôleurs de routes (Routes).
```typescript
// src/http/UserRoute.lib.avt
export class UserRoute extends Aventus.HttpRoute {
    public constructor() {
        super(new Aventus.HttpRouter({ url: "/api" }));
    }

    @BindThis()
    public async getById(id: number): Promise<Aventus.ResultWithError<User>> {
        const req = new Aventus.HttpRequest(`/users/${id}`, Aventus.HttpMethod.GET);
        return await req.queryJSON<User>(this.router);
    }
}
```

### Types de Retour d'Erreur
* **`Aventus.GenericError<TEnum>`** : Modélise une erreur avec un code défini par un énuméré et un message.
* **`Aventus.VoidWithError`** : Pour les opérations ne retournant rien mais pouvant échouer.
* **`Aventus.ResultWithError<T, TError>`** : Pour les opérations retournant une donnée `T` ou des erreurs.

Les erreurs doivent être propagées via les types Aventus.
Éviter les try/catch lorsqu'un type ResultWithError est disponible.
Préférer les types de retour Aventus aux exceptions.

```typescript
const result = await UserRoute.getInstance().getById(12);
if (result.success) {
    // result.result est typé comme User et garanti disponible
    console.log(result.result.firstname);
} else {
    // result.errors contient un tableau de GenericError
    console.error(result.errors[0].message);
}
```

---

# Vérification finale

Avant de considérer un code comme terminé :

1. Corriger tous les diagnostics Aventus.
2. Vérifier que toutes les API utilisées existent.
3. Vérifier que les dépendances ont été chargées.
4. Vérifier qu'aucune syntaxe interdite n'est utilisée.

## Validation du code (CRITICAL)

L'assistant doit toujours utiliser la meilleure source de diagnostics disponible.

Pour vérifier ponctuellement un projet :

```bash
av check
```

Pour un développement interactif (humain ou IA), utiliser de préférence :

```bash
av watch
```

Le mode `watch` maintient la vérification active et met automatiquement à jour les diagnostics après chaque modification.

Si un serveur de langage Aventus est disponible, ses diagnostics sont équivalents à ceux de `av check`.

Ordre de priorité :

1. Serveur de langage Aventus (LSP)
2. `av watch`
3. `av check`

Ne jamais considérer un projet comme valide tant que des diagnostics Aventus sont présents.

---

## CLI Aventus : Résumé des Commandes Possibles

La ligne de commande `av` pilote le serveur de langage (LSP) et la compilation du framework.

### Commandes de Compilation et Validation
* **`av build [configPath]`** : Lance la compilation des modules configurés dans `aventus.conf.avt`.
  * *Options :*
    * `--builds <name...>` : Cible un ou des builds spécifiques.
    * `--no-builds` : Désactive la compilation des builds.
    * `--statics <name...>` : Exporte uniquement les fichiers statiques spécifiés.
    * `--no-statics` : Ne traite pas les fichiers statiques.
    * `-v`, `--verbose` : Affiche les informations détaillées de debug.
    * `-s`, `--silent` : N'affiche aucun log sur la sortie standard.
    * `--json` : Renvoie les résultats compilés au format JSON.
* **`av watch [configPath]`** : Lance la compilation des modules configurés dans `aventus.conf.avt` en mode watch.
  * *Options :*
    * `--builds <name...>` : Cible des builds précis.
    * `--json` : Sortie des erreurs sous format structuré JSON.
* **`av check [configPath]`** : Effectue une vérification complète du typage et des règles de compilation sans écrire de fichiers sur le disque.
  * *Options :*
    * `--builds <name...>` : Cible des builds précis.
    * `--json` : Sortie des erreurs sous format structuré JSON.

### Commandes d'Édition et de Développement
* **`av dev [configPath]`** : Démarre le serveur en mode interactif. Permet de suivre en direct les builds, de générer dynamiquement des templates d'éléments Aventus, et d'accéder à l'historique complet des logs de compilation.
* **`av serve`** : Démarre le serveur local de live reload pour tester l'application directement dans le navigateur.
* **`av format [configPath]`** : Applique le formateur de code configuré sur l'ensemble des fichiers du projet.
* **`av create`** : Outil interactif de scaffolding permettant de créer rapidement un composant, une classe de données, un état ou une RAM depuis un template.

### Commandes Cloud et Publication (Aventus Store)
* **`av store login`** : Ouvre la connexion à la boutique de packages Aventus.
  * *Options :*
    * `-u`, `--username <string>` : Nom d'utilisateur.
    * `-p`, `--password <string>` : Mot de passe.
* **`av store logout`** : Déconnexion de la boutique de packages Aventus.
* **`av store publish`** : Compile et publie le package courant sur l'Aventus Store.

### Commandes Templates et Dépendances Externes
* **`av project install`** : Importe et installe les fichiers de démarrage et de structure d'un projet.
* **`av project uninstall`** : Supprime la configuration de base installée.
* **`av template install`** : Télécharge et configure de nouveaux modèles d'éléments au sein du projet.
* **`av template uninstall`** : Désinstalle les modèles installés.

### Commande d'Aide Spécifique IA
* **`av dependencies help-llm [configPath]`** : Génère automatiquement des fichiers `.md` simplifiés dans `.aventus/dependencies` pour donner aux modèles de langage (LLMs) l'accès à la signature exacte de tous les packages externes importés dans `aventus.conf.avt`.

---

# Principes généraux

Ces règles définissent uniquement le fonctionnement officiel d'AventusJs.
Elles ne définissent pas :

- une architecture logicielle
- une organisation des dossiers
- un style de programmation
- une méthodologie de développement

Les utilisateurs peuvent ajouter leurs propres conventions tant qu'elles ne contredisent pas les règles décrites dans ce document.
Lorsqu'une convention utilisateur entre en conflit avec une règle officielle d'AventusJs, la règle officielle prévaut.