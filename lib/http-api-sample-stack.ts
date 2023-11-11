import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from '@aws-cdk/aws-apigatewayv2-alpha';
import * as authz from '@aws-cdk/aws-apigatewayv2-authorizers-alpha';
import * as intg from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

export type SampleStackProps = cdk.StackProps & { context: any };

export class HttpApiSampleStack extends cdk.Stack {
  private context: any;

  constructor(scope: Construct, id: string, props: SampleStackProps) {
    super(scope, id, props);

    this.context = props.context;

    // Cognito User Pool & User Pool Client
    const userPool = this.createUserPool(this.context.cognito.domainPrefix);
    const userPoolClient = this.createUserPoolClient(userPool, this.context.cognito.callbackUrls);

    // Authorizer
    const authorizer = this.createAuthorizer(userPool, userPoolClient);

    // Lambda
    const func = this.createFunc();

    // API Gateway
    this.createApiGateway(func, authorizer);
  }

  /**
   * Cognito ユーザープールの作成
   * {@link UserPool | https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPool.html}
   * {@link UserPoolDomainOptions | https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPoolDomainOptions.html}
   */
  private createUserPool(cognitoDomainPrefix: string): cognito.IUserPool {
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      standardAttributes: {
        email: { required: true, mutable: true },
        phoneNumber: { required: false },
      },
      autoVerify: { email: true },
      signInAliases: { email: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    userPool.addDomain('UserPoolDomain', {
      // cognitoドメインまたはカスタムドメインが選択可能
      cognitoDomain: { domainPrefix: cognitoDomainPrefix },
      // customDomain: {}
    });
    return userPool;
  }

  /**
   * Cognito ユーザープールクライアントの作成
   * {@link UserPoolClient | https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito.UserPoolClient.html}
   */
  private createUserPoolClient(userPool: cognito.IUserPool, callbackUrls: string[]): cognito.IUserPoolClient {
    return userPool.addClient('client', {
      generateSecret: true,
      oAuth: {
        callbackUrls,
        scopes: [cognito.OAuthScope.OPENID],
        flows: {
          authorizationCodeGrant: true,
          clientCredentials: false,
          implicitCodeGrant: false,
        },
      },
      authFlows: {
        adminUserPassword: false,
        custom: false,
        userPassword: false,
        userSrp: false,
      },
    });
  }

  /**
   * @description API Gateway用オーソライザーの作成
   * {@link class HttpUserPoolAuthorizer | https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-apigatewayv2-authorizers-alpha.HttpUserPoolAuthorizer.html}
   */
  private createAuthorizer(
    userPool: cognito.IUserPool,
    userPoolClient: cognito.IUserPoolClient
  ): apigw.IHttpRouteAuthorizer {
    return new authz.HttpUserPoolAuthorizer('Authorizer', userPool, {
      userPoolClients: [userPoolClient],
    });
  }

  /**
   * @description Lambdaの作成
   * {@link ParamsAndSecretsLayerVersion | https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda.ParamsAndSecretsLayerVersion.html}
   * {@link NodejsFunction | https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda_nodejs.NodejsFunction.html}
   */
  private createFunc(): lambdaNodeJs.NodejsFunction {
    return new lambdaNodeJs.NodejsFunction(this, 'SampleFunc', {
      entry: 'src/lambda/sample/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.minutes(5),
    });
  }

  /**
   * @description API Gatewayの作成
   * {@link class HttpApi | https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-apigatewayv2-alpha.HttpApi.html}
   */
  private createApiGateway(
    func: lambdaNodeJs.NodejsFunction,
    authorizer: apigw.IHttpRouteAuthorizer
  ): apigw.IHttpApi {
    const httpApi = new apigw.HttpApi(this, 'SampleHttpApi');
    const integration = new intg.HttpLambdaIntegration('Integration', func);
    httpApi.addRoutes({
      methods: [apigw.HttpMethod.GET],
      path: '/sample',
      authorizer,
      integration,
    });
    return httpApi;
  }
}