const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const LLMProvider = require('./base');

const PROMPT_PREFIX = `Return ONLY a JSON array of song recommendations. No explanation, no markdown, raw JSON only.
Each item must have exactly two fields: "title" and "artist".
Example: [{"title":"Blinding Lights","artist":"The Weeknd"}]

Music request:`;

/**
 * Extract a JSON array from CLI output.
 * Handles --output-format json envelope, markdown fences, or raw JSON.
 */
function extractJSON(raw) {
  const text = raw.trim();

  // --output-format json wraps the response: {"type":"response","content":"..."}
  // Pull the content field and recurse
  try {
    const envelope = JSON.parse(text);
    if (envelope?.response) return extractJSON(envelope.response);
    if (envelope?.content) return extractJSON(envelope.content);
    if (Array.isArray(envelope)) return envelope; // already the songs array
  } catch {}

  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return JSON.parse(fenced[1].trim());

  // Find first [ ... ] block
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1) return JSON.parse(text.slice(start, end + 1));

  throw new Error(`Could not extract JSON array from CLI output. Raw (first 500 chars): ${text.slice(0, 500)}`);
}

/**
 * Spawn a CLI process, write prompt to stdin, resolve with stdout.
 */
function runCLI(command, args, input, timeoutMs, cwd) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], cwd });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', chunk => (stdout += chunk));
    proc.stderr.on('data', chunk => (stderr += chunk));

    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error(`CLI timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`CLI exited with code ${code}: ${stderr.trim()}`));
      else resolve(stdout);
    });

    proc.on('error', err => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn "${command}": ${err.message}`));
    });

    if (input) {
      proc.stdin.write(input);
      proc.stdin.end();
    }
  });
}

class GeminiCLIProvider extends LLMProvider {
  constructor() {
    super();
    this.command = process.env.GEMINI_CLI_CMD || 'gemini';
    this.maxSongs = parseInt(process.env.RECOMMENDATION_COUNT || '10', 10);
    this.timeoutMs = parseInt(process.env.GEMINI_CLI_TIMEOUT_MS || '30000', 10);
    this.cwd = this._initWorkDir();
  }

  _initWorkDir() {
    // Isolated directory so the CLI has no project files to read.
    // .gemini/settings.json with coreTools:[] disables all built-in tools.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'music-map-gemini-'));
    const geminiDir = path.join(dir, '.gemini');
    fs.mkdirSync(geminiDir);
    fs.writeFileSync(
      path.join(geminiDir, 'settings.json'),
      JSON.stringify({ coreTools: [] })
    );
    console.log(`[gemini-cli] working dir: ${dir}`);
    return dir;
  }

  async recommendSongs(prompt, count = this.maxSongs) {
    console.log(`[gemini-cli] requesting ${count} recommendations for: "${prompt}"`);
    const fullPrompt = `${PROMPT_PREFIX} "${prompt}"\n\nReturn exactly ${count} songs.`;

    const stdout = await runCLI(
      this.command,
      ['-p', fullPrompt, '--output-format', 'json', '--approval-mode', 'yolo'],
      null,
      this.timeoutMs,
      this.cwd
    );
    console.log(`[gemini-cli] raw stdout (${stdout.length} chars):\n${stdout}`);
    const songs = extractJSON(stdout);
    console.log(`[gemini-cli] received ${songs.length} recommendations`);
    return songs;
  }
}

module.exports = GeminiCLIProvider;
