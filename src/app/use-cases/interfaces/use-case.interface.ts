/* eslint-disable @typescript-eslint/ban-types */

export interface IUseCase<Param, Response = void> {
  call(param: Param): Promise<Response>;
}
