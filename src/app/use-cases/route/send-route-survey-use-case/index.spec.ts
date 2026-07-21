import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { Route } from '../../../../domain/route/route.entity';
import { IRouteRepository } from '../../../../domain/route/route.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IEmailService } from '../../../services/interfaces/email.interface';
import { SERVICE_TOKENS } from '../../../services/tokens';
import { SendRouteSurveyUseCase } from '.';

describe('SendRouteSurveyUseCase', () => {
  const routeRepo = mock<IRouteRepository>();
  const emailService = mock<IEmailService>();
  let useCase: SendRouteSurveyUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SendRouteSurveyUseCase,
        { provide: DOMAIN_TOKENS.ROUTE_REPOSITORY, useValue: routeRepo },
        { provide: SERVICE_TOKENS.EMAIL_SERVICE, useValue: emailService },
      ],
    }).compile();
    useCase = module.get(SendRouteSurveyUseCase);
    emailService.send.mockResolvedValue(undefined);
  });

  it('throws NotFound when the route does not exist', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue(
      undefined as unknown as Route,
    );
    await expect(useCase.call('r1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequest when the route is not FINISHED', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'IN_TRANSIT',
      packages: [],
    } as unknown as Route);
    await expect(useCase.call('r1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sends only to COLLECTED packages, deduped by email', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'FINISHED',
      packages: [
        { status: 'COLLECTED', user: { id: 'u1', email: 'a@x.pt', firstName: 'A', lastName: 'A' } },
        { status: 'CANCELLED', user: { id: 'u2', email: 'b@x.pt', firstName: 'B', lastName: 'B' } },
        // Mesmo cliente (email) em dois pacotes COLLECTED → um único envio.
        { status: 'COLLECTED', user: { id: 'u1', email: 'a@x.pt', firstName: 'A', lastName: 'A' } },
      ],
    } as unknown as Route);

    const result = await useCase.call('r1');

    expect(result).toEqual({ sent: 1 });
    expect(emailService.send).toHaveBeenCalledTimes(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'a@x.pt', template: 'survey' }),
    );
  });

  it('keeps sending to the remaining clients when one send fails', async () => {
    routeRepo.findOneWithAllRelations.mockResolvedValue({
      id: 'r1',
      status: 'FINISHED',
      packages: [
        { status: 'COLLECTED', user: { id: 'u1', email: 'a@x.pt', firstName: 'A', lastName: 'A' } },
        { status: 'COLLECTED', user: { id: 'u2', email: 'b@x.pt', firstName: 'B', lastName: 'B' } },
      ],
    } as unknown as Route);
    emailService.send
      .mockRejectedValueOnce(new Error('smtp down'))
      .mockResolvedValueOnce(undefined);

    const result = await useCase.call('r1');

    expect(emailService.send).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ sent: 1 });
  });
});
