import { injectable } from 'tsyringe';
import { Argv, CommandModule, Arguments } from 'yargs';
import { PublishManager } from './publishManager';

@injectable()
export class PublishCommand implements CommandModule {
  public deprecated = false;
  public command = '$0';
  public describe = 'publish new layer from existing tiles';
  public aliases = ['publish'];

  public constructor(private readonly manager: PublishManager) {}

  public builder = (yargs: Argv): Argv => {
    return yargs.positional('csvPath', { describe: 'layer data csv file path', type: 'string' });
  };

  public handler = async (args: Arguments): Promise<void> => {
    await this.manager.publishLayersFromCsv(args['csvPath'] as string);
    return Promise.resolve();
  };
}
