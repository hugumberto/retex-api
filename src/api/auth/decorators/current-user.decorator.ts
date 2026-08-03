import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../../../app/services/interfaces/auth.interface';

/**
 * Payload do JWT já validado pelo `JwtAuthGuard`.
 *
 * Substitui o `req['user'] as JwtPayload` repetido à mão pelos controllers.
 * Em rotas `@Public()` vem `undefined`, porque o guard não chega a preencher.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;
    return data ? user?.[data] : user;
  },
);
