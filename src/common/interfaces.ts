export interface IConfig {
  get: <T>(setting: string) => T;
  has: (setting: string) => boolean;
}
