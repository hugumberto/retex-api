import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveDocumentNumberFromUser1781636049864 implements MigrationInterface {
  name = 'RemoveDocumentNumberFromUser1781636049864';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USER_DOCUMENT_NUMBER"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "document_number"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "document_number" character varying(20)`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_USER_DOCUMENT_NUMBER" ON "user" ("document_number")`);
  }
}
