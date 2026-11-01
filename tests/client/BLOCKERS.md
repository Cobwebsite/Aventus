# Cas client en attente de décision

## Les callbacks d'initialisation restent enregistrés après `initDone()`

`tests/client/lifecycle.test.mjs` reproduit le cas : un callback transmis à `onInit` avant `initDone()` est appelé une première fois, puis encore lors d'un second appel à `initDone()`. `initCbs` n'est jamais vidé. Décision attendue : confirmer si `initDone()` peut se répéter et si les callbacks doivent être exécutés une seule fois.

## Un second `startFileSystem()` abandonne le watcher précédent

`tests/client/lifecycle.test.mjs` reproduit le cas : deux appels à `Client.startFileSystem()` créent deux instances de `FileSystem` sans arrêter la première ; `Client.stop()` arrête uniquement la seconde. Une notification `InitStep` répétée peut déclencher ce chemin. Décision attendue : préciser si l'initialisation est idempotente et comment libérer l'ancien watcher.

## Compatibilité de la migration avec le vrai processus `db-query`

`tests/client/migration-real-process.test.mjs` exécute le `db-query` installé avec SQLite en mémoire. `SELECT 1 as result` renvoie `{ result: "1" }` ; la vraie route `testConnection` renvoie bien `true`, car elle compare `result[0].result == 1` et accepte la chaîne par coercition. Décision attendue : préciser le type contractuel et choisir une validation explicite pour ce résultat.

Une requête invalide renvoie une entrée `Errors` structurée contenant notamment `Message`, mais `executeDbQuery` fait `result.Errors.join(",")` et rejette avec `[object Object]`. Le détail SQL utile est perdu. Décision attendue : définir le format d'erreur attendu et extraire le message du processus avant de figer les assertions.

