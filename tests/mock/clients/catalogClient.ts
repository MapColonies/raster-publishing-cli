import { CatalogClient } from '../../../src/clients/catalogClient';

const catalogExistsMock = jest.fn();
const getMetadataMock = jest.fn();
const catalogPublishMock = jest.fn();

const catalogMock = {
  exists: catalogExistsMock,
  getMetadata: getMetadataMock,
  publish: catalogPublishMock,
} as unknown as CatalogClient;

export { catalogMock, catalogExistsMock, getMetadataMock, catalogPublishMock };
