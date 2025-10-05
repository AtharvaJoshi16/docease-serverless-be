import { handler as registerUser } from "./register-user";
const routes: Record<string, Record<string, Function>> = {
  "/auth/register": {
    POST: registerUser,
  },
};
export const handler = async (event: any) => {
  const path = event?.resource || event?.path;
  const method = event?.httpMethod;
  const routeHandler = routes[path]?.[method];
  if (!routeHandler) {
    return {
      statusCode: 404,
    };
  }
  try {
    return await routeHandler(event);
  } catch (e) {
    console.log(e);
    return {
      statusCode: 500,
      body: JSON.stringify({ err: "Internal Server Error" }),
    };
  }
};
