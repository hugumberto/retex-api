import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1753646020766 implements MigrationInterface {
    name = 'InitialMigration1753646020766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."user_role_role_enum" AS ENUM('USER', 'DRIVER', 'OPS', 'ADMIN')
        `);
        await queryRunner.query(`
            CREATE TABLE "user_role" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "role" "public"."user_role_role_enum" NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "user_id" uuid,
                CONSTRAINT "PK_fb2e442d14add3cefbdf33c4561" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."user_status_enum" AS ENUM('ACTIVE', 'INACTIVE')
        `);
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "first_name" character varying(255) NOT NULL,
                "last_name" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "contact_phone" character varying(20) NOT NULL,
                "document_number" character varying(20) NOT NULL,
                "status" "public"."user_status_enum" NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "UQ_94e0e9a24f448b343ab07fdc865" UNIQUE ("document_number"),
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_USER_DOCUMENT_NUMBER" ON "user" ("document_number")
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
        await queryRunner.query(`
            CREATE TYPE "public"."storage_unit_quality_enum" AS ENUM('GOOD', 'MEDIUM', 'BAD')
        `);
        await queryRunner.query(`
            CREATE TABLE "storage_unit" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "quality" "public"."storage_unit_quality_enum" NOT NULL,
                "weight" numeric(10, 2) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "brand_id" uuid,
                CONSTRAINT "PK_d5822b5bda6f0ba84c907d5b8c2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."route_status_enum" AS ENUM('DRAFTING', 'CREATED', 'IN_TRANSIT', 'FINISHED')
        `);
        await queryRunner.query(`
            CREATE TABLE "route" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "status" "public"."route_status_enum" NOT NULL,
                "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "user_id" uuid,
                CONSTRAINT "PK_08affcd076e46415e5821acf52d" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."package_status_enum" AS ENUM(
                'CREATED',
                'OUT_OF_ZONE',
                'WAITING_FOR_COLLECTION',
                'COLLECTED',
                'IN_TRANSIT',
                'IN_HOUSE',
                'CANCELLED',
                'SCREENING',
                'STOCKED'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "package" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "status" "public"."package_status_enum" NOT NULL,
                "weight" numeric(10, 2),
                "collect_day" character varying(20) NOT NULL,
                "collect_time" character varying(20) NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "user_id" uuid,
                "route_id" uuid,
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
                CONSTRAINT "PK_308364c66df656295bc4ec467c2" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."item_quality_enum" AS ENUM('GOOD', 'MEDIUM', 'BAD')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."item_type_enum" AS ENUM('UPPER_PART', 'UNDER_PART')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."item_season_enum" AS ENUM('SUMMER', 'WINTER')
        `);
        await queryRunner.query(`
            CREATE TABLE "item" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "quality" "public"."item_quality_enum" NOT NULL,
                "type" "public"."item_type_enum" NOT NULL,
                "season" "public"."item_season_enum" NOT NULL,
                "quantity" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "package_id" uuid,
                "storage_unit_id" uuid,
                "brand_id" uuid,
                CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "brand" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "manual" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_a5d20765ddd942eb5de4eee2d7f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "user_role"
            ADD CONSTRAINT "FK_d0e5815877f7395a198a4cb0a46" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "storage_unit"
            ADD CONSTRAINT "FK_99c0cfaf3018000ea91e8a388ca" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "route"
            ADD CONSTRAINT "FK_797177a310ed69b8ede51c81a55" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "package"
            ADD CONSTRAINT "FK_04a9cd5f7a04bd02cfc9c7e6450" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "package"
            ADD CONSTRAINT "FK_6194c900d7f2a8179ce3776f86d" FOREIGN KEY ("route_id") REFERENCES "route"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "item"
            ADD CONSTRAINT "FK_a9468cba496c666c284ea222c13" FOREIGN KEY ("package_id") REFERENCES "package"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "item"
            ADD CONSTRAINT "FK_856fb5506e6467c9890c550edf9" FOREIGN KEY ("storage_unit_id") REFERENCES "storage_unit"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "item"
            ADD CONSTRAINT "FK_38b2bdc06bbb58f27ee37a7ddbc" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "item" DROP CONSTRAINT "FK_38b2bdc06bbb58f27ee37a7ddbc"
        `);
        await queryRunner.query(`
            ALTER TABLE "item" DROP CONSTRAINT "FK_856fb5506e6467c9890c550edf9"
        `);
        await queryRunner.query(`
            ALTER TABLE "item" DROP CONSTRAINT "FK_a9468cba496c666c284ea222c13"
        `);
        await queryRunner.query(`
            ALTER TABLE "package" DROP CONSTRAINT "FK_6194c900d7f2a8179ce3776f86d"
        `);
        await queryRunner.query(`
            ALTER TABLE "package" DROP CONSTRAINT "FK_04a9cd5f7a04bd02cfc9c7e6450"
        `);
        await queryRunner.query(`
            ALTER TABLE "route" DROP CONSTRAINT "FK_797177a310ed69b8ede51c81a55"
        `);
        await queryRunner.query(`
            ALTER TABLE "storage_unit" DROP CONSTRAINT "FK_99c0cfaf3018000ea91e8a388ca"
        `);
        await queryRunner.query(`
            ALTER TABLE "user_role" DROP CONSTRAINT "FK_d0e5815877f7395a198a4cb0a46"
        `);
        await queryRunner.query(`
            DROP TABLE "brand"
        `);
        await queryRunner.query(`
            DROP TABLE "item"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."item_season_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."item_type_enum"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."item_quality_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "package"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."package_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "route"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."route_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "storage_unit"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."storage_unit_quality_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "test_zone"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_USER_DOCUMENT_NUMBER"
        `);
        await queryRunner.query(`
            DROP TABLE "user"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_status_enum"
        `);
        await queryRunner.query(`
            DROP TABLE "user_role"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."user_role_role_enum"
        `);
    }

}
