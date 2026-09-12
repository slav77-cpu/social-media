import { Router } from "express";
import { Visibility } from "@prisma/client";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";
import { optionalAuth } from "../middlewares/optionalAuth";
import { moderateComment } from "../lib/ai";
import { notify } from "../lib/notify";

const router = Router();

const authorSelect = { select: { id: true, username: true, avatarUrl: true } };

// GET /api/posts — feed
// ?take=20&skip=0   → paginaciya
// ?following=true   → samo ot horata, koito sledvam (iska token)
router.get("/", optionalAuth, async (req, res) => {
  const take = Math.min(Number(req.query.take) || 20, 50); // tavan, za da ne durpat vsichko
  const skip = Number(req.query.skip) || 0;

  const me = req.userId
    ? await prisma.user.findUnique({ where: { id: req.userId } })
    : null;

  if (req.query.following === "true" && !me) {
    return res.status(401).json({ error: "Липсва токен" });
  }

  // Kogo imam pravo da vidya:
  // - vsichki PUBLIC postove
  // - FOLLOWERS postovete na horata, koito sledvam
  // - vsichko moe
  const visibilityFilter = me
    ? {
        OR: [
          { visibility: Visibility.PUBLIC },
          { visibility: Visibility.FOLLOWERS, authorId: { in: me.following } },
          { authorId: me.id },
        ],
      }
    : { visibility: Visibility.PUBLIC };

  const where =
    req.query.following === "true"
      ? { AND: [{ authorId: { in: me!.following } }, visibilityFilter] }
      : visibilityFilter;

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { author: authorSelect },
    take,
    skip,
  });
  res.json(posts);
});

// GET /api/posts/:id — edin post (izvestiyata vodyat tuk)
router.get("/:id", optionalAuth, async (req, res) => {
  const id = String(req.params.id);

  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: authorSelect },
  });
  if (!post) return res.status(404).json({ error: "Няма такъв пост" });

  // Sushtata proverka kato vuv feed-a, no za edin post.
  // Bez neya FOLLOWERS post bi se vidyal ot vseki, koyto znae ID-to.
  if (post.visibility === Visibility.FOLLOWERS) {
    const me = req.userId
      ? await prisma.user.findUnique({ where: { id: req.userId } })
      : null;

    const allowed =
      me && (me.id === post.authorId || me.following.includes(post.authorId));

    if (!allowed) return res.status(404).json({ error: "Няма такъв пост" });
  }

  res.json(post);
});

// POST /api/posts — nov post
router.post("/", requireAuth, async (req, res) => {
  const { caption, imageUrl, visibility } = req.body;
  if (!caption || caption.length < 2) {
    return res.status(400).json({ error: "Описанието е задължително" });
  }

  const post = await prisma.post.create({
    data: {
      caption,
      imageUrl,
      authorId: req.userId!,
      visibility: visibility === "FOLLOWERS" ? Visibility.FOLLOWERS : Visibility.PUBLIC,
    },
    include: { author: authorSelect },
  });
  res.status(201).json(post);
});

// PATCH /api/posts/:id — redakciya (samo avtorut)

router.patch("/:id", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const { caption, visibility } = req.body;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: "Няма такъв пост" });
  if (post.authorId !== req.userId) {
    return res.status(403).json({ error: "Нямаш право" });
  }

  if (caption !== undefined && caption.trim().length < 2) {
    return res.status(400).json({ error: "Описанието е твърде кратко" });
  }

  const updated = await prisma.post.update({
    where: { id },
    data: {
      ...(caption !== undefined ? { caption: caption.trim() } : {}),
      ...(visibility !== undefined
        ? {
            visibility:
              visibility === "FOLLOWERS" ? Visibility.FOLLOWERS : Visibility.PUBLIC,
          }
        : {}),
      editedAt: new Date(), // za nadpisa "redaktiran"
    },
    include: { author: authorSelect },
  });

  res.json(updated);
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

  await notify({
    userId: post.authorId,
    actorId: req.userId!,
    type: "COMMENT",
    postId: post.id,
    excerpt: text.trim(),
  });

  res.status(201).json(post);
});

// DELETE /api/posts/:id/comments/:index — mahane na komentar
// Pravo imat: avtorut na komentara ILI sobstvenikut na posta.
router.delete("/:id/comments/:index", requireAuth, async (req, res) => {
  const id = String(req.params.id);
  const index = Number(req.params.index);

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: "Няма такъв пост" });

  const comment = post.comments[index];
  if (!comment) return res.status(404).json({ error: "Няма такъв коментар" });

  const isPostOwner = post.authorId === req.userId;
  const isCommentAuthor = comment.authorId === req.userId;
  if (!isPostOwner && !isCommentAuthor) {
    return res.status(403).json({ error: "Нямаш право" });
  }

  // Prisma nyama "mahni element N" za vgradeni masivi —
  // presmyatame noviya masiv i go zapisvame cyal.
  const comments = post.comments.filter((_, i) => i !== index);

  const updated = await prisma.post.update({
    where: { id },
    data: { comments: { set: comments } },
    include: { author: authorSelect },
  });

  res.json(updated);
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

  // uvedomyavame samo pri NOV layk, ne pri mahane
  if (!liked) {
    await notify({
      userId: post.authorId,
      actorId: userId,
      type: "LIKE",
      postId: post.id,
    });
  }

  res.json(updated);
});

export default router;
