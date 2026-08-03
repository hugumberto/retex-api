import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyToRequestAndAddress1785900000000
  implements MigrationInterface
{
  name = 'AddCompanyToRequestAndAddress1785900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Empresa da solicitação. NULL = particular; é a única fonte de verdade
    // para distinguir os dois (o `user.user_type` continua inerte).
    await queryRunner.query(
      `ALTER TABLE "collection_request" ADD COLUMN IF NOT EXISTS "company_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_request" ADD CONSTRAINT "FK_collection_request_company" FOREIGN KEY ("company_id") REFERENCES "company"("id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_COLLECTION_REQUEST_COMPANY" ON "collection_request" ("company_id")`,
    );

    // Moradas da empresa: os locais de recolha, partilhados pelos membros.
    // `user_id` passa a nullable para acomodá-las; o CHECK garante que uma
    // morada pertence a um utilizador OU a uma empresa, nunca a ambos nem a
    // nenhum.
    await queryRunner.query(
      `ALTER TABLE "user_address" ADD COLUMN IF NOT EXISTS "company_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" ADD CONSTRAINT "FK_user_address_company" FOREIGN KEY ("company_id") REFERENCES "company"("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_address" ADD CONSTRAINT "CHK_user_address_owner"
      CHECK (("user_id" IS NOT NULL AND "company_id" IS NULL)
          OR ("user_id" IS NULL AND "company_id" IS NOT NULL))
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_USER_ADDRESS_COMPANY" ON "user_address" ("company_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_USER_ADDRESS_COMPANY"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP CONSTRAINT IF EXISTS "CHK_user_address_owner"`,
    );
    // Só é possível repor o NOT NULL se não houver moradas de empresa.
    await queryRunner.query(
      `DELETE FROM "user_address" WHERE "user_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" ALTER COLUMN "user_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP CONSTRAINT IF EXISTS "FK_user_address_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_address" DROP COLUMN IF EXISTS "company_id"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_COLLECTION_REQUEST_COMPANY"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_request" DROP CONSTRAINT IF EXISTS "FK_collection_request_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collection_request" DROP COLUMN IF EXISTS "company_id"`,
    );
  }
}
