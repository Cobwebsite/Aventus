# Plan de tests du client VS Code

Cocher uniquement après vérification automatisée. Couvrir le cas nominal, les entrées invalides et les transitions ou le nettoyage lorsqu'ils s'appliquent. Simuler l'API VS Code et le serveur de langage ; vérifier la libération des abonnements et des ressources.

## Couverture déjà en place

- [x] Utilitaires : conversion chemins/URI, nonce et canal de journalisation créé à la demande (`tool.test.mjs`).
- [x] Registres des notifications : dédoublonnage et recréation des builds, remplacement et retrait des données/statiques, isolation entre configurations (`registries.test.mjs`).
- [x] Progression : démarrage de deux identifiants, arrêt indépendant et arrêt d'un identifiant inconnu (`progress.test.mjs`).
- [x] Réglages : fusion des valeurs par défaut, rechargement et callbacks après changement, cible globale ou espace de travail lors d'une écriture (`settings.test.mjs`).
- [x] Réglages : plusieurs changements reconstruisent les valeurs par défaut ; les callbacks peuvent être retirés et le singleton recréé (`settings.test.mjs`).
- [x] Réglages invalides : valeurs nulles ou de mauvais type remplacées par les valeurs par défaut ; fusion des sous-champs valides (`settings.test.mjs`).
- [x] Notification `setsettings` : transfert des valeurs et attente de la persistance asynchrone côté client (`settings.test.mjs`).
- [x] Emmet en production : retrait d'un ancien chemin Aventus, ajout du chemin courant et absence de doublon lors d'un nouvel appel (`settings-emmet.test.mjs`).
- [x] Emmet en production : échec d'écriture signalé à l'utilisateur ; le chemin en mémoire reste modifié (`settings-emmet.test.mjs`).
- [x] Statut du serveur HTTP : transition démarrage, adresse affichée et retour à la commande de démarrage après arrêt (`live-server-status.test.mjs`).
- [x] Statut HTTP : deux démarrages remplacent l'adresse et deux arrêts laissent le même état inactif (`live-server-status.test.mjs`).
- [x] Migration DB : lecture du secret, persistance sans mot de passe en clair et suppression de l'ancien secret lors du remplacement (`migration-databases.test.mjs`).
- [x] Migration DB : test de connexion et schéma avec succès/échec simulés, choix/annulation du dossier et écriture d'un fichier temporaire (`migration-databases.test.mjs`).
- [x] Migration DB : remplacement simultané dans source et target, suppression des anciens secrets, conservation des nouveaux et rejet d'une écriture dans un dossier absent (`migration-databases.test.mjs`).
- [x] Processus `db-query` simulé : payload JSON, réponse réussie, erreur applicative, code d'échec, JSON invalide, outils absents et installation acceptée ou échouée (`migration-process.test.mjs`).
- [x] Processus `db-query` réel avec SQLite en mémoire : requête réussie et requête invalide, route `testConnection` acceptant explicitement `1` et `"1"`, et détail d'erreur SQL extrait (`migration-real-process.test.mjs`).
- [x] Interactions utilisateur : sélection simple/multiple, annulation, popup et validations de saisie avec réponse au serveur (`prompts.test.mjs`).
- [x] Aller-retour des prompts : notifications de saisie, sélection et popup jusqu'aux vraies commandes de réponse, y compris annulation (`prompt-roundtrip.test.mjs`).
- [x] Notifications de fichiers : ouverture et fermeture d'éditeur, groupes d'éditions successifs, ajout et retrait de fichier de débogage (`file-notifications.test.mjs`).
- [x] Communication webview : paramètres de route, réponse aux messages entrants, retrait de route et résolution des réponses sortantes par canal et UID (`communication.test.mjs`).
- [x] Éditeurs i18n/DB : tri et formatage des modifications, remplacement du document et absence d'écriture lorsque le schéma DB est inchangé (`editors-change.test.mjs`).
- [x] Éditeur DB : routes webview de lecture, sauvegarde et modification, puis suppression de l'écho local et mise à jour externe (`editors-change.test.mjs`).
- [x] Éditeur i18n : initialisation filtrée, contenu/locales, sauvegarde et traduction sans clé API (`editors-change.test.mjs`).
- [x] Éditeur i18n : sauvegarde globale de clé API, modification locale puis externe, traduction simulée avec succès/échec et nettoyage des événements à la fermeture du panneau (`editors-change.test.mjs`).
- [x] Rendu HTML réel des éditeurs i18n/DB : résolution des chemins webview, nonce et source CSP dans les fichiers `index.html` (`editors-change.test.mjs`).
- [x] Panneau i18n : fermeture ciblée par URI et réouverture du même document (`editors-change.test.mjs`).
- [x] Panneau i18n réouvert : seul le nouveau webview reçoit la modification du document et une seule paire d'abonnements reste active (`editors-change.test.mjs`).
- [x] Éditeur DB : événements de document et abonnement webview libérés à la fermeture du panneau (`editors-change.test.mjs`).
- [x] Watcher VS Code : transitions création/modification/suppression, notifications regroupées et écouteur de renommage libéré par `stop()` (`file-system.test.mjs`).
- [x] Watcher VS Code : rafale de plusieurs chemins, fichier ignoré et notification différée annulée par `stop()` (`file-system.test.mjs`).
- [x] `AutoLoader` : acceptation HTML/Emmet sans doublon, refus mémorisé et rechargement après changement de configuration (`auto-loader.test.mjs`).
- [x] `AutoLoader` : un dossier frère partageant le préfixe du workspace est ignoré (`auto-loader.test.mjs`).
- [x] `AutoLoader` : deux événements concurrents partagent un prompt et enregistrent une seule fois le manifeste (`auto-loader.test.mjs`).
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
- [x] Middlewares webcomponent de création et import de vue : absence d'éditeur, URI et position actives, préremplissage et URI explicite cohérente avec le document actif (`webcomponent-commands.test.mjs`).
- [x] Renommage de fichiers et de composants : conversion des URI, ordre des paires et transmission des arguments ; imports de template/projet sans arguments (`file-command-middleware.test.mjs`).
- [x] Commandes de création, modification et suppression de fichier : transmission de l'URI de `execute` au middleware (`file-command-middleware.test.mjs`).
- [x] Build/export/Store : commandes globales sans arguments, exports ciblés par URI et URL de téléchargement préservée (`file-command-middleware.test.mjs`).
- [x] Initialisation client : attente avant `initDone`, callback immédiat après et exécution unique des callbacks malgré un second `initDone` (`lifecycle.test.mjs`).
- [x] Watcher du client : deux appels à `startFileSystem()` gardent une seule instance, libérée par `stop()` (`lifecycle.test.mjs`).
- [x] Statut de compilation : succès, erreur, ouverture des fichiers de débogage et effacement du statut après retrait du dernier build (`compiled-status.test.mjs`).
- [x] Messages de chargement : deux opérations indépendantes, arrêt et arrêt reçu avant le démarrage (`loading-message.test.mjs`).
- [x] Fournisseur de fichiers de débogage : ajout, remplacement, isolation et retrait de contenu virtuel (`debug-file.test.mjs`).
- [x] Barre d'état : création, commande HTTP, désactivation du build IDE et restauration des détails de compilation (`component-status.test.mjs`).
- [x] Parcours intégré `Compiled` + barre d'état réelle : erreur, correction et retrait du dernier build après rendu (`component-status.test.mjs`).
- [x] Parcours intégré HTTP + barre d'état réelle : démarrage avec adresse puis retour à la commande de démarrage après arrêt (`component-status.test.mjs`).
- [x] Même instance `Client` et vraie barre d'état : notifications LSP successives de compilation et HTTP, arrêt et abonnements LSP libérés (`notification-lifecycle.test.mjs`).
- [x] `InitStep` : message initial, notification de fin, démarrage du watcher et rendu différé du statut (`init-step.test.mjs`).
- [x] Notifications complémentaires : progression Sharp, erreur, ouverture du debug, succès, progression partielle et aperçu conditionné au contexte (`misc-notifications.test.mjs`).
- [x] Statut partagé : notifications Aventus, Sharp et PHP suivies indépendamment (`misc-notifications.test.mjs`, `component-status.test.mjs`).
- [x] Statut partagé avec le vrai composant : une erreur Aventus reste visible après un succès Sharp (`component-status.test.mjs`).
## Vérifications après résolution des blocages

- [x] Activation/désactivation avec hôte VS Code simulé : fournisseurs, notifications, commandes, barre d'état et abonnements libérés (`lifecycle.test.mjs`, `notification-lifecycle.test.mjs`).
- [x] Réglages : configurations invalides ramenées aux valeurs par défaut, callbacks et écouteur de configuration libérés (`settings.test.mjs`).
- [x] Middlewares de création, renommage, fusion et séparation : URI explicite convertie et absence de cible traitée sans exception (`file-command-middleware.test.mjs`, `webcomponent-commands.test.mjs`).
- [x] Système de fichiers : notification différée annulée après `stop()`, même si le callback du timer se déclenche (`file-system.test.mjs`).
- [x] Éditeurs i18n/DB : modifications notifiées aux panneaux, fermeture globale et libération des abonnements de documents et de webviews (`editors-change.test.mjs`, `communication.test.mjs`).
- [x] Migration : installation acceptée/refusée ou échouée, secrets sauvegardés/supprimés, et `testConnection` avec résultat SQLite numérique ou texte (`migration-process.test.mjs`, `migration-databases.test.mjs`, `migration-real-process.test.mjs`).
- [x] Parcours intégré de désactivation : notifications LSP vers la barre d'état, arrêt du client et libération des ressources ; notifications de documents vers les deux webviews puis fermeture des panneaux (`notification-lifecycle.test.mjs`, `editors-change.test.mjs`).
- [x] Aperçu HTML retiré du client : aucune commande ni ressource d'aperçu n'existe désormais ; la migration conserve son propre panneau vérifié par les tests de migration.
