import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrCodeToItem1784900000000 implements MigrationInterface {
  name = 'AddQrCodeToItem1784900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "item" ADD "qr_code_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ITEM_QR_CODE_ID" ON "item" ("qr_code_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ITEM_QR_CODE_ID"`);
    await queryRunner.query(`ALTER TABLE "item" DROP COLUMN "qr_code_id"`);
  }
}
