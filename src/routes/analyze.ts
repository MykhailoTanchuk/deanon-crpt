import { Router, Request, Response, NextFunction } from 'express';
import Web3 from 'web3';
import { WEB3_PROVIDER_URL } from '../config/env.js';
import { saveGraph, getSubgraph } from '../services/graphService.js';
import { commonInput, changeAddress, labelClusters } from '../services/clusterService.js';
import {getTransactions, TransactionData} from "../services/IngestionService.js";
import {detectCommunities} from "../services/community.js";

const router = Router();
const web3 = new Web3(WEB3_PROVIDER_URL);

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

            // Діапазон блоків
            const latest = await web3.eth.getBlockNumber();
            const end = toBlock ?? Number(latest);
            const start = fromBlock ?? Math.max(0, end - 1000);

            // 1. Ingestion
            let transactions: TransactionData[] = [];
            for (const addr of addresses) {
                const txs = await getTransactions([addr], start, end);
                transactions.push(...txs);
            }

            transactions = Array.from(new Map(transactions.map(tx => [tx.hash, tx])).values());

            // 2. Graph build
            await saveGraph(transactions);

            // 3. Heuristics
            const commonClusters = commonInput(transactions);
            const changeClusters = changeAddress(transactions);
            const clusters = [...commonClusters, ...changeClusters];
            if (clusters.length > 0) {
                const uniqueClusters = clusters
                    .map(c => c.sort().join('|'))
                    .filter((v,i,a) => a.indexOf(v) === i)
                    .map(v => v.split('|'));

                await labelClusters(uniqueClusters);
            }

            // 4. Subgraph for visualization
            const graph = await getSubgraph(addresses);

            // 5. Community detection
            const { communityIds, communities } = await detectCommunities(addresses);

            // 6. Stubs for future anomalies and washing
            const anomalies: unknown[] = [];
            const washing: unknown[] = [];

            res.json({
                addresses,
                fromBlock: start,
                toBlock: end,
                transactions,
                clusters,
                graph,
                communities: {
                    nodeAssignments: Object.fromEntries(communityIds),
                    groups: Object.fromEntries(communities)
                },
                anomalies,
                washing,
            });
        } catch (err) {
            console.error('[/analyze] error:', err);
            next(err);
        }
    }
);

export default router;
