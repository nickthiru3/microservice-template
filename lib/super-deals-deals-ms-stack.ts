import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SuperDealsStackProps } from './types';
import PipelineConstruct from './pipeline/construct';
import { config } from '../config/default';

export class SuperDealsDealsMsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SuperDealsStackProps) {
    super(scope, id, props);

    const { envName, env } = props;

    new PipelineConstruct(this, 'PipelineConstruct', {
      envName,
      env: {
        account: env?.account || process.env.CDK_DEFAULT_ACCOUNT,
        region: env?.region || process.env.CDK_DEFAULT_REGION || 'us-east-1',
      },
      config,
      gitHubTokenSecret: 'github-token-nickthiru3',
    });
  }
}
