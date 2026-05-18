import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Token required" });

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: string };
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

/**
 * Optional auth: populates req.userId/userRole if a valid token is present,
 * but does NOT reject anonymous requests. Useful for endpoints that work for
 * both authenticated and anonymous users but customize output (e.g. hasLiked).
 */
export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: string };
    req.userId = decoded.id;
    req.userRole = decoded.role;
  } catch {
    /* ignore invalid token — treat as anonymous */
  }
  next();
}
