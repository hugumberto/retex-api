import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParentIdToUser1779302473609 implements MigrationInterface {
    name = 'AddParentIdToUser1779302473609'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "parent_id" uuid
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."user_role_role_enum"
            RENAME TO "user_role_role_enum_old"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_role_role_enum" AS ENUM('USER', 'DRIVER', 'OPS', 'ADMIN', 'SUB_USER')
        `);
        await queryRunner.query(`
            ALTER TABLE "user_role"
            ALTER COLUMN "role" TYPE "public"."user_role_role_enum" USING "role"::"text"::"public"."user_role_role_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_role_role_enum_old"
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD CONSTRAINT "FK_acb096eef4d8b5acdd7acbb5c84" FOREIGN KEY ("parent_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP CONSTRAINT "FK_acb096eef4d8b5acdd7acbb5c84"
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_role_role_enum_old" AS ENUM('USER', 'DRIVER', 'OPS', 'ADMIN')
        `);
        await queryRunner.query(`
            ALTER TABLE "user_role"
            ALTER COLUMN "role" TYPE "public"."user_role_role_enum_old" USING "role"::"text"::"public"."user_role_role_enum_old"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_role_role_enum"
        `);
        await queryRunner.query(`
            ALTER TYPE "public"."user_role_role_enum_old"
            RENAME TO "user_role_role_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "parent_id"
        `);
    }

}
