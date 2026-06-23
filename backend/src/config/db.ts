import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
import dotenv from 'dotenv';

dotenv.config();

const mssqlConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_DATABASE || 'LeaoEscuta',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

console.log(`Inicializando PrismaClient com o Driver Adapter do SQL Server (${mssqlConfig.server}:${mssqlConfig.port})...`);

const adapter = new PrismaMssql(mssqlConfig);
export const prisma = new PrismaClient({ adapter });
export { PrismaClient };
