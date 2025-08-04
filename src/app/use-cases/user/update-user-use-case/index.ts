import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';
import { UpdateUserParamDto } from './update-user-param.dto';

@Injectable()
export class UpdateUserUseCase implements IUseCase<UpdateUserParamDto, Omit<User, 'password'>> {
  constructor(
    @Inject(DOMAIN_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(SERVICE_TOKENS.SANITIZATION_SERVICE)
    private readonly sanitizationService: ISanitizationService,
    @Inject(SERVICE_TOKENS.CRYPTO_SERVICE)
    private readonly cryptoService: ICryptoService,
  ) { }

  async call(param: UpdateUserParamDto): Promise<Omit<User, 'password'>> {
    const { id, data } = param;

    // Verificar se usuário existe
    const existingUser = await this.userRepository.findOne({ id });
    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Preparar dados para atualização
    const updateData: Partial<User> = { ...data };

    // Sanitizar documento se fornecido
    if (data.documentNumber) {
      updateData.documentNumber = this.sanitizationService.sanitizeNumericString(data.documentNumber);

      // Verificar se documento já existe em outro usuário
      const userWithDocument = await this.userRepository.findOne({
        documentNumber: updateData.documentNumber
      });
      if (userWithDocument && userWithDocument.id !== id) {
        throw new ConflictException('Documento já está em uso por outro usuário');
      }
    }

    // Verificar se email já existe em outro usuário
    if (data.email) {
      const userWithEmail = await this.userRepository.findOne({ email: data.email });
      if (userWithEmail && userWithEmail.id !== id) {
        throw new ConflictException('Email já está em uso por outro usuário');
      }
    }

    // Hash da senha se fornecida
    if (data.password) {
      updateData.password = await this.cryptoService.hashPassword(data.password);
    }

    // Atualizar usuário
    const [updatedUser] = await this.userRepository.update({ id }, updateData);

    // Remover senha do retorno
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
} 