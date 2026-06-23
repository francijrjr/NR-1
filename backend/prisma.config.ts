import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import path from "path";

// Forçar carregamento absoluto do arquivo .env a partir da pasta de execução atual (process.cwd)
config({ path: path.resolve(process.cwd(), '.env') });

console.log(`[Prisma Config Debug] process.cwd(): ${process.cwd()}`);
console.log(`[Prisma Config Debug] DATABASE_URL: ${process.env.DATABASE_URL ? 'Detectada com sucesso!' : 'Não encontrada (vazia)'}`);

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "",
  },
});
