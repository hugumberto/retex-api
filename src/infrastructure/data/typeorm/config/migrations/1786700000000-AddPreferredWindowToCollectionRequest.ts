import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreferredWindowToCollectionRequest1786700000000
  implements MigrationInterface
{
  name = 'AddPreferredWindowToCollectionRequest1786700000000';

  // Colunas nulas: os pedidos existentes não têm janela pedida.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collection_request" ADD "preferred_date" date`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_request" ADD "preferred_interval" character varying(32)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collection_request" DROP COLUMN "preferred_interval"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_request" DROP COLUMN "preferred_date"`,
    );
  }
}
