import path from "node:path";
import fs from "node:fs/promises";
import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { suggestCaption } from "../lib/ai";

const router = Router();

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// POST /api/ai/caption  { imageUrl: "/uploads/abc.jpg" }
router.post("/caption", requireAuth, async (req, res) => {
  const { imageUrl } = req.body as { imageUrl?: string };

  if (!imageUrl || !imageUrl.startsWith("/uploads/")) {
    return res.status(400).json({ error: "Липсва валиден адрес на снимка" });
  }

  // ZASHTITA: potrebitelyat podava puteka. Vzimame samo imeto na faila
  // i go lepim kum nashata papka — taka "../../.env" nyama kak da izleze navun.
  const filename = path.basename(imageUrl);
  const filePath = path.join(UPLOAD_DIR, filename);

  const ext = path.extname(filename).toLowerCase();
  const mimeType = MIME[ext];
  if (!mimeType) {
    return res.status(400).json({ error: "Неподдържан формат" });
  }

  try {
    const buffer = await fs.readFile(filePath);
    const result = await suggestCaption(buffer.toString("base64"), mimeType);
    res.json(result);
  } catch (err) {
    console.error("AI caption failed:", err);
    res.status(503).json({ error: "AI не успя да опише снимката. Опитай пак." });
  }
});

export default router;
