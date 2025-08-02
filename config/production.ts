import { defaultConfig } from './default';

const productionConfig = {
  ...defaultConfig,
  envName: 'production',
  // Add production-specific overrides here
};

export const config = productionConfig;
export default config;
