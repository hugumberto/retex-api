import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordToUser1753647000000 implements MigrationInterface {
  name = 'AddPasswordToUser1753647000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "user" 
            ADD COLUMN "password" character varying(255) NOT NULL DEFAULT ''
        `);

    // Atualizar índice de email para ser único
    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_USER_EMAIL" ON "user" ("email")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "user" 
            DROP COLUMN "password"
        `);

    await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_USER_EMAIL"
        `);
  }
} 