# Cas CLI en attente de décision

## Une erreur de démarrage du serveur CLI laisse le demandeur en attente

Le même test montre qu'une exception pendant `GenericServer.start()` est journalisée dans le `catch` sans rejeter ni résoudre la promesse. Le demandeur reste donc en attente. Décision attendue : définir la propagation de cette erreur et le nettoyage de l'instance partiellement créée.

