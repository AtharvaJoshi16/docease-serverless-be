import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { parse } from "lambda-multipart-parser";
import { ZodError } from "zod";
import { findUserByEmail } from "../utils/findUserByEmail";
import { getFileExtension } from "../utils/utils";
dotenv.config();
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const s3 = new S3Client({ region: process.env.REGION });

export const handler = async (event: any) => {
  try {
    const decodedBody = Buffer.from(event.body, "base64").toString("utf8");
    let body = await parse({
      ...event,
      body: decodedBody,
      isBase64Encoded: false,
      headers: {
        "content-type":
          event.headers["content-type"] || event.headers["Content-Type"],
      },
    });
    console.log("Body 29", body);
    // RegisterSchema.parse(body);
    const userId = crypto.randomUUID();
    const userData = await findUserByEmail(client, body?.email);
    const hashedPwd = await bcrypt.hash(body?.password, 10);
    console.log("Hashed 34", hashedPwd);
    const file = body?.files?.[0];
    console.log(file);
    body!.password = hashedPwd;
    console.log("Body 36", body);

    if (!!userData?.Items?.length) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          err: `User already exists with email: ${body?.email}`,
        }),
      };
    }
    console.log("Above profile image key");
    const profileImageKey = `de-users/${userId}/profile_image.${getFileExtension(
      file.filename
    )}`;
    console.log(profileImageKey, file.contentType);
    if (!!file) {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: profileImageKey,
          Body: file.content,
          ContentType: file.contentType,
        })
      );
    }

    await docClient.send(
      new PutCommand({
        TableName: process.env.AUTH_TABLE,
        Item: { ...body, userId, profileImageKey },
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
