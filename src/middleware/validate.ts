import { AnyZodObject, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.log(error.issues); // 👈 log real reason

        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues,
        });
      }

      return res.status(400).json({
        message: "Unknown validation error",
      });
    }
  };