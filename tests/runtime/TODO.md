# Plan de tests du runtime

## Audit documentaire restant

- [x] Inventaire des 28 diagnostics `AventusErrorCode` de `server/src/definition.ts` : 21 codes sont référencés dans `server/src`, dont 18 émis par des chemins de compilation ou de validation TypeScript et caractérisés par les tests de compilation ci-dessous. `ConfigJsonError` appartient au validateur de configuration JSON ; le CLI accepte pourtant un JSON malformé avec un succès vide (`cases/invalid-config`, `BLOCKERS.md`). `MissingExtension`/`MissingProp` sont sans émetteur actif. Les sept autres (`Unknow`, `MissingVariable`, `OutsideInterpolation`, `UsedKeyword`, `MissingAttributeForLoop`, `MissingWatchable`, `ConvertionImpossible`) ne sont pas référencés hors de l'enum.
- [x] Diagnostic `NoWebComponent` : fichier `.wcl.avt` sans classe WebComponent refusé sans bundle (`cases/no-component`, `compiled-project.test.mjs`).
- [x] Diagnostic `MissingFullName` : `Data` sans `Fullname` explicite accepté avec identité générée et vérifiée dans Chromium ; `@Convertible` sans propriété statique `Fullname` refusé sans bundle (`cases/missing-fullname`, `compiled-project.test.mjs`).
- [x] Diagnostic `SameNameFound` : deux fichiers `.lib.avt` exportant le même nom de classe produisent une erreur sur chacun et aucun bundle (`cases/duplicate-name`, `compiled-project.test.mjs`).
- [x] Diagnostics `MissingMethod`, `MissingViewElement` et `viewElementNotFound` : méthode d'événement absente, élément `@element` sans champ et champ `@ViewElement` absent de la vue, tous refusés sans bundle (`cases/invalid-view`, `compiled-project.test.mjs`).
- [x] Diagnostic `ParsingParentFailed` : parent de composant introuvable refusé sans bundle (`cases/invalid-parent`, `compiled-project.test.mjs`).
- [x] `MissingExtension` et `MissingProp` ne décrivent pas actuellement de restriction testable : `validateRules` n'est appelé avec aucune liste `class_extend` ou `interface`, et `MissingProp` n'est utilisé que pour filtrer un diagnostic dans `component/File.ts`. Ces chemins restent sans émetteur dans `server/src`.
- [x] Fichier annexe `.defnpm.avt` : une déclaration voisine de `.static.avt` est émise dans `index.d.ts` de `outputNpm` tandis que le JavaScript statique s'exécute dans Chromium ; sans ce fichier, la sortie npm reprend `.def.avt` (`cases/static-npm`, `compiled-project.test.mjs` ; `server/src/language-services/ts/static/File.ts`).
- [x] Extensions restantes de `AventusExtension` examinées : `aventus.sharp.avt` et `aventus.php.avt` servent aux commandes d'export C#/PHP, `template.avt.ts` aux modèles de création de fichiers de l'éditeur (`advanced/template.md`), et `!aventus.conf.avt` à la configuration de modèle ; elles ne sont pas des unités compilées dans un bundle JavaScript runtime. Les quatre pages `install/*` décrivent l'installation, l'interface et le premier projet ; le composant, les vues, les styles et la configuration de leur tutoriel sont exercés par le projet de référence et les cas détaillés.
- [x] Diagnostics `TagLower` et `MultipleWebComponent` : tag personnalisé invalide, puis deux classes WebComponent dans un seul `.wcl.avt`, chacun refusé sans bundle (`cases/invalid-tag`, `cases/multiple-components`, `compiled-project.test.mjs`).
- [x] Diagnostics `ExclamationMarkMissing` et `QuestionMarkMissing` : attribut numérique, propriété chaîne et référence `@ViewElement` sans initialisation ni marque de nullabilité refusés sans bundle (`cases/invalid-nullability`, `compiled-project.test.mjs`).
- [x] Diagnostics de fichier `Data` : `MissingImplementation`, `MissingInit`, `FunctionNotAllowed` et `VariableNotAllowed` vérifiés dans un cas invalide isolé, sans bundle (`cases/invalid-data`, `compiled-project.test.mjs`).
- [x] `ui/scrollable.md` : méthodes programmatiques, glissement souris, inertie à la molette, `disable` après stabilisation, déplacement d'une barre personnalisée avec une vraie souris Playwright et pincement à deux contacts via Chromium CDP ; zoom borné par `max_zoom` sur `AdvancedScrollable`. Les propriétés avancées sont attribuées à `Scrollable` dans la documentation, écart décrit dans `BLOCKERS.md` (`cases/ui-dependency`, `compiled-project.test.mjs`).
- [x] `Img.calculateSize()` : tailles d'hôte et d'image contrôlées dans Chromium, dimensions résultantes vérifiées pour `stretch`, `contains` et `cover` après initialisation asynchrone (`ui/image.md`, `compiled-project.test.mjs`).
- [x] `ui/image.md` : `Img` compilé avec `contains`, `cover` et `stretch`, chemin raster direct puis `cache` via `ResourceLoader`, dimensions calculées pour chaque mode, SVG inline et variable CSS de remplissage ; absence du chargeur sans import consignée dans `BLOCKERS.md` (`cases/ui-dependency`, `compiled-project.test.mjs`).
- [x] `compile.output`, `compile.package` et `compile.outputNpm.path` sous forme de tableaux : deux sorties JS identiques dont la copie s'exécute dans Chromium, deux packages identiques avec déclarations et deux modules npm importables (`compiled-project.test.mjs` ; `config/build.md`).
- [x] `compile.i18n` : sorties `singleFile`, `oneToOne` et `groupComponent` dans un dossier personnalisé, fichiers par locale, traductions globales et de composant vérifiées après compilation (`compiled-project.test.mjs` ; `i18n/config.md`, `config/build.md`). Les modes `basedOnAttribute` et `include` sont indiqués WIP dans la documentation.
- [x] `wc/inheritance.md` section « Delegate Function » : base abstraite générique avec méthode abstraite appelée par `@Watch`, deux sous-classes concrètes, callbacks typés et rendu hérités (`RuntimeFillable`, `RuntimeTextFillable`, `RuntimeNumberFillable`, `compiled-project.test.mjs`).
- [x] `overview.md` et `http/introduction.md` sont des synthèses : leurs éléments exécutables (composants séparés, réactivité, états, RAM, HTTP, navigation) sont couverts par les cas détaillés ci-dessous et `compiled-project.test.mjs`, `http-request.test.mjs`, `http-cache.test.mjs`. Les pages `install/*` décrivent l'installation et le tutoriel, sans point de langage supplémentaire.
- [x] `ram/create.md` : `Aventus.Ram` à clé numérique et `Aventus.GenericRam<string, …>` à clé chaîne compilés ; création, lecture, mise à jour et suppression vérifiées dans Chromium (`RuntimePersonRAM`, `cases/generic-ram`, `compiled-project.test.mjs`).
- [x] `wc/attribute.md`, `wc/property.md`, `wc/watch.md` et `wc/signal.md` : attributs booléen, nombre, chaîne, littéral, `Date`, `DateTime` et `Time` synchronisés avec HTML, propriété `Date` et callback ; diagnostics ciblés pour nom en majuscules et type objet interdit ; observation profonde et remplacement, signal et callbacks dans des composants compilés (`RuntimeAttributes`, `cases/attribute-types`, `RuntimeReactivity`, `compiled-project.test.mjs`).
- [x] `wc/state.md` et `wc/inheritance.md` : décorateurs d'état avec classe et instance du gestionnaire, slugs, état par défaut et désabonnement à la destruction ; remplacement de bloc et `@OverrideView` dans des composants compilés (`RuntimeState`, `RuntimeDerived`, `RuntimeOverride`, `compiled-project.test.mjs`).
- [x] `@Effect` : un effet `autoInit` lit un `@Signal` initialisé et réagit à ses changements dans le composant compilé (`RuntimeEffect.wcl.avt`, `compiled-project.test.mjs`).
- [x] `@InternalProtected` : propriétés et méthodes deviennent `protected` dans la définition du package, tout en restant exécutables dans le bundle (`RuntimeInternalProtected.lib.avt`, `compiled-project.test.mjs`).
- [x] `@ForeignKey(RuntimePerson)` : la classe `Data` compilée expose `ref:RuntimeReference.RuntimePerson` dans son schéma (`RuntimeForeignKey.data.avt`, `compiled-project.test.mjs`).
- [x] `@Storybook` et `@StoryValue` : compilation et rendu avec `stories.live: false`, puis absence de build avec `live: true` ; export Storybook toujours bloqué, voir `BLOCKERS.md` (`cases/storybook-decorators`, `compiled-project.test.mjs`).
- [x] `@Injectable` : propriété du composant accessible dans le bundle et attribut `:message` publié dans la documentation HTML du package (`RuntimeInjectable.wc.avt`, `compiled-project.test.mjs`).
- [x] `@NoType` permet une propriété sans type explicite, dont la version sans décorateur produit le diagnostic attendu ; `@NoCompile` retire une méthode du composant généré ; `@Deprecated` conserve l'exécution de la méthode annotée (`RuntimeDecoratorMetadata.lib.avt`, `cases/no-compile`, `compiled-project.test.mjs`).
- [x] `@ViewElement` compilé : références simple et répétée reliées au template, `useLive` retrouve un nœud remplacé portant le même `_id` généré, et liaison d'entrée de `RuntimeInput` (`RuntimeMarkup`, `RuntimeInput`, `compiled-project.test.mjs` ; `wc/element.md`).

- [x] `lib/instance.md`, `lib/watcher.md` et `lib/resource_loader.md` : singleton, proxy avec actions créées/modifiées/supprimées, signal, effet, calcul dérivé, chargement texte et CSS avec cache après import explicite ; `ResourceLoader` absent sans import, comme dans les blocages UI et i18n (`RuntimeCoreUtilities.lib.avt`, `cases/resource-loader-import`, `compiled-project.test.mjs`).
- [x] `state/create.md`, `state/change.md` et `state/listen_changes.md` : sous-classe `.state.avt`, activation par chaîne, instance et méthode statique, abonnement par motif avec slug, veto, inactivation et désabonnement (`RuntimeNamedState.state.avt`, `RuntimeStateCases.lib.avt`, `compiled-project.test.mjs`).
- [x] `ram/listen_changes.md` : callbacks `onUpdate` et `onDelete` d'un élément RAM compilé, retrait par `offUpdate` et `offDelete`, notification limitée à l'élément suivi (`RuntimeRamCallbacks.lib.avt`, `compiled-project.test.mjs`).

- [x] `forceDocumentation` et `hideWarnings` : avertissement de documentation visible puis masqué selon les options du build et celles héritées du projet, surcharge locale vérifiée, erreur TypeScript conservée et bundle encore exécutable après filtrage (`compiled-project.test.mjs` ; `config/basic_prop.md`, `server/src/project/Build.ts`).
- [x] Package local : sortie `.package.avt` générée, build consommateur témoin réussi, puis ajout de la dépendance locale provoquant une réussite CLI vide avec ou sans import ; cas consigné dans `BLOCKERS.md` (`cases/local-package`, `compiled-project.test.mjs` ; `config/lib.md`, `advanced/store.md`).
- [x] Storybook : `stories.live: false` conserve le build sans export automatique ; `live: true` donne une réussite CLI vide sans bundle ni stories, écart caractérisé dans `BLOCKERS.md` (`compiled-project.test.mjs` ; `advanced/storybook.md`).
- [x] Package `Aventus@UI` : cas compilés et interactions réelles pour les familles formulaire (`FormHandler`), navigation (`Link`), notifications (`ToastManager`) et composants visuels (`ProgressCircle`, `Collapse`), avec écarts décrits dans `BLOCKERS.md`.
- [x] `Tabs` compilé : sous-classes concrètes, premier onglet actif, sélection par index et identifiant, clic réel Playwright, ajout et retrait dynamiques ; tags documentés non enregistrés et identifiant invalide consignés dans `BLOCKERS.md` (`cases/ui-tabs`, `compiled-project.test.mjs` ; `ui/tabs.md`).
- [x] `Router` compilé : initialisation automatique différée, route par défaut `/home`, navigation `/other`, visibilité des pages, historique des transitions et titre du document ; import `Aventus@Main` documenté rejeté, consigné dans `BLOCKERS.md` (`cases/ui-page`, `cases/router-documented-import`, `compiled-project.test.mjs` ; `ui/router.md`).
- [x] `Page` compilé : template, configuration et séquence initiale `onHide`, puis `show`/`show`/`hide` ; import `Aventus@Main` documenté rejeté, consigné dans `BLOCKERS.md` (`cases/ui-page`, `cases/page-documented-import`, `compiled-project.test.mjs` ; `ui/page.md`).
- [x] `ModalElement` : clic extérieur ferme la modale, clic intérieur la laisse ouverte ; configuration globale des fermetures appliquée mais `rejectValue` ignoré, consigné dans `BLOCKERS.md` (`cases/ui-modal`, `compiled-project.test.mjs` ; `ui/modal.md`).
- [x] `ModalElement` compilé : affichage, rôle de dialogue après initialisation, résolution, rejet, fermeture par Échap et retrait du DOM (`cases/ui-modal`, `compiled-project.test.mjs` ; `ui/modal.md`).
- [x] `GridHelper` avec `ResizeObserver` simulé : dessin des colonnes et lignes, raccourcis de grille et de verrouillage, déplacement aimanté d'un guide et suppression par vrai double clic Playwright (`cases/ui-dependency`, `compiled-project.test.mjs` ; `ui/grid_helper.md`).
- [x] `GridHelper` compilé : enregistrement, template, conversions en pixels, création, sauvegarde et restauration automatique des guides ; lignes de grille et interactions absentes consignées dans `BLOCKERS.md` (`cases/ui-dependency`, `compiled-project.test.mjs` ; `ui/grid_helper.md`).
- [x] `FormElement` lié à `FormHandler` : synchronisation bidirectionnelle, cumul des erreurs locales et du schéma, arrêt des notifications après destruction (`cases/ui-form-element`, `compiled-project.test.mjs` ; `ui/form_element.md`).
- [x] `FormElement` compilé : validation locale, validité `ElementInternals`, valeur transmise au formulaire natif et callback de changement (`cases/ui-form-element`, `compiled-project.test.mjs` ; `ui/form_element.md`).
- [x] `ButtonElement` compilé : mode par défaut, soumission native explicite, état `loading`, Entrée et pression pointeur après initialisation différée (`cases/ui-button`, `compiled-project.test.mjs` ; `ui/button.md`).
- [x] `Scrollable` compilé : contenu rendu et défilement vertical programmatique ; `zoomOnPoint` et défilements en pourcentage absents du composant simple, mais exécutés sur `AdvancedScrollable` avec callbacks, limites de zoom et changement de position ; écart documentaire consigné dans `BLOCKERS.md` (`cases/ui-dependency`, `compiled-project.test.mjs` ; `ui/scrollable.md`).

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
- [x] Chemins d'objet : lecture du chemin vide, refus de son écriture, lecture à travers une valeur primitive et refus d'écrire à travers un intermédiaire primitif existant (`object-path.test.mjs`).
- [x] Résultats avec erreur : arrêt après échec, recherche de code, conversion générique, extraction et propagation (`error-result.test.mjs`).
- [x] `Effect`, `Computed` et `Watcher.untrack` sur signaux : dépendances conditionnelles, calcul différé, absence de notification si la valeur calculée reste égale, destruction et lecture non suivie (`reactivity.test.mjs`).
- [x] `Watcher.get` : édition imbriquée et création/suppression à la racine avec chemins publics vérifiés sur des objets du même realm (`reactivity.test.mjs`).
- [x] `Watcher.get` : ajout à un tableau, longueur et remplacement d'un sous-objet suivis d'une nouvelle édition imbriquée (`reactivity.test.mjs`).
- [x] `Watcher.get` : suppression et inversion d'un tableau, extraction de son ordre final ; remplacement d'un sous-objet avec notifications résiduelles de l'ancien proxy (`reactivity.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `Watcher.get` : édition d'un ancien sous-objet après suppression de son parent, notification résiduelle au chemin `undefined.count` (`reactivity.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `Watcher.get` : alias entre deux proxys racines, propagation du changement puis arrêt des notifications après retrait de l'alias (`reactivity.test.mjs`).
- [x] `Watcher.get` : même sous-objet partagé par deux propriétés, valeurs synchronisées, notification du chemin accédé et retrait d'une référence (`reactivity.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `compareObject` : égalité des `Map` selon leurs clés et valeurs récursives, indépendante de l'ordre d'insertion (`compare-object.test.mjs`).
- [x] `compareObject` : maps de tailles différentes, dates natives hors contrat Aventus, comparaison des cycles d'objets distincts et données d'un proxy `Watcher` comparées à un objet ordinaire (`compare-object.test.mjs`).
- [x] `Watcher.get` : abonnement, désabonnement et extraction du contenu courant (`reactivity.test.mjs`).
- [x] `ActionGuard` : partage du résultat entre appels de même clé, exécution indépendante pour des clés différentes et nouvel appel après achèvement (`action-guard.test.mjs`).
- [x] `Instance` : unicité par classe, injection explicite, suppression et recréation (`instance.test.mjs`).
- [x] Mutex : les quatre variantes `safeRun` libèrent le verrou après une exception et acceptent un nouvel appel (`mutex.test.mjs`).
- [x] `compareObject` : structures imbriquées, tableaux ordonnés ou non, doublons, types incompatibles et absence de mutation (`compare-object.test.mjs`).
- [x] `HttpCache` et `HttpResponse` : cache par URL/méthode/corps/format `Accept`, invalidation ciblée, métadonnées et lecture JSON unique (`http-cache.test.mjs`).
- [x] `Converter` : restauration de classes enregistrées dans des tableaux imbriqués, type inconnu, valeurs nulles et copie filtrée avec setter hérité (`converter.test.mjs`).
- [x] `ResourceLoader.load` : mutualisation d'un chargement en cours, cache du contenu et indépendance des URL (`resource-loader.test.mjs`).
- [x] `StateManager` : activation par motif, extraction des paramètres, inactivation, désabonnement, veto et reprise (`state-manager.test.mjs`).
- [x] `StateManager` : transitions concurrentes, seule la dernière attente est exécutée (`state-manager.test.mjs`).
- [x] `StateManager` : transition demandée depuis un callback d'activation et exceptions des hooks `onActivate`/`onInactivate` signalées sans interrompre la transition ni les notifications (`state-manager.test.mjs`).
- [x] `HttpRouter` et `HttpRequest` : GET/POST avec URL de base, corps JSON et en-têtes ; erreurs de transport et de décodage (`http-request.test.mjs`).
- [x] `HttpRequest` : réponse 404 avec JSON valide classée comme erreur HTTP avec statut, et remplacement possible par middleware (`http-request.test.mjs`).
- [x] `HttpRequest` : ordre du hook `beforeSend`, du transport et du middleware de réponse (`http-request.test.mjs`).
- [x] `HttpRequest` : erreur renvoyée par `beforeSend` empêchant le transport et transmise au middleware de réponse (`http-request.test.mjs`).
- [x] `HttpCache` : partage du transport entre requêtes identiques simultanées et nouvel essai après échec partagé (`http-cache.test.mjs`).
- [x] `HttpResponse` : lecture texte et blob unique, puis échec de lecture mémorisé et rejoué sans nouvel essai (`http-cache.test.mjs`).
- [x] `HttpRouter` : méthodes PUT/DELETE/OPTION et remplacement d'une erreur de transport par middleware (`http-request.test.mjs`).
- [x] `GenericRam` : création, lecture, mise à jour en place, suppression, notifications, identifiant absent et enregistrement introuvable (`ram.test.mjs`).
- [x] `GenericRam` : création répétée sur un identifiant existant refusée sans modifier l'enregistrement ni publier `created` ; `update()` reste disponible (`ram.test.mjs`).
- [x] `Data` : métadonnées de type, sérialisation et clonage indépendant via `Converter` (`data.test.mjs`).
- [x] `GenericRam` : création/mise à jour/suppression de listes, lecture par plusieurs identifiants et abonnements locaux (`ram.test.mjs`).
- [x] `GenericRam` : erreur de `beforeRecordSet` empêchant la création sans stockage ni notification, suivie d'un nouvel essai réussi (`ram.test.mjs`).
- [x] `GenericRam` : erreur de `afterRecordSet` conservée dans le résultat avec enregistrement et notification `created` ; erreur de `beforeRecordDelete` empêchant la suppression et permettant un nouvel essai (`ram.test.mjs`).
- [x] `GenericRam` : création de liste arrêtée si un hook préalable ou la transformation échoue, puis traitement des ressources poursuivi après erreur d'un élément ; suppression de liste avec résultats partiels et notifications immédiates ; exceptions d'abonnés signalées sans interrompre la publication ; créations concurrentes du même objet de requête (`ram.test.mjs`).
- [x] `GenericRam` : mise à jour de liste arrêtée avant transformation si un hook préalable échoue, puis traitement des ressources poursuivi après erreur d'un élément, identité des objets conservée et événement `updated` ; la seconde création concurrente visant le même identifiant est refusée sans modifier la première (`ram.test.mjs`).
- [x] `Json` : champs non modifiables, préservation des champs absents et option `replaceUndefined` (`json.test.mjs`).
- [x] `Json` : entrées `null` rejetées par `TypeError` sans modifier la cible, dernière valeur conservée lors d'une collision de renommage, ordre des transformations et priorité des clés exactes même si leur valeur est `undefined` (`json.test.mjs`).
- [x] Résultats avec erreur : extraction asynchrone, arrêt après échec et propagation des résultats réussis falsy (`error-result.test.mjs`).
- [x] Résultats avec erreur : accumulation de plusieurs erreurs, filtrage des codes par sous-classe, conversion générique avec résultat partiel et message d'une exception (`error-result.test.mjs`).
- [x] Mutex : coalescence des appels asynchrones `safeRunLastAsync`, annulation des attentes intermédiaires et réutilisation (`mutex.test.mjs`).
- [x] Mutex : sélection du dernier callback synchrone `safeRunLast` et rejet des attentes en cours par `dispose`, sans exécuter leurs callbacks (`mutex.test.mjs`).
- [x] `ResourceLoader.loadInHead` : chargement script concurrent, nonce, résultat et réutilisation après succès avec DOM simulé (`resource-loader.test.mjs`).
- [x] `ResourceLoader.loadInHead` : échec CSS partagé entre appels concurrents, lien retiré et nouvel essai possible au prochain appel (`resource-loader.test.mjs`).
- [x] `StorableRoute` : routage CRUD complet, corps des requêtes et propagation d'un échec de transport (`storable-route.test.mjs`).
- [x] `StorableRoute` : corps JSON décodé sur réponse 422, erreur de statut remplacée par les erreurs applicatives typées si présentes ; DELETE accepte une réponse 204 vide et propage les erreurs HTTP (`storable-route.test.mjs`).
- [x] `StorableRoute` et `GenericRam` : adaptateur concret testant la synchronisation HTTP/RAM des créations, mises à jour et suppressions avec identité et notifications locales (`storable-route.test.mjs`).
- [x] `HttpRequest` : corps `FormData` et transformation PUT en POST avec champ `_method` (`http-request.test.mjs`).
- [x] `uuidv4`, `Async` et `sleep` : format et unicité des UUID, assimilation des valeurs/promesses et temporisation pilotée par un faux timer (`basic-tools.test.mjs`).
- [x] `uuidv4` : erreur lorsque `crypto` est indisponible ; `sleep` : délais zéro, négatif et positif, et résolution indépendante selon l'ordre des timers (`basic-tools.test.mjs`).
- [x] `Converter` : restauration de `Map` sérialisées et transformation de leurs valeurs ; `clone` : copie imbriquée indépendante (`converter.test.mjs`).
- [x] `Converter` : type inconnu imbriqué conservé, date native hors contrat Aventus transformée en objet vide ; `clone` : erreurs JSON sur cycle et `BigInt` (`converter.test.mjs`).
- [x] `HttpResponse` : lecture concurrente du même format partageant la promesse et format incompatible rejeté avant ou après la lecture (`http-cache.test.mjs`).
- [x] `ResourceLoader.load` : conversion d'un blob image en URL de données et mise en cache (`resource-loader.test.mjs`).
- [x] `Style` : ajout et remplacement de feuilles, rafraîchissement du `<head>`, feuille vide et styles par défaut (`style.test.mjs`).
- [x] `ElementExtension` : recherche d'ancêtres par tag/classe, borne d'arrêt inclusive et traversée d'une racine shadow (`element-extension.test.mjs`).
- [x] `Animation` : cadence pilotée par l'horloge, arrêt différé après la dernière animation, arrêt immédiat, annulation de frame et modification du FPS (`animation.test.mjs`).
- [x] `ResizeObserver` : instance native partagée, livraison par cible, désabonnement et déconnexion (`resize-observer.test.mjs`).
- [x] `ResizeObserver` : cible partagée surveillée jusqu'au désabonnement du dernier wrapper (`resize-observer.test.mjs`).
- [x] `Style.load` : chargements concurrents mutualisés et absence de nouveau transport après chargement (`style.test.mjs`).
- [x] `Style.load` : échec partagé entre appels concurrents, promesses rejetées et nouvel essai possible (`style.test.mjs`).
- [x] `PressManager` : installation et retrait des listeners, création pour plusieurs éléments et isolation des instances (`press-manager.test.mjs`).
- [x] `PressManager` : cycle pointerdown/pointerup simple, ordre des callbacks et nettoyage des listeners document (`press-manager.test.mjs`).
- [x] `PressManager` : seuil de déclenchement du drag, mouvements et fin du geste sans callback de simple pression (`press-manager.test.mjs`).
- [x] `PressManager` : geste touch, double pression pilotée par timers et `pointercancel` nettoyant le geste sans déclencher l'action, avec `onPressEnd` conservé (`press-manager.test.mjs`).
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
- [x] `TemplateInstance` : alternance de branches conditionnelles et destruction de la branche remplacée ainsi que de la branche finale avec le parent (`template-bindings.test.mjs`).
- [x] `EffectNoRecomputed` et `ComputedNoRecomputed` : exécution unique de l'effet et actualisation de la valeur calculée sur dépendance fixe (`reactivity.test.mjs`).
- [x] `Effect` et `Computed` : dépendances imbriquées, exception dans un callback avec reprise et changement de signal pendant l'exécution (`reactivity.test.mjs`, décision dans `BLOCKERS.md`).
- [x] `Watcher` : injection d'un proxy à travers trois racines, propagation des changements et désabonnement après remplacement du dernier lien (`reactivity.test.mjs`).
- [x] `ElementExtension` : éléments et nœuds assignés à un slot par défaut (`element-extension.test.mjs`).
- [x] `ElementExtension` : élément actif à travers la racine shadow d'un WebComponent (`element-extension.test.mjs`).
- [x] `ElementExtension` : slot nommé imbriqué, slot absent et inclusion d'un descendant à travers une racine shadow (`element-extension.test.mjs`).
- [x] `DragAndDrop` : élément déclencheur, configuration des cibles et retrait des listeners à la destruction (`drag-and-drop.test.mjs`).
- [x] `DragAndDrop` : déplacement réel, dépôt sur une cible, ordre des callbacks et exigence de containment complet en mode strict (`drag-and-drop.test.mjs`).

## Tests à écrire

### Réactivité et états

- [x] Watcher : les proxys détachés continuent à notifier après retrait ou remplacement ; scénarios vérifiés dans `reactivity.test.mjs` et défaut consigné dans `BLOCKERS.md`.
- [x] Signal : désabonnement et ajout d'un abonné pendant notification ; le nouvel abonné ne reçoit que la prochaine révision (`signal.test.mjs`).
- [x] State et StateManager : hooks `onActivate`/`onInactivate` et veto de l'état actif retournant `false` sans notifier de transition (`state-manager.test.mjs`).

### Outils et valeurs

- [x] `Converter` : conversion selon `$schema` statique de `Data` et schéma fourni à `register()`, avec priorité du schéma enregistré par champ (`converter.test.mjs`).
- [x] `Converter` : schéma enregistré avec champs `date`, `datetime` et `time`, valeurs restaurées en `Aventus.Date`, `Aventus.DateTime` et `Aventus.Time` dans le bundle compilé sous Chromium (`RuntimeCalendar`, `compiled-project.test.mjs`).
- [x] `DateSettings` : configuration partielle, remplacement des formats, copies indépendantes et refus atomique des valeurs invalides (`date-settings.test.mjs`).
- [x] `Date`, `DateTime` et `Time` : opérations Temporal de base avec `temporal-polyfill` (`calendar-temporal.test.mjs`).
- [x] `Date`, `DateTime` et `Time` compilés : parsing, texte ISO, fuseau `Europe/Zurich` vers UTC, bornes du mois et de la semaine, écarts, comparaisons et entrées invalides (`RuntimeCalendar`, `compiled-project.test.mjs`).
- [x] `ActionGuard` : rejet partagé entre appels de même clé, libération de la clé et nouvel essai après rejet ou exception synchrone (`action-guard.test.mjs`).

### Composants et DOM

- [x] `TemplateInstance` : rendu initial et réordonnancement d'une boucle simple réactive, avec retrait des anciennes lignes et vidage de la collection (`template-bindings.test.mjs`).
- [x] `TemplateInstance` et `TemplateContext` : rendu de boucles imbriquées et nettoyage des lignes enfants après retrait d'un parent ou destruction du template (`template-bindings.test.mjs`).
- [x] `Template` : boucles simples et imbriquées, retrait et destruction vérifiés dans un DOM de référence ; nettoyage des conditions compilées vérifié, écart résiduel consigné dans `BLOCKERS.md` (`template-bindings.test.mjs`, `compiled-project.test.mjs`).

### Données, HTTP et intégrations


### Projet Aventus de référence : génération et exécution

- [x] Projet Aventus de référence : configuration, compilation par le CLI, sortie contenant une boucle simple et un binding bidirectionnel, chargement du bundle et enregistrement du composant (`fixtures/reference-project`, `compiled-project.test.mjs`).
- [x] Projet Aventus de référence : utilisation compilée des types `Enum`, `EnumValue`, `Constructor`, `AnyConstructor` et `StringLiteral` sans diagnostic du CLI (`fixtures/reference-project`, `compiled-project.test.mjs`).
- [x] Build du projet : réussite du CLI, nom de build, sortie fraîche dans une copie temporaire sans `dist` préexistant et enregistrement du composant (`compiled-project.test.mjs`).
- [x] Build du projet invalide : diagnostic et échec du rapport sans publier de sortie lors du premier build (`compiled-project.test.mjs`).
- [x] Build du projet : un échec de recompilation conserve la dernière sortie valide (`compiled-project.test.mjs`).
- [x] Révisions du projet : modifier la vue, la logique et le style dans la copie temporaire ; recompiler, vérifier que la nouvelle sortie reflète chaque changement et que l'ancienne définition ne subsiste pas (`compiled-project.test.mjs`).
- [x] Boucle `for...of` et `@bind` de `RuntimeList` dans Chromium via Playwright : rendu initial, mise à jour de `value`, saisie `input`/`change`, ajout et retrait d'items, retrait de l'instance du registre après destruction (`compiled-project.test.mjs`).
- [x] Après destruction de `RuntimeList` : retrait du registre, arrêt de l'effet du template et des événements du binding ; `remove(false)` conserve le binding actif (`compiled-project.test.mjs`).
- [x] Templates `for`, `for...in` et `for...of` : tableau, objet, boucle imbriquée et `@Context` ; indices/clés, ajout, retrait et destruction vérifiés, réordonnancement défaillant caractérisé dans `BLOCKERS.md` (`wc/loop.md`, `compiled-project.test.mjs`).
- [x] Projet compilé : la boucle `for` imbriquée expose les indices initiaux et nettoie ses lignes à la destruction ; `reverse` et `unshift` changent le modèle sans rafraîchir le DOM, cas caractérisé dans `BLOCKERS.md` (`RuntimeNested`, `compiled-project.test.mjs`).
- [x] Projet compilé : boucle `for...in` réactive au remplacement d'objet et à la mise à jour d'une valeur, avec ordre et clés vérifiés ; boucle `for...of` figée après `reverse` et `unshift`, cas consigné dans `BLOCKERS.md` (`RuntimeBranches`, `RuntimeList`, `compiled-project.test.mjs`).
- [x] Projet compilé : `for...in` sur objet avec ajout/suppression de clé, `if`/`else` basculé par clic, et boucle `for` imbriquée avec `@Context` ; ajout et retrait d'une entrée enfant sans recréer l'autre groupe, puis retrait du groupe parent (`compiled-project.test.mjs`).
- [x] Projet compilé : `@Watch` dans le template avec mutation profonde, remplacement et boucle ; `@Signal` avec mutation profonde sans notification puis remplacement ; `@Property` synchronisée avec son attribut dans les deux sens ; injection d'un proxy `Watcher` entre deux WebComponents et propagation dans les deux sens (`RuntimeReactivity`, `compiled-project.test.mjs`).
- [x] Projet compilé : interpolation réactive du texte et d'un attribut natif, sélection `@element` unique et multiple, et gestionnaire `@click` modifiant le modèle (`RuntimeMarkup`, `compiled-project.test.mjs`).
- [x] Projet compilé : injection réactive `:value` dans une propriété native (`RuntimeMarkup`, `compiled-project.test.mjs`).
- [x] Projet compilé : binding personnalisé `@bind_newVal:val` entre deux WebComponents, propriété enfant et callback remontant vers le parent (`RuntimeInput`, `RuntimeBinding`, `compiled-project.test.mjs`).
- [x] Projet compilé : `@Attribute` booléen et numérique, `@Property` chaîne avec callback, synchronisation champ/attribut dans les deux sens ; double notification du callback à l'initialisation consignée dans `BLOCKERS.md` (`RuntimeAttributes`, `compiled-project.test.mjs`).
- [x] Projet compilé : composant monofichier `.wc.avt`, slots par défaut et nommé, `postCreation` après `onReady` et `postDestruction` après `destructor` (`RuntimeSingle`, `compiled-project.test.mjs`).
- [x] Projet compilé : `@StateActive`, `@StateInactive`, `@StateChange`, `@DefaultStateActive` et `@DefaultStateInactive`, extraction d'un slug numérique et désabonnement après destruction (`RuntimeState`, `RuntimeStateManager`, `compiled-project.test.mjs`).
- [x] Projet compilé : héritage de composant, remplacement d'un slot nommé par `<block>`, préservation d'un autre slot et surcharge CSS locale par le style enfant (`RuntimeBase`, `RuntimeDerived`, `compiled-project.test.mjs`).
- [x] Projet compilé : `@OverrideView()` remplace entièrement la vue parente, conserve le slot nommé et la propriété `@Property` héritée avec mise à jour réactive (`RuntimeOverride`, `compiled-project.test.mjs` ; `wc/create.md`).
- [x] Projet compilé : `@TagName` enregistre le composant sous son nom personnalisé et son template s'affiche dans le DOM (`RuntimeNamed`, `compiled-project.test.mjs`).
- [x] Templates `if`/`else` compilés : branches imbriquées, alternance de quatre états, retrait des branches précédentes et nettoyage après destruction (`RuntimeBranches`, `compiled-project.test.mjs` ; `wc/condition.md`).
- [x] Interpolation et injection compilées : valeurs initiales et `null`, mises à jour réactives du texte et de la propriété native, suppression du DOM après destruction (`RuntimeMarkup`, `compiled-project.test.mjs` ; `wc/interpolation.md`, `wc/injection.md`).
- [x] Sélection d'éléments et événements compilés : `@element` unique et multiple, événement DOM `@click`, événement `Aventus.Callback` d'un enfant et retrait des écouteurs après destruction (`RuntimeMarkup`, `RuntimeBinding`, `compiled-project.test.mjs` ; `wc/element.md`, `wc/event.md`).
- [x] Bindings compilés : propriété native et enfant, événement personnalisé `keyup`, callback personnalisé `newVal`, synchronisation dans les deux sens et absence de notification après destruction (`RuntimeInput`, `RuntimeBinding`, `compiled-project.test.mjs` ; `wc/binding.md`).
- [x] WebComponent compilé : propriétés et attributs typés, `@Watch`, `@Signal`, état local, slots/blocs, héritage et cycle `postCreation`/`postDestruction` vérifiés dans les cas détaillés ci-dessus (`wc/property.md`, `attribute.md`, `watch.md`, `signal.md`, `state.md`, `create.md`, `inheritance.md`).
- [x] Styles de composant compilés : style local et hérité, feuille externe `@Utility`, variable CSS modifiée depuis l'hôte et thème global `.gs.avt` compilé en CSS puis appliqué dans Chromium (`RuntimeBase`, `RuntimeDerived`, `RuntimeStyled`, `static/theme.gs.avt`, `compiled-project.test.mjs` ; `wc/style.md`).
- [x] Fichiers statiques : HTML copié tel quel, Sass principal compilé en CSS avec une variable d'un partiel `_palette.scss`, aucun fichier Sass ni CSS du partiel exporté (`cases/static-assets`, `compiled-project.test.mjs` ; `config/static.md`).
- [x] `avoidParsingInsideTags` : une interpolation et une directive `@element` restent littérales dans `<av-code>`, tandis que l'interpolation voisine se met à jour après mutation ; la liste au niveau du build remplace celle du projet (`cases/avoid-tag`, `compiled-project.test.mjs` ; `config/basic_prop.md`, `config/build.md`).
- [x] `Data` compilé et `@Convertible` : génération de `Fullname`, `$type`, `$schema`, sérialisation, restauration selon le schéma et clonage typés (`RuntimePerson`, `RuntimeConvertible`, `compiled-project.test.mjs` ; `data/create.md`, `lib/converter.md`).
- [x] Classes calendrier compilées : date intercalaire, ajout et comparaison, heure passant minuit, instant avec décalage normalisé en UTC et entrée invalide (`RuntimeCalendar`, `compiled-project.test.mjs`).
- [x] RAM compilée : sous-classe `.ram.avt` complète, singleton et opérations create/get/update/delete avec identité et événements ; exemple minimal documenté refusé avec diagnostic vérifié et consigné dans `BLOCKERS.md` (`RuntimePerson.ram.avt`, `cases/documented-ram`, `compiled-project.test.mjs`).
- [x] Mixin RAM compilé : type intersection `Data & interface`, constructeur étendu renvoyé par `getTypeForData`, méthode disponible après création, lecture et mise à jour sans perdre l'identité (`RuntimePersonExtended.ram.avt`, `compiled-project.test.mjs` ; `ram/mixin.md`).
- [x] Opérations RAM de liste compilées : `createList`, `getByIds`, `getList`, `getAll`, `getRecords`, `getWithError`, `updateList` et `deleteList`, avec ordre et identité vérifiés ; forme de `getAll` divergente de `ram/crud.md` consignée dans `BLOCKERS.md` (`compiled-project.test.mjs`).
- [x] `Animation` : référence compilée, mais constructeur absent du bundle et appel en échec, cas caractérisé dans `BLOCKERS.md` (`RuntimeAnimation`, `compiled-project.test.mjs` ; `lib/animation.md`).
- [x] `ResizeObserver` compilé : wrapper présent dans le bundle, notifications de largeur initiale et modifiée reçues sur la bonne cible dans Chromium (`RuntimeResize`, `compiled-project.test.mjs` ; `lib/resize_observer.md`).
- [x] `DragAndDrop` compilé : déplacement réel d'un élément vers une cible dans Chromium, callbacks `start`, `move`, `drop` et `stop`, puis destruction du gestionnaire (`RuntimeDrag`, `compiled-project.test.mjs` ; `lib/drag_and_drop.md`).
- [x] Alias d'import configuré dans `aventus.conf.avt` : `@/RuntimeFunction.lib.avt` résout une fonction et un enum du projet, exécutés dans Chromium (`RuntimeAlias`, `compiled-project.test.mjs` ; `advanced/template.md`).
- [x] `compile.input` dans la configuration du build : seul le point d'entrée sélectionné et sa dépendance par alias sont émis ; un composant sans lien est absent et la sortie s'exécute (`compiled-project.test.mjs` ; `config/build.md`).
- [x] Sortie `compile.compressed` : le JavaScript produit est plus petit que la sortie normale et reste exécutable dans Chromium (`compiled-project.test.mjs` ; `config/build.md`).
- [x] `outsideModule` : build réussi mais exports émis après fermeture de la portée de registration, symboles global et modulaire absents dans Chromium ; cas consigné dans `BLOCKERS.md` (`compiled-project.test.mjs` ; `config/build.md`).
- [x] `build.disabled` : rapport CLI réussi sans produire le JavaScript du build désactivé (`compiled-project.test.mjs` ; `config/build.md`).
- [x] `compile.package` : fichier `.package.avt` généré avec déclaration et métadonnées source du point d'entrée, sans composant non sélectionné (`compiled-project.test.mjs` ; `config/build.md`).
- [x] `compile.outputNpm` avec `live` et `packageJson` : fichiers `index.js`, `index.d.ts`, `package.json` générés ; import ESM du namespace et appel de la fonction exportée (`compiled-project.test.mjs` ; `config/build.md`, `advanced/npm_export.md`).
- [x] Métadonnées `version` et `organization` surchargées par le build : version et auteur du `package.json` npm vérifiés avec l'import ESM (`compiled-project.test.mjs` ; `config/basic_prop.md`, `config/build.md`).
- [x] Métadonnée `description` : valeur du projet reprise dans `.package.avt`, puis remplacée par celle du build lors d'une nouvelle compilation (`compiled-project.test.mjs` ; `config/basic_prop.md`, `config/build.md`).
- [x] `compile.outputNpm.manifest: true` : génération de `custom-elements.json`, `vscode.html-custom-data.json`, `web-types.json` et `emmet/snippets.json`, avec le tag du WebComponent sélectionné présent dans les trois manifestes principaux (`compiled-project.test.mjs` ; `config/build.md`).
- [x] Dépendance prédéfinie `Aventus@UI` : configuration `dependencies`, import de `ProgressCircle` depuis `Aventus@UI:Aventus.package.avt`, inclusion du composant requis, enregistrement et rendu SVG dans Chromium (`cases/ui-dependency`, `compiled-project.test.mjs` ; `config/lib.md`, `ui/introduction.md`).
- [x] `Aventus.Collapse` importé du package UI : rendu du composant, deux pressions sur l'en-tête et synchronisation de l'attribut booléen `open` dans Chromium (`cases/ui-dependency`, `compiled-project.test.mjs` ; `ui/collapse.md`).
- [x] Formulaire UI compilé : `FormHandler` avec `Required` et `Email`, validation directe et par schéma, retour des erreurs via `onValidation`, édition du modèle et `reset()` ; pertes des erreurs sans abonné et état initial muté consignés dans `BLOCKERS.md` (`cases/ui-dependency`, `compiled-project.test.mjs` ; `ui/form.md`).
- [x] Navigation UI compilée : `Link` et `RouterStateManager` importés, ancre interne rendue, transition vers `/home` et classe `active` vérifiées après initialisation différée (`cases/ui-dependency`, `compiled-project.test.mjs` ; `ui/link.md`).
- [x] Notifications UI compilées : sous-classe de `ToastElement`, configuration de `ToastManager`, affichage du message, fermeture manuelle et fermeture différée avec retrait du DOM (`cases/ui-toast`, `cases/ui-dependency`, `compiled-project.test.mjs` ; `ui/toast.md`).
- [x] Utilitaire UI `Process` compilé : extraction du succès et transmission de l'erreur au gestionnaire configuré (`cases/ui-dependency`, `compiled-project.test.mjs` ; `ui/process.md`).
- [x] `ShortcutManager` du package UI compilé : combinaison Ctrl+S, remplacement temporaire et restauration, ordre des touches normalisé, callback conditionnel renvoyant `false`, prévention du comportement par défaut configurable avec `setAutoPrevents` et désabonnement vérifiés par événements clavier dans Chromium (`cases/ui-dependency`, `compiled-project.test.mjs` ; `ui/shortcut.md`).
- [x] `Img` du package UI compilé : template présent, absence de `ResourceLoader` entraînant une erreur de chargement SVG, puis rendu SVG réussi après injection d'un chargeur simulé ; écart consigné dans `BLOCKERS.md` (`cases/ui-dependency`, `compiled-project.test.mjs` ; `ui/image.md`).
- [x] `Row`/`Col` du package UI compilés : ligne créée par HTML et deux colonnes de moitié de largeur, points de rupture `xs`/`md`/`lg` validés selon le viewport et selon un conteneur CSS, décalages gauche/droite et centrage vérifiés, création programmatique de la ligne refusée par Chromium et `size=0` ne masquant pas la colonne ; deux écarts consignés dans `BLOCKERS.md` (`cases/ui-dependency`, `compiled-project.test.mjs` ; `ui/col_row.md`).
- [x] Dépendance `dependencies` au niveau racine : package UI importé et composant enregistré dans un build qui hérite de cette option (`cases/ui-dependency`, `compiled-project.test.mjs` ; `config/lib.md`).
- [x] Clé `dependances` au niveau racine telle que documentée dans `config/lib.md` : le CLI rend `success: true` mais omet tous les builds et toute sortie ; variante `build[0].dependencies` compilée et exécutée, écart consigné dans `BLOCKERS.md` (`cases/ui-dependency`, `compiled-project.test.mjs`).
- [x] Surcharges de build `module` et `componentPrefix` : namespace du build, nom de build, tag du WebComponent, enregistrement et rendu des lignes vérifiés dans Chromium (`compiled-project.test.mjs` ; `config/build.md`).
- [x] `namespaceStrategy` avec `followFolders`, `followFoldersCamelCase` et `rules` : classe de sous dossier compilée mais exportée à la racine du module dans les trois cas ; écart consigné dans `BLOCKERS.md` (`RuntimeNamespace`, `compiled-project.test.mjs` ; `config/build.md`).
- [x] `@Debugger({ enableWatchHistory: true })` compilé : historique initial et mutation `@Watch` accessibles ; `clearWatchHistory()` vide l'historique puis lance une exception, consignée dans `BLOCKERS.md` (`RuntimeReactivity`, `compiled-project.test.mjs` ; `wc/create.md`).
- [x] Types de fichiers du LSP : `.static.avt` injecté et exécuté une seule fois dans le bundle ; `.def.avt` associé utilisé comme déclaration sans être émis en JavaScript (`RuntimeStatic`, `compiled-project.test.mjs`).
- [x] Utilitaires compilés : `compareObject` avec tableau ordonné et non ordonné, `getValueFromObject`/`setValueToObject` sur chemin imbriqué, et `Json.classToJson`/`classFromJson` ; option d'ordre perdue sur un tableau imbriqué consignée dans `BLOCKERS.md` (`RuntimeTools`, `compiled-project.test.mjs` ; `lib/compare_object.md`, `lib/value_from_object.md`, `lib/json.md`).
- [x] Utilitaire `Mutex` compilé : trois tâches asynchrones concurrentes exécutées séquentiellement via `safeRunAsync` (`RuntimeTools`, `compiled-project.test.mjs` ; `lib/mutex.md`).
- [x] Conteneurs d'erreur compilés : `GenericError`, `VoidWithError` et `ResultWithError`, succès/échec, code d'erreur, extraction et arrêt d'une chaîne après échec (`RuntimeErrors`, `compiled-project.test.mjs` ; `error/generic.md`, `error/void.md`, `error/result.md`).
- [x] Fonctions documentées `uuidv4` et `sleep` : références compilées mais fonctions absentes du bundle, caractérisées dans `RuntimeTools` et consignées dans `BLOCKERS.md` (`lib/uuid.md`, `lib/sleep.md`).
- [x] `Callback` compilé : ordre, retour des abonnés, doublons ignorés, retrait et nettoyage ; `CallbackGroup` référence compilée mais constructeur absent du bundle, consigné dans `BLOCKERS.md` (`RuntimeCallbackLibrary`, `compiled-project.test.mjs` ; `lib/callback.md`).
- [x] Fichier `.lib.avt` : fonction racine, constante et enum exportées, accessibles et exécutables depuis le bundle ; constante autorisée malgré l'interdiction documentée, cas consigné dans `BLOCKERS.md` (`RuntimeFunction`, `compiled-project.test.mjs` ; `lib/create.md`).
- [x] Réexport `export { … } from "…"` dans une bibliothèque : diagnostic d'interdiction du parseur vérifié sans sortie publiée (`cases/re-export`, `compiled-project.test.mjs` ; `server/src/language-services/ts/parser/ParserTs.ts`).
- [x] Décorateurs de classe compilés : `@Internal()` masque l'export public mais permet l'usage interne ; `@Dependencies()` compile sans inclure `CallbackGroup` depuis la bibliothèque de base ; `@Required()` sur classe et l'orthographe documentée `@Dependances` produisent des diagnostics, consignés dans `BLOCKERS.md` (`RuntimeDecorators`, `cases/required-class`, `cases/dependances-doc`, `cases/callback-dependency`, `compiled-project.test.mjs` ; `wc/create.md`).
- [x] HTTP compilé : sous-classes `HttpRouter` et `HttpRoute`, URL de base et préfixe, `@BindThis` sur une méthode détachée, POST JSON et décodage du résultat dans Chromium avec transport simulé (`RuntimeHttp.lib.avt`, `compiled-project.test.mjs` ; `http/router.md`, `http/route.md`).
- [x] HTTP compilé : `queryTxt`, `queryBlob`, `queryVoid` sur réponse 204 et erreur de statut 503, avec URL et méthode vérifiées par transport simulé dans Chromium (`RuntimeHttp.lib.avt`, `compiled-project.test.mjs` ; `http/request.md`).
- [x] HTTP compilé : hooks globaux `beforeSend` et `responseMiddleware` exécutés autour du transport, en-tête ajouté et ordre vérifié (`RuntimeHttp.lib.avt`, `compiled-project.test.mjs` ; `http/request.md`).
- [x] I18n compilé : fichiers globaux et de composant exportés par locale, paramètres interpolés et changement réactif de langue dans Chromium ; absence de `ResourceLoader` dans le bundle et échec de `autoRegister: true` consignés dans `BLOCKERS.md` (`@Messages.i18n.avt`, `RuntimeMarkup.i18n.avt`, `compiled-project.test.mjs` ; `i18n/config.md`, `i18n/usage.md`).
- [x] Directives `PressManager` compilées : `@press`, début/fin, drag, double pression et pression longue avec délais ; callbacks et retrait des écouteurs après destruction (`RuntimePress`, `compiled-project.test.mjs` ; `lib/press_manager.md`).
- [x] Projet compilé : callbacks `@Watch` avec actions `CREATED`, `UPDATED`, `DELETED`, chemins complets et valeurs ; callback `@Signal` déclenché sur affectation, pas sur mutation profonde (`RuntimeCallbacks`, `compiled-project.test.mjs`).
