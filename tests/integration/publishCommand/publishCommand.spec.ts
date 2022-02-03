import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { MapPublisherClient } from '../../../src/clients/mapPublisherClient';
import { CatalogClient } from '../../../src/clients/catalogClient';
import { mapPublisherMock, mapPublishLayerMock } from '../../mock/clients/mapPublisherClient';
import { catalogMock, catalogPublishMock } from '../../mock/clients/catalogClient';
import { PublishCommandCliTrigger } from './helpers/CliTrigger';
import { container } from 'tsyringe';

describe('PublishCommand', function () {
  let cli: PublishCommandCliTrigger;
  // let consoleLogMock: jest.SpyInstance;
  let processExitMock: jest.SpyInstance;

  beforeEach(function () {
    // consoleLogMock = jest.spyOn(global.console, 'log');
    // consoleLogMock.mockReturnValue(undefined);
    // jest.spyOn(global.console, 'error').mockReturnValue(undefined); // prevent cli error logs from messing with test log on bad path tests
    processExitMock = jest.spyOn(global.process, 'exit');
    processExitMock.mockReturnValueOnce(undefined); //prevent cli exit from killing the test

    //overriding  containers that are registered with decorators dont work with current implementation
    const app = getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: true }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        // { token: MapPublisherClient, provider: { useValue: mapPublisherMock } },
        // { token: CatalogClient, provider: { useValue: catalogMock } },
      ],
      useChild: false, //true
    });
    container.registerInstance(MapPublisherClient, mapPublisherMock);
    container.registerInstance(CatalogClient, catalogMock);

    cli = new PublishCommandCliTrigger(app);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('Happy Path', function () {
    it('publish all layers from csv', async function () {
      await cli.call('tests/data/test.csv');

      expect(mapPublishLayerMock).toHaveBeenCalledTimes(3);
      expect(catalogPublishMock).toHaveBeenCalledTimes(3);
    });

    // it('logs "hello world" to console when called without command name', async function () {
    //   await cli.callDefault();

    //   expect(consoleLogMock).toHaveBeenCalledWith('hello world');
    // });
  });
});
