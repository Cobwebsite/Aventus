# Plan de tests du serveur

Cocher un point seulement lorsqu'un test automatisé vérifie son résultat. Pour les modules qui écrivent sur disque ou contactent un service, utiliser un dossier temporaire ou une dépendance simulée, puis vérifier aussi le nettoyage. Tester au minimum le cas nominal, les entrées invalides et les effets après modification ou suppression lorsque cela s'applique.

## Couverture déjà en place

- [x] Concurrence : ordre d'attente de `Mutex`, mutualisation, séparation des clés, échec et nouvel essai de `ActionGuard` (`concurrency.test.mjs`).
- [x] Couleurs : lecture et formatage hex/RGB/HSL, valeurs invalides, conversion RGB ↔ HSL, canal alpha conservé et contrôle des gamuts (`color.test.mjs`).
- [x] i18n : extraction des clés/locales/plages, validation des locales, diagnostics JSON et formatage (`i18n-parser.test.mjs`, `i18n-service.test.mjs`).
- [x] TypeScript : extraction des arguments et objets littéraux, drapeaux et détection du `Date` natif (`ts-parser-tools.test.mjs`, `forbidden-globals.test.mjs`).
- [x] Utilitaires : URI, extension/langage, diagnostics, plages, mots et objets imbriqués (`tools.test.mjs`).
- [x] Fichiers : métadonnées, callbacks, réponses LSP et éditions de texte ; recherche des fichiers par URI/chemin/extension ; surveillance et fermeture (`aventus-file.test.mjs`, `files-manager.test.mjs`, `files-watcher.test.mjs`).
- [x] Configuration et projets : paramètres, validation et formatage JSON, alias, sélection des builds, routage et renommage (`settings.test.mjs`, `json-service.test.mjs`, `project.test.mjs`, `project-manager.test.mjs`).
- [x] Modèles et documentation : types courants, JSDoc, sorties de manifestes, registres de templates et fusion HTML (`type-info.test.mjs`, `documentation-info.test.mjs`, `manifest.test.mjs`, `manifest-formats.test.mjs`, `template-manager.test.mjs`, `html-parser.test.mjs`).
- [x] Commandes et notifications : enregistrement, routage, entrées, sélections et annulation (`dispatch.test.mjs`, `notifications.test.mjs`).
- [x] Npm, HTTP et color picker : imports, messages de mise à jour, rechargement regroupé et présentations de couleurs (`npm-builder.test.mjs`, `http-server.test.mjs`, `color-picker.test.mjs`).
- [x] Protocole et cycle de vie : handlers LSP, adaptateur VS Code, espaces de travail, cache, fichiers et diagnostics (`protocol-routing.test.mjs`, `vscode-connection.test.mjs`, `files-workspace-lifecycle.test.mjs`).
- [x] Build et projet : configuration préparée, activation, ordre des dépendances, compilation npm réelle, rechargement des projets et sélection des sorties (`config-preparation.test.mjs`, `build-behavior.test.mjs`, `dependency-manager.test.mjs`, `npm-build-integration.test.mjs`, `project-config-lifecycle.test.mjs`, `build-commands.test.mjs`).
- [x] Langages : sélection et modèle TypeScript, HTML, SCSS et commandes i18n (`ts-file-selector.test.mjs`, `ts-parser-model.test.mjs`, `html-behavior.test.mjs`, `scss-service.test.mjs`, `i18n-actions.test.mjs`, `i18n-communication.test.mjs`, `i18n-file.test.mjs`).
- [x] Sorties et services : manifestes, Storybook, serveur HTTP réel, store et archive, migrations, statistiques, notifications et commandes (`manifest-coverage.test.mjs`, `manifest-package.test.mjs`, `storybook.test.mjs`, `http-server-integration.test.mjs`, `store.test.mjs`, `migrations.test.mjs`, `statistics.test.mjs`, `notification-channels.test.mjs`, `command-delegation.test.mjs`, `format-command.test.mjs`, `add-config-section-command.test.mjs`).
- [x] Deuxième passage : trames JSON-RPC avec processus serveur, événements disque, templates locaux, package Aventus généré et relu, export statique, compilation TS simple, définitions HTML et liens SCSS (`jsonrpc-process.test.mjs`, `files-disk-events.test.mjs`, `local-template-project.test.mjs`, `template-installation.test.mjs`, `build-package-integration.test.mjs`, `static-export-integration.test.mjs`, `ts-simple-compilation.test.mjs`, `html-definition-lifecycle.test.mjs`, `html-scss-parser-interaction.test.mjs`).
- [x] Deuxième passage : imports TS, sélection de dépendances, ressources de build, commandes WebComponent et store, notifications et cycle de `Mutex` (`ts-import-behavior.test.mjs`, `build-dependency-selection.test.mjs`, `build-resource-lifecycle.test.mjs`, `webcomponent-commands.test.mjs`, `store-commands.test.mjs`, `notification-channels.test.mjs`, `concurrency.test.mjs`).
- [x] Passage approfondi : décorateurs TS, flux conditionnel HTML, navigation et hover HTML–TS, services de template et routage des fichiers, écriture de manifestes (`ts-decorators-deep.test.mjs`, `html-control-flow-deep.test.mjs`, `html-ts-lsp-deep.test.mjs`, `template-language-service.test.mjs`, `files-manager-deep.test.mjs`, `manifest-write.test.mjs`, `manifest-package-write.test.mjs`).
- [x] Passage approfondi : création, renommage, fusion et séparation de composants ; exports Sharp/PHP et mise à jour des outils avec convertisseurs simulés (`component-conversion-commands.test.mjs`, `create-rename-commands.test.mjs`, `converter-commands.test.mjs`).
- [x] Passage approfondi : manifeste package écrit et mis à jour, écritures des manifestes de composant, environnement Storybook copié depuis une extension fixture (`manifest-package-write.test.mjs`, `manifest-write.test.mjs`, `storybook-environment.test.mjs`).
- [x] Passage approfondi : fermeture des fichiers, effacement des diagnostics, remplacement et annulation d'installation de templates (`files-close-diagnostics.test.mjs`, `template-installation-edges.test.mjs`).
- [x] Passage approfondi : compilation de composant avec vrai parseur TS/HTML, versions, vue, style et diagnostic de classe absente (`component-compiler-boundaries.test.mjs`).
- [x] Passage approfondi : commandes de notifications fichiers, store, i18n, Sharp et PHP avec annulation et erreurs simulées (`command-boundaries-next.test.mjs`, `i18n-command-next.test.mjs`, `converter-edge-next.test.mjs`).
- [x] Assemblage du manifeste : membres locaux/hérités, attributs, variables CSS, slots, ordre, classe absente et exclusion de namespace (`manifest-register.test.mjs`).
- [x] Documentation de package : signature générique, type de retour et comportement d'un package contenant seulement une fonction (`manifest-package.test.mjs`).
- [x] Cycle de vie du build : compilation différée observée après destruction, avec anomalie reproduite et consignée (`build-resource-lifecycle.test.mjs`).
- [x] Espaces de travail imbriqués : découverte doublée de la configuration enfant et callback de changement superflu avec le cache réel (`files-multiworkspace-round4.test.mjs`).
- [x] Événements disque : mise à jour, puis suppression asynchrone d'un fichier absent avec ordre des callbacks vérifié (`files-disk-events.test.mjs`).
- [x] Templates homonymes : sélection selon l'ordre de fin de chargement et compteur des scripts lus (`template-sources-round4.test.mjs`).
- [x] Définitions HTML : retrait par URI avec plusieurs tags enregistrés pour une même source (`html-definition-lifecycle.test.mjs`).
- [x] Templates : sélection d'espace de travail avec dossier voisin et racines imbriquées (`template-manager.test.mjs`).
- [x] Concurrence : attente abandonnée par `Mutex.dispose`, appels `release` supplémentaires et surcharge sans clé d'`ActionGuard` (`concurrency.test.mjs`).
- [x] Initialisation IDE/CLI : chemins de stockage et d'extension transmis, mode sans build par défaut, premier espace et lancement de la vérification de mise à jour (`protocol-routing.test.mjs`).
- [x] Publication Store : fichier README explicitement configuré, présent dans le projet, avec échec actuel reproduit (`store.test.mjs`).
- [x] Connexion Store : prompts et fuite actuelle des identifiants dans `console.log` reproduite (`store-commands.test.mjs`).
- [x] Cinquième passage : agrégation projet/build et renommage, import npm, sorties i18n, parsing et service i18n, fusion HTML, buffering des fichiers, validation différée et notifications (`project-aggregation-round5.test.mjs`, `npm-builder-lifecycle-round5.test.mjs`, `build-i18n-output-round5.test.mjs`, `i18n-parser-round5.test.mjs`, `i18n-service-round5.test.mjs`, `html-parser-merge-round5.test.mjs`, `aventus-file-buffering-round5.test.mjs`, `notification-edge-round5.test.mjs`).
- [x] i18n : doublons de clés de message et de locale avec sévérité et plage des diagnostics (`i18n-duplicates-round6.test.mjs`).
- [x] Sixième passage : diffusion HTTP/WebSocket, génération Storybook de plusieurs déclarations, transitions de réglages, notifications concurrentes, copie des règles IA et routage du watcher (`output-protocol-round6.test.mjs`, `settings-lifecycle-round6.test.mjs`, `notification-concurrency-round6.test.mjs`, `ai-rules-command-round6.test.mjs`, `files-watcher-dispatch-round6.test.mjs`).
- [x] Color picker : omission d'une couleur à l'index zéro et exception sur la première ligne reproduites (`color-picker-locations-round7.test.mjs`).
- [x] Septième passage : cache du parseur HTML, variables CSS globales, templates globaux, service LSP TypeScript et cache du parseur TS (`html-parser-cache-round7.test.mjs`, `scss-global-variables-round7.test.mjs`, `template-global-round7.test.mjs`, `ts-lsp-round7.test.mjs`, `ts-parser-cache-round7.test.mjs`).
- [x] Types TS avancés : structure mapped/infer et rendus erronés de `keyof` et des types conditionnels reproduits (`type-info-advanced-round8.test.mjs`).
- [x] i18n : absence d'effet observable de l'ajout d'une valeur reproduite (`i18n-add-value-round8.test.mjs`).
- [x] Huitième passage : champs et méthodes de Custom Elements, attributs Web Types, stories Storybook obsolètes et composant interactif (`manifest-depth-round8.test.mjs`, `storybook-clear-round8.test.mjs`, `storybook-component-round8.test.mjs`).
- [x] Huitième passage build : export SCSS statique, reprise après erreur Sass, suppression de source et tentative npm après installation d'un module manquant (`static-export-round8.test.mjs`, `npm-retry-round8.test.mjs`).
- [x] Huitième passage protocole : processus LSP réel, paramètres, ouverture/modification/fermeture, requêtes, diagnostics JSON corrigés et arrêt (`jsonrpc-lifecycle-round8.test.mjs`).
- [x] Agrégations : sorties statiques confondues avec les builds et résolution de complétion non attendue reproduites (`aggregation-gaps-round9.test.mjs`).
- [x] Neuvième passage npm : bundle exécuté avec imports nommés et namespace, validation wildcard et reprise après activation du build (`npm-import-combinations-round9.test.mjs`).
- [x] Neuvième passage langages et fichiers : résolution des déclarations TS, sélecteurs SCSS, réponses LSP absentes, cache et sélection des templates (`ts-parser-resolution-round9.test.mjs`, `scss-selector-rules-round9.test.mjs`, `files-protocol-missing-round9.test.mjs`, `template-script-cache-round9.test.mjs`, `template-query-round9.test.mjs`).
- [x] Dixième passage : réponses de commandes et sélections homonymes, formatage groupé, dossiers voisins, cycle de plusieurs composants dans les manifestes, dispatch Storybook, statistiques, migration et fermeture WebSocket (`command-notification-round10.test.mjs`, `manifest-lifecycle-round10.test.mjs`, `storybook-dispatch-round10.test.mjs`, `statistics-round10.test.mjs`, `migrations-round10.test.mjs`, `http-websocket-round10.test.mjs`).
- [x] Onzième passage : lecture ciblée des dossiers et suppression des échos disque, diagnostics i18n entre locales, références SCSS globales, sélection des builds et alias aux limites des chemins, exécution réelle d'un script de template en processus enfant (`files-protocol-round11.test.mjs`, `i18n-validation-round11.test.mjs`, `scss-global-lsp-round11.test.mjs`, `project-selection-round11.test.mjs`, `template-child-process-round11.test.mjs`).
- [x] Douzième passage : requêtes JSON-RPC sur un processus réel, callbacks de fichiers et nettoyage des diagnostics, exports statiques et packages reconstruits vers plusieurs destinations, protocole Store et contexte des couleurs CSS (`jsonrpc-lifecycle-round8.test.mjs`, `files-callback-lifecycle-round12.test.mjs`, `static-global-style-round12.test.mjs`, `build-package-multiple-output-round12.test.mjs`, `store-protocol-round12.test.mjs`, `color-picker-context-round12.test.mjs`).
- [x] Treizième passage : navigation et renommage TypeScript entre fichiers, formatage et complétion HTML, génération réelle de templates et cycle des projets intégrés, erreurs et échanges Store/HTTP, couleurs multilignes et réponses concurrentes aux popups (`ts-html-navigation-round13.test.mjs`, `template-generation-round13.test.mjs`, `template-project-lifecycle-round13.test.mjs`, `http-store-color-round13.test.mjs`, `popup-concurrency-round13.test.mjs`).
- [x] Quatorzième passage : audit détaillé des sections protocole/fichiers, projet/build et langages ; nouveaux tests de callbacks et suppression, de retrait des fichiers du build et de limites i18n (`protocol-files-audit-round14.test.mjs`, `project-build-delete-round14.test.mjs`, `i18n-boundaries-round14.test.mjs`).
- [x] Quinzième passage : audit des templates, commandes, manifestes, HTTP, Store et couleurs ; nouveaux tests de création rapide, documentation Storybook/package, requêtes HTTP et écritures de sorties (`quick-template-round15.test.mjs`, `manifest-storybook-round15.test.mjs`, `http-color-round15.test.mjs`, `write-file-round15.test.mjs`).
- [x] Seizième passage : rechargement des paramètres et récupération de configuration projet, transitions de sorties et reprise du build, formatage TypeScript entre fichiers, téléchargement Store des trois familles de templates et validation de l'URL (`config-reload-round16.test.mjs`, `build-output-transitions-round16.test.mjs`, `ts-format-round16.test.mjs`, `template-store-download-round16.test.mjs`).
- [x] Dix-septième passage : cycle de fichiers et configuration différée, compilation de plusieurs configurations, transitions SCSS/i18n et extraction réelle d'une archive Store (`files-protocol-round17.test.mjs`, `build-pipeline-round17.test.mjs`, `language-transitions-round17.test.mjs`, `template-store-archive-round17.test.mjs`).
- [x] Dix-huitième passage : sélection rapide de templates entre espaces et catégories, gardes de génération Storybook, sessions Store et conversions colorimétriques à large gamut (`quick-template-round18.test.mjs`, `storybook-guard-round18.test.mjs`, `store-session-round18.test.mjs`, `color-spaces-round18.test.mjs`).
- [x] Dix-neuvième passage : chemins d'installation des templates et projets, résolution de dépendances transitives, renommage de fichiers avec cache et watcher, décorateurs réactifs TS (`template-installation-path-round19.test.mjs`, `dependency-resolution-round19.test.mjs`, `files-rename-round19.test.mjs`, `ts-reactive-decorators-round19.test.mjs`).
- [x] Vingtième passage : enregistrement de packages externes et filtre `readDirs`, commande de renommage avant déplacement, sorties build/npm et variables SCSS entre fichiers (`files-package-round20.test.mjs`, `files-workspace-lifecycle.test.mjs`, `rename-command-boundaries-round20.test.mjs`, `build-output-round20.test.mjs`, `language-service-round20.test.mjs`, `dependency-resolution-round19.test.mjs`).
- [x] Vingt et unième passage : découverte des configurations en CLI, cas limites des services i18n et SCSS, commandes Emmet et export statique (`files-cli-discovery-round21.test.mjs`, `language-boundaries-round21.test.mjs`, `emmet-command-round21.test.mjs`, `static-export-command-round21.test.mjs`).
- [x] Vingt-deuxième passage : démarrage serveur et découverte multi-racines, cache de compilation npm et documentation de types composites dans les manifestes (`protocol-startup-round22.test.mjs`, `files-startup-round22.test.mjs`, `npm-compilation-cache-round22.test.mjs`, `manifest-description-round22.test.mjs`).
- [x] Vingt-troisième passage : copies et compilation des ressources statiques, fusion et séparation de composants incomplets, limites SCSS globales et types de valeurs i18n (`static-assets-round23.test.mjs`, `component-conversion-partial-round23.test.mjs`, `scss-global-boundaries-round23.test.mjs`, `i18n-schema-round23.test.mjs`).
- [x] Vingt-quatrième passage : garde et ordre de démarrage, inclusion de dépendances locales et partagées, propriétés SCSS de composants et conversions de couleurs relatives (`protocol-node-guard-round24.test.mjs`, `dependency-inclusion-round24.test.mjs`, `scss-component-boundaries-round24.test.mjs`, `color-relative-round24.test.mjs`).
- [x] Vingt-cinquième passage : transitions SCSS et actions i18n, réglages et watcher, création de fichiers sur disque, résolution des composants et cycle du gestionnaire de projets (`language-state-round25.test.mjs`, `settings-watcher-round25.test.mjs`, `files-created-round25.test.mjs`, `build-component-lookup-round25.test.mjs`, `project-manager-lifecycle-round25.test.mjs`).
- [x] Vingt-sixième passage : cycle intégré des fichiers et configuration CLI, actions et diagnostics i18n avec fichiers réels, sorties npm et utilitaires de chemins/alias (`files-integrated-lifecycle-round26.test.mjs`, `i18n-integrated-round26.test.mjs`, `build-npm-package-round26.test.mjs`, `tools-path-alias-round26.test.mjs`).
- [x] Vingt-septième passage : audit ligne par ligne des reliquats protocole/fichiers, projets/build et TS/HTML/SCSS/i18n ; tests de journalisation, sauvegarde initiale, coordination projet/build, completion de slots HTML et chemin de données de l'environnement (`files-protocol-audit-round27.test.mjs`, `protocol-log-round27.test.mjs`, `project-build-coordination-round27.test.mjs`, `html-provider-round27.test.mjs`, `environment-path-round27.test.mjs`).
- [x] Vingt-huitième passage : audit ligne par ligne des templates/commandes, manifestes, HTTP/store/couleurs et utilitaires ; tests de rechargement des registres, ordre de documentation du package et installation d'environnement isolée (`template-settings-reload-round28.test.mjs`, `manifest-package-order-round28.test.mjs`, `environment-install-round28.test.mjs`).
- [x] Vingt-neuvième passage : processus LSP réel avec deux racines, rebuild intégré JavaScript/package, décorateurs et environnement Storybook combinés, reproduction isolée du blocage des recherches de texte sur les espaces (`jsonrpc-multiworkspace-round29.test.mjs`, `build-integrated-rebuild-round29.test.mjs`, `storybook-decorator-combinations-round29.test.mjs`, `storybook-environment-nested-round29.test.mjs`, `tools-adjacent-whitespace-round29.test.mjs`).
- [x] Trentième passage : cycle LSP réel avec diagnostics et effacement, projet à deux builds produisant leurs sorties, et navigation croisée HTML–TS/SCSS après modification (`jsonrpc-document-cycle-round30.test.mjs`, `project-multiple-builds-round30.test.mjs`, `language-cross-links-round30.test.mjs`).
- [x] Trente et unième passage : recompilation de composant après édition vue/style, retrait de sorties statiques et rebundling npm exécuté, régénération/annulation de template et échanges Store contre HTTP local (`component-cross-edit-round31.test.mjs`, `build-cleanup-round31.test.mjs`, `template-generation-lifecycle-round31.test.mjs`, `store-http-round31.test.mjs`).
- [x] Trente-deuxième passage : application d'une action TypeScript et disparition de son diagnostic, reprise de builds après erreur de dépendance ou d'écriture, sélection de configuration et JSON invalide pour l'ajout de section, cas limite d'un `Map` imbriqué (`ts-code-action-round32.test.mjs`, `build-error-recovery-round32.test.mjs`, `add-config-section-round32.test.mjs`, `tools-path-alias-round26.test.mjs`).
- [x] Trente-troisième passage : options des décorateurs TypeScript, contrôles HTML imbriqués et rechargement de builds/sorties statiques depuis une configuration réelle (`ts-decorators-options-round33.test.mjs`, `html-nested-controls-round33.test.mjs`, `project-config-build-static-round33.test.mjs`).
- [x] Trente-quatrième passage : imports SCSS imbriqués, mixins et diagnostics Sass, imports TypeScript aliasés entre fichiers avec héritage et plages, documentation des exports de package, installation Bash isolée (`scss-import-mixin-round34.test.mjs`, `ts-cross-file-model-round34.test.mjs`, `manifest-package-exports-round34.test.mjs`, `environment-unix-round34.test.mjs`).
- [x] Trente-cinquième passage : agrégation de plusieurs styles dans un build, connexion et installation Store via HTTP local, fichiers manifestes et Storybook après renommage, échec isolé de l'installation Unix (`build-style-aggregation-round35.test.mjs`, `store-http-lifecycle-round35.test.mjs`, `manifest-storybook-lifecycle-round35.test.mjs`, `environment-unix-round34.test.mjs`).
- [x] Trente-sixième passage : routage des extensions `.wc`, `.package` et `template.avt.ts`, cycle des diagnostics à la suppression/réouverture, import Git local des trois familles de templates puis désinstallation, et remplacement isolé du bloc zsh (`files-extension-routing-round36.test.mjs`, `files-diagnostics-lifecycle-round36.test.mjs`, `template-git-lifecycle-round36.test.mjs`, `environment-unix-round34.test.mjs`).
- [x] Trente-septième passage : renommage réel de fichier et dossier avec deux projets partageant les sources, chaîne de deux packages Aventus générés puis exécutés, mises à jour HTML/SCSS successives, et profil POSIX de repli (`project-rename-shared-round37.test.mjs`, `build-package-chain-round37.test.mjs`, `html-scss-updates-round37.test.mjs`, `environment-unix-round34.test.mjs`).
- [x] Trente-huitième passage : destruction intégrée d'un projet avec build/export statique, exécution npm de plusieurs modules et namespaces après retrait, commandes WebComponent sur une source décorée réelle (`project-destroy-round38.test.mjs`, `npm-multi-module-round38.test.mjs`, `webcomponent-command-real-source-round38.test.mjs`).
- [x] Trente-neuvième passage : listes de builds, npm et Storybook après rechargements réels de configuration, diagnostics et exports i18n entre fichiers, réponses tardives et choix homonymes des commandes interactives (`project-build-lists-round39.test.mjs`, `i18n-cross-files-round39.test.mjs`, `notification-replies-round39.test.mjs`).
- [x] Quarantième passage : notifications LSP entrelacées sur deux documents, publication Store par commande vers HTTP local avec archive et erreurs de validation, cohérence des quatre manifestes sérialisés et réécriture Storybook après modification de documentation (`files-multidocument-sequence-round40.test.mjs`, `store-publish-http-round40.test.mjs`, `manifest-storybook-round40.test.mjs`).
- [x] Quarante et unième passage : association d'une source à deux projets réels puis retrait sélectif au rechargement, décorateurs TypeScript Storybook/I18n/OverrideView/ForeignKey, validations et choix de variables transmis à un processus enfant de template (`project-cross-association-round41.test.mjs`, `ts-decorators-deep-round41.test.mjs`, `template-choices-round41.test.mjs`).
- [x] Quarante-deuxième passage : plages HTML et disparition de diagnostic après édition, navigation TypeScript par namespace entre fichiers, build réel à deux sorties avec diagnostics puis reprise après correction (`html-expression-edits-round42.test.mjs`, `ts-namespace-navigation-round42.test.mjs`, `build-diagnostics-recovery-round42.test.mjs`).
- [x] Quarante-troisième passage : retrait et rétablissement des fichiers vue/style d'un composant, suppression des catégories d'export statique sur deux destinations, sélection de commandes build/npm/Storybook entre deux projets et reprise d'un export statique après erreur (`component-links-cycle-round43.test.mjs`, `static-removal-categories-round43.test.mjs`, `build-commands-multiproject-round43.test.mjs`).
- [x] Quarante-quatrième passage : exports conditionnels TypeScript de paquets npm, cycle disque de deux feuilles SCSS globales, manifeste Emmet de deux packages et documentation Markdown d'exports mixtes (`ts-lib-exports-round44.test.mjs`, `scss-global-disk-lifecycle-round44.test.mjs`, `manifest-package-multifile-round44.test.mjs`).
- [x] Quarante-cinquième passage : échos client/disque et recréation de deux fichiers, session Store avec serveur HTTP et persistance, conversions de couleurs CSS avancées et détection par le color picker (`files-echo-lifecycle-round45.test.mjs`, `store-session-http-round45.test.mjs`, `color-parser-spaces-round45.test.mjs`).
- [x] Quarante-sixième passage : alias de projets équivalents et namespaces à deux sources exécutés, navigation et diagnostics de scripts de template après réouverture, commandes Sharp/PHP/outils avec sélection, échec et reprise (`project-aliases-round46.test.mjs`, `template-script-navigation-round46.test.mjs`, `converter-round46.test.mjs`).
- [x] Quarante-septième passage : transitions de configuration et abonnements de builds, reprise des dépendances manquantes ou incompatibles, rechargement groupé de définitions HTML internes et externes (`project-config-subscriptions-round47.test.mjs`, `dependency-recovery-round47.test.mjs`, `html-definition-reload-round47.test.mjs`).
- [x] Quarante-huitième passage : équivalence de compilation des régions de composant unique/séparé, découverte locale et priorité des trois registres de templates, rechargement des paramètres LSP et ordre des réponses asynchrones (`component-format-equivalence-round48.test.mjs`, `template-priority-round48.test.mjs`, `lsp-settings-live-round48.test.mjs`).
- [x] Quarante-neuvième passage : build combiné TypeScript, vue, style, i18n et dépendance avec remplacement des sorties au rebuild ; découverte de configurations et fichiers dans deux espaces de travail avec exclusions (`build-mixed-outputs-round49.test.mjs`, `files-workspace-discovery-round49.test.mjs`).
- [x] Quatrième passage : séquence de rebuild et sorties combinées, fermeture du protocole, plusieurs espaces de travail, sources de templates, cycle SCSS, chargement npm et services HTML/i18n (`build-rebuild-sequence.test.mjs`, `build-multifile-output.test.mjs`, `protocol-shutdown-round4.test.mjs`, `files-multiworkspace-round4.test.mjs`, `template-sources-round4.test.mjs`, `scss-lsp-lifecycle-round4.test.mjs`, `ts-lib-loader-round4.test.mjs`, `html-i18n-lsp-round4.test.mjs`).

Les scénarios qui révèlent actuellement un écart du code source sont détaillés dans [BLOCKERS.md](./BLOCKERS.md). Les points ci-dessous restent ouverts dès qu'une partie de la fonctionnalité demande encore un test d'intégration ou une assertion supplémentaire.

## Défauts corrigés

- [x] `color-picker/ColorData.ts` : `toPrecision(0.123456789, 4)` renvoie `0.1235` avec quatre chiffres significatifs ; correction validée par un test.
- [x] `language-services/i18n/Parser.ts` : une propriété incomplète telle que `{"hello": }` est ignorée pendant le parsing ; le validateur produit un diagnostic. Correction validée par les tests.

## Démarrage et protocole (`server.ts`, `GenericServer.ts`, `vscode/Connection.ts`)

- [ ] Initialisation du serveur avec les capacités LSP attendues et chargement des espaces de travail.
- [ ] Ouverture, modification, sauvegarde et fermeture d'un document via les notifications LSP.
- [x] Routage des requêtes completion, resolve, hover, definition, references, rename, formatting, code action et code lens (`protocol-routing.test.mjs`, `files-manager-deep.test.mjs`, `files-protocol-missing-round9.test.mjs`).
- [x] Routage des commandes et communications vers le bon handler ; commande ou canal inconnu.
- [ ] Publication et effacement des diagnostics, y compris après fermeture ou suppression du fichier.
- [ ] Application des paramètres, rechargement, niveau de journalisation et mode sans build.
- [x] Arrêt du serveur : fermeture des watchers, projets et ressources ouvertes (`protocol-shutdown-round4.test.mjs`, `jsonrpc-lifecycle-round8.test.mjs`).

## Fichiers et espaces de travail (`files/AventusFile.ts`, `FilesManager.ts`, `FilesWatcher.ts`)

- [ ] Découverte des configurations et fichiers Aventus dans un ou plusieurs espaces de travail ; exclusions et doublons.
- [x] Enregistrement d'un fichier et sélection du traitement selon son extension ; extension inconnue (`files-workspace-lifecycle.test.mjs`, `files-manager-deep.test.mjs`, `files-protocol-missing-round9.test.mjs`).
- [ ] Création, mise à jour, suppression et renommage détectés sur disque ; cohérence du cache URI/chemin.
- [ ] Changements de contenu en mémoire, sauvegarde et fermeture ; ordre des callbacks et absence de traitement après désinscription.
- [ ] Validation différée et diagnostics actualisés après plusieurs modifications rapides.
- [x] Réponses LSP d'un fichier (`completion`, `hover`, etc.) et résultat lorsque le fichier n'existe plus (`files-manager-deep.test.mjs`, `files-protocol-missing-round9.test.mjs`, `protocol-routing.test.mjs`).
- [x] Recherche de fichiers par URI, chemin, extension et expression régulière.
- [x] Prévention des notifications de modification causées par les écritures du serveur (`files-workspace-lifecycle.test.mjs`, `files-protocol-round11.test.mjs`).

## Configuration et projets (`settings`, `language-services/config`, `language-services/json`, `project/Project*.ts`)

- [x] Valeurs par défaut, fusion des paramètres globaux/locaux et notification des changements.
- [x] Lecture et validation de `aventus.conf.avt` ; erreurs de syntaxe, propriétés invalides et diagnostics localisés.
- [ ] Chargement, modification, suppression et rechargement d'un projet à partir de sa configuration.
- [ ] Association d'un fichier aux bons projets, builds et sorties statiques, y compris en cas de chemins voisins.
- [ ] Résolution des alias et namespaces ; chemins relatifs, inconnus et collisions.
- [ ] Liste des builds disponibles, avec Storybook et avec npm, et liste des sorties statiques.
- [ ] Renommage d'un fichier ou dossier : références et éditions attendues dans les projets concernés.

## Build et dépendances (`project/Build.ts`, `BuildNpm.ts`, `DependencyManager.ts`, `Static.ts`)

- [ ] Build complet minimal : fichiers produits, noms, ordre, contenu et diagnostics.
- [ ] Rebuild après ajout, modification ou suppression d'un fichier ; aucune sortie obsolète.
- [ ] Activation/désactivation du build et regroupement des changements rapides.
- [ ] Dépendances locales et externes : ordre, cycle, dépendance manquante et doublon.
- [ ] Génération des packages Aventus, définitions et imports entre packages.
- [ ] Génération npm : points d'entrée, noms remplacés, sorties et configuration.
- [ ] Export statique : copie et mise à jour des fichiers, chemins et suppression des anciennes sorties.
- [ ] Échec de compilation ou d'écriture : erreur/diagnostic transmis et état permettant un nouveau build.
- [ ] Destruction d'un build/projet : abonnements, timers et ressources libérés.

## Services TypeScript Aventus (`language-services/ts`)

- [ ] Sélection de la classe de fichier pour `.wcl`, `.wc`, `.data`, `.lib`, `.ram`, `.state`, `.static`, `.def`, `.package` et `.template`.
- [ ] Analyse des imports, exports, alias, namespaces, classes, interfaces, propriétés, méthodes et types.
- [ ] Décorateurs pris en charge : effet attendu sur le modèle et diagnostic en cas d'emploi invalide.
- [ ] Diagnostics TypeScript et règles Aventus, dont les globals natifs interdits ; plages et codes d'erreur.
- [ ] Completion et résolution des suggestions, hover, définition, références et renommage entre fichiers.
- [ ] Formatage et code actions, notamment création des membres manquants.
- [ ] Compilation TS générique et compilation de composants simples/complets : code, styles, vues et dépendances.
- [ ] Composant en fichier unique ou séparé : résultat équivalent et mises à jour croisées.
- [ ] Chargement des bibliothèques Aventus et des modules npm ; module manquant ou package mal formé.

## Vues HTML Aventus (`language-services/html`)

- [ ] Parsing des balises standard et composants, attributs, slots et blocs conditionnels ou répétés.
- [ ] Injections, bindings et expressions : rendu/liaisons attendus et erreurs avec position correcte.
- [ ] Références croisées entre vue, classe et style ; renommage et définition.
- [ ] Completion, hover, diagnostics et formatage sur un document valide et mal formé.
- [ ] Ajout/retrait des définitions de composants internes et externes après changement de projet.

## Styles SCSS (`language-services/scss`)

- [ ] Parsing, compilation et diagnostics SCSS, y compris syntaxe invalide.
- [ ] Variables CSS globales : chargement, définition, références et retrait après suppression.
- [ ] Completion, hover, définition, lien vers la vue et formatage.
- [ ] Agrégation des styles de composants et styles globaux dans le build.

## Traductions i18n (`language-services/i18n`, `communication/i18n`)

- [x] Parsing et validation d'un fichier `.i18n.avt` : locales, clés, valeurs et erreurs.
- [ ] Ajout d'une valeur, récupération des locales et recherche d'une clé à une position.
- [ ] Completion, hover, définition, diagnostics et mise à jour après modification.
- [ ] Détection des clés manquantes ou en doublon entre locales.

## Templates, créations et migrations (`files/Template*.ts`, `Local*.ts`, `language-services/ts/template`, `updates`)

- [ ] Découverte et priorité des templates/projets globaux, locaux et intégrés.
- [ ] Création d'un projet ou composant depuis un template ; variables remplacées et fichiers attendus.
- [ ] Import, désinstallation et édition rapide des templates/projets ; chemins absents ou conflit de nom.
- [ ] Analyse et completion d'un `template.avt.ts` ; erreur de template signalée.
- [x] Migrations 1.4.0 et 1.4.1 : transformation attendue et relance sans double modification.

## Commandes serveur (`cmds`)

- [ ] Création, renommage, fusion et séparation de composants ; chemins, contenu et références cohérents.
- [ ] Ajout d'une section de configuration et formatage du fichier ciblé.
- [ ] Commandes WebComponent : attribut, propriété, watch, variable CSS, import d'élément ou méthode de vue.
- [ ] Notifications de création, mise à jour et suppression reçues du client.
- [ ] Build de projet, sortie statique, npm et Storybook : bon build choisi et résultat transmis.
- [ ] Exports Sharp et PHP et mise à jour des outils : sortie et remontée des erreurs.
- [ ] Commandes i18n, serveur HTTP, store et réglages : délégation au bon service.
- [ ] Réponses aux demandes d'entrée, sélection, sélection multiple et popup ; annulation et réponse tardive.

## Manifestes et documentation (`manifest`, `project/storybook`)

- [ ] Génération de Custom Elements, Web Types, HTML Custom Data et Emmet Custom Data depuis un composant.
- [ ] Schémas valides, attributs/propriétés/méthodes/événements et documentation correcte.
- [ ] Suppression ou renommage d'un composant répercuté dans chaque manifeste.
- [ ] Génération du manifeste package et de sa documentation Markdown.
- [ ] Fichiers Storybook, stories et MDX générés à partir des décorateurs et valeurs déclarées.

## Serveur HTTP, store et couleurs (`live-server`, `store`, `color-picker`)

- [x] Démarrage, arrêt et bascule du serveur HTTP ; port occupé et incrément automatique (`http-server-integration.test.mjs`, `http-store-color-round13.test.mjs`, `http-websocket-round10.test.mjs`).
- [x] Service des fichiers depuis la racine configurée, index, fichier absent et protection des chemins hors racine (`http-server-integration.test.mjs`, `http-color-round15.test.mjs`).
- [x] Notification de changement et injection du rechargement automatique ; fermeture propre des connexions (`http-server.test.mjs`, `http-server-integration.test.mjs`, `http-websocket-round10.test.mjs`, `http-store-color-round13.test.mjs`, `http-color-round15.test.mjs`).
- [ ] Connexion/déconnexion du store, publication et téléchargement de templates/packages ; échec réseau et archive invalide.
- [ ] Analyse des couleurs CSS, conversions entre notations, canal alpha et valeurs hors limites.
- [ ] Informations du color picker et propositions de couleurs sur des positions valides/invalides.

## Utilitaires et garanties transversales (`Mutex.ts`, `tools.ts`, `environment.ts`, `notification`)

- [x] `Mutex` : attente et attribution du verrou dans l'ordre d'arrivée.
- [x] `ActionGuard` : partage d'une action en cours, clés distinctes, erreur propagée et nouvel essai.
- [ ] `Mutex` : décider du sort des promesses en attente lors de `dispose`, puis tester le comportement souhaité après correction ; le comportement actuel et les appels `release` supplémentaires sont couverts.
- [x] Conversion chemin/URI, encodage des caractères spéciaux et comportement Windows/Unix.
- [x] Choix du langage à partir de l'extension et construction des diagnostics/ranges.
- [x] Construction et envoi de chaque notification avec canal et paramètres attendus (`notifications.test.mjs`, `notification-channels.test.mjs`, `notification-edge-round5.test.mjs`, `statistics.test.mjs`, `statistics-round10.test.mjs`).
- [ ] Détection de l'environnement IDE/CLI et chemins des ressources intégrées.
