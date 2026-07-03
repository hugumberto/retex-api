import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackageIdToQrCode1783500000000 implements MigrationInterface {
  name = 'AddPackageIdToQrCode1783500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "qr_code" ADD "package_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "qr_code" ADD CONSTRAINT "FK_qr_code_package" FOREIGN KEY ("package_id") REFERENCES "package"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "qr_code" DROP CONSTRAINT "FK_qr_code_package"`,
    );
    await queryRunner.query(`ALTER TABLE "qr_code" DROP COLUMN "package_id"`);
  }
}
