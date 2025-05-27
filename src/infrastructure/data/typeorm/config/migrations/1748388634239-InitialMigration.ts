import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1748388634239 implements MigrationInterface {
    name = 'InitialMigration1748388634239'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "first_name" character varying(255) NOT NULL,
                "last_name" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "contact_phone" character varying(20) NOT NULL,
                "day_of_week" character varying(20) NOT NULL,
                "time_of_day" character varying(20) NOT NULL,
                "nif" character varying(20) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "address_Street" character varying(255) NOT NULL,
                "address_Number" character varying(20) NOT NULL,
                "address_Complement" character varying(255),
                "address_City" character varying(255) NOT NULL,
                "address_City_division" character varying(255) NOT NULL,
                "address_Country" character varying(255) NOT NULL,
                "address_Country_division" character varying(255) NOT NULL,
                "address_Zip_code" character varying(20) NOT NULL,
                "address_Lat" numeric(10, 8) NOT NULL,
                "address_Long" numeric(11, 8) NOT NULL,
                CONSTRAINT "UQ_e4d0cd2667617487ca40efb8c1d" UNIQUE ("nif"),
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_USER_NIF" ON "user" ("nif")
        `);
        await queryRunner.query(`
            CREATE TABLE "test_zone" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "city" character varying(255) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_459feb6809fed1d5b08b67c6399" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "test_zone"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_USER_NIF"
        `);
        await queryRunner.query(`
            DROP TABLE "user"
        `);
    }

}
