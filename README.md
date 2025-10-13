## Guides

- **Detailed guides index:** [docs/guides/README.md](./docs/guides/README.md)
- **Async processing (SQS + Lambda):** [docs/guides/async-processing.md](./docs/guides/async-processing.md)
- **Monitoring add-ons:** [docs/guides/monitoring.md](./docs/guides/monitoring.md)
- **DynamoDB change data capture:** [docs/guides/streams.md](./docs/guides/streams.md)
- **Scheduled workloads:** [docs/guides/scheduler.md](./docs/guides/scheduler.md)
- **Secrets management:** [docs/guides/secrets.md](./docs/guides/secrets.md)

## Secrets & Bindings

- We standardize secrets via SSM SecureString dynamic references, avoiding plaintext in templates.
- Slack webhook binding key is `slackWebhookUrl` at `monitor/slack/webhookUrl` under the private path for the `platform` producer.
- CDK injects `SLACK_WEBHOOK_URL` into monitoring Lambdas using a value like `{{resolve:ssm-secure:/{{APP_BASE_PATH}}/{ENV_NAME}/platform/private/monitor/slack/webhookUrl}}`, resolved via `SecretValue.ssmSecure()`.
- If you need to pin a specific SecureString version for a rollout, supply the version explicitly when calling `SecretValue.ssmSecure(parameterName, version)` in a custom construct.

## Template Placeholders

- **`{{SERVICE_NAME}}`** Service identifier used in CDK constructs, environment variables, and documentation examples.
- **`{{RESOURCE_PASCAL_NAME}}`** PascalCase version of the primary resource name applied to construct IDs and type names.
- **`{{PIPELINE_NAME}}`** CodePipeline identifier referenced by CI/CD workflows.
- **`{{APP_BASE_PATH}}`** Root path for SSM parameters that scope secrets and bindings per environment.

## Test Coverage Expectations

- **Baseline thresholds** `jest.config.ts` enforces relaxed global coverage (branches 50 %, functions/lines/statements 60 %) so the template test suite passes without additional specs.
- **Adopter guidance** Increase the thresholds once you add service-specific functionality and accompanying tests to maintain your team’s quality bar.

## Intentional Differences vs. Deals/Users Services

- **Terminology** All "deal" references are generalized to "resource" to support re-theming (`lib/api/endpoints/resource/**`, `docs/api/resources/merchants/resource/create-resource.yml`).
- **Auth & IAM constructs** `lib/permissions/**` delegates to shared resource scaffolding; `users-ms` contains bespoke auth/iam logic that downstream services should supply if needed.
- **Coverage policy** `jest.config.ts` uses relaxed thresholds (50 %/60 %) for template usability; services should raise them after adding business logic.
- **Template guidance** Additional placeholder and expectations documentation (`README.md`, docs/guides) helps adopters customize names and paths.
