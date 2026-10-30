# Cas serveur en attente de changement de code

Ce fichier conserve les cas reproductibles rencontrés pendant l'écriture des tests. Les changements de `server/src` pour ces points sont décidés avec l'utilisateur, un par un.

## Note hors périmètre des tests serveur

- `client/src/cmds/Rename.ts` transmet `item.oldUri` dans le champ `newUri` de la commande `aventus.rename`. À traiter plus tard avec les tests du client VS Code ; ne pas modifier le client pendant cette passe.

## Renommage de fichiers hors TypeScript : aucune édition de références

- Reproduction automatisée : `project-rename-non-ts-round194.test.mjs` transmet aux deux projets des déplacements de vues, styles, fichiers SCSS, HTML et JSON. Aucun ne produit d'édition ni n'appelle le service de renommage TypeScript ; un fichier `.lib.avt` placé après un style dans le même lot produit bien les éditions attendues.
- Source : `Build.onRename()` ne traite que les cinq extensions TypeScript Aventus et retourne un résultat vide pour les autres fichiers.
- Décision à prendre : préciser quelles références de vues et de styles doivent être actualisées lors d'un déplacement, puis ajouter des cas réels avant de modifier le routage du renommage.

## Multiplication de deux couleurs valides

- Reproduction automatisée : `color-info-composition-round290.test.mjs` appelle `ColorInfo.multiply()` avec deux couleurs RGB valides. La méthode extrait `r1`, `g1`, `b1` et `r2`, `g2`, `b2` d'objets qui exposent `r`, `g`, `b` ; elle transmet donc `NaN` à `fromRgb()` et lève `Color values out of bounds`.
- Décision à prendre : confirmer que la multiplication doit produire le produit canal par canal, puis lire les noms de propriétés réellement renvoyés par `toRgb()`.

## Catégories serveur encore ouvertes dans TODO.md

- **Commandes build, npm, Storybook et sortie statique (ligne 540)** : `build-command-unlisted-selection-round213.test.mjs` démontre que les quatre commandes acceptent une cible qui n'était pas dans les choix proposés. Définir si le choix doit être limité à la liste affichée et appliquer ce contrat aux quatre commandes.
- **Exports Sharp/PHP (ligne 541)** : `converter-output-concurrency-round99.test.mjs` démontre que deux échecs laissent l'état client à `compiling`. Définir l'état terminal de chaque export et les conventions de sortie avant de considérer tous les échecs couverts.
- **Stories et MDX (ligne 562)** : `storybook-description-interpolation-round130.test.mjs` démontre qu'un JSDoc contenant `${name}` devient une interpolation dans la story. Échapper le texte utilisateur avant de clore la génération complète.
