import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { resetDb } from "./helpers";

// Predi VSEKI test chistim bazata — vseki test zapochva
// ot edna i sushta izvestna tochka. Inache vtoriyat test shte padne
// samo zashtoto purviyat e ostavil danni.
beforeEach(resetDb);

describe("POST /api/auth/register", () => {
  it("създава потребител и връща токен", async () => {
    // Arrange + Act
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "ivan", password: "123456" });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe("ivan");
    // parolata NIKOGA ne se vrushta
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("отказва кратка парола", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "ivan", password: "123" });

    expect(res.status).toBe(400);
  });

  it("отказва заето потребителско име", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ username: "ivan", password: "123456" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "ivan", password: "654321" });

    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ username: "ivan", password: "123456" });
  });

  it("влиза с вярна парола", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "ivan", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it("отказва грешна парола", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "ivan", password: "greshna" });

    expect(res.status).toBe(401);
  });

  it("не издава дали потребителят съществува", async () => {
    const wrongPass = await request(app)
      .post("/api/auth/login")
      .send({ username: "ivan", password: "greshna" });

    const noUser = await request(app)
      .post("/api/auth/login")
      .send({ username: "nyama-takuv", password: "greshna" });

    // dvata sluchaya dават edno i sushto — bez user enumeration
    expect(noUser.status).toBe(wrongPass.status);
    expect(noUser.body.error).toBe(wrongPass.body.error);
  });
});
