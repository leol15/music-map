require('dotenv').config();
const express = require('express');
const cors = require('cors');
const recommendRouter = require('./routes/recommend');
const playlistRouter = require('./routes/playlist');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman) in dev
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
}));

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/recommend', recommendRouter);
app.use('/playlist', playlistRouter);

app.listen(PORT, () => console.log(`music-map backend running on port ${PORT}`));
