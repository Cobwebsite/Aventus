# Tests du serveur

- Exécuter les tests sous `tests/server` hors sandbox dès le premier lancement (`sandbox_permissions: "require_escalated"`). Ils utilisent des sockets locaux et des opérations Windows sur des dossiers temporaires qui échouent dans le sandbox avec `EACCES` ou `EPERM`.
- Demander une autorisation ciblée pour la commande de test si aucune règle existante ne la couvre. Ne pas désactiver globalement le sandbox.
- Indiquer clairement si un résultat de test provient du sandbox ou d'une exécution hors sandbox.
