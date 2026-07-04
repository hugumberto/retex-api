import { IRepository } from '../interfaces/repository.interface';
import { SystemParameter } from './system-parameter.entity';

export interface ISystemParameterRepository
  extends IRepository<SystemParameter> {
  // Retorna a linha única de parâmetros (ou undefined se ainda não existir).
  getSingleton(): Promise<SystemParameter>;
}
