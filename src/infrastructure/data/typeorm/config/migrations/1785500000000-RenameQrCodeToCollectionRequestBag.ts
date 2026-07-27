import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Renomeia o conceito `qr_code` para `collection_request_bag` (o "saco", com
 * etiqueta QR, que pertence a uma solicitação de recolha), alinhando a BD com a
 * nomenclatura da API/UI ("Saco"). Renomeia a tabela, as constraints/índices, a
 * coluna FK em `item` e as colunas de contagem em `collection_request`
 * (`estimated_volumes`→`estimated_bags`, `qr_codes_generated`→`bags_generated`).
 *
 * Cada passo é idempotente (só renomeia se o objeto de origem existir e o de
 * destino ainda não), para ser seguro em ambientes parcialmente aplicados.
 *
 * NOTA: `system_parameter.qr_code_threshold_percentage` é mantido (ratio de
 * geração — concern separado).
 */
export class RenameQrCodeToCollectionRequestBag1785500000000
  implements MigrationInterface
{
  name = 'RenameQrCodeToCollectionRequestBag1785500000000';

  private async renameTable(qr: QueryRunner, from: string, to: string) {
    await qr.query(`
      DO $$
      BEGIN
        IF to_regclass('public.${from}') IS NOT NULL
           AND to_regclass('public.${to}') IS NULL THEN
          ALTER TABLE "${from}" RENAME TO "${to}";
        END IF;
      END $$;
    `);
  }

  private async renameColumn(
    qr: QueryRunner,
    table: string,
    from: string,
    to: string,
  ) {
    await qr.query(`
      DO $$
      BEGIN
        IF EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_name = '${table}' AND column_name = '${from}'
           )
           AND NOT EXISTS (
             SELECT 1 FROM information_schema.columns
             WHERE table_name = '${table}' AND column_name = '${to}'
           ) THEN
          ALTER TABLE "${table}" RENAME COLUMN "${from}" TO "${to}";
        END IF;
      END $$;
    `);
  }

  private async renameConstraint(
    qr: QueryRunner,
    table: string,
    from: string,
    to: string,
  ) {
    await qr.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${from}')
           AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${to}') THEN
          ALTER TABLE "${table}" RENAME CONSTRAINT "${from}" TO "${to}";
        END IF;
      END $$;
    `);
  }

  private async renameIndex(qr: QueryRunner, from: string, to: string) {
    await qr.query(`
      DO $$
      BEGIN
        IF to_regclass('public.${from}') IS NOT NULL
           AND to_regclass('public.${to}') IS NULL THEN
          ALTER INDEX "${from}" RENAME TO "${to}";
        END IF;
      END $$;
    `);
  }

  public async up(qr: QueryRunner): Promise<void> {
    // Tabela
    await this.renameTable(qr, 'qr_code', 'collection_request_bag');

    // PK + UNIQUE constraints da própria tabela
    await this.renameConstraint(
      qr,
      'collection_request_bag',
      'PK_qr_code',
      'PK_collection_request_bag',
    );
    await this.renameConstraint(
      qr,
      'collection_request_bag',
      'UQ_qr_code_token',
      'UQ_collection_request_bag_token',
    );
    await this.renameConstraint(
      qr,
      'collection_request_bag',
      'UQ_qr_code_friendly_code',
      'UQ_collection_request_bag_friendly_code',
    );
    await this.renameConstraint(
      qr,
      'collection_request_bag',
      'FK_qr_code_collection_request',
      'FK_collection_request_bag_collection_request',
    );
    await this.renameIndex(
      qr,
      'IDX_QR_CODE_ROUTE_ID',
      'IDX_COLLECTION_REQUEST_BAG_ROUTE_ID',
    );

    // Coluna FK + índice em item
    await this.renameColumn(
      qr,
      'item',
      'qr_code_id',
      'collection_request_bag_id',
    );
    await this.renameIndex(
      qr,
      'IDX_ITEM_QR_CODE_ID',
      'IDX_ITEM_COLLECTION_REQUEST_BAG_ID',
    );

    // Colunas de contagem em collection_request
    await this.renameColumn(
      qr,
      'collection_request',
      'estimated_volumes',
      'estimated_bags',
    );
    await this.renameColumn(
      qr,
      'collection_request',
      'qr_codes_generated',
      'bags_generated',
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await this.renameColumn(
      qr,
      'collection_request',
      'bags_generated',
      'qr_codes_generated',
    );
    await this.renameColumn(
      qr,
      'collection_request',
      'estimated_bags',
      'estimated_volumes',
    );

    await this.renameIndex(
      qr,
      'IDX_ITEM_COLLECTION_REQUEST_BAG_ID',
      'IDX_ITEM_QR_CODE_ID',
    );
    await this.renameColumn(
      qr,
      'item',
      'collection_request_bag_id',
      'qr_code_id',
    );

    await this.renameIndex(
      qr,
      'IDX_COLLECTION_REQUEST_BAG_ROUTE_ID',
      'IDX_QR_CODE_ROUTE_ID',
    );
    await this.renameConstraint(
      qr,
      'collection_request_bag',
      'FK_collection_request_bag_collection_request',
      'FK_qr_code_collection_request',
    );
    await this.renameConstraint(
      qr,
      'collection_request_bag',
      'UQ_collection_request_bag_friendly_code',
      'UQ_qr_code_friendly_code',
    );
    await this.renameConstraint(
      qr,
      'collection_request_bag',
      'UQ_collection_request_bag_token',
      'UQ_qr_code_token',
    );
    await this.renameConstraint(
      qr,
      'collection_request_bag',
      'PK_collection_request_bag',
      'PK_qr_code',
    );

    await this.renameTable(qr, 'collection_request_bag', 'qr_code');
  }
}
