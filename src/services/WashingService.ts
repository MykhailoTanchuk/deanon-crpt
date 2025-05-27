import { MIXER_ADDRESSES, DEFI_CONTRACTS } from '../config/washingConfig.js';
import { TransactionData } from './IngestionService.js';

export interface WashingInfo {
    /**
     * Transaction hash
     */
    hash: string;
    /**
     * True if either sender or receiver is a known mixer
     */
    mixing: boolean;
    /**
     * True if either sender or receiver is a known DeFi contract
     */
    defi: boolean;
}

/**
 * Labels each transaction with mixing/defi flags based on known addresses.
 * @param transactions Array of TransactionData
 * @returns Array of WashingInfo aligned with input transactions
 */
export function labelWashing(transactions: TransactionData[]): WashingInfo[] {
    return transactions.map(tx => {
        const from = tx.from.toLowerCase();
        const to   = tx.to.toLowerCase();
        const mixing = MIXER_ADDRESSES.some(addr => addr.toLowerCase() === from || addr.toLowerCase() === to);
        const defi   = DEFI_CONTRACTS.some(addr => addr.toLowerCase() === from || addr.toLowerCase() === to);
        return { hash: tx.hash, mixing, defi };
    });
}
