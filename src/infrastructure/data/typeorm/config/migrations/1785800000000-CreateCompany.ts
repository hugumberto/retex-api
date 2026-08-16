import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompany1785800000000 implements MigrationInterface {
  name = 'CreateCompany1785800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."company_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."company_member_status_enum" AS ENUM('ACTIVE', 'INACTIVE')`,
    );

    await queryRunner.query(`
      CREATE TABLE "company" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "legal_name" character varying(255),
        "tax_id" character varying(32) NOT NULL,
        "email" character varying(255),
        "phone" character varying(20),
        "status" "public"."company_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "friendly_code" character varying(32),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_company" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_COMPANY_TAX_ID" ON "company" ("tax_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_COMPANY_FRIENDLY_CODE" ON "company" ("friendly_code")`,
    );

    // company_id NULL = perfil de sistema, partilhado por todas as empresas.
    await queryRunner.query(`
      CREATE TABLE "company_profile" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid,
        "key" character varying(64) NOT NULL,
        "name" character varying(128) NOT NULL,
        "permissions" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_company_profile" PRIMARY KEY ("id"),
        CONSTRAINT "FK_company_profile_company" FOREIGN KEY ("company_id")
          REFERENCES "company"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "company_member" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "profile_id" uuid NOT NULL,
        "status" "public"."company_member_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_company_member" PRIMARY KEY ("id"),
        CONSTRAINT "FK_company_member_user" FOREIGN KEY ("user_id") REFERENCES "user"("id"),
        CONSTRAINT "FK_company_member_company" FOREIGN KEY ("company_id") REFERENCES "company"("id"),
        CONSTRAINT "FK_company_member_profile" FOREIGN KEY ("profile_id") REFERENCES "company_profile"("id")
      )
    `);
    // Um utilizador pertence a no máximo uma empresa.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_COMPANY_MEMBER_USER" ON "company_member" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_COMPANY_MEMBER_COMPANY" ON "company_member" ("company_id")`,
    );

    // Perfis de sistema. MANAGER vê e gere tudo da empresa; COLLABORATOR só o
    // que criou — é o único atribuível a sub-utilizadores no arranque.
    await queryRunner.query(`
      INSERT INTO "company_profile" ("company_id", "key", "name", "permissions") VALUES
        (NULL, 'MANAGER', 'Gestor', '["REQUEST_CREATE","REQUEST_VIEW_OWN","REQUEST_VIEW_ALL","REQUEST_CANCEL_OWN","REQUEST_CANCEL_ALL","MEMBER_MANAGE","ADDRESS_MANAGE"]'::jsonb),
        (NULL, 'COLLABORATOR', 'Colaborador', '["REQUEST_CREATE","REQUEST_VIEW_OWN","REQUEST_CANCEL_OWN"]'::jsonb)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "company_member"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_profile"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."company_member_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."company_status_enum"`);
  }
}
