import neo4j, { Driver } from 'neo4j-driver';
import { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } from '../config/env.js';

// Створюємо єдиний інстанс драйвера
// Для Neo4j Aura використовується схема neo4j+s://, шифрування та довіра налаштовуються через URI.
// Для локального Bolt-з’єднання додаткові опції не потрібні.
const driver: Driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

// Перевірка з’єднання
driver
    .verifyConnectivity()
    .then(() => console.log('✅ Connected to Neo4j'))
    .catch((err: Error) => {
        console.error('❌ Neo4j connection error:', err);
        process.exit(1);
    });

export default driver;
