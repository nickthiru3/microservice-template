# DynamoDB change data capture

Turn on `features.dynamodbStreamsEnabled` to enable DynamoDB streams and deploy the stream consumer Lambda.

## What it provisions

- DynamoDB Streams on the primary table with `NEW_AND_OLD_IMAGES`
- Lambda consumer defined in `lib/db/stream-consumer/`

## Usage steps

1. Set the feature flag in config:

```ts
features: {
  dynamodbStreamsEnabled: true,
}
```

2. Implement business logic in `lib/db/stream-consumer/handler.ts`.
3. Update IAM permissions in downstream functions if they need to publish events based on stream changes.

## Testing

Add tests under `test/lib/db/stream-consumer/` to validate construct synthesis.
