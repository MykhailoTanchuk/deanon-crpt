import Graph from 'graphology';
import { dbscan } from '../utils/dbscan.js';
import {findSimpleCycles} from "../utils/dfs.js";

export interface CycleInfo {
    nodes: string[];       // ordered list of node ids in the cycle
    totalValue: number;    // sum of transaction values along the cycle
}

export interface AnomalyInfo {
    node: string;
    degree: number;
    totalValue: number;
    score: number;         // anomaly score (1 for anomaly, 0 for clean)
    type: 'anomaly' | 'clean';
}

/**
 * Detects simple cycles in the graph using strongly connected components or DFS up to a given length.
 * Calculates total transaction value in each cycle.
 */
export function detectCycles(graph: Graph, maxLength = 6): CycleInfo[] {
    const simpleCycles = findSimpleCycles(graph, maxLength);

    return simpleCycles.map(cycle => {
        const totalValue = cycle.nodes.reduce((sum, from, i) => {
            const to = cycle.nodes[(i + 1) % cycle.nodes.length];

            // Отримуємо всі ребра між from і to
            const edgeKeys = graph.edges(from, to);
            // Для кожного ребра дістаємо value і підсумовуємо
            const segmentValue = edgeKeys.reduce((segSum, key) => {
                const attrs = graph.getEdgeAttributes(key);
                return segSum + (attrs.value as number || 0);
            }, 0);

            return sum + segmentValue;
        }, 0);

        return { nodes: cycle.nodes, totalValue };
    });
}


/**
 * Detects anomalous nodes in the graph based on degree and total transaction value using built-in DBSCAN.
 */
export function detectAnomalies(
    graph: Graph,
    eps: number = 2,
    minPts: number = 2
): AnomalyInfo[] {
    // 1. Prepare dataset: for each node, compute [degree, totalValue]
    const data: number[][] = [];
    const mapping: string[] = [];

    graph.forEachNode((node) => {
        const degree = graph.degree(node);
        let totalValue = 0;
        graph.forEachEdge((edge, attr, source: string, target: string) => {
            if (source === node || target === node) {
                totalValue += typeof attr.value === 'number' ? attr.value : 0;
            }
        });
        data.push([degree, totalValue]);
        mapping.push(node);
    });

    // 2. Run custom DBSCAN
    const rawData = data; // [[degree, totalValue], ...]

// 1. Логарифмуємо totalValue (щоб «упакувати» 10^18 → ~18)
    const logData = rawData.map(([deg, value]) => [
        deg,
        Math.log10(value + 1)
    ]);

// 2. Мін–макс нормалізація обох ознак у [0,1]
    const degrees = logData.map(d => d[0]);
    const logs    = logData.map(d => d[1]);
    const maxDeg  = Math.max(...degrees);
    const minLog  = Math.min(...logs);
    const maxLog  = Math.max(...logs);

    const normData = logData.map(([deg, lg]) => [
        maxDeg > 0 ? deg / maxDeg : 0,
        (lg - minLog) / (maxLog - minLog)
    ]);

// 3. Викликаємо DBSCAN на нормалізованих даних
    const epsNorm = 0.1;   // або 0.05…0.2 — треба підібрати
    const minPtsNorm = 2;  // або 3
    const { labels, noise } = dbscan(normData, epsNorm, minPtsNorm);

    // 3. Build results
    const anomalies: AnomalyInfo[] = mapping.map((node, idx) => {
        const [degree, totalValue] = data[idx];
        const isNoise = labels[idx] === -1;
        return {
            node,
            degree,
            totalValue,
            score: isNoise ? 1 : 0,
            type: isNoise ? 'anomaly' : 'clean'
        };
    });

    return anomalies;
}

/**
 * Marks suspicious or clean flag on nodes based on anomalies and cycles.
 */
export function labelSuspicious(graph: Graph, anomalies: AnomalyInfo[], cycles: CycleInfo[]): void {
    anomalies.forEach(info => {
        graph.setNodeAttribute(info.node, 'suspicious', info.type === 'anomaly');
    });

    cycles.forEach(cycle => {
        cycle.nodes.forEach(node => {
            graph.setNodeAttribute(node, 'inCycle', true);
        });
    });
}
