import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getHighlights } from './controllers/main.js';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.set('trust proxy', 1);

const highlightsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Rate limit exceeded. Try again later.' }
});

app.use(highlightsLimiter)

app.post('/api/highlights', highlightsLimiter, getHighlights);

app.listen(PORT, () => {
  console.log(`BrightNote API server running on port ${PORT}`);
});
