import neo4j, { Record as Neo4jRecord, Integer } from 'neo4j-driver';
import {TransactionData} from "./IngestionService.js";
import driver from "./neo4j.js";

export interface SubgraphNode {
    id: string;
}

export interface SubgraphEdge {
    from: string;
    to: string;
    hash: string;
    value: number;
    timestamp: number;
}

/**
 * Зберігає або оновлює вузли та ребра в графовій БД на основі транзакцій.
 */
export async function saveGraph(
    transactions: TransactionData[]
): Promise<void> {
    const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    const tx = session.beginTransaction();

    try {
        for (const { from, to, hash, value, blockNumber, timestamp } of transactions) {
            const fromId = from.toLowerCase();
            const toId = to.toLowerCase();

            await tx.run(
                `MERGE (a:Address { id: $id })`,
                { id: fromId }
            );
            await tx.run(
                `MERGE (b:Address { id: $id })`,
                { id: toId }
            );
            await tx.run(
                `MATCH (a:Address { id: $from }), (b:Address { id: $to })
         MERGE (a)-[r:TRANSFER { hash: $hash }]->(b)
         ON CREATE SET r += { value: $value, blockNumber: $blockNumber, timestamp: $timestamp }
         ON MATCH SET r += { value: $value, blockNumber: $blockNumber, timestamp: $timestamp }`,
                {
                    from: fromId,
                    to: toId,
                    hash,
                    value: Number(value),
                    blockNumber,
                    timestamp
                }
            );
        }
        await tx.commit();
    } catch (error) {
        await tx.rollback();
        throw error;
    } finally {
        await session.close();
    }
}

/**
 * Повертає підграф для заданих адрес з розширенням на сусідів.
 */
export async function getSubgraph(
    addresses: string[]
): Promise<{ nodes: SubgraphNode[]; edges: SubgraphEdge[] }> {
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
        throw new Error('addresses must be a non-empty array of strings');
    }

    const session = driver.session({ defaultAccessMode: neo4j.session.READ });
    const addressesLower = addresses.map(addr => addr.toLowerCase());

    try {
        const result = await session.run(
            `
      UNWIND $addresses AS seedId
      MATCH (seed:Address { id: seedId })
      OPTIONAL MATCH (seed)-[r:TRANSFER]-(nbr:Address)
      RETURN seed.id AS seed, nbr.id AS neighbor, r.hash AS hash, r.value AS value, r.timestamp AS timestamp
      `,
            { addresses: addressesLower }
        );

        const nodesSet = new Set<string>(addressesLower);
        const edgeKeys = new Set<string>();
        const edges: SubgraphEdge[] = [];

        for (const rec of result.records as Neo4jRecord[]) {
            const seed = (rec.get('seed') as string).toLowerCase();
            nodesSet.add(seed);

            const nbrRaw = rec.get('neighbor');
            const hash = rec.get('hash') as string;
            if (nbrRaw && hash) {
                const nbr = (nbrRaw as string).toLowerCase();
                nodesSet.add(nbr);
                const valueRaw = rec.get('value');
                const tsRaw = rec.get('timestamp');
                const value = Integer.isInteger(valueRaw)
                    ? (valueRaw as Integer).toNumber()
                    : Number(valueRaw);
                const timestamp = Integer.isInteger(tsRaw)
                    ? (tsRaw as Integer).toNumber()
                    : Number(tsRaw);

                const key = `${seed}:${nbr}:${hash}`;
                if (!edgeKeys.has(key)) {
                    edgeKeys.add(key);
                    edges.push({ from: seed, to: nbr, hash, value, timestamp });
                }
            }
        }

        const nodes: SubgraphNode[] = Array.from(nodesSet).map(id => ({ id }));
        return { nodes, edges };
    } finally {
        await session.close();
    }
}
