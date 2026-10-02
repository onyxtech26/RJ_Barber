import { migrate } from 'drizzle-orm/libsql/migrator';
import { db, IS_LOCAL_FILE, libsqlClient } from './client';

// Applies any pending SQL files in ./migrations, in order, exactly once each.
// Safe to run on every start-up: already-applied migrations are skipped.

async function main() {
  // Persisted in the file: readers don't block while a sale is being written.
  // (A hosted Turso database manages its own journaling.)
  if (IS_LOCAL_FILE) await libsqlClient.execute('PRAGMA journal_mode = WAL');
  await migrate(db, { migrationsFolder: 'src/server/db/migrations' });

  console.log('✓ Database is up to date');
  libsqlClient.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
