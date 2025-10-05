import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";

export const findUserByEmail = async (
  client: DynamoDBClient,
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
