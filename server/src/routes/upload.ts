import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true }); // sazdava papkata, ako q nyama

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // NIKOGA ne polzvame originalnoto ime na faila:
    // potrebitelyat go kontrolira i moje da e "../../server.ts"
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB — inache nyakoy shte kachi film
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error("Разрешени са само снимки (jpg, png, webp, gif)"));
    }
    cb(null, true);
  },
});

// POST /api/upload  (multipart/form-data, pole "image")
router.post("/", requireAuth, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      // multer hvurlya i pri prekalen razmer — prevejdame na chovешки
      const message =
        err.message === "File too large"
          ? "Файлът е по-голям от 5 MB"
          : err.message;
      return res.status(400).json({ error: message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Няма изпратен файл" });
    }

    // vrushtame publichniya URL, a ne putya na diska
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

export default router;
