#!/usr/bin/env ts-node-esm
import Web3 from 'web3';
import dotenv from 'dotenv';

dotenv.config();
const providerUrl = 'http://127.0.0.1:8545';
if (!providerUrl) {
    console.error('WEB3_PROVIDER_URL not set in .env');
    process.exit(1);
}
const web3 = new Web3(providerUrl);
const provider = web3.currentProvider;

// Ручне майнінг-блоків
async function mineBlock() {
    return new Promise((resolve, reject) => {
        provider.send(
            { jsonrpc: '2.0', method: 'evm_mine', id: Date.now() },
            (err) => (err ? reject(err) : resolve())
        );
    });
}

async function main() {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length < 6) {
        console.error('Need at least 6 unlocked addresses for community test');
        process.exit(1);
    }
    const [A, B, C, D, E, F] = accounts;
    console.log('Using accounts:', A, B, C, D, E, F);

    // Кластер 1: A--C, B--C
    console.log('1) A -> C');
    await web3.eth.sendTransaction({ from: A, to: C, value: web3.utils.toWei('1', 'ether') });
    console.log('2) B -> C');
    await web3.eth.sendTransaction({ from: B, to: C, value: web3.utils.toWei('1', 'ether') });
    console.log('🛠 Mining cluster1 block');
    await mineBlock();

    // Кластер 2: D--E, E--F, F--D (трикутник)
    console.log('3) D -> E');
    await web3.eth.sendTransaction({ from: D, to: E, value: web3.utils.toWei('1', 'ether') });
    console.log('4) E -> F');
    await web3.eth.sendTransaction({ from: E, to: F, value: web3.utils.toWei('1', 'ether') });
    console.log('5) F -> D');
    await web3.eth.sendTransaction({ from: F, to: D, value: web3.utils.toWei('1', 'ether') });
    console.log('🛠 Mining cluster2 block');
    await mineBlock();

    console.log('Transactions for community test created.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
