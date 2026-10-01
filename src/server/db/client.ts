import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

// Plain connection, safe for CLI scripts (seed, migrate, backup).
// App code should import from '@/server/db' instead, which adds the server-only guard.
//
// libsql pools connections and enables foreign keys on each one by default.
// WAL journal mode is persisted in the database file by the migrate script.

export const DATABASE_URL = process.env.DATABASE_URL || 'file:data/rj-pos.db';

// SQLite creates the file but not its folder — make sure data/ exists on a fresh install.
if (DATABASE_URL.startsWith('file:')) {
  mkdirSync(path.dirname(DATABASE_URL.slice('file:'.length)), { recursive: true });
}

const globalForDb = globalThis as unknown as { libsqlClient?: Client };

// Reuse one client across dev hot-reloads instead of opening a new pool each time.
const client =
  globalForDb.libsqlClient ??
  createClient({
    url: DATABASE_URL,
    // Wait up to 5s for a lock instead of failing immediately with SQLITE_BUSY.
    timeout: 5000,
  });
if (process.env.NODE_ENV !== 'production') globalForDb.libsqlClient = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
export { client as libsqlClient };
