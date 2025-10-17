import * as gateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
interface ApiGatewayStackProps {
  authLambda: lambda.Function;
}

export class ApiGatewayStack extends Construct {
  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id);

    const api = new gateway.LambdaRestApi(this, "AuthApi", {
      handler: props.authLambda,
      proxy: false,
      binaryMediaTypes: ["multipart/form-data"],
    });

    const auth = api.root.addResource("auth");
    const register = auth.addResource("register");
    register.addMethod("POST", new gateway.LambdaIntegration(props.authLambda));
    const login = auth.addResource("login");
    login.addMethod("POST", new gateway.LambdaIntegration(props.authLambda));
  }
}
