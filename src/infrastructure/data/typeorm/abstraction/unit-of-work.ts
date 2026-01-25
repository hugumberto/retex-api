import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import { IUnitOfWork } from '../../../../domain/interfaces/unit-of-work.interface';

@Injectable()
export class TypeORMUnitOfWork implements IUnitOfWork {
  private queryRunner: QueryRunner | null = null;

  constructor(
    private readonly dataSource: DataSource,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    private readonly localStorageService: ILocalStorageService) { }

  async start(): Promise<void> {
    if (this.queryRunner) {
      throw new Error('Transaction already started');
    }
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
  }

  async commit(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('No transaction started');
    }
    try {
      await this.queryRunner.commitTransaction();
    } finally {
      await this.queryRunner.release();
      this.queryRunner = null;
    }
  }

  async rollback(): Promise<void> {
    if (!this.queryRunner) {
      throw new Error('No transaction started');
    }
    try {
      await this.queryRunner.rollbackTransaction();
    } finally {
      await this.queryRunner.release();
      this.queryRunner = null;
    }
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.localStorageService.init(async () => {
      return this.dataSource.transaction(async (entityManager: EntityManager) => {
        this.localStorageService.set({ entityManager });
        return await work();
      });
    });
  }
}
