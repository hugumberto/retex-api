import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from '../app/services/auth/auth.module';
import { UseCasesModule } from '../app/use-cases/use-cases.module';
import { AuthController } from './auth/auth.controller';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { BlogCategoryController } from './blog-category/blog-category.controller';
import { BlogPostController } from './blog-post/blog-post.controller';
import { CollectionController } from './collection/collection.controller';
import { ContactController } from './contact/contact.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { FaqController } from './faq/faq.controller';
import { TestZoneController } from './test-zone/test-zone.controller';
import { BrandController } from './brand/brand.controller';
import { MeController } from './me/me.controller';
import { HealthController } from './health/health.controller';
import { ItemController } from './item/item.controller';
import { PackageController } from './package/package.controller';
import { QrCodeController } from './qr-code/qr-code.controller';
import { RouteController } from './route/route.controller';
import { StorageUnitController } from './storage-unit/storage-unit.controller';
import { SystemParameterController } from './system-parameter/system-parameter.controller';
import { UserController } from './user/user.controller';
import { WelcomeController } from './welcome/welcome.controller';

@Module({
  imports: [
    UseCasesModule.register(),
    TerminusModule,
    AuthModule,
  ],
  controllers: [
    WelcomeController,
    MeController,
    UserController,
    AuthController,
    HealthController,
    PackageController,
    RouteController,
    StorageUnitController,
    QrCodeController,
    CollectionController,
    SystemParameterController,
    BrandController,
    ItemController,
    BlogPostController,
    BlogCategoryController,
    TestZoneController,
    FaqController,
    ContactController,
    DashboardController,
  ],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    // Secure-by-default: autentica TODAS as rotas, exceto as marcadas com @Public().
    // As roles são validadas apenas nas rotas/classes marcadas com @Roles().
    // A ordem importa — JwtAuthGuard preenche request.user antes de o RolesGuard validar as roles.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class ApiModule { }
