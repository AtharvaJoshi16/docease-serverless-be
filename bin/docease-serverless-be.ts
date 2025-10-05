#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "dotenv/config";
import { DoceaseServerlessBeStack } from "../lib/docease-serverless-be-stack";

const app = new cdk.App();
new DoceaseServerlessBeStack(app, "DoceaseServerlessBeStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
