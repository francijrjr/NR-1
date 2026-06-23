"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = exports.prisma = void 0;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_1.PrismaClient; } });
const adapter_mssql_1 = require("@prisma/adapter-mssql");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
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
const adapter = new adapter_mssql_1.PrismaMssql(mssqlConfig);
exports.prisma = new client_1.PrismaClient({ adapter });
