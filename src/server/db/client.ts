import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Plain connection, safe for CLI scripts (seed, migrate, backup).
// App code should import from '@/server/db' instead, which adds the server-only guard.
//
// Three ways to run:
// - Shop PC: a local SQLite file (default data/rj-pos.db).
// - Vercel demo (default on Vercel): a demo database built during deployment (demo/rj-pos-demo.db,
//   see scripts/build-demo-db.ts) is copied to /tmp — the only writable place on Vercel — on first use.
//   Each fresh Vercel server starts again from that copy, so the demo resets itself.
// - Hosted, persistent: a Turso database via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
//
// libsql pools connections and enables foreign keys on each one by default.
// WAL journal mode is persisted in the database file by the migrate script.

// `||` on purpose: an env var that exists but is empty (as on the old Vercel project) means "not set".
const ON_VERCEL = process.env.VERCEL === '1';
const DEMO_TEMPLATE = path.join(process.cwd(), 'demo', 'rj-pos-demo.db');
const DEMO_RUNTIME = '/tmp/rj-pos-demo.db';

export const DATABASE_URL =
  process.env.TURSO_DATABASE_URL ||
  process.env.DATABASE_URL ||
  (ON_VERCEL ? `file:${DEMO_RUNTIME}` : 'file:data/rj-pos.db');
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN || undefined;
export const IS_LOCAL_FILE = DATABASE_URL.startsWith('file:');

if (DATABASE_URL === `file:${DEMO_RUNTIME}`) {
  // Vercel demo: start this server from the bundled demo database.
  if (!existsSync(DEMO_RUNTIME) && existsSync(DEMO_TEMPLATE)) {
    mkdirSync(path.dirname(DEMO_RUNTIME), { recursive: true });
    copyFileSync(DEMO_TEMPLATE, DEMO_RUNTIME);
  }
} else if (IS_LOCAL_FILE) {
  // SQLite creates the file but not its folder — make sure data/ exists on a fresh install.
  mkdirSync(path.dirname(DATABASE_URL.slice('file:'.length)), { recursive: true });
}

const globalForDb = globalThis as unknown as { libsqlClient?: Client };

// Reuse one client across dev hot-reloads instead of opening a new pool each time.
const client =
  globalForDb.libsqlClient ??
  createClient({
    url: DATABASE_URL,
    authToken: AUTH_TOKEN,
    // Wait up to 5s for a lock instead of failing immediately with SQLITE_BUSY (local files only).
    timeout: 5000,
  });
if (process.env.NODE_ENV !== 'production') globalForDb.libsqlClient = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
export { client as libsqlClient };
