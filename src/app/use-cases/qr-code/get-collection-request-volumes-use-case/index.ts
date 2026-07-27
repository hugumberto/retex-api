import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CollectionRequest } from '../../../../domain/collection-request/collection-request.entity';
import { ICollectionRequestRepository } from '../../../../domain/collection-request/collection-request.repository';
import { QrCode } from '../../../../domain/qr-code/qr-code.entity';
import { IQrCodeRepository } from '../../../../domain/qr-code/qr-code.repository';
import { DOMAIN_TOKENS } from '../../../../domain/tokens';
import { IUseCase } from '../../interfaces/use-case.interface';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CollectionRequestVolumesResult {
  collectionRequest: Pick<
    CollectionRequest,
    'id' | 'friendlyCode' | 'status' | 'estimatedVolumes' | 'qrCodesGenerated'
  >;
  volumes: QrCode[];
}

/**
 * Lista os volumes (QR codes) de um pacote, resolvido por UUID ou código
 * amigável. Usado na tela de gestão de volumes.
 */
@Injectable()
export class GetCollectionRequestVolumesUseCase
  implements IUseCase<string, CollectionRequestVolumesResult>
{
  constructor(
    @Inject(DOMAIN_TOKENS.COLLECTION_REQUEST_REPOSITORY)
    private readonly collectionRequestRepository: ICollectionRequestRepository,
    @Inject(DOMAIN_TOKENS.QR_CODE_REPOSITORY)
    private readonly qrCodeRepository: IQrCodeRepository,
  ) {}

  async call(identifier: string): Promise<CollectionRequestVolumesResult> {
    const value = identifier.trim();

    const pkg = UUID_REGEX.test(value)
      ? await this.collectionRequestRepository.findOne({ id: value } as Partial<CollectionRequest>)
      : await this.collectionRequestRepository.findOne({
          friendlyCode: value,
        } as Partial<CollectionRequest>);

    if (!pkg) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    const volumes = await this.qrCodeRepository.find({ collectionRequestId: pkg.id });

    return {
      collectionRequest: {
        id: pkg.id,
        friendlyCode: pkg.friendlyCode,
        status: pkg.status,
        estimatedVolumes: pkg.estimatedVolumes,
        qrCodesGenerated: pkg.qrCodesGenerated,
      },
      volumes,
    };
  }
}
