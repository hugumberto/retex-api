import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEstimatedVolumesToPackage1782300000000 implements MigrationInterface {
  name = 'AddEstimatedVolumesToPackage1782300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package" ADD COLUMN "estimated_volumes" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package" DROP COLUMN "estimated_volumes"`,
    );
  }
}
