# Cas serveur en attente de changement de code

Ce fichier conserve les cas reproductibles rencontrés pendant l'écriture des tests. Les changements de `server/src` pour ces points sont décidés avec l'utilisateur, un par un.

## Note hors périmètre des tests serveur

- `client/src/cmds/Rename.ts` transmet `item.oldUri` dans le champ `newUri` de la commande `aventus.rename`. À traiter plus tard avec les tests du client VS Code ; ne pas modifier le client pendant cette passe.

## Renommage de fichiers hors TypeScript : aucune édition de références

- Reproduction automatisée : `project-rename-non-ts-round194.test.mjs` transmet aux deux projets des déplacements de vues, styles, fichiers SCSS, HTML et JSON. Aucun ne produit d'édition ni n'appelle le service de renommage TypeScript ; un fichier `.lib.avt` placé après un style dans le même lot produit bien les éditions attendues.
- Source : `Build.onRename()` ne traite que les cinq extensions TypeScript Aventus et retourne un résultat vide pour les autres fichiers.
- Décision à prendre : préciser quelles références de vues et de styles doivent être actualisées lors d'un déplacement, puis ajouter des cas réels avant de modifier le routage du renommage.

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

## Cache npm après exception du bundler concurrent

- Reproduction automatisée : `npm-concurrent-error-recovery-round242.test.mjs` lance deux appels `NpmBuilder.compile()` sur les mêmes imports. Une exception transitoire d'esbuild rejette les deux appels. Un troisième appel identique renvoie une sortie vide sans relancer esbuild ; un import supplémentaire force une nouvelle compilation réussie.
- Cause : `compileCurrent()` conserve `lastInfo` et `lastInfoToCompile` lorsqu'`esbuildBuild()` rejette avant de renseigner `npmDepBuildTxt`.
- Décision à prendre : invalider ces caches lors d'une exception pour permettre un nouvel essai avec les mêmes imports.

## Export statique récursif quand la destination est dans la source

- Reproduction automatisée : `static-output-inside-input-round244.test.mjs` configure `input/generated` comme destination d'un export dont la source est `input`. Le premier export écrit `generated/data.txt`, le second redécouvre cette copie et écrit `generated/generated/data.txt`. Après suppression de `input/data.txt`, un export suivant écrit encore `generated/generated/generated/data.txt`.
- Cause : `Static.export()` parcourt récursivement tout le dossier source sans exclure ses dossiers de sortie.
- Décision à prendre : refuser une destination située dans la source ou l'exclure de la découverte pour éviter la croissance récursive des sorties.

## Type inféré d'un paramètre avec valeur par défaut absent du manifeste package

- Reproduction automatisée : `manifest-package-function-parameters-round240.test.mjs` analyse `combine(first?: string, suffix = "!", ...parts: number[])`. Le Markdown préserve `first?: string` et `...parts: number[]`, mais représente `suffix = "!"` par `suffix: any` et omet sa valeur par défaut.
- Reproduction complémentaire : `manifest-package-inferred-signatures-round271.test.mjs` alterne sur trois révisions des signatures inférées et explicites d'une fonction et d'une méthode. Les paramètres sans annotation et les retours inférés sont rendus comme `any`, même quand l'initialiseur ou le corps détermine un type simple ; les types explicitement annotés sont actualisés correctement.
- Cause : `ManifestPackageMd.getParameter()` utilise `any` en l'absence d'annotation de type et ne reprend pas l'initialiseur du paramètre.
- Décision à prendre : définir si le Markdown doit inférer les types des paramètres et retours, et montrer les valeurs par défaut des paramètres.

## Métadonnées périmées sur un package chargé en cache

- Reproduction automatisée : `dependency-cached-metadata-round242.test.mjs` résout plusieurs fois le même objet package. Un override npm prend effet, son retrait révèle le nouvel en-tête, mais le retrait ultérieur des en-têtes npm et description laisse `npmUri` et `description` à leurs anciennes valeurs.
- Cause : `DependencyManager.loadDependency()` affecte ces champs lorsque la configuration ou les en-têtes existent, mais ne les efface pas lorsqu'ils disparaissent d'un objet package réutilisé.
- Décision à prendre : définir si la résolution doit recalculer ces deux métadonnées à chaque lecture d'un package déjà chargé ; si oui, remettre les valeurs absentes à `undefined` avant de publier la nouvelle résolution.

## Enregistrement concurrent d'un fichier et échec tardif du callback initial

- Reproduction automatisée : `files-concurrent-registration-failure-round243.test.mjs` suspend le callback d'ouverture d'une URI, puis enregistre une deuxième version de la même URI. Le deuxième appel renvoie bien un fichier contenant cette version. Quand le premier callback échoue, le gestionnaire déclenche sa suppression et retire l'URI de son registre, malgré la réussite du deuxième appel. Une troisième ouverture rétablit le fichier.
- Cause : `triggerOnNewFile()` publie l'objet dans `files` avant d'attendre les callbacks ; `registerFile()` concurrent traite alors la deuxième version comme une mise à jour de cet objet. Le rollback du premier appel supprime ensuite le même objet.
- Décision à prendre : déterminer si les enregistrements d'une même URI doivent être sérialisés ou si un échec de callback initial doit préserver une version reçue et validée pendant son attente.

## Ajout de section après une édition concurrente de la configuration

- Reproduction automatisée : `add-config-concurrent-file-edit-round243.test.mjs` modifie le fichier de configuration pendant que la commande attend le nom d'une section Static. La commande écrit ensuite la version lue avant cette saisie, effaçant le nouveau module, la section statique et le champ personnalisé ajoutés entre-temps. Une édition survenue pendant la sélection du type de section est, elle, conservée.
- Cause : `AddConfigSection.run()` lit et parse le fichier après la sélection du type, puis conserve cet objet en mémoire pendant `GenericServer.Input()` avant de réécrire le fichier entier.
- Décision à prendre : relire et valider la configuration après la saisie du nom, ou refuser l'écriture si le fichier a changé pendant l'interaction, afin d'éviter la perte silencieuse d'éditions concurrentes.

## Import multiple de templates partiellement appliqué en cas d'échec

- Reproduction automatisée : `template-import-partial-retry-round244.test.mjs` sélectionne deux templates locaux. Le premier dossier est copié ; la seconde copie échoue parce que son dossier parent est un fichier. L'appel rejette sans recharger le registre ni annoncer l'installation, mais le premier dossier reste sur disque. Après réparation du chemin, un nouvel essai installe les deux et recharge une fois.
- Cause : `TemplateManager.selectTemplateToImport()` copie chaque sélection immédiatement et ne lance `reloadTemplates()` qu'après la boucle entière ; une erreur de `cpSync()` interrompt cette boucle sans annuler les copies précédentes.
- Décision à prendre : définir si l'import multiple doit être atomique ou, en cas d'échec partiel, recharger le registre et signaler précisément les éléments déjà installés.

## Alias npm non échappé dans la sortie JavaScript

## Réimport local après disparition de la source

- Reproduction automatisée : `template-import-source-disappears-round246.test.mjs` retire le dossier source d'un projet ou template local après l'affichage de la sélection. Le réimport supprime d'abord l'ancienne installation, puis `cpSync()` échoue ; aucun rechargement ni message de réussite ne suit. Restaurer la source permet un nouvel essai réussi.
- Cause : les deux branches d'import retirent le dossier cible préexistant avant de copier la source sélectionnée, sans vérifier à nouveau que celle-ci existe ni préparer une copie provisoire.
- Décision à prendre : préserver l'ancienne installation si la copie échoue, par exemple en copiant dans un dossier provisoire avant de remplacer la destination.

## Alias npm non échappé dans la sortie JavaScript

- Reproduction automatisée : `npm-alias-escaping-round245.test.mjs` enregistre un export npm avec l'alias `user'sValue`. `NpmBuilder.compile()` ne renvoie aucune erreur, mais l'exécution du texte produit lève `SyntaxError`. Le retrait de cet import puis l'enregistrement de `usersValue` rétablit un bundle exécutable sur la même instance.
- Cause : `NpmBuilder.writeFileToCompile()` insère l'alias entre apostrophes dans `toExport` sans l'échapper. Ce fragment est assemblé après esbuild et échappe ainsi à sa validation syntaxique.
- Décision à prendre : définir les caractères admis dans les alias, puis échapper la clé produite ou diagnostiquer un alias invalide avant de publier le bundle.

## Référence SCSS masquée par une URL `https://` sur la même ligne

- Reproduction automatisée : `scss-global-url-comment-reference-round246.test.mjs` définit `--tone` dans `:root` et l'utilise après `url("https://example.test/image.svg")` sur la même ligne. La recherche de références et le renommage ne voient que la déclaration. Remplacer l'URL par une URL `data:` révèle aussi l'usage, sans changer la variable.
- Cause : `AventusGlobalSCSSLanguageService.getGlobalReferences()` appelle `withoutComments()`, dont l'expression `//[^\r\n]*` traite le `//` d'une chaîne URL comme un commentaire et masque la suite de la ligne.
- Décision à prendre : utiliser une analyse qui distingue les commentaires des chaînes et URL avant de collecter les références CSS et les éditions de renommage.

## Chaîne CSS comptée comme référence de variable globale

- Reproduction automatisée : `scss-global-quoted-reference-round270.test.mjs` définit `--tone`, puis place `content: "var(--tone)"` et un vrai `color: var(--tone)` dans un consommateur. La recherche renvoie les deux occurrences et le renommage propose aussi une édition de la chaîne littérale. Après retrait du texte de la chaîne, seule la vraie référence reste.
- Cause : la collecte des références cherche `var(` par expression régulière dans le texte du document, sans exclure les chaînes CSS.
- Décision à prendre : confirmer que les chaînes littérales doivent être exclues des références et du renommage ; dans ce cas, analyser les nœuds CSS ou ignorer explicitement les plages de chaînes.

## Copie statique orpheline après changement du dossier source

- Reproduction automatisée : `static-input-folder-transition-round247.test.mjs` exporte `first/asset.bin`, change `inputPathFolder` vers `second` contenant un autre `asset.bin`, puis supprime ce second fichier. La nouvelle copie remplace l'ancienne, mais reste dans la destination alors que le registre de suivi est vide.
- Cause : lorsque la nouvelle source réutilise une sortie déjà présente, `rememberOutput()` lui attribue `canDelete: false` car cette sortie existe avant la copie ; le retrait de l'ancienne source supprime son entrée sans transférer la propriété.
- Décision à prendre : déterminer si un changement de `inputPathFolder` doit transférer la propriété des sorties remplacées à la nouvelle source afin de permettre leur nettoyage ultérieur.

## Bundle npm périmé après édition d'un module installé

- Reproduction automatisée : `npm-project-manifest-disappearance-round247.test.mjs` change le code d'un module installé en retirant puis restaurant le `package.json` du projet ; chaque transition force une recompilation. Une troisième édition du même module, alors que le manifeste et les imports restent identiques, laisse la valeur précédente dans le bundle. Ce cas complète `npm-installed-source-rebuild-round110.test.mjs` et `npm-package-content-cache-round193.test.mjs`.
- Cause : `NpmBuilder.compileCurrent()` ne relance esbuild que si les imports ou les déclarations de dépendances du manifeste changent ; il ne surveille pas le contenu des modules installés.
- Décision à prendre : définir si les sources de `node_modules` doivent invalider le cache pendant les builds de développement, et selon quel signal pour éviter une recompilation à chaque appel.

## Longueur HTTP différente entre `HEAD` et `GET` pour le HTML injecté

- Reproduction automatisée : `http-head-injection-round247.test.mjs` sert le même fichier HTML avec `GET` et `HEAD`. Sans en-tête `Origin`, `GET` injecte le script live reload et annonce la taille du contenu enrichi ; `HEAD` ne renvoie pas de corps mais annonce la taille du fichier brut. Avec un en-tête `Origin`, les deux requêtes annoncent la taille brute.
- Cause : l'injection et l'ajustement de `Content-Length` se font lors de l'événement de flux dans `HttpServer.createStaticServer()`, qui n'est pas parcouru pour `HEAD`.
- Décision à prendre : déterminer si `HEAD` doit annoncer la longueur de la représentation qui serait servie par `GET`, puis calculer les mêmes en-têtes sans envoyer le corps si cette cohérence est attendue.

## Message de conflit de séparation de composant sans chemin

- Reproduction automatisée : `component-destination-collision-round124.test.mjs`, `component-split-existing-folder-round173.test.mjs` et `component-split-write-recovery-round240.test.mjs` vérifient que la séparation refuse une destination déjà présente sur disque ou dans le cache, sans modifier les fichiers. Le message d'erreur actuel se termine par `destination already exists: true` au lieu de nommer le chemin occupé.
- Cause : `SplitComponent.run()` mémorise seulement un booléen `conflict` puis le concatène au message.
- Décision à prendre : inclure le chemin de la première destination en conflit pour que l'utilisateur puisse résoudre l'obstruction.

## Priorité des déclarations SCSS dupliquées dans un même fichier

- Reproduction automatisée : `language-service-round20.test.mjs` et `scss-global-duplicate-declarations-round229.test.mjs` vérifient qu'une déclaration `--tone` ultérieure dans le même `:root` remplace la précédente pour la définition et le hover, alors que deux fichiers globaux distincts conservent la priorité du premier fichier chargé.
- Décision à prendre : confirmer que cette différence de priorité entre déclarations d'un fichier et fichiers distincts est voulue. Les tests décrivent le comportement actuel sans modifier le service.

## Fichier Emmet conservé après retrait du dernier tag de package

- Reproduction automatisée : `manifest-package-removal-round72.test.mjs` retire le dernier export de package ; `snippets.json` reste présent avec le snippet intégré `block` et sans ancien tag.
- Décision à prendre : confirmer si le fichier doit rester généré avec `block` ou être supprimé lorsque le dernier package disparaît. Le test décrit le comportement actuel.

## Redécouverte sur disque : fichiers existants et packages externes restent périmés

- Reproductions automatisées : `files-rediscovery-round92.test.mjs` rescane un espace après modification d'un fichier déjà en cache ; le nouveau fichier voisin est inscrit, mais le contenu du premier reste ancien. `files-package-recovery-round116.test.mjs` réinscrit un package externe initialement absent après sa création sur disque ; son contenu reste vide. Une notification de modification avec une version supérieure actualise chaque fichier.
- Source : `FilesManager.loadAllAventusFiles()` et `registerFilePackage()` créent des `TextDocument` en version `0` à chaque lecture ; `AventusFile.triggerContentChange()` ignore une version inférieure ou égale à la version déjà présente.
- Décision à prendre : lors d'une nouvelle lecture disque, incrémenter la version du document en cache, ou prévoir un chemin de rafraîchissement indépendant des versions des notifications client.

## Fusion de composant partiellement appliquée après échec d'une édition de référence

- Reproduction automatisée : `component-merge-reference-error-round248.test.mjs` fait échouer l'application de la seconde édition de référence renvoyée par `ProjectManager.onRename()`. La première référence est déjà écrite sur disque ; la seconde et les sources du composant restent inchangées, sans fichier fusionné ni notification. Une nouvelle tentative peut achever la fusion.
- Cause : `MergeComponent.run()` applique et écrit chaque édition de référence successivement avant de créer le composant fusionné, sans restauration si une édition ultérieure échoue.
- Décision à prendre : définir si la fusion doit être atomique pour les références et les fichiers du composant, ou si une reprise après application partielle est le comportement attendu.

## Storybook : description et valeur initiale d'une variable absentes

- Reproduction automatisée : `storybook-variable-revisions-round249.test.mjs` parse une constante documentée et initialisée puis régénère trois versions de sa story. Le type et l'option `noDefaultStory` sont actualisés, mais la description JSDoc et la valeur initiale n'apparaissent ni dans la story TS ni dans le MDX.
- Décision à prendre : déterminer si les stories de variables doivent publier ces deux informations ; si oui, les propager depuis le parseur vers `storieContent` et la génération Storybook.

## Corps injecté hors de la plage HTTP annoncée

- Reproduction automatisée : `http-range-injection-round249.test.mjs` demande `Range: bytes=0-18` sur un HTML contenant `</head>`. Sans en-tête `Origin`, la réponse garde le statut `206` et `Content-Range: bytes 0-18/<taille brute>`, mais le corps contient le script live reload et dépasse largement 19 octets. La plage `bytes=0-10` n'inclut pas le tag : `Content-Length` annonce malgré tout la taille avec injection et le client échoue en lisant le corps trop court. Avec un en-tête `Origin`, la réponse contient exactement les 19 octets demandés.
- Cause : `HttpServer.createStaticServer()` décide d'injecter en lisant le fichier entier, puis ajuste `Content-Length` pour le flux `send` partiel. Il ne modifie ni le statut ni `Content-Range` calculés depuis le fichier brut ; si la plage ne contient pas le tag, la substitution ne produit même pas le script annoncé.
- Décision à prendre : omettre l'injection pour les réponses partielles, ou définir une représentation et des en-têtes cohérents pour les requêtes `Range`.
## Import de plusieurs sources vers le même dossier d'installation

- Reproduction automatisée : `template-import-same-destination-round250.test.mjs` sélectionne deux projets puis deux templates distincts qui déclarent le même `installationFolder`. Dans les deux cas, le second dossier copié remplace entièrement le premier, sans avertissement, avec un seul rechargement final ; le dossier voisin est conservé.
- Décision à prendre : confirmer si une collision entre deux sélections du même import doit être acceptée et résolue par la dernière sélection, ou signalée avant la copie.

## Import d'un projet modifié pendant la sélection

- Reproduction automatisée : `template-import-source-edited-round250.test.mjs` (projet) et `template-import-edited-source-round252.test.mjs` (template) suspendent la sélection après l'analyse de `template.avt.ts`, changent le dossier d'installation déclaré et remplacent les fichiers de la source. La copie prend les nouveaux fichiers mais les installe dans le dossier déduit de l'ancienne version ; le script n'est pas analysé de nouveau.
- Décision à prendre : confirmer si l'import doit figer le contenu au moment de présenter le choix, ou relire et revalider le script juste avant la copie pour que les fichiers et le dossier correspondent à une même version.

## Storybook : description JSDoc d'un alias de type absente

- Reproduction automatisée : `storybook-alias-default-toggle-round251.test.mjs` parse trois versions documentées d'un alias avec `@Storybook`. Les types et la story par défaut suivent les révisions, mais aucune des descriptions JSDoc n'apparaît dans la story TS ni dans le MDX ; la description du composant reste vide.
- Décision à prendre : déterminer si les stories d'alias doivent afficher leur JSDoc ; si oui, transmettre cette description du parseur à la génération Storybook.

## Renommage pendant le remplacement des builds d'un projet

- Reproduction automatisée : `project-rename-build-transition-round253.test.mjs` suspend le premier build pendant `Project.onRename()`, remplace la liste des builds, puis reprend. Le second build de l'ancienne liste est encore appelé et ses éditions sont renvoyées, alors que l'appel suivant utilise la nouvelle liste.
- Décision à prendre : confirmer si les éditions issues de builds retirés pendant un renommage doivent rester dans la réponse, ou si le projet doit vérifier la liste courante avant chaque build.

## Formatage appliqué à une version de fichier différente

- Reproduction automatisée : `format-stale-edit-race-round256.test.mjs` suspend le formateur après sa lecture de `abc def`, insère `new ` dans le document, puis reprend l'édition calculée pour les trois premiers caractères. La commande applique cette édition au document récent et écrit `ABC abc def` sur disque, remplaçant `new` plutôt que `abc`.
- Cause : `Format.run()` attend `getFormatting()` puis appelle `applyTextEdits()` sans comparer la version du document ; cette méthode calcule les offsets sur le document courant.
- Décision à prendre : refuser ou recalculer les éditions si le fichier change pendant le formatage, ou confirmer explicitement l'application à la version courante.

## Formatage non écrit sur disque après un premier échec d'écriture

- Reproduction automatisée : `format-write-retry-round257.test.mjs` rend le chemin de destination non inscriptible après le calcul des éditions. Le contenu en mémoire passe à `after`, mais l'écriture échoue. Après rétablissement du fichier à `before`, un second formatage sans nouvelle édition ne réécrit pas le disque ; mémoire et disque restent divergents. Le même test vérifie qu'un lot continue à formater le fichier suivant et signale seulement le chemin en échec.
- Cause : `Format.run()` applique les éditions au document avant `writeFileSync()`, puis détermine la nécessité d'une écriture par comparaison du contenu en mémoire avant et après chaque appel.
- Décision à prendre : définir si l'échec d'écriture doit restaurer le document en mémoire ou garder un état de synchronisation à reprendre au prochain formatage.

## Ajout de sections statiques homonymes

- Reproduction automatisée : `add-config-static-duplicate-round264.test.mjs` lance deux fois `aventus.addConfigSection` avec le nom statique `Assets`. Le fichier contient deux entrées identiques, aucune erreur n'est envoyée et les deux appels notifient l'ouverture du fichier.
- Décision à prendre : confirmer si plusieurs sorties statiques de même nom sont autorisées ; sinon, appliquer une validation de nom comparable à celle des sections de build.

## Cache HTTP partagé entre HTML brut et HTML injecté

- Reproduction automatisée : `http-origin-etag-variant-round266.test.mjs` demande le même HTML avec puis sans en-tête `Origin`. Les corps diffèrent par le script live reload, mais les réponses partagent le même ETag et n'annoncent pas `Vary: Origin`. Les requêtes conditionnelles croisées dans les deux sens reçoivent 304 sans la variante demandée.
- Décision à prendre : distinguer les validateurs des deux représentations, annoncer la variation selon `Origin`, ou désactiver la validation conditionnelle pour le HTML injecté.

## Nom de section statique composé uniquement d'espaces

- Reproduction automatisée : `add-config-static-blank-name-round265.test.mjs` compare une réponse vide, qui annule l'ajout, et une réponse de trois espaces, qui crée une section statique nommée `   ` et notifie l'ouverture du fichier.
- Décision à prendre : confirmer si les noms statiques sans caractère visible sont autorisés ; sinon, valider la valeur après suppression des espaces périphériques.

## Export statique bloqué quand un dossier source devient un fichier

- Reproduction automatisée : `static-directory-to-file-recovery-round259.test.mjs` exporte `asset/old.bin`, remplace le dossier source `asset` par un fichier binaire du même nom, puis relance l'export. L'ancienne copie `old.bin` est supprimée, mais le dossier de sortie `asset` reste en place : la copie échoue et le rechargement HTTP n'est pas déclenché. Après suppression manuelle de ce dossier de sortie, la même instance exporte le nouveau fichier et le nettoie correctement lorsque sa source disparaît.

## Export statique en deux passes quand un fichier source devient un dossier

- Reproduction automatisée : `static-file-to-directory-recovery-round262.test.mjs` exporte le fichier `asset`, puis le remplace par un dossier `asset/new.bin`. Le premier export tente de créer `output/asset` alors que l'ancienne copie y est encore un fichier : la copie échoue. Le nettoyage en fin de passe retire ce fichier et un second export réussit sans autre modification de la source.
- Décision à prendre : faut-il refaire la copie dans la même passe après le nettoyage des anciennes sorties, afin que le changement de type soit publié dès le premier export ?
- Cause : l'export nettoie les fichiers suivis dans `exportedBySource` sans retirer leurs dossiers vides avant de copier une nouvelle source au chemin parent.
- Décision à prendre : déterminer si l'export doit retirer ses dossiers vides après suppression des copies possédées, afin de permettre cette transition sans intervention manuelle.

## Expressions HTML entre apostrophes conservées comme littéraux

- Reproduction automatisée : `html-attribute-quote-revisions-round261.test.mjs` parse `:title='item.name'`, puis `:title="item.label"` dans la même vue révisée. La première injection contient `'item.name'` avec ses apostrophes, la seconde contient `item.label` sans guillemets, alors que les plages source couvrent correctement les deux attributs.
- Décision à prendre : confirmer si les apostrophes doivent être retirées comme les guillemets doubles pour interpréter l'expression dynamique, puis harmoniser le parseur et la compilation si nécessaire.

## Réponse Store 401 ancienne qui efface une nouvelle session

- Reproduction automatisée : `store-stale-unauthorized-round266.test.mjs` lance une publication avec le token d'Alice, connecte Bob avec succès, puis reçoit le HTTP 401 de l'ancienne publication. La session de Bob est effacée bien que sa connexion ait été confirmée avant cette réponse.
- Une ancienne tentative de connexion elle-même peut avoir le même effet : `store-stale-login-unauthorized-round269.test.mjs` connecte Bob pendant que la réponse du login d'Alice attend ; le 401 tardif du login d'Alice efface la session de Bob, malgré la vérification de révision dans `connect()`.
- Décision à prendre : confirmer si une réponse non autorisée doit invalider uniquement la session ayant émis la requête ; dans ce cas, comparer le token ou une révision de session avant de vider les identifiants.

## Réponse Store 403 ancienne qui déconnecte une nouvelle session

- Reproduction automatisée : `store-stale-forbidden-round267.test.mjs` lance une publication avec le token d'Alice, connecte Bob avec succès, puis reçoit HTTP 403 pour l'ancienne publication. Le serveur envoie alors `/logout` avec le token de Bob et efface sa session locale.
- La même course existe entre deux connexions : `store-stale-login-forbidden-round274.test.mjs` reçoit le 403 de l'ancien login d'Alice après le succès du login de Bob ; `/logout` utilise le nouveau token et vide sa session.
- Décision à prendre : confirmer si un refus de publication doit déconnecter uniquement la session ayant émis la requête ; dans ce cas, vérifier son token ou sa révision avant le logout.

## Échec synchrone d'un build qui interrompt le lancement du lot

- Reproduction automatisée : `project-build-all-sync-failure-round268.test.mjs` fait lever immédiatement `build()` sur le premier build. `Project.buildAll()` rejette avant de lancer le second build et la sortie statique, tandis qu'une relance après disparition de l'erreur lance les trois travaux.
- Variante : `project-static-sync-failure-round273.test.mjs` lance deux builds, puis un échec synchrone de la première sortie statique empêche le lancement de la seconde ; le build asynchrone déjà lancé continue et la relance démarre toutes les sorties.
- Décision à prendre : confirmer si un échec de préparation synchrone doit empêcher les autres travaux du lot, ou si chaque lancement doit être isolé afin de tenter les autres builds et sorties statiques comme lors d'un rejet asynchrone.

## En-tête d'un package Store sans saut de ligne final

- Reproduction automatisée : `dependency-store-header-newline-round278.test.mjs` vérifie que `DependencyManager.readFirstLine()` rend l'en-tête complet quand il est suivi d'un saut de ligne, mais en retire le dernier caractère lorsque le fichier se termine directement après l'en-tête. Un en-tête `// Widget:1.2.3` devient alors `// Widget:1.2.` et la validation du package téléchargé échoue.
- Décision à prendre : accepter les packages dont l'en-tête est aussi la dernière ligne, puis préserver tous ses caractères à la fin du flux.

## Formatage i18n JSONC avec virgules finales

- Reproduction automatisée : `i18n-jsonc-trailing-comma-revisions-round281.test.mjs` soumet un fichier commenté en CRLF avec virgules finales dans les objets de traduction. Le formateur ne propose aucune édition. Après retrait des virgules finales, il trie les clés et locales sur deux révisions en préservant les commentaires.
- Décision à prendre : confirmer si les virgules finales sont admises dans les fichiers i18n commentés ; si oui, permettre leur formatage comme pour les autres formes JSONC acceptées.

## Destination de fusion créée pendant le renommage des références

- Reproduction automatisée : `component-merge-destination-race-round281.test.mjs` suspend `ProjectManager.onRename()`, crée `Card.wc.avt` pendant cette attente, puis laisse la fusion continuer. Le nouveau fichier est écrasé sans erreur et les sources séparées sont supprimées.
- Cause : `MergeComponent.run()` vérifie l'absence de destination avant l'attente du renommage, puis appelle `writeFileSync()` sans nouvelle vérification.
- Décision à prendre : confirmer qu'une destination apparue pendant l'attente doit être préservée ; si oui, vérifier et créer la destination de façon exclusive avant de supprimer les sources.

## Multiplication de deux couleurs valides

- Reproduction automatisée : `color-info-composition-round290.test.mjs` appelle `ColorInfo.multiply()` avec deux couleurs RGB valides. La méthode extrait `r1`, `g1`, `b1` et `r2`, `g2`, `b2` d'objets qui exposent `r`, `g`, `b` ; elle transmet donc `NaN` à `fromRgb()` et lève `Color values out of bounds`.
- Décision à prendre : confirmer que la multiplication doit produire le produit canal par canal, puis lire les noms de propriétés réellement renvoyés par `toRgb()`.

## Catégories serveur encore ouvertes dans TODO.md

- **Création depuis un template (ligne 479)** : l'URI réécrite par callback diverge encore dans `template-callback-path-round228.test.mjs`. Décider la sortie attendue, puis corriger le code avant de déclarer la génération complète.
- **Import et désinstallation des templates (ligne 480)** : les collisions de destination et les sources modifiées pendant l'import restent à décider avant de clore la catégorie.
- **Conversions de composants (ligne 526)** : `component-merge-destination-race-round281.test.mjs` démontre l'écrasement d'une destination apparue durant l'attente ; `component-merge-reference-error-round248.test.mjs` démontre une édition de référence appliquée avant un échec ultérieur. Choisir les garanties d'atomicité et de préservation de destination, puis les implémenter.
- **Ajout de configuration et formatage (ligne 527)** : `add-config-static-duplicate-round264.test.mjs` démontre deux sorties statiques homonymes acceptées ; `format-stale-edit-race-round256.test.mjs` démontre l'application d'éditions calculées sur une ancienne version. Décider l'unicité des noms et la politique de conflit d'édition avant de valider l'ensemble.
- **Commandes build, npm, Storybook et sortie statique (ligne 540)** : `build-command-unlisted-selection-round213.test.mjs` démontre que les quatre commandes acceptent une cible qui n'était pas dans les choix proposés. Définir si le choix doit être limité à la liste affichée et appliquer ce contrat aux quatre commandes.
- **Exports Sharp/PHP (ligne 541)** : `converter-output-concurrency-round99.test.mjs` démontre que deux échecs laissent l'état client à `compiling`. Définir l'état terminal de chaque export et les conventions de sortie avant de considérer tous les échecs couverts.
- **Manifeste package et Markdown (ligne 561)** : `manifest-package-function-parameters-round240.test.mjs` et `manifest-package-inferred-signatures-round271.test.mjs` montrent la perte des types et valeurs par défaut inférés. Définir ces rendus et les implémenter.
- **Stories et MDX (ligne 562)** : `storybook-description-interpolation-round130.test.mjs` démontre qu'un JSDoc contenant `${name}` devient une interpolation dans la story ; `storybook-alias-default-toggle-round251.test.mjs` montre la perte du JSDoc d'un alias. Échapper le texte utilisateur et définir sa publication avant de clore la génération complète.
