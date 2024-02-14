import { readFileSync, existsSync } from 'fs';
import { merge } from 'lodash';
import { getEncryptedParameter, getParameter } from './ssm';

export class ConfigurationBuilder<TConfig> {
  private resolvers: ((config: TConfig) => Promise<TConfig>)[] = [];

  addJsonFile(
    path: string,
    options: { optional: boolean } = {
      optional: false,
    },
  ): ConfigurationBuilder<TConfig> {
    const resolver = (config) => {
      if (options.optional && !existsSync(path)) return this;

      const contents = readFileSync(path, 'utf-8');
      const json = JSON.parse(contents);
      merge(config, json);
      return config;
    };

    this.resolvers.push(resolver);
    return this;
  }

  addEnv(): ConfigurationBuilder<TConfig> {
    const separator = '__';
    const resolver = (config) => {
      for (const key in process.env) {
        if (!key.includes(separator)) {
          const root = {};
          root[key] = process.env[key];
          merge(config, root);
        } else {
          const root = {};
          let curr = root;
          let remainingKey = key;
          while (remainingKey.includes(separator)) {
            const partialKey = remainingKey.split(separator)[0];
            curr[partialKey] = {};
            curr = curr[partialKey];
            remainingKey = remainingKey
              .split(separator)
              .slice(1)
              .join(separator);
          }
          curr[remainingKey] = process.env[key];
          merge(config, root);
        }
      }

      return config;
    };

    this.resolvers.push(resolver);
    return this;
  }

  addJsonSsm(
    name: string,
    options: { encrypted: boolean; optional: boolean } = {
      encrypted: false,
      optional: false,
    },
  ): ConfigurationBuilder<TConfig> {
    const resolver = async (config) => {
      try {
        const raw = await (options.encrypted
          ? getEncryptedParameter(name)
          : getParameter(name));
        const json = JSON.parse(raw);
        merge(config, json);
      } catch (error) {
        if (!options.optional) throw error;
      }

      return config;
    };

    this.resolvers.push(resolver);
    return this;
  }

  async build(): Promise<TConfig> {
    const config = {} as TConfig;
    for (const resolver of this.resolvers) {
      await resolver(config);
    }
    return config;
  }
}
