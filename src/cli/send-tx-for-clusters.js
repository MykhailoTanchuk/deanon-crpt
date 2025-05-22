#!/usr/bin/env ts-node-esm
import Web3 from 'web3';
import dotenv from 'dotenv';
dotenv.config();

const web3 = new Web3('http://127.0.0.1:8545');
// Для EIP-1193-сумісного провайдера Ganache
const provider = web3.currentProvider;

// Допоміжна функція для ручного майнінгу
async function mineBlock() {
    return new Promise((resolve, reject) => {
        provider.send(
            { jsonrpc: '2.0', method: 'evm_mine', id: Date.now() },
            (err, _result) => (err ? reject(err) : resolve())
        );
    });
}

async function main() {
    const accounts = await web3.eth.getAccounts();
    if (accounts.length < 4) {
        console.error('Потрібно щонайменше 4 unlocked-адреси у провайдера');
        process.exit(1);
    }
    const [a, b, c, d] = accounts;

    console.log('1) A -> C');
    await web3.eth.sendTransaction({ from: a, to: c, value: web3.utils.toWei('1', 'ether') });

    console.log('2) B -> C');
    await web3.eth.sendTransaction({ from: b, to: c, value: web3.utils.toWei('2', 'ether') });

    // Ручне майнінґ: тепер обидві транзакції потраплять в один блок
    console.log('🛠  Mining a block with both txs...');
    await mineBlock();

    console.log('3) C -> D');
    await web3.eth.sendTransaction({ from: c, to: d, value: web3.utils.toWei('0.5', 'ether') });

    // Можемо знову промайнити для цієї транзакції окремо
    console.log('🛠  Mining the change-address tx...');
    await mineBlock();

    console.log('Готово!');
}

main().catch(console.error);
