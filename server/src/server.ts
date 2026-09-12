import "dotenv/config";
import express from "express";
import authRouter from "./routes/auth";
import postsRouter from "./routes/post";
import usersRouter from "./routes/user";
import uploadRouter from "./routes/upload";
import aiRouter from "./routes/ai";
import path from "node:path";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/users", usersRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/ai", aiRouter);

// kachenite snimki se servirat kato statichni faylove
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Neshto se obarka na survura" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});