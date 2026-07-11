export interface GeocodeQuery {
  street?: string;
  number?: string;
  city?: string;
  zipCode?: string;
  countrySet?: string;
}

export interface GeocodeResult {
  lat: number;
  long: number;
}

export interface IGeocodingService {
  /**
   * Geocodifica um endereço em coordenadas. Retorna `null` quando não há
   * chave configurada, a consulta é vazia, ou o provedor não devolve resultado.
   */
  geocode(query: GeocodeQuery): Promise<GeocodeResult | null>;
}
