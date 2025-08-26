import config from "#config/default";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

export type SsmVisibility = "public" | "private";

function resolveAppBasePath(): string {
  // Single source of truth: config.parameterStorePrefix (set from env in config/default.ts)
  return config.parameterStorePrefix || "/super-deals";
}

function resolveServiceName(provided?: string): string {
  return provided || config.service.name;
}

function buildSsmPath(
  envName: string,
  visibility: SsmVisibility,
  serviceName?: string
): string {
  const appBasePath = resolveAppBasePath();
  const svc = resolveServiceName(serviceName);
  // Normalize to avoid accidental duplicate slashes
  return `${appBasePath}/${envName}/${svc}/${visibility}`.replace(/\/+/, "/");
}

export function buildSsmPublicPath(
  envName: string,
  serviceName?: string
): string {
  return buildSsmPath(envName, "public", serviceName);
}

export function buildSsmPrivatePath(
  envName: string,
  serviceName?: string
): string {
  return buildSsmPath(envName, "private", serviceName);
}

// Back-compat helpers for constructs expecting base path and SSM reads
export function getBasePath(envName: string, serviceName?: string): string {
  // Historically, "basePath" referred to the public path root for the service
  return buildSsmPublicPath(envName, serviceName);
}

export function readParamRequired(scope: Construct, parameterName: string): string {
  // Create a stable ID from the parameter name
  const id = `SsmParam-${parameterName.replace(/[^A-Za-z0-9_-]/g, "_")}`;
  return StringParameter.fromStringParameterName(scope, id, parameterName).stringValue;
}

export function readParamOptional(scope: Construct, parameterName: string): string | undefined {
  try {
    return readParamRequired(scope, parameterName);
  } catch {
    return undefined;
  }
}
