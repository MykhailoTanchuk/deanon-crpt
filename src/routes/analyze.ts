import { Router, Request, Response, NextFunction } from 'express';
import Web3 from 'web3';
import { WEB3_PROVIDER_URL } from '../config/env.js';
import { saveGraph, getSubgraph } from '../services/graphService.js';
import { commonInput, changeAddress, labelClusters } from '../services/clusterService.js';
import {getTransactions, TransactionData} from "../services/IngestionService.js";
import {detectCommunities} from "../services/community.js";
import Graph from "graphology";
import {detectAnomalies, detectCycles, labelSuspicious} from "../services/AnomalyService.js";
import {labelWashing, WashingInfo} from "../services/WashingService.js";

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
            console.time('analyze');
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
            console.timeEnd('analyze')
            // 2. Graph build
            console.time('graph');
            await saveGraph(transactions);
            console.timeEnd('graph')

            // 3. Heuristics
            console.time('heuristics');

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
            console.timeEnd('heuristics')


            // 4. Subgraph for visualization
            console.time('subgraph');

            const subgraph = await getSubgraph(addresses);

            // Convert to graphology Graph instance
            const graph = new Graph({ multi: true, type: 'directed' });
            subgraph.nodes.forEach(node => graph.addNode(node.id));
            subgraph.edges.forEach(edge => {
                graph.addEdge(edge.from, edge.to, {
                    hash: edge.hash,
                    value: edge.value,
                    timestamp: edge.timestamp
                });
            });
            console.timeEnd('subgraph')


            // 5. Community detection
            console.time('community');

            const { communityIds, communities } = await detectCommunities(addresses);
            console.timeEnd('community')

            // 6. Anomaly detection
            console.time('anomaly');

            const cycles = detectCycles(graph);
            const anomalies = detectAnomalies(graph);
            labelSuspicious(graph, anomalies, cycles);
            console.timeEnd('anomaly')

            const washing: WashingInfo[] = labelWashing(transactions);

            // Convert labeled graph back to simple structure
            const resultGraph = {
                nodes: subgraph.nodes.map(node => ({
                    ...node,
                    suspicious: graph.getNodeAttribute(node.id, 'suspicious') || false,
                    inCycle: graph.getNodeAttribute(node.id, 'inCycle') || false
                })),
                edges: subgraph.edges
            };

            res.json({
                addresses,
                fromBlock: start,
                toBlock: end,
                transactions,
                clusters,
                graph: resultGraph,
                communities: {
                    nodeAssignments: Object.fromEntries(communityIds),
                    groups: Object.fromEntries(communities)
                },
                anomalies,
                cycles,
                washing,
            });
        } catch (err) {
            console.error('[/analyze] error:', err);
            next(err);
        }
    }
);

export default router;




