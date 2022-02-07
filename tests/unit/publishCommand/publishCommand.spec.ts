import { Arguments, Argv } from 'yargs';
import { PublishCommand } from '../../../src/publishCommand/publishCommand';
import { PublishManager } from '../../../src/publishCommand/publishManager';

describe('PublishCommand', () => {
  const positionalMock = jest.fn();
  const yargsMock = {
    positional: positionalMock,
  } as unknown as Argv;
  let command: PublishCommand;
  const publishLayersFromCsvMock = jest.fn();
  const managerMock = {
    publishLayersFromCsv: publishLayersFromCsvMock,
  } as unknown as PublishManager;

  beforeEach(() => {
    command = new PublishCommand(managerMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('handler', () => {
    it('calls publishLayersFromCsv', async () => {
      const args = { csvPath: 'csvPath' } as unknown as Arguments;
      await command.handler(args);

      expect(publishLayersFromCsvMock).toHaveBeenCalledTimes(1);
      expect(publishLayersFromCsvMock).toHaveBeenCalledWith('csvPath');
    });
  });

  describe('builder', () => {
    it('defines positional parameter word was not called', () => {
      command.builder(yargsMock);

      expect(positionalMock).toHaveBeenCalledTimes(1);
    });
  });
});
