import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../types/User";
import { findUserByEmail } from "../utils/queries";
import { getPresignedUrl } from "../utils/utils";
export const handler = async (event: any) => {
  try {
    let body = JSON.parse(event.body);
    let { email, password } = body;
    const user = (await findUserByEmail(email)) as User;
    console.log("User fetched:", user);
    if (!user?.email) {
      return {
        statusCode: 404,
        body: JSON.stringify({ err: `User not found with email ${email}` }),
      };
    }
    const isPwdValid = await bcrypt.compare(password, user.password!);
    if (!isPwdValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ err: "Invalid Password" }),
      };
    }
    let profileImageUrl;
    if (user?.profileImageKey!) {
      profileImageUrl = await getPresignedUrl(user.profileImageKey);
    }
    delete user?.password;
    return {
      statusCode: 200,
      body: JSON.stringify({
        user: user,
        profileImage: profileImageUrl,
        token: jwt.sign(
          { userId: user.userId, email: user.email },
          process.env.JWT_SECRET!,
          {
            expiresIn: "24h",
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
