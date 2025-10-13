import { Config } from "@jest/types";

const baseTestDir = "<rootDir>/test";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: [`${baseTestDir}/**/*.test.ts`],
  watchman: false,
  setupFiles: ["<rootDir>/test/jest.setup.ts"],
  collectCoverage: true,
  coverageDirectory: "<rootDir>/test/coverage",
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};

export default config;
