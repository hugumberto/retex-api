import { Injectable, Logger } from '@nestjs/common';
import {
  GeocodeQuery,
  GeocodeResult,
  IGeocodingService,
} from '../../../app/services/interfaces/geocoding.interface';

/**
 * Geocodificação via TomTom Search API (free-form geocode endpoint).
 * Requer a env `TOMTOM_API_KEY`. A base pode ser sobrescrita com
 * `TOMTOM_GEOCODE_URL` (default: endpoint público de geocode da TomTom).
 */
@Injectable()
export class GeocodingService implements IGeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly baseUrl =
    process.env.TOMTOM_GEOCODE_URL ??
    'https://api.tomtom.com/search/2/geocode/';
  private readonly apiKey = process.env.TOMTOM_API_KEY ?? '';

  async geocode(query: GeocodeQuery): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      this.logger.warn('TOMTOM_API_KEY não configurada; geocoding desativado');
      return null;
    }

    const freeForm = [query.street, query.number, query.zipCode, query.city]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!freeForm) {
      return null;
    }

    const countrySet = query.countrySet ?? 'PT';
    const url =
      `${this.baseUrl}${encodeURIComponent(freeForm)}.json` +
      `?limit=1&countrySet=${countrySet}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.warn(
          `Geocoding falhou (${response.status}) para "${freeForm}"`,
        );
        return null;
      }

      const data = (await response.json()) as {
        results?: Array<{ position?: { lat?: number; lon?: number } }>;
      };
      const position = data?.results?.[0]?.position;

      if (
        !position ||
        typeof position.lat !== 'number' ||
        typeof position.lon !== 'number'
      ) {
        return null;
      }

      return { lat: position.lat, long: position.lon };
    } catch (error) {
      this.logger.warn(
        `Erro ao geocodificar "${freeForm}": ${(error as Error).message}`,
      );
      return null;
    }
  }
}
