import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PipelineConstruct } from '#lib/pipeline/construct';
import { PipelineConfig } from '#lib/types/pipeline';

describe('PipelineConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  const testConfig: PipelineConfig = {
    envName: 'test',
    account: '123456789012',
    region: 'us-east-1',
    stages: {
      dev: {
        enabled: true,
        account: '123456789012',
        region: 'us-east-1',
      },
      staging: {
        enabled: true,
        account: '123456789012',
        region: 'us-east-1',
      },
      prod: {
        enabled: true,
        account: '123456789012',
        region: 'us-east-1',
      },
    },
    gitHubRepo: 'test-owner/test-repo',
    gitHubBranch: 'main',
    codestarConnectionId: 'test-connection-id',
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
  });

  test('creates a pipeline with default configuration', () => {
    // WHEN
    new PipelineConstruct(stack, 'TestPipeline', {
      envName: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      config: testConfig,
    });

    // THEN
    const template = Template.fromStack(stack);
    
    // Verify the pipeline is created
    template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    
    // Verify the source action is configured correctly
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: [
        {
          Name: 'Source',
          Actions: [
            {
              Name: 'Source',
              ActionTypeId: {
                Category: 'Source',
                Owner: 'AWS',
                Provider: 'CodeStarSourceConnection',
              },
              Configuration: {
                ConnectionArn: {
                  'Fn::Join': [
                    '',
                    [
                      'arn:aws:codestar-connections:us-east-1:123456789012:connection/',
                      'test-connection-id',
                    ],
                  ],
                },
                FullRepositoryId: 'test-owner/test-repo',
                BranchName: 'main',
              },
            },
          ],
        },
      ],
    });
  });

  test('creates pipeline with multiple stages', () => {
    // GIVEN
    const multiStageConfig: PipelineConfig = {
      ...testConfig,
      stages: {
        dev: { enabled: true },
        staging: { enabled: true },
        prod: { enabled: true },
      },
    };

    // WHEN
    new PipelineConstruct(stack, 'TestPipeline', {
      envName: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      config: multiStageConfig,
    });

    // THEN
    const template = Template.fromStack(stack);
    
    // Verify the pipeline has the expected number of stages
    const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
    const stages = Object.values(pipeline)[0].Properties.Stages;
    expect(stages.length).toBeGreaterThanOrEqual(3); // Source + Build + Deploy stages
  });

  test('skips disabled stages', () => {
    // GIVEN
    const configWithDisabledStage: PipelineConfig = {
      ...testConfig,
      stages: {
        dev: { enabled: true },
        staging: { enabled: false }, // Disabled stage
        prod: { enabled: true },
      },
    };

    // WHEN
    new PipelineConstruct(stack, 'TestPipeline', {
      envName: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      config: configWithDisabledStage,
    });

    // THEN
    const template = Template.fromStack(stack);
    const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
    const stages = Object.values(pipeline)[0].Properties.Stages;
    
    // Verify the disabled stage is not in the pipeline
    const stageNames = stages.map((stage: any) => stage.Name);
    expect(stageNames).not.toContain('staging');
  });

  test('adds manual approval for production', () => {
    // GIVEN
    const configWithProd: PipelineConfig = {
      ...testConfig,
      stages: {
        prod: { enabled: true },
      },
    };

    // WHEN
    new PipelineConstruct(stack, 'TestPipeline', {
      envName: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      config: configWithProd,
    });

    // THEN
    const template = Template.fromStack(stack);
    
    // Verify the manual approval action is present for production
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: [
        {
          Name: 'prod',
          Actions: [
            {
              Name: 'PromoteToProduction',
              ActionTypeId: {
                Category: 'Approval',
                Owner: 'AWS',
                Provider: 'Manual',
              },
            },
          ],
        },
      ],
    });
  });
});
