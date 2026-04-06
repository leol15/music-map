import { useState } from "react";
import "./App.css";
import History from "./History";
import { useHistory } from "./useHistory";
import ProviderIcon from "./ProviderIcon";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const COUNTS = [10, 20, 50];
const PROVIDERS = [
  { id: "spotify", label: "Spotify" },
  { id: "youtube", label: "YouTube" },
];
const STEPS = {
  IDLE: "idle",
  RECOMMENDING: "recommending",
  CREATING: "creating",
  DONE: "done",
};

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(10);
  const [musicProvider, setMusicProvider] = useState("spotify");
  const [resultProvider, setResultProvider] = useState("spotify");
  const [step, setStep] = useState(STEPS.IDLE);
  const [songs, setSongs] = useState([]);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState("error"); // "error" | "quota"
  const { history, add, remove, clear } = useHistory();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    await generate(prompt, count, musicProvider);
  }

  async function generate(p, c, provider) {
    setError("");
    setErrorKind("error");
    setSongs([]);
    setPlaylistUrl("");
    setStep(STEPS.RECOMMENDING);

    try {
      const recRes = await fetch(`${API_BASE}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, count: c }),
      });
      if (!recRes.ok) throw new Error("Failed to get recommendations");
      const { songs: recommended } = await recRes.json();
      setSongs(recommended);

      setStep(STEPS.CREATING);
      const plRes = await fetch(`${API_BASE}/playlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songs: recommended, prompt: p, provider }),
      });
      if (!plRes.ok) {
        const body = await plRes.json().catch(() => ({}));
        const msg = body.error || "Failed to create playlist";
        if (plRes.status === 429) {
          setErrorKind("quota");
        }
        throw new Error(msg);
      }
      const { url, tracks } = await plRes.json();

      setSongs((prev) =>
        prev.map((s, i) => ({ ...s, trackUrl: tracks?.[i]?.url ?? null }))
      );
      setPlaylistUrl(url);
      setResultProvider(provider);
      setStep(STEPS.DONE);

      add({ prompt: p, count: c, provider, playlistUrl: url });
    } catch (err) {
      setError(err.message);
      setStep(STEPS.IDLE);
    }
  }

  function handleReuse(entry) {
    setPrompt(entry.prompt);
    setCount(entry.count);
    if (entry.provider) setMusicProvider(entry.provider);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isLoading = step === STEPS.RECOMMENDING || step === STEPS.CREATING;

  return (
    <div className="app" data-provider={musicProvider}>
      <header>
        <h1>Music Map</h1>
        <p>Describe your mood or vibe and get a mysterious Spotify playlist~</p>
      </header>

      <form onSubmit={handleSubmit} className="search-form">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. upbeat, morning run, late night lo-fi, 90s indie rock, mellow, rainy..."
          rows={3}
          disabled={isLoading}
        />

        <div className="form-footer">
          <div className="form-options">
            <div className="count-picker">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pill-btn ${count === n ? "active" : ""}`}
                  onClick={() => setCount(n)}
                  disabled={isLoading}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="provider-divider" />

            <div className="provider-picker">
              {PROVIDERS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`pill-btn provider-btn ${musicProvider === id ? "active" : ""}`}
                  onClick={() => setMusicProvider(id)}
                  disabled={isLoading}
                >
                  <ProviderIcon provider={id} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? statusLabel(step) : "Generate"}
          </button>
        </div>
      </form>

      {error && <p className={errorKind === "quota" ? "error error--quota" : "error"}>{error}</p>}

      {songs.length > 0 && (
        <section className="results" data-provider={resultProvider}>
          <div className="results-header">
            <span className="results-label">{songs.length} songs</span>
            {playlistUrl && (
              <a className="playlist-btn" href={playlistUrl} target="_blank" rel="noreferrer">
                <ProviderIcon provider={resultProvider} />
                Open Playlist
              </a>
            )}
          </div>

          <ol className="song-list">
            {songs.map((s, i) => (
              <li key={i} className="song-item">
                <span className="song-index">{i + 1}</span>
                <div className="song-info">
                  <span className="song-title">{s.title}</span>
                  <span className="song-artist">{s.artist}</span>
                </div>
                {s.trackUrl ? (
                  <a className="song-link" href={s.trackUrl} target="_blank" rel="noreferrer" title={`Open on ${resultProvider}`}>
                    <ProviderIcon provider={resultProvider} />
                  </a>
                ) : (
                  step === STEPS.CREATING && <span className="song-link-placeholder" />
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <History
        history={history}
        onReuse={handleReuse}
        onRemove={remove}
        onClear={clear}
      />
    </div>
  );
}

function statusLabel(step) {
  if (step === STEPS.RECOMMENDING) return "Finding songs...";
  if (step === STEPS.CREATING) return "Building playlist...";
  return "...";
}
