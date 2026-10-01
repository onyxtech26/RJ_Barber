import { toBusinessDate } from '../../lib/business-date';
import { backupDatabase } from './backup-core';
import { DATABASE_URL, libsqlClient } from './client';

// Start-up backup: one copy per day in data/backups/, newest 30 kept.

async function main() {
  const target = await backupDatabase(libsqlClient, DATABASE_URL, { label: toBusinessDate(), overwrite: false });
  console.log(target ? `✓ Backup ready: ${target}` : 'Skipping backup: database is not a local file');
  libsqlClient.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
