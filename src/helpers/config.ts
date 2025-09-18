import type { IConfig } from "#config/default";

export const makeEnv = (env: string, cfg: IConfig) =>
  env === "local"
    ? { account: "000000000000", region: cfg.region || "us-east-1" }
    : { account: cfg.accountId!, region: cfg.region };

export const makeTags = (env: string, cfg: IConfig, stackType: string) => ({
  Environment: env,
  Service: cfg.service?.name || "microservice",
  ServiceDisplayName:
    cfg.service?.displayName || cfg.service?.name || "Microservice",
  StackType: stackType,
});

export const makeDescription = (env: string, kind: string) =>
  `Microservice ${kind} (${env})`;
