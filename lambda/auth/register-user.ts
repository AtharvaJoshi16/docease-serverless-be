import { APIGatewayProxyEvent } from "aws-lambda";
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
    console.log(body);
    const userId = crypto.randomUUID();
    const userData = await findUserByEmail(body?.email);
    // const hashedPwd = bcrypt.hashSync(body?.password, bcrypt.genSaltSync(10));
    // console.log("Hashed 34", hashedPwd);
    const file = body?.files?.[0];
    console.log(file);
    console.log("Body 36", body);

    if (!!userData?.Items?.length) {
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
      password: body?.password,
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
