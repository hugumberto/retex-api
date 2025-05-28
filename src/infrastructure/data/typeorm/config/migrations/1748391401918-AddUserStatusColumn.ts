import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserStatusColumn1748391401918 implements MigrationInterface {
    name = 'AddUserStatusColumn1748391401918'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."user_status_enum" AS ENUM('INSIDE_TEST_ZONE', 'OUTSIDE_TEST_ZONE')
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "status" "public"."user_status_enum" NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "status"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_status_enum"
        `);
    }

}
