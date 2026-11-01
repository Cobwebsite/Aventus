# Plan de tests du client VS Code

Cocher uniquement après vérification automatisée. Couvrir le cas nominal, les entrées invalides et les transitions ou le nettoyage lorsqu'ils s'appliquent. Simuler l'API VS Code et le serveur de langage ; vérifier la libération des abonnements et des ressources.

## Couverture déjà en place

- [x] Utilitaires : conversion chemins/URI, nonce et canal de journalisation créé à la demande (`tool.test.mjs`).
- [x] Registres des notifications : dédoublonnage et recréation des builds, remplacement et retrait des données/statiques, isolation entre configurations (`registries.test.mjs`).
- [x] Progression : démarrage de deux identifiants, arrêt indépendant et arrêt d'un identifiant inconnu (`progress.test.mjs`).
- [x] Réglages : fusion des valeurs par défaut, rechargement et callbacks après changement, cible globale ou espace de travail lors d'une écriture (`settings.test.mjs`).
- [x] Réglages : plusieurs changements reconstruisent les valeurs par défaut ; les callbacks restent enregistrés pour la durée de vie du singleton (`settings.test.mjs`).
- [x] Réglages invalides : valeurs nulles ou de mauvais type transmises telles quelles, puis retour aux valeurs par défaut au changement suivant (`settings.test.mjs`, décision dans `BLOCKERS.md`).
- [x] Notification `setsettings` : transfert des valeurs et attente de la persistance asynchrone côté client (`settings.test.mjs`).
- [x] Emmet en production : retrait d'un ancien chemin Aventus, ajout du chemin courant et absence de doublon lors d'un nouvel appel (`settings-emmet.test.mjs`).
- [x] Emmet en production : échec d'écriture signalé à l'utilisateur ; le chemin en mémoire reste modifié (`settings-emmet.test.mjs`).
- [x] Statut du serveur HTTP : transition démarrage, adresse affichée et retour à la commande de démarrage après arrêt (`live-server-status.test.mjs`).
- [x] Statut HTTP : deux démarrages remplacent l'adresse et deux arrêts laissent le même état inactif (`live-server-status.test.mjs`).
- [x] Migration DB : lecture du secret, persistance sans mot de passe en clair et suppression de l'ancien secret lors du remplacement (`migration-databases.test.mjs`).
- [x] Migration DB : test de connexion et schéma avec succès/échec simulés, choix/annulation du dossier et écriture d'un fichier temporaire (`migration-databases.test.mjs`).
- [x] Migration DB : remplacement simultané dans source et target, suppression des anciens secrets, conservation des nouveaux et rejet d'une écriture dans un dossier absent (`migration-databases.test.mjs`).
- [x] Processus `db-query` simulé : payload JSON, réponse réussie, erreur applicative, code d'échec, JSON invalide, outils absents et installation acceptée non attendue (`migration-process.test.mjs`, décision dans `BLOCKERS.md`).
- [x] Processus `db-query` réel avec SQLite en mémoire : requête réussie et requête invalide, route `testConnection` validée ; valeur numérique retournée en chaîne et détail d'erreur perdu (`migration-real-process.test.mjs`, décision dans `BLOCKERS.md`).
- [x] Interactions utilisateur : sélection simple/multiple, annulation, popup et validations de saisie avec réponse au serveur (`prompts.test.mjs`).
- [x] Aller-retour des prompts : notifications de saisie, sélection et popup jusqu'aux vraies commandes de réponse, y compris annulation (`prompt-roundtrip.test.mjs`).
- [x] Notifications de fichiers : ouverture et fermeture d'éditeur, groupes d'éditions successifs, ajout et retrait de fichier de débogage (`file-notifications.test.mjs`).
- [x] Communication webview : paramètres de route, réponse aux messages entrants, retrait de route et résolution des réponses sortantes par canal et UID (`communication.test.mjs`).
- [x] Éditeurs i18n/DB : tri et formatage des modifications, remplacement du document et absence d'écriture lorsque le schéma DB est inchangé (`editors-change.test.mjs`).
- [x] Éditeur DB : routes webview de lecture, sauvegarde et modification, puis suppression de l'écho local et mise à jour externe (`editors-change.test.mjs`).
- [x] Éditeur i18n : initialisation filtrée, contenu/locales, sauvegarde et traduction sans clé API (`editors-change.test.mjs`).
- [x] Éditeur i18n : sauvegarde globale de clé API, modification locale puis externe, traduction simulée avec succès/échec et nettoyage des événements à la fermeture du panneau (`editors-change.test.mjs`).
- [x] Rendu HTML réel des éditeurs i18n/DB : résolution des chemins webview, nonce et source CSP dans les fichiers `index.html` (`editors-change.test.mjs`).
- [x] Vue des dépendances : création du panneau et rendu HTML réel ; URI de configuration ignorée et ressources actives en chemins absolus (`dependencies-view.test.mjs`, décision dans `BLOCKERS.md`).
- [x] Commande `ShowDependencies` : middleware qui transmet seulement les arguments ; la vue client a été supprimée (`file-command-middleware.test.mjs`).
- [x] Aperçu : création du panneau puis échec ENOENT dû au fichier HTML absent (`preview-view.test.mjs`, décision dans `BLOCKERS.md`).
- [x] Panneau i18n : fermeture ciblée par URI et réouverture du même document (`editors-change.test.mjs`).
- [x] Panneau i18n réouvert : seul le nouveau webview reçoit la modification du document et une seule paire d'abonnements reste active (`editors-change.test.mjs`).
- [x] Éditeur DB : événements de document encore envoyés après fermeture du panneau (`editors-change.test.mjs`, décision dans `BLOCKERS.md`).
- [x] Watcher VS Code : transitions création/modification/suppression, notifications regroupées et écouteur de renommage libéré par `stop()` (`file-system.test.mjs`).
- [x] Watcher VS Code : rafale de plusieurs chemins, fichier ignoré et notification différée annulée par `stop()` (`file-system.test.mjs`).
- [x] `AutoLoader` : acceptation HTML/Emmet sans doublon, refus mémorisé et rechargement après changement de configuration (`auto-loader.test.mjs`).
- [x] `AutoLoader` : un dossier frère partageant le préfixe du workspace est traité comme interne (`auto-loader.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `AutoLoader` : deux événements concurrents ouvrent deux prompts et enregistrent deux fois le même manifeste (`auto-loader.test.mjs`, décision dans `BLOCKERS.md`).
- [x] Parcours intégré watcher + `AutoLoader` : un manifeste HTML créé est proposé et enregistré, puis un fichier `.avt` est notifié séparément (`file-system-auto-loader.test.mjs`).
- [x] Hôte VS Code simulé avec fichiers temporaires : création, modification, suppression et renommage transmis aux vraies commandes client ; aucun renommage transmis après `stop()` (`file-system-host.test.mjs`).
- [x] URI de téléchargement de template : route et URL valides, routes inapplicables et libération du handler (`protocol-handler.test.mjs`).
- [x] Activation client : fournisseurs, notifications, commande interne et démarrage LSP ; `stop()` ferme le watcher et le LSP et libère la commande et l'écouteur de configuration (`lifecycle.test.mjs`).
- [x] Arrêt client : enregistrement d'une notification LSP libéré par `stop()` dans l'hôte simulé (`lifecycle.test.mjs`).
- [x] Point d'entrée de l'extension : `activate` attend `Client.init` avec le contexte, `deactivate` transmet la promesse de `Client.stop` (`extension-entry.test.mjs`).
- [x] Middleware LSP : transformation et annulation de commande, navigation i18n et mémorisation de la clé ciblée (`lifecycle.test.mjs`).
- [x] Définitions LSP multiples : `Location` et `LocationLink` i18n filtrées, cible non i18n ignorée (`lifecycle.test.mjs`).
- [x] LSP : échec de résolution de code action absorbé, autres échecs délégués ; activation, notification, commande interne et arrêt sur une même instance simulée (`lifecycle.test.mjs`).
- [x] Middleware CodeLens : conversion URI, position et localisations de `editor.action.showReferences`, autres commandes préservées (`lifecycle.test.mjs`).
- [x] Commande interne enregistrée : transmission des arguments au middleware correspondant (`lifecycle.test.mjs`).
- [x] Commandes internes concrètes : débogage sans build, build unique ou choix multiple avec annulation ; Sharp, ouverture du réglage de build, bascule de l'éditeur i18n et migration conditionnée au contexte (`internal-commands.test.mjs`).
- [x] Middlewares webcomponent de création et import de vue : absence d'éditeur, URI et position actives, préremplissage et URI explicite (`webcomponent-commands.test.mjs`, décision dans `BLOCKERS.md`).
- [x] Renommage de fichiers et de composants : conversion des URI, ordre des paires et transmission des arguments ; imports de template/projet sans arguments (`file-command-middleware.test.mjs`).
- [x] Commandes de création, modification et suppression de fichier : transmission de l'URI de `execute` au middleware (`file-command-middleware.test.mjs`).
- [x] Build/export/Store : commandes globales sans arguments, exports ciblés par URI et URL de téléchargement préservée (`file-command-middleware.test.mjs`).
- [x] Initialisation client : attente avant `initDone`, callback immédiat après et exécution unique des callbacks malgré un second `initDone` (`lifecycle.test.mjs`).
- [x] Watcher du client : deux appels à `startFileSystem()` remplacent l'instance sans arrêter la première (`lifecycle.test.mjs`, décision dans `BLOCKERS.md`).
- [x] Statut de compilation : succès, erreur, ouverture des fichiers de débogage et effacement du statut après retrait du dernier build (`compiled-status.test.mjs`).
- [x] Messages de chargement : deux opérations indépendantes, arrêt et arrêt reçu avant le démarrage (`loading-message.test.mjs`).
- [x] Fournisseur de fichiers de débogage : ajout, remplacement, isolation et retrait de contenu virtuel (`debug-file.test.mjs`).
- [x] Barre d'état : création, commande HTTP, désactivation du build IDE et restauration des détails de compilation (`component-status.test.mjs`).
- [x] Parcours intégré `Compiled` + barre d'état réelle : erreur, correction et retrait du dernier build après rendu (`component-status.test.mjs`).
- [x] Parcours intégré HTTP + barre d'état réelle : démarrage avec adresse puis retour à la commande de démarrage après arrêt (`component-status.test.mjs`).
- [x] Même instance `Client` et vraie barre d'état : notifications LSP successives de compilation et HTTP, arrêt et abonnements LSP libérés (`notification-lifecycle.test.mjs`).
- [x] `InitStep` : message initial, notification de fin, démarrage du watcher et rendu différé du statut (`init-step.test.mjs`).
- [x] Notifications complémentaires : progression Sharp, erreur, ouverture du debug, succès, progression partielle et aperçu conditionné au contexte (`misc-notifications.test.mjs`).
- [x] Statut partagé : les notifications de compilation Aventus et Sharp écrasent le même affichage dans leur ordre d'arrivée (`misc-notifications.test.mjs`, décision dans `BLOCKERS.md`).
- [x] Statut partagé avec le vrai composant : le succès Sharp masque une erreur Aventus jusqu'au prochain `Compiled.render()` (`component-status.test.mjs`, décision dans `BLOCKERS.md`).
## Après analyse des blocages

Ces parcours restent à préciser ou à débloquer dans `BLOCKERS.md` avant de figer leurs résultats attendus.

- [ ] Activation/désactivation avec hôte VS Code simulé : cycle complet des éditeurs et webviews, puis vérification des abonnements ; décisions de nettoyage dans `BLOCKERS.md`.
- [ ] Réglages : validation des configurations et retrait des callbacks selon les décisions dans `BLOCKERS.md`.
- [ ] Autres middlewares de refactorisation et de création qui modifient des fichiers ; cohérence de l'URI explicite selon `BLOCKERS.md`.
- [ ] Système de fichiers : annulation des notifications différées après fermeture selon la décision dans `BLOCKERS.md`.
- [ ] Éditeurs i18n/DB : cycle complet des panneaux avec hôte VS Code simulé ; nettoyage selon `BLOCKERS.md`.
- [ ] Migration : installation de l'outil et politique des secrets selon les décisions dans `BLOCKERS.md` ; revalider le contrat de type de `testConnection` après décision.
- [ ] Parcours intégré avec hôte VS Code simulé : associer les notifications aux éditeurs/webviews, puis vérifier leur état et leurs ressources après désactivation selon `BLOCKERS.md`.
- [ ] Aperçu fonctionnel après décision sur la ressource HTML manquante dans `BLOCKERS.md`.

