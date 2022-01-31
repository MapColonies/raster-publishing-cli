import { injectable } from 'tsyringe';
import { Argv, CommandModule } from 'yargs';
import { SayManager } from './sayManager';

@injectable()
export class SayCommand implements CommandModule {
  public deprecated = false;
  public command = 'say <word>';
  public describe = 'example command';
  public aliases = [];

  public constructor(private readonly manager: SayManager) {}

  public builder = (yargs: Argv): Argv => {
    return yargs.positional('word', { describe: 'a word to echo', type: 'string' });
  };
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public handler = (args: { [argName: string]: unknown; _: (string | number)[]; $0: string }): void => {
    const word = args['word'] as string;
    this.manager.say(word);
  };
}
