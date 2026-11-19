import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ecrã Utilizadores: tipo de entidade (empresa, município, escola, associação)
 * e último login de cada conta. As empresas existentes ficam "COMPANY"; o
 * último login começa vazio e preenche-se a cada entrada.
 */
export class AddCompanyKindAndUserLastLogin1787000000000 implements MigrationInterface {
  name = 'AddCompanyKindAndUserLastLogin1787000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."company_kind_enum" AS ENUM('COMPANY', 'MUNICIPALITY', 'SCHOOL', 'ASSOCIATION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "company" ADD "kind" "public"."company_kind_enum" NOT NULL DEFAULT 'COMPANY'`,
    );
    await queryRunner.query(`ALTER TABLE "user" ADD "last_login_at" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "last_login_at"`);
    await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "kind"`);
    await queryRunner.query(`DROP TYPE "public"."company_kind_enum"`);
  }
}
