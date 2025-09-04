const databaseUrl =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/retex';

export const DATABASE_CONFIG: any = {
  type: 'postgres',
  url: databaseUrl,
  synchronize: false,
  logging: false,
  entities: [__dirname + '/../**/*.schema.{ts,js}'],
  migrationsRun: true,
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
