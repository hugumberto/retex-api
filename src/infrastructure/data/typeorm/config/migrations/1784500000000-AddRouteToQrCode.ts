import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRouteToQrCode1784500000000 implements MigrationInterface {
  name = 'AddRouteToQrCode1784500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "qr_code" ADD "route_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_QR_CODE_ROUTE_ID" ON "qr_code" ("route_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_QR_CODE_ROUTE_ID"`);
    await queryRunner.query(`ALTER TABLE "qr_code" DROP COLUMN "route_id"`);
  }
}
