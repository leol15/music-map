const express = require('express');
const { getLLMProvider } = require('../providers/llm');

const router = express.Router();

const MOCK_SONGS = [
  { title: 'Gymnopédie No. 1', artist: 'Erik Satie' },
  { title: 'Weightless', artist: 'Marconi Union' },
  { title: 'Experience', artist: 'Ludovico Einaudi' },
  { title: 'Avril 14th', artist: 'Aphex Twin' },
  { title: 'A Walk', artist: 'Tycho' },
  { title: 'Sweden', artist: 'C418' },
  { title: 'River Flows in You', artist: 'Yiruma' },
  { title: 'Clair de Lune', artist: 'Claude Debussy' },
  { title: 'Snowman', artist: 'WYS' },
  { title: 'Spiegel im Spiegel', artist: 'Arvo Pärt' },
];

const VALID_COUNTS = [10, 20, 50];

router.post('/', async (req, res) => {
  const { prompt, count } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const songCount = VALID_COUNTS.includes(count) ? count : 10;

  try {
    if (process.env.MOCK_RECOMMENDATIONS === 'true') {
      console.log('[recommend] using mock songs (MOCK_RECOMMENDATIONS=true)');
      return res.json({ songs: MOCK_SONGS.slice(0, songCount) });
    }
    const songs = await getLLMProvider().recommendSongs(prompt.trim(), songCount);
    res.json({ songs });
  } catch (err) {
    console.error('recommend error:', err.message);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

module.exports = router;
