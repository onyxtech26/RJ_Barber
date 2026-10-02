// Prepares the online demo's database. Runs during the Vercel build (vercel.json).
//
// - Hosted demo (TURSO_DATABASE_URL set, inside a Vercel build): applies migrations to Turso, then
//   resets it to fresh sample data dated around today. One shared database for every Vercel instance,
//   so sign-ins, bookings and sales stay consistent between deploys.
// - No Turso: builds demo/rj-pos-demo.db, which each Vercel instance copies to /tmp (self-resetting).
//
// Never touches the shop PC's data/rj-pos.db or data/initial-pins.txt.

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { DEMO_PINS } from '../src/lib/demo';

const tsx = path.join('node_modules', 'tsx', 'dist', 'cli.mjs');
const demoPins = {
  // Fixed demo PINs (shown on the demo sign-in screen) — also stops the seed writing a PIN file.
  SEED_OWNER_PIN: DEMO_PINS.owner,
  SEED_STAFF_PIN: DEMO_PINS.staff,
};

if (process.env.TURSO_DATABASE_URL) {
  // Wiping a hosted database is only ever allowed for the demo deployment.
  if (process.env.VERCEL !== '1') {
    throw new Error('Refusing to reset a hosted database outside a Vercel build.');
  }
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...demoPins,
    DATABASE_URL: '',
    DEMO_DATA: '1',
    NODE_ENV: 'development', // the seed refuses --reset when NODE_ENV=production
  };
  const run = (script: string, ...args: string[]) =>
    execFileSync(process.execPath, [tsx, script, ...args], { stdio: 'inherit', env });

  run('src/server/db/migrate.ts');
  run('src/server/db/seed.ts', '--reset');
  run('src/server/db/demo-data.ts');
  console.log('✓ Hosted demo database reset with fresh sample data');
} else {
  const DEMO_DIR = 'demo';
  const env = { ...process.env, ...demoPins, DATABASE_URL: `file:${DEMO_DIR}/rj-pos-demo.db`, TURSO_DATABASE_URL: '' };
  const run = (script: string) => execFileSync(process.execPath, [tsx, script], { stdio: 'inherit', env });

  rmSync(DEMO_DIR, { recursive: true, force: true });
  mkdirSync(DEMO_DIR, { recursive: true });
  run('src/server/db/migrate.ts');
  run('src/server/db/seed.ts');
  run('src/server/db/demo-data.ts');
  console.log('✓ Demo database ready: demo/rj-pos-demo.db');
}
