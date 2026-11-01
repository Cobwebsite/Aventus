# Cas client en attente de décision

## Compatibilité de la migration avec le vrai processus `db-query`

`tests/client/migration-real-process.test.mjs` exécute le `db-query` installé avec SQLite en mémoire. `SELECT 1 as result` renvoie `{ result: "1" }` ; la vraie route `testConnection` renvoie bien `true`, car elle compare `result[0].result == 1` et accepte la chaîne par coercition. Décision attendue : préciser le type contractuel et choisir une validation explicite pour ce résultat.

Une requête invalide renvoie une entrée `Errors` structurée contenant notamment `Message`, mais `executeDbQuery` fait `result.Errors.join(",")` et rejette avec `[object Object]`. Le détail SQL utile est perdu. Décision attendue : définir le format d'erreur attendu et extraire le message du processus avant de figer les assertions.

