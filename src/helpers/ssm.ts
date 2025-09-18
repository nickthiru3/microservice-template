import config from "#config/default";
import { StringParameter, ParameterTier } from "aws-cdk-lib/aws-ssm";
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

export function readParam(scope: Construct, parameterName: string): string {
  // Create a stable ID from the parameter name
  const id = `SsmParam-${parameterName.replace(/[^A-Za-z0-9_-]/g, "_")}`;
  return StringParameter.fromStringParameterName(scope, id, parameterName)
    .stringValue;
}

/**
 * Publish a flat key/value map to SSM Parameter Store under a base path.
 * Keys are appended to basePath with a '/'. Values are written as STANDARD tier strings.
 */
export function publishStringParameters(
  scope: Construct,
  basePath: string,
  values: Record<string, string>
): void {
  Object.entries(values).forEach(([key, value]) => {
    const safeKey = key.replace(/[^A-Za-z0-9]/g, "_");
    const name = `${basePath}/${key}`.replace(/\/+/, "/");
    new StringParameter(scope, `Param_${safeKey}`, {
      parameterName: name,
      stringValue: value ?? "",
      tier: ParameterTier.STANDARD,
    });
  });
}

// Generic helpers for reading typed bindings from SSM
export function readBindingsByKeys<const TKeys extends readonly string[]>(
  scope: Construct,
  basePath: string,
  keys: TKeys
): Record<TKeys[number], string> {
  return keys.reduce(
    (acc, k) => {
      acc[k as TKeys[number]] = readParam(scope, `${basePath}/${k}`);
      return acc;
    },
    {} as Record<TKeys[number], string>
  );
}

export function readBindings<TSpec extends Record<string, string>>(
  scope: Construct,
  basePath: string,
  spec: TSpec
): { [K in keyof TSpec]: string } {
  const out = {} as { [K in keyof TSpec]: string };
  for (const key in spec) {
    const suffix = spec[key];
    out[key] = readParam(scope, `${basePath}/${suffix}`);
  }
  return out;
}
