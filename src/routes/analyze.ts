import { Router } from 'express';
const router = Router();

router.post('/', async (req, res) => {
    const { addresses, fromBlock, toBlock } = req.body;
    // TODO: виклик ingestion → graph → heuristics → повернути результат
    res.json({ message: 'Аналіз ще не реалізовано', addresses, fromBlock, toBlock });
});

export default router;
