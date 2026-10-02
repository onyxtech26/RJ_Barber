// Builds demo/rj-pos-demo.db — the starting database for the online demo (Vercel).
// Runs during the Vercel build (vercel.json); safe to run locally (`npm run build:demo-db`).
// Never touches data/rj-pos.db or data/initial-pins.txt.

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { DEMO_PINS } from '../src/lib/demo';

const DEMO_DIR = 'demo';
const env = {
  ...process.env,
  DATABASE_URL: `file:${DEMO_DIR}/rj-pos-demo.db`,
  // Fixed demo PINs (shown on the demo sign-in screen) — also stops the seed writing a PIN file.
  SEED_OWNER_PIN: DEMO_PINS.owner,
  SEED_STAFF_PIN: DEMO_PINS.staff,
  TURSO_DATABASE_URL: '',
};

const tsx = path.join('node_modules', 'tsx', 'dist', 'cli.mjs');
const run = (script: string) => execFileSync(process.execPath, [tsx, script], { stdio: 'inherit', env });

rmSync(DEMO_DIR, { recursive: true, force: true });
mkdirSync(DEMO_DIR, { recursive: true });
run('src/server/db/migrate.ts');
run('src/server/db/seed.ts');
run('src/server/db/demo-data.ts');
console.log('✓ Demo database ready: demo/rj-pos-demo.db');
