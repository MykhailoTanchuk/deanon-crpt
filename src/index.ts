// src/index.ts
import express from 'express';
import routes from './routes/index.js';
import { PORT } from './config/env.js';

const app = express();
app.use(express.json());

// Єдиний імпорт маршруту
app.use('/', routes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
