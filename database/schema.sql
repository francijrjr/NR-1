-- =====================================================================
-- SISTEMA LEÃO ESCUTA - CANAL DE DENÚNCIAS ANÔNIMAS (NR-1)
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS (SQL SERVER / T-SQL)
-- =====================================================================

-- Certifique-se de estar conectado ao banco de dados correto (Ex: LeaoEscuta)
-- Se necessário, execute antes: CREATE DATABASE LeaoEscuta;
-- USE LeaoEscuta;

-- 1. TABELA: usuarios_admin (Administradores do Painel)
IF OBJECT_ID('dbo.usuarios_admin', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.usuarios_admin (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL, -- Senha criptografada com bcrypt
        data_criacao DATETIME CONSTRAINT DF_usuarios_admin_data_criacao DEFAULT GETDATE()
    );
    
    CREATE NONCLUSTERED INDEX IX_usuarios_admin_email ON dbo.usuarios_admin(email);
    PRINT 'Tabela [usuarios_admin] criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Tabela [usuarios_admin] já existe.';
END;

-- 2. TABELA: denuncias (Dados anônimos da denúncia)
IF OBJECT_ID('dbo.denuncias', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.denuncias (
        id INT IDENTITY(1,1) PRIMARY KEY,
        protocolo VARCHAR(50) NOT NULL UNIQUE, -- Formato: LEAO-2026-00001
        tipo VARCHAR(100) NOT NULL,            -- Risco Psicossocial, Condição Insegura, etc.
        setor VARCHAR(150) NOT NULL,           -- Local do ocorrido
        data_fato DATE NOT NULL,               -- Data estimada
        descricao NVARCHAR(MAX) NOT NULL,      -- Relato detalhado
        status VARCHAR(50) CONSTRAINT DF_denuncias_status DEFAULT 'Recebida', -- Recebida, Em Análise, Em Apuração, Concluída
        deseja_retorno BIT CONSTRAINT DF_denuncias_deseja_retorno DEFAULT 0,
        senha_acompanhamento VARCHAR(255) NULL, -- Senha de acesso do denunciante (bcrypt)
        data_criacao DATETIME CONSTRAINT DF_denuncias_data_criacao DEFAULT GETDATE(),
        data_atualizacao DATETIME CONSTRAINT DF_denuncias_data_atualizacao DEFAULT GETDATE()
    );

    CREATE NONCLUSTERED INDEX IX_denuncias_protocolo ON dbo.denuncias(protocolo);
    CREATE NONCLUSTERED INDEX IX_denuncias_status ON dbo.denuncias(status);
    PRINT 'Tabela [denuncias] criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Tabela [denuncias] já existe.';
END;

-- 3. TABELA: anexos (Documentos, imagens ou áudios anexados)
IF OBJECT_ID('dbo.anexos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.anexos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        denuncia_id INT NOT NULL,
        nome_original VARCHAR(255) NOT NULL,
        nome_servidor VARCHAR(255) NOT NULL,
        caminho VARCHAR(500) NOT NULL,
        tipo_mime VARCHAR(100) NOT NULL,
        tamanho BIGINT NOT NULL,
        data_criacao DATETIME CONSTRAINT DF_anexos_data_criacao DEFAULT GETDATE(),
        CONSTRAINT FK_anexos_denuncias FOREIGN KEY (denuncia_id) 
            REFERENCES dbo.denuncias(id) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_anexos_denuncia_id ON dbo.anexos(denuncia_id);
    PRINT 'Tabela [anexos] criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Tabela [anexos] já existe.';
END;

-- 4. TABELA: historico (Trilha de auditoria interna da conformidade NR-1)
IF OBJECT_ID('dbo.historico', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.historico (
        id INT IDENTITY(1,1) PRIMARY KEY,
        denuncia_id INT NOT NULL,
        acao VARCHAR(100) NOT NULL,              -- e.g., 'Criação', 'Alteração de Status', 'Novo Comentário'
        usuario_admin_id INT NULL,               -- Quem fez a ação (NULL se foi o denunciante ou automático)
        comentario NVARCHAR(MAX) NOT NULL,       -- Relato ou descrição da ação/comentário
        data_criacao DATETIME CONSTRAINT DF_historico_data_criacao DEFAULT GETDATE(),
        CONSTRAINT FK_historico_denuncias FOREIGN KEY (denuncia_id) 
            REFERENCES dbo.denuncias(id) ON DELETE CASCADE,
        CONSTRAINT FK_historico_usuarios_admin FOREIGN KEY (usuario_admin_id) 
            REFERENCES dbo.usuarios_admin(id) ON DELETE SET NULL
    );

    CREATE NONCLUSTERED INDEX IX_historico_denuncia_id ON dbo.historico(denuncia_id);
    PRINT 'Tabela [historico] criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Tabela [historico] já existe.';
END;
