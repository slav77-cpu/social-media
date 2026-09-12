import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /api/notifications — posledni izvestiya + broy neprocheteni
router.get("/", requireAuth, async (req, res) => {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({ where: { userId: req.userId!, read: false } }),
  ]);

  res.json({ items, unread });
});

// POST /api/notifications/read — markira vsichki kato procheteni
router.post("/read", requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.userId!, read: false },
    data: { read: true },
  });
  res.status(204).send();
});

export default router;
