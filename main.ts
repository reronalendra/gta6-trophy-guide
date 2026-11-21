// Platinum Roadmap — the hand-in program for the gta6-trophy-guide-01 entry.
// Node 22, standard library only. It copies this repository's app/ folder and
// screenshots/ folder into the output directory and writes dossier.json there
// with the vendored make.fun library, so the judge can read the guide from the
// dossier alone. vendor/makefun-frontend.ts must stay exactly as the kit ships
// it: the scorer rebuilds the dossier with its own copy and compares bytes.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Never let a stray output directory eat the entry itself: refuse to clear
// anything when the output is the repository root, is app/ or screenshots/
// themselves, or lives inside either of them — the two folders we copy from.
const outResolved = resolve(out);
const hereResolved = resolve(here);
if (
  outResolved === hereResolved ||
  outResolved === join(hereResolved, 'app') ||
  outResolved === join(hereResolved, 'screenshots') ||
  outResolved.startsWith(join(hereResolved, 'app') + sep) ||
  outResolved.startsWith(join(hereResolved, 'screenshots') + sep)
) {
  throw new Error('MAKEFUN_OUTPUT_DIR must not be the repository root, app/, screenshots/, or inside either of them');
}

// Skip OS junk and hidden/temporary files when copying, so a stray
// .DS_Store or Thumbs.db never reaches the dossier.
const junk = (src: string) => {
  const base = basename(src).toLowerCase();
  if (base === '.ds_store' || base === 'thumbs.db' || base === 'desktop.ini') return false;
  if (base.startsWith('.') || base.endsWith('~') || base.endsWith('.tmp')) return false;
  return true;
};

mkdirSync(out, { recursive: true });
rmSync(join(out, 'app'), { recursive: true, force: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true, filter: junk });
rmSync(join(out, 'screenshots'), { recursive: true, force: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true, filter: junk });

// The scorer's caps from the kit's reference/gate.json: only text_max_bytes
// shapes the dossier's bytes; the other limits refuse an entry the scorer
// would refuse anyway (more than 4 screenshots or one over 256 KiB; more than
// 993 files and directories in app/ or 48 MiB of app files in total).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
