export interface IUnitOfWork {
  start(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
