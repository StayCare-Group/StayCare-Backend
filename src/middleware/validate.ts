import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const validate =
  (schema: z.ZodType) =>
import { ZodError, type ZodObject } from "zod";
import type { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        console.log(err.issues);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          data: error.issues,
          errors: err.issues,
        });
      }

      return res.status(400).json({
        success: false,
        message: "Unknown validation error",
      });
    }
  };
