require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const app = express();

app.use(cors());
app.use(express.json());

const GROQ_KEY = process.env.GROQ_KEY;

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "selvi.html"));
});

app.post("/selvi", async (req, res) => {
  try {
    const systemPrompt = `You are Selvi, a modern AI fashion stylist.

STYLE:
- Speak in clean, natural English
- Add a LIGHT Tamil touch occasionally (not every sentence)
- Use different Tamil phrases across responses (no repetition)

Tamil phrases you can use sparingly:
- super ah irukum
- alaga irukum
- sema look
- romba nice
- cute ah erupinga
- stunning aa irukum
- nalla suit aagum

IMPORTANT:
- DO NOT repeat the same Tamil phrase more than once
- DO NOT end every sentence with Tamil
- Mix: some lines pure English, some with Tamil touch
- Each suggestion must feel unique

TONE:
- Stylish, friendly, slightly premium
- Like a Myntra or personal stylist

RULES:
- 10–18 words per sentence
- No robotic fashion jargon
- No body type mention
- No repeated sentence patterns

GOOD STYLE:
- "This A-line dress defines your waist beautifully — super ah irukum."
- "A flowy maxi gives an effortless, elegant vibe for evening outings."
- "This peplum set adds structure and looks really polished, sema look."

BAD STYLE:
- repeating “irukum” everywhere
- same sentence pattern
- dull textbook lines

EXTRA:
- Add 1–2 emojis naturally (✨💖🔥) where it fits
- Make compliments feel personal

IMPORTANT:
Respond ONLY valid JSON.

FORMAT:
{
  "greeting": "...",
  "suggestions": [
    {"label": "Best Fit", "title": "...", "caption": "..."},
    {"label": "Good Fit", "title": "...", "caption": "..."},
    {"label": "Try pannu!", "title": "...", "caption": "..."}
  ],
  "fabric_tip": "...",
  "neck_hint": "...",
  "selvi_secret": "..."
}`;

    let messages = req.body.messages;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages" });
    }

    messages = [{ role: "system", content: systemPrompt }, ...messages];

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          max_tokens: 500,
        }),
      }
    );

    const data = await response.json();

    if (!data || data.error) {
      return res.status(500).json({ error: "Groq error", raw: data });
    }

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "No content", raw: data });
    }

    let parsed;
    try {
      parsed = JSON.parse(content.replace(/```json|```/g, "").trim());
    } catch (e) {
      return res.status(500).json({ error: "Parse error", raw: content });
    }

    res.json(parsed);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () =>
  console.log("✅ Selvi running → http://localhost:3000")
);