import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrCodesGeneratedToPackage1784600000000
  implements MigrationInterface
{
  name = 'AddQrCodesGeneratedToPackage1784600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package" ADD "qr_codes_generated" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package" DROP COLUMN "qr_codes_generated"`,
    );
  }
}
