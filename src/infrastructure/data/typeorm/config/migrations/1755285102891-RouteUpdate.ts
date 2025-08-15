import { MigrationInterface, QueryRunner } from "typeorm";

export class RouteUpdate1755285102891 implements MigrationInterface {
    name = 'RouteUpdate1755285102891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_refresh_token_user"
        `);
        await queryRunner.query(`
            ALTER TABLE "route" DROP CONSTRAINT "FK_797177a310ed69b8ede51c81a55"
        `);
        await queryRunner.query(`
            ALTER TABLE "route" DROP COLUMN "user_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "route"
            ADD "driver_id" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email")
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "password" DROP DEFAULT
        `);
        await queryRunner.query(`
            ALTER TABLE "route"
            ALTER COLUMN "end_date" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "refresh_token"
            ADD CONSTRAINT "FK_6bbe63d2fe75e7f0ba1710351d4" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "route"
            ADD CONSTRAINT "FK_c1310391be01ff2e8a4ca461325" FOREIGN KEY ("driver_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "route" DROP CONSTRAINT "FK_c1310391be01ff2e8a4ca461325"
        `);
        await queryRunner.query(`
            ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_6bbe63d2fe75e7f0ba1710351d4"
        `);
        await queryRunner.query(`
            ALTER TABLE "route"
            ALTER COLUMN "end_date"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "password"
            SET DEFAULT ''
        `);
        await queryRunner.query(`
            ALTER TABLE "user" DROP CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22"
        `);
        await queryRunner.query(`
            ALTER TABLE "route" DROP COLUMN "driver_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "route"
            ADD "user_id" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "route"
            ADD CONSTRAINT "FK_797177a310ed69b8ede51c81a55" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "refresh_token"
            ADD CONSTRAINT "FK_refresh_token_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

}
