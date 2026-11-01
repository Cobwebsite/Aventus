# Projet Aventus de référence pour le runtime

Ce projet minimal associe une boucle `for...of` et un binding bidirectionnel dans `RuntimeList`. Le test `tests/runtime/compiled-project.test.mjs` en fait une copie temporaire, lance le CLI du dépôt, vérifie la sortie et supprime la copie après exécution.

Les tests de rendu exécutent le bundle compilé dans Chromium avec Playwright. Avant le premier `npm run test:runtime`, installer le navigateur avec `npm run test:runtime:install-browser`.

Pour inspecter manuellement le JavaScript généré depuis ce dossier :

```powershell
node ../../../../cli/out/cli.js build aventus.conf.avt --json
```

La sortie est `dist/runtime-reference.js`. Ne pas modifier ce fichier généré ; modifier les fichiers `.avt` du projet de référence puis relancer la compilation.
