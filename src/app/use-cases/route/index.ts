import { CreateRouteUseCase } from "./create-route-use-case";
import { DeleteRouteUseCase } from "./delete-route-use-case";
import { GetAllRoutesUseCase } from "./get-all-routes-use-case";
import { GetRouteByIdUseCase } from "./get-route-by-id-use-case";
import { UpdateRouteUseCase } from "./update-route-use-case";

export const ROUTE_USE_CASES = [
  CreateRouteUseCase,
  DeleteRouteUseCase,
  GetAllRoutesUseCase,
  GetRouteByIdUseCase,
  UpdateRouteUseCase,
]; 