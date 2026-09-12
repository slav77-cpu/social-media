import "dotenv/config";
import express from "express";
import authRouter from "./routes/auth";
import postsRouter from "./routes/post";
import usersRouter from "./routes/user";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/users", usersRouter);

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