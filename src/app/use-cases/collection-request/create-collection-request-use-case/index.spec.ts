import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { CompanyContextService } from '../../../services/company-context/company-context.service';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRoleRepository } from '../../../../domain/user/user-role.repository';
import { IUserRepository } from '../../../../domain/user/user.repository';
import { ICryptoService } from '../../../services/interfaces/crypto.interface';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { ISanitizationService } from '../../../services/interfaces/sanitization.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { CreateCollectionRequestUseCase } from '.';

describe('CreateCollectionRequestUseCase', () => {
  let useCase: CreateCollectionRequestUseCase;
  const collectionRequestRepositoryMock = mock<ICollectionRequestRepository>();
  const testZoneRepositoryMock = mock<ITestZoneRepository>();
  const userRepositoryMock = mock<IUserRepository>();
  const addressRepositoryMock = mock<IAddressRepository>();
  const sanitizationMock = mock<ISanitizationService>();
  const userRoleRepositoryMock = mock<IUserRoleRepository>();
  const cryptoMock = mock<ICryptoService>();
  const emailServiceMock = mock<IEmailService>();
  const unitOfWork = { runInTransaction: (work: () => unknown) => work() };

  // Por omissão o utilizador não é membro de empresa — preserva o comportamento
  // dos particulares, que é o que estes testes cobrem.
  const companyContextMock = { resolve: jest.fn().mockResolvedValue(null) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateCollectionRequestUseCase,
        { provide: CompanyContextService, useValue: companyContextMock },
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepositoryMock },
        { provide: DOMAIN_TOKENS.TEST_ZONE_REPOSITORY, useValue: testZoneRepositoryMock },
        { provide: DOMAIN_TOKENS.UNIT_OF_WORK, useValue: unitOfWork },
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepositoryMock },
        { provide: DOMAIN_TOKENS.USER_ROLE_REPOSITORY, useValue: userRoleRepositoryMock },
        { provide: SERVICE_TOKENS.CRYPTO_SERVICE, useValue: cryptoMock },
        { provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY, useValue: addressRepositoryMock },
        { provide: SERVICE_TOKENS.SANITIZATION_SERVICE, useValue: sanitizationMock },
        { provide: SERVICE_TOKENS.EMAIL_SERVICE, useValue: emailServiceMock },
      ],
    }).compile();
    useCase = module.get(CreateCollectionRequestUseCase);
  });

  const param = { userId: 'user-id', addressId: 'addr-id', estimatedBags: 2 } as any;
  const user = { id: 'user-id', firstName: 'John', lastName: 'Doe', email: 'j@d.pt' } as User;
  const address = {
    id: 'addr-id', userId: 'user-id', city: 'Lisboa', street: 'R', number: '1', zipCode: '1000',
  } as Address;

  beforeEach(() => {
    sanitizationMock.sanitizeString.mockImplementation((v: string) => v);
    sanitizationMock.sanitizeNumericString.mockImplementation((v: string) => v);
    sanitizationMock.sanitizeCoordinate.mockImplementation((v: string) => Number(v));
    emailServiceMock.send.mockResolvedValue(undefined);
    cryptoMock.hashPassword.mockResolvedValue('hashed');
  });

  it('throws NotFound when the user does not exist', async () => {
    userRepositoryMock.findOne.mockResolvedValue(undefined);
    await expect(useCase.call(param)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFound when the address is not owned by the user', async () => {
    userRepositoryMock.findOne.mockResolvedValue(user);
    addressRepositoryMock.findOne.mockResolvedValue({ ...address, userId: 'other' } as Address);
    await expect(useCase.call(param)).rejects.toThrow(NotFoundException);
  });

  it('creates with status CREATED when the city is in a service zone', async () => {
    userRepositoryMock.findOne.mockResolvedValue(user);
    addressRepositoryMock.findOne.mockResolvedValue(address);
    testZoneRepositoryMock.findByCity.mockResolvedValue({ id: 'z', city: 'Lisboa' } as any);
    collectionRequestRepositoryMock.create.mockImplementation(async (dto) => ({ id: 'pkg', ...dto } as any));

    await useCase.call(param);

    expect(collectionRequestRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: CollectionRequestStatus.CREATED, estimatedBags: 2 }),
    );
  });

  it('creates with status OUT_OF_ZONE when the city has no service zone', async () => {
    userRepositoryMock.findOne.mockResolvedValue(user);
    addressRepositoryMock.findOne.mockResolvedValue(address);
    testZoneRepositoryMock.findByCity.mockResolvedValue(null);
    collectionRequestRepositoryMock.create.mockImplementation(async (dto) => ({ id: 'pkg', ...dto } as any));

    await useCase.call(param);

    expect(collectionRequestRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: CollectionRequestStatus.OUT_OF_ZONE }),
    );
  });
  // ── cliente ao balcão (operador escreve os dados) ──────────────────────────

  const walkIn = {
    firstName: 'Silvia',
    lastName: 'Costa',
    email: 'Silvia@Exemplo.PT',
    contactPhone: '931101666',
    estimatedBags: 15,
    address: {
      street: 'Rua São Romão',
      number: '1161',
      city: 'Maia',
      zipCode: '4470365',
      lat: '41.227639',
      long: '-8.612772',
    },
  } as any;

  it('creates client and address when the operator types them', async () => {
    userRepositoryMock.findOne.mockResolvedValue(undefined);
    userRepositoryMock.create.mockResolvedValue({ id: 'new-user', ...walkIn } as User);
    addressRepositoryMock.findByUser.mockResolvedValue([]);
    addressRepositoryMock.create.mockImplementation(async (dto) => ({ id: 'new-addr', ...dto } as Address));
    testZoneRepositoryMock.findByCity.mockResolvedValue({ id: 'z', city: 'Maia' } as any);
    collectionRequestRepositoryMock.create.mockImplementation(async (dto) => ({ id: 'pkg', ...dto } as any));

    await useCase.call(walkIn);

    // Email normalizado: é a chave que identifica o cliente.
    expect(userRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'silvia@exemplo.pt' }),
    );
    // Primeira morada do cliente fica como predefinida.
    expect(addressRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'new-user', isDefault: true, isInServiceZone: true }),
    );
    expect(userRoleRepositoryMock.create).toHaveBeenCalled();
  });

  it('reuses the client when the email already exists', async () => {
    userRepositoryMock.findOne.mockResolvedValue(user);
    addressRepositoryMock.findByUser.mockResolvedValue([]);
    addressRepositoryMock.create.mockImplementation(async (dto) => ({ id: 'new-addr', ...dto } as Address));
    testZoneRepositoryMock.findByCity.mockResolvedValue(null);
    collectionRequestRepositoryMock.create.mockImplementation(async (dto) => ({ id: 'pkg', ...dto } as any));

    const pkg = await useCase.call(walkIn);

    expect(userRepositoryMock.create).not.toHaveBeenCalled();
    expect((pkg as any).user).toBe(user);
    expect((pkg as any).status).toBe(CollectionRequestStatus.OUT_OF_ZONE);
  });

  it('reuses an address the client already has', async () => {
    const existing = {
      id: 'addr-existente', userId: 'user-id', street: 'Rua São Romão',
      number: '1161', zipCode: '4470365', city: 'Maia',
    } as Address;
    userRepositoryMock.findOne.mockResolvedValue(user);
    addressRepositoryMock.findByUser.mockResolvedValue([existing]);
    testZoneRepositoryMock.findByCity.mockResolvedValue({ id: 'z', city: 'Maia' } as any);
    collectionRequestRepositoryMock.create.mockImplementation(async (dto) => ({ id: 'pkg', ...dto } as any));

    const pkg = await useCase.call(walkIn);

    expect(addressRepositoryMock.create).not.toHaveBeenCalled();
    expect((pkg as any).address).toBe(existing);
  });
});
