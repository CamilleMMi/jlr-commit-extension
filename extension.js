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

/**
 * Cherche le numéro Mantis dans le nom de la branche, ex. "feat/6678_user_fidelity" -> "6678".
 * `pattern` est une regex dont le 1er groupe capturant est le numéro.
 */
function extractMantisFromBranch(branchName, pattern) {
  if (!branchName) return '';
  try {
    const match = new RegExp(pattern).exec(branchName);
    return match && match[1] ? match[1] : '';
  } catch (e) {
    return ''; // regex invalide dans les paramètres : on ignore la détection
  }
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
  const includeFilesByDefault = config.get('includeFilesByDefault');

  // Numéro Mantis détecté dans le nom de la branche (si possible)
  const branch = repo.state.HEAD && repo.state.HEAD.name;
  let mantis = extractMantisFromBranch(branch, config.get('branchPattern'));
  const askMantis = !mantis;
  const askFiles = !includeFilesByDefault;

  // Nombre d'étapes affichées à l'utilisateur
  const total = 2 + (askMantis ? 1 : 0) + (askFiles ? 1 : 0);
  let step = 0;
  const stepTitle = (label) => `Commit Helper (${++step}/${total}) — ${label}`;

  // Type de commit
  const type = await vscode.window.showQuickPick(types, {
    title: stepTitle('Type de commit'),
    placeHolder: 'Choisis le type de commit',
  });
  if (!type) return;

  // Carte Mantis : uniquement si absente du nom de la branche
  if (askMantis) {
    const mantisInput = await vscode.window.showInputBox({
      title: stepTitle('Carte Mantis'),
      prompt: 'URL Mantis ou numéro (laisser vide pour ignorer)',
      placeHolder: 'http://bugtracker.retailandco.com/view.php?id=6478',
      validateInput: (v) =>
        parseMantisId(v) === null
          ? 'Format invalide : colle une URL contenant ?id=XXXX ou un numéro.'
          : undefined,
    });
    if (mantisInput === undefined) return;
    mantis = parseMantisId(mantisInput);
  }

  // Commentaire
  const message = await vscode.window.showInputBox({
    title: stepTitle('Commentaire'),
    prompt: mantis && !askMantis
      ? `Description du commit — Mantis #${mantis} (détecté depuis la branche "${branch}")`
      : 'Description du commit',
    validateInput: (v) => (v.trim() ? undefined : 'Le commentaire est requis.'),
  });
  if (message === undefined) return;

  // Liste des fichiers : automatique si l'option est cochée, sinon on demande
  let withFiles = includeFilesByDefault;
  if (askFiles) {
    const options = await vscode.window.showQuickPick(
      [{ label: 'Ajouter la liste des fichiers modifiés au message', id: 'files' }],
      {
        title: stepTitle('Options'),
        placeHolder: "Coche l'option si besoin, puis valide avec Entrée",
        canPickMany: true,
      }
    );
    if (options === undefined) return;
    withFiles = options.some((o) => o.id === 'files');
  }

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

module.exports = { activate, deactivate, extractMantisFromBranch, parseMantisId };
