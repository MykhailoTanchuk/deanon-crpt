export default {
    env: {
        node: true,
        es2020: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',      // ← використовуємо ES-модулі
        project: './tsconfig.json',
    },
    settings: {
        'import/resolver': {
            node: {
                extensions: ['.js', '.ts'],
            },
        },
    },
    plugins: ['@typescript-eslint', 'prettier'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',  // правила для TS
        'plugin:prettier/recommended'            // інтеграція з Prettier
    ],
    rules: {
        'prettier/prettier': 'error',            // помилки форматування як ES промахи
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
        'import/no-unresolved': 'off'
    },
};
