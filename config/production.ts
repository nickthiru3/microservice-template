import { config as defaultConfig } from '#config/default';

const productionConfig = {
  ...defaultConfig,
  envName: 'production',
  // Add production-specific overrides here
};

export const config = productionConfig;
export default config;
