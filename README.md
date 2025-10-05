## Guides

- See the central guides index: [docs/guides/README.md](../docs/guides/README.md)

<!-- # Super Deals - Deals Microservice

This is a serverless microservice for the Super Deals platform, built using AWS CDK with TypeScript.

## Project Structure

```
.
├── bin/                    # CDK app entry point
├── config/                 # Environment configurations
├── lib/                    # CDK stack and construct definitions
├── src/                    # Application source code
├── test/                   # Unit and integration tests
├── .env.example            # Example environment variables
├── package.json            # Project dependencies and scripts
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- AWS CLI configured with appropriate credentials
- AWS CDK Toolkit installed (`npx install aws-cdk`)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` file with your AWS credentials and configuration

## Development

### Branching Strategy (Three-Flow)

We use a simplified Three-Flow branching strategy:

1. **`master`** - Main development branch
   - All new features and bug fixes are merged here
   - Deploys to the staging environment
   - Must always be in a deployable state

2. **`candidate`** - Release candidate branch
   - Created from `master` when preparing a release
   - Used for final testing and validation
   - Only bugfixes should be committed here

3. **`release`** - Production branch
   - Tracks exactly what's in production
   - Only updated by promoting from `candidate`
   - Used for hotfixes when needed

### Local Development

1. Start the local development server:
   ```bash
   npm run dev
   ```

2. Run tests:
   ```bash
   npm test           # Run all tests
   npm run test:watch # Run tests in watch mode
   ```

3. Lint and format code:
   ```bash
   npm run lint   # Run ESLint
   npm run format # Format code with Prettier
   ```

## Deployment

### Environments

- **Staging**: `npm run deploy:staging`
- **Production**: `npm run deploy:prod`
- **CI/CD**: `npm run deploy:ci`

### Manual Deployment

1. Deploy to staging:
   ```bash
   ENV_NAME=staging npx cdk deploy --require-approval never
   ```

2. Deploy to production:
   ```bash
   ENV_NAME=production npx cdk deploy --require-approval never
   ```

### View Deployment Differences

```bash
npm run diff:staging  # View changes for staging
npm run diff:prod     # View changes for production
```

## Configuration

Environment-specific configurations are stored in the `config/` directory. The application automatically loads the appropriate configuration based on the `ENV_NAME` environment variable.

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and compile
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run deploy:staging` - Deploy to staging
- `npm run deploy:prod` - Deploy to production
- `npm run diff:staging` - View changes for staging
- `npm run diff:prod` - View changes for production

## CI/CD

The project includes GitHub Actions workflows for CI/CD. The pipeline automatically:

1. Runs tests on pull requests
2. Deploys to staging when merging to `master`
3. Deploys to production when merging to `release`

## Contributing

1. Create a feature branch from `master`
2. Make your changes
3. Open a pull request
4. Ensure all tests pass
5. Get your code reviewed
6. Merge into `master`

## License

[Your License Here] -->

## Secrets & Bindings

- We standardize secrets via SSM SecureString dynamic references, avoiding plaintext in templates.
- Slack webhook binding key is `slackWebhookUrl` at `monitor/slack/webhookUrl` under the private path for the `platform` producer.
- CDK injects `SLACK_WEBHOOK_URL` into monitoring Lambdas using a value like `{{resolve:ssm-secure:/super-deals/{ENV_NAME}/platform/private/monitor/slack/webhookUrl}}`, resolved via `SecretValue.ssmSecure()`.
- If you need to pin a specific SecureString version for a rollout, supply the version explicitly when calling `SecretValue.ssmSecure(parameterName, version)` in a custom construct.
