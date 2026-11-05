# Projet Aventus de référence pour le runtime

Ce projet réunit des cas compilés pour les composants (dont l'héritage et `@OverrideView`), les templates, les styles, les états, les données, la RAM, les utilitaires, les conteneurs d'erreur et les fichiers statiques du langage. Le test `tests/runtime/compiled-project.test.mjs` en fait une copie temporaire, lance le CLI du dépôt, vérifie la sortie et supprime la copie après exécution. Les exemples volontairement invalides sont conservés sous `cases/` puis injectés dans la copie par leur test dédié.

`RuntimeNamedState.state.avt` et `RuntimeStateCases.lib.avt` exercent les transitions d'état documentées ; `RuntimeRamCallbacks.lib.avt` vérifie les callbacks des éléments RAM après compilation.
`RuntimeCoreUtilities.lib.avt` vérifie `Instance` et `Watcher` dans le bundle ; `cases/resource-loader-import` vérifie le chargement et le cache après import explicite de `ResourceLoader`.
`RuntimeDecoratorMetadata.lib.avt` et `cases/no-compile` vérifient `@NoType`, `@Deprecated` et `@NoCompile` dans les contextes traités par le LSP.
`RuntimeInjectable.wc.avt`, `RuntimeForeignKey.data.avt` et `RuntimeInternalProtected.lib.avt` vérifient respectivement la documentation des injections, le schéma de référence et la visibilité des définitions générées. `RuntimeEffectPlain.wcl.avt` exerce l'initialisation d'un effet ; `RuntimeEffect.wcl.avt` vérifie sa lecture d'un signal initialisé. `cases/storybook-decorators` vérifie les annotations Storybook avant de reproduire l'absence d'export live.
`cases/attribute-types` vérifie les attributs de type chaîne, littéral, `Date`, `DateTime` et `Time`, ainsi qu'une propriété `Date`, après import explicite de ces classes depuis le package Main.
Les sorties i18n `singleFile`, `oneToOne` et `groupComponent` sont générées dans `dist/translations` sur des copies temporaires ; les tests vérifient les traductions globales et celles du composant dans chaque mode.
Les cas `cases/no-component`, `cases/invalid-view`, `cases/invalid-parent`, `cases/duplicate-name` et `cases/missing-fullname` isolent les diagnostics du compilateur. `cases/invalid-config` caractérise le succès CLI erroné pour un JSON incomplet. `cases/static-npm` vérifie la déclaration `.defnpm.avt` voisine du fichier statique dans la sortie npm.
`cases/generic-ram` compile la variante `Aventus.GenericRam<string, …>` documentée pour les clés non numériques et vérifie ses opérations CRUD dans Chromium.
Les sorties multiples `compile.output`, `compile.package` et `compile.outputNpm.path` sont générées sur des copies temporaires et comparées ou importées par les tests.
`RuntimeFillable`, `RuntimeTextFillable` et `RuntimeNumberFillable` exercent une base abstraite générique avec méthode déléguée par `@Watch`, callbacks et vue héritée.
`RuntimeMarkup` vérifie aussi `@ViewElement({ useLive: true })` après remplacement d'un nœud du shadow DOM avec conservation de son identifiant généré.

Le cas `cases/ui-dependency` est injecté uniquement dans ses tests : il déclare `Aventus@UI` comme dépendance du build, importe `ProgressCircle` ou `Collapse` depuis son package et vérifie leur comportement dans Chromium.
Le même dossier fournit `Img` : les tests comparent chargement raster direct et cache via `ResourceLoader`, sélection des modes et variable CSS SVG.
Le cas `cases/static-assets` contient un fichier HTML et deux fichiers Sass injectés dans `static/` pour vérifier la copie et la compilation des ressources statiques.
Le cas `cases/avoid-tag` vérifie qu'un tag configuré avec `avoidParsingInsideTags` garde le texte des directives du template sans empêcher la réactivité à l'extérieur.
Le cas `cases/local-package` importe un package produit par une première copie du projet ; le test compare un build consommateur témoin avec les builds qui déclarent cette dépendance locale.
Le cas `cases/ui-toast` ajoute une sous-classe de `ToastElement` avec une vue, utilisée pour vérifier l'affichage et la fermeture des notifications du package UI.
Le cas `cases/ui-button` ajoute une sous-classe de `ButtonElement` avec une vue et vérifie sa soumission native ainsi que les interactions clavier et pointeur.
Le cas `cases/ui-form-element` ajoute une sous-classe de `FormElement` avec une validation locale et vérifie sa valeur et sa validité dans un formulaire natif, ainsi que sa synchronisation avec `FormHandler`.
Le cas `cases/ui-dependency/RuntimeUiGridHelper.lib.avt` importe `GridHelper` et vérifie sa grille, ses conversions d'unités, ses raccourcis, le déplacement et la persistance des guides dans Chromium, avec et sans `ResizeObserver` simulé.
Le cas `cases/ui-modal` ajoute deux sous-classes de `ModalElement` et vérifie l'affichage, les modes de fermeture, la touche Échap et les options globales.
Le cas `cases/ui-page` vérifie l'import de `Page` depuis le package UI et ses transitions de visibilité.
Le cas `cases/ui-page` contient une sous-classe de routeur fonctionnelle.
Le cas `cases/ui-tabs` fournit des sous-classes concrètes de `Tabs`, `Tab` et `TabHeader`, puis vérifie la sélection et les changements de contenu dans Chromium.

Les tests de rendu exécutent le bundle compilé dans Chromium avec Playwright. Avant le premier `npm run test:runtime`, installer le navigateur avec `npm run test:runtime:install-browser`.

Pour inspecter manuellement le JavaScript généré depuis ce dossier :

```powershell
node ../../../../cli/out/cli.js build aventus.conf.avt --json
```

La sortie est `dist/runtime-reference.js`. Ne pas modifier ce fichier généré ; modifier les fichiers `.avt` du projet de référence puis relancer la compilation.
