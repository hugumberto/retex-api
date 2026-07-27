import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Address } from '../../../../domain/address/address.entity';
import { IAddressRepository } from '../../../../domain/address/address.repository';
import { CollectionRequestStatus } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { ITestZoneRepository } from '../../../../domain/test-zone/test-zone.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { User } from '../../../../domain/user/user.entity';
import { IUserRepository } from '../../../../domain/user/user.repository';
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
  const emailServiceMock = mock<IEmailService>();
  const unitOfWork = { runInTransaction: (work: () => unknown) => work() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CreateCollectionRequestUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepositoryMock },
        { provide: DOMAIN_TOKENS.TEST_ZONE_REPOSITORY, useValue: testZoneRepositoryMock },
        { provide: DOMAIN_TOKENS.UNIT_OF_WORK, useValue: unitOfWork },
        { provide: DOMAIN_TOKENS.USER_REPOSITORY, useValue: userRepositoryMock },
        { provide: DOMAIN_TOKENS.ADDRESS_REPOSITORY, useValue: addressRepositoryMock },
        { provide: SERVICE_TOKENS.SANITIZATION_SERVICE, useValue: sanitizationMock },
        { provide: SERVICE_TOKENS.EMAIL_SERVICE, useValue: emailServiceMock },
      ],
    }).compile();
    useCase = module.get(CreateCollectionRequestUseCase);
  });

  const param = { userId: 'user-id', addressId: 'addr-id', estimatedVolumes: 2 } as any;
  const user = { id: 'user-id', firstName: 'John', lastName: 'Doe', email: 'j@d.pt' } as User;
  const address = {
    id: 'addr-id', userId: 'user-id', city: 'Lisboa', street: 'R', number: '1', zipCode: '1000',
  } as Address;

  beforeEach(() => {
    sanitizationMock.sanitizeString.mockImplementation((v: string) => v);
    emailServiceMock.send.mockResolvedValue(undefined);
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
      expect.objectContaining({ status: CollectionRequestStatus.CREATED, estimatedVolumes: 2 }),
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
});
