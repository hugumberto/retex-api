import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CompanyProfile } from '../../../../domain/company/company-profile.entity';
import { Company } from '../../../../domain/company/company.entity';
import {
  ICompanyMemberRepository,
  ICompanyProfileRepository,
  ICompanyRepository,
} from '../../../../domain/company/company.repository';
import { IUnitOfWork } from '../../../../domain/interfaces/unit-of-work.interface';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { Role } from '../../../../domain/user/user-roles.entity';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { SendActivationEmailUseCase } from '../../user/send-activation-email-use-case';
import { CreateCompanyUseCase } from '.';

describe('CreateCompanyUseCase', () => {
  let useCase: CreateCompanyUseCase;
  const companyRepositoryMock = mock<ICompanyRepository>();
  const companyProfileRepositoryMock = mock<ICompanyProfileRepository>();
  const companyMemberRepositoryMock = mock<ICompanyMemberRepository>();
  const userRepositoryMock = mock<IUserRepository>();
  const userRoleRepositoryMock = mock<IUserRoleRepository>();
  const cryptoMock = mock<ICryptoService>();
  const sendActivationEmailMock = mock<SendActivationEmailUseCase>();
  const unitOfWork = mock<IUnitOfWork>();

  /** Fica `true` só enquanto o callback da transação está a correr. */
  let insideTransaction = false;
  /** Valor de `insideTransaction` no momento em que a empresa foi gravada. */
  let companyWrittenInsideTransaction: boolean | null = null;

  beforeEach(async () => {
    jest.clearAllMocks();
    insideTransaction = false;
    companyWrittenInsideTransaction = null;

    const module = await Test.createTestingModule({
      providers: [
        CreateCompanyUseCase,
        { provide: DOMAIN_TOKENS.COMPANY_REPOSITORY, useValue: companyRepositoryMock },
        { provide: DOMAIN_TOKENS.COMPANY_PROFILE_REPOSITORY, useValue: companyProfileRepositoryMock },
        { provide: DOMAIN_TOKENS.COMPANY_MEMBER_REPOSITORY, useValue: companyMemberRepositoryMock },
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepositoryMock },
        { provide: DOMAIN_TOKENS.USER_ROLE_REPOSITORY, useValue: userRoleRepositoryMock },
        { provide: DOMAIN_TOKENS.UNIT_OF_WORK, useValue: unitOfWork },
        { provide: SERVICE_TOKENS.CRYPTO_SERVICE, useValue: cryptoMock },
        { provide: SendActivationEmailUseCase, useValue: sendActivationEmailMock },
      ],
    }).compile();
    useCase = module.get(CreateCompanyUseCase);

    unitOfWork.runInTransaction.mockImplementation(async (work) => {
      insideTransaction = true;
      try {
        return await work();
      } finally {
        insideTransaction = false;
      }
    });

    // findOne serve o pré-check de NIF e a geração do código amigável; ambos
    // querem "não existe".
    companyRepositoryMock.findOne.mockResolvedValue(undefined);
    companyProfileRepositoryMock.findByKey.mockResolvedValue({
      id: 'profile-id',
      key: 'MANAGER',
    } as CompanyProfile);
    companyRepositoryMock.create.mockImplementation(async () => {
      companyWrittenInsideTransaction = insideTransaction;
      return { id: 'company-id', name: 'Empresa' } as Company;
    });
    userRepositoryMock.findOne.mockResolvedValue(undefined);
    cryptoMock.hashPassword.mockResolvedValue('hashed');
    userRepositoryMock.create.mockResolvedValue({
      id: 'manager-id',
      email: 'gestor@empresa.pt',
    } as User);
    userRoleRepositoryMock.create.mockResolvedValue({ role: Role.USER, user: {} } as never);
    companyMemberRepositoryMock.create.mockResolvedValue({} as never);
    sendActivationEmailMock.call.mockResolvedValue(undefined as never);
  });

  const param = {
    name: 'Empresa',
    taxId: '501234567',
    manager: {
      firstName: 'Rita',
      lastName: 'Gestora',
      email: 'gestor@empresa.pt',
    },
  } as never;

  it('creates the company and its manager, then sends the activation email', async () => {
    const result = await useCase.call(param);

    expect(result.company.id).toBe('company-id');
    expect(result.managerId).toBe('manager-id');
    expect(companyMemberRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 'company-id', profileId: 'profile-id' }),
    );
    // Depois do commit: um convite para uma empresa que a transação desfizesse
    // apontaria para uma conta inexistente.
    expect(sendActivationEmailMock.call).toHaveBeenCalledWith({
      email: 'gestor@empresa.pt',
    });
  });

  it('writes the company inside the transaction, not before it', async () => {
    await useCase.call(param);

    expect(unitOfWork.runInTransaction).toHaveBeenCalled();
    expect(companyWrittenInsideTransaction).toBe(true);
  });

  it('rolls back the company when the manager email is already taken', async () => {
    userRepositoryMock.findOne.mockResolvedValue({ id: 'existing' } as User);

    await expect(useCase.call(param)).rejects.toThrow(ConflictException);

    // A empresa chegou a ser gravada, mas dentro da transação — o erro propaga-se
    // para fora de `runInTransaction`, que desfaz a escrita. Sem isto ficava uma
    // empresa órfã com o NIF ocupado e nem repetir o pedido corrigido resolvia.
    expect(companyWrittenInsideTransaction).toBe(true);
    expect(sendActivationEmailMock.call).not.toHaveBeenCalled();
  });
});
