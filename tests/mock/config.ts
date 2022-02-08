import config from 'config';
import { IConfig } from '../../src/common/interfaces';

let mockConfig: Record<string, unknown> = {};
const getMock = jest.fn();
const hasMock = jest.fn();

const configMock = {
  get: getMock,
  has: hasMock,
} as IConfig;

const initConfig = (): void => {
  getMock.mockImplementation((key: string): unknown => {
    return mockConfig[key] ?? config.get(key);
  });
};

const setConfigValue = (key: string | Record<string, unknown>, value?: unknown): void => {
  if (typeof key === 'string') {
    mockConfig[key] = value;
  } else {
    mockConfig = { ...mockConfig, ...key };
  }
};

const clearConfig = (): void => {
  mockConfig = {};
};
export { getMock, configMock, setConfigValue, clearConfig, initConfig };
