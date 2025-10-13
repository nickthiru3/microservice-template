# Monitoring add-ons

Enable additional monitoring by toggling feature flags in `config.features`.

```ts
features: {
  monitoringLambdaErrorsEnabled: true,
  monitoringDynamoThrottlesEnabled: true,
  monitoringS3FailuresEnabled: true,
}
```

## Lambda error alarms

Set `monitoringLambdaErrorsEnabled = true` and supply functions via `MonitorConstruct` targets. `ServiceStack` automatically wires Lambdas it provisions.

Alarms watch the `Errors` metric over five-minute periods and trigger on the first failure.

## DynamoDB throttle alarms

Set `monitoringDynamoThrottlesEnabled = true`. Tables passed to the monitor will gain alarms on `ReadThrottleEvents` and `WriteThrottleEvents`.

## S3 failure alarms

Set `monitoringS3FailuresEnabled = true`. Buckets provided to the monitor get alarms on `4xxErrors`.

## Customizing targets

If you add more Lambdas, tables, or buckets, extend the `targets` passed into `MonitorConstruct` when instantiating it.
