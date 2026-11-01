# Cas client en attente de décision

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

