import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWeightAndProcessedToQrCode1784800000000
  implements MigrationInterface
{
  name = 'AddWeightAndProcessedToQrCode1784800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "qr_code" ADD "weight" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "qr_code" ADD "processed_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "qr_code" DROP COLUMN "processed_at"`);
    await queryRunner.query(`ALTER TABLE "qr_code" DROP COLUMN "weight"`);
  }
}
