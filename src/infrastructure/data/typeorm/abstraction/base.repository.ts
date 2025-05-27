import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { IRepository } from '../../../../domain/interfaces/repository.interface';

export class BaseRepository<Entity> implements IRepository<Entity> {
  protected repository: Repository<Entity>;

  constructor(repository: Repository<Entity>) {
    this.repository = repository;
  }

  public async create(dto: Partial<Entity>): Promise<Entity> {
    const entity = this.repository.create(dto as DeepPartial<Entity>);
    return this.repository.save(entity);
  }

  public async findOne(query: Partial<Entity>): Promise<Entity> {
    const entity = await this.repository.findOne({
      where: this.normalizeQuery(query) as FindOptionsWhere<Entity>,
    });
    return entity;
  }

  public async find(query: Partial<Entity>): Promise<Entity[]> {
    const entities = await this.repository.find({
      where: this.normalizeQuery(query) as FindOptionsWhere<Entity>,
    });
    return entities;
  }

  public async update(
    query: Partial<Entity>,
    dto: Partial<Entity>,
  ): Promise<Entity[]> {
    const entities = await this.repository.find({
      where: this.normalizeQuery(query) as FindOptionsWhere<Entity>,
    });
    const updated = entities.map((entity) => Object.assign(entity, dto));
    return this.repository.save(updated);
  }

  public async delete(query: Partial<Entity>): Promise<Entity> {
    const entity = await this.repository.findOne({
      where: this.normalizeQuery(query) as FindOptionsWhere<Entity>,
    });
    return this.repository.softRemove(entity);
  }

  private normalizeQuery(query: Partial<Entity>): Record<string, any> {
    const normalizedQuery = {};
    
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Se for um objeto (como address), normaliza as propriedades aninhadas
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          normalizedQuery[`${key}_${this.toSnakeCase(nestedKey)}`] = nestedValue;
        }
      } else {
        // Para campos simples, converte para snake_case
        normalizedQuery[this.toSnakeCase(key)] = value;
      }
    }

    return normalizedQuery;
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }
}
