const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Ask Claude for song recommendations based on a user prompt.
 * Returns an array of { title, artist } objects.
 */
async function recommendSongs(userPrompt) {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a music recommendation assistant. The user wants: "${userPrompt}"

Return ONLY a JSON array of 10 song recommendations. No explanation, no markdown, just the raw JSON array.
Each item must have exactly two fields: "title" and "artist".

Example format:
[{"title":"Blinding Lights","artist":"The Weeknd"},{"title":"Levitating","artist":"Dua Lipa"}]`,
      },
    ],
  });

  const raw = message.content[0].text.trim();
  return JSON.parse(raw);
}

module.exports = { recommendSongs };
