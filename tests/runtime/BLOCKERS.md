# Points à analyser pour les tests du runtime



- **Changement de signal pendant un `Effect`.** Si le callback d'un effet modifie un signal qu'il vient de lire, l'effet ignore la notification pendant sa propre exécution et ne se relance pas pour cette nouvelle valeur. Le prochain changement externe le relance normalement. Le test `reactivity.test.mjs` caractérise ce résultat ; décider si un second passage doit être programmé après l'exécution courante.
