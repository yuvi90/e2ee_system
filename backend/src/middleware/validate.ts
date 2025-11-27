import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Validates request body using a provided Zod schema.
 */
export const validate =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        errors: result.error.flatten(),
      });
      return;
    }
    req.body = result.data; // replace body with validated data
    next();
  };
