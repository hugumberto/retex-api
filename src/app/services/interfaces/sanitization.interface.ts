export interface ISanitizationService {
  sanitizeNumericString(value: string): string;
  sanitizeCoordinate(value: string): number;
  sanitizeString(value: string): string;
} 