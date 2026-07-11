import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollectionConfirmationToPackage1783700000000
  implements MigrationInterface
{
  name = 'AddCollectionConfirmationToPackage1783700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "package" ADD "collection_confirmation_token" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "package" ADD "collection_confirmed_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_PACKAGE_COLLECTION_CONFIRMATION_TOKEN" ON "package" ("collection_confirmation_token")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UQ_PACKAGE_COLLECTION_CONFIRMATION_TOKEN"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package" DROP COLUMN "collection_confirmed_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "package" DROP COLUMN "collection_confirmation_token"`,
    );
  }
}
