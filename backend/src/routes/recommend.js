const express = require('express');
const { recommendSongs } = require('../services/claude');

const router = express.Router();

router.post('/', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const songs = await recommendSongs(prompt.trim());
    res.json({ songs });
  } catch (err) {
    console.error('recommend error:', err.message);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

module.exports = router;
