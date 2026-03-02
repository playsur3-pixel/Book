import type { Handler } from "@netlify/functions";
import jwt from "jsonwebtoken";
import { getCookie, json } from "./_utils";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "adminbook";
const JWT_SECRET = process.env.AUTH_JWT_SECRET || "dev-secret";

export const handler: Handler = async (event) => {
  const token = getCookie(event.headers.cookie, COOKIE_NAME);
  if (!token) return json(200, { authenticated: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return json(200, { authenticated: true, username: decoded.sub, role: decoded.role });
  } catch {
    return json(200, { authenticated: false });
  }
};
