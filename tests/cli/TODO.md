# Plan de tests de la CLI

Cocher uniquement après vérification automatisée. Couvrir le cas nominal, les entrées invalides et les transitions ou le nettoyage lorsqu'ils s'appliquent. Simuler le serveur et les interactions pour les tests de commandes ; employer des dossiers temporaires pour les tests de fichiers.

## Couverture déjà en place

- [x] Utilitaires : conversion chemins/URI avec espaces et caractères réservés, tailles aux seuils binaires et sévérités de diagnostic (`tools.test.mjs`).
- [x] Touche de sortie : seul Ctrl+L active le raccourci (`exit-key.test.mjs`).
- [x] Commandes `format`, `check` et `build` : séquence d'appel, chemin de configuration, sélection désactivée, options de serveur et sortie JSON vide (`commands.test.mjs`).
- [x] Sorties JSON de `check` et `build` : diagnostics de plusieurs builds, plages, tailles des sorties et code d'échec (`commands.test.mjs`).
- [x] Sorties texte : sévérités warning/info/hint de `check`, silence de `build`, échec puis reprise sur la même instance et fichiers de plusieurs builds/statiques (`commands.test.mjs`).
- [x] `check` texte : un diagnostic d'erreur est affiché et provoque un code de sortie 1 (`commands.test.mjs`).
- [x] Analyse des arguments d'une action : aide, argument obligatoire, option inconnue et transmission d'options variadiques (`arguments.test.mjs`).
- [x] Sous-commande réelle dans un groupe partagé : option obligatoire, alias court et transmission des arguments (`arguments.test.mjs`).
- [x] Parser d'action : valeurs variadiques répétées et rejet des combinaisons `--builds`/`--no-builds`, `--statics`/`--no-statics` et `--verbose`/`--silent` (`arguments.test.mjs`).
- [x] Point d'entrée CLI : `program.parse` revient avant la fin d'une action asynchrone ; le signal de fin de chargement du serveur permet néanmoins aux commandes packagées testées d'achever leur rendu (`arguments.test.mjs`, `project-process.test.mjs`).
- [x] Statistiques reçues du serveur : temps de chargement, builds et sorties statiques indépendants, remplacement d'une taille de fichier (`statistics.test.mjs`).
- [x] `serve` : ordre de démarrage, attente de la notification HTTP, saisie d'arrêt et retrait du callback (`serve.test.mjs`).
- [x] `watch` : sérialisation JSON des diagnostics, état des builds et exclusion des fichiers contenant seulement des hints (`watch-dev.test.mjs`).
- [x] `watch` : abonnement aux diagnostics, erreur puis correction sur la même instance, avec retrait de l'écouteur SIGINT du test (`watch-dev.test.mjs`).
- [x] `watch` : SIGINT retire l'abonnement serveur et l'écouteur de signal avant la sortie à zéro (`watch-dev.test.mjs`).
- [x] `dev` : démarrage, création, consultation des logs et sortie de la boucle interactive (`watch-dev.test.mjs`).
- [x] Entrée CLI packagée en processus enfant : aide, version, commande inconnue et option incomplète avec codes de sortie (`process.test.mjs`).
- [x] Groupes CLI packagés : aides de `template install`, `dependencies help-llm` et `ai prepare` avec codes de sortie (`process.test.mjs`).
- [x] `check --json` sur deux projets temporaires (minimal et structure du modèle Empty) en processus enfant : sortie JSON et code de succès, puis nettoyage des dossiers (`project-process.test.mjs`).
- [x] `build --json` sur projet temporaire en processus enfant : sortie JSON et code de succès, puis nettoyage du dossier (`project-process.test.mjs`).
- [x] `update` : version déjà présente, installation locale dans un dossier temporaire et réponse npm sans version (`update.test.mjs`).
- [x] Watcher CLI : transitions de fichiers, regroupement des événements, ordre des notifications et arrêt explicite avec annulation des événements en attente (`watcher.test.mjs`).
- [x] Watcher CLI sur disque : création, modification, suppression et rafales de fichiers `.avt` sur un répertoire temporaire Windows (`watcher-disk.test.mjs`).
- [x] Templates, projets et Store : configuration serveur, routage des commandes, identifiants transmis et code de sortie 1 après échec (`service-commands.test.mjs`).
- [x] Store : échec de la requête serveur signalé avec le code de sortie 1 (`service-commands.test.mjs`).
- [x] Annulation normale : les prompts renvoient `null` et le serveur arrête l'action sans erreur ; un rejet de `Server.executeCommand` reste un échec avec code 1 (`interaction.test.mjs`, `service-commands.test.mjs`, tests serveur des templates et commandes).
- [x] `create`, `dependencies help-llm` et `ai prepare` : configuration serveur, URI du dossier courant, ordre des commandes et arrêt après échec (`service-commands.test.mjs`).
- [x] Interaction terminal : choix vides et multiples, saisie, mot de passe, filtre d'arbre et abonnement aux logs (`interaction.test.mjs`).
- [x] Interaction terminal : validation asynchrone et annulation par rejet du prompt, sans effacement de la vue après ce rejet (`interaction.test.mjs`).
- [x] Interaction terminal : retour `null` de choix simple/multiple, saisie, mot de passe et arbre avec effacement configuré (`interaction.test.mjs`).
- [x] Connexion CLI : dispatch de notifications, diagnostics par build avec retrait et désabonnement, réglages et prompts terminaux (`connection.test.mjs`).
- [x] Cycle de `RealServer` : notification d'initialisation et second `start()` résolu sans redémarrage, ou après le premier démarrage en cours (`real-server-lifecycle.test.mjs`).
- [x] Cycle de `RealServer` : exception de démarrage propagée, watcher et état partiel nettoyés, nouvel essai possible (`real-server-lifecycle.test.mjs`).
- [x] Registre des notifications CLI : canaux init/HTTP/statistiques, callbacks HTTP retirés pendant la diffusion et signal de fin d'initialisation (`notifications.test.mjs`).
- [x] Connexion et registre réels : diffusion du démarrage HTTP dans l'ordre des abonnés, arrêt sans diffusion côté CLI et mise à jour des statistiques sur la même connexion (`notification-dispatch.test.mjs`).
- [x] Notifications destinées à l'éditeur : réception sans effet côté CLI (`notifications.test.mjs`).
## Parcours intégrés

Les décisions de `BLOCKERS.md` sont résolues. Chaque parcours ci-dessous a été vérifié automatiquement.

- [x] `watch` packagé : modification puis correction d'une source réelle, avec arrêt et nettoyage (`watch-project-process.test.mjs`).
- [x] Templates, projets, Store et dépendances packagés : prompts, installations locales dans un dossier temporaire, annulation de connexion Store, génération du dossier de dépendances et nettoyage (`service-project-process.test.mjs`).
- [x] Interaction terminal : prompt de logs Inquirer réel, rafraîchissement des diagnostics, fermeture par Ctrl+L et nettoyage de l'abonnement (`log-prompt.test.mjs`).
- [x] Interaction terminal : vues Inquirer réelles de sélection, sélection multiple et saisie ; choix désactivé, validation, correction et fermeture (`terminal-prompts.test.mjs`).
- [x] Interaction terminal : arbre de fichiers Inquirer réel sur dossier temporaire, choix d'un dossier, navigation vers un fichier et annulation sans sortie de débogage (`terminal-prompts.test.mjs`).
- [x] Build packagé sur un projet temporaire : sortie écrite, diagnostic d'erreur, succès après correction et nettoyage (`build-project-process.test.mjs`).

