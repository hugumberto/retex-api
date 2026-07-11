import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCollectPreferenceFromPackage1783600000000
  implements MigrationInterface
{
  name = 'RemoveCollectPreferenceFromPackage1783600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN "collect_day"`);
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN "collect_time"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package" ADD "collect_day" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "package" ADD "collect_time" character varying(20)`,
    );
  }
}
