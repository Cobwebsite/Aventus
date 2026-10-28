# Cas serveur en attente de changement de code

Ce fichier conserve les cas reproductibles rencontrés pendant l'écriture des tests. Les changements de `server/src` pour ces points sont décidés avec l'utilisateur, un par un.

## Note hors périmètre des tests serveur

- `client/src/cmds/Rename.ts` transmet `item.oldUri` dans le champ `newUri` de la commande `aventus.rename`. À traiter plus tard avec les tests du client VS Code ; ne pas modifier le client pendant cette passe.

## Renommage de fichiers hors TypeScript : aucune édition de références

- Reproduction automatisée : `project-rename-non-ts-round194.test.mjs` transmet aux deux projets des déplacements de vues, styles, fichiers SCSS, HTML et JSON. Aucun ne produit d'édition ni n'appelle le service de renommage TypeScript ; un fichier `.lib.avt` placé après un style dans le même lot produit bien les éditions attendues.
- Source : `Build.onRename()` ne traite que les cinq extensions TypeScript Aventus et retourne un résultat vide pour les autres fichiers.
- Décision à prendre : préciser quelles références de vues et de styles doivent être actualisées lors d'un déplacement, puis ajouter des cas réels avant de modifier le routage du renommage.

## Fusion de composant partiellement appliquée après échec d'une édition de référence

- Résolu : la fusion réserve la destination de façon exclusive, restaure les références et les sources si une étape échoue, puis ne notifie la fermeture/ouverture qu'après la réussite.
- Régression automatisée : `component-merge-reference-error-round248.test.mjs` fait échouer la seconde édition de référence et vérifie que la première est restaurée, que les sources restent présentes et qu'aucune notification n'est envoyée. `component-merge-destination-race-round281.test.mjs` vérifie que la destination apparue pendant l'attente est préservée.
- Décision prise : restaurer les modifications de la fusion en cas d'échec et préserver toute destination concurrente.

## Storybook : description et valeur initiale d'une variable absentes

- Résolu côté serveur : la description JSDoc et la valeur initiale, sous forme de texte source, sont transmises dans la story. Leur rendu est confié à `@aventusjs/storybook-render` 0.0.5 une fois publié.
- Régression automatisée : `storybook-variable-revisions-round249.test.mjs` vérifie ces informations sur trois révisions, ainsi que le type et `noDefaultStory`.

## Corps injecté hors de la plage HTTP annoncée

- Résolu : les requêtes avec `Range` servent les octets du fichier brut, sans injection. Les réponses HTML entières conservent l'injection.
- Régression automatisée : `http-range-injection-round249.test.mjs` vérifie les plages avec et sans `Origin`, ainsi qu'une réponse entière injectée.
## Import de plusieurs sources vers le même dossier d'installation

- Résolu : une collision entre deux sélections du même import annule le lot avant toute copie et signale les deux sources et le dossier commun. Une sélection unique peut toujours remplacer une installation existante.
- Régression automatisée : `template-import-same-destination-round250.test.mjs` vérifie les imports de projets et de templates, l'absence de copie et l'absence de rechargement.

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

- **Import et désinstallation des templates (ligne 480)** : les collisions de destination et les sources modifiées pendant l'import restent à décider avant de clore la catégorie.
- **Conversions de composants (ligne 526)** : `component-merge-destination-race-round281.test.mjs` démontre l'écrasement d'une destination apparue durant l'attente ; `component-merge-reference-error-round248.test.mjs` démontre une édition de référence appliquée avant un échec ultérieur. Choisir les garanties d'atomicité et de préservation de destination, puis les implémenter.
- **Ajout de configuration et formatage (ligne 527)** : `add-config-static-duplicate-round264.test.mjs` démontre deux sorties statiques homonymes acceptées ; `format-stale-edit-race-round256.test.mjs` démontre l'application d'éditions calculées sur une ancienne version. Décider l'unicité des noms et la politique de conflit d'édition avant de valider l'ensemble.
- **Commandes build, npm, Storybook et sortie statique (ligne 540)** : `build-command-unlisted-selection-round213.test.mjs` démontre que les quatre commandes acceptent une cible qui n'était pas dans les choix proposés. Définir si le choix doit être limité à la liste affichée et appliquer ce contrat aux quatre commandes.
- **Exports Sharp/PHP (ligne 541)** : `converter-output-concurrency-round99.test.mjs` démontre que deux échecs laissent l'état client à `compiling`. Définir l'état terminal de chaque export et les conventions de sortie avant de considérer tous les échecs couverts.
- **Stories et MDX (ligne 562)** : `storybook-description-interpolation-round130.test.mjs` démontre qu'un JSDoc contenant `${name}` devient une interpolation dans la story ; `storybook-alias-default-toggle-round251.test.mjs` montre la perte du JSDoc d'un alias. Échapper le texte utilisateur et définir sa publication avant de clore la génération complète.
