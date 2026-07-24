import { IRepository } from '../interfaces/repository.interface';
import { Brand } from './brand.entity';

export interface IBrandRepository extends IRepository<Brand> {
  // Procura uma marca pelo nome, ignorando maiúsculas/minúsculas e espaços à
  // volta. Usado para impedir marcas com nome duplicado.
  findByName(name: string): Promise<Brand | null>;
}
