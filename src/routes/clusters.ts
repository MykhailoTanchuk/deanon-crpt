import { Router, Request, Response, NextFunction } from 'express';
import Web3 from 'web3';
import { WEB3_PROVIDER_URL } from '../config/env.js';
import { commonInput, changeAddress, labelClusters } from '../services/clusterService.js';
import {getTransactions} from "../services/IngestionService.js";

const web3 = new Web3(WEB3_PROVIDER_URL);
const router = Router();

// POST /clusters/:address
router.post(
    '/:address',
    async (
        req: Request<{ address: string }, unknown, { fromBlock?: number; toBlock?: number }>,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { address } = req.params;
            const { fromBlock, toBlock } = req.body;

            if (!address) {
                res.status(400).json({ error: 'Address parameter is required' });
                return;
            }

            // Отримати поточний номер блоку
            const latest = await web3.eth.getBlockNumber();
            const end = toBlock ?? Number(latest);
            const start = fromBlock ?? Math.max(0, end - 1000);

            // Збір транзакцій для заданої адреси
            const transactions = await getTransactions([address], start, end);

            // Евристики кластеризації
            const commonClusters = commonInput(transactions);
            const changeClusters = changeAddress(transactions);
            const allClusters = [...commonClusters, ...changeClusters];

            // Зберігаємо мітки в Neo4j
            if (allClusters.length > 0) {
                await labelClusters(allClusters);
            }

            res.json({ address, fromBlock: start, toBlock: end, clusters: allClusters });
        } catch (err) {
            console.error('[/clusters] error:', err);
            next(err);
        }
    }
);

export default router;
