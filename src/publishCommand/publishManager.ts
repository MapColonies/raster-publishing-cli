import { createReadStream } from 'fs';
import { inject, singleton } from 'tsyringe';
import csv, { Options } from 'csv-parser';
import bbox from '@turf/bbox';
import { GeoJSON } from 'geojson';
import { Logger } from '@map-colonies/js-logger';
import { LayerMetadata, ProductType, RecordType } from '@map-colonies/mc-model-types';
import { ConflictError } from '@map-colonies/error-types';
import { SERVICES } from '../common/constants';
import { IConfig, PublishedMapLayerCacheType } from '../common/interfaces';
import { MapPublisherClient } from '../clients/mapPublisherClient';
import { CatalogClient } from '../clients/catalogClient';
import { LinkBuilder } from './linksBuilder';

interface Row {
  productId: string;
  productName: string;
  productVersion: string;
  productType: string;
  productSubType: string;
  description: string;
  sourceDateStart: string;
  sourceDateEnd: string;
  maxResolutionDeg: string;
  maxResolutionMeter: string;
  minHorizontalAccuracyCE90: string;
  footprint: string;
  region: string;
  sensors: string;
  classification: string;
  scale: string;
  tilesPath: string;
  storageProvider: string;
}

@singleton()
export class PublishManager {
  private readonly csvOptions: Options;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    private readonly mapPublisher: MapPublisherClient,
    private readonly catalog: CatalogClient,
    private readonly linkBuilder: LinkBuilder
  ) {
    this.csvOptions = config.get<Options>('csvOptions');
  }

  public async publishLayersFromCsv(csvPath: string): Promise<void> {
    const layerActions: (() => Promise<unknown>)[] = [];
    this.logger.info(`reading csv: ${csvPath}.`);
    const csvPromise = new Promise<void>((resolve, reject) => {
      createReadStream(csvPath)
        .on('error', (err) => {
          this.logger.error(err);
          reject(err);
        })
        .pipe(csv())
        .on('data', (data) => {
          layerActions.push(async () => {
            await this.handleRow(data as Row);
          });
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

    try {
      await csvPromise;
      const results = await Promise.allSettled(layerActions.map(async (action) => action()));
      results.forEach((res) => {
        if (res.status === 'rejected') {
          const err = res.reason as Error;
          this.logger.error(`a supplied layers failed to publish: ${err.message}`);
        }
      });
    } catch (err) {
      const error = err as Error;
      this.logger.error(`failed to parse csv: ${error.message}`);
    }
  }

  public async handleRow(row: Row): Promise<void> {
    this.validateRow(row);
    const metadata = this.parseMetadata(row);
    await this.validateRunConditions(metadata);
    const layerName = this.getMapServingLayerName(metadata.productId as string, metadata.productType as ProductType);
    const publicMapServerUrl = this.config.get<string>('publicMapServerURL');
    let cacheType: PublishedMapLayerCacheType;
    switch (row.storageProvider.toLowerCase()) {
      case 'fs':
      case 'file':
        cacheType = PublishedMapLayerCacheType.FS;
        break;
      case 's3':
        cacheType = PublishedMapLayerCacheType.S3;
        break;
      default:
        this.logger.error(`invalid storage provider: ${row.storageProvider}. valid values: "FS", "S3"`);
        throw new Error('invalid storage provider');
    }
    await this.catalog.publish({
      metadata: metadata,
      links: this.linkBuilder.createLinks({
        layerName: layerName,
        serverUrl: publicMapServerUrl,
      }),
    });
    await this.mapPublisher.publishLayer({
      cacheType: cacheType,
      name: layerName,
      tilesPath: row.tilesPath,
    });
  }

  private async validateRunConditions(metadata: LayerMetadata): Promise<void> {
    const resourceId = metadata.productId as string;
    const productType = metadata.productType as ProductType;
    await this.validateNotExistsInCatalog(resourceId, productType);
    await this.validateNotExistsInMapServer(resourceId, productType);
  }

  private async validateNotExistsInMapServer(productId: string, productType: ProductType): Promise<void> {
    const layerName = this.getMapServingLayerName(productId, productType);
    const existsInMapServer = await this.mapPublisher.exists(layerName);
    if (existsInMapServer) {
      throw new ConflictError(`layer ${layerName}, already exists on mapProxy`);
    }
  }

  private async validateNotExistsInCatalog(resourceId: string, productType?: ProductType): Promise<void> {
    const existsInCatalog = await this.catalog.exists(resourceId, undefined, productType);
    if (existsInCatalog) {
      throw new ConflictError(`layer id: ${resourceId} type: ${productType as string}, already exists in catalog`);
    }
  }

  private getMapServingLayerName(productId: string, productType: ProductType): string {
    const layerName = `${productId}-${productType}`;
    return layerName;
  }

  private parseMetadata(row: Row): LayerMetadata {
    const metadata: LayerMetadata = {
      productId: row.productId,
      minHorizontalAccuracyCE90: parseFloat(row.minHorizontalAccuracyCE90),
      classification: row.classification,
      description: row.description !== '' ? row.description : undefined,
      footprint: JSON.parse(row.footprint) as GeoJSON,
      maxResolutionMeter: parseFloat(row.maxResolutionMeter),
      producerName: 'IDFMU',
      productName: row.productName,
      productSubType: row.productSubType !== '' ? row.productSubType : undefined,
      productType: row.productType as ProductType,
      productVersion: row.productVersion,
      region:
        row.region != '' //remove unwanted spaces
          ? row.region.split(',').map((str) => str.trim())
          : undefined,
      sensors:
        row.sensors != '' //remove unwanted spaces
          ? row.sensors.split(',').map((str) => str.trim())
          : ['UNDEFINED'],
      maxResolutionDeg: parseFloat(row.maxResolutionDeg),
      scale: row.scale != '' ? parseInt(row.scale) : undefined,
      updateDate: new Date(),
      sourceDateStart: this.parseLocalDate(row.sourceDateStart),
      sourceDateEnd: this.parseLocalDate(row.sourceDateEnd),
      srsId: '4326',
      srsName: 'WGS84GEO',
      rawProductData: undefined,
      includedInBests: undefined,
      ingestionDate: undefined,
      layerPolygonParts: undefined,
      type: RecordType.RECORD_RASTER,
      creationDate: undefined,
      rms: undefined,
      productBoundingBox: undefined,
    };
    metadata.productBoundingBox = bbox(metadata.footprint).join(',');
    return metadata;
  }

  private parseLocalDate(date: string): Date {
    const parts = date.split('/').map((str) => parseInt(str));
    const parsed = new Date(Date.UTC(parts[2], parts[1], parts[0]));
    return parsed;
  }

  private validateRow(row: Row): void {
    if (row.productId === '') {
      this.logger.error('invalid data, missing required filed: productId');
      throw new Error('invalid data');
    }
    if (row.productVersion === '') {
      this.logger.error('invalid data, missing required filed: productVersion');
      throw new Error('invalid data');
    }
    if (row.minHorizontalAccuracyCE90 === '') {
      this.logger.error('invalid data, missing required filed: minHorizontalAccuracyCE90');
      throw new Error('invalid data');
    }
    if (row.classification === '') {
      this.logger.error('invalid data, missing required filed: classification');
      throw new Error('invalid data');
    }
    if (row.footprint === '') {
      this.logger.error('invalid data, missing required filed: footprint');
      throw new Error('invalid data');
    }
    if (row.maxResolutionDeg === '') {
      this.logger.error('invalid data, missing required filed: maxResolutionDeg');
      throw new Error('invalid data');
    }
    if (row.productType === '') {
      this.logger.error('invalid data, missing required filed: productType');
      throw new Error('invalid data');
    }
    if (row.maxResolutionMeter === '') {
      this.logger.error('invalid data, missing required filed: maxResolutionMeter');
      throw new Error('invalid data');
    }
    if (row.sourceDateStart === '') {
      this.logger.error('invalid data, missing required filed: sourceDateStart');
      throw new Error('invalid data');
    }
    if (row.sourceDateEnd === '') {
      this.logger.error('invalid data, missing required filed: sourceDateEnd');
      throw new Error('invalid data');
    }
    if (row.tilesPath === '') {
      this.logger.error('invalid data, missing required filed: tilesPath');
      throw new Error('invalid data');
    }
  }
}
