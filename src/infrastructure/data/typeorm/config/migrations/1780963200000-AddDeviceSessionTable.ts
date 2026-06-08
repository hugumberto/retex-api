import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeviceSessionTable1780963200000 implements MigrationInterface {
    name = 'AddDeviceSessionTable1780963200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "device_session" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" character varying NOT NULL,
                "device_id" character varying NOT NULL,
                "device_label" character varying NOT NULL,
                "active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_device_session" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_DEVICE_SESSION_USER_ID" ON "device_session" ("user_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_DEVICE_SESSION_USER_ID_ACTIVE" ON "device_session" ("user_id", "active")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_DEVICE_SESSION_USER_ID_ACTIVE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_DEVICE_SESSION_USER_ID"`);
        await queryRunner.query(`DROP TABLE "device_session"`);
    }
}
