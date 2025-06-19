import { migratePromptsToStandardizedFormat } from '../utils/promptUtils';

async function runMigration() {
  console.log('Starting prompt migration...');
  const result = await migratePromptsToStandardizedFormat();
  console.log('Migration result:', result);
  process.exit(result.success ? 0 : 1);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 