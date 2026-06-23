"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultarDenuncia = exports.registrarDenuncia = void 0;
const db_1 = require("../config/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
// Enviar e-mail de alerta para CIPA/Compliance (Sem expor o denunciante)
async function enviarEmailAlerta(protocolo, tipoRisco) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.log(`[Email Mock] Alerta de nova denúncia - Protocolo: ${protocolo}, Tipo: ${tipoRisco}. (Configure o SMTP no arquivo .env para envio real)`);
        return;
    }
    try {
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM || 'Leão Escuta'}" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_TO,
            subject: `[LEÃO ESCUTA] Nova Denúncia Registrada - Protocolo ${protocolo}`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #d97706;">Aviso de Nova Denúncia Ocupacional (NR-1)</h2>
          <p>Olá, Comitê de Compliance / CIPA / SESMT,</p>
          <p>Uma nova denúncia anônima foi registrada no canal **Leão Escuta**.</p>
          <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
          <ul style="list-style: none; padding-left: 0;">
            <li><strong>Protocolo:</strong> <span style="font-family: monospace; font-size: 1.1em; font-weight: bold; background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${protocolo}</span></li>
            <li><strong>Tipo de Risco:</strong> ${tipoRisco}</li>
            <li><strong>Data de Entrada:</strong> ${new Date().toLocaleDateString('pt-BR')}</li>
          </ul>
          <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
          <p>Por favor, acesse o painel administrativo para analisar os detalhes e iniciar o processo de apuração.</p>
          <p style="font-size: 0.9em; color: #666; margin-top: 30px;">Esta mensagem foi enviada de forma automatizada pelo Sistema Leão Escuta.</p>
        </div>
      `
        });
        console.log(`E-mail de notificação enviado: ${info.messageId}`);
    }
    catch (error) {
        console.error('Erro ao enviar e-mail de notificação de denúncia:', error.message);
    }
}
// Helper para gerar senha aleatória simples
function gerarSenhaAcompanhamento() {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let senha = '';
    for (let i = 0; i < 8; i++) {
        senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return senha;
}
// 1. Registrar denúncia anônima
const registrarDenuncia = async (req, res) => {
    const { tipo, setor, data_fato, descricao, deseja_retorno } = req.body;
    if (!tipo || !setor || !data_fato || !descricao) {
        return res.status(400).json({ error: 'Por favor, preencha todos os campos obrigatórios.' });
    }
    const files = req.files;
    try {
        // Executar todo o fluxo em transação para consistência
        const result = await db_1.prisma.$transaction(async (tx) => {
            const anoAtual = new Date().getFullYear();
            // 1. Obter a contagem do ano corrente para a sequência do protocolo
            const totalNoAno = await tx.denuncia.count({
                where: {
                    data_criacao: {
                        gte: new Date(`${anoAtual}-01-01T00:00:00.000Z`),
                        lte: new Date(`${anoAtual}-12-31T23:59:59.999Z`)
                    }
                }
            });
            const sequencia = (totalNoAno + 1).toString().padStart(5, '0');
            const protocolo = `LEAO-${anoAtual}-${sequencia}`;
            // 2. Tratar a senha se solicitado retorno
            const querRetorno = deseja_retorno === 'on' || deseja_retorno === 'true' || deseja_retorno === true;
            let senhaCrua = '';
            let senhaHash = '';
            if (querRetorno) {
                senhaCrua = gerarSenhaAcompanhamento();
                senhaHash = await bcryptjs_1.default.hash(senhaCrua, 10);
            }
            // 3. Criar a denúncia com relações aninhadas (anexos e histórico)
            await tx.denuncia.create({
                data: {
                    protocolo,
                    tipo,
                    setor,
                    data_fato: new Date(data_fato),
                    descricao,
                    status: 'Recebida',
                    deseja_retorno: querRetorno,
                    senha_acompanhamento: querRetorno ? senhaHash : null,
                    anexos: {
                        create: files?.map(file => ({
                            nome_original: file.originalname,
                            nome_servidor: file.filename,
                            caminho: file.path.replace(/\\/g, '/'),
                            tipo_mime: file.mimetype,
                            tamanho: BigInt(file.size) // Prisma espera BigInt mapeado no SQL Server
                        })) || []
                    },
                    historicos: {
                        create: {
                            acao: 'Criação',
                            comentario: 'Denúncia inserida anonimamente no canal Leão Escuta.'
                        }
                    }
                }
            });
            return { protocolo, senhaCrua, deseja_retorno: querRetorno };
        });
        // Enviar notificação por e-mail em background
        enviarEmailAlerta(result.protocolo, tipo);
        return res.status(201).json({
            success: true,
            protocolo: result.protocolo,
            senha: result.deseja_retorno ? result.senhaCrua : null,
            deseja_retorno: result.deseja_retorno
        });
    }
    catch (error) {
        console.error('Erro ao salvar denúncia no banco com Prisma:', error);
        // Limpar arquivos físicos carregados se houver falha
        if (files && files.length > 0) {
            files.forEach(file => {
                if (fs_1.default.existsSync(file.path)) {
                    fs_1.default.unlinkSync(file.path);
                }
            });
        }
        return res.status(500).json({ error: 'Erro interno ao registrar denúncia. Tente novamente mais tarde.' });
    }
};
exports.registrarDenuncia = registrarDenuncia;
// 2. Buscar e processar acompanhamento de denúncia
const consultarDenuncia = async (req, res) => {
    const { protocolo, senha } = req.body;
    if (!protocolo || !senha) {
        return res.status(400).json({ error: 'Por favor, forneça o protocolo e a senha de acompanhamento.' });
    }
    try {
        const denuncia = await db_1.prisma.denuncia.findUnique({
            where: {
                protocolo: protocolo.trim()
            }
        });
        if (!denuncia) {
            return res.status(404).json({ error: 'Protocolo não localizado. Verifique se o código está correto.' });
        }
        if (!denuncia.deseja_retorno || !denuncia.senha_acompanhamento) {
            return res.status(403).json({ error: 'Esta denúncia foi registrada de modo 100% fechado (sem solicitação de retorno).' });
        }
        // Verificar senha
        const senhaValida = await bcryptjs_1.default.compare(senha.trim(), denuncia.senha_acompanhamento);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Senha de acompanhamento incorreta.' });
        }
        // Buscar histórico do relato
        const historicos = await db_1.prisma.historico.findMany({
            where: {
                denuncia_id: denuncia.id
            },
            select: {
                acao: true,
                comentario: true,
                data_criacao: true
            },
            orderBy: {
                data_criacao: 'desc'
            }
        });
        // Remover senha hash para segurança do tráfego JSON
        const cleanDenuncia = {
            id: denuncia.id,
            protocolo: denuncia.protocolo,
            tipo: denuncia.tipo,
            status: denuncia.status,
            deseja_retorno: denuncia.deseja_retorno,
            data_criacao: denuncia.data_criacao,
            data_atualizacao: denuncia.data_atualizacao
        };
        return res.status(200).json({
            success: true,
            denuncia: cleanDenuncia,
            historico: historicos
        });
    }
    catch (error) {
        console.error('Erro ao consultar denúncia com Prisma:', error);
        return res.status(500).json({ error: 'Erro interno ao consultar denúncia.' });
    }
};
exports.consultarDenuncia = consultarDenuncia;
