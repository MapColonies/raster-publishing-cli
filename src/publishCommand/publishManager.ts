import { createReadStream } from 'fs';
import { inject, singleton } from 'tsyringe';
import csv, { Options } from 'csv-parser';
import { Logger } from '@map-colonies/js-logger';
import { LayerMetadata, ProductType } from '@map-colonies/mc-model-types';
import { ConflictError } from '@map-colonies/error-types';
import { SERVICES } from '../common/constants';
import { IConfig } from '../common/interfaces';
import { MapPublisherClient } from '../clients/mapPublisherClient';
import { CatalogClient } from '../clients/catalogClient';
import { MetadataValidator } from './metadataValidator';
import { LinkBuilder } from './linksBuilder';

interface Row {
  tilesPath: string;
  metadata: string;
}

@singleton()
export class PublishManager {
  private readonly csvOptions: Options;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    private readonly mapPublisher: MapPublisherClient,
    private readonly catalog: CatalogClient,
    private readonly metadataValidator: MetadataValidator,
    private readonly linkBuilder: LinkBuilder
  ) {
    this.csvOptions = config.get<Options>('csvOptions');
  }

  public async publishLayersFromCsv(csvPath: string): Promise<void> {
    const layerPromises: Promise<unknown>[] = [];
    this.logger.info(`reading csv: ${csvPath}.`);
    const csvPromise = new Promise<void>((resolve, reject) => {
      createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
          layerPromises.push(this.handleRow(data as Row));
        })
        .on('end', () => {
          this.logger.info('finished reading csv file');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(err);
          reject(err);
        });
    });

    layerPromises.push(csvPromise);
    await Promise.allSettled(layerPromises);
  }

  public async handleRow(row: Row): Promise<void> {
    const metadata = JSON.parse(row.metadata) as LayerMetadata;
    await this.validateRunConditions(metadata);
    const layerName = this.getMapServingLayerName(
      metadata.productId as string,
      metadata.productVersion as string,
      metadata.productType as ProductType
    );
    const publicMapServerUrl = this.config.get<string>('publicMapServerURL');
    await this.mapPublisher.publishLayer({
      cacheType,
      maxZoomLevel,
      name: layerName,
      tilesPath,
    });
    await this.catalog.publish({
      metadata: metadata,
      links: this.linkBuilder.createLinks({
        layerName: layerName,
        serverUrl: publicMapServerUrl,
      }),
    });
    // todo: In update scenario need to change the logic to support history and update unified files
    if (metadata.productType === ProductType.ORTHOPHOTO_HISTORY) {
      const clonedLayer = { ...metadata };
      clonedLayer.productType = ProductType.ORTHOPHOTO;
      const unifiedLayerName = this.getMapServingLayerName(
        clonedLayer.productId as string,
        clonedLayer.productVersion as string,
        clonedLayer.productType
      );
      await this.mapPublisher.publishLayer({
        cacheType,
        maxZoomLevel,
        name: unifiedLayerName,
        tilesPath,
      });
      await this.catalog.publish({
        metadata: metadata,
        links: this.linkBuilder.createLinks({
          layerName: unifiedLayerName,
          serverUrl: publicMapServerUrl,
        }),
      });
    }
  }

  private async validateRunConditions(metadata: LayerMetadata): Promise<void> {
    await this.metadataValidator.validate(metadata);
    const resourceId = metadata.productId as string;
    const version = metadata.productVersion as string;
    const productType = metadata.productType as ProductType;

    // todo: version 1.0 condition defines only one material with the same ID, no history parts are allowed
    if (productType === ProductType.ORTHOPHOTO_HISTORY) {
      await this.validateNotExistsInCatalog(resourceId);
    } else {
      await this.validateNotExistsInCatalog(resourceId, version);
    }
    await this.validateNotExistsInMapServer(resourceId, version, productType);
  }

  private async validateNotExistsInMapServer(productId: string, productVersion: string, productType: ProductType): Promise<void> {
    const layerName = this.getMapServingLayerName(productId, productVersion, productType);
    const existsInMapServer = await this.mapPublisher.exists(layerName);
    if (existsInMapServer) {
      throw new ConflictError(`layer ${layerName}, already exists on mapProxy`);
    }
  }

  private async validateNotExistsInCatalog(resourceId: string, version?: string): Promise<void> {
    const existsInCatalog = await this.catalog.exists(resourceId, version);
    if (existsInCatalog) {
      throw new ConflictError(`layer id: ${resourceId} version: ${version as string}, already exists in catalog`);
    }
  }

  private getMapServingLayerName(productId: string, productVersion: string, productType: ProductType): string {
    let layerName = null;
    if (productType === ProductType.ORTHOPHOTO) {
      layerName = `${productId}-${productType}`;
    } else {
      layerName = `${productId}-${productVersion}-${productType as string}`;
    }
    return layerName;
  }
}
