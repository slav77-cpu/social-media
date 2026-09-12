import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../db";
import { resetDb, makeUser } from "./helpers";

beforeEach(resetDb);

describe("POST /api/posts", () => {
  it("създава пост на логнат потребител", async () => {
    const ivan = await makeUser("ivan");

    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ caption: "Моята кола" });

    expect(res.status).toBe(201);
    expect(res.body.caption).toBe("Моята кола");
    expect(res.body.author.username).toBe("ivan");
    // avtorut se vzima ot tokena, ne ot tyaloto
    expect(res.body.authorId).toBe(ivan.id);
  });

  it("отказва без токен", async () => {
    const res = await request(app).post("/api/posts").send({ caption: "Анонимно" });
    expect(res.status).toBe(401);
  });

  it("не позволява да се подправи авторът", async () => {
    const ivan = await makeUser("ivan");
    const petar = await makeUser("petar");

    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ caption: "Опит за измама", authorId: petar.id });

    expect(res.status).toBe(201);
    // vupreki che podadohme chuzhdo authorId, postut e na Ivan
    expect(res.body.authorId).toBe(ivan.id);
  });
});

describe("DELETE /api/posts/:id", () => {
  it("авторът може да изтрие своя пост", async () => {
    const ivan = await makeUser("ivan");
    const created = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ caption: "За триене" });

    const res = await request(app)
      .delete(`/api/posts/${created.body.id}`)
      .set("Authorization", `Bearer ${ivan.token}`);

    expect(res.status).toBe(204);
    expect(await prisma.post.count()).toBe(0);
  });

  it("чужд потребител НЕ може да изтрие поста", async () => {
    const ivan = await makeUser("ivan");
    const petar = await makeUser("petar");

    const created = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ caption: "На Иван" });

    const res = await request(app)
      .delete(`/api/posts/${created.body.id}`)
      .set("Authorization", `Bearer ${petar.token}`);

    expect(res.status).toBe(403);
    expect(await prisma.post.count()).toBe(1); // postut e na myastoto si
  });
});

describe("POST /api/posts/:id/like", () => {
  it("харесва и отхаресва", async () => {
    const ivan = await makeUser("ivan");
    const created = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ caption: "Харесай ме" });

    const liked = await request(app)
      .post(`/api/posts/${created.body.id}/like`)
      .set("Authorization", `Bearer ${ivan.token}`);
    expect(liked.body.likedBy).toHaveLength(1);

    const unliked = await request(app)
      .post(`/api/posts/${created.body.id}/like`)
      .set("Authorization", `Bearer ${ivan.token}`);
    expect(unliked.body.likedBy).toHaveLength(0);
  });

  it("не дублира харесване при двама души", async () => {
    const ivan = await makeUser("ivan");
    const petar = await makeUser("petar");
    const created = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ caption: "Общ пост" });

    await request(app)
      .post(`/api/posts/${created.body.id}/like`)
      .set("Authorization", `Bearer ${ivan.token}`);
    const second = await request(app)
      .post(`/api/posts/${created.body.id}/like`)
      .set("Authorization", `Bearer ${petar.token}`);

    expect(second.body.likedBy).toHaveLength(2);
  });
});

describe("GET /api/posts", () => {
  it("връща постовете от най-нов към най-стар", async () => {
    const ivan = await makeUser("ivan");

    await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ caption: "Първи" });
    await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ caption: "Втори" });

    const res = await request(app).get("/api/posts");

    expect(res.status).toBe(200);
    expect(res.body[0].caption).toBe("Втори");
  });

  it("уважава ?take", async () => {
    const ivan = await makeUser("ivan");
    // vnimanie: opisanieto tryabva da e nad 2 znaka, inache validaciyata go otkazva
    for (const caption of ["Пост 1", "Пост 2", "Пост 3"]) {
      await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${ivan.token}`)
        .send({ caption });
    }

    const res = await request(app).get("/api/posts?take=2");
    expect(res.body).toHaveLength(2);
  });
});
