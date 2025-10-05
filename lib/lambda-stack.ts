import { Table } from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface LambdaStackProps {
  usersTable: Table;
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
      },
      bundling: {
        // disables Docker fallback
        forceDockerBundling: false,
        minify: true,
        externalModules: ["@aws-sdk"],
      },
    });

    props.usersTable.grantReadWriteData(this.authLambda);
  }
}
