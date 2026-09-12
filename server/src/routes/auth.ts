import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db";

const router = Router();

function makeToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || username.length < 3 || !password || password.length < 6) {
    return res.status(400).json({ error: "Име мин. 3 знака, парола мин. 6" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { username, passwordHash },
      select: { id: true, username: true },   // NIKOGA ne vrushtame hash-a
    });
    res.status(201).json({ token: makeToken(user.id), user });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Името е заето" });
    }
    throw err;
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Липсват данни" });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Грешно име или парола" });
  }

  res.json({
    token: makeToken(user.id),
    user: { id: user.id, username: user.username },
  });
});

export default router;