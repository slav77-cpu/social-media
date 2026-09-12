import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";
import { optionalAuth } from "../middlewares/optionalAuth";

const router = Router();

const authorSelect = { select: { id: true, username: true, avatarUrl: true } };

// GET /api/users/me — koy sum az (s aktualni spisuci)
router.get("/me", requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      username: true,
      bio: true,
      avatarUrl: true,
      following: true,
      followers: true,
    },
  });
  if (!me) return res.status(404).json({ error: "Потребителят не съществува" });
  res.json(me);
});

// PATCH /api/users/me — smyana na ime, avatar i bio
router.patch("/me", requireAuth, async (req, res) => {
  const { avatarUrl, bio, username } = req.body as {
    avatarUrl?: string | null;
    bio?: string;
    username?: string;
  };

  if (avatarUrl !== undefined && avatarUrl !== null && !avatarUrl.startsWith("/uploads/")) {
    return res.status(400).json({ error: "Невалиден адрес на снимка" });
  }
  if (bio !== undefined && bio.length > 300) {
    return res.status(400).json({ error: "Био-то е твърде дълго (макс. 300 знака)" });
  }
  if (username !== undefined) {
    // samo bukvi, cifri, dolna cherta i tochka — imeto e chast ot URL-a (/u/ime)
    if (!/^[a-zA-Z0-9._]{3,20}$/.test(username)) {
      return res.status(400).json({
        error: "Името трябва да е 3-20 знака: латиница, цифри, точка или долна черта",
      });
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(username !== undefined ? { username } : {}),
      },
      select: { id: true, username: true, bio: true, avatarUrl: true },
    });
    res.json(updated);
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Името е заето" });
    }
    throw err;
  }
});

// GET /api/users/:username — profil + postovete mu
router.get("/:username", optionalAuth, async (req, res) => {
  const username = String(req.params.username);

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      following: true,
      followers: true,
    },
  });
  if (!user) return res.status(404).json({ error: "Няма такъв потребител" });

  // stenata: chuzhdite hora vijdat samo PUBLIC postovete,
  // posledovatelite i sobstvenikut — vsichko
  const viewerId = req.userId;
  const canSeeAll =
    viewerId === user.id || (viewerId ? user.followers.includes(viewerId) : false);

  const posts = await prisma.post.findMany({
    where: canSeeAll ? { authorId: user.id } : { authorId: user.id, visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    include: { author: authorSelect },
  });

  res.json({
    user: {
      id: user.id,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
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
