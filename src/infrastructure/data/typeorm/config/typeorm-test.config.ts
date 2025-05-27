const databaseUrl =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/test-retex';

export const TEST_DATABASE_CONFIG: any = {
  type: 'postgres',
  url: databaseUrl,
  synchronize: false,
  dropSchema: true,
  logging: false,
  entities: [__dirname + '/../**/*.schema.{ts,js}'],
  migrationsRun: true,
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
};
