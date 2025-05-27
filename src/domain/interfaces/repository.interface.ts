export interface IRepository<Entity> {
  create(dto: Partial<Entity>): Promise<Entity>;
  findOne(query: Partial<Entity>): Promise<Entity>;
  find(query: Partial<Entity>): Promise<Entity[]>;
  update(query: Partial<Entity>, dto: Partial<Entity>): Promise<Entity[]>;
  delete(query: Partial<Entity>): Promise<Entity>;
}
