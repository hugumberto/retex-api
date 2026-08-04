import { RouteStatus } from '../../../domain/route/route.entity';
import { IRouteRepository } from '../../../domain/route/route.repository';

/**
 * Avança a rota de CREATED para WAITING_TO_START quando todas as suas
 * solicitações têm a recolha confirmada pelo cliente. Só atua em rotas CREATED
 * (as demais já avançaram ou ainda não foram confirmadas).
 *
 * Chamado tanto ao confirmar como ao rejeitar uma recolha: rejeitar remove a
 * solicitação da rota, o que pode deixar as restantes todas confirmadas.
 */
export async function advanceRouteIfAllConfirmed(
  routeRepository: IRouteRepository,
  routeId?: string,
): Promise<void> {
  if (!routeId) return;

  const route = await routeRepository.findOneWithAllRelations(routeId);
  if (!route || route.status !== RouteStatus.CREATED) return;

  const collectionRequests = route.collectionRequests ?? [];
  if (collectionRequests.length === 0) return;

  const allConfirmed = collectionRequests.every(
    (pkg) => pkg.collectionConfirmedAt != null,
  );
  if (!allConfirmed) return;

  await routeRepository.update(
    { id: route.id },
    { status: RouteStatus.WAITING_TO_START },
  );
}
