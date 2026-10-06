# Commit Helper

Un bouton dans la barre de titre de la vue Source Control (juste au-dessus du champ de message de commit) qui ouvre un assistant :

1. Type de commit (`feat`, `fix`, `hotfix`, `release`, `chore`, `refactor`, `test`, `docs`, `build`, `ci`)
2. URL de la carte Mantis ou numéro (ex. `http://bugtracker.retailandco.com/view.php?id=6478` → `6478`)
3. Commentaire
4. Case à cocher : ajouter la liste des fichiers modifiés (fichiers indexés si présents, sinon fichiers modifiés)

Le résultat est écrit dans le champ de message. Exemple :

```
feat(#6478): ajout du filtre par date

Modified files :
- src/filters.ts
- src/app.ts
```

## Configuration

- `commitHelper.format` : défaut `{type}(#{mantis}): {message}` (ex. `{type}: #{mantis} {message}`)
- `commitHelper.types` : liste des types proposés

## Test en développement

1. Ouvrir ce dossier dans VS Code
2. Appuyer sur `F5` (fenêtre « Extension Development Host »)
3. Ouvrir un dépôt Git, aller dans Source Control : le bouton est dans le champ de message

## Installation permanente

```bash
npm install -g @vscode/vsce
vsce package
code --install-extension commit-helper-0.1.1.vsix
```
