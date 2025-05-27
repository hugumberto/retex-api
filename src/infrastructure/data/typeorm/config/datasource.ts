import { DataSource } from 'typeorm';
import { DATABASE_CONFIG } from './typeorm.config';

export const DATA_SOURCE = new DataSource(DATABASE_CONFIG);
