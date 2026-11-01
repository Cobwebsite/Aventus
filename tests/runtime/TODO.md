# Plan de tests du runtime

Cocher un point seulement lorsqu'un test automatisé vérifie son résultat. Suivre la logique de `tests/server/TODO.md` : vérifier le cas nominal, les entrées invalides, les révisions d'état et le nettoyage quand ils s'appliquent. `npm run test:runtime` compile `base/src` puis charge le bundle public fraîchement généré `base/dist/aventus.js` dans un contexte isolé ; `AVENTUS_TEST_RUNTIME` permet de cibler un autre bundle sans lancer cette compilation.

La documentation de `D:/Aventus/AventusWebsite/src/static/docs` décrit aussi des usages compilés (`.avt`). Une assertion sur `base/dist/aventus.js` ne valide pas à elle seule la génération du code par le compilateur. Les scénarios documentés non couverts sont listés plus bas séparément.

Le projet `fixtures/reference-project` fournit désormais une compilation réelle et reproductible. `compiled-project.test.mjs` copie ce projet dans un dossier temporaire, exécute `cli/out/cli.js build --json`, inspecte le JavaScript produit et vérifie l'enregistrement du composant dans un contexte isolé.

## Couverture en place

- [x] Template : retirer un élément de boucle parent ne notifie pas sa boucle imbriquée avant destruction (`templates/template-loop-context.test.mjs`).
- [x] Callbacks : doublons, portée, résultats, retrait, vidage et groupes indépendants ; ajout pendant notification différé au prochain déclenchement (`callback.test.mjs`).
- [x] Mutex : acquisition séquentielle, ordre des attentes, sélection du dernier appel et réutilisation (`mutex.test.mjs`).
- [x] Signal : changement de valeur, absence de notification sans changement, abonnement unique, désabonnement et destruction (`signal.test.mjs`).
- [x] `Json` : sérialisation des valeurs propres et getters hérités avec filtre et transformations ; désérialisation des propriétés modifiables, setters hérités et `undefined` explicite (`json.test.mjs`).
- [x] `Uri` : extraction des segments nommés, nombres, routes invalides, wildcard et normalisation des chemins (`uri.test.mjs`).
- [x] Chemins d'objet : lecture point/crochet, segments absents, écriture imbriquée et clés `Map` (`object-path.test.mjs`).
- [x] Chemins d'objet : chemins vides, lecture à travers une valeur primitive et écriture à travers des intermédiaires falsy ou primitifs (`object-path.test.mjs`, décisions dans `BLOCKERS.md`).
- [x] Résultats avec erreur : arrêt après échec, recherche de code, conversion générique, extraction et propagation (`error-result.test.mjs`).
- [x] `Effect`, `Computed` et `Watcher.untrack` sur signaux : dépendances conditionnelles, calcul différé, absence de notification si la valeur calculée reste égale, destruction et lecture non suivie (`reactivity.test.mjs`).
- [x] `Watcher.get` : édition imbriquée et création/suppression à la racine avec chemins publics vérifiés sur des objets du même realm (`reactivity.test.mjs`).
- [x] `Watcher.get` : ajout à un tableau, longueur et remplacement d'un sous-objet suivis d'une nouvelle édition imbriquée (`reactivity.test.mjs`).
- [x] `Watcher.get` : suppression et inversion d'un tableau, extraction de son ordre final ; remplacement d'un sous-objet avec notifications résiduelles de l'ancien proxy (`reactivity.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `Watcher.get` : édition d'un ancien sous-objet après suppression de son parent, notification résiduelle au chemin `undefined.count` (`reactivity.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `Watcher.get` : alias entre deux proxys racines, propagation du changement puis arrêt des notifications après retrait de l'alias (`reactivity.test.mjs`).
- [x] `Watcher.get` : même sous-objet partagé par deux propriétés, valeurs synchronisées, notification du chemin accédé et retrait d'une référence (`reactivity.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `compareObject` : maps de même taille et valeurs différentes actuellement considérées égales (`compare-object.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `compareObject` : maps de tailles différentes, dates natives, cycles d'objets distincts et proxy `Watcher` comparé à des données équivalentes (`compare-object.test.mjs`, décisions dans `BLOCKERS.md`).
- [x] `Watcher.get` : abonnement, désabonnement et extraction du contenu courant (`reactivity.test.mjs`).
- [x] `ActionGuard` : partage du résultat entre appels de même clé, exécution indépendante pour des clés différentes et nouvel appel après achèvement (`action-guard.test.mjs`).
- [x] `Instance` : unicité par classe, injection explicite, suppression et recréation (`instance.test.mjs`).
- [x] Mutex : les quatre variantes `safeRun` libèrent le verrou après une exception et acceptent un nouvel appel (`mutex.test.mjs`).
- [x] `compareObject` : structures imbriquées, tableaux ordonnés ou non, doublons, types incompatibles et absence de mutation (`compare-object.test.mjs`).
- [x] `HttpCache` et `HttpResponse` : cache par URL/méthode/corps, invalidation ciblée, métadonnées et lecture JSON unique (`http-cache.test.mjs`).
- [x] `Converter` : restauration de classes enregistrées dans des tableaux imbriqués, type inconnu, valeurs nulles et copie filtrée avec setter hérité (`converter.test.mjs`).
- [x] `ResourceLoader.load` : mutualisation d'un chargement en cours, cache du contenu et indépendance des URL (`resource-loader.test.mjs`).
- [x] `StateManager` : activation par motif, extraction des paramètres, inactivation, désabonnement, veto et reprise (`state-manager.test.mjs`).
- [x] `StateManager` : transitions concurrentes, seule la dernière attente est exécutée (`state-manager.test.mjs`).
- [x] `StateManager` : transition demandée depuis un callback d'activation et exceptions des hooks `onActivate`/`onInactivate` avec état final vérifié (`state-manager.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `HttpRouter` et `HttpRequest` : GET/POST avec URL de base, corps JSON et en-têtes ; erreurs de transport et de décodage (`http-request.test.mjs`).
- [x] `HttpRequest` : réponse 404 avec JSON valide classée comme erreur HTTP avec statut, et remplacement possible par middleware (`http-request.test.mjs`).
- [x] `HttpRequest` : ordre du hook `beforeSend`, du transport et du middleware de réponse (`http-request.test.mjs`).
- [x] `HttpRequest` : erreur renvoyée par `beforeSend` conservée malgré l'envoi du transport (`http-request.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `HttpCache` : deux requêtes identiques simultanées lancent actuellement deux transports (`http-cache.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `HttpResponse` : lecture texte et blob unique, puis échec de lecture mémorisé sans nouvel essai (`http-cache.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `HttpRouter` : méthodes PUT/DELETE/OPTION et remplacement d'une erreur de transport par middleware (`http-request.test.mjs`).
- [x] `GenericRam` : création, lecture, mise à jour en place, suppression, notifications, identifiant absent et enregistrement introuvable (`ram.test.mjs`).
- [x] `GenericRam` : création répétée sur un identifiant existant, caractérisée comme mise à jour en place avec événement `created` (`ram.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `Data` : métadonnées de type, sérialisation et clonage indépendant via `Converter` (`data.test.mjs`).
- [x] `GenericRam` : création/mise à jour/suppression de listes, lecture par plusieurs identifiants et abonnements locaux (`ram.test.mjs`).
- [x] `GenericRam` : erreur de `beforeRecordSet` lors d'une création, stockage partiel et reprise caractérisés (`ram.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `GenericRam` : erreurs de `afterRecordSet` et de `beforeRecordDelete`, état stocké et notifications vérifiés (`ram.test.mjs`, décisions dans `BLOCKERS.md`).
- [x] `GenericRam` : création et suppression de listes partiellement invalides, état conservé après échec et reprise ; créations concurrentes du même objet de requête (`ram.test.mjs`, décision de liste dans `BLOCKERS.md`).
- [x] `GenericRam` : mise à jour de liste partiellement invalide et reprise ; requêtes de création distinctes concurrentes visant le même identifiant, avec identité et notifications vérifiées (`ram.test.mjs`, décisions dans `BLOCKERS.md`).
- [x] `Json` : champs non modifiables, préservation des champs absents et option `replaceUndefined` (`json.test.mjs`).
- [x] `Json` : entrées `null`, collision de clés renommées, ordre des transformations et priorité des clés exactes sur leurs variantes capitalisées (`json.test.mjs`, décisions dans `BLOCKERS.md`).
- [x] Résultats avec erreur : extraction asynchrone, arrêt après échec et résultat falsy caractérisé (`error-result.test.mjs`, décision dans `BLOCKERS.md`).
- [x] Résultats avec erreur : accumulation de plusieurs erreurs, filtrage des codes par sous-classe, conversion générique avec résultat partiel et message d'une exception (`error-result.test.mjs`).
- [x] Mutex : coalescence des appels asynchrones `safeRunLastAsync`, annulation des attentes intermédiaires et réutilisation (`mutex.test.mjs`).
- [x] Mutex : sélection du dernier callback synchrone `safeRunLast` et comportement de `dispose` avec une attente en cours (`mutex.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `ResourceLoader.loadInHead` : chargement script concurrent, nonce, résultat et réutilisation après succès avec DOM simulé (`resource-loader.test.mjs`).
- [x] `ResourceLoader.loadInHead` : échec CSS suivi d'un second appel actuellement réussi sans nouvel essai (`resource-loader.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `StorableRoute` : routage CRUD complet, corps des requêtes et propagation d'un échec de transport (`storable-route.test.mjs`).
- [x] `StorableRoute` : réponse 422 classée comme erreur HTTP avec statut et réponse DELETE 204 vide (`storable-route.test.mjs`, décision sur DELETE dans `BLOCKERS.md`).
- [x] `StorableRoute` et `GenericRam` : adaptateur concret testant la synchronisation HTTP/RAM des créations, mises à jour et suppressions avec identité et notifications locales (`storable-route.test.mjs`).
- [x] `HttpRequest` : corps `FormData` et transformation PUT en POST avec champ `_method` (`http-request.test.mjs`).
- [x] `uuidv4`, `Async` et `sleep` : format et unicité des UUID, assimilation des valeurs/promesses et temporisation pilotée par un faux timer (`basic-tools.test.mjs`).
- [x] `uuidv4` : erreur lorsque `crypto` est indisponible ; `sleep` : délais zéro, négatif et positif, et résolution indépendante selon l'ordre des timers (`basic-tools.test.mjs`).
- [x] `Converter` : restauration de `Map` sérialisées et transformation de leurs valeurs ; `clone` : copie imbriquée indépendante (`converter.test.mjs`).
- [x] `Converter` : type inconnu imbriqué conservé, date native transformée en objet vide ; `clone` : erreurs JSON sur cycle et `BigInt` (`converter.test.mjs`, décision sur les dates dans `BLOCKERS.md`).
- [x] `HttpResponse` : second lecteur concurrent renvoyant `undefined` et changement de format après lecture renvoyant le contenu initial (`http-cache.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `ResourceLoader.load` : conversion d'un blob image en URL de données et mise en cache (`resource-loader.test.mjs`).
- [x] `Style` : ajout et remplacement de feuilles, rafraîchissement du `<head>`, feuille vide et styles par défaut (`style.test.mjs`).
- [x] `ElementExtension` : recherche d'ancêtres par tag/classe, borne d'arrêt caractérisée et traversée d'une racine shadow (`element-extension.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `Animation` : cadence pilotée par l'horloge, arrêt différé et immédiat, annulation de frame et modification du FPS (`animation.test.mjs`, ordre d'arrêt dans `BLOCKERS.md`).
- [x] `ResizeObserver` : instance native partagée, livraison par cible, désabonnement et déconnexion (`resize-observer.test.mjs`).
- [x] `ResizeObserver` : déconnexion d'un abonné sur une cible partagée retirant actuellement la surveillance native (`resize-observer.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `Style.load` : chargements concurrents mutualisés et absence de nouveau transport après chargement (`style.test.mjs`).
- [x] `Style.load` : échec du transport suivi d'une attente non résolue au nouvel essai (`style.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `PressManager` : installation et retrait des listeners, création pour plusieurs éléments et isolation des instances (`press-manager.test.mjs`).
- [x] `PressManager` : cycle pointerdown/pointerup simple, ordre des callbacks et nettoyage des listeners document (`press-manager.test.mjs`).
- [x] `PressManager` : seuil de déclenchement du drag, mouvements et fin du geste sans callback de simple pression (`press-manager.test.mjs`).
- [x] `PressManager` : geste touch, double pression pilotée par timers et `pointercancel` avec nettoyage des listeners (`press-manager.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `ResourceLoader` : feuille CSS déjà présente et réponse HTML à la place d'une image (`resource-loader.test.mjs`).
- [x] `ResizeObserver` : livraison différée jusqu'à la période FPS configurée (`resize-observer.test.mjs`).
- [x] `HttpRequest` : objet imbriqué avec fichier converti en `FormData` et méthode DELETE simulée par POST (`http-request.test.mjs`).
- [x] `HttpRequest` : tableau de fichiers indexé dans `FormData`, activation puis désactivation du cache ; `HttpRoute` avec préfixe d'URL d'un routeur fourni (`http-request.test.mjs`).
- [x] `HttpRequest` : `queryBlob()` sur un corps binaire et `queryVoid()` sur une réponse 204 vide, selon `http/request.md` (`http-request.test.mjs`).
- [x] `WebComponentInstance` : suivi des instances par sous-classe, retrait et création d'un élément enregistré (`webcomponent-instance.test.mjs`).
- [x] `WebComponentInstance` : enregistrement et retrait de définitions de sous-classes avec liste et horodatage vérifiés (`webcomponent-instance.test.mjs`).
- [x] `WebComponent` : construction, première connexion, passage à `isReady`, changement d'attribut, déconnexion différée et destruction avec DOM simulé et rendu de template remplacé dans la sous-classe de test (`webcomponent-lifecycle.test.mjs`).
- [x] `TemplateContext` : héritage de données, conversion texte et choix d'un nom d'index libre (`template-context.test.mjs`).
- [x] `TemplateInstance` : liaison texte, attribut, événement et valeur bidirectionnelle ; mise à jour réactive et arrêt des recalculs après destruction (`template-bindings.test.mjs`).
- [x] `TemplateInstance` : alternance de branches conditionnelles et destruction de la branche remplacée ; branche finale non détruite caractérisée (`template-bindings.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `EffectNoRecomputed` et `ComputedNoRecomputed` : exécution unique de l'effet et actualisation de la valeur calculée sur dépendance fixe (`reactivity.test.mjs`).
- [x] `Effect` et `Computed` : dépendances imbriquées, exception dans un callback avec reprise et changement de signal pendant l'exécution (`reactivity.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `ElementExtension` : éléments et nœuds assignés à un slot par défaut (`element-extension.test.mjs`).
- [x] `ElementExtension` : élément actif à travers la racine shadow d'un WebComponent (`element-extension.test.mjs`).
- [x] `ElementExtension` : slot nommé imbriqué, slot absent et inclusion d'un descendant à travers une racine shadow (`element-extension.test.mjs`).
- [x] `DragAndDrop` : élément déclencheur, configuration des cibles et retrait des listeners à la destruction (`drag-and-drop.test.mjs`).
- [x] `DragAndDrop` : déplacement réel, dépôt sur une cible, ordre des callbacks et exigence de containment complet en mode strict (`drag-and-drop.test.mjs`).

## Tests à écrire

### Réactivité et états

- [ ] Watcher : retrait et désabonnement des proxys détachés après décision dans `BLOCKERS.md`.
- [x] Signal : désabonnement et ajout d'un abonné pendant notification ; le nouvel abonné ne reçoit que la prochaine révision (`signal.test.mjs`).
- [x] State et StateManager : hooks `onActivate`/`onInactivate` et veto de l'état actif retournant `false` sans notifier de transition (`state-manager.test.mjs`).

### Outils et valeurs

- [x] `Converter` : conversion selon `$schema` statique de `Data` et schéma fourni à `register()`, avec priorité du schéma enregistré par champ (`converter.test.mjs`).
- [ ] `Converter` : conversion des classes calendrier du runtime avec `temporal-polyfill` injecté dans le contexte de test.
- [x] `DateSettings` : configuration partielle, remplacement des formats, copies indépendantes et refus atomique des valeurs invalides (`date-settings.test.mjs`).
- [x] `Date`, `DateTime` et `Time` : opérations Temporal de base avec `temporal-polyfill` (`calendar-temporal.test.mjs`).
- [ ] `Date`, `DateTime` et `Time` : approfondir parsing, formatage, fuseaux, bornes, comparaisons et entrées invalides.
- [x] `ActionGuard` : rejet partagé entre appels de même clé, libération de la clé et nouvel essai après rejet ou exception synchrone (`action-guard.test.mjs`).

### Composants et DOM

- [x] `TemplateInstance` : rendu initial et réordonnancement d'une boucle simple réactive, avec retrait des anciennes lignes et vidage de la collection (`template-bindings.test.mjs`).
- [x] `TemplateInstance` et `TemplateContext` : rendu de boucles imbriquées et nettoyage des lignes enfants après retrait d'un parent ou destruction du template (`template-bindings.test.mjs`).
- [ ] `Template` : valider les boucles et le nettoyage dans un DOM de référence ; finaliser le nettoyage des conditions après décision dans `BLOCKERS.md`.

### Données, HTTP et intégrations


### Projet Aventus de référence : génération et exécution

- [x] Projet Aventus de référence : configuration, compilation par le CLI, sortie contenant une boucle simple et un binding bidirectionnel, chargement du bundle et enregistrement du composant (`fixtures/reference-project`, `compiled-project.test.mjs`).
- [x] Build du projet : réussite du CLI, nom de build, sortie fraîche dans une copie temporaire sans `dist` préexistant et enregistrement du composant (`compiled-project.test.mjs`).
- [x] Build du projet invalide : diagnostic et échec du rapport sans publier de sortie lors du premier build (`compiled-project.test.mjs`).
- [x] Build du projet : un échec de recompilation conserve la dernière sortie valide (`compiled-project.test.mjs`).
- [x] Révisions du projet : modifier la vue, la logique et le style dans la copie temporaire ; recompiler, vérifier que la nouvelle sortie reflète chaque changement et que l'ancienne définition ne subsiste pas (`compiled-project.test.mjs`).
- [x] Boucle `for...of` et `@bind` de `RuntimeList` dans Chromium via Playwright : rendu initial, mise à jour de `value`, saisie `input`/`change`, ajout et retrait d'items, retrait de l'instance du registre après destruction (`compiled-project.test.mjs`).
- [x] Après destruction de `RuntimeList` : retrait du registre, arrêt de l'effet du template et des événements du binding ; `remove(false)` conserve le binding actif (`compiled-project.test.mjs`).
- [ ] Templates `for`, `for...in` et `for...of` : étendre le projet avec un tableau, un objet, une boucle imbriquée et `@Context` ; vérifier les indices/clés, ajout, retrait, réordonnancement et destruction (`wc/loop.md`).
- [x] Projet compilé : `for...in` sur objet avec ajout/suppression de clé, `if`/`else` basculé par clic, et boucle `for` imbriquée avec `@Context` ; ajout et retrait d'une entrée enfant sans recréer l'autre groupe, puis retrait du groupe parent (`compiled-project.test.mjs`).
- [ ] Templates `if`/`else` : étendre le projet avec des branches imbriquées ; vérifier changement de condition, instances remplacées et destruction de la branche finale (`wc/condition.md`, décision dans `BLOCKERS.md`).
- [ ] Interpolation et injection : valeurs initiales, valeurs nulles, mise à jour réactive et nettoyage des effets après retrait (`wc/interpolation.md`, `wc/injection.md`).
- [ ] Sélection d'éléments et événements : élément unique ou multiple, gestionnaire appelé une seule fois, retrait des écouteurs à la destruction (`wc/element.md`, `wc/event.md`).
- [ ] Bindings : propriété native ou enfant, événements personnalisés, extraction et injection bidirectionnelles, absence de notification après destruction (`wc/binding.md`).
- [ ] WebComponent compilé : propriétés et attributs typés, `@Watch`, `@Signal`, état local, slots/blocs, héritage et cycle `postCreation`/`postDestruction` (`wc/property.md`, `attribute.md`, `watch.md`, `signal.md`, `state.md`, `create.md`, `inheritance.md`).
- [ ] Styles de composant : style local/hérité/externe, modification globale et thème dans un DOM de référence (`wc/style.md`).
- [ ] `Data` compilé et `@Convertible` : génération de `Fullname`, `$type`, `$schema`, restauration et clonage typés (`data/create.md`, `lib/converter.md`).
