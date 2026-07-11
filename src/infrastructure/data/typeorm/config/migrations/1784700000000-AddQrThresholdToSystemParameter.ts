import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrThresholdToSystemParameter1784700000000
  implements MigrationInterface
{
  name = 'AddQrThresholdToSystemParameter1784700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system_parameter" ADD "qr_code_threshold_percentage" integer NOT NULL DEFAULT 10`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system_parameter" DROP COLUMN "qr_code_threshold_percentage"`,
    );
  }
}
