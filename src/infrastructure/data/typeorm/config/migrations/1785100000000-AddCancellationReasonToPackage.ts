import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCancellationReasonToPackage1785100000000
  implements MigrationInterface
{
  name = 'AddCancellationReasonToPackage1785100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package" ADD "cancellation_reason" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package" DROP COLUMN "cancellation_reason"`,
    );
  }
}
