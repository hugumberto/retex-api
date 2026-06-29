import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActivationBypassZoneToUser1783000000000
  implements MigrationInterface
{
  name = 'AddActivationBypassZoneToUser1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "activation_bypass_zone" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "activation_bypass_zone"`,
    );
  }
}
