import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsInServiceZoneToUserAddress1781900000000
  implements MigrationInterface
{
  name = 'AddIsInServiceZoneToUserAddress1781900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_address" ADD COLUMN "is_in_service_zone" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP COLUMN "is_in_service_zone"`,
    );
  }
}
