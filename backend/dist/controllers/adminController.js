"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportarCSV = exports.baixarAnexo = exports.adicionarComentario = exports.atualizarStatus = exports.exibirDetalhes = exports.exibirDashboard = exports.login = void 0;
const db_1 = require("../config/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// 1. Processar Login administrativo
const login = async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
    }
    try {
        const admin = await db_1.prisma.usuarioAdmin.findUnique({
            where: { email: email.trim() }
        });
        if (!admin) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }
        const senhaValida = await bcryptjs_1.default.compare(senha, admin.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
        }
        // Assinar Token JWT (Expira em 4 horas)
        const jwtSecret = process.env.JWT_SECRET || 'segredo_padrao_leao_escuta_2026_jwt';
        const token = jsonwebtoken_1.default.sign({ id: admin.id, nome: admin.nome, email: admin.email }, jwtSecret, { expiresIn: '4h' });
        return res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin.id,
                nome: admin.nome,
                email: admin.email
            }
        });
    }
    catch (error) {
        console.error('Erro ao realizar login com Prisma:', error);
        return res.status(500).json({ error: 'Erro interno ao realizar login.' });
    }
};
exports.login = login;
// 2. Exibir Dashboard (Dados filtrados + Métricas estatísticas)
const exibirDashboard = async (req, res) => {
    const { status, tipo, data_inicio, data_fim, busca } = req.query;
    try {
        // Carregar estatísticas gerais
        const total = await db_1.prisma.denuncia.count();
        const recebidas = await db_1.prisma.denuncia.count({ where: { status: 'Recebida' } });
        const emAnalyse = await db_1.prisma.denuncia.count({ where: { status: 'Em Análise' } });
        const emApuracao = await db_1.prisma.denuncia.count({ where: { status: 'Em Apuração' } });
        const concluidas = await db_1.prisma.denuncia.count({ where: { status: 'Concluída' } });
        const metrics = {
            total,
            recebidas,
            em_analise: emAnalyse,
            em_apuracao: emApuracao,
            concluídas: concluidas
        };
        // Montar filtros dinâmicos
        const where = {};
        if (status) {
            where.status = status;
        }
        if (tipo) {
            where.tipo = tipo;
        }
        if (data_inicio || data_fim) {
            where.data_criacao = {};
            if (data_inicio) {
                where.data_criacao.gte = new Date(`${data_inicio}T00:00:00.000Z`);
            }
            if (data_fim) {
                where.data_criacao.lte = new Date(`${data_fim}T23:59:59.999Z`);
            }
        }
        if (busca) {
            const termo = busca.trim();
            where.OR = [
                { protocolo: { contains: termo } },
                { setor: { contains: termo } },
                { descricao: { contains: termo } }
            ];
        }
        const list = await db_1.prisma.denuncia.findMany({
            where,
            select: {
                id: true,
                protocolo: true,
                tipo: true,
                setor: true,
                data_fato: true,
                status: true,
                deseja_retorno: true,
                data_criacao: true,
                data_atualizacao: true
            },
            orderBy: {
                data_criacao: 'desc'
            }
        });
        return res.status(200).json({
            success: true,
            metrics,
            denuncias: list
        });
    }
    catch (error) {
        console.error('Erro ao carregar painel administrativo com Prisma:', error);
        return res.status(500).json({ error: 'Erro interno ao obter dados do dashboard.' });
    }
};
exports.exibirDashboard = exibirDashboard;
// 3. Obter detalhes de uma denúncia específica
const exibirDetalhes = async (req, res) => {
    const { id } = req.params;
    try {
        const denuncia = await db_1.prisma.denuncia.findUnique({
            where: { id: parseInt(id, 10) },
            include: {
                anexos: true,
                historicos: {
                    include: {
                        usuarioAdmin: {
                            select: {
                                nome: true
                            }
                        }
                    },
                    orderBy: {
                        data_criacao: 'desc'
                    }
                }
            }
        });
        if (!denuncia) {
            return res.status(404).json({ error: 'Denúncia não encontrada.' });
        }
        // Converter BigInt do tamanho do arquivo para Number
        const cleanAnexos = denuncia.anexos.map(anexo => ({
            id: anexo.id,
            nome_original: anexo.nome_original,
            tamanho: Number(anexo.tamanho),
            data_criacao: anexo.data_criacao
        }));
        // Formatar histórico para enviar o nome do admin ao invés do objeto
        const formattedHistoricos = denuncia.historicos.map(h => ({
            id: h.id,
            acao: h.acao,
            comentario: h.comentario,
            data_criacao: h.data_criacao,
            admin_nome: h.usuarioAdmin?.nome || null
        }));
        // Remover senha hash para segurança
        const cleanDenuncia = {
            id: denuncia.id,
            protocolo: denuncia.protocolo,
            tipo: denuncia.tipo,
            setor: denuncia.setor,
            data_fato: denuncia.data_fato,
            descricao: denuncia.descricao,
            status: denuncia.status,
            deseja_retorno: denuncia.deseja_retorno,
            data_criacao: denuncia.data_criacao,
            data_atualizacao: denuncia.data_atualizacao
        };
        return res.status(200).json({
            success: true,
            denuncia: cleanDenuncia,
            anexos: cleanAnexos,
            historico: formattedHistoricos
        });
    }
    catch (error) {
        console.error('Erro ao carregar detalhes da denúncia com Prisma:', error);
        return res.status(500).json({ error: 'Erro interno ao obter dados da denúncia.' });
    }
};
exports.exibirDetalhes = exibirDetalhes;
// 4. Atualizar status com justificativa (auditoria)
const atualizarStatus = async (req, res) => {
    const { id } = req.params;
    const { status_novo, comentario } = req.body;
    const adminId = req.adminUser?.id;
    if (!status_novo || !comentario) {
        return res.status(400).json({ error: 'Dados inválidos. Status e justificativa são obrigatórios.' });
    }
    try {
        await db_1.prisma.$transaction(async (tx) => {
            // 1. Obter a denúncia original
            const original = await tx.denuncia.findUnique({
                where: { id: parseInt(id, 10) },
                select: { status: true }
            });
            if (!original) {
                throw new Error('Denúncia não localizada.');
            }
            // 2. Atualizar o status e data de atualização
            await tx.denuncia.update({
                where: { id: parseInt(id, 10) },
                data: {
                    status: status_novo,
                    data_atualizacao: new Date()
                }
            });
            // 3. Criar registro no histórico para a trilha de auditoria
            await tx.historico.create({
                data: {
                    denuncia_id: parseInt(id, 10),
                    usuario_admin_id: adminId,
                    acao: 'Alteração de Status',
                    comentario: `Alteração de Status: [${original.status}] para [${status_novo}]. Justificativa: ${comentario}`
                }
            });
        });
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Erro ao atualizar status da denúncia com Prisma:', error);
        if (error.message === 'Denúncia não localizada.') {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Erro interno ao atualizar status.' });
    }
};
exports.atualizarStatus = atualizarStatus;
// 5. Adicionar nota/comentário interno de auditoria
const adicionarComentario = async (req, res) => {
    const { id } = req.params;
    const { comentario } = req.body;
    const adminId = req.adminUser?.id;
    if (!comentario || comentario.trim() === '') {
        return res.status(400).json({ error: 'Comentário não pode estar em branco.' });
    }
    try {
        await db_1.prisma.$transaction(async (tx) => {
            // 1. Inserir nota no histórico
            await tx.historico.create({
                data: {
                    denuncia_id: parseInt(id, 10),
                    usuario_admin_id: adminId,
                    acao: 'Comentário Interno',
                    comentario: comentario.trim()
                }
            });
            // 2. Atualizar data_atualizacao
            await tx.denuncia.update({
                where: { id: parseInt(id, 10) },
                data: { data_atualizacao: new Date() }
            });
        });
        return res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Erro ao adicionar comentário interno com Prisma:', error);
        return res.status(500).json({ error: 'Erro interno ao salvar comentário interno.' });
    }
};
exports.adicionarComentario = adicionarComentario;
// 6. Download seguro de anexos
const baixarAnexo = async (req, res) => {
    const { id } = req.params;
    try {
        const anexo = await db_1.prisma.anexo.findUnique({
            where: { id: parseInt(id, 10) }
        });
        if (!anexo) {
            return res.status(404).json({ error: 'Arquivo não encontrado no banco.' });
        }
        const absolutePath = path_1.default.resolve(anexo.caminho);
        // Evitar Directory Traversal certificando que o arquivo está na pasta pública de uploads
        const uploadsDir = path_1.default.resolve('public/uploads');
        if (!absolutePath.startsWith(uploadsDir)) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        if (!fs_1.default.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'Arquivo físico não localizado no servidor.' });
        }
        res.setHeader('Content-Type', anexo.tipo_mime);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(anexo.nome_original)}"`);
        return fs_1.default.createReadStream(absolutePath).pipe(res);
    }
    catch (error) {
        console.error('Erro ao baixar anexo com Prisma:', error);
        return res.status(500).json({ error: 'Erro interno ao processar download.' });
    }
};
exports.baixarAnexo = baixarAnexo;
// 7. Exportar relatórios para PGR (CSV seguro)
const exportarCSV = async (req, res) => {
    const { status, tipo, data_inicio, data_fim } = req.query;
    try {
        // Montar filtros dinâmicos
        const where = {};
        if (status) {
            where.status = status;
        }
        if (tipo) {
            where.tipo = tipo;
        }
        if (data_inicio || data_fim) {
            where.data_criacao = {};
            if (data_inicio) {
                where.data_criacao.gte = new Date(`${data_inicio}T00:00:00.000Z`);
            }
            if (data_fim) {
                where.data_criacao.lte = new Date(`${data_fim}T23:59:59.999Z`);
            }
        }
        const result = await db_1.prisma.denuncia.findMany({
            where,
            select: {
                protocolo: true,
                data_fato: true,
                tipo: true,
                setor: true,
                status: true,
                deseja_retorno: true,
                data_criacao: true,
                data_atualizacao: true
            },
            orderBy: {
                data_criacao: 'desc'
            }
        });
        let csvContent = '\uFEFF';
        csvContent += 'Protocolo;Data Fato;Tipo de Risco;Setor;Status;Deseja Retorno;Data de Criação;Ultima Atualização\n';
        result.forEach(row => {
            const dataFato = row.data_fato ? new Date(row.data_fato).toLocaleDateString('pt-BR') : '';
            const dataCriacao = row.data_criacao ? new Date(row.data_criacao).toLocaleDateString('pt-BR') : '';
            const dataAtualizacao = row.data_atualizacao ? new Date(row.data_atualizacao).toLocaleDateString('pt-BR') : '';
            const retorno = row.deseja_retorno ? 'Sim' : 'Não';
            const tipoRisco = `"${row.tipo.replace(/"/g, '""')}"`;
            const setor = `"${row.setor.replace(/"/g, '""')}"`;
            csvContent += `${row.protocolo};${dataFato};${tipoRisco};${setor};${row.status};${retorno};${dataCriacao};${dataAtualizacao}\n`;
        });
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio_denuncias_pgr.csv"');
        return res.status(200).send(csvContent);
    }
    catch (error) {
        console.error('Erro ao exportar relatório CSV com Prisma:', error);
        return res.status(500).json({ error: 'Erro interno ao exportar relatório.' });
    }
};
exports.exportarCSV = exportarCSV;
