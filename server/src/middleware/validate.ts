import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

export const objectId = z.string().refine((v) => isValidObjectId(v), 'Invalid id');

export function validate(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      res.status(400).json({ error: issue ? `${issue.path.join('.') || 'body'}: ${issue.message}` : 'Invalid input' });
      return;
    }
    req.body = result.data;
    next();
  };
}

// Malformed ids get a 404 instead of a Mongoose CastError (500).
export function idParam(...names: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (names.some((n) => !isValidObjectId(req.params[n]))) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    next();
  };
}
