# Cas serveur en attente de changement de code

Ce fichier conserve les cas reproductibles rencontrés pendant l'écriture des tests. Les changements de `server/src` pour ces points sont décidés avec l'utilisateur, un par un.

## Note hors périmètre des tests serveur

- `client/src/cmds/Rename.ts` transmet `item.oldUri` dans le champ `newUri` de la commande `aventus.rename`. À traiter plus tard avec les tests du client VS Code ; ne pas modifier le client pendant cette passe.

## Renommage de fichiers hors TypeScript : aucune édition de références

- Reproduction automatisée : `project-rename-non-ts-round194.test.mjs` transmet aux deux projets des déplacements de vues, styles, fichiers SCSS, HTML et JSON. Aucun ne produit d'édition ni n'appelle le service de renommage TypeScript ; un fichier `.lib.avt` placé après un style dans le même lot produit bien les éditions attendues.
- Source : `Build.onRename()` ne traite que les cinq extensions TypeScript Aventus et retourne un résultat vide pour les autres fichiers.
- Décision à prendre : préciser quelles références de vues et de styles doivent être actualisées lors d'un déplacement, puis ajouter des cas réels avant de modifier le routage du renommage.

## Sauvegarde acceptée sur un fichier déjà supprimé pendant l'arrêt

- Reproduction automatisée : `files-delete-reregister-round133.test.mjs` suspend un callback de suppression lancé par `FilesManager.onShutdown()`, puis appelle `onSave()` pour le même URI. Le callback de sauvegarde s'exécute alors que `file.isDeleted` vaut `true`, avant le retrait final du cache.
- Cause : `onShutdown()` laisse l'entrée en cache pendant le callback et `triggerSave()` ne vérifie pas l'état `deleted`.
- Décision à prendre : préciser si les notifications reçues pendant l'arrêt doivent être ignorées ou attendre sa fin ; éviter qu'une sauvegarde traite une instance déjà supprimée.

## Noms de locale i18n hérités des prototypes JavaScript

- Reproduction automatisée : `i18n-reserved-locales-round133.test.mjs` configure une locale `constructor` absente du JSON. La validation ne la signale pas, mais l'action l'insère ; une édition qui l'ajoute permet ensuite son export. Une locale `__proto__` présente dans le JSON disparaît de l'analyse et de l'export, et la validation signale à tort `Can't parse the json`. Une édition vers `fr` remplace cette erreur par `Locale not needed`.
- Cause : le parseur, la validation et l'export utilisent des objets `{}` et consultent les noms de locale avec un simple accès de propriété ; l'action lit directement les propriétés du JSON. Les noms hérités peuvent donc sembler présents sans propriété propre ; `__proto__` modifie le prototype lors de l'affectation.
- Décision à prendre : accepter ou refuser explicitement ces noms de locale. S'ils sont valides, utiliser des dictionnaires sans prototype et vérifier les propriétés propres dans le diagnostic et l'export pour les aligner sur l'action.

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

## Export i18n périmé pendant une édition JSON invalide

- Reproduction automatisée : `i18n-invalid-export-round148.test.mjs` part d'une traduction `old` valide, édite le fichier en JSON incomplet contenant une nouvelle clé, puis vérifie que `keys` et `exported` conservent l'ancienne traduction pendant que la validation signale une erreur. Une correction valide remplace enfin l'export. Le consommateur du build peut donc lire des traductions périmées pendant une édition invalide. Décision attendue : conserver volontairement le dernier export valide ou vider les exports en cas d'erreur de parsing.

## Réexports TypeScript absents du modèle Aventus

- Reproduction automatisée : `ts-reexports-round148.test.mjs` parse un réexport nommé avec alias et un réexport wildcard, puis remplace le premier par un autre fichier. Dans les deux versions, le modèle ne contient ni objet exporté ni import local pour le symbole exposé, sans diagnostic ; une déclaration directe du même nom est bien indexée. `ParserTs.loadRoot()` ne traite pas les `ExportDeclaration`.
- Décision à prendre : déterminer si les réexports doivent être pris en charge par le modèle Aventus et, dans ce cas, préciser la résolution des alias, des réexports wildcard et des cycles entre fichiers.

## Deux alias directs vers le même package : inclusion dépendante de l'ordre

- Reproduction automatisée : `dependency-duplicate-direct-aliases-round149.test.mjs` configure deux clés directes pointant vers le même fichier package, une avec `include: full`, l'autre avec `include: need`. Le résultat contient une seule instance du package, mais son type d'inclusion est celui de la dernière clé. Inverser l'ordre des propriétés inverse le résultat.
- Cause : `loadDependenciesFromBuild()` stocke l'inclusion par le nom déclaré dans le package et écrase cette valeur à chaque dépendance directe chargée.
- Décision à prendre : définir la priorité attendue quand deux noms de configuration résolvent le même package : refuser le doublon, conserver le premier, choisir l'inclusion la plus forte ou garder la dernière valeur.

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

## Destruction incomplète du projet après échec d'un build

- Reproduction automatisée : `project-destroy-failure-retry-round177.test.mjs` fait échouer `destroy()` du premier build. `Project.destroy()` marque d'abord le projet détruit, puis s'interrompt avant la destruction du second build et de la sortie statique. Un second appel ne nettoie rien : ces deux ressources restent actives.
- Décision à prendre : poursuivre le nettoyage des autres ressources lorsqu'une destruction échoue, puis définir le résultat d'erreur et la possibilité d'une nouvelle tentative.

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

- Reproduction automatisée : `i18n-action-range-round225.test.mjs` demande des actions sur la clé `beta` alors que seule `alpha` manque de la locale `fr`. `Import missing locales` est proposé et insère la traduction dans `alpha`. Après une édition qui complète `alpha` et retire `fr` de `beta`, l'action cible la nouvelle absence même lorsqu'elle est demandée au début du document.
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

## Cache npm après exception du bundler concurrent

- Reproduction automatisée : `npm-concurrent-error-recovery-round242.test.mjs` lance deux appels `NpmBuilder.compile()` sur les mêmes imports. Une exception transitoire d'esbuild rejette les deux appels. Un troisième appel identique renvoie une sortie vide sans relancer esbuild ; un import supplémentaire force une nouvelle compilation réussie.
- Cause : `compileCurrent()` conserve `lastInfo` et `lastInfoToCompile` lorsqu'`esbuildBuild()` rejette avant de renseigner `npmDepBuildTxt`.
- Décision à prendre : invalider ces caches lors d'une exception pour permettre un nouvel essai avec les mêmes imports.

## Export statique récursif quand la destination est dans la source

- Reproduction automatisée : `static-output-inside-input-round244.test.mjs` configure `input/generated` comme destination d'un export dont la source est `input`. Le premier export écrit `generated/data.txt`, le second redécouvre cette copie et écrit `generated/generated/data.txt`. Après suppression de `input/data.txt`, un export suivant écrit encore `generated/generated/generated/data.txt`.
- Cause : `Static.export()` parcourt récursivement tout le dossier source sans exclure ses dossiers de sortie.
- Décision à prendre : refuser une destination située dans la source ou l'exclure de la découverte pour éviter la croissance récursive des sorties.

## Signature incomplète des paramètres de fonction dans le manifeste package

- Reproduction automatisée : `manifest-package-function-parameters-round240.test.mjs` analyse et documente trois révisions de `combine`. `first?: string`, `suffix = "!"` et `...parts: number[]` apparaissent comme `first: string`, `suffix: any` et `parts: number`. Une révision suivante remplace correctement ces noms, mais `...flags: boolean[]` devient `flags: boolean`.
- Cause : `ManifestPackageMd.loadFunction()` reconstruit chaque paramètre avec son nom et le texte de `TypeInfo`, sans traiter le marqueur optionnel, la valeur par défaut ni le token rest ; `TypeInfo.getFullTxt()` réduit les types de tableau dans ce parcours.
- Décision à prendre : définir la représentation attendue des paramètres optionnels, à valeur par défaut et rest dans la documentation, puis préserver aussi le type tableau si la signature doit rester fidèle au TypeScript.

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
