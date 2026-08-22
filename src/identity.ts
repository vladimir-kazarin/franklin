import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

const COOKIE_NAME = "uid";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function parseUid(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const found = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return found ? decodeURIComponent(found.slice(COOKIE_NAME.length + 1)) : null;
}

export function identityMiddleware(req: Request, res: Response, next: NextFunction) {
  let uid = parseUid(req.headers.cookie);
  if (!uid) {
    uid = crypto.randomUUID();
    res.cookie(COOKIE_NAME, uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ONE_YEAR_MS,
      path: "/",
    });
  }
  req.userId = uid;
  next();
}
