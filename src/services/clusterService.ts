
import neo4j from 'neo4j-driver';
import {TransactionData} from "./IngestionService.js";
import driver from "./neo4j.js";

/**
 * Евристика common-input для Ethereum (групує адреси-відправники за блоком транзакцій)
 * @param transactions масив транзакцій
 * @returns масив кластерів адрес, де більше одного відправника у блоці
 */
export function commonInput(transactions: TransactionData[]): string[][] {
    const clustersMap = new Map<number, Set<string>>();
    for (const tx of transactions) {
        // Перетворюємо blockNumber у число, якщо це рядок
        const blk = Number(tx.blockNumber);
        const blockNumber = Number(blk);

        let set = clustersMap.get(blockNumber);
        if (!set) {
            set = new Set<string>();
            clustersMap.set(blockNumber, set);
        }
        set.add(tx.from.toLowerCase());
    }

    return Array.from(clustersMap.values())
        .map(cluster => Array.from(cluster))
        .filter(cluster => cluster.length > 1);
}

/**
 * Евристика change-address: формує кластери [from, to] для зміни адреси
 */
export function changeAddress(transactions: TransactionData[]): string[][] {
    const clusters: string[][] = [];
    for (const tx of transactions) {
        if (tx.from.toLowerCase() !== tx.to.toLowerCase()) {
            clusters.push([tx.from.toLowerCase(), tx.to.toLowerCase()]);
        }
    }
    return clusters;
}

/**
 * Зберігає мітки кластерів у Neo4j: для кожного кластеру надає вузлам мітку Cluster_{index}
 */
export async function labelClusters(clusters: string[][]): Promise<void> {
    const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    const tx = session.beginTransaction();
    try {
        clusters.forEach((cluster, idx) => {
            const label = `Cluster_${idx}`;
            tx.run(
                `MATCH (a:Address) WHERE toLower(a.id) IN $addresses
         SET a:\`${label}\``,
                { addresses: cluster }
            );
        });
        await tx.commit();
    } catch (err) {
        await tx.rollback();
        throw err;
    } finally {
        await session.close();
    }
}
