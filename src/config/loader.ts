import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import merge from 'lodash.merge';
import Ajv from 'ajv';

const defaultsPath = path.resolve(__dirname, '../../config/default.yaml');
const defaultConfig = yaml.load(fs.readFileSync(defaultsPath, 'utf8')) as any;

// Remove env overrides for now, use only defaultConfig
const mergedConfig = merge({}, defaultConfig);

// Validate merged config
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(require('../../config/schema.json'));
if (!validate(mergedConfig)) {
  throw new Error('Config validation error:\n' + ajv.errorsText(validate.errors));
}

export type Config = typeof mergedConfig;
export function getConfig(): Config {
  return mergedConfig as Config;
}
