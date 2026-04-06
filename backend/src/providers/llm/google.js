const { GoogleGenAI } = require("@google/genai");
const LLMProvider = require("./base");

const SYSTEM_INSTRUCTION = `You are a music recommendation assistant.
When given a description of music the user wants, return ONLY a JSON array of song recommendations.
No explanation, no markdown — raw JSON only.
Each item must have exactly two fields: "title" and "artist".
Example: [{"title":"Blinding Lights","artist":"The Weeknd"}]`;

class GoogleProvider extends LLMProvider {
  constructor() {
    super();
    this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    this.model = process.env.GOOGLE_MODEL || "gemini-3.1-flash-lite-preview";
  }

  async recommendSongs(prompt, count = 10) {
    console.log(
      `[google] requesting ${count} recommendations for: "${prompt}"`
    );

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: `Give me ${count} song recommendations for: "${prompt}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1,
      },
    });

    const songs = JSON.parse(response.text);
    console.log(`[google] received ${songs.length} recommendations`);
    return songs;
  }
}

module.exports = GoogleProvider;
