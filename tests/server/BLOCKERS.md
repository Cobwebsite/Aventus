# Cas serveur en attente de changement de code

Ce fichier conserve les cas reproductibles rencontrés pendant l'écriture des tests. Les changements de `server/src` pour ces points sont décidés avec l'utilisateur, un par un.

## Archive Store invalide conservée dans le dossier temporaire

- Source : `server/src/files/TemplateManager.ts`, méthode `downloadTemplateFromStore`.
- Reproduction automatisée : `template-store-archive-round17.test.mjs` télécharge une archive ZIP invalide ; l'installation est refusée, mais `temp/packageTemp/temp.zip` reste présent après le retour.
- Décision : préciser si chaque échec de téléchargement, d'extraction ou de validation doit supprimer les fichiers temporaires avant une nouvelle tentative.

## Erreurs des premières configurations de compilation perdues

- Source : `server/src/project/Build.ts`, méthode `_build`.
- Reproduction automatisée : `build-pipeline-round17.test.mjs` lance deux configurations `compile` qui produisent chacune une erreur.
- Résultat actuel : la notification `aventus/compiled` ne contient que l'erreur de la dernière configuration, car `buildErrors` est réaffecté à chaque `writeBuildCode`.
- Décision : agréger les erreurs de toutes les configurations avant la notification si celle-ci doit représenter le build complet.

## Option `autoInit` quotée du décorateur Effect

- Source : `server/src/language-services/ts/parser/decorators/EffectDecorator.ts` et construction des objets littéraux dans le parseur TypeScript.
- Reproduction automatisée : `ts-reactive-decorators-round19.test.mjs` compare `@Effect({autoInit:false})` à `@Effect({"autoInit":false})`.
- Résultat actuel : la clé non quotée donne `false`, tandis que la clé quotée conserve la valeur par défaut `true`. Décider si les noms de propriétés quotés doivent être acceptés, puis normaliser leur lecture si oui.

## Fusion lancée depuis le fichier de style

- Source : `server/src/cmds/MergeComponent.ts`, expression `regex` de `run`.
- Reproduction : composant séparé `Button.wcl.avt`, `Button.wcv.avt`, `Button.wcs.avt` ; lancer la fusion depuis `Button.wcs.avt`.
- Résultat actuel selon le code : la regex répète `.wcv.avt` et ne reconnaît pas `.wcs.avt`. Les sources ne sont pas retrouvées, la suppression du dossier peut échouer et une sortie au nom erroné peut déjà avoir été écrite.
- Résultat attendu : fusion identique depuis chacun des trois fichiers, sans sortie partielle.

## Création dans un dossier voisin du projet

- Source : `server/src/cmds/Create.ts`, `checkIfProject`.
- Reproduction automatisée : `command-notification-round10.test.mjs` configure le projet `app` puis lance la création dans `app-extra`.
- Résultat actuel : `startsWith` classe le dossier voisin dans le projet et l'envoie à `localTemplateManager.createTemplate`.
- Résultat attendu : comparer les segments des chemins avant de décider du projet parent.

## Arrêt de surveillance d'un fichier

- Source : `server/src/files/FilesWatcher.ts`, méthode `unwatch`.
- Reproduction : appeler `watch(uri)` puis `unwatch(uri)` avec un watcher actif.
- Résultat actuel : l'URI quitte la liste interne, mais `watcher.unwatch(path)` n'est jamais appelé.
- Résultat attendu : le watcher sous-jacent cesse aussi de surveiller le chemin.

## Notification de modification des réglages

- Source : `server/src/notification/SetSettings.ts`, méthode `send`.
- Reproduction automatisée : `notification-edge-round5.test.mjs` intercepte l'envoi et constate que la promesse de `SetSettings.send` reste pendante.
- Résultat actuel : la notification est envoyée, mais la promesse créée n'appelle jamais `resolve` et reste en attente indéfiniment.
- Décision à prendre : préciser si cette méthode doit renvoyer `void` ou une promesse liée à un accusé de réception réel.

## Fin de la commande de formatage

- Source : `server/src/cmds/Format.ts`, méthode `run`.
- Reproduction : attendre `Format.run(uri)` avec un `showLoadingMessage` dont l'action de formatage est asynchrone.
- Résultat actuel : `Format.run` se résout avant la fin de l'action et de l'écriture du fichier, car l'appel à `GenericServer.showLoadingMessage` n'est pas attendu.
- Décision à prendre : confirmer si l'appelant doit pouvoir attendre la fin du formatage ; dans ce cas, retourner ou attendre cette promesse.

## Fin des commandes de notification de fichiers

- Source : `server/src/cmds/file-system/FileCreated.ts`, `FileUpdated.ts`, `FileDeleted.ts`.
- Résultat actuel : `run` appelle le gestionnaire sans `return` ni `await`. La commande se termine avant l'action et ne transmet pas un éventuel rejet asynchrone.
- Décision à prendre : préciser si la réponse de commande doit couvrir la fin du traitement ; dans ce cas, retourner ou attendre sa promesse.

## Sélection répétée lors de la publication d'un package

- Source : `server/src/cmds/store/PublishPackage.ts`, boucle sur les builds disponibles.
- Résultat actuel avec deux builds : `GenericServer.Select` est appelé une première fois avec le premier build puis de nouveau avec les deux ; le second choix remplace le premier.
- Résultat attendu : construire la liste entière, puis afficher une seule sélection.

## Ajout d'une traduction sans effet observable

- Source : `server/src/language-services/i18n/LanguageService.ts`, `addValueToFile`.
- Reproduction automatisée : `i18n-add-value-round8.test.mjs` ajoute une clé et constate qu'aucune édition n'est renvoyée et que document, version et objet de traductions restent inchangés.
- Résultat actuel : la méthode construit un objet et un nouveau `TextDocument`, sans appliquer le document au fichier ni le renvoyer.
- Décision à prendre : définir l'effet attendu de la commande d'ajout de traduction avant un test de bout en bout.

## Préfixe et capacités des traductions i18n

- `AventusI18nFile.transformForExport` produit `Demo°°hello` lorsque le module est `Demo` et que `classInfo` est absent. Décider si le séparateur vide est voulu, s'il faut produire `Demo°hello`, ou signaler une erreur.
- Les fichiers i18n renvoient actuellement une complétion vide et `null` pour hover, définition et renommage. Préciser si ces capacités du TODO sont attendues avant de figer les assertions.
- `i18n-boundaries-round14.test.mjs` précise les limites de plage et la sélection multi-build ; les attentes positives de navigation restent à définir.

## Mise à jour des manifestes

- Les générateurs Custom Elements, HTML Custom Data, Emmet Custom Data et Web Types disposent de `register` mais d'aucune opération `unregister` ni remise à zéro publique. Un nouvel enregistrement peut donc ajouter une entrée en double ou laisser une entrée périmée.
- Reproduction automatisée : `manifest-lifecycle-round10.test.mjs` change le tag d'un composant après un premier enregistrement ; les quatre formats conservent l'ancienne entrée en plus de la nouvelle.
- Décision à prendre : reconstruire les manifestes lors de la modification, du renommage ou de la suppression d'un composant, ou exposer un mécanisme de retrait.

## Sélection avec libellés homonymes

- Source : `server/src/notification/AskSelect.ts`, méthode `resolve`.
- Reproduction automatisée : `command-notification-round10.test.mjs` répond avec la première de deux options ayant le même `label`.
- Résultat actuel : la réponse est remplacée par la dernière option portant ce libellé. Décider comment conserver un identifiant ou un index stable pour les options homonymes.

## Migration 1.4.1 dans les valeurs JSON

- Source : `server/src/updates/1.4.1.ts`.
- Reproduction automatisée : `migrations-round10.test.mjs` contient le mot `dependances` dans une description JSON.
- Résultat actuel : la migration remplace aussi ce mot dans la valeur. Décider si la transformation doit cibler seulement les clés de dépendances.

## Scénarios d'intégration encore ouverts

- Le protocole est testé au niveau des handlers et de l'adaptateur VS Code simulé. Un échange JSON-RPC réel avec `server.ts` reste à vérifier dans un processus isolé.
- Le renommage détecté sur disque, la sélection de tous les services par extension et les projets complets demandent encore des fixtures intégrées. La fenêtre de deux secondes de `FilesManager.preventUpdateUri` est testée fonctionnellement sans horloge simulée pour sa durée exacte.
- La compilation SCSS complète, les liens vue/classe/style, les composants HTML enregistrés dynamiquement et leurs interactions avec les builds demandent des fixtures de projet intégrées. Le chargement isolé du service HTML en bundle CommonJS échoue sur une dépendance circulaire ; cela ne démontre pas un défaut à l'exécution du serveur.
- Le test HTTP de traversée de chemin confirme l'absence de divulgation ; le middleware journalise toutefois `ForbiddenError` sur stderr. Décider si ce journal est acceptable.
- La génération Storybook est testée au niveau des titres et contenus MDX/stories. La copie complète des ressources depuis l'extension et la mise à jour après suppression demandent une fixture intégrée.
- Les scénarios TypeScript avec plusieurs vrais fichiers et le service LSP complet restent à couvrir avec un banc d'intégration. Le chargement direct de `ParserTs.ts` en bundle CommonJS échoue sur l'ordre d'une dépendance circulaire ; le chargement conjoint de `FileSelector.ts` et `ParserTs.ts` fonctionne et sert déjà aux tests du modèle.
- `AventusTsFileSelector` renvoie `null` pour `.wc`, `.package` et `.template`. Déterminer si leur routage relève d'autres gestionnaires (probable) ou de ce sélecteur, puis le vérifier avec des fixtures ciblées.

## Nouvel essai de compilation npm après erreur

- Source : `server/src/project/BuildNpm.ts`, méthode `compile`.
- Reproduction automatisée : `npm-retry-round8.test.mjs` compile avec un module absent, installe le module, puis recompile avec les mêmes imports. La même erreur est renvoyée, même après `unregister()` et `register()` identiques.
- Résultat actuel : les informations de compilation sont mises en cache avant le résultat d'esbuild ; `lastInfo` et `lastInfoToCompile` restent égaux au texte généré après l'échec.
- Décision à prendre : relancer systématiquement après un échec ou invalider le cache lors de l'apparition du module.

## Import npm nommé avec namespace du même module

- Source : `server/src/project/BuildNpm.ts`, `NpmBuilder.writeFileToCompile`.
- Reproduction automatisée : `npm-import-combinations-round9.test.mjs` compile puis exécute un module avec deux alias nommés et un alias `*`. Les alias nommés pointent vers l'objet namespace entier au lieu de la valeur exportée.
- Décider si les alias nommés doivent rester des valeurs individuelles en présence d'un import global du même module.

## Import npm wildcard invalide conservé

- Source : `server/src/project/BuildNpm.ts`, `NpmBuilder.register` et `rebuildInfo`.
- Reproduction automatisée : `npm-import-combinations-round9.test.mjs` enregistre `libName: '*'` sans alias. `register` lève, mais garde l'entrée dans `storedInfo` ; `rebuildInfo` échoue encore jusqu'au retrait du fichier.
- Décider de valider avant l'enregistrement ou d'annuler l'entrée lors de l'exception.

## Cycle de dépendances

- Source : `server/src/project/DependencyManager.ts`, `orderLoop`.
- Résultat actuel selon le parcours du code : un cycle `A → B → A` n'est pas détecté comme tel ; la récursion se termine en débordement de pile.
- Décision à prendre : définir le diagnostic attendu pour un cycle avant d'ajouter un test actif.

## Section Build générée invalide

- Source : `server/src/cmds/AddConfigSection.ts`.
- Résultat actuel : la commande écrit `compile` comme objet, alors que le schéma et le type `AventusConfigBuild` attendent un tableau. Le fichier généré ne peut donc plus être chargé comme configuration valide.
- Test à activer après correction : valider sans diagnostic la configuration écrite par la commande.

## README explicitement configuré lors de la publication d'un package

- Source : `server/src/store/Store.ts`, méthode `publishPackage`.
- Reproduction automatisée : `store.test.mjs` configure un fichier `CUSTOM-README.test.md` présent uniquement dans le projet. Le nom évite le `README.md` de la racine du dépôt, que le code trouve aussi depuis le répertoire courant.
- Résultat actuel : `finalPath` devient absolu, puis `readFileSync(join(rootPath, finalPath))` recompose un chemin de type `D:\projet\D:\projet\CUSTOM-README.test.md` et lève `ENOENT` avant l'envoi.
- Résultat attendu : lire le fichier README configuré et l'ajouter au formulaire.

## Identifiants du store écrits dans la console

- Source : `server/src/cmds/store/Connect.ts`, méthode `run`.
- Reproduction automatisée : `store-commands.test.mjs` intercepte `console.log` et reçoit l'identifiant et le mot de passe de test après la saisie, avant `Store.connect`.
- Résultat attendu : ne pas écrire le mot de passe ni l'identifiant dans les journaux du serveur.

## Sortie statique conservée après suppression de la source

- Source : `server/src/project/Static.ts`, méthode `export`.
- Reproduction automatisée : `static-export-round8.test.mjs` exporte deux fichiers, supprime une source, puis rappelle `export()` en vérifiant que l'autre sortie est actualisée.
- Résultat actuel : `output/data.txt` reste présent. Décider si la sortie doit être synchronisée avec les sources, en protégeant les fichiers d'autres builds.
- `static-removal-categories-round43.test.mjs` confirme ce résultat sur deux destinations aussi pour une copie binaire, le CSS issu d'un SCSS et le CSS d'un style global ; les autres ressources sont bien actualisées.
- Les sous-dossiers, contrairement à une hypothèse précédente, sont correctement exportés ; un test actif le confirme.

## Compilation différée après destruction du build

- Source : `server/src/project/Build.ts`, méthodes `build` et `destroy`.
- Reproduction automatisée : `build-resource-lifecycle.test.mjs` planifie une compilation, détruit le build puis observe un appel à `_build()` après la notification de retrait. `destroy` n'annule pas `timerBuild`.
- `project-destroy-round38.test.mjs` confirme le même comportement dans un vrai projet contenant un build et un export statique ; les abonnements et le watcher statique sont bien libérés, mais le timer du build se déclenche encore.
- Résultat attendu : annuler la compilation différée et empêcher une écriture ou des diagnostics après destruction.

## Suppression sur disque non attendue par le gestionnaire

- Source : `server/src/files/FilesManager.ts`, `onUpdatedUri` et `onClose`.
- Reproduction automatisée : `files-disk-events.test.mjs` utilise un callback de suppression retenu par une promesse contrôlée, puis attend `onUpdatedUri(uri)`.
- Résultat actuel : la méthode appelle `onDeletedUri(uri)` sans `await` ; sa promesse se termine alors que le fichier reste dans le cache et que les callbacks de suppression n'ont pas fini.
- Résultat attendu : clarifier si la promesse doit couvrir la suppression complète ; dans ce cas, l'attendre.

## Correspondance d'espace de travail par préfixe brut

- Source : `server/src/files/TemplateManager.ts`, `findWorkspace`.
- Reproduction automatisée : `template-manager.test.mjs` cherche `D:\\apple\\src` avec `D:\\app` dans les espaces de travail, puis cherche un chemin enfant lorsque les racines sont `D:\\app` et `D:\\app\\feature`.
- Résultat actuel : la méthode choisit le préfixe `D:\\app` dans les deux cas. Celui-ci n'est pas parent du dossier voisin, et la racine imbriquée plus précise n'est pas retenue.
- Résultat attendu : comparer les segments des chemins normalisés et choisir le parent le plus précis.

## Import npm par défaut

- Source : `server/src/language-services/ts/parser/ImportInfo.ts`, branche de `ImportInfo.Parse` pour `import Item from "package"`.
- Résultat actuel selon le code : une méthode statique passe `this.name` à `npmBuilder.register` et indexe `npmImports[this.name]` ; `this` désigne la classe, pas l'identifiant importé.
- Test à activer après correction : vérifier `libName: 'default'`, `alias: 'Item'` et `npmImports.Item`.

## Plusieurs tags HTML internes liés au même fichier

- Source : `server/src/language-services/html/LanguageService.ts`, `removeInternalTagUri`.
- Reproduction automatisée : `html-definition-lifecycle.test.mjs` associe deux tags à la même URI, les retire par source et constate que le second reste enregistré. Un tag provenant d'une autre URI est conservé.
- Décision à prendre : retirer toutes les associations ou garantir qu'un fichier n'enregistre qu'un seul tag.

## Intégrations encore à compléter après le deuxième passage

- Le processus serveur échange désormais de vraies trames JSON-RPC pour `initialize`, `didOpen`, `didChange`, `didClose` et `hover`. L'initialisation complète d'un espace, la validation du contenu et les diagnostics de service restent à vérifier.
- La sélection et l'installation de templates/projets locaux sont testées avec dossiers temporaires. L'exécution réelle du script dans son processus enfant, l'import Git/Store et le remplacement d'une installation restent à couvrir.
- Le package Aventus est généré, relu et reconstruit dans les tests. Un build multi-fichiers complet avec vues, styles, npm et dépendances reste à vérifier.
- Le modèle et une compilation simple TypeScript, la complétion et le formatage HTML, ainsi que les liens HTML–SCSS sont testés. Les décorateurs, composants complets, boucles conditionnelles et liens vue/classe restent à couvrir avec une fixture de projet.

## Métadonnées npm mal formées

- Source : `server/src/language-services/ts/libLoader.ts`, `loadNodeModules`.
- Reproduction automatisée : `ts-lib-loader-round4.test.mjs` crée un paquet avec un `package.json` invalide.
- Résultat actuel : `JSON.parse` lève `SyntaxError` et interrompt la découverte, y compris pour les autres paquets valides.
- Décision à prendre : ignorer le paquet invalide avec un diagnostic ou interrompre explicitement le chargement.

## Priorité des templates homonymes

- Source : `server/src/files/TemplateManager.ts`, `readTemplates`.
- Reproduction automatisée : `template-sources-round4.test.mjs` contrôle l'ordre de fin de deux `TemplateScript.create` de même nom, puis l'inverse. Le dernier terminé remplace l'autre, quel que soit l'ordre des répertoires. Le compteur `nb` vaut deux alors que le registre ne contient qu'un template.
- Décision à prendre : définir la priorité des répertoires et si `nb` doit compter les scripts valides ou les noms disponibles.

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
- Les anciens objets `Static` restent accessibles à `getStatic` et `buildAll` même après `destroy()` ; le test vérifie que `buildAll()` réexporte les trois anciennes sorties après invalidation. Décision à prendre : vider la collection au rechargement et à l'invalidation, puis préciser le sort des fichiers déjà produits.

## Condition HTML externe perdue avec une boucle interne

- Reproduction automatisée : `html-nested-controls-round33.test.mjs` parse `if (ready) { for (const item of items) { <li>{{item}}</li> } }`. Le code compilé contient le contrôle externe, mais `ifs[0].conditions` est vide. Dans l'ordre inverse, la condition interne `item.active` est conservée.
- Source à examiner : `server/src/language-services/html/parser/ParserHtml.ts`. Décider comment préserver les conditions des contrôles parents dans les structures imbriquées.

## Expression HTML invalide sans erreur du parseur isolé

- Reproduction automatisée : `html-nested-controls-round33.test.mjs` constate que `ParserHtml.parse` renvoie `errors: []` pour `<div :value="{{bad(}}"></div>`.
- Décision à prendre : vérifier si la validation TypeScript ultérieure doit produire le diagnostic et définir sa plage source. Ce constat ne prouve pas l'absence de diagnostic dans le LSP complet.

## Options d'objet des décorateurs `I18n` et `OverrideView`

- Reproduction automatisée : `ts-decorators-options-round33.test.mjs` parse `@I18n({"autoInit":false})` et `@OverrideView({"removeViewVariables":["title","button"]})`. Dans ce parcours, `I18nDecorator.is` conserve `autoInit: true` et `OverrideViewDecorator.is` une liste vide, comme sans argument.
- Décision à prendre : préciser la syntaxe d'objet acceptée et corriger la conversion ou le décodage des arguments pour que les options explicites prennent effet.

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

## Sources npm obsolètes après reconstruction

- Reproduction automatisée : `build-npm-package-round26.test.mjs` écrit un package avec `__src/obsolete.ts`, puis reconstruit les mêmes sorties sans cette source. `index.js` est actualisé, mais `__src/obsolete.ts` reste présent dans chaque destination.
- Source : `server/src/project/Build.ts`, `writeBuildNpm`. La suppression préalable de `__src` est commentée.
- Décision à prendre : préciser si la reconstruction doit supprimer les sources générées devenues obsolètes tout en préservant d'éventuels fichiers utilisateur. Après correction, exiger leur absence dans toutes les destinations.

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

## Documentation des packages contenant seulement des fonctions

- Source : `server/src/manifest/ManifestPackage.ts`, `ManifestPackageMd`.
- Reproduction automatisée : `manifest-package.test.mjs` exporte uniquement une fonction TypeScript documentée.
- Résultat actuel : `loadFunction` ajoute la fonction aux parties détaillées, mais pas aux aperçus. Le constructeur n'écrit le Markdown que si un aperçu existe ; il renvoie donc une chaîne vide. La même fonction est bien documentée lorsqu'une classe figure aussi dans le package.
- Résultat attendu à confirmer : produire l'aperçu et la documentation des fonctions même sans classe exportée.

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
