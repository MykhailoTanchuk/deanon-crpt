import Web3 from 'web3';
import dotenv from 'dotenv';
dotenv.config();

const web3 = new Web3('http://127.0.0.1:8545');

async function main() {
    const accounts = await web3.eth.getAccounts();
    console.log('Accounts:', accounts);

    if (accounts.length < 2) {
        console.error('У провайдера немає unlocked-аккаунтів!');
        process.exit(1);
    }

    const [from, to] = accounts;
    console.log(`Відправляю 1 ETH з ${from} до ${to}`);

    // Оцінимо газ перш ніж відправляти
    const estimated = await web3.eth.estimateGas({ from, to, value: web3.utils.toWei('1', 'ether') });
    console.log('Estimate gas:', estimated);

    const receipt = await web3.eth.sendTransaction({
        from,
        to,
        value: web3.utils.toWei('1', 'ether'),
        // Не зафіксуємо gas вручну, а візьмемо трохи вище оцінки:
        gas: Number(estimated) + 10000,
    });

    console.log('Tx hash:', receipt.transactionHash);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
