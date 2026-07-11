import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollectionIntervalToRoute1785000000000
  implements MigrationInterface
{
  name = 'AddCollectionIntervalToRoute1785000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "route" ADD "collection_interval" character varying(32)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "route" DROP COLUMN "collection_interval"`,
    );
  }
}
