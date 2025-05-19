import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 4000;
export const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL!;
export const NEO4J_URI = process.env.NEO4J_URI!;
export const NEO4J_USER = process.env.NEO4J_USER!;
export const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD!;
