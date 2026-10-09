# Commit Helper

Un bouton dans la barre de titre de la vue Source Control (juste au-dessus du champ de message de commit) qui ouvre un assistant :

1. Type de commit (`feat`, `fix`, `hotfix`, `release`, `chore`, `refactor`, `test`, `docs`, `build`, `ci`)
2. Carte Mantis : le numéro est pris automatiquement dans le nom de la branche (ex. `feat/6678_user_fidelity` → `6678`). S'il n'y est pas, l'assistant demande l'URL (ex. `http://bugtracker.retailandco.com/view.php?id=6478` → `6478`) ou le numéro
3. Commentaire
4. Liste des fichiers modifiés (fichiers indexés si présents, sinon fichiers modifiés) : ajoutée automatiquement par défaut ; si l'option est décochée dans les paramètres, l'assistant pose la question

Le résultat est écrit dans le champ de message. Exemple :

```
feat(#6478): ajout du filtre par date

Modified Files :
- src/filters.ts
- src/app.ts
```

## Configuration

- `commitHelper.format` : défaut `{type}(#{mantis}): {message}` (ex. `{type}: #{mantis} {message}`)
- `commitHelper.types` : liste des types proposés
- `commitHelper.includeFilesByDefault` : coché par défaut (fichiers ajoutés sans question) ; décoché, l'assistant demande
- `commitHelper.branchPattern` : regex de détection du numéro Mantis dans la branche (1er groupe = numéro)

## Test en développement

1. Ouvrir ce dossier dans VS Code
2. Appuyer sur `F5` (fenêtre « Extension Development Host »)
3. Ouvrir un dépôt Git, aller dans Source Control : le bouton est dans le champ de message

## Installation permanente

```bash
npm install -g @vscode/vsce
vsce package
code --install-extension commit-helper-0.1.3.vsix
```
