import { APIGatewayProxyEvent } from "aws-lambda";
import * as bcrypt from "bcryptjs";
import { parse } from "lambda-multipart-parser";
import { ZodError } from "zod";
import { createUser, findUserByEmail } from "../utils/queries";
import { addAttachments, getFileExtension } from "../utils/utils";

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const decodedBody = Buffer.from(event.body!, "base64").toString("utf8");
    let body = await parse({
      ...event,
      body: decodedBody,
      isBase64Encoded: false,
    });
    const userId = crypto.randomUUID();
    console.log(body?.email);

    const userData = await findUserByEmail(body?.email);
    const hashedPwd = await bcrypt.hash(body?.password, 8);
    console.log(userData);
    const file = body?.files?.[0];
    console.log(file);

    if (!!userData?.email) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          err: `User already exists with email: ${body?.email}`,
        }),
      };
    }

    const profileImageKey = file
      ? `users/${userId}/profile_image.${getFileExtension(file.filename)}`
      : undefined;

    const user = await createUser({
      userId,
      email: body?.email,
      firstName: body?.firstName,
      lastName: body?.lastName,
      password: hashedPwd,
      profileImageKey: profileImageKey,
    });

    if (!!file && user.$metadata.httpStatusCode === 200 && profileImageKey) {
      await addAttachments([{ ...file, key: profileImageKey }]);
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ userId }),
    };
  } catch (e) {
    console.log("Error", e);
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
