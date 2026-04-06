const Anthropic = require('@anthropic-ai/sdk');
const LLMProvider = require('./base');

const SYSTEM_PROMPT = `You are a music recommendation assistant.
When given a description of music the user wants, return ONLY a JSON array of song recommendations.
No explanation, no markdown — raw JSON only.
Each item must have exactly two fields: "title" and "artist".
Example: [{"title":"Blinding Lights","artist":"The Weeknd"}]`;

class AnthropicProvider extends LLMProvider {
  constructor() {
    super();
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-6';
    this.maxSongs = parseInt(process.env.RECOMMENDATION_COUNT || '10', 10);
  }

  async recommendSongs(prompt, count = this.maxSongs) {
    console.log(`[anthropic] requesting ${count} recommendations for: "${prompt}"`);
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Give me ${count} song recommendations for: "${prompt}"`,
        },
      ],
    });

    const raw = message.content[0].text.trim();
    const songs = JSON.parse(raw);
    console.log(`[anthropic] received ${songs.length} recommendations`);
    return songs;
  }
}

module.exports = AnthropicProvider;
