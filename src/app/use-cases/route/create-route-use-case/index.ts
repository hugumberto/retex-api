import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { Route, RouteStatus } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Role } from '../../../../domain/user/user-roles.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { CreateRouteDto } from './create-route.dto';

@Injectable()
export class CreateRouteUseCase implements IUseCase<CreateRouteDto, Route> {
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) { }

  async call(param: CreateRouteDto): Promise<Route> {
    // 1. Verificar se o usuário existe e tem role DRIVER
    const driver = await this.userRepository.findOneWithRelations({ id: param.driverId });
    if (!driver) {
      throw new NotFoundException('Driver não encontrado');
    }

    const hasDriverRole = driver.roles?.some(role => role.role === Role.DRIVER);
    if (!hasDriverRole) {
      throw new BadRequestException('Usuário não possui role de driver');
    }

    // 2. Buscar todos os packages pelos IDs
    const packages = [];
    for (const packageId of param.packageIds) {
      const packageEntity = await this.packageRepository.findOne({ id: packageId });
      if (!packageEntity) {
        throw new NotFoundException(`Package com ID ${packageId} não encontrado`);
      }

      // 3. Verificar se package está no status CREATED
      if (packageEntity.status !== PackageStatus.CREATED) {
        throw new BadRequestException(`Package ${packageId} não está no status CREATED`);
      }

      // 4. Verificar se package já não está associado a outra route
      if (packageEntity.route) {
        throw new ConflictException(`Package ${packageId} já está associado a uma route`);
      }

      packages.push(packageEntity);
    }

    // 5. Criar a route no status DRAFTING
    const routeData: Partial<Route> = {
      status: RouteStatus.DRAFTING,
      driver: driver,
      packages: packages,
      startDate: new Date(param.startDate),
    };

    return this.routeRepository.create(routeData);
  }
} 