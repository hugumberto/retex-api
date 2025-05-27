/* eslint-disable @typescript-eslint/no-namespace */
import * as fs from 'fs';
import { join } from 'path';
import z, { ZodObject } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  APPLICATION_NAME: z.string(),
});

export function getConfigValidation(env: Record<string, string>) {
  if (env.NODE_ENV === 'test') return { test: true };
  let schema: ZodObject<Record<string, any>> = envSchema;
  if (env.NODE_ENV === 'development') {
    validateEnvFiles();
    schema = envSchema.strict();
  }
  return schema.parse(env);
}

function validateEnvFiles() {
  const getEnvKeys = (path: string) => {
    const dotEnv = fs.readFileSync(join(__dirname, path), 'utf-8');
    const regex = /^(?!#)([A-Za-z_][A-Za-z0-9_]*)=/gm;
    const dotEnvVars = dotEnv.match(regex)!;
    const dotEnvKeys = dotEnvVars.map((match) => match.replace(/=.*$/, ''));
    return dotEnvKeys;
  };
  const envKeys = getEnvKeys('../../.env');
  const exampleEnvKeys = getEnvKeys('../../.env.example');
  const missingKeys = envKeys.filter((key) => !exampleEnvKeys.includes(key));
  if (missingKeys.length > 0) {
    throw new Error(`Missing keys in .env.example file: ${missingKeys.join(', ')}`);
  }
}

export type EnvSchemaType = z.infer<typeof envSchema>;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends EnvSchemaType {}
  }
}
