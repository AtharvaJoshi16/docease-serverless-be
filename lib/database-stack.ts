import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DatabaseStack extends Construct {
  public readonly usersTable: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.usersTable = new dynamodb.Table(this, "DEUsersTable", {
      tableName: process.env.AUTH_TABLE,
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.usersTable.addGlobalSecondaryIndex({
      indexName: "EmailIndex",
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
    });
  }
}
