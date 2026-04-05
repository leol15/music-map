import { useState } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STEPS = { IDLE: 'idle', RECOMMENDING: 'recommending', CREATING: 'creating', DONE: 'done' };

export default function App() {
  const [prompt, setPrompt] = useState('');
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
      // Step 1: get recommendations from Claude
      const recRes = await fetch(`${API_BASE}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!recRes.ok) throw new Error('Failed to get recommendations');
      const { songs: recommended } = await recRes.json();
      setSongs(recommended);

      // Step 2: create Spotify playlist
      setStep(STEPS.CREATING);
      const plRes = await fetch(`${API_BASE}/playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songs: recommended, prompt }),
      });
      if (!plRes.ok) throw new Error('Failed to create playlist');
      const { url } = await plRes.json();
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
        <p>Describe the music you want and get an instant Spotify playlist.</p>
      </header>

      <form onSubmit={handleSubmit} className="search-form">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. upbeat songs for a morning run, late night lo-fi study vibes, 90s indie rock..."
          rows={3}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !prompt.trim()}>
          {isLoading ? statusLabel(step) : 'Generate Playlist'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {songs.length > 0 && (
        <section className="results">
          <h2>Recommended Songs</h2>
          <ol className="song-list">
            {songs.map((s, i) => (
              <li key={i}>
                <span className="title">{s.title}</span>
                <span className="artist">{s.artist}</span>
              </li>
            ))}
          </ol>

          {step === STEPS.CREATING && (
            <p className="status">Creating your Spotify playlist...</p>
          )}

          {playlistUrl && (
            <a className="playlist-btn" href={playlistUrl} target="_blank" rel="noreferrer">
              Open Playlist on Spotify
            </a>
          )}
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
