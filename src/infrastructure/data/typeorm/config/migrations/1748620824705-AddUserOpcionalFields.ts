import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserOpcionalFields1748620824705 implements MigrationInterface {
    name = 'AddUserOpcionalFields1748620824705'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "day_of_week" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "time_of_day" DROP NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "time_of_day"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "day_of_week"
            SET NOT NULL
        `);
    }

}
