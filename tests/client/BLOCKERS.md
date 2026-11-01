# Cas client en attente de décision

## `setsettings` ne permet pas d'attendre la persistance

`tests/client/settings.test.mjs` bloque volontairement `WorkspaceConfiguration.update` : la promesse de `SetSettings.action` se termine alors que l'écriture n'est pas encore achevée, car l'action n'attend pas `SettingsManager.setSettings`. Décision attendue : préciser si le serveur doit pouvoir savoir que les réglages sont persistés avant de poursuivre et comment lui signaler un échec.

## `AutoLoader` accepte un dossier voisin partageant le préfixe du workspace

`tests/client/auto-loader.test.mjs` place le workspace dans `file:///project` et présente `file:///project-other/snippets.json`. Le test montre que `register()` affiche quand même le prompt et enregistre `.-other/snippets.json`, car l'appartenance est vérifiée avec `startsWith(workspaceUri)` sans frontière de chemin. Décision attendue : confirmer que seuls les fichiers réellement contenus dans le workspace doivent être proposés, puis définir la comparaison URI adaptée.

Le même test retient deux appels concurrents à `register()` pour le même manifeste avant que les prompts répondent. Deux prompts s'ouvrent et le chemin est ajouté deux fois à `html.customData`. Décision attendue : préciser si les demandes simultanées doivent être regroupées par URI et comment éviter les doublons à l'écriture.

## L'aperçu ne trouve pas son fichier HTML

`tests/client/preview-view.test.mjs` appelle `AventusPeview.getPreview` avec l'arborescence réelle de l'extension. Le panneau est créé, puis la lecture de `client/views/preview/index.html` échoue avec `ENOENT` : ce dossier n'existe pas. L'URI du script fournie à `getPreview` n'est pas utilisée non plus. Décision attendue : préciser si cette vue est toujours prise en charge et, si oui, fournir son HTML et le passage du script à prévisualiser.

## La vue des dépendances ignore l'URI et utilise des ressources à la racine

`tests/client/dependencies-view.test.mjs` charge le vrai `client/views/configuration/index.html`. `AventusDependenciesView.getView(context, uri)` n'utilise pas l'URI fournie. Les liens webview avec nonce et CSP sont dans un commentaire HTML ; les balises actives chargent `/js/index.js` et `/css/index.css` depuis la racine, sans URI webview. Décision attendue : préciser comment la vue doit recevoir la configuration et charger ses ressources dans VS Code.

`tests/client/file-command-middleware.test.mjs` montre que `ShowDependencies.middleware` renvoie simplement ses arguments. Le code qui ouvrirait `AventusDependenciesView` est commenté ; cette commande ne crée donc aucun panneau côté client. Décision attendue : préciser si la vue doit être ouverte par cette commande ou si la commande est destinée uniquement au serveur.

## L'installation acceptée de `db-query` n'est pas attendue

`tests/client/migration-process.test.mjs` simule l'acceptation de l'installation lorsque `db-query` manque. `showLoadingMessage` déclenche la commande `dotnet tool install`, puis `executeDbQuery` vérifie immédiatement de nouveau la présence de `db-query` et rejette avant la fin de l'installation. Le test observe ensuite l'outil devenu disponible. Décision attendue : préciser si la requête doit attendre l'installation et reprendre automatiquement, et comment signaler un refus ou un échec d'installation.

## URI explicite et position de l'éditeur actif peuvent diverger

`tests/client/webcomponent-commands.test.mjs` montre que les middlewares `CreateProperty`, `CreateAttribute`, `CreateWatch`, `CreateCSSVariable`, `ImportViewMethod` et `ImportViewElement` transmettent une URI explicite différente de celle de l'éditeur actif, mais calculent l'offset avec le document et la sélection actifs. Le serveur reçoit donc potentiellement une position qui ne correspond pas au fichier demandé. Décision attendue : préciser si l'URI explicite doit être autorisée dans ce cas et, si oui, comment obtenir une position cohérente.

## Les réglages invalides remplacent les valeurs par défaut

`tests/client/settings.test.mjs` montre que `liveserver: null`, `readDirs: "src"` et `html.customData: null` sont conservés tels quels par `mergeDeep`, malgré les types attendus. Un changement ultérieur vers une configuration vide restaure les valeurs par défaut. Décision attendue : préciser si ces valeurs doivent être rejetées, ignorées ou normalisées avant utilisation par les autres composants.

## Les compilations Aventus et Sharp partagent le même statut

`tests/client/misc-notifications.test.mjs` reproduit l'interleaving : une compilation Aventus réussie est remplacée par la progression Sharp, une erreur Aventus reprend l'affichage, puis le succès Sharp masque cette erreur. `tests/client/component-status.test.mjs` confirme le masquage avec le vrai composant de barre d'état. Un appel ultérieur à `Compiled.render()` réaffiche l'erreur Aventus. Les deux producteurs écrivent directement dans `setLastCompiledInfo` sans arbitrage commun. Décision attendue : préciser la priorité et la durée de vie de chaque statut lorsque les compilations se chevauchent.

## Une écriture Emmet échouée ne se réessaie pas

`tests/client/settings-emmet.test.mjs` simule un échec de `settingsEmmet.update`. `applyDefault` absorbe l'erreur après avoir modifié `extensionsPath` en mémoire. Un appel suivant retrouve déjà le nouveau chemin et ne retente pas l'écriture persistante. Décision attendue : préciser si l'extension doit réessayer la sauvegarde et comment signaler cet échec.

## Les callbacks de réglages ne peuvent pas être retirés

`tests/client/settings.test.mjs` vérifie qu'un callback enregistré par `onSettingsChange` reste appelé lors de changements ultérieurs. Cette méthode et `onSettingsChangeHtml` ne renvoient aucun `Disposable` et n'exposent pas de méthode de retrait. Un consommateur temporaire conserve donc son callback pour la durée de vie du singleton. Décision attendue : définir la durée de vie de ces callbacks et, si nécessaire, une API de désabonnement.

## `sendWithResponse` ne traite pas la réponse du webview

`tests/client/communication.test.mjs` reproduit le cas : après `sendWithResponse({ channel: 'status', uid: 'same', timeout: 15 })`, le webview répond avec le même canal et UID. `onMessage` ne consulte jamais `waitingList`, donc la promesse attend jusqu'au timeout et renvoie `null`. Sans timeout explicite, elle reste pendante. Décision attendue : confirmer que les réponses doivent résoudre cette promesse et définir le comportement pour un canal ou UID inattendu avant une correction séparée du code source.

## L'éditeur DB conserve ses abonnements après fermeture du panneau

`tests/client/editors-change.test.mjs` reproduit le cas : après `resolveCustomTextEditor`, le panneau est fermé puis une modification et une sauvegarde du même document sont émises. L'ancien webview reçoit encore `is_dirty` et `update_content`. Les abonnements `workspace.onDidChangeTextDocument` et `workspace.onDidSaveTextDocument` sont créés sans conserver ni disposer les `Disposable` lors de `panel.onDidDispose`. Le même schéma existe dans l'éditeur i18n. Décision attendue : confirmer la durée de vie souhaitée des abonnements et leur nettoyage par panneau.

Le test de réouverture i18n montre aussi que deux générations du panneau reçoivent la même modification après fermeture de la première. Les deux abonnements de changement et les deux abonnements de sauvegarde restent enregistrés ; chaque nouvelle ouverture peut donc multiplier les notifications et conserver un ancien webview.

## Le watcher de fichiers conserve l'écouteur de renommage après `stop()`

`tests/client/file-system.test.mjs` reproduit le cas : `FileSystem.stop()` dispose le watcher, mais le `Disposable` retourné par `workspace.onWillRenameFiles` n'est pas conservé. Une notification de renommage après `stop()` invoque encore `Rename.execute`. Décision attendue : confirmer si `stop()` doit aussi retirer cet écouteur et annuler les notifications différées.

`tests/client/file-system-host.test.mjs` confirme le même effet avec la vraie classe `Rename` et un hôte VS Code simulé : après `stop()`, l'événement envoie encore `aventus.rename` avec les deux URI.

Le même fichier de test montre qu'un `FileCreated` déjà placé dans la pile est encore envoyé quand le timer se déclenche après `stop()`. `triggerTimer()` ne conserve pas le handle de `setTimeout`, donc `stop()` ne peut pas l'annuler actuellement. Décision attendue : confirmer que l'arrêt doit empêcher ces envois tardifs.

## `Client.stop()` laisse actifs des abonnements créés par `init()`

`tests/client/lifecycle.test.mjs` reproduit le cas : `Client.init()` enregistre une commande interne et un callback `workspace.onDidChangeConfiguration` sans conserver leurs `Disposable` dans `context.subscriptions` ni les libérer dans `stop()`. Après `stop()`, un changement de configuration appelle encore `ReloadSettings.execute`. Décision attendue : définir la durée de vie de ces enregistrements et leur nettoyage explicite lors de l'arrêt ou de la désactivation de l'extension.

Le même test simule aussi un abonnement LSP retourné par `onNotification` : son handle n'est pas conservé ni disposé par `Client.stop()`, et le callback reste invocable après l'arrêt dans cet hôte simulé. Il faut préciser si `LanguageClient.stop()` garantit lui-même cette libération ; sinon le client doit conserver les handles de notification.

## Le retrait du dernier build ne rafraîchit pas le statut

`tests/client/compiled-status.test.mjs` reproduit le cas : après une compilation, `Compiled.removeBuild('web')` vide le registre, mais n'appelle pas `render()`. L'indicateur `runningServer` reste visible et le statut de dernière compilation reste affiché ; un appel manuel à `render()` les efface. Décision attendue : confirmer le statut attendu après le retrait du dernier build.

## La migration supprime le nouveau mot de passe au lieu de l'ancien

`tests/client/migration-databases.test.mjs` reproduit le cas dans un dossier temporaire : `setDatabases` enregistre `db_pass_new` pour une connexion de remplacement, puis supprime immédiatement ce même secret. L'ancien `db_pass_old` reste stocké. La boucle de suppression parcourt `data[type]` au lieu des entrées restantes de `old[type]`. Le fichier JSON ne contient pas le mot de passe en clair, mais la nouvelle connexion ne peut plus le relire. Décision attendue : confirmer la politique de conservation des secrets lors des remplacements et suppressions.

## Les callbacks d'initialisation restent enregistrés après `initDone()`

`tests/client/lifecycle.test.mjs` reproduit le cas : un callback transmis à `onInit` avant `initDone()` est appelé une première fois, puis encore lors d'un second appel à `initDone()`. `initCbs` n'est jamais vidé. Décision attendue : confirmer si `initDone()` peut se répéter et si les callbacks doivent être exécutés une seule fois.

## Un second `startFileSystem()` abandonne le watcher précédent

`tests/client/lifecycle.test.mjs` reproduit le cas : deux appels à `Client.startFileSystem()` créent deux instances de `FileSystem` sans arrêter la première ; `Client.stop()` arrête uniquement la seconde. Une notification `InitStep` répétée peut déclencher ce chemin. Décision attendue : préciser si l'initialisation est idempotente et comment libérer l'ancien watcher.

## Compatibilité de la migration avec le vrai processus `db-query`

`tests/client/migration-real-process.test.mjs` exécute le `db-query` installé avec SQLite en mémoire. `SELECT 1 as result` renvoie `{ result: "1" }` ; la vraie route `testConnection` renvoie bien `true`, car elle compare `result[0].result == 1` et accepte la chaîne par coercition. Décision attendue : préciser le type contractuel et choisir une validation explicite pour ce résultat.

Une requête invalide renvoie une entrée `Errors` structurée contenant notamment `Message`, mais `executeDbQuery` fait `result.Errors.join(",")` et rejette avec `[object Object]`. Le détail SQL utile est perdu. Décision attendue : définir le format d'erreur attendu et extraire le message du processus avant de figer les assertions.

