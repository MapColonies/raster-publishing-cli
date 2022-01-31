import { App } from '../../../../src/app';

export class SayCommandCliTrigger {
  public constructor(private readonly app: App) {}

  public async callCli(args: string[]): Promise<void> {
    await Promise.resolve(this.app.cli.parse(args));
  }

  public async callSay(word?: string): Promise<void> {
    if (word !== undefined) {
      await this.callCli(['say', word]);
    } else {
      await this.callCli(['say']);
    }
  }
}
