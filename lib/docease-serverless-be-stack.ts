import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApiGatewayStack } from "./api-gateway-stack";
import { DatabaseStack } from "./database-stack";
import { LambdaStack } from "./lambda-stack";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class DoceaseServerlessBeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const db = new DatabaseStack(this, "DatabaseStack");
    const lambda = new LambdaStack(this, "LambdaStack", {
      usersTable: db.usersTable,
    });
    new ApiGatewayStack(this, "ApiGatewayStack", {
      authLambda: lambda.authLambda,
    });
  }
}
