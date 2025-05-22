import { Router } from 'express';
import ingestRouter from './ingest.js';
import analyzeRouter from './analyze.js';
import graphRouter from './graph.js';
import clustersRouter from "./clusters.js";

const router = Router();

// Додаємо нові маршрути сюди
router.use('/ingest', ingestRouter);
router.use('/analyze', analyzeRouter);
router.use('/graph', graphRouter);
router.use('/clusters', clustersRouter);

export default router;