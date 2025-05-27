import { execSync } from 'child_process';

const migrationName = process.argv[2];

if (!migrationName) {
  console.log('Usage: node teste.ts <migration-name>');
  process.exit(1);
}

execSync(
  `npm run typeorm -- migration:generate src/infrastructure/data/typeorm/config/migrations/${migrationName} --pretty`,
);
