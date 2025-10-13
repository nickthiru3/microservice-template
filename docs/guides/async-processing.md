# Async processing (SQS + Lambda)

The service template includes an optional queue construct for asynchronous workloads. Enable it by setting `config.features.queuesEnabled = true`.

## What it provisions

- SQS queue with encrypted-at-rest storage and configurable visibility timeout
- Dead-letter queue retained for 14 days
- Lambda consumer using the handler in `lib/queues/handler.ts`
- Optional SNS subscription (pass an `ITopic` to `QueueConstruct`)

## How to use

1. Toggle the feature flag:

```ts
features: {
  queuesEnabled: true,
}
```

2. Customize the handler at `lib/queues/handler.ts` with domain logic.
3. If needed, pass a topic into the construct from your stack:

```ts
new QueueConstruct(this, "QueueConstruct", {
  config,
  subscribeToTopic: myTopic,
});
```

## Testing

Add unit tests under `test/lib/queues/` mirroring the construct structure.
