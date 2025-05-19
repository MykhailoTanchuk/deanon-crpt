import express from 'express';
import { PORT } from './config/env.js';
import analyzeRouter from './routes/analyze.js';

const app = express();
app.use(express.json());
app.use('/analyze', analyzeRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
