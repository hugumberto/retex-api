import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePackageUseCase } from '../../app/use-cases/package/create-package-use-case';
import { CreatePackageDto } from '../../app/use-cases/package/create-package-use-case/create-package.dto';
import { GetCreatedPackagesUseCase } from '../../app/use-cases/package/get-created-packages-use-case';
import { GetCreatedPackagesDto } from '../../app/use-cases/package/get-created-packages-use-case/get-created-packages.dto';
import { UpdatePackageUseCase } from '../../app/use-cases/package/update-package-use-case';
import { UpdatePackageDto } from '../../app/use-cases/package/update-package-use-case/update-package.dto';

@Controller('package')
export class PackageController {
  constructor(
    private readonly createPackageUseCase: CreatePackageUseCase,
    private readonly getCreatedPackagesUseCase: GetCreatedPackagesUseCase,
    private readonly updatePackageUseCase: UpdatePackageUseCase,
  ) {}

  @Post()
  createPackage(@Body() body: CreatePackageDto) {
    return this.createPackageUseCase.call(body);
  }

  @Get('created')
  getCreatedPackages(@Query() query: GetCreatedPackagesDto) {
    return this.getCreatedPackagesUseCase.call(query);
  }

  @Patch(':id')
  updatePackage(@Param('id') id: string, @Body() body: UpdatePackageDto) {
    return this.updatePackageUseCase.call({ id, data: body });
  }
}
