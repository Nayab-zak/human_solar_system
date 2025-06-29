import config from '../config/config.json';

/**
 * ConfigService provides a singleton access point to the merged configuration
 * loaded from .env and default.yaml. Other modules import this service
 * to read runtime settings without needing to know details of loading logic.
 */
export class ConfigService {
  public static get config() {
    return config;
  }
}

console.log('ConfigService loaded', config);
