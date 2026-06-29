import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * As colunas de expiração de token (activation/reset) foram criadas como
 * `TIMESTAMP` (sem timezone), mas o schema TypeORM passa a declarar
 * `timestamp with time zone`. Convertemos para `TIMESTAMPTZ` para alinhar a BD
 * com o schema e com o resto do projeto (BaseTimestampColumns, tabelas FAQ).
 */
export class FixTokenExpiryTimestampsTz1782900000000
  implements MigrationInterface
{
  name = 'FixTokenExpiryTimestampsTz1782900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const column of [
      'activation_token_expires_at',
      'reset_token_expires_at',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "user" ALTER COLUMN "${column}" TYPE TIMESTAMP WITH TIME ZONE`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of [
      'activation_token_expires_at',
      'reset_token_expires_at',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "user" ALTER COLUMN "${column}" TYPE TIMESTAMP WITHOUT TIME ZONE`,
      );
    }
  }
}
