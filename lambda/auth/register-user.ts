import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { ZodError } from "zod";
import { RegisterSchema } from "../../validations/RegisterSchema";
import { findUserByEmail } from "../utils/findUserByEmail";
dotenv.config();
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  const body = JSON.parse(event?.body ?? {});
  console.log(body);
  try {
    RegisterSchema.parse(body);
    const userId = crypto.randomUUID();
    const userData = await findUserByEmail(client, body?.email);
    const hashedPwd = await bcrypt.hash(body?.password, 10);
    body!.password = hashedPwd;
    console.log(body);
    if (!!userData?.Items?.length) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          err: `User already exists with email: ${body?.email}`,
        }),
      };
    }
    await docClient.send(
      new PutCommand({
        TableName: process.env.AUTH_TABLE,
        Item: { ...body, userId },
      })
    );
    return {
      statusCode: 201,
      body: JSON.stringify({ userId }),
    };
  } catch (e) {
    console.log(e);
    if (e instanceof ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ err: e?.issues }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ err: "Internal server error" }),
    };
  }
};
