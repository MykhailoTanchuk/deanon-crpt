// config/washingConfig.ts

/**
 * Адреси відомих міксерів (Tornado Cash V2 pools на Ethereum mainnet)
 * Заміни на актуальні з офіційних джерел
 */
export const MIXER_ADDRESSES: string[] = [
    '0x5e2f95385fa49a5747c5f59c9a122f561c4a3a45', // Tornado Cash V2 - 0.1 ETH (приклад)
    '0x0697c45e0c150981601fabee647e807fe2c2c947', // Tornado Cash V2 - 1 ETH
    '0x06d52a4b9cdf8ffe1f55fefac34b92f8f8f5b0cc', // Tornado Cash V2 - 10 ETH
    '0xb3d1c6bc30fc6af5b89e3dafeffff51e5612f147', // Tornado Cash V2 - 100 ETH
] as const;

/**
 * Адреси ключових DeFi-контрактів на Ethereum mainnet
 */
export const DEFI_CONTRACTS: string[] = [
    '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // Uniswap V2 Factory
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router02
    '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Uniswap V3 Factory
    '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
    '0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af', // Uniswap V4
    '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3', // Compound Comptroller
    '0x7BeA39867e4169DBe237d55C8242a8f2FCD4F5C', // Aave LendingPool
    '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // SushiSwap Router
    '0x58B6A8A3302369DAEc383334672404Ee733aB239', // 1inch Router
    '0xC0eFf7749b125444953ef89682201Fb8c6A917CD', // Balancer Vault
] as const;
