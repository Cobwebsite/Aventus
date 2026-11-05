# Points à analyser pour les tests du runtime



- **Référence partagée dans un modèle `Watcher`.** Si `left` et `right` référencent le même sous-objet, modifier `left.count` actualise aussi `right.count`, mais ne notifie que `left.count` ; modifier par `right` ne notifie que `right.count`. Après suppression de `left`, `right` continue de fonctionner. Le test `reactivity.test.mjs` caractérise ces chemins ; décider si tous les chemins qui pointent vers la même donnée doivent être notifiés.
- **Changement de signal pendant un `Effect`.** Si le callback d'un effet modifie un signal qu'il vient de lire, l'effet ignore la notification pendant sa propre exécution et ne se relance pas pour cette nouvelle valeur. Le prochain changement externe le relance normalement. Le test `reactivity.test.mjs` caractérise ce résultat ; décider si un second passage doit être programmé après l'exécution courante.
