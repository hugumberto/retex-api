import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ILocalStorageService } from '../../../../app/services/local-storage/local-storage.service';
import { SERVICE_TOKENS } from '../../../../app/services/tokens';
import {
  BlogCategory,
  BlogCategoryStatus,
} from '../../../../domain/blog-post/blog-category.entity';
import { IBlogCategoryRepository } from '../../../../domain/blog-post/blog-category.repository';
import { BaseRepository } from '../abstraction/base.repository';
import { blogCategorySchema } from './blog-category.schema';

@Injectable()
export class BlogCategoryRepository
  extends BaseRepository<BlogCategory>
  implements IBlogCategoryRepository {
  constructor(
    @InjectRepository(blogCategorySchema)
    blogCategoryRepository: Repository<BlogCategory>,
    @Inject(SERVICE_TOKENS.LOCAL_STORAGE_SERVICE)
    localStorageService: ILocalStorageService,
  ) {
    super(blogCategoryRepository, localStorageService);
  }

  async findAll(): Promise<BlogCategory[]> {
    const repository = await this.getRepository();
    return repository.find({ order: { title: 'ASC' } });
  }

  async findActive(): Promise<BlogCategory[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { status: BlogCategoryStatus.ACTIVE },
      order: { title: 'ASC' },
    });
  }

  async findByIds(ids: string[]): Promise<BlogCategory[]> {
    if (!ids?.length) return [];
    const repository = await this.getRepository();
    return repository.find({ where: { id: In(ids) } });
  }

  async findBySlug(slug: string): Promise<BlogCategory> {
    const repository = await this.getRepository();
    return repository.findOne({ where: { slug } });
  }
}
