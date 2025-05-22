import Web3 from 'web3';
import { WEB3_PROVIDER_URL } from '../config/env.js';

export interface TransactionData {
    from: string;
    to: string;
    value: string;      // у wei
    hash: string;
    blockNumber: string;
    timestamp: string;
}

const web3 = new Web3(WEB3_PROVIDER_URL);

/**
 * Повертає всі ETH-транзакції, де бере участь хоча б одна з вказаних адрес
 */
export async function getTransactions(
    addresses: string[],
    fromBlock: number,
    toBlock: number,
): Promise<TransactionData[]> {
    const result: TransactionData[] = [];
    const addressSet = new Set(addresses.map(addr => addr.toLowerCase()));

    for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
        // отримуємо блок із транзакціями (fullTransactions=true)
        const block = await web3.eth.getBlock(blockNumber, true);
        if (!block || !block.transactions) continue;

        for (const txRaw of block.transactions) {
            // txRaw може бути рядком (hash) або об'єктом транзакції
            if (typeof txRaw === 'string') continue;
            const tx = txRaw;
            const from = tx.from?.toLowerCase();
            const to = tx.to?.toLowerCase();
            if (addressSet.has(from) || addressSet.has(to!)) {
                result.push({
                    from: tx.from!,
                    to: tx.to!,
                    value: String(tx.value),
                    hash: tx.hash,
                    blockNumber: String(tx.blockNumber),
                    timestamp: String(block.timestamp), // переводимо в ms
                });
            }
        }
    }

    return result;
}