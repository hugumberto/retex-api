import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Novo perfil MASTER, acima do ADMIN (ver `domain/user/role-hierarchy.ts`).
 *
 * O tipo é recriado em vez de `ALTER TYPE ... ADD VALUE` porque o PostgreSQL não
 * deixa usar um valor acrescentado a um enum já existente dentro da mesma
 * transação — e a promoção abaixo precisa de o usar. Com um tipo criado na
 * própria transação essa restrição não se aplica.
 */
export class AddMasterRole1786000000000 implements MigrationInterface {
  name = 'AddMasterRole1786000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_role_enum" RENAME TO "user_role_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_role_enum" AS ENUM('USER', 'DRIVER', 'OPS', 'ADMIN', 'MASTER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_role" ALTER COLUMN "role" TYPE "public"."user_role_role_enum" USING "role"::text::"public"."user_role_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_role_role_enum_old"`);

    // Promoção do primeiro MASTER: apenas a conta de bootstrap (ADMIN_EMAIL),
    // e só se hoje for ADMIN. Os restantes admins ficam como estão.
    const bootstrapEmail =
      process.env.ADMIN_EMAIL ??
      (process.env.NODE_ENV === 'development' ? 'admin@retex.pt' : undefined);

    if (!bootstrapEmail) return;

    // ADMIN passa a MASTER em vez de acumular as duas: o MASTER já inclui o
    // ADMIN pela hierarquia, portanto a segunda linha não acrescentava nada.
    await queryRunner.query(
      `UPDATE "user_role" ur
         SET "role" = 'MASTER'
       FROM "user" u
       WHERE ur."user_id" = u."id"
         AND ur."role" = 'ADMIN'
         AND ur."deleted_at" IS NULL
         AND lower(u."email") = lower($1)`,
      [bootstrapEmail],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Despromover os MASTER antes de o valor deixar de existir no enum.
    await queryRunner.query(
      `UPDATE "user_role" SET "role" = 'ADMIN' WHERE "role" = 'MASTER'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_role_enum" RENAME TO "user_role_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_role_role_enum" AS ENUM('USER', 'DRIVER', 'OPS', 'ADMIN')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_role" ALTER COLUMN "role" TYPE "public"."user_role_role_enum" USING "role"::text::"public"."user_role_role_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_role_role_enum_old"`);
  }
}
