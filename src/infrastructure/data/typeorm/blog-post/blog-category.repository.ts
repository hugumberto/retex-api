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
    const [categories, counts] = await Promise.all([
      repository.find({ order: { position: 'ASC', title: 'ASC' } }),
      repository.manager.query(
        `SELECT pc.category_id AS id, COUNT(*) AS posts
           FROM blog_post_categories pc
           JOIN blog_post p ON p.id = pc.post_id AND p.deleted_at IS NULL
          GROUP BY pc.category_id`,
      ) as Promise<{ id: string; posts: string }[]>,
    ]);
    return categories.map((c) => ({
      ...c,
      postsCount: Number(counts.find((r) => r.id === c.id)?.posts ?? 0),
    }));
  }

  async countPosts(id: string): Promise<number> {
    const repository = await this.getRepository();
    const [row] = await repository.manager.query(
      `SELECT COUNT(*) AS posts FROM blog_post_categories pc
         JOIN blog_post p ON p.id = pc.post_id AND p.deleted_at IS NULL
        WHERE pc.category_id = $1`,
      [id],
    );
    return Number(row?.posts ?? 0);
  }

  async nextPosition(): Promise<number> {
    const repository = await this.getRepository();
    const [row] = await repository.manager.query(
      `SELECT COALESCE(MAX(position) + 1, 0) AS next FROM blog_category WHERE deleted_at IS NULL`,
    );
    return Number(row?.next ?? 0);
  }

  async reorder(ids: string[]): Promise<void> {
    const repository = await this.getRepository();
    await repository.manager.query(
      `UPDATE blog_category c SET position = o.ord - 1, updated_at = now()
         FROM unnest($1::uuid[]) WITH ORDINALITY AS o(id, ord)
        WHERE c.id = o.id`,
      [ids],
    );
  }

  async findActive(): Promise<BlogCategory[]> {
    const repository = await this.getRepository();
    return repository.find({
      where: { status: BlogCategoryStatus.ACTIVE },
      order: { position: 'ASC', title: 'ASC' },
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
