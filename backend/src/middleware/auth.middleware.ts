import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface DecodedToken {
  userId: string;
  shopId: string;
  role: "OWNER" | "STAFF";
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Missing or invalid authorization header." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    req.auth = {
      userId: decoded.userId,
      shopId: decoded.shopId,
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Session expired — please log in again." });
  }
}