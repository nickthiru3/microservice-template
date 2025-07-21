import { config as defaultConfig } from '#config/default';

const stagingConfig = {
  ...defaultConfig,
  envName: 'staging',
  // Add staging-specific overrides here
};

export const config = stagingConfig;
export default config;
