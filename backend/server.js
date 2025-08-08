import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getHighlights } from './controllers/main.js';
import {router} from './routes/actions.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.post('/api/highlights', router);

app.listen(PORT, () => {
  console.log(`BrightNote API server running on port ${PORT}`);
});
