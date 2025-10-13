# Feature flag configuration examples

Toggle multiple optional capabilities together by composing the feature flags. Example for enabling queues, monitoring, streams, scheduler, and secrets:

```ts
features: {
  queuesEnabled: true,
  monitoringLambdaErrorsEnabled: true,
  monitoringDynamoThrottlesEnabled: true,
  monitoringS3FailuresEnabled: true,
  dynamodbStreamsEnabled: true,
  schedulerEnabled: true,
  secretsManagerEnabled: true,
}
```

Refer to the individual guides for wiring targets (e.g., passing Lambdas into `MonitorConstruct`) and for implementation specifics.

## CI signal: API error logging

`src/helpers/api.ts` respects the `API_LOG_ERROR_RESPONSES` environment variable. For quieter CI runs, set it to anything other than "true" (e.g., leave undefined) so failed tests do not spam logs. Enable it locally when debugging API responses.

## Contract stubs vs. shared packages

The template ships with local bindings interfaces (for example, `IMonitorBindings` in `lib/ssm-bindings/monitor/construct.ts`). When integrating a generated service into your organization’s monorepo, replace these stubs with the real definitions from your shared contracts package and remove any duplicate local typings.
