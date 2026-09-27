# Composants natifs

Un composant `.wcl.avt` ou `.wc.avt` qui hérite directement de
`Aventus.NativeWebComponent` utilise automatiquement `compilerSimple`.
Il n'a pas besoin d'implémenter `Aventus.DefaultComponent`.

À la compilation et à l'enregistrement, `Counter.native.js` est écrit à côté
du fichier logique. Son contenu peut être copié dans un script JavaScript
classique, ou chargé avec `<script src="Counter.native.js"></script>`.
Il enregistre `<demo-counter>` et ne nécessite pas le runtime Aventus.
Le HTML et le CSS compilés sont inclus dans son Shadow DOM ouvert.

L'exemple dans `src/` montre les fonctionnalités prises en charge :

- `@element="button"` et `@ViewElement()` pour accéder à un élément de la vue.
- `@click="increment"` pour un événement DOM, avec `this` lié au composant.
- `@Attribute()` pour une valeur réfléchie en attribut HTML.
- `@Property(callback)` pour la même réflexion, avec notification des changements.
- `postCreation`, appelé une fois après la préparation de la vue, puis
  `postConnect` et `postDisconnect` à chaque connexion et déconnexion.

Les attributs et propriétés acceptent `string`, `number`, `boolean`, leurs
littéraux, unions homogènes et alias. Leurs noms doivent être en minuscules.
Un booléen vaut vrai si l'attribut est présent. Les valeurs initiales du HTML
priment sur les valeurs par défaut. Les propriétés définies avant
`customElements.define` sont récupérées à la première connexion.
Les callbacks de propriétés commencent après la préparation des sélecteurs.
Les changements de `@Attribute` ne déclenchent pas de callback.

Les boucles, conditions, interpolations, injections, liaisons bidirectionnelles,
événements press, états, signaux et effets produisent une erreur de compilation.
Les déclarations de types sont permises, mais un fichier contient une seule
classe de composant concrète et aucun enum ou classe auxiliaire à exécuter.
Les dépendances utilisées explicitement par le code utilisateur ne sont pas
embarquées dans le fichier natif : elles doivent être disponibles dans le script
de destination. Le rechargement des composants natifs demande un rechargement
de la page.

Vérification depuis la racine du dépôt :

```powershell
node node_modules/rolldown/bin/cli.mjs -c cli/rolldown.config.mjs
node cli/out/cli.js build server/tests/fixtures/native/aventus.conf.avt --no-statics
node server/tests/native-component.cjs
node node_modules/typescript/bin/tsc --project server/tsconfig.json --noEmit
```

Les tests de runtime utilisent un DOM simulé et vérifient également le vrai
fichier généré par le CLI lorsqu'il est présent.
