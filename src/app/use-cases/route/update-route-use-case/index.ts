import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PackageStatus } from '../../../../domain/package/package.entity';
import { IPackageRepository } from '../../../../domain/package/package.repository';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { Role } from '../../../../domain/user/user-roles.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpdateRouteDto } from './update-route.dto';

export interface UpdateRouteParamDto {
  id: string;
  data: UpdateRouteDto;
}

@Injectable()
export class UpdateRouteUseCase implements IUseCase<UpdateRouteParamDto, Route> {
  constructor(
    @Inject(DOMAIN_TOKENS.ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(DOMAIN_TOKENS.PACKAGE_REPOSITORY)
    private readonly packageRepository: IPackageRepository,
  ) { }

  async call(param: UpdateRouteParamDto): Promise<Route> {
    const { id, data } = param;

    // 1. Verificar se a route existe
    const existingRoute = await this.routeRepository.findOne({ id });
    if (!existingRoute) {
      throw new NotFoundException('Route não encontrada');
    }

    // 2. Preparar dados para atualização
    const updateData: Partial<Route> = {};

    // 3. Validar e atualizar driver se fornecido
    if (data.driverId) {
      const driver = await this.userRepository.findOneWithRelations({ id: data.driverId });
      if (!driver) {
        throw new NotFoundException('Driver não encontrado');
      }

      const hasDriverRole = driver.roles?.some(role => role.role === Role.DRIVER);
      if (!hasDriverRole) {
        throw new BadRequestException('Usuário não possui role de driver');
      }

      updateData.driver = driver;
    }

    // 4. Validar e atualizar packages se fornecidos
    if (data.packageIds) {
      const packages = [];
      for (const packageId of data.packageIds) {
        const packageEntity = await this.packageRepository.findOne({ id: packageId });
        if (!packageEntity) {
          throw new NotFoundException(`Package com ID ${packageId} não encontrado`);
        }

        // Verificar se package está no status CREATED
        if (packageEntity.status !== PackageStatus.CREATED) {
          throw new BadRequestException(`Package ${packageId} não está no status CREATED`);
        }

        // Verificar se package já não está associado a outra route (exceto a atual)
        if (packageEntity.route && packageEntity.route.id !== id) {
          throw new ConflictException(`Package ${packageId} já está associado a outra route`);
        }

        packages.push(packageEntity);
      }
      updateData.packages = packages;
    }

    // 5. Atualizar outros campos
    if (data.status) {
      updateData.status = data.status;
    }

    if (data.startDate) {
      updateData.startDate = new Date(data.startDate);
    }

    if (data.endDate) {
      updateData.endDate = new Date(data.endDate);
    }

    // 6. Atualizar a route
    const [updatedRoute] = await this.routeRepository.update({ id }, updateData);
    return updatedRoute;
  }
} 