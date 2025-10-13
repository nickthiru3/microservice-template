# Secrets management

Toggle `features.secretsManagerEnabled` to create a baseline AWS Secrets Manager secret for the service.

## What it provisions

- Secrets Manager secret named `${serviceName}/default` by default
- Configurable secret string generator: length, excluded characters, etc.

## Usage steps

1. Enable the feature flag:

```ts
features: {
  secretsManagerEnabled: true,
}
```

2. Optionally pass a name or generator when instantiating `SecretsConstruct`:

```ts
new SecretsConstruct(this, "SecretsConstruct", {
  config,
  secretName: `${config.service.name}/apiKey`,
  secretGenerator: {
    passwordLength: 40,
    excludeCharacters: "\"'\\",
  },
});
```

3. Reference the generated secret in your Lambdas using the returned `secretArn` or by binding it via environment variables.

## Testing

Mirror the construct under `test/lib/secrets/` and assert the secret resource synthesizes with expected properties.
