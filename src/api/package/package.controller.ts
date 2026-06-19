import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreatePackageUseCase } from '../../app/use-cases/package/create-package-use-case';
import { CreatePackageDto } from '../../app/use-cases/package/create-package-use-case/create-package.dto';
import { GetAllPackagesUseCase } from '../../app/use-cases/package/get-all-packages-use-case';
import { GetCreatedPackagesUseCase } from '../../app/use-cases/package/get-created-packages-use-case';
import { GetCreatedPackagesDto } from '../../app/use-cases/package/get-created-packages-use-case/get-created-packages.dto';
import { GetPackageByIdUseCase } from '../../app/use-cases/package/get-package-by-id-use-case';
import { UpdatePackageUseCase } from '../../app/use-cases/package/update-package-use-case';
import { UpdatePackageDto } from '../../app/use-cases/package/update-package-use-case/update-package.dto';
import { Role } from '../../domain/user/user-roles.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('package')
export class PackageController {
  constructor(
    private readonly createPackageUseCase: CreatePackageUseCase,
    private readonly getCreatedPackagesUseCase: GetCreatedPackagesUseCase,
    private readonly getPackageByIdUseCase: GetPackageByIdUseCase,
    private readonly updatePackageUseCase: UpdatePackageUseCase,
    private readonly getAllPackagesUseCase: GetAllPackagesUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.OPS)
  getAll() {
    return this.getAllPackagesUseCase.call();
  }

  @Post()
  createPackage(@Body() body: CreatePackageDto) {
    return this.createPackageUseCase.call(body);
  }

  @Get('created')
  getCreatedPackages(@Query() query: GetCreatedPackagesDto) {
    return this.getCreatedPackagesUseCase.call(query);
  }

  @Get(':id')
  getPackageById(@Param('id') id: string) {
    return this.getPackageByIdUseCase.call(id);
  }

  @Patch(':id')
  updatePackage(@Param('id') id: string, @Body() body: UpdatePackageDto) {
    return this.updatePackageUseCase.call({ id, data: body });
  }
}
