import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLanguageToUser1785600000000 implements MigrationInterface {
  name = 'AddLanguageToUser1785600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Idioma preferido do utilizador. Os registos existentes ficam em 'pt',
    // que é o idioma em que já receberam todos os emails até aqui.
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "language" character varying(5) NOT NULL DEFAULT 'pt'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN IF EXISTS "language"`,
    );
  }
}
