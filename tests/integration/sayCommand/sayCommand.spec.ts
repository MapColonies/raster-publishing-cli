import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';

import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { SayCommandCliTrigger } from './helpers/CliTrigger';

describe('sayCommand', function () {
  let cli: SayCommandCliTrigger;
  let consoleLogMock: jest.SpyInstance;
  let processExitMock: jest.SpyInstance;

  beforeEach(function () {
    consoleLogMock = jest.spyOn(global.console, 'log');
    consoleLogMock.mockReturnValue(undefined);
    jest.spyOn(global.console, 'error').mockReturnValue(undefined); // prevent cli error logs from messing with test log on bad path tests
    processExitMock = jest.spyOn(global.process, 'exit');
    processExitMock.mockReturnValueOnce(undefined); //prevent cli exit from killing the test

    const app = getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: true,
    });
    cli = new SayCommandCliTrigger(app);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('Happy Path', function () {
    it('logs given word to console', async function () {
      await cli.callSay('test');

      expect(consoleLogMock).toHaveBeenCalledWith('test');
    });
  });
  describe('Bad Path', function () {
    it('wont log to console when no param is given and exit with error code', async function () {
      await cli.callSay();

      expect(processExitMock).toHaveBeenCalledWith(1);
      expect(consoleLogMock).toHaveBeenCalledTimes(0);
    });
  });
});
