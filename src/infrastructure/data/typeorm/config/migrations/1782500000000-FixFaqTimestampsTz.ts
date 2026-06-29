import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * As tabelas de FAQ foram criadas com `TIMESTAMP` (sem timezone), mas o schema
 * TypeORM declara `timestamp with time zone`. Convertemos as colunas para
 * `TIMESTAMPTZ` para alinhar a base de dados com o schema (em DBs que já
 * correram a migração original; em DBs novas o efeito é idempotente).
 */
export class FixFaqTimestampsTz1782500000000 implements MigrationInterface {
  name = 'FixFaqTimestampsTz1782500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['faq_category', 'faq_item']) {
      for (const column of ['created_at', 'updated_at', 'deleted_at']) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE TIMESTAMP WITH TIME ZONE`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['faq_category', 'faq_item']) {
      for (const column of ['created_at', 'updated_at', 'deleted_at']) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE TIMESTAMP WITHOUT TIME ZONE`,
        );
      }
    }
  }
}
