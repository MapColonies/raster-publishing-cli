import { createReadStream } from 'fs';
import { inject, singleton } from 'tsyringe';
import csv, { Options } from 'csv-parser';
import bbox from '@turf/bbox';
import { GeoJSON } from 'geojson';
import { Logger } from '@map-colonies/js-logger';
import { LayerMetadata, ProductType, RecordType, SensorType } from '@map-colonies/mc-model-types';
import { ConflictError } from '@map-colonies/error-types';
import { SERVICES } from '../common/constants';
import { IConfig, PublishedMapLayerCacheType } from '../common/interfaces';
import { MapPublisherClient } from '../clients/mapPublisherClient';
import { CatalogClient } from '../clients/catalogClient';
//import { MetadataValidator } from './metadataValidator';
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
    //private readonly metadataValidator: MetadataValidator,
    private readonly linkBuilder: LinkBuilder
  ) {
    this.csvOptions = config.get<Options>('csvOptions');
  }

  public async publishLayersFromCsv(csvPath: string): Promise<void> {
    const layerPromises: Promise<unknown>[] = [];
    this.logger.info(`reading csv: ${csvPath}.`);
    const csvPromise = new Promise<void>((resolve, reject) => {
      createReadStream(csvPath)
        .on('error', (err) => {
          this.logger.error(err);
          reject(err);
        })
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
    try {
      await Promise.allSettled(layerPromises);
    } catch {
      this.logger.error('some of the supplied layers failed to publish.');
    }
  }

  public async handleRow(row: Row): Promise<void> {
    const metadata = this.parseMetadata(row);
    await this.validateRunConditions(metadata);
    const layerName = this.getMapServingLayerName(
      metadata.productId as string,
      metadata.productVersion as string,
      metadata.productType as ProductType
    );
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
    await this.mapPublisher.publishLayer({
      cacheType: cacheType,
      maxZoomLevel: 20,
      name: layerName,
      tilesPath: row.tilesPath,
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
        cacheType: cacheType,
        maxZoomLevel: 20,
        name: unifiedLayerName,
        tilesPath: row.tilesPath,
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
    //await this.metadataValidator.validate(metadata);
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

  private parseMetadata(row: Row): LayerMetadata {
    const metadata: LayerMetadata = {
      productId: row.productId,
      accuracyCE90: row.minHorizontalAccuracyCE90 !== '' ? parseFloat(row.minHorizontalAccuracyCE90) : undefined,
      classification: row.classification,
      description: row.description !== '' ? row.description : undefined,
      footprint: JSON.parse(row.footprint) as GeoJSON,
      maxResolutionMeter: parseFloat(row.maxResolutionDeg),
      producerName: 'IDFMU',
      productName: row.productName,
      productSubType: row.productSubType !== '' ? row.productSubType : undefined,
      productType: row.productType as ProductType,
      productVersion: row.productVersion,
      region:
        row.region != ''
          ? //remove unwanted spaces
            row.region
              .split(',')
              .map((str) => str.trim())
              .join(',')
          : undefined,
      resolution: parseFloat(row.maxResolutionDeg),
      scale: row.scale != '' ? row.scale : undefined,
      sensorType: [SensorType.UNDEFINED],
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
      updateDate: undefined,
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
}
