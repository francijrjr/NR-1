# Leão Escuta — Canal de Denúncias Anônimas (Vite + React/TSX + Express/TypeScript)

O **Leão Escuta** é um sistema web robusto, seguro e em conformidade para o relato e gestão de riscos ocupacionais e psicossociais. Projetado sob os princípios de **privacidade por padrão (privacy by design)**, ele atende aos requisitos da **NR-1 (Gestão de Riscos Ocupacionais - GRO)** e da **Lei nº 14.457/2022** (Prevenção e Combate ao Assédio no Ambiente de Trabalho).

Esta versão foi estruturada de forma desacoplada:
1. **`frontend/`**: Cliente Single Page Application (SPA) em React (TSX) com Vite e Tailwind CSS v3.
2. **`backend/`**: Servidor API REST em Node.js com Express e TypeScript, autenticado via JWT e conectado ao SQL Server.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React + TSX, Tailwind CSS v3, Vite, Lucide React (Ícones).
- **Backend**: Node.js + Express + TypeScript, JWT (Autenticação), BcryptJS (Hashing de Senhas), Multer (Upload seguro de anexos), Helmet & Cors.
- **Banco de Dados**: SQL Server (MSSQL).
- **Anonimato total**: Isenção completa de logs de IP e metadados de rede dos denunciantes.

---

## 🚀 Como Executar o Projeto Localmente

### 1. Configurar o Banco de Dados (SQL Server via Docker)
Temos um ambiente configurado com Docker Compose para subir o SQL Server localmente.

1. Certifique-se de que o **Docker Desktop** está instalado e em execução.
2. Na raiz do projeto, inicie o container do SQL Server:
   ```bash
   docker compose up -d
   ```
   *Isso subirá um container com o SQL Server 2022 ouvindo na porta `1433` com a senha configurada no seu `.env` (`@@@LeaoSasa1!`).*
3. Caso queira interromper o container do banco futuramente:
   ```bash
   docker compose down
   ```


### 2. Configurar e Executar o Backend (Porta 3000)
1. Acesse o diretório do backend:
   ```bash
   cd backend
   ```
2. Instale todas as dependências do servidor:
   ```bash
   npm install
   ```
3. Configure o arquivo de ambiente:
   - Duplique o arquivo `.env.example` e renomeie-o para `.env`.
   - Configure as credenciais de acesso ao seu SQL Server (usuário `sa`, servidor, porta e senha) nas variáveis individuais.
   - Configure a variável `DATABASE_URL` com as suas credenciais no formato padrão do Prisma:
     `DATABASE_URL="sqlserver://localhost:1433;database=LeaoEscuta;user=sa;password=SUA_SENHA;encrypt=true;trustServerCertificate=true;"`
4. Gere o Prisma Client e sincronize a estrutura física de tabelas no banco de dados:
   ```bash
   # Sincronizar o banco de dados (Cria as tabelas e índices automaticamente)
   npx prisma db push
   
   # Gerar tipos do Prisma Client
   npx prisma generate
   ```
   *(Caso queira criar uma estrutura formal de histórico de migrations locais, você pode rodar em vez disso: `npx prisma migrate dev --name init`)*
5. Inicie o servidor em modo de desenvolvimento (reinicialização automática com nodemon/ts-node):
   ```bash
   npm run dev
   ```
   *Nota: Ao iniciar com sucesso, o console confirmará a conexão e criará automaticamente o usuário administrador padrão (`compliance@empresa.com.br` com a senha `AdminLeaoNR12026!`) se o banco estiver vazio.*

### 3. Configurar e Executar o Frontend (Porta 5173)
1. Abra um novo terminal na raiz do projeto e acesse o diretório do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências do cliente React:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento do Vite:
   ```bash
   npm run dev
   ```
4. Abra o navegador no link indicado (geralmente [http://localhost:5173](http://localhost:5173)).


---

## 🔒 Considerações de Segurança

- **Zero Logs de IP**: As requisições de denúncias não gravam IP do remetente.
- **Autenticação Segura**: O painel administrativo é protegido por tokens JWT armazenados no localStorage do navegador e anexados via cabeçalho `Authorization: Bearer <TOKEN>` nas requisições.
- **Sanitização de Inputs**: O backend realiza a limpeza e sanitização recursiva de inputs JSON contra XSS.
- **Upload Seguro**: O download de anexos é servido programaticamente pelo backend somente após validação do token JWT, eliminando riscos de Directory Traversal e impedindo acessos não autorizados aos arquivos físicos.
- **Trilha de Auditoria**: Qualquer alteração de status na apuração exige comentário justificável que alimenta a trilha do PGR (Programa de Gerenciamento de Riscos).
