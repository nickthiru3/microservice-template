# Scheduled workloads

Toggle `features.schedulerEnabled` to provision the scheduler construct.

```ts
features: {
  schedulerEnabled: true,
}
```

## What it provisions

- EventBridge rule using a rate expression (defaults to hourly)
- Lambda function defined in `lib/scheduler/handler.ts` if you do not supply a custom function

## Usage steps

1. Enable the feature flag in configuration:

```ts
features: {
  schedulerEnabled: true,
}
```

2. Customize the default handler or pass your own function:

```ts
new SchedulerConstruct(this, "SchedulerConstruct", {
  config,
  lambda: existingLambda,
  schedule: Schedule.rate(Duration.minutes(15)),
});
```

## Testing

Create tests under `test/lib/scheduler/` for the construct.
