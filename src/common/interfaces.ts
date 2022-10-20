import { IRasterCatalogUpsertRequestBody } from '@map-colonies/mc-model-types';

export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}

export enum TileFormat {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
}

export interface IPublishMapLayerRequest {
  name: string;
  tilesPath: string;
  cacheType: PublishedMapLayerCacheType;
  format: TileFormat;
}

export enum PublishedMapLayerCacheType {
  FS = 'file',
  S3 = 's3',
  GPKG = 'geopackage',
}

export interface IFindResponseRecord extends IRasterCatalogUpsertRequestBody {
  id: string;
}

export type FindRecordResponse = IFindResponseRecord[];
