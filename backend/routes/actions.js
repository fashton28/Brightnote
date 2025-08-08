import express from 'express'
import { getHighlights } from './controllers/main.js';


const router = express.Router();
//Will add specific routes for the api with more functionalities soon.
router.post("/extract", getHighlights);

export default router;