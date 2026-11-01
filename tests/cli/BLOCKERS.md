# Cas CLI en attente de décision

## Notifications de fichiers et de sorties sans effet côté CLI

Les actions de `RegisterBuild`, `UnregisterBuild`, `RegisterData`, `UnregisterData`, `RegisterStatic`, `UnregisterStatic`, `OpenFile`, `CloseFile`, `EditFile` et `OpenPreview` dans `cli/src/server/notification` sont vides ou n'affectent que des variables locales. Un test d'enregistrement, de retrait, d'édition ou d'ordre d'événements n'a donc pas de résultat observable à vérifier. Décision attendue : confirmer que la CLI ignore volontairement ces notifications ou préciser l'état et les effets à implémenter avant de tester ces parcours.

`ServerStart` diffuse une URL à ses callbacks, tandis que `ServerStop.action()` est vide. Il n'existe donc pas de transition de fermeture HTTP observable à tester côté CLI. Décision attendue : confirmer si l'arrêt doit être annoncé aux abonnés.

## L'arbre de fichiers écrit des valeurs de débogage dans le terminal

`tests/cli/terminal-prompts.test.mjs` sélectionne un dossier puis un fichier avec le vrai prompt Inquirer. À chaque pression sur Entrée, `FileTree.ts` écrit `activeItem.isDisabled` et `type` via deux `console.log` avant de terminer la sélection. Ces lignes apparaissent dans la sortie CLI en dehors du rendu du prompt. Décision attendue : confirmer si elles doivent être supprimées du code source avant de figer la sortie terminal attendue.

## Options de build contradictoires acceptées par le parseur

`tests/cli/arguments.test.mjs` vérifie qu'une sélection `--builds web --builds api` est agrégée, mais que l'ajout de `--no-builds` remplace cette sélection par `false`. Le parseur accepte aussi `--verbose` et `--silent` ensemble. `Build.run` transforme ensuite `builds: false` en liste vide, utilise le niveau de journalisation Debug et supprime la sortie texte. Décision attendue : préciser si ces combinaisons doivent être rejetées ou si cette priorité implicite est voulue.

## `check` en mode texte ne signale pas l'échec au processus appelant

`tests/cli/commands.test.mjs` reproduit le cas : `Check.run([], {})` reçoit un diagnostic de sévérité `Error` pour un build. Le diagnostic est écrit sur `console.error`, mais aucun `process.exit(1)` n'est appelé. La variable `hasGlobalFailed` du rendu texte est initialisée à `false` et n'est jamais mise à `true` ; l'action enregistrée par `Action.register` termine donc normalement avec `process.exit(0)`. Le mode JSON marque bien l'échec. Décision attendue : confirmer si le mode texte doit renvoyer le même code d'échec que JSON ; si oui, corriger le code source séparément.

## Le watcher CLI ne peut pas être arrêté explicitement

`tests/cli/watcher.test.mjs` vérifie le regroupement des événements, puis constate que `FilesWatcher` ne propose ni `stop()` ni `dispose()`. L'instance `chokidar` est créée avec `persistent: true` et ne peut donc pas être fermée par son propriétaire. `triggerTimer()` ne conserve pas non plus l'identifiant retourné par `setTimeout`, ce qui empêche l'annulation du délai précédent et son nettoyage. Décision attendue : définir la fermeture du watcher et des timers, notamment pour les usages longs ou les tests intégrés.

## Les commandes de service absorbent un échec du serveur

`tests/cli/service-commands.test.mjs` reproduit le cas avec `template install` : si `Server.start()` rejette, l'erreur est affichée par `console.log`, `run()` se termine sans rejeter et `Action.register` termine ensuite avec `process.exit(0)`. Le même bloc `try/catch` existe dans les commandes de templates, projets et Store. Décision attendue : déterminer le code de sortie voulu pour un échec de démarrage ou d'exécution, puis corriger les commandes concernées séparément.

Le test couvre aussi un rejet `prompt cancelled` de `Server.executeCommand` pour template, projet et Store : les trois commandes journalisent l'erreur et se terminent sans signaler un échec. Décision attendue : distinguer, si nécessaire, l'annulation normale d'un prompt d'une erreur d'installation ou de requête serveur dans la sortie et le code de retour.

Les commandes CLI délèguent le choix et l'installation au serveur. Leurs tests directs couvrent le routage et l'arrêt de séquence ; les installations avec dossiers temporaires sont déjà exercées dans `tests/server/templates` et `tests/server/commands`. Pour un parcours CLI packagé de bout en bout, il faut d'abord résoudre la sortie prématurée des actions asynchrones décrite ci-dessous, puis décider du code de sortie lors d'une annulation ou d'un échec.

## `check --json` packagé se termine sans résultat sur un projet temporaire

`tests/cli/project-process.test.mjs` lance `cli/out/cli.js check <dossier temporaire>/aventus.conf.avt --json` avec deux configurations : `{"module":"Test"}` et une configuration reprenant la structure du modèle `templates/projects/Empty/!aventus.conf.avt` (module, préfixe, build, src et compile). Les deux processus se terminent avec le code 0, mais stdout et stderr sont vides. Les dossiers temporaires sont ensuite supprimés. Les tests unitaires de `Check.run` montrent que la sortie JSON devrait contenir au moins `success` et `builds` si cette méthode atteint le rendu. La version packagée `cli/out/cli.js` utilise bien `program.parse(process.argv)` comme la source. Décision attendue : analyser pourquoi le processus se ferme avant la sortie JSON et définir le code de sortie attendu ; vérifier l'alignement complet des autres fichiers de `cli/out` avec les sources avant une correction séparée.

Le même test reproduit maintenant ce résultat avec `build <config> --json` sur le projet temporaire à structure Empty : code 0, stdout et stderr vides. Le problème concerne donc au moins ces deux commandes packagées.

`tests/cli/arguments.test.mjs` confirme que `program.parse` retourne avant la fin d'une action asynchrone enregistrée par `Action.register`. `cli/src/cli.ts` et `cli/out/cli.js` utilisent bien `program.parse(process.argv)`, tandis que l'action attend `Server.load()`, qui effectue un import dynamique de `RealServer.js`. Cette combinaison est une cause plausible de la sortie vide ; il faut encore confirmer le lien causal dans le processus packagé et vérifier les commandes interactives avant toute correction.

## Un second démarrage du serveur CLI ne se résout pas

`tests/cli/real-server-lifecycle.test.mjs` reproduit le cas : le premier `RealServer.start()` se résout après `RealServer.started()`, mais un second `start({ noStart: true })` sur la même instance laisse sa promesse en attente. Le corps de la promesse ne traite que `if (!this.server)` et n'a pas de branche lorsque le serveur existe déjà. Décision attendue : définir si les commandes doivent pouvoir réutiliser la même instance de serveur et, dans ce cas, le résultat du second démarrage.

Le même test montre qu'une exception pendant `GenericServer.start()` est journalisée dans le `catch` sans rejeter ni résoudre la promesse. Le demandeur reste donc en attente. Décision attendue : définir la propagation de cette erreur et le nettoyage de l'instance partiellement créée.

