import { Argv } from 'yargs';
import { SayCommand } from '../../../src/sayCommand/sayCommand';
import { SayManager } from '../../../src/sayCommand/sayManager';

describe('sayCommand', () => {
  const positionalMock = jest.fn();
  const yargsMock = {
    positional: positionalMock,
  } as unknown as Argv;
  let command: SayCommand;
  const sayMock = jest.fn();
  const managerMock = {
    say: sayMock,
  } as unknown as SayManager;

  beforeEach(() => {
    command = new SayCommand(managerMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('handler', () => {
    it('calls say', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      command.handler({ word: 'test', _: [], $0: 'testScript' });

      expect(sayMock).toHaveBeenCalledWith('test');
    });
  });

  describe('builder', () => {
    it('defines positional parameter word', () => {
      command.builder(yargsMock);

      expect(positionalMock).toHaveBeenCalledWith('word', expect.any(Object));
    });
  });
});
