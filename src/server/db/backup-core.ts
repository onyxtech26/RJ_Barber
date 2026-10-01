import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import type { Client } from '@libsql/client';

// Shared by the start-up backup script and Day Close. VACUUM INTO writes a consistent snapshot
// even while the app is running. Keeps the newest KEEP files of each kind.

const BACKUP_DIR = 'data/backups';
const KEEP = 30;

export async function backupDatabase(
  client: Client,
  databaseUrl: string,
  { label, overwrite }: { label: string; overwrite: boolean }
): Promise<string | null> {
  if (!databaseUrl.startsWith('file:')) return null;

  mkdirSync(BACKUP_DIR, { recursive: true });
  const target = path.join(BACKUP_DIR, `rj-pos-${label}.db`);

  if (existsSync(target)) {
    if (!overwrite) return target;
    rmSync(target); // VACUUM INTO refuses to write over an existing file
  }
  await client.execute({ sql: 'VACUUM INTO ?', args: [target] });

  // Prune old copies of the same kind (daily: rj-pos-YYYY-MM-DD.db, close: rj-pos-close-YYYY-MM-DD.db).
  const prefix = label.replace(/\d{4}-\d{2}-\d{2}$/, '');
  const pattern = new RegExp(`^rj-pos-${prefix}\\d{4}-\\d{2}-\\d{2}\\.db$`);
  const sameKind = readdirSync(BACKUP_DIR).filter((f) => pattern.test(f)).sort().reverse();
  for (const old of sameKind.slice(KEEP)) rmSync(path.join(BACKUP_DIR, old));

  return target;
}
