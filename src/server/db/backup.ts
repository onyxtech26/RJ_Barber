import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { toBusinessDate } from '../../lib/business-date';
import { DATABASE_URL, libsqlClient } from './client';

// Makes one consistent copy of the database per day in data/backups/ and keeps the newest 30.
// VACUUM INTO is safe while the app is running — it copies a consistent snapshot.

const BACKUP_DIR = 'data/backups';
const KEEP = 30;

async function main() {
  if (!DATABASE_URL.startsWith('file:')) {
    console.log('Skipping backup: database is not a local file');
    process.exit(0);
  }

  mkdirSync(BACKUP_DIR, { recursive: true });
  const target = path.join(BACKUP_DIR, `rj-pos-${toBusinessDate()}.db`);

  if (existsSync(target)) {
    console.log(`✓ Backup for today already exists (${target})`);
  } else {
    await libsqlClient.execute({ sql: 'VACUUM INTO ?', args: [target] });
    console.log(`✓ Backup written to ${target}`);
  }

  const backups = readdirSync(BACKUP_DIR)
    .filter((f) => /^rj-pos-\d{4}-\d{2}-\d{2}\.db$/.test(f))
    .sort()
    .reverse();
  for (const old of backups.slice(KEEP)) {
    rmSync(path.join(BACKUP_DIR, old));
  }

  libsqlClient.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
