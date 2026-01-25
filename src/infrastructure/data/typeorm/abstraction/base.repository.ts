import { DeepPartial, EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { IRepository } from '../../../../domain/interfaces/repository.interface';

export class BaseRepository<Entity> implements IRepository<Entity> {
  private readonly _repository: Repository<Entity>;

  constructor(repository: Repository<Entity>, private readonly localStorageService: ILocalStorageService) {
    this._repository = repository;
  }

  public async create(dto: Partial<Entity>): Promise<Entity> {
    const repository = await this.getRepository();
    const entity = repository.create(dto as DeepPartial<Entity>);
    return repository.save(entity);
  }

  public async findOne(query: Partial<Entity>): Promise<Entity> {
    const repository = await this.getRepository();
    const entity = await repository.findOne({
      where: this.normalizeQuery(query) as FindOptionsWhere<Entity>,
    });
    return entity;
  }

  public async find(query: Partial<Entity>): Promise<Entity[]> {
    const repository = await this.getRepository();
    const entities = await repository.find({
      where: this.normalizeQuery(query) as FindOptionsWhere<Entity>,
    });
    return entities;
  }

  public async update(
    query: Partial<Entity>,
    dto: Partial<Entity>,
  ): Promise<Entity[]> {
    const repository = await this.getRepository();
    const entities = await repository.find({
      where: this.normalizeQuery(query) as FindOptionsWhere<Entity>,
    });
    const updated = entities.map((entity) => Object.assign(entity, dto));
    return repository.save(updated);
  }

  public async delete(query: Partial<Entity>): Promise<Entity> {
    const repository = await this.getRepository();
    const entity = await repository.findOne({
      where: this.normalizeQuery(query) as FindOptionsWhere<Entity>,
    });
    return repository.softRemove(entity);
  }

  protected async getRepository(): Promise<Repository<Entity>> {
    const entityManager = await this.localStorageService.get<{ entityManager: EntityManager }>();
    if (!entityManager || !entityManager.entityManager) {
      return this._repository;
    }
    return entityManager.entityManager.getRepository(this._repository.target);
  }

  protected normalizeQuery(query: Partial<Entity>): Record<string, any> {
    const normalizedQuery = {};

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Se for um objeto (como address), normaliza as propriedades aninhadas
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          normalizedQuery[`${key}_${nestedKey}`] = nestedValue;
        }
      } else {
        // Para campos simples, converte para snake_case
        normalizedQuery[key] = value;
      }
    }

    return normalizedQuery;
  }
}
