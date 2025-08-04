import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRefreshTokenTable1753648000000 implements MigrationInterface {
  name = 'CreateRefreshTokenTable1753648000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "refresh_token" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "token" character varying(255) NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "is_revoked" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "user_id" uuid NOT NULL,
                CONSTRAINT "PK_refresh_token" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_refresh_token_token" UNIQUE ("token")
            )
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_REFRESH_TOKEN_TOKEN" ON "refresh_token" ("token")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_REFRESH_TOKEN_USER_ID" ON "refresh_token" ("user_id")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_REFRESH_TOKEN_EXPIRES_AT" ON "refresh_token" ("expires_at")
        `);

    await queryRunner.query(`
            ALTER TABLE "refresh_token" 
            ADD CONSTRAINT "FK_refresh_token_user" 
            FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "refresh_token" DROP CONSTRAINT "FK_refresh_token_user"
        `);

    await queryRunner.query(`
            DROP INDEX "IDX_REFRESH_TOKEN_EXPIRES_AT"
        `);

    await queryRunner.query(`
            DROP INDEX "IDX_REFRESH_TOKEN_USER_ID"
        `);

    await queryRunner.query(`
            DROP INDEX "IDX_REFRESH_TOKEN_TOKEN"
        `);

    await queryRunner.query(`
            DROP TABLE "refresh_token"
        `);
  }
} 