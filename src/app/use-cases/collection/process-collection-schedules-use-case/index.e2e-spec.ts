import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../../app.module';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { ProcessCollectionSchedulesUseCase } from '.';

/**
 * Corre contra o Postgres a sério de propósito: os testes unitários deste caso
 * de uso trocam o repositório por um mock, por isso o SQL nunca é executado —
 * e foi exatamente aí que se escondeu uma tarefa diária que falhava há meses
 * (`date - $1` sem cast resolvia para `date - date` e rebentava com
 * "operator does not exist: integer < date", com o erro apanhado e só logado).
 */
describe('ProcessCollectionSchedulesUseCase (e2e)', () => {
  let app: INestApplication;
  let repository: ICollectionRequestRepository;
  let useCase: ProcessCollectionSchedulesUseCase;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.register()],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    repository = app.get(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY);
    useCase = app.get(ProcessCollectionSchedulesUseCase);
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([0, 2, 30])(
    'findExpiredUnconfirmed executa o SQL com days=%i',
    async (days) => {
      await expect(repository.findExpiredUnconfirmed(days)).resolves.toEqual(
        expect.any(Array),
      );
    },
  );

  it('findDueConfirmed executa o SQL', async () => {
    await expect(repository.findDueConfirmed()).resolves.toEqual(
      expect.any(Array),
    );
  });

  it('a tarefa diária completa sem rebentar', async () => {
    await expect(useCase.call()).resolves.toEqual({
      removedFromRoute: expect.any(Number),
      movedToWaiting: expect.any(Number),
    });
  });
});
