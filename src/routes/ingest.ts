import { Router, Request, Response, NextFunction } from 'express';
import Web3 from 'web3';
import { WEB3_PROVIDER_URL } from '../config/env.js';
import { getTransactions } from '../services/IngestionService.js';
import {saveGraph} from "../services/graphService.js";

const web3 = new Web3(WEB3_PROVIDER_URL);
const router = Router();

// POST /ingest
router.post(
    '/',
    async (
        req: Request<{}, unknown, { addresses: string[]; fromBlock?: number; toBlock?: number }>,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { addresses, fromBlock, toBlock } = req.body;
            if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
                res.status(400).json({ error: 'addresses must be a non-empty array' });
                return;
            }

            const latest = await web3.eth.getBlockNumber();
            const end = toBlock ?? Number(latest);
            const start = fromBlock ?? Math.max(0, end - 1000);

            const transactions = await getTransactions(addresses, start, end);

            // --- Зберігаємо граф у Neo4j ---
            await saveGraph(transactions);

            res.json({ count: transactions.length, fromBlock: start, toBlock: end, transactions });
        } catch (err) {
            console.error('[/ingest] error:', err);
            next(err);
        }
    }
);

export default router;