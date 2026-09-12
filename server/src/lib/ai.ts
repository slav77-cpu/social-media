import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// Klientut se suzdava chak pri purva upotreba (lazy).
// Taka lipsvasht klyuch ne sriva celiya survur pri start.
let client: GoogleGenAI | null = null;

function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return client;
}

export interface Moderation {
  allowed: boolean;
  reason: string;
}

/**
 * Pita AI dali komentarut e podhodyasht.
 *
 * VAJNO: ako AI-yat ne otgovori (padnal, bavi, izcherpan limit),
 * ne blokirame potrebitelya — propuskame komentara i logvame.
 * Tova se kazva "fail-open": udobstvoto pobezhdava, zashtoto
 * tuk stava duma za uchtivost, ne za sigurnost.
 * (Pri parola bi bilo obratnoto — "fail-closed".)
 */
export async function moderateComment(text: string): Promise<Moderation> {
  if (!process.env.GEMINI_API_KEY) {
    return { allowed: true, reason: "AI moderaciyata e izklyuchena" };
  }

  const prompt = `Ти си модератор на българска социална мрежа за автомобили.
Реши дали следният коментар може да бъде публикуван.

Блокирай само ако съдържа: обиди към човек, реч на омразата, заплахи,
явен спам или реклама, или лични данни (телефон, адрес, ЕГН).
Критиката на кола, спор по темата и лек сарказъм СА позволени.

Отговори само с JSON, без друг текст, в този формат:
{"allowed": true/false, "reason": "кратка причина на български"}

Коментар: """${text}"""`;

  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const raw = (response.text ?? "").trim();
    // modelut ponyakoga vrushta JSON v ```json ... ``` blokche
    const json = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(json) as Moderation;

    return {
      allowed: Boolean(parsed.allowed),
      reason: parsed.reason || "",
    };
  } catch (err) {
    console.error("AI moderation failed:", err);
    return { allowed: true, reason: "AI ne otgovori — propusnato" };
  }
}
