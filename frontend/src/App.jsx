import { useState } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const COUNTS = [10, 20, 50];
const STEPS = { IDLE: 'idle', RECOMMENDING: 'recommending', CREATING: 'creating', DONE: 'done' };

const SpotifyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(10);
  const [step, setStep] = useState(STEPS.IDLE);
  const [songs, setSongs] = useState([]);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim()) return;

    setError('');
    setSongs([]);
    setPlaylistUrl('');
    setStep(STEPS.RECOMMENDING);

    try {
      const recRes = await fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, count }),
      });
      if (!recRes.ok) throw new Error('Failed to get recommendations');
      const { songs: recommended } = await recRes.json();
      setSongs(recommended);

      setStep(STEPS.CREATING);
      const plRes = await fetch(`${API_BASE}/playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songs: recommended, prompt }),
      });
      if (!plRes.ok) throw new Error('Failed to create playlist');
      const { url, tracks } = await plRes.json();

      // Merge Spotify URLs into the song list
      setSongs(prev => prev.map((s, i) => ({ ...s, spotifyUrl: tracks?.[i]?.spotifyUrl ?? null })));
      setPlaylistUrl(url);
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.IDLE);
    }
  }

  const isLoading = step === STEPS.RECOMMENDING || step === STEPS.CREATING;

  return (
    <div className="app">
      <header>
        <h1>Music Map</h1>
        <p>Describe your mood or vibe and get a Spotify playlist instantly.</p>
      </header>

      <form onSubmit={handleSubmit} className="search-form">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. upbeat songs for a morning run, late night lo-fi, 90s indie rock..."
          rows={3}
          disabled={isLoading}
        />

        <div className="form-footer">
          <div className="count-picker">
            {COUNTS.map(n => (
              <button
                key={n}
                type="button"
                className={`count-btn ${count === n ? 'active' : ''}`}
                onClick={() => setCount(n)}
                disabled={isLoading}
              >
                {n}
              </button>
            ))}
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading || !prompt.trim()}>
            {isLoading ? statusLabel(step) : 'Generate'}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {songs.length > 0 && (
        <section className="results">
          <div className="results-header">
            <span className="results-label">{songs.length} songs</span>
            {playlistUrl && (
              <a className="playlist-btn" href={playlistUrl} target="_blank" rel="noreferrer">
                <SpotifyIcon /> Open Playlist
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
                {s.spotifyUrl && (
                  <a className="song-link" href={s.spotifyUrl} target="_blank" rel="noreferrer" title="Open on Spotify">
                    <SpotifyIcon />
                  </a>
                )}
                {step === STEPS.CREATING && !s.spotifyUrl && (
                  <span className="song-link-placeholder" />
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function statusLabel(step) {
  if (step === STEPS.RECOMMENDING) return 'Finding songs...';
  if (step === STEPS.CREATING) return 'Building playlist...';
  return '...';
}
