import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { resetDb, makeUser } from "./helpers";

beforeEach(resetDb);

/** Pomoshtnik: Ivan publikuva post s dadena vidimost. */
async function postAs(token: string, caption: string, visibility?: string) {
  const res = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({ caption, visibility });
  return res.body;
}

describe("видимост на постовете", () => {
  it("анонимен вижда само публичните", async () => {
    const ivan = await makeUser("ivan");
    await postAs(ivan.token, "Публичен пост");
    await postAs(ivan.token, "Само за последователи", "FOLLOWERS");

    const res = await request(app).get("/api/posts");

    expect(res.body).toHaveLength(1);
    expect(res.body[0].caption).toBe("Публичен пост");
  });

  it("нелогнат потребител не вижда чужд FOLLOWERS пост", async () => {
    const ivan = await makeUser("ivan");
    const petar = await makeUser("petar");
    await postAs(ivan.token, "Само за последователи", "FOLLOWERS");

    const res = await request(app)
      .get("/api/posts")
      .set("Authorization", `Bearer ${petar.token}`);

    expect(res.body).toHaveLength(0);
  });

  it("последовател вижда FOLLOWERS поста", async () => {
    const ivan = await makeUser("ivan");
    const petar = await makeUser("petar");
    await postAs(ivan.token, "Само за последователи", "FOLLOWERS");

    // Petar zapochva da sledva Ivan
    await request(app)
      .post(`/api/users/${ivan.id}/follow`)
      .set("Authorization", `Bearer ${petar.token}`);

    const res = await request(app)
      .get("/api/posts")
      .set("Authorization", `Bearer ${petar.token}`);

    expect(res.body).toHaveLength(1);
  });

  it("авторът винаги вижда собствения си скрит пост", async () => {
    const ivan = await makeUser("ivan");
    await postAs(ivan.token, "Само за последователи", "FOLLOWERS");

    const res = await request(app)
      .get("/api/posts")
      .set("Authorization", `Bearer ${ivan.token}`);

    expect(res.body).toHaveLength(1);
  });

  it("стената в профила крие FOLLOWERS постовете от непознат", async () => {
    const ivan = await makeUser("ivan");
    const petar = await makeUser("petar");
    await postAs(ivan.token, "Публичен пост");
    await postAs(ivan.token, "Скрит пост", "FOLLOWERS");

    const res = await request(app)
      .get("/api/users/ivan")
      .set("Authorization", `Bearer ${petar.token}`);

    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].caption).toBe("Публичен пост");
  });
});

describe("GET /api/posts/:id", () => {
  it("публичен пост се вижда от всеки", async () => {
    const ivan = await makeUser("ivan");
    const post = await postAs(ivan.token, "Публичен пост");

    const res = await request(app).get(`/api/posts/${post.id}`);

    expect(res.status).toBe(200);
    expect(res.body.caption).toBe("Публичен пост");
  });

  it("FOLLOWERS пост е скрит от непознат, дори когато знае ID-то", async () => {
    const ivan = await makeUser("ivan");
    const petar = await makeUser("petar");
    const post = await postAs(ivan.token, "Скрит пост", "FOLLOWERS");

    const res = await request(app)
      .get(`/api/posts/${post.id}`)
      .set("Authorization", `Bearer ${petar.token}`);

    expect(res.status).toBe(404);
  });

  it("последовател отваря FOLLOWERS поста от известието", async () => {
    const ivan = await makeUser("ivan");
    const petar = await makeUser("petar");
    const post = await postAs(ivan.token, "Скрит пост", "FOLLOWERS");

    await request(app)
      .post(`/api/users/${ivan.id}/follow`)
      .set("Authorization", `Bearer ${petar.token}`);

    const res = await request(app)
      .get(`/api/posts/${post.id}`)
      .set("Authorization", `Bearer ${petar.token}`);

    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/posts/:id", () => {
  it("авторът редактира описанието", async () => {
    const ivan = await makeUser("ivan");
    const post = await postAs(ivan.token, "Старо описание");

    const res = await request(app)
      .patch(`/api/posts/${post.id}`)
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ caption: "Ново описание" });

    expect(res.status).toBe(200);
    expect(res.body.caption).toBe("Ново описание");
    expect(res.body.editedAt).toBeTruthy();
  });

  it("чужд потребител НЕ може да редактира", async () => {
    const ivan = await makeUser("ivan");
    const petar = await makeUser("petar");
    const post = await postAs(ivan.token, "На Иван");

    const res = await request(app)
      .patch(`/api/posts/${post.id}`)
      .set("Authorization", `Bearer ${petar.token}`)
      .send({ caption: "Хакнато" });

    expect(res.status).toBe(403);
  });

  it("сменя видимостта", async () => {
    const ivan = await makeUser("ivan");
    const post = await postAs(ivan.token, "Публичен засега");

    const res = await request(app)
      .patch(`/api/posts/${post.id}`)
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ visibility: "FOLLOWERS" });

    expect(res.body.visibility).toBe("FOLLOWERS");
  });
});

describe("PATCH /api/users/me", () => {
  it("сменя аватар и био", async () => {
    const ivan = await makeUser("ivan");

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ avatarUrl: "/uploads/avatar.jpg", bio: "Обичам стари BMW-та" });

    expect(res.status).toBe(200);
    expect(res.body.avatarUrl).toBe("/uploads/avatar.jpg");
    expect(res.body.bio).toBe("Обичам стари BMW-та");
  });

  it("отказва външен адрес за аватар", async () => {
    const ivan = await makeUser("ivan");

    const res = await request(app)
      .patch("/api/users/me")
      .set("Authorization", `Bearer ${ivan.token}`)
      .send({ avatarUrl: "https://zlonameren-sait.com/kartinka.jpg" });

    expect(res.status).toBe(400);
  });
});
