// ═══════════════════════════════════════════════════════════════
// RÉPARATION DES CARACTÈRES CORROMPUS (mojibake)
// ═══════════════════════════════════════════════════════════════
//
//   Usage :
//     node scripts/fix-mojibake.mjs --check        (rapport seul)
//     node scripts/fix-mojibake.mjs                (réécrit les fichiers)
//     node scripts/fix-mojibake.mjs src/foo.tsx    (fichiers ciblés)
//
//   Le texte a été encodé plusieurs fois en UTF-8 puis relu en
//   Latin-1/CP1252 : « é » est devenu « Ã© », « € » est devenu
//   « â‚¬ », etc. On corrige en trois passes :
//     1. table explicite des séquences connues (symboles, emojis),
//     2. ré-encodage Latin-1 → UTF-8 des zones 100 % Latin-1
//        (répété, ce qui absorbe le triple encodage),
//     3. nettoyage des séparateurs de commentaires décoratifs.
// ═══════════════════════════════════════════════════════════════

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DEFAULT_TARGETS = ['src'];

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.md', '.rs']);
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', 'target', '.git', '.tmp', 'coverage']);
const IGNORED_FILE = /\.(backup|bak|before_|orig|old)/i;

// ─── 1. Séquences connues (les plus fréquentes) ────────────────
const EXPLICIT = new Map(Object.entries({
  'â‚¬': '€', 'â‚¦': '₦', 'â‚¿': '₿', 'Â£': '£', 'Â¥': '¥', 'Â©': '©', 'Â®': '®',
  'Â°': '°', 'Â±': '±', 'Â½': '½', 'Â¼': '¼', 'Â·': '·', 'Â«': '«', 'Â»': '»',
  'â€“': '–', 'â€”': '—', 'â€•': '―', 'â€œ': '“', 'â€': '”', 'â€™': '’',
  'â€š': '‚', 'â€¦': '…', 'â€¹': '‹', 'â€º': '›', 'â€ž': '„',
  'â‰ˆ': '≈', 'â‰¤': '≤', 'â‰¥': '≥', 'â‰ ': '≠', 'âˆž': '∞',
  'â†’': '→', 'â†←': '←', 'â†“': '↓', 'â†‘': '↑', 'â†”': '↔', 'â‡’': '⇒', 'â‡’': '⇒',
  'â—†': '◆', 'â—‡': '◇', 'â—‹': '○', 'â— ': '●', 'âœ“': '✓', 'âœ”': '✔',
  'âœ…': '✅', 'âŒ': '⌘', 'âš ï¸': '⚠️', 'âš ï¸': '⚠️', 'âš™ï¸': '⚙️', 'âš¡': '⚡',
  'â­': '⭐', 'â­': '⭐',
  'ðŸ”’': '🔒', 'ðŸ”“': '🔓', 'ðŸ“¤': '📤', 'ðŸ“¥': '📥', 'ðŸš€': '🚀',
  'ðŸ“Š': '📊', 'ðŸ“ˆ': '📈', 'ðŸ“‰': '📉', 'ðŸ’°': '💰', 'ðŸ’³': '💳',
  'ðŸ’±': '💱', 'ðŸ’Ž': '💎', 'ðŸŽ': '🎁', 'ðŸ¦': '🏦', 'ðŸ ': '🏠',
  'ðŸ›¡ï¸': '🛡️', 'ðŸ›¡': '🛡️', 'ðŸ‘¤': '👤', 'ðŸ‘¥': '👥', 'ðŸš¨': '🚨',
  'ðŸš«': '🚫', 'ðŸ”´': '🔴', 'ðŸŸ¢': '🟢', 'ðŸ”µ': '🔵', 'â•—': '═',
  'â”€': '─', 'â”‚': '│', 'â”œ': '├', 'â”¤': '┤', 'â—': '—',
}));

const SUSPICIOUS = ['Ã', 'Â', 'â', 'ð', 'Ô', '┬', '├', 'Å', 'Ë', 'ï¸', '\uFFFD', '\u0080', '\u0090', '\u009F'];

function score(text) {
  let n = 0;
  for (const marker of SUSPICIOUS) {
    for (let i = text.indexOf(marker); i !== -1; i = text.indexOf(marker, i + marker.length)) n += 1;
  }
  return n;
}

// Les fichiers ont été relus en CP1252 (et non en Latin-1) : les octets
// 0x80-0x9F y sont devenus € ‚ ƒ „ … † ‡ ˆ ‰ Š ‹ Œ Ž ‘ ’ “ ” • – — ˜ ™ š › œ ž Ÿ.
// Il faut donc les reconvertir en octets avant de redécoder en UTF-8.
const CP1252_REV = new Map([
  ['€', 0x80], ['‚', 0x82], ['ƒ', 0x83], ['„', 0x84], ['…', 0x85], ['†', 0x86],
  ['‡', 0x87], ['ˆ', 0x88], ['‰', 0x89], ['Š', 0x8a], ['‹', 0x8b], ['Œ', 0x8c],
  ['Ž', 0x8e], ['‘', 0x91], ['’', 0x92], ['“', 0x93], ['”', 0x94], ['•', 0x95],
  ['–', 0x96], ['—', 0x97], ['˜', 0x98], ['™', 0x99], ['š', 0x9a], ['›', 0x9b],
  ['œ', 0x9c], ['ž', 0x9e], ['Ÿ', 0x9f],
]);

/** Reconstitue les octets d'origine d'une zone, ou null si impossible. */
function toOriginalBytes(run) {
  const bytes = [];
  for (const ch of run) {
    const cp = ch.codePointAt(0);
    if (cp <= 0xff) bytes.push(cp);
    else if (CP1252_REV.has(ch)) bytes.push(CP1252_REV.get(ch));
    else return null;
  }
  return Buffer.from(bytes);
}

/** Répare une zone qui provient d'un texte UTF-8 relu en Latin-1/CP1252. */
function repairLatin1Run(run) {
  let current = run;
  for (let pass = 0; pass < 4; pass += 1) {
    const bytes = toOriginalBytes(current);
    if (!bytes) break;
    const decoded = bytes.toString('utf8');
    if (decoded === current || decoded.includes('\uFFFD')) break;
    // Refuse les résultats contenant des caractères de contrôle bruts.
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(decoded)) break;
    current = decoded;
  }
  return score(current) < score(run) ? current : run;
}

function repairText(input) {
  let text = input;

  // Passe 1 — table explicite (du plus long au plus court).
  const entries = [...EXPLICIT.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [bad, good] of entries) {
    if (text.includes(bad)) text = text.split(bad).join(good);
  }

  // Passe 2 — ré-encodage des zones Latin-1 / CP1252.
  text = text.replace(/[^\x00-\x7F]+/g, (run) => repairLatin1Run(run));

  // Passe 2b — les octets 0x80-0x9F non résolus laissent des caractères de
  // contrôle invisibles : on les supprime, ils n'ont rien à faire dans du code.
  text = text.replace(/[\u0080-\u009F]/g, '');

  // Passe 3 — séparateurs de commentaires décoratifs.
  // On ne touche qu'aux lignes de commentaire faites de cadres (═ ─ ┌ ┐ │ …)
  // ou contenant encore un marqueur de corruption, pour obtenir partout le
  // même style « // ===== Titre ===== ».
  text = text
    .split('\n')
    .map((line) => {
      if (!/^\s*(\/\/|\/\*|\*)/.test(line)) return line;
      if (!/[═─│┌┐└┘├┤┬┴┼â•┬├ð]/.test(line)) return line;

      const indent = line.match(/^\s*/)?.[0] ?? '';
      const trimmed = line.trimStart();
      const opener = trimmed.startsWith('/*') ? '/*' : trimmed.startsWith('*') ? '*' : '//';
      const closer = trimmed.endsWith('*/') ? ' */' : '';
      const label = trimmed
        .replace(/^(\/\/|\/\*|\*)/, '')
        .replace(/\*\/\s*$/, '')
        .replace(/[═─│┌┐└┘├┤┬┴┼â•┬├ðšï¸\u2022*]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (!label) return `${indent}${opener} ====================${closer}`;
      return `${indent}${opener} ===== ${label} =====${closer}`;
    })
    .join('\n');

  return text;
}

// ─── Parcours des fichiers ────────────────────────────────────
function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (EXTENSIONS.has(path.extname(entry.name)) && !IGNORED_FILE.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const targets = args.filter((a) => !a.startsWith('--'));

  const files = [];
  for (const target of targets.length ? targets : DEFAULT_TARGETS) {
    const abs = path.resolve(ROOT, target);
    if (!fs.existsSync(abs)) continue;
    if (fs.statSync(abs).isDirectory()) walk(abs, files);
    else files.push(abs);
  }

  let changedFiles = 0;
  let changedOccurrences = 0;
  const leftovers = [];

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const repaired = repairText(original);
    const before = score(original);
    const after = score(repaired);

    if (repaired !== original) {
      changedOccurrences += Math.max(0, before - after);
      changedFiles += 1;
      if (!checkOnly) fs.writeFileSync(file, repaired, 'utf8');
    }

    if (after > 0) leftovers.push([path.relative(ROOT, file), after]);
  }

  leftovers.sort((a, b) => b[1] - a[1]);

  console.log(`\n${checkOnly ? '[CHECK]' : '[FIX]'} ${files.length} fichiers scannés`);
  console.log(`   fichiers ${checkOnly ? 'à corriger' : 'corrigés'} : ${changedFiles}`);
  console.log(`   marqueurs corrompus supprimés : ${changedOccurrences}`);

  if (leftovers.length) {
    console.log('\n   Résidus (fichier : marqueurs restants) :');
    for (const [name, count] of leftovers.slice(0, 25)) {
      console.log(`     ${name} : ${count}`);
    }
  }
  console.log('');
}

main();
