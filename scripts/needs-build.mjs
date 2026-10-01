// Exits 0 when the production build is up to date, 1 when `next build` needs to run.
// Compares the newest source/config file against the last build, so updating the code on the
// shop PC is picked up automatically by run.bat without rebuilding on every start.

import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const BUILD_MARKER = path.join('.next', 'BUILD_ID');
const SOURCES = ['src', 'public', 'package.json', 'package-lock.json', 'next.config.ts', 'postcss.config.mjs', 'tsconfig.json'];

function newestMtime(target) {
  if (!existsSync(target)) return 0;
  const stat = statSync(target);
  if (!stat.isDirectory()) return stat.mtimeMs;
  let newest = stat.mtimeMs;
  for (const entry of readdirSync(target)) newest = Math.max(newest, newestMtime(path.join(target, entry)));
  return newest;
}

if (!existsSync(BUILD_MARKER)) {
  console.log('No production build yet.');
  process.exit(1);
}

const builtAt = statSync(BUILD_MARKER).mtimeMs;
const changedAt = Math.max(...SOURCES.map(newestMtime));
if (changedAt > builtAt) {
  console.log('Source changed since the last build.');
  process.exit(1);
}
console.log('Production build is up to date.');
process.exit(0);
