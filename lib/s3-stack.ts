import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class S3Stack extends cdk.Stack {
  public readonly s3Bucket: s3.Bucket;
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    this.s3Bucket = new s3.Bucket(this, process.env.BUCKET_ID!, {
      bucketName: process.env.BUCKET_NAME!,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.s3Bucket.addCorsRule({
      allowedOrigins: ["*"], // Or restrict to your domain
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.PUT,
        s3.HttpMethods.POST,
        s3.HttpMethods.DELETE,
      ],
      allowedHeaders: ["*"],
    });
  }
}
