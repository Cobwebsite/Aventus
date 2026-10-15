# Cas serveur en attente de changement de code

Ce fichier conserve les cas reproductibles rencontrés pendant l'écriture des tests. Les changements de `server/src` pour ces points sont décidés avec l'utilisateur, un par un.

## Note hors périmètre des tests serveur

- `client/src/cmds/Rename.ts` transmet `item.oldUri` dans le champ `newUri` de la commande `aventus.rename`. À traiter plus tard avec les tests du client VS Code ; ne pas modifier le client pendant cette passe.

## Découverte avec `readDirs` dans le répertoire temporaire du sandbox Windows

- Source à examiner si nécessaire : `server/src/files/FilesManager.ts`, méthode `parseWorkspace`.
- Observation : une fixture créée dans le répertoire temporaire fourni par le sandbox Windows renvoyait une liste vide avec `readDirs: ['src']`, alors que la même fixture créée dans le répertoire du projet découvre correctement la configuration de `src` et ignore le dossier voisin. Hors sandbox, la fixture temporaire réussissait également.
- Le test `files-workspace-lifecycle.test.mjs` utilise désormais un répertoire temporaire dans le projet et vérifie le résultat positif sur toutes les plateformes. La cause du comportement propre au chemin temporaire du sandbox n'est pas établie ; aucune modification du serveur n'est proposée sur cette seule observation.

## Renommage de fichiers hors TypeScript : aucune édition de références

- Reproduction automatisée : `project-rename-non-ts-round194.test.mjs` transmet aux deux projets des déplacements de vues, styles, fichiers SCSS, HTML et JSON. Aucun ne produit d'édition ni n'appelle le service de renommage TypeScript ; un fichier `.lib.avt` placé après un style dans le même lot produit bien les éditions attendues.
- Source : `Build.onRename()` ne traite que les cinq extensions TypeScript Aventus et retourne un résultat vide pour les autres fichiers.
- Décision à prendre : préciser quelles références de vues et de styles doivent être actualisées lors d'un déplacement, puis ajouter des cas réels avant de modifier le routage du renommage.

## `readDirs` ciblant un fichier charge aussi ses voisins

- Reproduction automatisée : `files-read-dirs-file-filter-round108.test.mjs` utilise `readDirs: ['src/wanted.wcl.avt']`. La découverte enregistre `wanted.wcl.avt` et `sibling.wcl.avt`, mais exclut le fichier du sous-dossier `src/nested`.
- Cause : `FilesManager.parseWorkspace()` filtre les dossiers parcourus, puis transmet tous leurs fichiers à `loadAllAventusFiles()` sans vérifier le chemin de chaque fichier contre `readDirs`.
- Décision à prendre : préciser si une entrée `readDirs` désignant un fichier doit limiter le chargement à ce seul fichier. Si oui, appliquer aussi le filtre aux fichiers rencontrés.

## Catégorie de templates vide après filtrage des scripts interdits

- Reproduction automatisée : `template-query-categories-round109.test.mjs` interroge une catégorie qui ne contient qu'un template dont `isAllowed()` renvoie `false`. Le premier menu propose encore la catégorie ; sa sélection ouvre un second menu vide.
- Source : `TemplateManager.query()` ajoute chaque sous-arbre aux choix avant de vérifier si ses feuilles sont autorisées pour la destination. Le filtrage ne s'effectue qu'au niveau des scripts.
- Décision à prendre : masquer les catégories sans template autorisé, en conservant le comportement actuel des catégories qui contiennent au moins un script utilisable.

## Bundle npm périmé après changement d'un module installé

- Reproductions automatisées : `npm-installed-source-rebuild-round110.test.mjs` compile un vrai module local avec `value = 1`, modifie son fichier en `value = 2`, puis recompile avec les mêmes imports. Le bundle exécutable retourne encore `1`. Ajouter l'import d'un autre symbole force un nouveau bundle qui retourne `2`. `npm-package-content-cache-round193.test.mjs` confirme ce comportement sur une autre séquence de modifications du package et vérifie aussi le retrait de l'import.
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
- Portée entre fichiers : `scss-global-grouped-fallback-round197.test.mjs` charge d'abord `:root, html { --accent: red; }`, puis une autre feuille `:root { --accent: blue; }`. Le composant consommateur pointe vers la seconde feuille jusqu'au retrait de `html` dans la première ; un sélecteur `html` seul rétablit la seconde source, et sa suppression retire la définition.
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

## Clé i18n JSON non échappée dans la déclaration TypeScript générée

- Reproduction automatisée : `i18n-generated-type-escape-round138.test.mjs` crée un fichier i18n global avec une clé contenant un saut de ligne JSON échappé. La validation i18n ne signale aucune erreur et l'export conserve la clé ; la déclaration `AventusI18n` générée contient le saut de ligne littéral entre guillemets et le parseur TypeScript remonte une erreur. Une clé contenant les deux caractères antislash et `t` produit un type TypeScript syntaxiquement valide, mais dont le nom de propriété contient une tabulation. Renommer les clés par édition rétablit les déclarations attendues.
- Cause : `AventusI18nFile.onContentChange()` n'échappe que les guillemets lorsqu'il insère les clés dans les littéraux de la déclaration TypeScript.
- Décision à prendre : échapper toutes les clés pour un littéral TypeScript valide, ou refuser explicitement celles qui ne peuvent pas être représentées ; vérifier aussi les retours chariot et antislashs.

## Fin prématurée des commandes build, npm et Storybook

- Reproduction automatisée : `build-command-completion-round147.test.mjs` lance successivement les commandes de build de projet, de package npm et de Storybook avec une tâche asynchrone suspendue. Chacune termine sa promesse alors que sa tâche est encore en cours. La commande d'export statique attend, elle, la fin de l'export sélectionné.
- Cause : `BuildProject.run()`, `NpmBuild.run()` et `StorybookBuild.run()` appellent leur méthode de build sans `await` ni `return`.
- Décision à prendre : déterminer si la promesse de commande doit représenter la fin du build et transmettre son échec au client ; si oui, attendre le build sélectionné comme le fait `StaticExport.run()`.

## Export i18n périmé pendant une édition JSON invalide

- Reproduction automatisée : `i18n-invalid-export-round148.test.mjs` part d'une traduction `old` valide, édite le fichier en JSON incomplet contenant une nouvelle clé, puis vérifie que `keys` et `exported` conservent l'ancienne traduction pendant que la validation signale une erreur. Une correction valide remplace enfin l'export. Le consommateur du build peut donc lire des traductions périmées pendant une édition invalide. Décision attendue : conserver volontairement le dernier export valide ou vider les exports en cas d'erreur de parsing.

## Réexports TypeScript absents du modèle Aventus

- Reproduction automatisée : `ts-reexports-round148.test.mjs` parse un réexport nommé avec alias et un réexport wildcard, puis remplace le premier par un autre fichier. Dans les deux versions, le modèle ne contient ni objet exporté ni import local pour le symbole exposé, sans diagnostic ; une déclaration directe du même nom est bien indexée. `ParserTs.loadRoot()` ne traite pas les `ExportDeclaration`.
- Décision à prendre : déterminer si les réexports doivent être pris en charge par le modèle Aventus et, dans ce cas, préciser la résolution des alias, des réexports wildcard et des cycles entre fichiers.

## Deux alias directs vers le même package : inclusion dépendante de l'ordre

- Reproduction automatisée : `dependency-duplicate-direct-aliases-round149.test.mjs` configure deux clés directes pointant vers le même fichier package, une avec `include: full`, l'autre avec `include: need`. Le résultat contient une seule instance du package, mais son type d'inclusion est celui de la dernière clé. Inverser l'ordre des propriétés inverse le résultat.
- Cause : `loadDependenciesFromBuild()` stocke l'inclusion par le nom déclaré dans le package et écrase cette valeur à chaque dépendance directe chargée.
- Décision à prendre : définir la priorité attendue quand deux noms de configuration résolvent le même package : refuser le doublon, conserver le premier, choisir l'inclusion la plus forte ou garder la dernière valeur.

## Échec d'initialisation d'un projet : entrée conservée sans reprise

- Reproduction automatisée : `project-discovery-concurrent-round151.test.mjs` fait échouer `Project.init()` après la création de l'entrée dans `ProjectManager`. Le projet reste dans le registre, son callback de suppression n'est pas enregistré et une nouvelle notification de découverte ne relance pas l'initialisation.
- Cause : `ProjectManager.onNewFile()` ajoute le projet avant `await init()` et n'annule pas cet ajout quand la promesse rejette. L'enregistrement de `onDelete` se situe après cette attente.
- Décision à prendre : retirer et détruire le projet lors d'un échec d'initialisation, ou conserver une instance réessayable avec un état explicite ; vérifier ensuite la reprise et la suppression.

## Collision de tag entre deux composants dans les manifestes

- Reproduction automatisée : `manifest-tag-collision-round152.test.mjs` enregistre deux composants distincts sous `demo-card`. Custom Elements, HTML Custom Data et Web Types contiennent chacun deux entrées portant le même tag ; Emmet conserve une seule clé. Retirer l'un des composants laisse correctement l'autre enregistré.
- Cause : les générateurs conservent leurs contributions par URI et ne résolvent pas les collisions sur le nom du tag avant sérialisation.
- Décision à prendre : définir si un tag doit être unique par build et, en cas de conflit, choisir le composant prioritaire ou produire un diagnostic au lieu de publier deux définitions ambiguës.

## Création rapide : deux templates avec le même nom sélectionnent toujours le dernier

- Reproduction automatisée : `quick-template-name-collision-round153.test.mjs` configure deux templates locaux de nom `Duplicate`, chacun avec un chemin et une description distincts. La sélection du premier élément affiché exécute le second template.
- Cause : `QuickTemplate.run()` indexe les chemins par `template.name`, ce qui remplace le chemin du premier élément lorsque le second porte le même nom.
- Décision à prendre : identifier les choix par chemin ou par identifiant unique afin que chaque sélection exécute le template affiché ; préciser si les noms identiques doivent être désambiguïsés dans la liste.

## Plages des expressions HTML décalées

- Reproduction : les deux cas de `html-expression-identity-round62.test.mjs` trouvent les actions attendues, mais les plages découpent `"{{value}` ou ` {{value}` au lieu de `{{value}}`, y compris après édition. Ils sont temporairement ignorés pour préserver une suite exécutable.
- Décision à prendre : corriger le calcul des positions dans le parseur HTML, puis réactiver les deux tests sans assouplir leurs assertions.

## Nouvelle tentative de préparation d'un template après erreur

- Reproduction : `template-shell-path-round112.test.mjs` provoque une erreur avec un chemin de sauvegarde contenant des espaces. Après changement vers un chemin simple, la nouvelle promesse se résout, alors que le test attendait une entrée de préparation bloquée. Ce cas est temporairement ignoré.
- Décision à prendre : préciser si la nouvelle tentative doit réussir immédiatement ou si l'état de préparation doit rester bloqué ; adapter ensuite le test et vérifier la récupération complète.

## Renommage groupé de plusieurs sources TypeScript

- Reproduction automatisée : `project-multiple-renames-round158.test.mjs` soumet deux renommages TypeScript dans une seule requête à deux projets. Chaque build ne transmet au service TypeScript que le premier changement ; les références à la deuxième source ne sont jamais éditées.
- Cause : `Build.onRename()` retourne dès le premier changement dont l'extension est reconnue.
- Décision à prendre : agréger les éditions de tous les changements TypeScript, y compris quand plusieurs sources modifient un même consommateur, puis vérifier leur ordre et les éventuels conflits de plages.

## Suppression d'une configuration pendant l'initialisation du projet

- Reproduction automatisée : `project-discovery-delete-race-round159.test.mjs` suspend `Project.init()`, supprime la configuration, puis termine l'initialisation. `ProjectManager.onNewFile()` inscrit alors un callback de suppression sur l'ancien projet. Après redécouverte, ce callback périmé supprime le nouveau projet.
- Cause : l'inscription de `onDelete` se fait après `await init()` sans vérifier que l'instance créée est toujours celle du registre.
- Décision à prendre : invalider l'initialisation lors de la suppression et ne pas inscrire le callback d'une instance retirée ; vérifier ensuite la recréation et la suppression normale.

## Ressources binaires corrompues par la génération d'un template

- Reproduction automatisée : `template-binary-round159.test.mjs` crée un template avec un texte Unicode et un fichier `icon.png` contenant des octets UTF-8 invalides. Le texte et ses variables sont corrects, mais le binaire généré diffère de la source et contient la séquence de remplacement UTF-8.
- Cause observée : les fichiers du template sont lus et réécrits comme du texte, même pour une ressource binaire.
- Décision à prendre : copier les ressources binaires octet pour octet et réserver la substitution de variables aux fichiers texte ; préciser comment reconnaître un fichier texte ou exclure une ressource de la substitution.

## Classement de `@Property()` dans les manifestes de composants

- Reproduction automatisée : `manifest-parsed-visibility-round161.test.mjs` analyse un composant réel avec `@Attribute()` et `@Property()`. Les deux membres apparaissent dans les attributs Custom Elements et Web Types ; `@Property()` n'apparaît pas dans les propriétés JavaScript Web Types. Ce classement suit les éditions de la source.
- Cause : `Manifest` place les deux décorateurs dans la même liste d'attributs avant la génération des formats.
- Décision à prendre : confirmer que `@Property()` doit être exposé comme attribut HTML, ou distinguer les propriétés JavaScript des attributs dans les manifestes ; vérifier ensuite les formats HTML Custom Data et Emmet avec la convention choisie.

## Publication d'un JS invalide après échec de minification

- Reproduction automatisée : `build-compression-recovery-round162.test.mjs` demande une sortie comprimée contenant `const =;`. Le minifieur signale une erreur, mais `Build.writeBuildCode()` écrit le code invalide brut à la destination. Une révision valide suivante est correctement minifiée sur la même instance.
- Décision à prendre : définir si l'échec de minification doit empêcher la publication et préserver la dernière sortie valide, ou si une sortie brute reste souhaitée ; préciser le diagnostic envoyé au client et tester les autres destinations du build.

## Abonnement de suppression d'un style global conservé après destruction du projet

- Reproduction automatisée : `project-global-style-destroy-round165.test.mjs` inscrit le callback de suppression d'un style global, puis détruit le projet. Les abonnements de configuration et de création de fichier sont retirés, mais le callback du style reste enregistré et modifie encore le projet lorsque le fichier est supprimé plus tard.
- Cause : `Project.destroy()` ne parcourt pas `onFileDeleteUUIDs` et ne retire pas ces callbacks des fichiers de style globaux.
- Décision à prendre : retirer les abonnements aux suppressions et vider l'état des styles lors de la destruction ; vérifier aussi les callbacks en cours pendant cette opération.

## Collision des métadonnées lors du nettoyage des sorties statiques

- Reproduction automatisée : `static-ownership-metadata-collision-round166.test.mjs` modifie les octets d'une sortie statique en conservant sa taille et force, dans l'état enregistré du test, le même horodatage que la sortie modifiée. Lorsque la source disparaît, `Static.export()` supprime cette sortie malgré son contenu changé.
- Cause : l'appartenance d'une sortie est vérifiée uniquement avec sa taille et `mtimeMs`, sans empreinte du contenu. Le test contrôle explicitement l'égalité des métadonnées pour reproduire la collision sans dépendre de la précision d'horodatage du système de fichiers.
- Décision à prendre : préciser si une sortie modifiée doit toujours être préservée et, dans ce cas, stocker une empreinte du contenu ou une autre preuve d'appartenance avant la suppression.

## Variable CSS globale introuvable après un saut de ligne initial

- Reproduction automatisée : `scss-global-consumer-transition-round166.test.mjs` charge `:root { --tone: red; }`, puis édite la même source en ajoutant un saut de ligne avant `:root`. `getDefinition('--tone')` et la définition demandée depuis un composant deviennent absentes. Retirer le saut de ligne restaure la navigation. `scss-global-comment-prefix-round174.test.mjs` montre que des commentaires de bloc ou de ligne placés avant `:root` produisent la même perte, puis que définition et hover reviennent après retrait du préfixe.
- Décision à prendre : rendre l'indexation des déclarations `:root` indépendante des espaces et lignes qui précèdent la règle, puis vérifier également les commentaires initiaux et les sélecteurs groupés.

## Anciennes sorties JavaScript conservées après changement de routage

- Reproduction automatisée : `build-output-routing-revisions-round170.test.mjs` produit deux groupes de sorties JS séparant code principal, bibliothèque et npm. Une nouvelle révision regroupe chaque groupe dans son fichier principal ; les fichiers `vendor-*.js` et `npm-*.js` de la première révision restent sur disque avec leur ancien contenu.
- Décision à prendre : définir le nettoyage des sorties générées qui ne figurent plus dans la configuration, tout en préservant les fichiers modifiés hors du build ; vérifier ce nettoyage sur plusieurs groupes et destinations.

## Deux blocs conditionnels de template suppriment le contenu intermédiaire

- Reproduction automatisée : `template-adjacent-conditions-round171.test.mjs` génère un fichier réel avec deux blocs `#if{{optional}}...#end{{optional}}` désactivés et une classe entre eux. Le fichier généré est vide et pourtant enregistré, au lieu de conserver la classe.
- Cause observée : `replaceIfs` capture depuis le premier `#if` jusqu'au dernier `#end` du même nom.
- Décision à prendre : traiter chaque bloc conditionnel indépendamment, y compris les blocs répétés et imbriqués ; vérifier le contenu et l'enregistrement du fichier généré.

## Blocs personnalisés répétés dans un template : seul le premier est transformé

- Reproduction automatisée : `template-repeated-blocks-round196.test.mjs` génère un fichier avec deux blocs `#{{wrap}}...#{{wrap/}}` séparés par du texte. Le premier devient `[FIRST WIDGET]`, mais le second conserve ses marqueurs bruts (`#{{wrap}}second Widget#{{wrap/}}`). Les variables sont néanmoins substituées dans les deux blocs et le fichier est enregistré.
- Cause observée : `AventusTemplate.replaceBlocks()` recherche globalement les correspondances dans le texte initial tout en remplaçant ce texte pendant l'itération ; l'index de recherche saute le second bloc après la première substitution.
- Décision à prendre : traiter tous les blocs d'un même nom de façon indépendante, en préservant le texte intermédiaire et l'ordre des transformations.

## Séparation de composant dans un dossier préexistant

- Reproduction automatisée : `component-split-existing-folder-round173.test.mjs` sépare `Card.wc.avt` dans un dossier `Card` déjà présent avec `Card.wcs.avt` et un fichier étranger. Le style préexistant est écrasé sans avertissement ; le fichier étranger reste intact et la source unique est supprimée.
- Cause : `SplitComponent.run()` crée seulement le dossier s'il manque, puis écrit directement les trois fichiers avec `writeFileSync` sans vérifier leur existence.
- Décision à prendre : définir le comportement attendu en cas de conflit de nom et éviter une perte silencieuse du contenu préexistant avant de supprimer la source unique.

## Destruction incomplète du projet après échec d'un build

- Reproduction automatisée : `project-destroy-failure-retry-round177.test.mjs` fait échouer `destroy()` du premier build. `Project.destroy()` s'interrompt avant la destruction du second build et de la sortie statique. Un second appel les libère, mais répète les désabonnements de configuration et du gestionnaire de fichiers ainsi que la destruction du premier build.
- Décision à prendre : poursuivre le nettoyage des autres ressources lorsqu'une destruction échoue, puis définir un résultat d'erreur et une nouvelle tentative qui ne répète pas les nettoyages déjà effectués.

## CSS contenant un accent grave produit un JavaScript invalide

- Reproduction automatisée : `build-stylesheet-literal-recovery-round182.test.mjs` écrit une sortie JS avec une feuille CSS valide contenant `content: "`"`. Le code inséré dans `Aventus.Style.store()` échoue à l'analyse JavaScript. Après édition du style puis retrait, les sorties redeviennent exécutables sans ancien contenu.
- Cause observée : `Build.writeBuildCode()` insère le CSS dans un littéral JavaScript délimité par des accents graves sans échapper ce caractère.
- Décision à prendre : sérialiser la chaîne CSS comme littéral JavaScript sûr, en couvrant aussi les séquences `${...}`, antislashs et sauts de ligne.

## Interfaces implémentées absentes de la documentation package

- Reproduction automatisée : `manifest-package-inheritance-round183.test.mjs` analyse une classe réelle qui étend une base et implémente `Clickable`, puis une autre base et `Selectable`. La documentation Markdown met à jour la ligne `Parent`, mais n'émet jamais de ligne `Implements` ; le retrait final de l'héritage efface correctement le parent.
- Décision à prendre : transmettre les interfaces implémentées depuis le parseur jusqu'au modèle du manifeste package et vérifier leur rendu après édition.

## Sorties JavaScript incohérentes après échec d'une destination

- Reproduction automatisée : `build-multi-output-write-retry-round187.test.mjs` appelle `Build.writeBuildCode()` pour deux groupes de sorties. Quand l'écriture du second échoue, le premier contient déjà la nouvelle révision tandis que le second garde l'ancienne. Un nouvel essai réussit et resynchronise les deux fichiers.
- Décision à prendre : définir si une publication de plusieurs groupes doit être atomique et, dans ce cas, préparer toutes les sorties avant écriture puis restaurer la révision précédente si une destination échoue. Vérifier également le chemin complet `Build.build()`.

## Valeur par défaut d'attribut absente du manifeste Custom Elements

- Reproduction automatisée : `manifest-parsed-attribute-docs-round191.test.mjs` analyse `@Attribute() mode: "small" | "large" = "small"`, puis remplace cet attribut par `density = "roomy"`. Les descriptions et valeurs littérales suivent l'édition dans les manifestes, mais `attributes[].default` reste absent dans Custom Elements pour les deux versions.
- Décision à prendre : déterminer si la valeur initiale de `@Attribute()` doit être publiée dans `default` ; si oui, transmettre l'initialiseur parsé à la génération Custom Elements et vérifier les autres formats.

## Événements absents des manifestes de composants

- Constat : `server/src/manifest/CustomElements.ts` laisse explicitement la génération des événements en attente (`// events // not ready`) ; `server/src/manifest/WebTypes.ts` comporte également une section événements vide. La couverture des événements de la ligne « Schémas valides » du `TODO.md` ne peut donc pas être finalisée avec un test positif sur le serveur actuel.
- Décision à prendre : définir quels événements de composant doivent être exposés, leur nom, leur type et leur documentation dans Custom Elements et Web Types, puis ajouter un test sur une source réellement parsée et ses révisions.

## Import nommé d'un namespace local non résolu

- Reproduction automatisée : `ts-local-namespace-alias-round199.test.mjs` analyse `export namespace Widgets`, puis `import { Widgets as UI }` depuis un second fichier. Le parseur crée l'alias local mais laisse `info` vide et émet `Can't load`. Après renommage coordonné du namespace et de l'alias, le diagnostic persiste ; le retrait de l'import le supprime.
- Cause observée : `ImportInfo` résout les imports locaux par `ParserTs.getBaseInfo()`, qui ne fournit pas le namespace exporté comme déclaration importable.
- Décision à prendre : déterminer si les namespaces locaux nommés doivent être importables et, dans ce cas, ajouter leur résolution au modèle puis vérifier les membres et les révisions.
## Réimport local d'un template ou projet dans un dossier déjà installé

- Reproduction automatisée : `template-import-replace-round202.test.mjs` réimporte un projet puis un template vers un `installationFolder` déjà présent. Le dossier cible est entièrement supprimé avant la copie : le fichier de l'ancienne installation absent de la nouvelle source disparaît, tandis qu'un fichier voisin hors du dossier cible est conservé. Les deux commandes annoncent l'installation et rechargent le registre une fois.
- Source : `TemplateManager.selectProjectToImport()` et `selectTemplateToImport()` appellent `rmSync(destPath, { recursive: true, force: true })` dès que la destination existe, avant `cpSync()`.
- Décision à prendre : confirmer si le réimport doit remplacer intégralement et sans confirmation le dossier installé. Si oui, documenter cette politique et prévoir le sort des fichiers personnalisés placés dans ce dossier ; sinon, demander confirmation ou refuser le remplacement avant toute suppression.

## Navigation sur un réexport étoile ambigu

- Reproduction automatisée : `ts-star-reexport-collision-round202.test.mjs` part de deux exports distincts, puis ajoute un symbole `make` homonyme aux deux sources réexportées par `export *`. TypeScript signale la collision sur le barrel (`TS2308`), mais `findDefinition()` sur l'appel consommateur continue de pointer vers le premier fichier. Un réexport explicite depuis le second fichier lève le diagnostic et redirige la définition vers cette source.
- Décision à prendre : déterminer si la navigation doit rester disponible vers le premier candidat pendant une collision signalée, ou si le serveur doit refuser la définition ambiguë. Le test garde le comportement actuel et vérifie la réparation explicite.

## Ajout de section dans une configuration absente des projets proposés

- Reproduction automatisée : `add-config-unlisted-selection-round204.test.mjs` propose deux configurations, puis simule une réponse de sélection contenant l'URI d'une troisième configuration existante. `aventus.addConfigSection` ajoute la section à cette troisième configuration et demande son ouverture ; les deux fichiers proposés restent intacts.
- Source : `AddConfigSection.run()` reprend directement `result.label` comme URI sans vérifier son appartenance à la liste présentée.
- Décision à prendre : limiter une réponse de sélection aux configurations proposées et définir le traitement d'une réponse périmée ou altérée avant toute écriture.

## Deux unités de compilation écrivent la même sortie JS

- Reproduction automatisée : `build-shared-output-units-round205.test.mjs` compile deux unités vers le même fichier JS. La seconde remplace entièrement le code de la première sans diagnostic ; inverser l'ordre au rebuild inverse le code conservé, toujours avec une notification de compilation réussie.
- Source : `Build.build()` publie les unités successivement et `writeBuildCode()` écrit chaque sortie sans détecter une destination déjà utilisée par une unité précédente.
- Décision à prendre : interdire les destinations JS communes entre unités de compilation, fusionner leurs contenus ou confirmer explicitement la règle « dernière unité gagnante ».

## Définition globale prioritaire sur une variable CSS locale de même nom

- Reproduction automatisée : `scss-global-local-shadow-round206.test.mjs` charge `--accent` dans une feuille globale et le redéclare dans un composant. Les références de l'usage dans le composant contiennent sa déclaration locale et ses usages, mais « aller à la définition » mène à la feuille globale. Après retrait de la feuille globale, le même usage mène à la déclaration locale. Un autre composant sans déclaration locale mène correctement à la feuille globale avant son retrait.
- Source : `AventusSCSSLanguageService.findDefinition()` consulte le registre global avant de demander la définition du document courant à `vscode-css-languageservice`.
- Décision à prendre : donner la priorité à la déclaration locale lorsqu'elle est résolue dans le document, puis utiliser la variable globale en repli ; vérifier également les références et le survol après édition.

## Une traduction i18n de type incorrect reste dans l'export

- Reproduction automatisée : `i18n-invalid-value-recovery-round207.test.mjs` fournit une traduction numérique `12` dans un JSON valide avec une locale manquante. Le diagnostic de schéma signale le type incorrect, mais l'export contient encore `12` alors que son contrat annonce des chaînes ; l'action d'ajout de locale conserve également cette valeur numérique. Une édition qui remplace la valeur par une chaîne rétablit diagnostics et exports attendus.
- Source : `AventusI18nFile.transformForExport()` copie les valeurs JSON sans contrôler leur type ; `actionImportMissingLocales()` recopie tout l'objet source.
- Décision à prendre : déterminer si une valeur de type incorrect doit être exclue de l'export et de la correction, convertie en chaîne ou conservée tant que le diagnostic est visible.

## Export npm conditionnel `node` prioritaire sur `types` pour les bibliothèques TypeScript

- Reproduction automatisée : `ts-lib-conditional-priority-round209.test.mjs` crée un package dont `exports["."]` expose simultanément `node: ./index.js` et `types: ./index.d.ts`. `loadNodeModules()` charge le JavaScript et omet la déclaration, même si elle existe. Le retrait de `node` fait apparaître la déclaration ; son retrait sur disque puis sa recréation sont bien reflétés. Un `types` pointant vers un fichier absent ne se replie pas sur `default` existant.
- Source : `libLoader.ts` choisit `node || import || types || require || default` avant de vérifier l'existence du fichier sélectionné.
- Décision à prendre : pour le service TypeScript, privilégier `types` lorsqu'il est présent et définir si un chemin de déclaration absent doit permettre le repli vers `default` ou signaler seulement le package incomplet.

## Valeur de variable de template contenant `$&` réinjectée comme marqueur

- Reproduction automatisée : `template-dollar-variables-round210.test.mjs` crée un vrai template dont le nom de fichier et le contenu contiennent `${{name}}`, avec la valeur `Cash$&Tail`. Le fichier produit s'appelle `Cash${{name}}Tail.lib.avt` et son contenu conserve également `${{name}}` au lieu d'insérer littéralement `Cash$&Tail` ; ce chemin est enregistré comme source Aventus.
- Source : `AventusTemplate.replaceVariables()` passe la valeur comme chaîne de remplacement à `String.replace()`, qui interprète `$&` comme la correspondance complète.
- Décision à prendre : traiter les valeurs de variables comme du texte littéral dans les chemins et contenus, notamment pour `$&`, `$'`, `$\`` et `$$`.

## `package.json` npm conservé quand sa génération est désactivée

- Reproduction automatisée : `npm-config-toggle-round210.test.mjs` génère `package.json` et les points d'entrée dans deux destinations, désactive `packageJson` tout en changeant le nom, la version et l'export, puis le réactive. Les points d'entrée sont actualisés à chaque passage, mais les deux `package.json` gardent le nom et la version initiaux pendant la désactivation. La réactivation les actualise.
- Source : `Build.writeBuildNpm()` ne suit pas `package.json` dans `.aventus-npm-generated.json` et ne le retire pas quand `outputNpm.packageJson` devient faux.
- Décision à prendre : déterminer si la désactivation doit retirer un `package.json` précédemment généré, le conserver comme fichier utilisateur, ou signaler son état périmé.
## Sortie statique partagée entre deux exports laissée après suppression des sources

- Reproduction automatisée : `static-cross-export-ownership-round211.test.mjs` fait écrire deux exports distincts vers le même `shared.bin`. Après suppression de la première source, la copie du second export est préservée. Après suppression de la seconde source, cette copie reste sur disque alors qu'aucune des deux sources n'existe encore ; aucun diagnostic n'est transmis.
- Cause : chaque instance `Static` tient son registre `exportedBySource` séparément. La seconde voit la sortie comme préexistante à son premier passage et fixe `canDelete` à `false`, sans distinguer une sortie créée par un autre export de celle appartenant à un processus externe.
- Décision à prendre : définir la propriété et le nettoyage des sorties communes à plusieurs exports, ainsi que le diagnostic éventuel lorsqu'ils visent le même chemin.

## Accesseur avec getter et setter dupliqué dans le manifeste Custom Elements

- Reproduction automatisée : `manifest-parsed-accessor-revisions-round211.test.mjs` parse trois révisions d'un composant. Quand un getter `label(): string` et un setter `label(value: string)` coexistent, Custom Elements produit deux champs publics `label`, le second de type `notype`. Le retrait des accesseurs supprime les deux entrées au passage suivant.
- Source : `ClassInfo` conserve le setter comme propriété distincte sous la clé interne `°set°label`, tandis que `CustomElements.register()` sérialise les deux propriétés avec leur nom public `label`. Le setter n'a pas de type de retour explicite et devient `notype`.
- Décision à prendre : fusionner les deux accesseurs en un seul champ public, ou définir une représentation propre au setter dans le manifeste.

## Commentaire de bloc multiligne dans une configuration JSON

- Reproduction automatisée : `json-multiline-comment-recovery-round219.test.mjs` soumet une configuration conforme au schéma avec un commentaire `/* ... */` sur deux lignes. La validation ajoute `Can't parse the json` et `getConfig()` retourne `null`. Après remplacement du commentaire par une version sur une ligne, puis retrait complet, la validation ne signale plus d'erreur et `getConfig()` renvoie à nouveau le projet.
- Source : `AventusJSONLanguageService.removeComments()` utilise une expression régulière dont `.` ne couvre pas les sauts de ligne ; le commentaire multiligne reste présent avant `JSON.parse()`.
- Décision à prendre : accepter les commentaires de bloc multilignes dans les configurations, puis les retirer correctement avant le parsing, ou les interdire explicitement avec un diagnostic cohérent.

## Guillemets échappés et `//` dans une chaîne de configuration JSON

- Reproduction automatisée : `json-escaped-quote-comment-round222.test.mjs` valide une configuration dont la description contient un guillemet échappé suivi de `//`. Le document est un JSON valide mais la validation ajoute `Can't parse the json` et `getConfig()` retourne `null`. Remplacer la description par une chaîne sans guillemet échappé restaure la lecture ; remettre le guillemet reproduit l'échec.
- Source : `AventusJSONLanguageService.removeComments()` reconnaît les chaînes avec `".*?"` sans tenir compte des guillemets échappés. Il traite ensuite `//` comme un début de commentaire et retire le reste de la ligne avant `JSON.parse()`.
- Décision à prendre : reconnaître les échappements et préserver le contenu des chaînes JSON lors de la suppression des commentaires.

## Parenthèses dans un commentaire de ligne JSON

- Reproduction automatisée : `json-line-comment-punctuation-round230.test.mjs` charge une configuration valide dont un commentaire de ligne contient `details (optional)`. La validation ajoute `Can't parse the json` et `getConfig()` retourne `null`. Le retrait des parenthèses rétablit validation et chargement.
- Source : la classe de caractères de `AventusJSONLanguageService.removeComments()` pour `//` exclut aussi `(` et `)`, ce qui empêche de retirer ce commentaire avant `JSON.parse()`.
- Décision à prendre : retirer le commentaire de ligne complet jusqu'au saut de ligne, y compris sa ponctuation, sans altérer les chaînes JSON.

## Sortie npm non suivie après échec partiel d'écriture

- Reproduction automatisée : `npm-partial-write-recovery-round231.test.mjs` publie `Alpha.js`, puis échoue sur `index.d.ts` après avoir écrit `Beta.js`. Le manifeste de propriété reste celui d'Alpha. Un nouvel essai avec `Gamma.js` retire Alpha et publie Gamma, mais laisse `Beta.js` sur disque sans l'inscrire au manifeste.
- Avec deux destinations, un échec sur la seconde après l'écriture de `Beta.js` laisse aussi une copie partielle dans la première. Les deux manifestes restent anciens ; la publication suivante retire Alpha mais laisse Beta orphelin dans les deux destinations.
- Source : `Build.writeBuildNpm()` ne publie le manifeste des fichiers générés qu'après toutes les écritures ; les sorties déjà écrites lors d'un échec ne sont ni restaurées ni prises en compte au nouvel essai.
- Décision à prendre : restaurer les sorties de la tentative échouée ou les inclure dans le nettoyage de la tentative suivante.

## Exports Sharp et PHP lancés malgré des métadonnées JSON invalides

- Reproduction automatisée : `converter-invalid-config-recovery-round232.test.mjs` exécute l'export sur un `aventus.sharp.avt` incomplet. La lecture JSON échoue, mais le convertisseur est tout de même lancé et les états `compiling` puis `success` portent un nom de projet vide. Une correction du fichier rétablit le nom au prochain export.
- Le même test reproduit ce comportement pour PHP avec un `composer.json` invalide : `php-converter` est lancé sous un nom vide, puis la correction rétablit `vendor/recovered` au prochain export.
- Source : `SharpExport.run()` et `PhpExport.run()` interceptent l'erreur de lecture/parsing, puis continuent vers `execAsync()` avec le nom de projet initialisé à une chaîne vide.
- Décision à prendre : arrêter l'export et signaler l'erreur de configuration avant de lancer le convertisseur, ou définir explicitement un comportement de reprise.

## Sorties i18n de révisions différentes après un échec d'écriture

- Reproduction automatisée : `build-i18n-partial-write-recovery-round233.test.mjs` publie deux locales, puis échoue sur `fr.json` après avoir écrit la nouvelle version de `en.json`. La sortie anglaise est alors en nouvelle révision tandis que la sortie française conserve l'ancienne. Un nouvel appel sur le même build synchronise les deux fichiers.
- Source : `Build.writeBuildI18n()` écrit les fichiers de locale successivement, sans restaurer les sorties déjà écrites si une écriture ultérieure échoue.
- Décision à prendre : définir si les sorties i18n d'un build doivent être publiées ensemble ou si un état partiel est acceptable après une erreur signalée.

## Modes de sortie i18n configurables sans implémentation

- Reproduction automatisée : `build-i18n-configured-modes-round234.test.mjs` utilise une traduction en anglais et en français. Les modes `basedOnAttribute` et `include` créent leur dossier de destination, mais aucun fichier ; `singleFile` produit bien les deux fichiers attendus avec le même build.
- Source : le schéma de configuration accepte ces deux modes, tandis que les branches correspondantes de `Build.writeBuildI18n()` sont vides.
- Décision à prendre : implémenter ces modes ou les retirer des choix de configuration et signaler clairement leur indisponibilité.

## Dossier de namespace i18n créé mais inutilisé en mode `oneToOne`

- Reproduction automatisée : `build-i18n-component-namespace-round235.test.mjs` publie puis révise la traduction d'un composant de namespace `Demo.Widgets`. Le dossier `Demo/Widgets` est créé mais reste vide ; `card_en.json` est écrit à la racine de sortie à chaque révision.
- Deux composants `Card` dans `Demo.Widgets` et `Demo.Pages` écrivent tous deux ce même `card_en.json` ; la traduction du second écrase celle du premier, tandis que leurs deux dossiers de namespace restent vides.
- Source : `Build.writeBuildI18n()` calcule et crée `fullPath` pour le namespace du composant, puis construit `outputFile` avec `output` au lieu de `fullPath`.
- Décision à prendre : écrire les traductions de composants sous leur namespace ou supprimer la création de dossier si la sortie à la racine est voulue.

## Fichiers i18n globaux homonymes écrasés en mode `oneToOne`

- Reproduction automatisée : `build-i18n-global-name-collision-round237.test.mjs` exporte deux fichiers `@common.i18n.avt` situés dans deux dossiers distincts, avec deux locales. Un seul `common_en.json` et un seul `common_fr.json` sont produits. Le second fichier écrase le premier ; inverser l'ordre des sources inverse le contenu retenu.
- Cause : `Build.writeBuildI18n()` construit le nom de sortie avec le seul nom de fichier, sans chemin ni contrôle de collision.
- Décision à prendre : définir une convention de chemin pour préserver chaque source, ou signaler explicitement les doublons avant la publication.

## Destination retirée d'un export statique laissée sur disque

- Reproduction automatisée : `static-output-list-transition-round220.test.mjs` ajoute une deuxième destination à un export, puis retire la première et modifie le binaire source. La première copie conserve son ancien contenu tant que la source existe ; elle n'est supprimée qu'après disparition de cette source, même si la destination ne figure plus dans la configuration.
- Cause : `Static.export()` garde les sorties précédentes dans `exportedBySource` et ne nettoie cette collection que lorsque la source entière disparaît.
- Décision à prendre : définir si le retrait d'une destination sur une instance d'export active doit supprimer aussitôt les sorties qu'elle a créées, en préservant celles déjà présentes ou modifiées hors du build.

## Recherche i18n par position périmée pendant une édition JSON invalide

- Reproduction automatisée : `i18n-invalid-position-recovery-round220.test.mjs` part de la clé `old`, puis remplace le document par `{"new":` (JSON invalide). `getKeyFromLocation()` renvoie encore `old` pour une position située dans la nouvelle clé. Après correction vers une traduction `new` valide, la recherche et les exports reviennent à jour.
- Cause : `AventusI18nFile.onContentChange()` conserve `parsed` et `parsedSrc` après l'échec de `JSON.parse()`, alors que `getKeyFromLocation()` convertit la position dans le document courant avant de consulter les plages anciennes.

## Diagnostic i18n de doublon conservé par un autre fichier pendant une édition invalide

- Reproduction automatisée : `i18n-cross-file-invalid-recovery-round222.test.mjs` crée deux fichiers globaux ayant la clé `shared`. Après remplacement du second par un JSON incomplet, le premier continue de signaler un doublon avec l'ancienne clé du second. Une correction vers `replacement` retire le diagnostic et actualise les exports.
- Cause : `AventusI18nFile.onContentChange()` garde `parsed` après une erreur de parsing ; la validation des autres fichiers consulte cette ancienne analyse dans `build.tsLanguageService.i18nFiles`.
- Décision à prendre : préciser si une traduction temporairement invalide doit continuer à participer aux diagnostics de doublon des autres fichiers, ou si son analyse doit être écartée jusqu'à sa correction.
- Décision à prendre : pendant une édition invalide, faut-il vider l'index de positions ou garder le dernier état valide en signalant son caractère périmé aux consommateurs ?

## Action i18n proposée hors de la plage diagnostiquée

- Reproduction automatisée : `i18n-action-range-round225.test.mjs` demande des actions sur la clé `beta` alors que seule `alpha` manque de la locale `fr`. `Import missing locales` est proposé et remplace tout le document. Après une édition qui complète `alpha` et retire `fr` de `beta`, l'action cible la nouvelle absence même lorsqu'elle est demandée au début du document.
- Cause : `AventusI18nLanguageService.codeAction()` transmet le fichier à `actionImportMissingLocales()` sans utiliser la plage demandée ; la correction parcourt toutes les clés.
- Décision à prendre : préciser si cette action est volontairement disponible partout dans le fichier, ou si elle doit être limitée à la plage du diagnostic concerné.

## Injection HTML valide masquée par une fermeture invalide précédente

- Reproduction automatisée : `html-raw-malformed-transition-round226.test.mjs` analyse une balise `<pre>` d'abord déclarée brute, puis retire cette configuration. Le `<button>` interne se ferme par `</span>` : le parseur signale l'erreur et expose son injection, mais ne relève plus l'injection du `<button>` valide qui suit `</pre>`. Après correction du contenu de `<pre>`, les deux injections sont retrouvées.
- Décision à prendre : préciser si le parseur doit reprendre la collecte des injections après une fermeture invalide, au moins à la balise parente suivante.

## Dépendance transitive conservée après remplacement de version d'un package

- Reproduction automatisée : `dependency-version-branch-revision-round226.test.mjs` charge `Shared` en version générique avec `OldLeaf`, puis remplace `Shared` par une version exacte dont la seule dépendance est `NewLeaf`. Le résultat sélectionne bien le fichier exact, mais contient aussi `OldLeaf` et son URI. Le retrait de la branche exacte lors d'une nouvelle résolution retire `NewLeaf` ; sa réintroduction reproduit le reliquat.
- Cause : `DependencyManager.loadDependency()` remplace l'entrée de `Shared` dans le graphe de résolution, sans retirer les dépendances déjà ajoutées par la première version.
- Décision à prendre : élaguer les packages qui ne sont plus accessibles depuis les dépendances choisies avant de constituer les fichiers et URI du build.

## Type de retour tableau tronqué dans la documentation Markdown du package

- Reproduction automatisée : `manifest-package-function-generics-round227.test.mjs` fait passer une fonction générique de `T` à `U[]`, puis à `boolean`. La deuxième révision documente `Return : U` alors que la signature TypeScript déclare `U[]` ; les contraintes, paramètres et descriptions sont bien renouvelés.
- Décision à prendre : conserver le suffixe `[]` dans le rendu Markdown du type de retour.

## Chemin de sortie modifié par un callback de template

- Reproduction automatisée : `template-callback-path-round228.test.mjs` exécute un vrai template dont le callback change `writeInfo.writePath` de `Original.lib.avt` à `Renamed.lib.avt`. Le fichier écrit sur disque garde le nom `Original.lib.avt`, tandis que `FilesManager.onCreatedUri()` reçoit l'URI de `Renamed.lib.avt`, qui n'existe pas.
- Cause : `AventusTemplate.writeFile()` écrit avec la variable locale `exportPath`, calculée avant le callback, puis enregistre `writeInfo.writePath` après le callback.
- Décision à prendre : soit appliquer le chemin modifié à l'écriture et à l'enregistrement, soit rendre ce champ non modifiable et toujours enregistrer le chemin réellement écrit.

## Découpage divergent d'un template imbriqué dans un composant unique

- Reproduction automatisée : `component-nested-template-round230.test.mjs` édite un composant unique avec une région `<template>` contenant elle-même `<template><b>Nested</b></template>`. Le sous-document vivant conserve tout le contenu de la région, alors que `AventusWebComponentSingleFile.getRegion()` s'arrête à la fermeture interne et renvoie `<div><template><b>Nested</b>` ; les deux parcours retrouvent le même résultat après suppression du template imbriqué.
- Cause : `splitDocument()` utilise une capture gourmande pour la région HTML, tandis que `getRegion()` utilise une capture non gourmande.
- Décision à prendre : définir un découpage commun pour les deux parcours, capable d'identifier la fermeture de la région externe lorsque le HTML contient un template imbriqué.

## Exception de callback pendant la copie d'un template

- Reproduction automatisée : `template-callback-exception-round236.test.mjs` lance un vrai template à deux fichiers. Le callback lève une exception pour le second. Le premier fichier est écrit et enregistré, le second n'est pas créé ; le template termine néanmoins sans rejeter l'appel. Après correction du callback, un nouvel essai crée le second fichier et réenregistre aussi le premier.
- Cause : `AventusTemplate.writeFile()` intercepte l'exception autour de la boucle de copie, poursuit jusqu'à `registerFile` pour les fichiers déjà traités et ne signale pas l'échec à l'appelant.
- Décision à prendre : déterminer si une exception du callback doit faire échouer la génération et comment traiter les fichiers déjà écrits ou enregistrés.

## Écriture partielle pendant la séparation d'un composant

- Reproduction automatisée : `component-split-write-recovery-round240.test.mjs` place un dossier au chemin attendu pour `Card.wcv.avt`. `SplitComponent.run()` écrit d'abord `Card.wcs.avt`, puis échoue en écrivant la vue. Le composant unique et le cache restent présents, sans notification, mais le style partiel demeure sur disque. Après retrait du dossier bloquant, une seconde séparation réussit.
- Décision à prendre : définir si la séparation doit nettoyer les sorties partielles lorsqu'une écriture échoue, afin de rendre l'opération atomique.

## Fichier HTTP accessible hors de la racine via une jonction

- Reproduction automatisée : `http-junction-root-round241.test.mjs` configure une racine HTTP `public`, crée sous celle-ci une jonction `linked` vers un dossier `private` voisin, puis obtient le contenu de `private/secret.txt` par `GET /linked/secret.txt` avec un statut 200.
- Décision à prendre : préciser si la racine HTTP doit délimiter les chemins réels accessibles. Dans ce cas, refuser les cibles dont le chemin réel sort de la racine avant de les servir.

## Lien de répertoire dans le chemin d'installation d'un template

- Reproduction automatisée : `template-installation-link-round237.test.mjs` crée une jonction `installed/linked` vers un dossier extérieur. `TemplateManager.getInstallationPath(installed, 'linked/new-template')` accepte le chemin, puis un import local réel copie `content.txt` dans `outside/new-template` et annonce l'installation réussie.
- Cause : la validation compare des chemins normalisés lexicalement sans résoudre les liens de répertoire déjà présents.
- Décision à prendre : préciser si l'import doit rester confiné à la racine réelle, puis résoudre et vérifier les liens de chaque segment de destination si cette garantie est attendue.

## Valeurs vides de `group` et `prefix` dans `@Storybook`

- Reproduction automatisée : `storybook-empty-group-prefix-round238.test.mjs` analyse trois versions d'une classe : `group: ''` et `prefix: ''`, puis deux valeurs non vides, puis aucun réglage local. La première version garde `Library/Catalog/Widget` au lieu de désactiver le préfixe et le groupe ; les versions suivantes produisent respectivement `Local/Controls/Widget` et `Library/Catalog/Widget`.
- Cause : `StorybookDecorator.is()` ne renseigne `group` et `prefix` que lorsque leurs valeurs sont véridiques, tandis que `Storie.getFullname()` prévoit déjà le cas d'une chaîne vide explicite.
- Décision à prendre : décider si une valeur vide explicite doit annuler le préfixe du build et le namespace, puis conserver cette valeur dans le parseur si ce comportement est voulu.

## Collision d'alias entre deux exports d'un même package npm

- Reproduction automatisée : `npm-same-alias-revision-round239.test.mjs` enregistre `first` et `second` du même package sous l'alias `shared`. Le bundle expose `second` sous cet alias, quel que soit l'ordre d'enregistrement. Le retrait de `second` révèle `first`, et son retour remplace de nouveau `first`, sans diagnostic.
- Cause : `NpmBuilder.writeFileToCompile()` trie les noms d'exports puis affecte chaque valeur au même champ `npmCompilation[hash]['shared']` ; la dernière affectation l'emporte.
- Décision à prendre : déterminer si une collision d'alias doit être signalée, ou si l'écrasement déterministe est un comportement accepté.

## Signature incomplète des paramètres de fonction dans le manifeste package

- Reproduction automatisée : `manifest-package-function-parameters-round240.test.mjs` analyse et documente trois révisions de `combine`. `first?: string`, `suffix = "!"` et `...parts: number[]` apparaissent comme `first: string`, `suffix: any` et `parts: number`. Une révision suivante remplace correctement ces noms, mais `...flags: boolean[]` devient `flags: boolean`.
- Cause : `ManifestPackageMd.loadFunction()` reconstruit chaque paramètre avec son nom et le texte de `TypeInfo`, sans traiter le marqueur optionnel, la valeur par défaut ni le token rest ; `TypeInfo.getFullTxt()` réduit les types de tableau dans ce parcours.
- Décision à prendre : définir la représentation attendue des paramètres optionnels, à valeur par défaut et rest dans la documentation, puis préserver aussi le type tableau si la signature doit rester fidèle au TypeScript.
