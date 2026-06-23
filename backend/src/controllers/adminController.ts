import { Request, Response } from 'express';
import { prisma } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { AuthenticatedRequest } from '../middleware/auth';

// 1. Processar Login administrativo
export const login = async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
  }

  try {
    const admin = await prisma.usuarioAdmin.findUnique({
      where: { email: (email as string).trim() }
    });

    if (!admin) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const senhaValida = await bcrypt.compare(senha, admin.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    // Assinar Token JWT (Expira em 4 horas)
    const jwtSecret = process.env.JWT_SECRET || 'segredo_padrao_leao_escuta_2026_jwt';
    const token = jwt.sign(
      { id: admin.id, nome: admin.nome, email: admin.email },
      jwtSecret,
      { expiresIn: '4h' }
    );

    return res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email
      }
    });

  } catch (error) {
    console.error('Erro ao realizar login com Prisma:', error);
    return res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
};

// 2. Exibir Dashboard (Dados filtrados + Métricas estatísticas)
export const exibirDashboard = async (req: Request, res: Response) => {
  const { status, tipo, data_inicio, data_fim, busca } = req.query;

  try {
    // Carregar estatísticas gerais
    const total = await prisma.denuncia.count();
    const recebidas = await prisma.denuncia.count({ where: { status: 'Recebida' } });
    const emAnalyse = await prisma.denuncia.count({ where: { status: 'Em Análise' } });
    const emApuracao = await prisma.denuncia.count({ where: { status: 'Em Apuração' } });
    const concluidas = await prisma.denuncia.count({ where: { status: 'Concluída' } });

    const metrics = {
      total,
      recebidas,
      em_analise: emAnalyse,
      em_apuracao: emApuracao,
      concluídas: concluidas
    };

    // Montar filtros dinâmicos
    const where: any = {};

    if (status) {
      where.status = status as string;
    }
    if (tipo) {
      where.tipo = tipo as string;
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
      const termo = (busca as string).trim();
      where.OR = [
        { protocolo: { contains: termo } },
        { setor: { contains: termo } },
        { descricao: { contains: termo } }
      ];
    }

    const list = await prisma.denuncia.findMany({
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

  } catch (error) {
    console.error('Erro ao carregar painel administrativo com Prisma:', error);
    return res.status(500).json({ error: 'Erro interno ao obter dados do dashboard.' });
  }
};

// 3. Obter detalhes de uma denúncia específica
export const exibirDetalhes = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const denuncia = await prisma.denuncia.findUnique({
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

  } catch (error) {
    console.error('Erro ao carregar detalhes da denúncia com Prisma:', error);
    return res.status(500).json({ error: 'Erro interno ao obter dados da denúncia.' });
  }
};

// 4. Atualizar status com justificativa (auditoria)
export const atualizarStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status_novo, comentario } = req.body;
  const adminId = req.adminUser?.id;

  if (!status_novo || !comentario) {
    return res.status(400).json({ error: 'Dados inválidos. Status e justificativa são obrigatórios.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
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

  } catch (error: any) {
    console.error('Erro ao atualizar status da denúncia com Prisma:', error);
    if (error.message === 'Denúncia não localizada.') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Erro interno ao atualizar status.' });
  }
};

// 5. Adicionar nota/comentário interno de auditoria
export const adicionarComentario = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { comentario } = req.body;
  const adminId = req.adminUser?.id;

  if (!comentario || comentario.trim() === '') {
    return res.status(400).json({ error: 'Comentário não pode estar em branco.' });
  }

  try {
    await prisma.$transaction(async (tx) => {
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

  } catch (error) {
    console.error('Erro ao adicionar comentário interno com Prisma:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar comentário interno.' });
  }
};

// 6. Download seguro de anexos
export const baixarAnexo = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const anexo = await prisma.anexo.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!anexo) {
      return res.status(404).json({ error: 'Arquivo não encontrado no banco.' });
    }

    const absolutePath = path.resolve(anexo.caminho);

    // Evitar Directory Traversal certificando que o arquivo está na pasta pública de uploads
    const uploadsDir = path.resolve('public/uploads');
    if (!absolutePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Arquivo físico não localizado no servidor.' });
    }

    res.setHeader('Content-Type', anexo.tipo_mime);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(anexo.nome_original)}"`);
    return fs.createReadStream(absolutePath).pipe(res);

  } catch (error) {
    console.error('Erro ao baixar anexo com Prisma:', error);
    return res.status(500).json({ error: 'Erro interno ao processar download.' });
  }
};

// 7. Exportar relatórios para PGR (CSV seguro)
export const exportarCSV = async (req: Request, res: Response) => {
  const { status, tipo, data_inicio, data_fim } = req.query;

  try {
    // Montar filtros dinâmicos
    const where: any = {};

    if (status) {
      where.status = status as string;
    }
    if (tipo) {
      where.tipo = tipo as string;
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

    const result = await prisma.denuncia.findMany({
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

  } catch (error) {
    console.error('Erro ao exportar relatório CSV com Prisma:', error);
    return res.status(500).json({ error: 'Erro interno ao exportar relatório.' });
  }
};
