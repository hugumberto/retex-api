import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTypeAndAddressTable1781638482299 implements MigrationInterface {
  name = 'AddUserTypeAndAddressTable1781638482299';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create user_type enum and add column to user
    await queryRunner.query(`CREATE TYPE "user_type_enum" AS ENUM ('PERSON', 'COMPANY')`);
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "user_type" "user_type_enum" NOT NULL DEFAULT 'PERSON'`,
    );
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "user_type" DROP DEFAULT`);

    // 2. Create user_address table
    await queryRunner.query(`
      CREATE TABLE "user_address" (
        "id"               uuid                     NOT NULL DEFAULT uuid_generate_v4(),
        "user_id"          uuid                     NOT NULL,
        "street"           character varying(255)   NOT NULL,
        "number"           character varying(20)    NOT NULL,
        "complement"       character varying(255),
        "city"             character varying(255)   NOT NULL,
        "city_division"    character varying(255)   NOT NULL,
        "country"          character varying(255)   NOT NULL,
        "country_division" character varying(255)   NOT NULL,
        "zip_code"         character varying(20)    NOT NULL,
        "lat"              numeric(10,8)            NOT NULL,
        "long"             numeric(11,8)            NOT NULL,
        "is_default"       boolean                  NOT NULL DEFAULT false,
        "created_at"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at"       TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_USER_ADDRESS" PRIMARY KEY ("id"),
        CONSTRAINT "FK_USER_ADDRESS_USER" FOREIGN KEY ("user_id")
          REFERENCES "user"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_USER_ADDRESS_DEFAULT"
      ON "user_address" ("user_id")
      WHERE is_default = true AND deleted_at IS NULL
    `);

    // 3. Add address_id FK column to package
    await queryRunner.query(
      `ALTER TABLE "package" ADD COLUMN "address_id" uuid`,
    );
    await queryRunner.query(`
      ALTER TABLE "package"
        ADD CONSTRAINT "FK_PACKAGE_ADDRESS"
        FOREIGN KEY ("address_id") REFERENCES "user_address"("id") ON DELETE SET NULL
    `);

    // 4. Make collect_day and collect_time nullable (were NOT NULL before)
    await queryRunner.query(`ALTER TABLE "package" ALTER COLUMN "collect_day" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "package" ALTER COLUMN "collect_time" DROP NOT NULL`);

    // 5. Migrate existing embedded addresses to user_address and link back
    await queryRunner.query(`
      INSERT INTO "user_address" (
        "id", "user_id", "street", "number", "complement", "city", "city_division",
        "country", "country_division", "zip_code", "lat", "long",
        "is_default", "created_at", "updated_at"
      )
      SELECT
        uuid_generate_v4(),
        p."user_id",
        p."address_Street",
        p."address_Number",
        p."address_Complement",
        p."address_City",
        p."address_City_division",
        p."address_Country",
        p."address_Country_division",
        p."address_Zip_code",
        p."address_Lat",
        p."address_Long",
        false,
        now(),
        now()
      FROM "package" p
      WHERE p."address_Street" IS NOT NULL
    `);

    await queryRunner.query(`
      UPDATE "package" p
      SET "address_id" = ua."id"
      FROM "user_address" ua
      WHERE ua."user_id" = p."user_id"
        AND ua."street"  = p."address_Street"
        AND ua."number"  = p."address_Number"
        AND ua."city"    = p."address_City"
        AND p."address_Street" IS NOT NULL
    `);

    // 6. Drop embedded address columns from package
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN IF EXISTS "address_Street"`);
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN IF EXISTS "address_Number"`);
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN IF EXISTS "address_Complement"`);
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN IF EXISTS "address_City"`);
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN IF EXISTS "address_City_division"`);
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN IF EXISTS "address_Country"`);
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN IF EXISTS "address_Country_division"`);
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN IF EXISTS "address_Zip_code"`);
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN IF EXISTS "address_Lat"`);
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN IF EXISTS "address_Long"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore embedded address columns in package
    await queryRunner.query(`ALTER TABLE "package" ADD COLUMN "address_Street"           character varying(255)`);
    await queryRunner.query(`ALTER TABLE "package" ADD COLUMN "address_Number"           character varying(20)`);
    await queryRunner.query(`ALTER TABLE "package" ADD COLUMN "address_Complement"       character varying(255)`);
    await queryRunner.query(`ALTER TABLE "package" ADD COLUMN "address_City"             character varying(255)`);
    await queryRunner.query(`ALTER TABLE "package" ADD COLUMN "address_City_division"    character varying(255)`);
    await queryRunner.query(`ALTER TABLE "package" ADD COLUMN "address_Country"          character varying(255)`);
    await queryRunner.query(`ALTER TABLE "package" ADD COLUMN "address_Country_division" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "package" ADD COLUMN "address_Zip_code"         character varying(20)`);
    await queryRunner.query(`ALTER TABLE "package" ADD COLUMN "address_Lat"              numeric(10,8)`);
    await queryRunner.query(`ALTER TABLE "package" ADD COLUMN "address_Long"             numeric(11,8)`);

    // Copy data back from user_address to package
    await queryRunner.query(`
      UPDATE "package" p
      SET
        "address_Street"           = ua."street",
        "address_Number"           = ua."number",
        "address_Complement"       = ua."complement",
        "address_City"             = ua."city",
        "address_City_division"    = ua."city_division",
        "address_Country"          = ua."country",
        "address_Country_division" = ua."country_division",
        "address_Zip_code"         = ua."zip_code",
        "address_Lat"              = ua."lat",
        "address_Long"             = ua."long"
      FROM "user_address" ua
      WHERE ua."id" = p."address_id"
    `);

    // Restore NOT NULL constraints on collect_day and collect_time
    await queryRunner.query(`UPDATE "package" SET "collect_day" = '' WHERE "collect_day" IS NULL`);
    await queryRunner.query(`UPDATE "package" SET "collect_time" = '' WHERE "collect_time" IS NULL`);
    await queryRunner.query(`ALTER TABLE "package" ALTER COLUMN "collect_day" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "package" ALTER COLUMN "collect_time" SET NOT NULL`);

    // Drop FK and address_id column from package
    await queryRunner.query(`ALTER TABLE "package" DROP CONSTRAINT IF EXISTS "FK_PACKAGE_ADDRESS"`);
    await queryRunner.query(`ALTER TABLE "package" DROP COLUMN IF EXISTS "address_id"`);

    // Drop user_address table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_USER_ADDRESS_DEFAULT"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_address"`);

    // Drop user_type column and enum
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "user_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_type_enum"`);
  }
}
