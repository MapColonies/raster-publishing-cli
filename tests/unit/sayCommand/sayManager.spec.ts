import { SayManager } from '../../../src/sayCommand/sayManager';

describe('sayManager', () => {
  let consoleLogMock: jest.SpyInstance;
  let manager: SayManager;

  beforeEach(() => {
    consoleLogMock = jest.spyOn(global.console, 'log');
    manager = new SayManager();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('say', () => {
    it('logs word to console', () => {
      consoleLogMock.mockReturnValue(undefined);
      const word = 'test';

      manager.say(word);

      expect(consoleLogMock).toHaveBeenCalledTimes(1);
      expect(consoleLogMock).toHaveBeenCalledWith(word);
    });
  });
});
