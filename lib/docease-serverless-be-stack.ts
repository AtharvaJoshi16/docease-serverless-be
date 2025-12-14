import * as cdk from "aws-cdk-lib";
import * as gateway from "aws-cdk-lib/aws-apigateway";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { join } from "path";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const commonParams = {
  handler: "handler",
  runtime: lambda.Runtime.NODEJS_22_X,
  bundling: {
    // disables Docker fallback
    forceDockerBundling: false,
    minify: true,
    externalModules: ["@aws-sdk"],
  },
};

export class DoceaseServerlessBeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: process.env.ROOT_DOMAIN_NAME!,
    });

    const cert = new acm.Certificate(this, "DocEaseCertificate", {
      domainName: process.env.API_DOMAIN_NAME!,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    const domainName = new gateway.DomainName(this, "DocEaseDomainName", {
      domainName: process.env.API_DOMAIN_NAME!,
      certificate: cert,
      endpointType: gateway.EndpointType.REGIONAL,
      securityPolicy: gateway.SecurityPolicy.TLS_1_2,
    });

    const apiGateway = new gateway.RestApi(this, "DocEaseApiGateway", {
      description: "API Gateway for DocEase Serverless Backend",
      defaultCorsPreflightOptions: {
        allowOrigins: gateway.Cors.ALL_ORIGINS,
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      },
      binaryMediaTypes: ["multipart/form-data"],
      deployOptions: {
        stageName: "dev",
      },
    });

    new gateway.BasePathMapping(this, "BasePathMapping", {
      domainName: domainName,
      restApi: apiGateway,
      stage: apiGateway.deploymentStage,
    });

    new route53.ARecord(this, "ApiAliasRecord", {
      zone: hostedZone,
      recordName: process.env.API_DOMAIN_NAME!,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayDomain(domainName)
      ),
    });

    const s3Bucket = new s3.Bucket(this, "DocEaseBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    s3Bucket.addCorsRule({
      allowedOrigins: ["*"], // Or restrict to your domain
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.PUT,
        s3.HttpMethods.POST,
        s3.HttpMethods.DELETE,
      ],
      allowedHeaders: ["*"],
    });

    const usersTable = new dynamodb.Table(this, "DEUsersTable", {
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    usersTable.addGlobalSecondaryIndex({
      indexName: "EmailIndex",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const registerFn = new NodejsFunction(this, "RegisterUserFn", {
      entry: join(__dirname, "../lambda/auth/register-user.ts"),
      ...commonParams,
      environment: {
        REGION: process.env.CDK_DEFAULT_REGION!,
        JWT_SECRET: process.env.JWT_SECRET!,
        AUTH_TABLE: usersTable.tableName,
        BUCKET_NAME: s3Bucket.bucketName,
      },
    });

    const loginFn = new NodejsFunction(this, "LoginUserFn", {
      entry: join(__dirname, "../lambda/auth/login-user.ts"),
      ...commonParams,
      environment: {
        REGION: process.env.CDK_DEFAULT_REGION!,
        JWT_SECRET: process.env.JWT_SECRET!,
        AUTH_TABLE: usersTable.tableName,
        BUCKET_NAME: s3Bucket.bucketName,
      },
    });

    s3Bucket.grantReadWrite(registerFn);
    usersTable.grantReadWriteData(registerFn);

    s3Bucket.grantReadWrite(loginFn);
    usersTable.grantReadWriteData(loginFn);

    const authResource = apiGateway.root.addResource("auth");
    const registerResource = authResource.addResource("register");
    const loginResource = authResource.addResource("login");

    registerResource.addMethod(
      "POST",
      new gateway.LambdaIntegration(registerFn)
    );
    loginResource.addMethod("POST", new gateway.LambdaIntegration(loginFn));
  }
}
