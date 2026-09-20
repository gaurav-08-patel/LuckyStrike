import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
      };
    }
  }
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret",
    ) as JwtPayload;

    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};
