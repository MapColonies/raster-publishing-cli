import { MapPublisherClient } from '../../../src/clients/mapPublisherClient';

const mapPublishLayerMock = jest.fn();
const mapExistsMock = jest.fn();

const mapPublisherMock = {
  publishLayer: mapPublishLayerMock,
  exists: mapExistsMock,
} as unknown as MapPublisherClient;

export { mapPublisherMock, mapExistsMock, mapPublishLayerMock };
