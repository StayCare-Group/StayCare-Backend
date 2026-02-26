import type { Request, Response, NextFunction } from "express";

export const authorize =
  (requiredRole: "admin" | "user") =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { role } = req.user;

    if (requiredRole === "admin" && role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };

