"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
// Configurações e Conexão de Banco de Dados
const db_1 = require("./config/db");
// Middlewares
const security = __importStar(require("./middleware/security"));
const auth = __importStar(require("./middleware/auth"));
// Controladores
const publicController = __importStar(require("./controllers/publicController"));
const adminController = __importStar(require("./controllers/adminController"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Garantir que as pastas de uploads existam
const uploadsDir = path_1.default.resolve('public/uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// 1. Configuração do CORS flexível e seguro
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use((0, cors_1.default)({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
// 2. Middlewares de Segurança
app.use(security.helmetConfig);
app.use(security.generalLimiter);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(security.sanitizeInput);
// 3. Configuração do Multer (Upload Seguro de Evidências)
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, 'evidencia-' + uniqueSuffix + ext);
    }
});
const uploadFilter = (_req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.jpg', '.jpeg', '.png', '.gif', '.txt'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
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
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB por arquivo
    fileFilter: uploadFilter
});
// Middleware auxiliar de tratamento de erros de upload Multer
const handleUpload = (req, res, next) => {
    const uploadHandler = upload.array('anexos', 5);
    uploadHandler(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Erro no Upload: Um ou mais arquivos excedem o limite de 10MB.' });
            }
            return res.status(400).json({ error: `Erro no Upload: ${err.message}` });
        }
        else if (err) {
            return res.status(400).json({ error: err.message });
        }
        return next();
    });
};
// ==========================================
// ROTAS DA API
// ==========================================
// Rotas Públicas (Denunciante)
app.post('/api/denuncia', security.complaintLimiter, handleUpload, publicController.registrarDenuncia);
app.post('/api/acompanhar', publicController.consultarDenuncia);
// Rotas Administrativas (Autenticação JWT)
app.post('/api/admin/login', security.loginLimiter, adminController.login);
// Rotas Admin Protegidas
app.get('/api/admin/dashboard', auth.requireAdmin, adminController.exibirDashboard);
app.get('/api/admin/denuncia/:id', auth.requireAdmin, adminController.exibirDetalhes);
app.post('/api/admin/denuncia/:id/status', auth.requireAdmin, adminController.atualizarStatus);
app.post('/api/admin/denuncia/:id/comentario', auth.requireAdmin, adminController.adicionarComentario);
app.get('/api/admin/anexo/baixar/:id', auth.requireAdmin, adminController.baixarAnexo);
app.get('/api/admin/exportar/csv', auth.requireAdmin, adminController.exportarCSV);
// ==========================================
// INICIALIZAÇÃO E AUTO-SEMENTE (SEEDER)
// ==========================================
async function inicializarSistema() {
    try {
        console.log('Verificando se o usuário administrador padrão existe no banco de dados...');
        const adminEmail = process.env.ADMIN_EMAIL || 'compliance@empresa.com.br';
        const totalAdmins = await db_1.prisma.usuarioAdmin.count({
            where: { email: adminEmail }
        });
        if (totalAdmins === 0) {
            console.log('Administrador não encontrado. Criando usuário padrão...');
            const adminName = process.env.ADMIN_NAME || 'Administrador Compliance';
            const adminPassRaw = process.env.ADMIN_PASSWORD || 'AdminLeaoNR12026!';
            const adminPassHash = await bcryptjs_1.default.hash(adminPassRaw, 10);
            await db_1.prisma.usuarioAdmin.create({
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
        }
        else {
            console.log('Usuário administrador padrão já cadastrado no SQL Server.');
        }
        // Inicializar servidor
        app.listen(PORT, () => {
            console.log(`Servidor API "Leão Escuta" rodando na porta ${PORT}`);
        });
    }
    catch (error) {
        console.error('Falha crítica na inicialização do sistema:', error.message);
        console.error('O Express não pôde ser iniciado porque a conexão/seeding com o banco falhou.');
    }
}
inicializarSistema();
