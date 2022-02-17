import { inject, injectable } from 'tsyringe';
import { IRasterCatalogUpsertRequestBody, LayerMetadata } from '@map-colonies/mc-model-types';
import { HttpClient, IHttpRetryConfig } from '@map-colonies/mc-utils';
import { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '../common/constants';
import { FindRecordResponse, IConfig } from '../common/interfaces';

interface ICreateRecordResponse {
  id: string;
  taskIds: string[];
}

@injectable()
export class CatalogClient extends HttpClient {
  public constructor(@inject(SERVICES.LOGGER) protected readonly logger: Logger, @inject(SERVICES.CONFIG) config: IConfig) {
    super(logger, config.get<string>('catalogPublishingServiceURL'), 'Catalog', config.get<IHttpRetryConfig>('httpRetry'));
    if (config.get<boolean>('authentication.enabled')) {
      const headers: Record<string, string> = {};
      headers[config.get<string>('authentication.headerName')] = config.get<string>('authentication.headerValue');
      this.axiosOptions.headers = headers;
    }
  }

  public async exists(productId: string, productVersion?: string, productType?: string): Promise<boolean> {
    const req = {
      metadata: {
        productId,
        productVersion,
        productType,
      },
    };
    const res = await this.post<FindRecordResponse>('/records/find', req);

    return res.length > 0;
  }

  public async getMetadata(productId: string, productVersion: string, productType: string): Promise<LayerMetadata | undefined> {
    const req = {
      metadata: {
        productId,
        productVersion,
        productType,
      },
    };

    // Get product information
    const res = await this.post<FindRecordResponse>('/records/find', req);

    // Check if product exists with given version
    if (res.length == 0) {
      return undefined;
    }

    // Return metadata
    return res[0].metadata;
  }

  public async publish(record: IRasterCatalogUpsertRequestBody): Promise<string> {
    const res = await this.post<ICreateRecordResponse>('/records', record);
    return res.id;
  }
}
