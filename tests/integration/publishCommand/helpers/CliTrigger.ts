import { App } from '../../../../src/app';

export class PublishCommandCliTrigger {
  public constructor(private readonly app: App) {}

  public async callCli(args: string[]): Promise<void> {
    await Promise.resolve(this.app.cli.parse(args));
  }

  public async call(csvPath: string): Promise<void> {
    await this.callCli([csvPath]);
  }
}
