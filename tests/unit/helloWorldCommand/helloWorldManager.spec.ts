import { HelloWorldManager } from '../../../src/helloWorldCommand/helloWorldManager';

describe('sayCommand', () => {
  let consoleLogMock: jest.SpyInstance;
  let manager: HelloWorldManager;

  beforeEach(() => {
    consoleLogMock = jest.spyOn(global.console, 'log');
    manager = new HelloWorldManager();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('say hello', () => {
    it('prints to console', () => {
      manager.sayHello();

      expect(consoleLogMock).toHaveBeenCalledTimes(1);
      expect(consoleLogMock).toHaveBeenCalledWith('hello world');
    });
  });
});
