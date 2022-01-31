import { App } from '../../../../src/app';

export class HelloWorldCommandCliTrigger {
  public constructor(private readonly app: App) {}

  public async callCli(args: string[]): Promise<void> {
    await Promise.resolve(this.app.cli.parse(args));
  }

  public async callAlias(): Promise<void> {
    await this.callCli(['helloWorld']);
  }

  public async callDefault(): Promise<void> {
    await this.callCli([]);
  }
}
