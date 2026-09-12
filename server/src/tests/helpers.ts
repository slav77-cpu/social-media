import request from "supertest";
import { app } from "../app";
import { prisma } from "../db";

/**
 * Chisti testovata baza.
 * VAJEN RED: purvo decata (Post), posle roditelite (User) —
 * inache Prisma otkazva, zashtoto postut sochi kum avtor.
 */
export async function resetDb() {
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
}

/** Suzdava potrebitel i vrushta tokena i id-to mu. */
export async function makeUser(username: string) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ username, password: "123456" });
  return { token: res.body.token as string, id: res.body.user.id as string };
}
