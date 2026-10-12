# Cas serveur en attente de changement de code

Ce fichier conserve les cas reproductibles rencontrés pendant l'écriture des tests. Les changements de `server/src` pour ces points sont décidés avec l'utilisateur, un par un.

## Scénarios d'intégration encore ouverts

- Le protocole est testé au niveau des handlers et de l'adaptateur VS Code simulé. Un échange JSON-RPC réel avec `server.ts` reste à vérifier dans un processus isolé.
- Le renommage détecté sur disque, la sélection de tous les services par extension et les projets complets demandent encore des fixtures intégrées. La fenêtre de deux secondes de `FilesManager.preventUpdateUri` est testée fonctionnellement sans horloge simulée pour sa durée exacte.
- La compilation SCSS complète, les liens vue/classe/style, les composants HTML enregistrés dynamiquement et leurs interactions avec les builds demandent des fixtures de projet intégrées. Le chargement isolé du service HTML en bundle CommonJS échoue sur une dépendance circulaire ; cela ne démontre pas un défaut à l'exécution du serveur.
- Le test HTTP de traversée de chemin confirme l'absence de divulgation ; le middleware journalise toutefois `ForbiddenError` sur stderr. Décider si ce journal est acceptable.
- La génération Storybook est testée au niveau des titres et contenus MDX/stories. La copie complète des ressources depuis l'extension et la mise à jour après suppression demandent une fixture intégrée.
- Les scénarios TypeScript avec plusieurs vrais fichiers et le service LSP complet restent à couvrir avec un banc d'intégration. Le chargement direct de `ParserTs.ts` en bundle CommonJS échoue sur l'ordre d'une dépendance circulaire ; le chargement conjoint de `FileSelector.ts` et `ParserTs.ts` fonctionne et sert déjà aux tests du modèle.
- `AventusTsFileSelector` renvoie `null` pour `.wc`, `.package` et `.template`. Déterminer si leur routage relève d'autres gestionnaires (probable) ou de ce sélecteur, puis le vérifier avec des fixtures ciblées.

## Intégrations encore à compléter après le deuxième passage

- Le processus serveur échange désormais de vraies trames JSON-RPC pour `initialize`, `didOpen`, `didChange`, `didClose` et `hover`. L'initialisation complète d'un espace, la validation du contenu et les diagnostics de service restent à vérifier.
- La sélection et l'installation de templates/projets locaux sont testées avec dossiers temporaires. L'exécution réelle du script dans son processus enfant, l'import Git/Store et le remplacement d'une installation restent à couvrir.
- Le package Aventus est généré, relu et reconstruit dans les tests. Un build multi-fichiers complet avec vues, styles, npm et dépendances reste à vérifier.
- Le modèle et une compilation simple TypeScript, la complétion et le formatage HTML, ainsi que les liens HTML–SCSS sont testés. Les décorateurs, composants complets, boucles conditionnelles et liens vue/classe restent à couvrir avec une fixture de projet.

## Espaces de travail imbriqués

- Source : `server/src/files/FilesManager.ts`, `loadAllAventusConfigFiles` et `loadAllAventusFiles`.
- Reproduction automatisée : `files-multiworkspace-round4.test.mjs` fournit des racines parent et enfant et récupère deux objets distincts pour la même URI de configuration.
- Un second test observe deux tentatives d'enregistrement pour chaque fichier enfant, configuration comprise, dans `loadAllAventusFiles`. Avec le cache réel, un troisième test confirme qu'un fichier logique déclenche une création puis un callback de changement de contenu sans changement réel. Définir si les racines ou les URI découvertes doivent être dédupliquées.

## Découverte avec `readDirs` dans le répertoire temporaire du sandbox Windows

- Source à examiner si nécessaire : `server/src/files/FilesManager.ts`, méthode `parseWorkspace`.
- Observation : une fixture créée dans le répertoire temporaire fourni par le sandbox Windows renvoyait une liste vide avec `readDirs: ['src']`, alors que la même fixture créée dans le répertoire du projet découvre correctement la configuration de `src` et ignore le dossier voisin. Hors sandbox, la fixture temporaire réussissait également.
- Le test `files-workspace-lifecycle.test.mjs` utilise désormais un répertoire temporaire dans le projet et vérifie le résultat positif sur toutes les plateformes. La cause du comportement propre au chemin temporaire du sandbox n'est pas établie ; aucune modification du serveur n'est proposée sur cette seule observation.

## Enums et variables absents de la documentation des packages

- Source : `server/src/manifest/ManifestPackage.ts`, constructeur de `ManifestPackageMd`.
- Reproduction automatisée : `manifest-package-exports-round34.test.mjs` fournit une classe, une fonction, un enum et une variable exportés. Le Markdown contient la classe et la fonction, mais pas l'enum `Mode` ni la variable `VERSION`.
- Les branches `InfoType.enum` et `InfoType.variable` sont commentées. Décision à prendre : définir leur format dans l'aperçu et les sections détaillées, puis activer leur génération.

## Installation de l'environnement non attendue par son appelant

- Source : `server/src/environment.ts`, `initEnvironnment` appelle `installEnvironment(...)` sans `await` dans son bloc `try`.
- `environment-unix-round34.test.mjs` couvre l'écriture du profil Bash dans un dossier temporaire isolé. Un second test exécute l'initialiseur dans un processus enfant sans `HOME` : le rejet non intercepté termine le processus avec le code 1, ce qui confirme qu'il échappe au `catch`.
- Décision à prendre : attendre l'installation pour garantir sa fin et la remontée des erreurs, puis tester une erreur de fichier ou de profil sans toucher au profil utilisateur réel.

## Sorties statiques conservées après rechargement d'un projet

- Source : `server/src/project/Project.ts`, `loadConfig` et `onConfigSave`.
- Reproduction automatisée : `project-config-build-static-round33.test.mjs` charge deux builds et deux sorties statiques. Après une configuration qui les remplace par un build et une sortie, `getBuildsName()` ne contient que le nouveau build, mais `getStaticsName()` contient encore les deux anciennes sorties. Une configuration invalide supprime les builds et laisse les trois sorties statiques.
- `project-config-filters-round55.test.mjs` confirme qu'une sortie statique précédemment autorisée reste aussi exportée par `buildAll()` après changement de `staticsAllowed`, puis subsiste après configuration invalide.
- `static-config-destination-round88.test.mjs` confirme qu'un simple changement de destination avec le même nom crée un second export actif : `buildAll()` met ensuite à jour l'ancienne et la nouvelle destination.
- `project-manager-build-lists-round75.test.mjs` confirme que l'agrégation de deux projets garde les URI correctes pour les builds, Storybook et npm, mais retourne deux fois la sortie `assets` du projet rechargé tandis que l'autre projet conserve sa propre sortie.
- Les anciens objets `Static` restent accessibles à `getStatic` et `buildAll` même après `destroy()` ; le test vérifie que `buildAll()` réexporte les trois anciennes sorties après invalidation. Décision à prendre : vider la collection au rechargement et à l'invalidation, puis préciser le sort des fichiers déjà produits.

## Condition HTML externe perdue avec une boucle interne

- Reproduction automatisée : `html-nested-controls-round33.test.mjs` parse `if (ready) { for (const item of items) { <li>{{item}}</li> } }`. Le code compilé contient le contrôle externe, mais `ifs[0].conditions` est vide. Dans l'ordre inverse, la condition interne `item.active` est conservée.
- Source à examiner : `server/src/language-services/html/parser/ParserHtml.ts`. Décider comment préserver les conditions des contrôles parents dans les structures imbriquées.

## Expression HTML invalide sans erreur du parseur isolé

- Reproduction automatisée : `html-nested-controls-round33.test.mjs` constate que `ParserHtml.parse` renvoie `errors: []` pour `<div :value="{{bad(}}"></div>`.
- Décision à prendre : vérifier si la validation TypeScript ultérieure doit produire le diagnostic et définir sa plage source. Ce constat ne prouve pas l'absence de diagnostic dans le LSP complet.

## Valeurs textuelles des options du décorateur `OverrideView`

- Reproduction automatisée : `ts-decorators-options-round33.test.mjs` parse `@OverrideView({"removeViewVariables":["title","button"]})`. La clé quotée est désormais reconnue, mais les éléments de la liste conservent les guillemets dans leurs valeurs (`'"title"'`, `'"button"'`). `@I18n({"autoInit":false})` fonctionne après la normalisation des clés.
- Décision à prendre : décoder les valeurs textuelles des objets et tableaux produits par le parseur, puis vérifier l'effet de `OverrideView`.

## Mise à jour partielle de sorties après une erreur d'écriture

- Reproduction automatisée : `build-error-recovery-round32.test.mjs` échoue sur l'écriture de la seconde configuration. La première sortie contient déjà la nouvelle révision, la seconde conserve l'ancienne, et aucune notification `aventus/compiled` n'annonce ce passage. Le build suivant réécrit correctement les deux sorties.
- Décision à prendre : préciser si cet état partiel doit être signalé explicitement ou si les sorties doivent être publiées ensemble après toutes les écritures réussies.

## Branche imbriquée absente dans un `Map`

- Source : `server/src/tools.ts`, `setValueToObject`.
- Reproduction automatisée : `tools-path-alias-round26.test.mjs` appelle `setValueToObject('parent.child', map, 42)` sur un `Map` vide. La branche est créée comme propriété `map.parent`, tandis que `map.get('parent')` reste `undefined`. Une clé simple est correctement ajoutée au `Map`.
- Décision à prendre : déterminer si la fonction doit accepter un `Map` comme conteneur racine pour un chemin imbriqué ; si oui, créer les branches avec `Map.set` et adapter le test au résultat attendu.

## Observation du contenu et des callbacks dans le cycle LSP

- `jsonrpc-document-cycle-round30.test.mjs` traverse un vrai processus LSP : `didOpen`, deux `didChange`, `didSave`, suppression et `didClose`. Les diagnostics successifs prouvent indirectement l'application des contenus et leur effacement final.
- Le protocole ne renvoie ni version/contenu du cache ni accusé de traitement de `didSave` ; ce test ne peut donc pas attester directement le callback de sauvegarde. Les tests unitaires de `FilesManager` couvrent ce chemin séparément.
- Décision éventuelle : exposer un état ou une commande de diagnostic uniquement si la vérification bout en bout de ce callback est exigée. Aucun changement n'est requis par les assertions actuelles.

## Première sauvegarde d'un document absent du cache

- Source : `server/src/files/FilesManager.ts`, méthode `onSave`.
- Reproduction : `files-protocol-audit-round27.test.mjs` enregistre un callback `onSave` lors de `onNewFile`, puis sauvegarde un document absent du cache. Le fichier est créé, mais le callback de sauvegarde ne s'exécute qu'au second `onSave`.
- Décision à prendre : déterminer si le premier `didSave` doit également lancer les traitements de sauvegarde après l'enregistrement du fichier.

## Namespace npm voisin ajouté comme enfant du mauvais point d'entrée

- Reproduction automatisée : `npm-namespace-prefix-round97.test.mjs` génère `Catalog.UI` et `Catalog.UIExtra.Widget`. Les `index.js` et `index.d.ts` de `Catalog/UI` importent alors `./Widget`, qui n'existe que sous `Catalog/UIExtra/Widget` ; le point d'entrée UI est invalide.
- Source : `server/src/project/Build.ts`, `writeBuildNpm()`, fonctions `createFileDef` et `createFileJs`. Le filtre `key.startsWith(_namespace)` compare un préfixe de chaîne sans frontière `.`.
- Décision à prendre : limiter la recherche des enfants aux clés qui commencent par le namespace suivi d'un point, puis vérifier les sorties JavaScript et de types.

## Sources npm obsolètes après reconstruction

- Reproduction automatisée : `build-npm-package-round26.test.mjs` écrit un package avec `__src/obsolete.ts`, puis reconstruit les mêmes sorties sans cette source. `index.js` est actualisé, mais `__src/obsolete.ts` reste présent dans chaque destination.
- Reproduction complémentaire : `npm-entry-rebuild-round69.test.mjs` remplace le namespace `Catalog.Legacy` par `Catalog.Current`. Le point d'entrée parent retire bien `Legacy`, mais `Catalog/Legacy/index.js` reste sur disque dans chaque destination.
- Source : `server/src/project/Build.ts`, `writeBuildNpm`. La suppression préalable de `__src` est commentée.
- Décision à prendre : préciser si la reconstruction doit supprimer les sources et anciens points d'entrée générés devenus obsolètes tout en préservant d'éventuels fichiers utilisateur. Après correction, exiger leur absence dans toutes les destinations.

## Recherche de texte adjacente à une position contenant des espaces

- Source : `server/src/tools.ts`, `checkTxtBefore` et `checkTxtAfter`.
- Reproduction automatisée : `tools-adjacent-whitespace-round29.test.mjs` lance chaque recherche dans un worker isolé et constate qu'elle ne revient pas après avoir atteint un espace. Les deux boucles exécutent `continue` sans modifier `offset`.
- Décision à prendre : avancer ou reculer l'offset sur les espaces, puis remplacer le test de caractérisation par des assertions sur les résultats et les positions.

## Extraction des propriétés CSS de `:host` après un préfixe blanc

- Source : `server/src/language-services/scss/LanguageService.ts`, `AventusSCSSLanguageService.getCustomProperty`.
- Reproduction : `scss-component-boundaries-round24.test.mjs` extrait `--accent` de `:host { --internal-accent: var(--accent, red); }`, mais renvoie une liste vide si la feuille commence par `\n  `.
- Cause possible à confirmer : le parcours démarre avec `getNodePath(doc, 0)`, hors de la règle après les blancs. Décider si la racine SCSS doit être parcourue indépendamment de l'offset initial, puis exiger l'extraction dans les deux cas.

## Types des valeurs de traduction i18n

- Source : `server/src/language-services/i18n/schema.ts` et `LanguageService.ts`.
- Reproduction automatisée : `i18n-schema-round23.test.mjs` constate qu'une traduction numérique (`23`) ne produit aucun diagnostic et qu'une valeur booléenne (`false`) n'est pas signalée ; seul le manque de la locale `fr` est rapporté dans le second cas.
- Décision à prendre : préciser si les traductions doivent obligatoirement être des chaînes. Si oui, compléter le schéma et vérifier les diagnostics à la plage de la valeur fautive.

## Clés i18n homonymes entre fichiers globaux

- Reproduction automatisée : `i18n-cross-files-round39.test.mjs` enregistre deux fichiers globaux avec la même clé. Les diagnostics restent propres à chaque fichier ; l'export `singleFile` garde la dernière valeur enregistrée pour une locale, tandis que `oneToOne` produit deux sorties distinctes.
- Décision à prendre : autoriser explicitement la surcharge selon l'ordre d'enregistrement ou signaler le doublon entre fichiers. Un test normatif pourra être ajouté après ce choix.

## Export i18n conservé pendant une erreur JSON

- Reproduction automatisée : `i18n-invalid-export-round57.test.mjs` rend invalide un fichier i18n précédemment valide. Les diagnostics signalent l'erreur, mais `translation.exported` et `keys` conservent les valeurs antérieures jusqu'à la correction du JSON.
- Décision à prendre : garder explicitement la dernière traduction valide durant l'édition, ou invalider les exports et les clés dès que le document contient une erreur.

## Documentation des packages contenant seulement des fonctions

- Source : `server/src/manifest/ManifestPackage.ts`, `ManifestPackageMd`.
- Reproduction automatisée : `manifest-package.test.mjs` exporte uniquement une fonction TypeScript documentée.
- Résultat actuel : `loadFunction` ajoute la fonction aux parties détaillées, mais pas aux aperçus. Le constructeur n'écrit le Markdown que si un aperçu existe ; il renvoie donc une chaîne vide. La même fonction est bien documentée lorsqu'une classe figure aussi dans le package.
- Résultat attendu à confirmer : produire l'aperçu et la documentation des fonctions même sans classe exportée.

## Ancre de l'aperçu Markdown pour une classe générique de package

- Reproduction automatisée : `manifest-package-markdown-lifecycle-round74.test.mjs` documente `Demo.Card<T extends string = string>` et vérifie que l'aperçu produit le lien `[Demo.Card](demo.card)` tandis que le titre détaillé contient les paramètres génériques.
- Résultat actuel : l'ancre calculée depuis le titre Markdown inclut aussi les paramètres génériques ; le lien de l'aperçu omet ces paramètres et ne pointe donc pas vers le titre dans les moteurs Markdown qui dérivent les ancres des titres complets.
- Décision à prendre : générer une ancre explicite stable pour chaque déclaration, ou construire le lien depuis le titre effectivement émis, en tenant compte des règles du moteur Markdown visé.

## Définition locale dans un script de template

- Reproduction automatisée : `template-script-navigation-round46.test.mjs` obtient la définition d'un membre de `AventusTemplate.d.ts`, mais reçoit `null` pour une propriété déclarée dans le `template.avt.ts` ouvert.
- Source : `server/src/language-services/ts/template/LanguageService.ts`, `findDefinition()` demande `loadLibrary(d.fileName)` et écarte la définition locale lorsque ce chargement échoue.
- Décision à prendre : préciser si la navigation vers les déclarations du script courant doit être prise en charge ; si oui, retourner la position dans le document ouvert.

## Builds dupliqués après sauvegarde d'une configuration identique

- Reproduction automatisée : `project-config-subscriptions-round47.test.mjs` crée deux builds, charge une autre configuration à deux builds, puis la sauvegarde de nouveau sans changement. `getBuildsName()` contient alors chaque build deux fois et les sorties statiques s'accumulent ; lors de l'invalidation suivante, les anciens identifiants d'abonnement sont retirés une seconde fois.
- Cause probable : `Project.loadConfig()` revient tôt pour une configuration identique, tandis que `onConfigSave()` ajoute des objets sans vider `this.builds`.
- Décision à prendre : conserver les objets et abonnements sur une sauvegarde identique, ou reconstruire la collection sans doublons. Vérifier ensuite noms, identités et abonnements.

## Vue absente à l'ouverture d'un composant en fichier unique

- Reproduction automatisée : `component-format-equivalence-round48.test.mjs` ouvre un composant contenant `<template>`, script et style. Les régions extraites compilent comme les fichiers séparés, mais `AventusWebComponentSingleFile.view` reste `undefined` après construction.
- Source : `server/src/language-services/ts/component/SingleFile.ts`, `getDocuments()` déclare un second `let html` dans le bloc du template et masque la valeur retournée.
- Décision à prendre : rattacher la vue dès l'ouverture et vérifier l'équivalence complète du cycle du composant.

## Découverte locale de templates qui remplace le registre général

- Reproduction automatisée : `template-priority-round48.test.mjs` trouve un nom identique dans les dossiers installés et locaux pour les trois familles de templates. La découverte locale remplace l'entrée du registre général et le compteur vaut 2 pour un seul nom accessible.
- Décision à prendre : isoler le registre par workspace et compter les noms uniques, ou conserver explicitement cette priorité et compter les scripts lus.

## Notification LSP de paramètres terminée avant leur chargement

- Reproduction automatisée : `lsp-settings-live-round48.test.mjs` diffère la réponse du client pendant `GenericServer.onDidChangeConfiguration()`. Le gestionnaire rend la main avant l'application des nouveaux paramètres et données HTML.
- Source : `server/src/GenericServer.ts`, appel à `loadSettings()` sans attendre sa promesse.
- Décision à prendre : garantir que les requêtes suivantes voient les paramètres rechargés en attendant la fin du chargement, ou documenter ce délai.

## Import consommateur obsolète après fusion d'un composant

- Reproduction automatisée : `component-command-cycle-round51.test.mjs` sépare `Alpha`, renomme son dossier et met à jour l'import de `Beta`, puis fusionne `Alpha` en `Alpha.wc.avt` à la racine. L'ancien dossier est supprimé, mais `Beta` importe encore `./Renamed/Alpha.wcl.avt`.
- Décision à prendre : déterminer si la commande de fusion doit réécrire les imports des autres composants du projet ; si oui, vérifier les éditions et la résolution des références après fusion.

## Définition HTML renvoyée vers le style après suppression de la logique

- Reproduction automatisée : `html-navigation-source-lifecycle-round54.test.mjs` résout `@click="submit"` vers la méthode TypeScript tant que la logique existe. Après suppression de cette source, la même demande de définition retourne le sélecteur SCSS `.card` du composant ; le rattachement de la logique rétablit la définition initiale.
- Décision à prendre : lorsqu'une méthode d'événement n'a plus de source logique, ne renvoyer aucune définition ou un diagnostic adapté, plutôt qu'une position dans la feuille de style.

## Cache de package conservé après suppression du fichier

- Reproduction automatisée : `file-type-recreation-round55.test.mjs` charge un fichier `.package`, le supprime via `triggerDelete()`, puis constate que `DependencyManager.loadedPackages['Demo@web']` référence encore l'ancien objet. Un nouveau chargement remplace l'entrée.
- Décision à prendre : invalider immédiatement le cache au retrait du package, ou documenter sa validité jusqu'au prochain chargement ; vérifier alors les imports et dépendances entre ces deux événements.

## Seconde préparation d'un même template bloquée

- Reproduction automatisée : `template-failure-recovery-round58.test.mjs` prépare un template, l'exécute, puis appelle de nouveau `prepareScript()` sur le même fichier. La seconde promesse reste en attente.
- Source : `server/src/files/Template.ts`, `TemplateScript.preparing[name]` reste défini comme tableau vide après la première préparation. L'appel suivant ajoute un callback à ce tableau sans démarrer de nouvelle préparation.
- Décision à prendre : supprimer l'entrée après la préparation ou retourner une valeur déjà prête selon la durée de vie voulue du cache ; vérifier ensuite la reprise après correction ou modification du template.

## Export statique annoncé terminé après échec partiel

- Reproduction automatisée : `static-partial-destination-recovery-round59.test.mjs` copie un binaire vers deux destinations dont une est bloquée par un fichier. L'autre copie réussit, mais l'export global envoie tout de même `reload` et `staticTime`. Après déblocage, un nouvel export écrit les deux sorties.
- Décision à prendre : signaler l'échec partiel au client et ne publier une fin réussie que lorsque toutes les destinations demandées ont été écrites, ou documenter explicitement une réussite partielle.

## Découverte dupliquée dans des espaces de travail imbriqués

- Reproduction automatisée : `files-overlapping-workspaces-round61.test.mjs` charge un espace parent et son sous-dossier comme deux racines. La même configuration est découverte deux fois et chaque fichier est soumis deux fois à l'enregistrement.
- Décision à prendre : dédupliquer les URI pendant la découverte entre racines recouvrantes, ou définir les événements multiples comme comportement attendu ; vérifier ensuite l'absence de traitements et diagnostics dupliqués.

## Positions des expressions HTML décalées dans les attributs

- Reproduction automatisée : `html-expression-identity-round62.test.mjs` relève les positions de `{{value}}` dans des attributs simples et répétés. Chaque plage retournée par `ParserHtml.fcts` commence et finit un caractère avant l'expression réelle ; l'écart persiste après une édition du document. Les tests vérifient l'identité des actions et caractérisent le décalage actuel.
- Décision à prendre : corriger l'origine du décalage dans le calcul de `valueStart` ou formaliser que ces plages utilisent un autre repère ; vérifier ensuite les diagnostics et la navigation qui les consomment.

## Sortie de build conservée après suppression d'une source disque

- Reproduction automatisée : `build-disk-lifecycle-round62.test.mjs` crée puis modifie un fichier logique sur disque ; la sortie est reconstruite à chaque sauvegarde. Sa suppression déclenche une reconstruction mais celle-ci lit encore la source dans le cache de `FilesManager`. Le fichier disparaît ensuite du cache ; un build manuel supplémentaire retire enfin son code de la sortie.
- Cause probable : `FilesManager.onDeletedUri()` attend `triggerDelete()` et retire ensuite le fichier de `this.files`, alors que `Build.onFileDelete()` reconstruit pendant `triggerDelete()`.
- Décision à prendre : retirer la source du cache avant de lancer la reconstruction déclenchée par sa suppression, ou garantir que le build exclut les fichiers en cours de suppression ; vérifier la sortie après un seul événement de suppression.

## Téléchargement Store accepté malgré une réponse HTTP 404

- Reproduction automatisée : `template-store-archive-errors-round63.test.mjs` sert une archive ZIP valide avec le statut HTTP 404. `TemplateManager.downloadTemplateFromStore()` l'installe, recharge le registre et annonce une installation réussie.
- Source : `server/src/files/TemplateManager.ts`, `downloadFile()` copie le corps de la réponse sans contrôler `response.statusCode`.
- Décision à prendre : refuser les réponses HTTP d'erreur avant l'extraction, puis distinguer l'erreur de téléchargement de l'erreur d'archive. Le même test vérifie également qu'une archive ZIP sans `template.avt.ts` est refusée et qu'un nouvel essai valide fonctionne.

## Nom de variable CSS commençant par une minuscule tronqué

- Reproduction observée pendant `webcomponent-cancel-round64.test.mjs` : la commande `aventus.wc.create.cssvar` transforme `primaryColor` en `--_button-color: var(--button-color);`, alors que `PrimaryColor` donne `--_button-primary-color: var(--button-primary-color);`.
- Source : `server/src/cmds/webcomponent/CreateCSSVariable.ts`, expression régulière de découpage qui ne capture pas le segment initial en minuscules.
- Décision à prendre : accepter les noms camelCase dès la première séquence, puis ajouter une assertion de régression pour la variable générée.

## Commandes de build résolues avant la fin de la compilation

- Reproduction automatisée : `build-command-completion-round65.test.mjs` maintient en attente la promesse du build choisi. `aventus.compile`, `aventus.npm.build` et `aventus.storybook.build` terminent leur commande dès le démarrage du travail ; seule `aventus.static` attend la fin de l'export. Les quatre commandes renvoient `undefined`, même lorsque l'opération produit un résultat.
- Source : `server/src/cmds/BuildProject.ts`, `server/src/cmds/npm/Build.ts`, `server/src/cmds/storybook/Build.ts` déclenchent le build sans attendre sa promesse ; `server/src/cmds/StaticExport.ts` attend l'export, mais ne renvoie pas sa valeur.
- Décision à prendre : définir si la réponse de commande doit signaler la fin et le résultat du build. Dans ce cas, attendre et renvoyer la promesse pour propager aussi ses erreurs au demandeur.
## Erreurs du parseur HTML absentes de la validation du service

- Reproduction automatisée : `html-validation-gap-round66.test.mjs` produit une erreur de fermeture de balise avec `ParserHtml.parse`, mais `AventusHTMLLanguageService.doValidation` renvoie une liste vide. Après correction du document, le parseur n'a plus d'erreur et la validation renvoie toujours la même liste vide.
- Décision à prendre : publier les erreurs du parseur par le service de validation HTML, ou documenter un autre chemin de publication des diagnostics et le vérifier par un test de bout en bout.

## Ancienne validation publiée après un diagnostic plus récent

- Reproduction automatisée : `files-validation-race-round67.test.mjs` démarre une validation sur l'ancien contenu, la suspend, modifie le document, puis publie le diagnostic du nouveau contenu. À la reprise, l'ancienne validation publie ensuite son résultat et remplace le diagnostic récent côté client. Le même fichier vérifie qu'en l'absence de validation déjà démarrée, les éditions rapides sont regroupées et la dernière version est envoyée à chaque build associé.
- Source : `InternalAventusFile.validate()` ne vérifie que la suppression du fichier après chaque callback ; aucune version du document n'est comparée avant `GenericServer.sendDiagnostics()`.
- Décision à prendre : ignorer le résultat d'une validation si une version plus récente du document a été reçue, puis vérifier la séquence de publications pour plusieurs builds et après fermeture.

## Projet détruit pendant le chargement de sa configuration

- Reproduction automatisée : `project-destroy-inflight-round68.test.mjs` suspend `Project.onConfigSave()` dans `loadConfig()`, détruit le projet, puis laisse la sauvegarde reprendre. Un nouveau `Build` est alors créé et abonné aux nouveaux fichiers après la destruction ; une notification d'enregistrement est également émise. Le test nettoie explicitement cet abonnement après avoir vérifié le comportement.
- Source : `Project.destroy()` ne marque pas l'instance comme détruite et `onConfigSave()` ne vérifie pas cet état après ses attentes asynchrones.
- Décision à prendre : interrompre la création de ressources après destruction, et définir comment annuler ou attendre les sauvegardes de configuration en cours.

## Compilation déjà engagée poursuivie après destruction du build

- Reproduction automatisée : `project-destroy-inflight-round68.test.mjs` suspend une compilation après son démarrage, détruit le `Build`, puis reprend la compilation. L'écriture de sortie et la notification de compilation arrivent après la notification de désenregistrement.
- Source : `Build.destroy()` retire les abonnements sans annuler la promesse `_build()` en cours ; celle-ci poursuit les étapes d'écriture après ses attentes asynchrones.
- Décision à prendre : définir si une compilation en cours doit être annulée ou attendue avant désenregistrement, puis vérifier l'absence de sorties et de notifications tardives selon le contrat choisi.

## Sauvegardes de configuration bloquées après une erreur d'initialisation

- Reproduction automatisée : `project-config-init-failure-round69.test.mjs` fait échouer `Build.init()` pendant `Project.onConfigSave()`. La sauvegarde échoue, mais le verrou reste acquis ; une deuxième sauvegarde, avec une configuration corrigée, ne démarre jamais. Le test libère explicitement le verrou en fin de scénario pour nettoyer la promesse en attente.
- Source : `Project.onConfigSave()` appelle `onConfigSaveMutex.release()` uniquement après la création de tous les builds et exports statiques. Une exception dans cette séquence saute la libération.
- Décision à prendre : libérer le verrou dans un bloc `finally`, et préciser le nettoyage des builds ou sorties partiellement créés avant de tester leur récupération.

## Présentations de couleur avec alpha explicite sur quatre chiffres hexadécimaux

- Reproduction automatisée : `color-picker-ranges-round70.test.mjs` reconnaît `#f00f` comme rouge opaque, mais les présentations proposées sont `#ff0000`, `hsl(...)` et `rgb(...)`. La syntaxe alpha explicite disparaît alors que la valeur n'a pas changé.
- Source : `ColorPicker.onColorPresentations()` ne considère que les chaînes hexadécimales de neuf caractères pour conserver une présentation avec alpha ; la forme courte `#RGBA` n'est pas prise en compte lorsque `color.alpha === 1`.
- Décision à prendre : préserver ou non la présence explicite du canal alpha pour `#RGBA` opaque. Si oui, reconnaître cette forme dans le choix des présentations et ajouter une assertion de régression.

## Réponses de sélection absentes des options proposées

- Reproduction automatisée : `notification-response-boundaries-round70.test.mjs` répond à une sélection simple ou multiple avec un objet dont le libellé n'était pas proposé. La réponse est acceptée et transmise au demandeur. Une sélection simple remappe seulement les libellés connus ; une sélection multiple transmet directement le tableau fourni par le client.
- Source : `AskSelect.resolve()` conserve la réponse si aucun libellé ne correspond ; `AskSelectMultiple.resolve()` ne vérifie pas les options proposées.
- Décision à prendre : préciser si le client peut fournir une valeur libre. Si la sélection doit être limitée aux options, rejeter ou annuler les réponses inconnues et tester également les mélanges d'options connues et inconnues.

## Demandes laissées en attente après un échec d'envoi de notification

- Reproduction automatisée : `notification-response-boundaries-round70.test.mjs` fait échouer `sendNotification()` pour chacune des quatre demandes (entrée, sélection, sélection multiple et popup). La promesse est rejetée, mais la demande reste dans `waitingResponse` ; la sélection simple conserve aussi ses options. Le test retire explicitement ces entrées pour ne pas contaminer la suite.
- Source : chaque méthode `send()` enregistre la demande avant d'appeler `GenericServer.sendNotification()` sans nettoyage en cas d'exception.
- Décision à prendre : supprimer l'état en attente en cas d'échec d'envoi et vérifier la récupération lors de l'envoi suivant.

## Ancienne classe HTML conservée dans le registre inverse après remplacement direct

- Reproduction automatisée : `html-definition-replacement-round71.test.mjs` remplace une définition interne sous la même URI sans retrait préalable. Le tag et la complétion utilisent la nouvelle classe, mais `internalDocumentationReverse` garde l'ancienne classe, même après retrait de la nouvelle définition.
- Source : `AventusHTMLLanguageService.addInternalDefinition()` écrase `internalDocumentation[uri]` et ajoute les nouvelles classes au registre inverse sans supprimer les classes de la version précédente. `removeInternalDefinition()` ne connaît ensuite que la nouvelle version.
- Décision à prendre : préciser si le remplacement direct sous une même URI est une opération prise en charge. Si oui, retirer les anciennes entrées inverses avant l'écrasement, puis vérifier les cycles d'édition et de suppression.

## Renommage de dossier : seules les références du premier fichier sont mises à jour

- Reproduction automatisée : `project-rename-batch-round72.test.mjs` transmet au projet deux renommages de fichiers TypeScript provenant d'un même dossier. Le service de renommage n'est appelé que pour le premier ; l'édition du second consommateur n'apparaît pas.
- Source : `Build.onRename()` retourne dès le premier changement ayant une extension TypeScript prise en charge. Les changements suivants du même lot ne sont jamais traités.
- Décision à prendre : agréger les éditions de tous les changements du lot, en définissant la résolution des éventuels doublons pour une URI consommatrice, puis ajouter une régression avec deux imports réels.

## Plusieurs imports d'un fichier déplacé dans un même consommateur

- Reproduction automatisée : `project-rename-batch-round72.test.mjs` fournit deux références au même fichier déplacé, dans deux lignes d'un consommateur. `onRenameFile()` ne renvoie que l'édition de la seconde ligne.
- Source : `AventusTsLanguageService.onRenameFile()` réaffecte `result[file.uri] = textEdits` à chaque référence au lieu d'ajouter l'édition au tableau déjà associé à cette URI.
- Décision à prendre : accumuler les éditions de toutes les références par URI, puis vérifier les imports répétés et les imports répartis entre plusieurs fichiers.

## Dernier tag de package retiré sans vider le manifeste Emmet

- Reproduction automatisée : `manifest-package-removal-round72.test.mjs` écrit le manifeste d'un package portant `demo-alpha`, retire son dernier export, puis appelle `ManifestPackage.write()`. Le fichier `snippets.json` conserve `demo-alpha`. Le même test vérifie que le retrait d'un tag parmi deux et le renommage d'un tag actualisent correctement le fichier.
- Source : `ManifestPackage.write()` écrit le résultat seulement si au moins un export possède un `tagName` (`canWrite`). Lorsque le dernier tag disparaît, l'ancien fichier n'est ni vidé ni supprimé.
- Décision à prendre : lorsque le dernier tag disparaît, écrire le seul snippet `block` ou supprimer le fichier généré ; vérifier ensuite le cycle de retrait du dernier package.

## Édition rapide : deux templates de même nom pointent vers le premier chemin

- Reproduction automatisée : `template-choices-collision-round73.test.mjs` présente deux templates `Shared` de sources distinctes. L'utilisateur sélectionne le second, mais `quickCreations` reçoit le chemin du premier.
- Source : `QuickTemplateEdit.run()` retrouve le chemin avec `items.find(p => p.label == item.label)`, ce qui ignore l'identité et le détail de l'élément sélectionné.
- Décision à prendre : utiliser l'identité de l'élément retourné ou une clé stable, et vérifier les noms identiques entre templates globaux, projets et templates locaux.

## Exports Sharp/PHP : chemins contenant des espaces transmis sans guillemets au shell

- Reproduction automatisée : `converter-round46.test.mjs` crée des configurations dans un dossier dont le nom contient des espaces et vérifie les commandes construites. Sharp transmet `csharp-converter <chemin>` et PHP transmet `php <phar> <chemin> 2>&1` sans citer ni le chemin de configuration ni celui du PHAR.
- Source : `SharpExport.run()` et `PhpExport.run()` concatènent les chemins directement dans la chaîne passée à `execAsync()`. Le shell sépare donc un chemin contenant des espaces en plusieurs arguments.
- Décision à prendre : exécuter les outils avec une liste d'arguments ou échapper chaque chemin selon le shell pris en charge ; couvrir les espaces et les caractères spéciaux sur Windows et Unix.

## Échec de processus lors de la mise à jour Sharp

- Reproduction automatisée : `converter-round46.test.mjs` fait rejeter l'exécution de la mise à jour `csharp-converter`. `SharpUpdateTools.run()` rejette alors sa promesse, ne lance pas la mise à jour `db-query` pourtant installé et ne transmet pas de message d'erreur au client. Une invocation ultérieure réussit.
- Source : l'appel à `GenericServer.showLoadingMessage()` dans la boucle n'a pas de `try/catch` autour de `execAsync()` ; seul un résultat contenant `stderr` est traité.
- Décision à prendre : définir si la mise à jour suivante doit se poursuivre après un échec de processus et comment signaler chaque échec au client, puis tester le résultat décidé.

## Sortie d'erreur ignorée par les exports Sharp et PHP

- Reproduction automatisée : `converter-output-concurrency-round99.test.mjs` fait renvoyer `stdout = "conversion complete"` et `stderr = "conversion warning"` par chacun des deux convertisseurs. Les deux exports annoncent `success` et ne transmettent aucun message au client.
- Source : `SharpExport.run()` et `PhpExport.run()` ne lisent que `stdout` et y recherchent la chaîne `Error : ` ; `stderr` est écarté.
- Décision à prendre : préciser si `stderr` doit provoquer un état d'erreur ou être signalé comme avertissement, puis tester la politique retenue avec les véritables conventions de sortie des convertisseurs.

## Échec du processus convertisseur sans état final de compilation

- Reproduction automatisée : `converter-output-concurrency-round99.test.mjs` fait rejeter les processus Sharp et PHP. Chaque commande affiche l'erreur au client, mais la dernière notification de compilation reste `compiling` ; une nouvelle exportation réussie produit ensuite un nouvel état `compiling`, puis `success`.
- Source : les `catch` de `SharpExport.run()` et `PhpExport.run()` appellent `showErrorMessage()` sans envoyer `Compiling.send(..., 'error', ...)`.
- Décision à prendre : définir l'état final et les détails d'erreur à transmettre lors d'un échec de processus, puis vérifier la transition attendue sur les deux exports.

## Événement disque déjà en file après arrêt de surveillance

- Reproduction automatisée : `files-watcher-unwatch-queue-round75.test.mjs` bloque le traitement d'un changement, place une suppression dans la file pour la même URI, appelle `unwatch(uri)`, puis libère le changement. La suppression atteint encore `FilesManager` ; un nouvel événement émis après `unwatch` est bien ignoré.
- Source : `FilesWatcher.onRemove()` vérifie `watcheUris` avant de placer l'action dans `pendingEvents`, mais l'action mise en file ne recontrôle pas l'inscription lorsqu'elle s'exécute.
- Décision à prendre : préciser si `unwatch` doit annuler les événements déjà reçus. Si oui, vérifier l'inscription lors de l'exécution et tester aussi la réinscription de la même URI pendant qu'un événement ancien attend.

## SCSS : le second import local reste non résolu après insertion du premier

- Reproduction automatisée : `scss-import-mixin-round34.test.mjs` compile une feuille avec deux `@import` locaux, plus des imports commentés. Le premier est inséré mais le second reste envoyé à Sass sous forme de `@import "second"` ; la compilation ne produit aucun CSS et publie « Can't find stylesheet to import ». Une modification du second fichier laisse le même résultat.
- Source : `AventusWebSCSSFile.compile()` remplace le contenu pendant une boucle `RegExp.exec()` qui continue avec `lastIndex` calculé sur la chaîne avant remplacement. Le second import peut ainsi être sauté.
- Décision à prendre : traiter les imports avec des positions stables ou relancer la recherche après chaque remplacement, puis tester plusieurs imports frères, imports imbriqués et commentaires.

## Ajout de section de configuration sans projet découvert

- Reproduction automatisée : `config-format-target-round78.test.mjs` appelle `AddConfigSection.run()` lorsque `ProjectManager.getAllConfigFiles()` renvoie une liste vide. La commande intercepte un `TypeError` sur `items[0].label`, journalise l'erreur et ne présente aucun message à l'utilisateur.
- Source : `server/src/cmds/AddConfigSection.ts` gère le choix parmi plusieurs fichiers et l'unique fichier, mais accède à `items[0]` sans traiter le cas vide.
- Décision à prendre : définir la réponse utilisateur attendue lorsqu'aucune configuration n'existe, puis tester ce comportement après correction.
## Commandes HTTP terminées avant le démarrage ou l'arrêt réel

- Reproduction automatisée : `command-service-routing-round79.test.mjs` envoie `aventus.liveserver.start` par `Commands.execute` avec un `HttpServer.start()` asynchrone contrôlé. La commande se termine alors que le démarrage est encore en attente.
- Source : `server/src/cmds/live-server/StartServer.ts`, `StopServer.ts` et `ToggleServer.ts` appellent les méthodes du service sans renvoyer leur résultat.
- Décision à prendre : définir si la réponse à ces commandes doit couvrir la fin et les erreurs de l'opération HTTP ; si oui, renvoyer ou attendre la promesse du service.

## Templates locaux conservés lors du changement d'espace de travail

- Reproduction automatisée : `template-workspace-isolation-round80.test.mjs` charge un template, un projet et un template global installés, puis des homonymes locaux dans l'espace A. Après passage à l'espace B, qui ne contient aucun remplacement local, la découverte renvoie encore les fichiers de A pour les trois familles.
- Source : `LocalTemplateManager.readTemplates()`, `LocalProjectManager.readProjects()` et `TemplateManager.readGlobal()` passent les objets des registres généraux à `TemplateManager.readTemplates()`, qui les modifie directement via `setValueToObject()`.
- Décision à prendre : isoler les registres par espace de travail ou copier la structure avant de fusionner les entrées locales ; couvrir ensuite les passages A → B → A et la suppression d'une entrée locale.

## Références SCSS d'une variable globale limitées au fichier courant

- Reproduction automatisée : `scss-global-refresh-round86.test.mjs` charge `--accent` dans une feuille globale et l'utilise deux fois dans un style de composant. La définition depuis le composant mène à la feuille globale, mais la recherche des références ne renvoie que les deux usages du composant et omet la déclaration globale. `scss-global-cross-file-references-round131.test.mjs` part de la déclaration globale avec deux fichiers consommateurs : seules la déclaration et l'utilisation dans la feuille globale sont renvoyées, y compris après remplacement de la variable dans cette feuille.
- Source : `AventusSCSSLanguageService.onReferences()` et `AventusGlobalSCSSLanguageService.onReferences()` délèguent uniquement à `vscode-css-languageservice.findReferences()` sur le document courant ; le registre des variables globales n'est pas interrogé pour les références.
- Décision à prendre : préciser si « rechercher les références » d'une variable CSS globale doit agréger la déclaration et les usages de tous les fichiers du build. Si oui, établir un index inter-fichiers et couvrir ajout, modification et suppression.

## Dépendances npm périmées dans le package généré après rebuild

- Reproduction automatisée : `npm-metadata-rebuild-round89.test.mjs` génère un `package.json` avec deux dépendances, retire la première et change la version de la seconde, puis régénère le package. Le fichier de sortie conserve les deux anciennes valeurs.
- Source : `server/src/project/Build.ts`, `writeBuildNpm()` fusionne `{ ...packageJson, ...oldPackage }` et ne réécrit ensuite que `name`, `displayName` et `version`. L'ancien champ `dependencies` écrase donc le calcul du build courant.
- Décision à prendre : déterminer quelles métadonnées du package de sortie sont conservées lors d'un rebuild et faire prévaloir la liste de dépendances actuelle sur les valeurs générées précédemment.

## Export statique SCSS : répertoire nommé `.scss` réécrit à la place du fichier

- Reproduction automatisée : `static-scss-directory-round96.test.mjs` exporte `input/theme.scss/main.scss`. Le CSS est écrit dans `output/theme.css/main.scss` puis mis à jour à cet endroit, alors que `output/theme.scss/main.css` n'existe pas.
- Source : `server/src/project/Static.ts`, `copyFile()` applique `pathOut.replace(".scss", ".css")`, qui remplace la première occurrence du chemin complet plutôt que l'extension du nom de fichier.
- Décision à prendre : remplacer uniquement l'extension du fichier de sortie et vérifier les chemins contenant `.scss` dans les répertoires, sur plusieurs destinations et après édition.

## `@StoryValue` textuel rend la story d'un WebComponent invalide

- Reproduction automatisée : `storybook-component-storyvalue-round98.test.mjs` parse un vrai composant avec `@Attribute() @StoryValue("First title")`, compile ses contrôles puis écrit la story. Le parseur transmet `First title` sans guillemets à `storyArgs.title` ; la sortie contient `"title":First title` et TypeScript signale une erreur de syntaxe. Une édition vers `"Updated title"` régénère la valeur, mais garde le même défaut.
- Source : `StoryValueDecorator.is()` reprend `DecoratorInfo.arguments[0].value` sans représentation de chaîne ; `AventusWebcomponentCompiler.addStoryField()` le copie dans `storyArgs`, puis `Storie.writeObjAsJson()` l'insère comme expression TS brute.
- Décision à prendre : préciser si `@StoryValue` accepte une valeur littérale ou une expression TS. Si c'est une chaîne littérale, sérialiser correctement les guillemets/échappements ; si c'est une expression, documenter la syntaxe et valider la sortie générée.

## Couleurs des commentaires de ligne SCSS proposées par le color picker

- Reproduction automatisée : `color-picker-bounds-round99.test.mjs` interroge `onDocumentColor()` sur `// #f00 blue` suivi d'une règle valide. Les trois couleurs, dont `#f00` et `blue` dans le commentaire, sont retournées.
- Source : `server/src/color-picker/ColorPicker.ts`, `maskCommentsAndStrings()` masque `/* ... */` et les chaînes, mais ne reconnaît pas les commentaires `//` du SCSS.
- Décision à prendre : déterminer la prise en charge des commentaires de ligne selon le langage du document. Pour SCSS, les masquer sans masquer les URL ou expressions qui comportent `//`, puis vérifier les plages et présentations après édition.

## Namespace de dossier calculé pour une source hors de `namespaceRoot`

- Reproduction automatisée : `project-namespace-neighbor-round99.test.mjs` vérifie qu'une source imbriquée sous `src/` reçoit `admin.detail`, puis montre qu'une source du dossier voisin `src-old/` reçoit `workspace.app.src-old.admin` alors qu'elle est hors de la racine configurée.
- Source : `server/src/project/Build.ts`, `getNamespaceForUri()` retire la racine avec `path.replace(namespaceRoot, "")` sans vérifier que le chemin appartient à cette racine ; si elle n'est pas présente, le chemin presque entier devient namespace.
- Décision à prendre : définir le comportement pour une URI hors de la racine (par exemple namespace vide ou rejet), puis vérifier l'appartenance avec une frontière de segment avant de retirer le préfixe.

## Session Store encore active au retour d'une réponse HTTP 403

- Reproduction automatisée : `store-forbidden-publish-round100.test.mjs` ouvre une vraie session HTTP locale, publie un package qui reçoit 403, puis retarde la réponse de logout. `publishPackage()` rend déjà son `QueryError` alors que `Store.isConnected` reste vrai ; les identifiants sont effacés seulement à la fin du logout. Un logout HTTP 500 les efface finalement aussi.
- Source : `server/src/store/Store.ts`, `postWithErrors()` appelle `this.disconnect()` sans attendre sa promesse dans la branche 403.
- Décision à prendre : préciser si l'invalidation locale doit être effective avant de rendre l'erreur 403. Si oui, attendre ou effectuer immédiatement la suppression des identifiants, sans faire dépendre la sécurité locale de la réponse de logout.
## Paramètres Store partiels : nom d'utilisateur perdu

- Reproduction automatisée : `settings-hidden-partial-round101.test.mjs` charge un `config.json` contenant `store.token` et `store.username`, puis appelle `setHiddenSettings({ store: { token: 'new-token' } })`. Le nouveau fichier conserve `version`, mais supprime `store.username`.
- Source : `SettingsManager.setHiddenSettings()` fusionne uniquement le premier niveau avec `{ ...this._hiddenSettings, ...newSettings }` ; l'objet `store` est remplacé en entier.
- Décision à prendre : préciser si les mises à jour partielles de `store` doivent préserver les champs non fournis. Si oui, fusionner ce sous-objet et tester aussi les mises à jour successives de token et de nom d'utilisateur.
## Formatage i18n indisponible pour un document avec commentaires valides

- Reproduction automatisée : `i18n-comment-format-round102.test.mjs` valide un fichier `.i18n.avt` complet avec un commentaire `//` et ne reçoit aucune édition de formatage. Après retrait du commentaire, le même contenu est formaté et ses clés sont triées.
- Source : `AventusI18nLanguageService` active `allowComments` pour la validation, mais `format()` appelle directement `JSON.parse(file.contentUser)` et retourne `[]` sur exception.
- Décision à prendre : préciser si le formatage doit prendre en charge les commentaires acceptés par le service. Si oui, utiliser un parseur JSON avec commentaires qui préserve leur position et vérifier l'ordre des clés après formatage.

## Validation i18n erronée avec un commentaire de bloc multiligne

- Reproduction automatisée : `i18n-multiline-comment-round107.test.mjs` valide un fichier `.i18n.avt` avec `/* ... */` sur deux lignes et une traduction manquante. Le service renvoie `Can't parse the json` au lieu du diagnostic `Missing locales fr`. Après retrait du commentaire, le diagnostic attendu apparaît.
- Source : `AventusI18nLanguageService.removeComments()` emploie `.*?` sans mode couvrant les sauts de ligne ; le commentaire de bloc reste dans le texte passé à `JSON.parse()` alors que `vscode-json-languageservice` l'accepte.
- Décision à prendre : aligner l'analyse JSON secondaire sur les commentaires acceptés par le validateur, tout en préservant les positions et les chaînes contenant des séquences `/*` ou `//`.
## Échec du watcher interrompant la fermeture du serveur

- Reproduction automatisée : `protocol-shutdown-failure-round106.test.mjs` fait échouer `FilesWatcher.destroy()` pendant `shutdown`. Le serveur marque immédiatement `isDown`, puis ne détruit ni les projets ni les fichiers. Un second appel, après réparation du watcher, termine ces nettoyages.
- Source : `GenericServer.onShutdown()` attend la destruction du watcher avant les autres ressources sans isoler les erreurs de chaque étape.
- Décision à prendre : préciser si la fermeture doit tenter le nettoyage de toutes les ressources même lorsqu'une étape échoue, et comment signaler les erreurs cumulées au client LSP.

## Échec de téléchargement d'une dépendance supprimant un package préexistant

- Reproduction automatisée : `dependency-download-round107.test.mjs` télécharge un package depuis un serveur HTTP local, suit une redirection absolue et écrit le fichier. Une nouvelle tentative vers une URL renvoyant 404 avec la même destination retourne `false` et supprime le fichier valide précédent.
- Source : `DependencyManager.downloadFile()` appelle `cleanup()` sur les réponses HTTP non réussies ; cette fonction supprime `fileUri` sans distinguer un fichier préexistant d'un fichier créé par la tentative courante.
- Décision à prendre : préciser si une mise à jour échouée doit conserver la version précédemment téléchargée. Si oui, écrire d'abord dans un fichier temporaire puis remplacer la destination uniquement après téléchargement complet et fermeture réussie.

## Alpha explicite perdu pour les fonctions couleur majuscules

- Reproduction automatisée : `color-picker-uppercase-round108.test.mjs` détecte `RGBA(255, 0, 0, 1)` et `HSLA(120, 100%, 50%, 1)`, mais `onColorPresentations()` ne propose que `hex`, `hsl` et `rgb` sans alpha.
- Cause : la détection des fonctions est insensible à la casse, tandis que le choix des présentations teste `startsWith('rgba')` et `startsWith('hsla')` avec la casse exacte. L'alpha opaque (`1`) ne suffit pas à sélectionner les formes avec alpha.
- Décision à prendre : conserver l'alpha explicitement écrit lorsque la fonction d'origine est en majuscules, comme pour les mêmes fonctions en minuscules.

## `readDirs` ciblant un fichier charge aussi ses voisins

- Reproduction automatisée : `files-read-dirs-file-filter-round108.test.mjs` utilise `readDirs: ['src/wanted.wcl.avt']`. La découverte enregistre `wanted.wcl.avt` et `sibling.wcl.avt`, mais exclut le fichier du sous-dossier `src/nested`.
- Cause : `FilesManager.parseWorkspace()` filtre les dossiers parcourus, puis transmet tous leurs fichiers à `loadAllAventusFiles()` sans vérifier le chemin de chaque fichier contre `readDirs`.
- Décision à prendre : préciser si une entrée `readDirs` désignant un fichier doit limiter le chargement à ce seul fichier. Si oui, appliquer aussi le filtre aux fichiers rencontrés.

## Catégorie de templates vide après filtrage des scripts interdits

- Reproduction automatisée : `template-query-categories-round109.test.mjs` interroge une catégorie qui ne contient qu'un template dont `isAllowed()` renvoie `false`. Le premier menu propose encore la catégorie ; sa sélection ouvre un second menu vide.
- Source : `TemplateManager.query()` ajoute chaque sous-arbre aux choix avant de vérifier si ses feuilles sont autorisées pour la destination. Le filtrage ne s'effectue qu'au niveau des scripts.
- Décision à prendre : masquer les catégories sans template autorisé, en conservant le comportement actuel des catégories qui contiennent au moins un script utilisable.

## Bundle npm périmé après changement d'un module installé

- Reproduction automatisée : `npm-installed-source-rebuild-round110.test.mjs` compile un vrai module local avec `value = 1`, modifie son fichier en `value = 2`, puis recompile avec les mêmes imports. Le bundle exécutable retourne encore `1`. Ajouter l'import d'un autre symbole force un nouveau bundle qui retourne `2`.
- Source : `NpmBuilder.compile()` ne relance `esbuildBuild()` que si le texte des imports change ; la clé de cache ne tient pas compte du contenu ou de la version des modules installés.
- Décision à prendre : définir l'invalidation du cache après installation ou mise à jour npm et vérifier qu'un build suivant utilise le nouveau contenu sans modifier les imports du projet.

## Action i18n supprimant les commentaires de traduction

- Reproduction automatisée : `i18n-comment-action-round110.test.mjs` valide un fichier `.i18n.avt` comportant un commentaire `//` et une locale manquante. L'action « Import missing locales » ajoute bien la locale, mais son édition remplace l'intégralité du document et supprime le commentaire.
- Source : `AventusI18nLanguageService.actionImportMissingLocales()` sérialise `file.parsedSrc` avec `JSON.stringify()`, puis propose une édition sur toute la plage du document. Les commentaires ne figurent pas dans `parsedSrc`.
- Décision à prendre : préciser si les commentaires de traduction doivent être préservés lorsque l'action complète les locales. Si oui, produire des éditions ciblées à partir des positions parsées plutôt qu'une sérialisation complète.

## Commandes propriété et watch ignorées lorsque le composant appartient au second build

- Reproduction automatisée : `webcomponent-build-selection-round111.test.mjs` donne à `FilesManager.getBuild()` deux builds pour le fichier courant. Le premier ne possède aucun composant et le second contient un `AventusWebComponentLogicalFile` valide. Les commandes `aventus.wc.create.property` et `aventus.wc.create.watch` demandent leurs entrées mais ne modifient pas le fichier et n'envoient aucune notification d'édition.
- Source : `CreateProperty.run()` et `CreateWatch.run()` cherchent uniquement dans `builds[0].tsFiles[uri]`, sans parcourir les autres builds associés au document.
- Décision à prendre : sélectionner le build contenant le composant, ou définir explicitement une priorité des builds et signaler au client quand le premier build ne convient pas.

## Projet non réessayé après un échec transitoire d'initialisation

- Reproduction automatisée : `project-manager-init-retry-round111.test.mjs` fait échouer `Project.init()` lors de la première découverte d'une configuration. Le projet reste dans le registre sans callback de suppression ; une seconde découverte du même fichier ne relance pas l'initialisation. Une suppression explicite via le gestionnaire permet ensuite une nouvelle création réussie.
- Source : `ProjectManager.onNewFile()` inscrit le projet dans `this.projects` avant `await project.init()`, et n'annule pas cette inscription si l'attente rejette. Le callback `file.onDelete()` n'est installé qu'après la réussite.
- Décision à prendre : retirer et détruire l'instance incomplète sur échec d'initialisation, puis permettre une redécouverte ou un nouvel essai explicite sans suppression préalable.

## Fichier conservé après échec d'un callback de création

- Reproduction automatisée : `files-registration-failure-round112.test.mjs` fait échouer un listener `onNewFile()` lors de `registerFile()`. L'appel rejette, mais `getByUri()` retourne déjà le fichier. Après correction du listener, un second `registerFile()` met à jour le contenu sans rejouer ce listener ; le watcher ne démarre qu'à ce second appel.
- Source : `FilesManager.triggerOnNewFile()` place le fichier dans `this.files` avant `Promise.all()` des callbacks. `registerFile()` ne revient pas sur cette insertion si un callback rejette.
- Décision à prendre : définir une reprise de l'initialisation après échec d'un listener, soit en annulant l'inscription incomplète, soit en rejouant les callbacks qui n'ont pas abouti, puis vérifier que le watcher et les abonnements sont cohérents.

## Tableaux Markdown de package avec descriptions multilignes et séparateurs

- Reproduction automatisée : `manifest-package-table-round112.test.mjs` documente une classe sur deux lignes et une propriété dont la description contient `|` et un saut de ligne. Le détail de la classe conserve les deux lignes, mais les cellules des tableaux donnent `First lineSecond line` et `and detailswith more text`. Le `|` de la propriété devient une colonne supplémentaire alors que l'en-tête a trois colonnes.
- Source : `ManifestPackageMd.addColumns()` supprime les sauts de ligne sans les remplacer par une séparation et n'échappe pas les barres verticales présentes dans les valeurs.
- Décision à prendre : préserver une séparation lisible entre lignes et échapper les barres verticales dans les cellules Markdown.

## Préparation de template bloquée par les espaces et après échec

- Reproduction automatisée : `template-shell-path-round112.test.mjs` place le dossier de sauvegarde du serveur dans un chemin contenant des espaces. `TemplateScript.create()` échoue à charger un script valide, car le chemin du script temporaire est scindé par le shell. Après déplacement vers un dossier sans espaces, le nouvel essai reste indéfiniment en attente ; après remise à zéro du registre `preparing`, le même script se charge.
- Source : `TemplateScript.prepareScript()` construit `node --no-warnings ${scriptPath}` sans citer le chemin. À la fin de la préparation, la clé de `TemplateScript.preparing` est remplacée par `[]` au lieu d'être supprimée ; un appel ultérieur ajoute un callback à cette entrée sans relancer le travail.
- Décision à prendre : passer le chemin temporaire comme argument au processus Node et supprimer la clé `preparing` dans tous les chemins de fin, y compris après échec ; vérifier aussi `isAllowed()`, qui utilise la même invocation shell.
## Réponse Store de succès acceptée avec un statut HTTP d'erreur

- Reproduction automatisée : `store-status-result-round114.test.mjs` reçoit `{"errors":[],"result":true}` avec HTTP 500 puis 429. `Store.postWithErrors()` retourne `true` dans les deux cas, comme pour HTTP 200.
- Cause : `postWithErrors()` traite spécialement 401 et 403, puis décide du succès sur le seul corps JSON, sans vérifier les autres statuts HTTP.
- Décision à prendre : définir la priorité entre statut HTTP et enveloppe JSON ; si un statut non réussi doit toujours être une erreur, renvoyer un `QueryError` pour ces réponses et conserver la possibilité d'un nouvel essai.
## Initialisation LSP impossible sans `initializationOptions`

- Reproduction automatisée : `protocol-initialize-options-round115.test.mjs` appelle le handler `initialize` avec `workspaceFolders: null` et sans `initializationOptions`. Une `TypeError` est levée avant le callback du serveur ; le même handler accepte un nouvel essai contenant les options.
- Cause : `VsCodeConnection.onInitialize()` lit directement `params.initializationOptions.savePath` et `.extensionPath` sans valeur par défaut.
- Décision à prendre : définir le comportement pour un client LSP qui n'envoie pas d'options d'initialisation, puis fournir des valeurs par défaut ou une erreur de protocole explicite.
## Session Store conservée après HTTP 401

- Reproduction automatisée : `store-unauthorized-session-round117.test.mjs` part d'un token enregistré. Une réponse HTTP 401 renvoie `No token provided`, mais `Store.isConnected` reste vrai ; une deuxième requête réutilise le même bearer et peut réussir.
- Cause : `Store.postWithErrors()` renvoie directement un `QueryError` pour 401, alors que le chemin 403 déclenche une déconnexion.
- Décision à prendre : préciser si 401 indique une session devenue invalide et doit effacer les identifiants locaux, ou si le token doit rester disponible pour un nouvel essai.
## Enveloppe Store mal formée traitée comme une réponse valide

- Reproduction automatisée : `store-response-shape-round118.test.mjs` reçoit `errors` sous forme d'objet au lieu d'une liste. Avec `result: true`, `Store.postWithErrors()` retourne `true` ; sans `result`, il retourne `undefined`, hors du contrat annoncé `T | QueryError`.
- Cause : la fonction teste seulement la présence de `json.errors` puis lit sa propriété `length`, qui n'existe pas sur un objet ordinaire.
- Décision à prendre : valider la forme de `errors` et la présence de `result` avant de retourner un succès ; renvoyer un `QueryError` explicite pour les enveloppes invalides.
## Racine i18n `null` laissant la liste des clés inaccessible

- Reproduction automatisée : `i18n-root-shape-round119.test.mjs` remplace un document i18n valide par le JSON `null`. La validation signale une erreur et les exports sont vidés, mais `AventusI18nFile.keys` lève une `TypeError`. Une édition valide suivante rétablit les clés et les exports.
- Cause : `onContentChange()` assigne `parsedSrc = JSON.parse(...)` avant de vérifier que la racine est un objet ; `keys` appelle ensuite `Object.keys(parsedSrc)`.
- Décision à prendre : conserver un état `parsedSrc` exploitable pour une racine de type incorrect, par exemple `{}`, tout en publiant le diagnostic de schéma.
## Fragment d'URL non cité présenté comme couleur CSS

- Reproduction automatisée : `color-picker-url-fragment-round120.test.mjs` reçoit `url(icon.svg#f00)` et `color: #00f`. `ColorPicker.onDocumentColor()` propose les deux fragments `#f00` et `#00f` comme couleurs.
- Cause : le masque du color picker retire commentaires et chaînes, mais ne distingue pas le contenu non cité d'une fonction `url(...)` avant de chercher les couleurs hexadécimales.
- Décision à prendre : ignorer les fragments d'URL non cités lors de la recherche des couleurs, tout en conservant les vrais littéraux CSS voisins.
## Nom de package sortant du dossier de documentation des dépendances IA

- Reproduction automatisée : `ai-dependency-docs-round121.test.mjs` fournit un package nommé `../escaped`. La commande écrit `escaped.md` dans `.aventus` au lieu de `.aventus/dependencies`.
- Cause : `Dependency.run()` utilise directement `p.name + '.md'` dans `join(dependenciesDir, ...)` sans vérifier que le chemin résolu reste dans `dependenciesDir`.
- Décision à prendre : valider ou neutraliser les séparateurs et segments `..` du nom de package avant l'écriture, puis vérifier la destination résolue.

## Documentation IA impossible pour un nom de package scoped

- Reproduction automatisée : `ai-dependency-docs-round121.test.mjs` fournit un package nommé `@org/library`. `Dependency.run()` rejette avec `ENOENT` et n'écrit aucun Markdown, car le sous-dossier `@org` n'existe pas.
- Cause : le nom du package est utilisé tel quel comme chemin de fichier, sans création de sous-dossier ni conversion vers un nom de fichier sûr.
- Décision à prendre : définir un encodage de nom de fichier pour les packages scoped qui préserve leur identité sans créer de chemin arbitraire.

## Compilation npm concurrente renvoyant une sortie vide

- Reproduction automatisée : `npm-concurrent-compile-round122.test.mjs` lance deux appels à `NpmBuilder.compile()` avec les mêmes imports avant la fin d'esbuild. Le second renvoie `{ result: '', errors: [] }` ; le premier renvoie ensuite le bundle attendu.
- Cause : `compile()` enregistre `lastInfo` avant d'attendre `esbuildBuild()`. L'appel concurrent voit les imports inchangés et renvoie `npmBuildTxt`, encore vide.
- Décision à prendre : partager la promesse de compilation en cours avec les appels concurrents, puis publier le même résultat une fois le bundle terminé.

## Réponse de configuration ancienne appliquée après une notification plus récente

- Reproduction automatisée : `protocol-settings-race-round123.test.mjs` émet deux notifications de configuration, résout la seconde requête de paramètres avant la première, puis constate l'application des niveaux de journalisation dans l'ordre `1, 4`. La réponse ancienne écrase donc la configuration récente.
- Cause : `onDidChangeConfiguration()` lance `loadSettings()` sans l'attendre ; plusieurs chargements peuvent se chevaucher sans numéro de génération ni annulation des réponses périmées.
- Décision à prendre : sérialiser les rechargements ou ignorer les réponses d'une génération antérieure, en conservant un état cohérent entre paramètres généraux et HTML.

## Signatures Markdown de package inexactes pour les paramètres optionnels et variadiques

- Reproduction automatisée : `manifest-package-parameters-round123.test.mjs` documente une fonction et une méthode `(prefix?: string, ...values: number[])`. Le Markdown affiche `prefix: string, values: number`, sans marqueur optionnel, préfixe variadique ni dimension de tableau.
- Cause : `ManifestPackageMd.loadFunction()` et `loadMethod()` ne recopient que le nom et le type du paramètre ; `TypeInfo.getFullTxt()` réduit ici `number[]` à `number`.
- Décision à prendre : préserver la syntaxe optionnelle et variadique des paramètres ainsi que le type tableau dans les signatures Markdown, puis vérifier les mêmes cas pour les fonctions et méthodes génériques.

## Variable CSS globale omise dans un sélecteur `:root` groupé

- Reproduction automatisée : `scss-global-selector-scope-round124.test.mjs` charge `:root, html { --accent: navy; }` suivi d'une déclaration `:root` seule. L'index contient la seconde variable, mais `getDefinition('--accent')` ne trouve pas la première.
- Cause : `AventusGlobalSCSSLanguageService.loadVariables()` exige que le texte complet du sélecteur soit exactement `:root`. Un groupe contenant `:root` ne satisfait pas cette comparaison.
- Décision à prendre : reconnaître `:root` parmi les sélecteurs d'une règle, sans traiter comme globale une variable déclarée seulement sous un autre sélecteur.

## Doublon de variable CSS globale pointant vers la première déclaration

- Reproduction automatisée : `scss-global-selector-scope-round124.test.mjs` charge deux règles successives `:root` définissant `--accent` à `red`, puis `blue`. `getDefinition('--accent')` pointe sur la première déclaration et affiche `red`. Après retrait de celle-ci, l'index affiche `blue`.
- Cause : `AventusGlobalSCSSLanguageService.loadVariables()` ne remplace pas `result[propName]` lorsqu'une propriété de même nom a déjà été rencontrée dans le fichier.
- Décision à prendre : définir si la navigation et le hover doivent viser la déclaration qui l'emporte selon la cascade CSS, en tenant compte aussi des règles conditionnelles et de plusieurs feuilles globales.

## Définition de composant ignorée dans le second build partageant une sortie

- Reproduction automatisée : `project-shared-output-definition-round124.test.mjs` associe deux builds au même chemin de sortie. Le premier ne définit pas `x-second`, le second le définit ; `Project.getInternalWebComponentDefinition()` renvoie néanmoins `undefined` sans interroger le second. Avec des chemins distincts, la recherche atteint correctement le build correspondant.
- Cause : la méthode retourne immédiatement le résultat du premier build dont `outputPathes` contient le chemin, même lorsque sa recherche locale renvoie `undefined`.
- Décision à prendre : parcourir les autres builds partageant cette sortie lorsque la définition n'est pas trouvée, et préciser la priorité si plusieurs builds définissent le même tag.

## Conversion de composant écrasant une destination déjà présente

- Reproduction automatisée : `component-destination-collision-round124.test.mjs` prépare un composant en fichier unique et trois fichiers de destination contenant déjà du texte. La commande `split` remplace les trois contenus, supprime la source et n'émet aucune erreur. Le parcours inverse `merge` remplace également un composant unique préexistant avant de supprimer les sources séparées.
- Cause : `SplitComponent.run()` et `MergeComponent.run()` écrivent directement les destinations avec `writeFileSync()` sans vérifier si elles existent ni demander confirmation.
- Décision à prendre : définir si l'écrasement est autorisé. Si oui, le rendre explicite et vérifier le traitement des fichiers déjà ouverts ou modifiés en mémoire ; sinon, refuser la conversion avant toute écriture ou suppression.

## Action i18n périmée proposée pendant une édition JSON invalide

- Reproduction automatisée : `i18n-invalid-action-round125.test.mjs` part d'une traduction `Old` sans locale `fr`, puis édite le document en JSON incomplet contenant `Editing`. Pendant cette édition, `Import missing locales` reste proposé et son édition remplace tout le contenu par l'ancienne traduction `Old` plus la valeur vide de `fr`. Après correction du JSON, l'action disparaît.
- Cause : `AventusI18nFile.onContentChange()` garde `parsedSrc` après une erreur de parsing ; `actionImportMissingLocales()` utilise cet ancien état et construit une édition couvrant le document courant entier.
- Décision à prendre : masquer les actions fondées sur `parsedSrc` tant que le document courant est invalide, ou produire une correction ciblée qui préserve les modifications de l'utilisateur.

## Injection JavaScript par l'en-tête Host dans le script du serveur HTTP

- Reproduction automatisée : `http-injected-host-round125.test.mjs` interroge le serveur HTTP réel avec `Host: localhost';globalThis.injectedHostMarker=true;//`. La réponse de `/?get_injected_code` contient `var address = 'ws://localhost';globalThis.injectedHostMarker=true;///ws';` : la valeur fournie par le client sort de la chaîne JavaScript.
- Le même test vérifie qu'un en-tête `Host` présent prévaut sur le paramètre `host` de la requête ; un client ne peut pas corriger ce choix en fournissant ce paramètre.
- Cause : `HttpServer.createStaticServer()` insère `req.headers.host` directement entre apostrophes dans `INJECTED_CODE`, sans sérialisation JavaScript ni validation du nom d'hôte.
- Décision à prendre : valider l'hôte et sérialiser l'URL WebSocket comme chaîne JavaScript avant de générer le script. Évaluer également si cette route ouverte doit accepter un `Host` arbitraire.

## Completion d'un template avant la fin de sa sauvegarde initiale

- Reproduction automatisée : `files-template-lazy-save-round131.test.mjs` demande une completion sur un `template.avt.ts` absent du cache. Le fichier est enregistré et son callback `triggerSave()` démarre, mais la completion est renvoyée avant la fin de ce callback.
- Cause : `FilesManager.fileExists()` appelle `this.onSave(document)` sans attendre la promesse après `registerFile()`.
- Décision à prendre : définir si la première requête de langage doit attendre la préparation du template ; si oui, attendre la sauvegarde et propager son échec avant de répondre.

## Rechargement HTTP différé après arrêt et redémarrage

- Reproduction automatisée : `http-stale-reload-round126.test.mjs` programme un rechargement, arrête le serveur puis simule un nouveau client connecté avant l'expiration du délai. Ce client reçoit le message `reload` de la session précédente.
- Cause : `HttpServer.stop()` ferme les connexions mais ne libère pas `reloadTimeout` ; le callback appelle ensuite `_reload()` avec la nouvelle liste de clients.
- Décision à prendre : annuler le timer dans `stop()` et remettre `reloadTimeout` à `undefined` pour éviter un rechargement obsolète après redémarrage.

## Motif `readDirs` avec plusieurs jokers

- Reproduction automatisée : `files-discovery-multiple-wildcards-round128.test.mjs` découvre une configuration avec `src/*`, mais l'ignore avec `src/*/components/*` alors que le chemin `src/alpha/components/beta/aventus.conf.avt` correspond au motif.
- Cause : `FilesManager.parseWorkspace()` ne remplace que le premier `*` du motif transformé en expression régulière ; les autres restent des quantificateurs réguliers appliqués au caractère précédent.
- Décision à prendre : préciser la syntaxe des motifs `readDirs`, puis traduire chaque joker et tester le parcours des répertoires intermédiaires.

## Découverte des fichiers interrompue par un échec d'enregistrement

- Reproduction automatisée : `files-discovery-failure-round128.test.mjs` fait rejeter le premier enregistrement de source par `loadAllAventusFiles()`. La méthode rejette, `loadingInProgress` reste à `true` et `InitStep.sendDone()` n'est pas appelé. Un second appel complet rétablit l'état et enregistre source puis configuration.
- Cause : `loadAllAventusFiles()` remet `loadingInProgress` à `false` seulement après la boucle de découverte ; aucune remise en état n'est faite sur le chemin d'erreur.
- Décision à prendre : définir l'état et la notification attendus après un échec de découverte, puis garantir leur restauration sans imposer un second chargement complet si le serveur doit rester utilisable.

## Suppression de watcher périmée après désinscription et réinscription

- Reproduction automatisée : `files-watcher-rewatch-queue-round127.test.mjs` bloque une mise à jour, place une suppression dans la file de la même URI, désinscrit puis réinscrit le fichier avant de libérer la mise à jour. L'ancienne suppression atteint encore `FilesManager.onDeletedUri()` alors que la nouvelle inscription est active.
- Cause : l'action placée dans `pendingEvents` ne porte aucune génération d'inscription ; `unwatch()` et `watch()` ne la rendent pas caduque.
- Décision à prendre : associer les événements en file à une génération de surveillance et ignorer ceux d'une inscription précédente, ou définir explicitement que la file est conservée entre désinscription et réinscription.

## Événement du watcher traité après sa destruction

- Reproduction automatisée : `files-watcher-rewatch-queue-round127.test.mjs` suspend une mise à jour et place une suppression dans la file. `FilesWatcher.destroy()` termine et efface son instance avant que la suppression soit transmise à `FilesManager.onDeletedUri()`.
- Cause : `destroy()` attend seulement `watcher.close()` ; les promesses de `pendingEvents` continuent indépendamment.
- Décision à prendre : attendre ou annuler les événements déjà en file lors de la destruction, et préciser si une opération déjà commencée doit terminer avant que `destroy()` ne rende la main.

## Couleurs nommées renvoyées hors de l'ordre du document

- Reproduction automatisée : `color-picker-order-round127.test.mjs` place `blue` avant `#f00` et `rgb(...)`, puis `red` après. `onDocumentColor()` renvoie `#f00`, `rgb(...)`, `blue`, `red` ; les plages pointent bien vers les bonnes positions.
- Cause : `ColorPicker.getMatches()` trie les candidats hexadécimaux et fonctionnels, mais ajoute les couleurs nommées au résultat après cette boucle sans trier la liste complète.
- Décision à prendre : trier toutes les couleurs reconnues par position avant de produire les informations LSP, et préciser l'ordre en cas de plages chevauchantes.

## Documentation Storybook interprétée comme une expression TypeScript

- Reproduction automatisée : `storybook-description-interpolation-round130.test.mjs` parse une classe dont le JSDoc contient le texte littéral `${name}`. La story générée place ce texte dans un template TypeScript ; l'AST contient une interpolation de l'identifiant `name`, qui n'est pas défini dans la story.
- Cause : `Storie.writeStory()` échappe les accents graves de la description, mais pas la séquence `${` avant de la placer dans `component: \`...\``.
- Décision à prendre : encoder la description comme littéral TypeScript sûr ou échapper les caractères spéciaux des templates, puis vérifier que le texte rendu reste identique au JSDoc.

## Plusieurs templates d'environnement Storybook empêchent l'initialisation

- Reproduction automatisée : `storybook-multiple-templates-round129.test.mjs` fournit deux dossiers sous `templates/storybook`. `Storie.readEnvStoryBook()` rejette avec la chaîne `TODO code multiple template` et ne copie aucun fichier vers le dossier de sortie.
- Cause : la branche `folders.length != 1` interrompt systématiquement le traitement.
- Décision à prendre : définir le choix du template (configuration explicite, défaut stable ou fusion) et renvoyer une erreur exploitable si ce choix est ambigu.

## Nom de couleur reconnu dans une URL CSS non citée

- Reproduction automatisée : `color-picker-url-name-round127.test.mjs` renvoie `red` pour `background-image: url(red)` alors qu'il s'agit d'une ressource. Le même nom dans `url("red")` est correctement masqué, et une vraie déclaration `color: blue` reste détectée.
- Cause : la détection des noms de couleurs s'applique au texte entier après masquage des chaînes et commentaires, sans distinguer les arguments non cités de `url(...)`.
- Décision à prendre : exclure les jetons des URL CSS de la détection des couleurs tout en préservant les fonctions de couleur et leurs plages.

## Script template supprimé alors qu'il est en cache

- Reproduction automatisée : `template-cache-disappearance-round128.test.mjs` charge un `template.avt.ts`, supprime le fichier puis redemande le même script. `TemplateScript.create()` rejette avec `ENOENT` et conserve l'entrée en cache.
- Cause : le chemin déjà présent dans `TemplateScript.memory` passe directement par `statSync(config)` sans gérer la disparition du fichier.
- Décision à prendre : définir la réponse attendue pour un template supprimé, puis retirer son entrée du cache ou signaler proprement son indisponibilité avant un nouvel essai.

## État du build conservé après échec de validation pendant un rebuild

- Reproduction automatisée : `build-rebuild-validation-recovery-round128.test.mjs` fait échouer la validation d'un style dans `Build.rebuildAll()`. La promesse rejette, puis `_allowBuild` reste à `false`, `insideRebuildAll` à `true`, et les services SCSS et HTML ne reçoivent pas leur réactivation. Une nouvelle tentative réussie rétablit ces états.
- Cause : `rebuildAll()` remet les indicateurs et les services de définition en état uniquement après la boucle de validation ; une exception interrompt cette séquence.
- Décision à prendre : garantir la remise en état dans un bloc `finally` et définir comment signaler ou nettoyer les sorties d'un rebuild partiel avant de tester la correction.

## Ancienne compilation écrivant après une nouvelle révision

- Reproduction automatisée : `build-overlapping-revisions-round129.test.mjs` démarre une compilation du premier état, la suspend avant l'écriture, compile et écrit le second état, puis libère la première. La sortie contient finalement le premier état, malgré deux notifications de compilation réussie.
- Cause : `Build.build()` avec délai nul lance directement `_build()` ; les exécutions simultanées du même build ne sont pas sérialisées et aucune vérification de révision ne précède l'écriture.
- Décision à prendre : définir la politique de concurrence du build (sérialiser les compilations ou ignorer les résultats périmés) et garantir que la sortie finale correspond à la dernière révision.

## Mot clé CSS transparent ignoré par le color picker

- Reproduction automatisée : `color-picker-transparent-round138.test.mjs` vérifie que le parseur CSS accepte `transparent` avec alpha nul. Dans une feuille de style, `ColorPicker.onDocumentColor()` ignore ce mot clé, alors que son remplacement par `rgba(0 0 0 / 0)` est détecté ; le retour à `transparent` fait disparaître l'information de couleur.
- Cause : la recherche des couleurs nommées se fonde sur les propriétés de `ColorInfo.Colors`, qui ne comprennent pas `TRANSPARENT`.
- Décision à prendre : définir la prise en charge du mot clé `transparent` dans le color picker, avec une présentation conservant la transparence et des plages exactes après édition.

## Régression du contenu d'un fichier après une révision reçue en retard

- Reproduction automatisée : `files-out-of-order-versions-round134.test.mjs` applique la version 3 d'un document puis sa version 2. `InternalAventusFile` notifie les deux changements et conserve finalement la version 2 avec son ancien contenu.
- Cause : `triggerContentChange()` et `triggerContentChangeNoBuffer()` n'écartent pas les versions inférieures à `versionUser` avant de remplacer le document.
- Décision à prendre : définir si les versions LSP strictement croissantes sont une précondition ou si le serveur doit ignorer les notifications périmées ; protéger aussi les événements disque dont les versions sont calculées localement.

## Nouvelle session Store effacée par une déconnexion encore en attente

- Reproduction automatisée : `store-logout-login-race-round133.test.mjs` suspend une déconnexion HTTP démarrée avec un ancien token, termine une nouvelle connexion, puis libère la réponse de logout. La nouvelle session est effacée.
- Cause : `Store.disconnect()` applique l'effacement des identifiants à la fin de sa requête, sans vérifier qu'une connexion plus récente les a remplacés.
- Décision à prendre : coordonner les opérations de session et empêcher qu'une déconnexion antérieure efface un token obtenu ensuite.

## Déconnexion Store annulée par une connexion encore en attente

- Reproduction automatisée : `store-login-logout-race-round132.test.mjs` laisse une connexion HTTP en attente, termine ensuite `Store.disconnect()`, puis libère la réponse de connexion. La session redevient connectée malgré la déconnexion plus récente.
- Cause : `Store.connect()` applique son token dès que sa réponse arrive, sans tenir compte d'une déconnexion intervenue entre-temps.
- Décision à prendre : définir l'ordre d'autorité des opérations de session et invalider les réponses de connexion antérieures à une déconnexion.

## Connexions Store simultanées appliquées dans l'ordre des réponses

- Reproduction automatisée : `store-concurrent-login-round129.test.mjs` lance une connexion pour Alice, laisse sa réponse HTTP en attente, puis termine une connexion pour Bob. La session devient celle de Bob, avant que la réponse d'Alice ne la remplace.
- Cause : `Store.connect()` appelle `setSettings()` après chaque réponse réussie sans vérifier si une connexion plus récente a été demandée entre-temps.
- Décision à prendre : définir la priorité des connexions concurrentes (dernière demande ou dernière réponse), puis ignorer ou annuler les réponses périmées si la dernière demande doit faire autorité. Prévoir également le cas d'une déconnexion pendant une connexion en attente.

## Références d'une classe HTML masquées par une réponse TypeScript vide

- Reproduction automatisée : `html-style-references-fallback-round129.test.mjs` lie une vue à une classe TS et à un style SCSS, puis modifie vue et style. Pour une classe présente dans le style, `onReferences()` renvoie le sélecteur si la recherche TS répond `null`, mais renvoie `[]` si elle répond `[]`. Une réponse TS non vide est renvoyée seule.
- Cause : `AventusHTMLFile.onReferences()` teste la vérité de `resultTemp`. Un tableau vide est vrai en JavaScript, ce qui court-circuite `getLinkToStyle()`.
- Décision à prendre : définir si les références HTML doivent agréger les résultats TS et SCSS ou utiliser le style seulement quand TS ne trouve rien ; couvrir ensuite la recherche et le renommage avec un vrai fichier TS lié.

## Fonctions de couleur CSS valides ignorées par le color picker

- Reproduction automatisée : `color-picker-missing-functions-round130.test.mjs` confirme que le parseur CSS accepte `hwb(...)`, `lab(...)`, `lch(...)` et `color-mix(...)`, mais que `onDocumentColor()` ne renvoie aucune plage pour ces fonctions. Les couleurs hexadécimales et `rgb(...)` voisines restent reconnues ; les noms `red` et `blue` internes à `color-mix(...)` sont renvoyés séparément.
- Cause : la liste des fonctions candidates dans `ColorPicker.getMatches()` ne contient que `rgb`, `rgba`, `hsl`, `hsla`, `oklab`, `oklch` et `color`. La recherche des noms s'applique ensuite au contenu des fonctions non reconnues.
- Décision à prendre : définir les fonctions CSS prises en charge par le color picker et si une couleur composée doit produire une seule plage ou plusieurs ; élargir ensuite la détection sans compter les noms internes deux fois.

## Sections Build homonymes créées par la commande

- Reproduction automatisée : `add-config-duplicate-round130.test.mjs` lance deux fois `aventus.addConfigSection` avec le nom `Shared App`. Le fichier contient deux sections de même nom et deux destinations `./dist/Shared-App.js` ; les deux ajouts sont annoncés au client.
- Cause : `AddConfigSection.run()` ajoute directement la nouvelle section au tableau `build` sans rechercher un nom ou une destination déjà présents.
- Décision à prendre : définir si un doublon doit être refusé, renommé ou remplacer la section existante, puis vérifier la cohérence avec les validations de configuration et de sorties.

## Échec de formatage seulement journalisé

- Reproduction automatisée : `format-error-retry-round130.test.mjs` fait échouer le premier formateur d'un lot ; le second fichier est formaté, la commande se termine normalement, puis un nouvel appel formate le premier après disparition de l'erreur.
- Cause : `Format.run()` intercepte l'exception de chaque fichier et appelle seulement `console.error()` ; aucune réponse ou notification d'erreur n'est transmise par la commande.
- Décision à prendre : définir le retour utilisateur attendu pour un formatage partiel et conserver la possibilité de traiter les autres fichiers et de réessayer.

## Build différé exécuté après activation du mode global sans build

- Reproduction automatisée : `build-pending-no-build-round131.test.mjs` programme un build avec délai, active `noBuild` avant l'expiration, puis constate la création de la sortie et la notification de compilation. Une nouvelle demande de build faite après l'activation est pourtant ignorée.
- Cause : `Build.build()` vérifie `GenericServer.noBuild` avant de programmer le timer, mais le callback appelle `_build()` sans revérifier le mode global. `_build()` ne vérifie que `allowBuild`.
- Décision à prendre : préciser si `noBuild` doit annuler les compilations déjà programmées. Si oui, invalider ou annuler ces timers lors de la transition et vérifier le mode avant l'exécution différée.

## Métadonnées de template périmées après remplacement par un fichier plus ancien

- Reproduction automatisée : `template-cache-timestamp-round131.test.mjs` charge un vrai `template.avt.ts` nommé `Original`, remplace son contenu par `Edited` et recule son horodatage d'une minute. `TemplateScript.create()` rend toujours la même instance avec le nom `Original`.
- Cause : le cache recharge le script seulement si le `mtime` courant est strictement supérieur à celui mémorisé. Un remplacement par copie, extraction ou synchronisation peut conserver ou reculer cet horodatage.
- Décision à prendre : définir une invalidation fiable après remplacement du fichier, par exemple un identifiant de contenu ou une invalidation explicite lors des événements de fichiers, sans reparcourir inutilement chaque template à chaque demande.

## Clé i18n `__proto__` perdue dans les objets de travail

- Reproduction automatisée : `i18n-prototype-key-round132.test.mjs` remplace une clé ordinaire par `__proto__` dans un JSON valide. `keys` la contient, mais le parseur ne la présente pas comme propriété propre, `getKeyFromLocation()` ne la retrouve pas, l'export omet sa traduction et la validation signale à tort `Can't parse the json`. Le retour à une clé ordinaire rétablit ces fonctions.
- Cause : `I18nParser.parse()` et `transformForExport()` construisent des dictionnaires avec `{}` puis écrivent une propriété `__proto__`, qui agit sur le prototype au lieu d'être conservée comme clé propre. La validation intercepte ensuite l'exception et la transforme en erreur JSON générique.
- Décision à prendre : accepter ou refuser explicitement les noms de clés réservés par JavaScript. Si ces noms restent valides, utiliser des dictionnaires sans prototype ou des propriétés définies explicitement, et préserver un diagnostic précis en cas d'erreur réelle.

## Export statique toujours actif après destruction

- Reproduction automatisée : `static-destroy-export-round132.test.mjs` exporte un fichier, détruit l'instance `Static`, modifie la source puis rappelle `export()`. La destination est mise à jour et le rechargement HTTP est demandé une seconde fois.
- Cause : `Static.destroy()` ferme seulement le watcher ; `isReady` reste vrai et `export()` ne vérifie aucun état de destruction.
- Décision à prendre : définir si une instance détruite doit refuser ou ignorer les exports ultérieurs et si un export déjà commencé doit terminer. Dans le premier cas, invalider son état avant de fermer le watcher.

## Callback de modification encore actif après l'arrêt du gestionnaire de fichiers

- Reproduction automatisée : `files-shutdown-inflight-round132.test.mjs` suspend un callback `onContentChange`, appelle `FilesManager.onShutdown()`, puis observe la suppression du fichier en cache et du watcher avant la fin du callback. Une fois libéré, ce callback continue à s'exécuter après l'arrêt.
- Cause : `onShutdown()` attend les callbacks de suppression via `triggerDelete()`, mais `InternalAventusFile` ne suit ni n'attend les callbacks de modification déjà engagés.
- Décision à prendre : préciser si l'arrêt doit attendre ces callbacks ou les annuler. Si l'exécution après arrêt est permise, garantir qu'elle ne modifie pas des projets ou ressources déjà détruits.

## Imports npm enregistrés pendant un build désactivé

- Reproduction automatisée : `npm-disabled-registration-round133.test.mjs` enregistre un import dans `NpmBuilder` après `Build.disableBuild()`, puis appelle `Build.enableBuild()`. L'import reste stocké, mais `compile()` renvoie une sortie vide jusqu'à un appel manuel à `rebuildInfo()`.
- Cause : `register()` appelle `rebuildInfo()`, qui retourne immédiatement lorsque `isBuildAllowed` est faux ; `enableBuild()` rétablit seulement le booléen et ne reconstruit pas l'index npm.
- Décision à prendre : définir si `enableBuild()` doit reconstruire les imports npm enregistrés durant la pause. C'est notamment pertinent pour les transitions de fichiers de composant qui utilisent `disableBuild()` et `enableBuild()`.

## Réinscription perdue pendant une suppression différée

- Reproduction automatisée : `files-delete-reregister-round133.test.mjs` suspend le callback de suppression d'un fichier, puis réinscrit le même URI avec un nouveau contenu. `registerFile()` retourne l'ancienne instance marquée supprimée, dont le contenu ne change pas. Quand le callback se termine, le cache perd cet URI ; une troisième inscription crée enfin une nouvelle instance.
- Cause : `onDeletedUri()` conserve l'ancienne entrée jusqu'à la fin de `triggerDelete()`, tandis que `registerFile()` la traite comme un fichier existant. `InternalAventusFile.triggerContentChange()` ignore les changements après `deleted = true`.
- Décision à prendre : définir la priorité entre suppression et réapparition du fichier et garantir qu'une réinscription réussie reste dans le cache et le watcher.

## Sauvegarde acceptée sur un fichier déjà supprimé pendant l'arrêt

- Reproduction automatisée : `files-delete-reregister-round133.test.mjs` suspend un callback de suppression lancé par `FilesManager.onShutdown()`, puis appelle `onSave()` pour le même URI. Le callback de sauvegarde s'exécute alors que `file.isDeleted` vaut `true`, avant le retrait final du cache.
- Cause : `onShutdown()` laisse l'entrée en cache pendant le callback et `triggerSave()` ne vérifie pas l'état `deleted`.
- Décision à prendre : préciser si les notifications reçues pendant l'arrêt doivent être ignorées ou attendre sa fin ; éviter qu'une sauvegarde traite une instance déjà supprimée.

## Noms de locale i18n hérités des prototypes JavaScript

- Reproduction automatisée : `i18n-reserved-locales-round133.test.mjs` configure une locale `constructor` absente du JSON. La validation et l'action de correction ne la signalent pas ; une édition qui l'ajoute permet ensuite son export. Une locale `__proto__` présente dans le JSON disparaît de l'analyse et de l'export, et la validation signale à tort `Can't parse the json`. Une édition vers `fr` remplace cette erreur par `Locale not needed`.
- Cause : le parseur, la validation, l'action et l'export utilisent des objets `{}` et consultent les noms de locale avec un simple accès de propriété. Les noms hérités peuvent donc sembler présents sans propriété propre ; `__proto__` modifie le prototype lors de l'affectation.
- Décision à prendre : accepter ou refuser explicitement ces noms de locale. S'ils sont valides, utiliser des dictionnaires sans prototype et vérifier les propriétés propres dans le diagnostic, la correction et l'export.

## Suppression d'un partial SCSS importé

- Reproduction automatisée : `scss-import-delete-lifecycle-round134.test.mjs` compile un composant avec un partial, vérifie qu'une édition sauvegardée modifie le CSS, puis supprime le partial. `triggerDelete()` rejette avec une `TypeError`, le CSS consommateur reste sur l'ancienne valeur et la dépendance supprimée reste dans `build.scssFiles`.
- Cause : `AventusWebSCSSFile.onDelete()` supprime `usedBy[uri]` puis tente d'appeler `this.usedBy[uri].onContentChange()` sur l'entrée supprimée. La suppression ne déclenche donc pas de recompilation fiable des consommateurs.
- Décision à prendre : définir la sortie attendue après disparition d'un import SCSS et garantir que la suppression libère les liens de dépendance, rafraîchit les diagnostics et ne conserve pas de CSS périmé.

## Fichiers de traduction périmés après retrait d'une source ou d'une locale

- Reproduction automatisée : `build-i18n-rebuild-lifecycle-round134.test.mjs` lance trois `Build.build()` successifs avec sorties `singleFile` et `oneToOne`. Une édition actualise bien les sorties encore ciblées. Après retrait d'une locale et d'un fichier i18n, les fichiers JSON correspondants restent sur disque ; le rétablissement de la locale ne retire toujours pas les fichiers de la source supprimée.
- Cause : `writeBuildI18n()` écrit les sorties des locales et sources présentes, sans suivre ni supprimer les fichiers produits par les compilations précédentes.
- Décision à prendre : déterminer si le build doit nettoyer uniquement ses propres anciennes sorties i18n lorsque les locales, sources ou modes changent ; préserver les fichiers extérieurs au build dans les mêmes répertoires.

## Alias Windows sensibles à la casse des chemins

- Reproduction automatisée : `project-alias-case-round135.test.mjs` résout `@src/item` depuis `C:\\Workspace\\Project\\src`, puis depuis le même dossier écrit `c:\\workspace\\project\\src`. Le premier donne `./item` ; le second remonte inutilement l'arborescence avant de redescendre vers l'alias.
- Cause : `Project.resolveAlias()` compare les segments normalisés avec `==`, sans tenir compte de l'insensibilité à la casse des chemins Windows.
- Décision à prendre : définir la comparaison des chemins selon la plateforme et conserver une résolution relative stable lorsque seul l'usage des majuscules change.

## Désinstallation de template pilotée par un chemin non proposé

- Reproduction automatisée : `template-uninstall-response-round137.test.mjs` présente un seul template installé, puis simule une réponse de sélection contenant le chemin d'un autre dossier temporaire. `selectTemplateToUninstall()` supprime cet autre dossier, conserve le template installé et annonce quand même la suppression.
- Cause : la commande utilise directement `item.detail` renvoyé par `SelectMultiple()` pour calculer le dossier à supprimer, sans retrouver l'élément parmi les choix proposés ni vérifier que le chemin appartient à un registre de templates.
- Décision à prendre : résoudre la sélection vers les entrées proposées et limiter la suppression aux dossiers enregistrés et autorisés ; prévoir le comportement pour une réponse périmée ou altérée.

## Builds dupliqués après une sauvegarde de configuration inchangée

- Reproduction automatisée : `project-unchanged-save-round137.test.mjs` charge un projet avec un build, puis sauvegarde à nouveau le même contenu. `Project.onConfigSave()` détruit l'instance initiale mais la conserve dans `builds` et ajoute une seconde instance du même nom. La liste expose deux builds homonymes ; une configuration invalide ultérieure détruit les deux.
- Cause : `loadConfig()` retourne tôt lorsque la configuration est identique, tandis que `onConfigSave()` poursuit la destruction et la création des builds sans vider le tableau.
- Décision à prendre : ignorer la sauvegarde inchangée ou remplacer proprement les instances, puis vérifier les listes et le routage des commandes après plusieurs sauvegardes successives.

## Clé i18n JSON non échappée dans la déclaration TypeScript générée

- Reproduction automatisée : `i18n-generated-type-escape-round138.test.mjs` crée un fichier i18n global avec une clé contenant un saut de ligne JSON échappé. La validation i18n ne signale aucune erreur et l'export conserve la clé ; la déclaration `AventusI18n` générée contient le saut de ligne littéral entre guillemets et le parseur TypeScript remonte une erreur. Une clé contenant les deux caractères antislash et `t` produit un type TypeScript syntaxiquement valide, mais dont le nom de propriété contient une tabulation. Renommer les clés par édition rétablit les déclarations attendues.
- Cause : `AventusI18nFile.onContentChange()` n'échappe que les guillemets lorsqu'il insère les clés dans les littéraux de la déclaration TypeScript.
- Décision à prendre : échapper toutes les clés pour un littéral TypeScript valide, ou refuser explicitement celles qui ne peuvent pas être représentées ; vérifier aussi les retours chariot et antislashs.
