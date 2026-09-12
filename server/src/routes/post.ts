import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";
import { moderateComment } from "../lib/ai";

const router = Router();

const authorSelect = { select: { id: true, username: true } };

// GET /api/posts — feed
// ?take=20&skip=0            → paginaciya
// ?following=true            → samo ot horata, koito sledvam (iska token)
router.get("/", async (req, res) => {
  const take = Math.min(Number(req.query.take) || 20, 50); // tavan, za da ne durpat vsichko
  const skip = Number(req.query.skip) || 0;

  let where = {};

  if (req.query.following === "true") {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Липсва токен" });
    }
    try {
      const jwt = (await import("jsonwebtoken")).default;
      const { userId } = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as {
        userId: string;
      };
      const me = await prisma.user.findUnique({ where: { id: userId } });
      where = { authorId: { in: me?.following ?? [] } };
    } catch {
      return res.status(401).json({ error: "Невалиден токен" });
    }
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { author: authorSelect },
    take,
    skip,
  });
  res.json(posts);
});

// GET /api/posts/:id
router.get("/:id", async (req, res) => {
  const id = String(req.params.id);

  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: authorSelect },
  });
  if (!post) return res.status(404).json({ error: "Няма такъв пост" });
  res.json(post);
});

// POST /api/posts — nov post
router.post("/", requireAuth, async (req, res) => {
  const { caption, imageUrl } = req.body;
  if (!caption || caption.length < 2) {
    return res.status(400).json({ error: "Описанието е задължително" });
  }

  const post = await prisma.post.create({
    data: { caption, imageUrl, authorId: req.userId! },
    include: { author: authorSelect },
  });
  res.status(201).json(post);
});

// DELETE /api/posts/:id — samo sobstvenikut
router.delete("/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: "Няма такъв пост" });
  if (post.authorId !== req.userId) {
    return res.status(403).json({ error: "Нямаш право" });
  }

  await prisma.post.delete({ where: { id } });
  res.status(204).send();
});

// POST /api/posts/:id/comments — komentar (VGRADEN v posta)
router.post("/:id/comments", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const { text } = req.body;

  if (!text?.trim()) return res.status(400).json({ error: "Празен коментар" });

  // AI moderaciya PREDI zapis v bazata
  const check = await moderateComment(text.trim());
  if (!check.allowed) {
    return res.status(422).json({ error: `Коментарът е отхвърлен: ${check.reason}` });
  }

  const me = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!me) return res.status(401).json({ error: "Невалиден потребител" });

  const post = await prisma.post.update({
    where: { id },
    data: {
      comments: {
        push: { authorId: me.id, authorName: me.username, text: text.trim() },
      },
    },
    include: { author: authorSelect },
  });
  res.status(201).json(post);
});

// POST /api/posts/:id/like — toggle
router.post("/:id/like", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const userId = req.userId!;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: "Няма такъв пост" });

  const liked = post.likedBy.includes(userId);
  const likedBy = liked
    ? post.likedBy.filter((uid) => uid !== userId)
    : [...post.likedBy, userId];

  const updated = await prisma.post.update({
    where: { id },
    data: { likedBy },
    include: { author: authorSelect },
  });
  res.json(updated);
});

export default router;
