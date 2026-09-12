import { prisma } from "../db";
import type { NotificationType } from "@prisma/client";

interface NotifyInput {
  userId: string;      // kogo uvedomyavame
  actorId: string;     // koy e napravil deystvieto
  type: NotificationType;
  postId?: string;
  excerpt?: string;
}

/**
 * Suzdava izvestie.
 *
 * Dve pravila:
 * 1. Ne se uvedomyavame sami sebe si (layk na sobstven post).
 * 2. Greshka tuk NIKOGA ne provalya osnovnoto deystvie —
 *    po-dobre bez izvestie, otkolkoto neuspyal layk.
 */
export async function notify({ userId, actorId, type, postId, excerpt }: NotifyInput) {
  if (userId === actorId) return;

  try {
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { username: true, avatarUrl: true },
    });
    if (!actor) return;

    await prisma.notification.create({
      data: {
        userId,
        actorId,
        actorName: actor.username,
        actorAvatar: actor.avatarUrl,
        type,
        postId,
        excerpt: excerpt?.slice(0, 80), // pazim samo nachaloto
      },
    });
  } catch (err) {
    console.error("notify failed:", err);
  }
}
