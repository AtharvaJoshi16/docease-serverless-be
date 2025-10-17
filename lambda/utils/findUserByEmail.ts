import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const findUserByEmail = async (
  client: DynamoDBDocumentClient,
  email: string
) => {
  const cmd = new QueryCommand({
    TableName: process.env.AUTH_TABLE,
    IndexName: "EmailIndex",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": { S: email },
    },
  });

  return await client.send(cmd);
};
