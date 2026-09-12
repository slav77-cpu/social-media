import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const authorSelect = { select: { id: true, username: true } };

// GET /api/users/me — koy sum az (s aktualni spisuci)
router.get("/me", requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, username: true, bio: true, following: true, followers: true },
  });
  if (!me) return res.status(404).json({ error: "Потребителят не съществува" });
  res.json(me);
});

// GET /api/users/:username — profil + postovete mu
router.get("/:username", async (req, res) => {
  const username = String(req.params.username);

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      bio: true,
      createdAt: true,
      following: true,
      followers: true,
    },
  });
  if (!user) return res.status(404).json({ error: "Няма такъв потребител" });

  const posts = await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    include: { author: authorSelect },
  });

  res.json({
    user: {
      id: user.id,
      username: user.username,
      bio: user.bio,
      createdAt: user.createdAt,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    },
    posts,
  });
});

// POST /api/users/:id/follow — toggle
router.post("/:id/follow", requireAuth, async (req, res) => {
  const targetId = String(req.params.id);
  const myId = req.userId!;

  if (targetId === myId) {
    return res.status(400).json({ error: "Не можеш да следваш себе си" });
  }

  const [me, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: myId } }),
    prisma.user.findUnique({ where: { id: targetId } }),
  ]);
  if (!me || !target) return res.status(404).json({ error: "Няма такъв потребител" });

  const isFollowing = me.following.includes(targetId);

  // dvete strani na relaciyata se pishat zaedno:
  // moeto "following" i negovoto "followers"
  await Promise.all([
    prisma.user.update({
      where: { id: myId },
      data: {
        following: isFollowing
          ? me.following.filter((id) => id !== targetId)
          : [...me.following, targetId],
      },
    }),
    prisma.user.update({
      where: { id: targetId },
      data: {
        followers: isFollowing
          ? target.followers.filter((id) => id !== myId)
          : [...target.followers, myId],
      },
    }),
  ]);

  res.json({ following: !isFollowing });
});

export default router;
