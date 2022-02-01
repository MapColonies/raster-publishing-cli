import { promises as fsp } from 'fs';
import path from 'path';
import { inject, singleton } from 'tsyringe';
import Ajv, { AnySchemaObject, ValidateFunction } from 'ajv';
import yaml from 'js-yaml';
import { LayerMetadata } from '@map-colonies/mc-model-types';
import { Logger } from '@map-colonies/js-logger';
import { SERVICES } from '../common/constants';

@singleton()
export class MetadataValidator {
  private readonly validatorPromise: Promise<ValidateFunction>;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {
    this.validatorPromise = this.createValidator();
  }

  public async validate(metadata: LayerMetadata): Promise<void> {
    const valdator = await this.validatorPromise;
    if (!valdator(metadata)) {
      this.logger.error(`invalid metadata: ${JSON.stringify(valdator.errors)}`);
      throw new Error('invalid metadata');
    }
  }

  private readonly loadSchema = async (uri: string): Promise<AnySchemaObject> => {
    const schemaPath = path.normalize(uri);
    const file = await fsp.readFile(schemaPath, 'utf-8');
    const schema = yaml.load(file);
    return schema as AnySchemaObject;
  };

  private async createValidator(): Promise<ValidateFunction> {
    const mainSchema = this.loadSchema('./Schema/insertLayerMetadata.yaml');
    const ajv = new Ajv({ loadSchema: this.loadSchema });
    const validator = await ajv.compileAsync(mainSchema);
    return validator;
  }
}
