import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { User } from "../../types/User";
import { DDB } from "./clients";

export const findUserByEmail = async (email: string) => {
  console.log("Finding user by email:", email, process.env.AUTH_TABLE);
  const res = await DDB.send(
    new QueryCommand({
      TableName: process.env.AUTH_TABLE,
      IndexName: "EmailIndex",
      KeyConditionExpression: "#e = :email",
      ExpressionAttributeNames: { "#e": "email" },
      ExpressionAttributeValues: { ":email": email },
    })
  );

  return res.Items?.[0] ?? null;
};

export const createUser = async (item: User) => {
  return await DDB.send(
    new PutCommand({
      TableName: process.env.AUTH_TABLE,
      Item: {
        ...item,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    })
  );
};
