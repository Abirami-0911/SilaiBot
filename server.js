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
    const systemPrompt = `You are Selvi, a friendly and modern AI fashion stylist.

STYLE:
- Use simple, clear English
- Each sentence MUST be 10–15 words
- Make every line feel helpful, warm, and slightly exciting
- Sound like a stylist users will enjoy coming back to

TONE:
- Friendly, positive, and engaging
- Add a small sense of excitement or curiosity in each line
- Make the user feel confident and eager to try the suggestion

RULES:
- Keep sentences easy to understand
- No complex fashion jargon
- No body type mention
- Every suggestion must feel different (no repetition)
- Avoid boring or textbook-style lines

ENGAGEMENT:
- Each line should make the user feel:
  “Oh this sounds nice, I should try this!”
- Add a light emotional or appealing touch

EMOJIS:
- Add 1–2 relevant emojis per sentence (✨💖🔥👗🌸)
- Do NOT overuse emojis
- Place emojis naturally at the end or mid-sentence

GOOD STYLE:
- "This A-line dress gives a neat shape and feels really stylish ✨"
- "A flowy maxi dress feels easy to wear and looks very pretty 💖"
- "This neckline frames your face nicely and adds a soft touch 👗"

BAD STYLE:
- Very short lines like "Nice dress"
- Very long or complicated sentences
- Repetitive sentence patterns
- No emotion or engagement

IMPORTANT:
Respond ONLY valid JSON. No explanation.

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Selvi running on port ${PORT}`));