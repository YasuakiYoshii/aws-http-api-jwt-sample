import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { HttpApiSampleStack } from '../lib/http-api-sample-stack';

const context = {
    cognito: {
        domainPrefix: 'taaazyyy-sample-test',
        callbackUrls: ['https://example.com/callback'],
    },
};

test('UserPool', () => {
    const app = new cdk.App();
    const stack = new HttpApiSampleStack(app, 'SampleStack', { context });
    const template = Template.fromStack(stack);

    // User Pool
    template.resourceCountIs('AWS::Cognito::UserPool', 1);
    template.hasResourceProperties('AWS::Cognito::UserPool', {
        Schema: [
            { Mutable: true, Name: 'email', Required: true },
            {
                Mutable: true,
                Name: 'phone_number',
                Required: false,
            },
        ],
        AutoVerifiedAttributes: ['email'],
        UsernameAttributes: ['email'],
        AccountRecoverySetting: {
            RecoveryMechanisms: [{ Name: 'verified_email', Priority: 1 }],
        },
    });

    // User Pool Domain
    template.resourceCountIs('AWS::Cognito::UserPoolDomain', 1);
    template.hasResourceProperties('AWS::Cognito::UserPoolDomain', {
        Domain: 'taaazyyy-sample-test',
        UserPoolId: Match.anyValue(),
    });

    // User Pool Client
    template.resourceCountIs('AWS::Cognito::UserPoolClient', 1);
    template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        GenerateSecret: true,
        CallbackURLs: ['https://example.com/callback'],
        AllowedOAuthScopes: ['openid'],
        AllowedOAuthFlows: ['code'],
        AllowedOAuthFlowsUserPoolClient: true,
        ExplicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH'],
    });
});

test('Lambda', () => {
    const app = new cdk.App();
    const stack = new HttpApiSampleStack(app, 'SampleStack', { context });
    const template = Template.fromStack(stack);

    // Lambda
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 300,
    });
});

test('ApiGateway', () => {
    const app = new cdk.App();
    const stack = new HttpApiSampleStack(app, 'SampleStack', { context });
    const template = Template.fromStack(stack);

    // API Gateway
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
    template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        Name: 'SampleHttpApi',
        ProtocolType: 'HTTP',
    });

    // Route
    template.resourceCountIs('AWS::ApiGatewayV2::Route', 1);
    template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'GET /sample',
    });

    // Authorizer
    template.resourceCountIs('AWS::ApiGatewayV2::Authorizer', 1);
    template.hasResourceProperties('AWS::ApiGatewayV2::Authorizer', {
        AuthorizerType: 'JWT',
    });
});
