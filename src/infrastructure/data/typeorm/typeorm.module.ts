import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { addressSchema } from './address/address.schema';
import { blogCategorySchema } from './blog-post/blog-category.schema';
import { blogPostSchema } from './blog-post/blog-post.schema';
import { brandSchema } from './brand/brand.schema';
import { emailLogSchema } from './email-log/email-log.schema';
import { TEST_DATABASE_CONFIG } from './config/typeorm-test.config';
import { DATABASE_CONFIG } from './config/typeorm.config';
import { itemSchema } from './item/item.schema';
import { collectionRequestSchema } from './collection-request/collection-request.schema';
import { collectionRequestBagSchema } from './collection-request-bag/collection-request-bag.schema';
import { routeSchema } from './route/route.schema';
import { systemParameterSchema } from './system-parameter/system-parameter.schema';
import { storageUnitSchema } from './storage-unit/storage-unit.schema';
import { faqCategorySchema } from './faq/faq-category.schema';
import { faqItemSchema } from './faq/faq-item.schema';
import { testZoneSchema } from './test-zone/test-zone.schema';
import { userRoleSchema } from './user-role/user-role.schema';
import { companyMemberSchema } from './company/company-member.schema';
import { companyProfileSchema } from './company/company-profile.schema';
import { companySchema } from './company/company.schema';
import { refreshTokenSchema } from './user/refresh-token.schema';
import { userSchema } from './user/user.schema';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      process.env.NODE_ENV !== 'test' ? DATABASE_CONFIG : TEST_DATABASE_CONFIG,
    ),
    TypeOrmModule.forFeature([
      userSchema,
      addressSchema,
      testZoneSchema,
      brandSchema,
      itemSchema,
      collectionRequestSchema,
      routeSchema,
      storageUnitSchema,
      collectionRequestBagSchema,
      systemParameterSchema,
      userRoleSchema,
      refreshTokenSchema,
      blogPostSchema,
      blogCategorySchema,
      faqCategorySchema,
      faqItemSchema,
      emailLogSchema,
      companySchema,
      companyProfileSchema,
      companyMemberSchema,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class AppTypeORMModule { }
