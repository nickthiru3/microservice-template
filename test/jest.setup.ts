const defaultRegion = process.env.AWS_REGION ?? "us-east-1";

process.env.SERVICE_NAME = process.env.SERVICE_NAME ?? "resource";
process.env.AWS_REGION = defaultRegion;
process.env.AWS_DEFAULT_REGION =
  process.env.AWS_DEFAULT_REGION ?? defaultRegion;
process.env.CDK_DEFAULT_REGION =
  process.env.CDK_DEFAULT_REGION ?? defaultRegion;
