"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido.' });
    }
    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'segredo_padrao_leao_escuta_2026_jwt';
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.adminUser = decoded;
        return next();
    }
    catch (err) {
        return res.status(403).json({ error: 'Acesso negado. Token inválido ou expirado.' });
    }
}
