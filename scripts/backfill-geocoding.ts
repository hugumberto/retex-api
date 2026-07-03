/**
 * Backfill de coordenadas em `user_address`.
 *
 * Percorre endereços com lat=0 e long=0, geocodifica via TomTom
 * (GeocodingService) e atualiza as coordenadas.
 *
 * Uso:
 *   TOMTOM_API_KEY=xxxxx DATABASE_URL=postgres://... \
 *   ts-node -r tsconfig-paths/register scripts/backfill-geocoding.ts
 */
import 'dotenv/config';
import { DATA_SOURCE } from '../src/infrastructure/data/typeorm/config/datasource';
import { GeocodingService } from '../src/infrastructure/services/geocoding/geocoding.service';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface AddressRow {
  id: string;
  street: string;
  number: string;
  city: string;
  zip_code: string;
}

async function main() {
  if (!process.env.TOMTOM_API_KEY) {
    console.error('TOMTOM_API_KEY não configurada. Abortando.');
    process.exit(1);
  }

  await DATA_SOURCE.initialize();
  const geocoder = new GeocodingService();

  const rows: AddressRow[] = await DATA_SOURCE.query(
    `SELECT id, street, number, city, zip_code
     FROM user_address
     WHERE lat = 0 AND "long" = 0 AND deleted_at IS NULL`,
  );

  console.log(`Endereços sem coordenadas: ${rows.length}`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const result = await geocoder.geocode({
      street: row.street,
      number: row.number,
      city: row.city,
      zipCode: row.zip_code,
    });

    if (!result) {
      skipped++;
      console.warn(`  · sem match: ${row.street} ${row.number}, ${row.city}`);
      await sleep(250);
      continue;
    }

    await DATA_SOURCE.query(
      `UPDATE user_address SET lat = $1, "long" = $2, updated_at = now() WHERE id = $3`,
      [result.lat, result.long, row.id],
    );
    updated++;
    await sleep(250);
  }

  console.log(`\nConcluído. Atualizados: ${updated} · Sem match: ${skipped}`);
  await DATA_SOURCE.destroy();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
