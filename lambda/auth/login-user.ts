import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { findUserByEmail } from "../utils/findUserByEmail";
dotenv.config();
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const s3 = new S3Client({ region: process.env.REGION });

export const handler = async (event: any) => {
  try {
    let body = JSON.parse(event.body);
    let { email, password } = body;
    const user = (await findUserByEmail(docClient, email))?.Items?.[0];

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ err: `User not found with email ${email}` }),
      };
    }
    const parsedUser = unmarshall(user);
    console.log(parsedUser);
    const isPwdValid = password === parsedUser.password;
    if (!isPwdValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ err: "Invalid Password" }),
      };
    }
    let profileImageUrl;
    if (parsedUser.profileImageKey!) {
      const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME!,
        Key: parsedUser.profileImageKey!,
      });
      profileImageUrl = await getSignedUrl(s3, command, {
        expiresIn: 86400,
      });
    }
    delete parsedUser?.password;
    return {
      statusCode: 200,
      body: JSON.stringify({
        user: parsedUser,
        profileImage: profileImageUrl,
        token: jwt.sign(
          { userId: parsedUser.userId, email: parsedUser.email },
          process.env.JWT_SECRET!,
          {
            expiresIn: "1Day",
          }
        ),
      }),
    };
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ err: "Internal Server Error" }),
    };
  }
};
