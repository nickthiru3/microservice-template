import { defaultConfig } from './default';

const stagingConfig = {
  ...defaultConfig,
  envName: 'staging',
  // Add staging-specific overrides here
};

export const config = stagingConfig;
export default config;
