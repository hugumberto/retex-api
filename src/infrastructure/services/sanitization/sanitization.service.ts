import { Injectable } from '@nestjs/common';
import { ISanitizationService } from '../../../app/services/interfaces/sanitization.interface';

@Injectable()
export class SanitizationService implements ISanitizationService {
  sanitizeNumericString(value: string): string {
    return value.replace(/\D/g, '');
  }

  sanitizeCoordinate(value: string): number {
    return parseFloat(value.replace(/[^\d.-]/g, ''));
  }

  sanitizeString(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .toLowerCase()
      .trim();
  }
} 