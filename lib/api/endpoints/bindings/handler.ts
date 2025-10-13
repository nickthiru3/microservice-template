import { SSMClient, GetParametersByPathCommand } from '@aws-sdk/client-ssm';

const ssm = new SSMClient({});

function env(name: string, fallback?: string) {
  return process.env[name] ?? fallback ?? '';
}

async function readPublicBindingsFromSSM(): Promise<Record<string, any> | null> {
  const path = env('SSM_PUBLIC_PATH');
  if (!path) return null;
  try {
    const out = await ssm.send(new GetParametersByPathCommand({
      Path: path,
      WithDecryption: false,
      Recursive: true
    }));
    const result: Record<string, any> = {};
    for (const p of out.Parameters ?? []) {
      if (!p.Name || typeof p.Value === 'undefined') continue;
      const key = p.Name.replace(path, '').replace(/^\//, '');
      result[key] = p.Value;
    }
    return result;
  } catch {
    return null;
  }
}

export const handler = async () => {
  const ssmBindings = await readPublicBindingsFromSSM();
  const fallback = {
    service: env('SERVICE_NAME', 'resource-ms'),
    env: env('ENV_NAME'),
    region: env('AWS_REGION') || env('REGION'),
    api: {
      baseUrl: env('API_BASE_URL')
    },
    storage: {
      bucket: env('S3_BUCKET_NAME'),
      region: env('AWS_REGION') || env('REGION')
    }
  };

  const body = ssmBindings ?? fallback;

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'max-age=300'
    },
    body: JSON.stringify(body)
  };
};
