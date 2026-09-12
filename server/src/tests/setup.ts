import "dotenv/config";

// Testovete NIKOGA ne pipat istinskata baza.
// Prenasochvame DATABASE_URL kum otdelna baza "social_test"
// (sushtiya Atlas klustur, drugo ime na bazata).
const url = process.env.DATABASE_URL || "";
if (!url.includes("social_test")) {
  process.env.DATABASE_URL = url.replace(/\/social\?/, "/social_test?");
}

// AI-yat ne se vika v testove: bavno, struva pari i vrushta
// razlichno vseki put (t.e. testut bi bil nestabilen).
process.env.GEMINI_API_KEY = "";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
