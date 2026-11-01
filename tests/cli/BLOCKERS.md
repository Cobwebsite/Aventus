# Cas CLI en attente de décision

## Un second démarrage du serveur CLI ne se résout pas

`tests/cli/real-server-lifecycle.test.mjs` reproduit le cas : le premier `RealServer.start()` se résout après `RealServer.started()`, mais un second `start({ noStart: true })` sur la même instance laisse sa promesse en attente. Le corps de la promesse ne traite que `if (!this.server)` et n'a pas de branche lorsque le serveur existe déjà. Décision attendue : définir si les commandes doivent pouvoir réutiliser la même instance de serveur et, dans ce cas, le résultat du second démarrage.

Le même test montre qu'une exception pendant `GenericServer.start()` est journalisée dans le `catch` sans rejeter ni résoudre la promesse. Le demandeur reste donc en attente. Décision attendue : définir la propagation de cette erreur et le nettoyage de l'instance partiellement créée.

