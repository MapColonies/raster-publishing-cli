import { injectable } from 'tsyringe';
import { Argv, CommandModule } from 'yargs';
import { HelloWorldManager } from './helloWorldManager';

@injectable()
export class HelloWorldCommand implements CommandModule {
  public deprecated = false;
  public command = '$0';
  public describe = 'example command';
  public aliases = ['helloWorld'];

  public constructor(private readonly manager: HelloWorldManager) {}

  public builder = (yargs: Argv): Argv => {
    return yargs;
  };

  public handler = async (): Promise<void> => {
    this.manager.sayHello();
    return Promise.resolve();
  };
}
