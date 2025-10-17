import * as cdk from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { join } from "path";

interface LambdaStackProps extends cdk.StackProps {
  usersTable: Table;
  s3Bucket: s3.Bucket;
}

export class LambdaStack extends Construct {
  public readonly authLambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id);
    this.authLambda = new NodejsFunction(this, "AuthLambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: join(__dirname, "../lambda/auth/index.ts"),
      handler: "handler",
      environment: {
        AUTH_TABLE: props.usersTable.tableName,
        BUCKET_NAME: props.s3Bucket.bucketName,
        REGION: process.env.CDK_DEFAULT_REGION!,
        JWT_SECRET: process.env.JWT_SECRET!,
      },
      bundling: {
        // disables Docker fallback
        forceDockerBundling: false,
        minify: true,
        externalModules: ["@aws-sdk"],
      },
    });
    props.s3Bucket.grantReadWrite(this.authLambda);
    props.usersTable.grantReadWriteData(this.authLambda);
  }
}
