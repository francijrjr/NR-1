import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Configurações e Conexão de Banco de Dados
import { prisma } from './config/db';

// Middlewares
import * as security from './middleware/security';
import * as auth from './middleware/auth';

// Controladores
import * as publicController from './controllers/publicController';
import * as adminController from './controllers/adminController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.resolve('public/uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(security.helmetConfig);
app.use(security.generalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(security.sanitizeInput);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'evidencia-' + uniqueSuffix + ext);
  }
});

const uploadFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.gif', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Formato de arquivo não permitido. Extensões aceitas: PDF, Word, Excel, Imagens e Texto.'));
  }
  
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('MIME-Type de arquivo não suportado.'));
  }
  
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB por arquivo
  fileFilter: uploadFilter
});

const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  const uploadHandler = upload.array('anexos', 5);
  
  uploadHandler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Erro no Upload: Um ou mais arquivos excedem o limite de 10MB.' });
      }
      return res.status(400).json({ error: `Erro no Upload: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    return next();
  });
};

// ==========================================
// ROTAS DA API
// ==========================================

app.post('/api/denuncia', security.complaintLimiter, handleUpload, publicController.registrarDenuncia);
app.post('/api/acompanhar', publicController.consultarDenuncia);
app.post('/api/admin/login', security.loginLimiter, adminController.login);
app.get('/api/admin/dashboard', auth.requireAdmin, adminController.exibirDashboard);
app.get('/api/admin/denuncia/:id', auth.requireAdmin, adminController.exibirDetalhes);
app.post('/api/admin/denuncia/:id/status', auth.requireAdmin, adminController.atualizarStatus);
app.post('/api/admin/denuncia/:id/comentario', auth.requireAdmin, adminController.adicionarComentario);
app.get('/api/admin/anexo/baixar/:id', auth.requireAdmin, adminController.baixarAnexo);
app.get('/api/admin/exportar/csv', auth.requireAdmin, adminController.exportarCSV);


async function inicializarSistema() {
  try {
    console.log('Verificando se o usuário administrador padrão existe no banco de dados...');

    const adminEmail = process.env.ADMIN_EMAIL || 'compliance@empresa.com.br';
    const totalAdmins = await prisma.usuarioAdmin.count({
      where: { email: adminEmail }
    });

    if (totalAdmins === 0) {
      console.log('Administrador não encontrado. Criando usuário padrão...');
      
      const adminName = process.env.ADMIN_NAME || 'Administrador Compliance';
      const adminPassRaw = process.env.ADMIN_PASSWORD || 'AdminLeaoNR12026!';
      const adminPassHash = await bcrypt.hash(adminPassRaw, 10);

      await prisma.usuarioAdmin.create({
        data: {
          nome: adminName,
          email: adminEmail,
          senha: adminPassHash
        }
      });

      console.log('========================================================');
      console.log('USUÁRIO ADMINISTRADOR PADRÃO CRIADO COM SUCESSO:');
      console.log(`E-mail: ${adminEmail}`);
      console.log(`Senha: ${adminPassRaw} (Guarde e mude após o primeiro acesso!)`);
      console.log('========================================================');
    } else {
      console.log('Usuário administrador padrão já cadastrado no SQL Server.');
    }

    app.listen(PORT, () => {
      console.log(`Servidor API "Leão Escuta" rodando na porta ${PORT}`);
    });

  } catch (error: any) {
    console.error('Falha crítica na inicialização do sistema:', error.message);
    console.error('O Express não pôde ser iniciado porque a conexão/seeding com o banco falhou.');
  }
}

inicializarSistema();
