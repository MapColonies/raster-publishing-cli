import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { HttpClient, IHttpRetryConfig } from '@map-colonies/mc-utils';
import { NotFoundError } from '@map-colonies/error-types';
import { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '../common/constants';
import { IPublishMapLayerRequest } from '../common/interfaces';

@injectable()
export class MapPublisherClient extends HttpClient {
  public constructor(@inject(SERVICES.LOGGER) protected readonly logger: Logger, @inject(SERVICES.CONFIG) config: IConfig) {
    super(logger, config.get<string>('mapPublishingServiceURL'), 'MapPublisher', config.get<IHttpRetryConfig>('httpRetry'));
    if (config.get<boolean>('authentication.enabled')) {
      const headers: Record<string, string> = {};
      headers[config.get<string>('authentication.headerName')] = config.get<string>('authentication.headerValue');
      this.axiosOptions.headers = headers;
    }
  }

  public async publishLayer(publishReq: IPublishMapLayerRequest): Promise<IPublishMapLayerRequest> {
    const saveMetadataUrl = '/layer';
    return this.post(saveMetadataUrl, publishReq);
  }

  public async exists(name: string): Promise<boolean> {
    const saveMetadataUrl = `/layer/${name}`;
    try {
      await this.get(saveMetadataUrl);
      return true;
    } catch (err) {
      if (err instanceof NotFoundError) {
        return false;
      } else {
        throw err;
      }
    }
  }
}
