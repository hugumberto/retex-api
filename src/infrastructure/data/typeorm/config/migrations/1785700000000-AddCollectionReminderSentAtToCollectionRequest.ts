import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCollectionReminderSentAtToCollectionRequest1785700000000
  implements MigrationInterface
{
  name = 'AddCollectionReminderSentAtToCollectionRequest1785700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Momento em que o lembrete de 24h foi enviado. Os registos existentes
    // ficam a NULL — as recolhas já agendadas recebem o lembrete na véspera.
    await queryRunner.query(
      `ALTER TABLE "collection_request" ADD COLUMN IF NOT EXISTS "collection_reminder_sent_at" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collection_request" DROP COLUMN IF EXISTS "collection_reminder_sent_at"`,
    );
  }
}
