const vscode = require('vscode');

/** Extrait le numéro Mantis depuis une URL (…view.php?id=6478) ou un nombre brut. */
function parseMantisId(input) {
  const value = (input || '').trim();
  if (!value) return '';
  const fromUrl = value.match(/[?&]id=(\d+)/i);
  if (fromUrl) return fromUrl[1];
  const fromNumber = value.match(/^#?(\d+)$/);
  if (fromNumber) return fromNumber[1];
  return null; // format invalide
}

function getRepository(arg) {
  const gitExt = vscode.extensions.getExtension('vscode.git');
  if (!gitExt) return undefined;
  const api = gitExt.exports.getAPI(1);
  if (arg && arg.rootUri) {
    const match = api.repositories.find(
      (r) => r.rootUri.toString() === arg.rootUri.toString()
    );
    if (match) return match;
  }
  return api.repositories[0];
}

/** Fichiers du commit : ceux indexés s'il y en a, sinon ceux modifiés. */
function getChangedFiles(repo) {
  const staged = repo.state.indexChanges;
  const changes = staged.length ? staged : repo.state.workingTreeChanges;
  return changes.map((c) => vscode.workspace.asRelativePath(c.uri, false));
}

async function openHelper(arg) {
  const repo = getRepository(arg);
  if (!repo) {
    vscode.window.showErrorMessage('Commit Helper : aucun dépôt Git trouvé.');
    return;
  }

  const config = vscode.workspace.getConfiguration('commitHelper');
  const types = config.get('types');
  const format = config.get('format');

  // 1. Type de commit
  const type = await vscode.window.showQuickPick(types, {
    title: 'Commit Helper (1/4) — Type de commit',
    placeHolder: 'Choisis le type de commit',
  });
  if (!type) return;

  // 2. Carte Mantis (URL ou numéro, optionnel)
  const mantisInput = await vscode.window.showInputBox({
    title: 'Commit Helper (2/4) — Carte Mantis',
    prompt: 'URL Mantis ou numéro (laisser vide pour ignorer)',
    placeHolder: 'http://bugtracker.retailandco.com/view.php?id=6478',
    validateInput: (v) =>
      parseMantisId(v) === null
        ? 'Format invalide : colle une URL contenant ?id=XXXX ou un numéro.'
        : undefined,
  });
  if (mantisInput === undefined) return;
  const mantis = parseMantisId(mantisInput);

  // 3. Commentaire
  const message = await vscode.window.showInputBox({
    title: 'Commit Helper (3/4) — Commentaire',
    prompt: 'Description du commit',
    validateInput: (v) => (v.trim() ? undefined : 'Le commentaire est requis.'),
  });
  if (message === undefined) return;

  // 4. Case à cocher : lister les fichiers modifiés
  const options = await vscode.window.showQuickPick(
    [{ label: 'Ajouter la liste des fichiers modifiés au message', id: 'files' }],
    {
      title: 'Commit Helper (4/4) — Options',
      placeHolder: 'Coche l\'option si besoin, puis valide avec Entrée',
      canPickMany: true,
    }
  );
  if (options === undefined) return;
  const withFiles = options.some((o) => o.id === 'files');

  // Construction du message
  let title = format
    .replace('{type}', type)
    .replace('{message}', message.trim())
    .replace('{mantis}', mantis || '');

  // Si pas de numéro Mantis, on retire les parenthèses/dièse orphelins
  if (!mantis) {
    title = title.replace(/\(#\)/g, '').replace(/#(?=\s|$)/g, '').replace(/\s{2,}/g, ' ').replace(/:\s*:/, ':').trim();
  }

  let result = title;
  if (withFiles) {
    const files = getChangedFiles(repo);
    if (files.length) {
      result += '\n\nModified Files :\n' + files.map((f) => `- ${f}`).join('\n');
    }
  }

  repo.inputBox.value = result;
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('commitHelper.open', openHelper)
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
