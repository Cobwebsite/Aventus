# Cas client en attente de décision

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

