import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Kato requireAuth, no NE otkazva pri lipsvasht token.
 * Prosto slaga req.userId, ako ima validen token.
 *
 * Polzva se za publichni marshruti, koito pokazvat POVECHE neshta
 * na lognatiya potrebitel (napr. postove samo za posledovateli).
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as {
        userId: string;
      };
      req.userId = payload.userId;
    } catch {
      // nevaliden token → tretirame go kato anonimen posetitel
    }
  }
  next();
}
