#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HttpApiSampleStack } from '../lib/http-api-sample-stack';

const app = new cdk.App();
// 本番環境か開発環境か
const contextKey = process.env.ENV === 'prod' ? 'prod' : 'dev';
// cdk.json の context に設定した値を取得
const context = app.node.tryGetContext(contextKey);

new HttpApiSampleStack(app, 'HttpApiSampleStack', {
  context,
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});