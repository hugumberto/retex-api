import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { CollectionInterval } from '../../../../domain/route/route.entity';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { SendCollectionRemindersUseCase } from '.';

function makeRequest(id: string, email: string): CollectionRequest {
  return {
    id,
    friendlyCode: `2026-00000${id}`,
    user: { id: `u-${id}`, email, firstName: 'Ana', lastName: 'Silva', language: 'pt' },
    route: {
      startDate: new Date('2026-05-13T00:00:00Z'),
      collectionInterval: CollectionInterval.MORNING,
    },
  } as unknown as CollectionRequest;
}

describe('SendCollectionRemindersUseCase', () => {
  const collectionRequestRepo = mock<ICollectionRequestRepository>();
  const emailService = mock<IEmailService>();
  let useCase: SendCollectionRemindersUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SendCollectionRemindersUseCase,
        { provide: DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY, useValue: collectionRequestRepo },
        { provide: SERVICE_TOKENS.EMAIL_SERVICE, useValue: emailService },
      ],
    }).compile();
    useCase = module.get(SendCollectionRemindersUseCase);
  });

  it('sends the reminder and marks collectionReminderSentAt for each request', async () => {
    collectionRequestRepo.findPendingCollectionReminders.mockResolvedValue([
      makeRequest('1', 'a@x.pt'),
      makeRequest('2', 'b@x.pt'),
    ]);

    const result = await useCase.call();

    expect(emailService.send).toHaveBeenCalledTimes(2);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@x.pt',
        template: 'collection-reminder',
        locale: 'pt',
        meta: { type: 'collection-reminder', userId: 'u-1' },
      }),
    );
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: '1' },
      { collectionReminderSentAt: expect.any(Date) },
    );
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: '2' },
      { collectionReminderSentAt: expect.any(Date) },
    );
    expect(result).toEqual({ sent: 2, failed: 0 });
  });

  it('does not mark the request nor abort the batch when the send fails', async () => {
    collectionRequestRepo.findPendingCollectionReminders.mockResolvedValue([
      makeRequest('1', 'a@x.pt'),
      makeRequest('2', 'b@x.pt'),
    ]);
    emailService.send.mockRejectedValueOnce(new Error('SMTP down'));

    const result = await useCase.call();

    // A segunda solicitação continua a ser processada.
    expect(emailService.send).toHaveBeenCalledTimes(2);
    // Só a que foi enviada com sucesso fica marcada.
    expect(collectionRequestRepo.update).toHaveBeenCalledTimes(1);
    expect(collectionRequestRepo.update).toHaveBeenCalledWith(
      { id: '2' },
      { collectionReminderSentAt: expect.any(Date) },
    );
    expect(result).toEqual({ sent: 1, failed: 1 });
  });

  it('returns zeros and sends nothing when there is nothing pending', async () => {
    collectionRequestRepo.findPendingCollectionReminders.mockResolvedValue([]);

    const result = await useCase.call();

    expect(emailService.send).not.toHaveBeenCalled();
    expect(collectionRequestRepo.update).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, failed: 0 });
  });
});
