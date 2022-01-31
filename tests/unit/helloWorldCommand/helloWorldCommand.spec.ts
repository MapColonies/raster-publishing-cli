import { Argv } from 'yargs';
import { HelloWorldCommand } from '../../../src/helloWorldCommand/helloWorldCommand';
import { HelloWorldManager } from '../../../src/helloWorldCommand/helloWorldManager';

describe('sayCommand', () => {
  const positionalMock = jest.fn();
  const yargsMock = {
    positional: positionalMock,
  } as unknown as Argv;
  let command: HelloWorldCommand;
  const sayHelloMock = jest.fn();
  const managerMock = {
    sayHello: sayHelloMock,
  } as unknown as HelloWorldManager;

  beforeEach(() => {
    command = new HelloWorldCommand(managerMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('handler', () => {
    it('calls sayHallo', async () => {
      await command.handler();

      expect(sayHelloMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('builder', () => {
    it('defines positional parameter word was not called', () => {
      command.builder(yargsMock);

      expect(positionalMock).toHaveBeenCalledTimes(0);
    });
  });
});
