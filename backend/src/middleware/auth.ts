import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Interface do payload decodificado do JWT
export interface AdminPayload {
  id: number;
  nome: string;
  email: string;
}

// Extensão do Request padrão do Express para incluir os dados do admin
export interface AuthenticatedRequest extends Request {
  adminUser?: AdminPayload;
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acesso não autorizado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'segredo_padrao_leao_escuta_2026_jwt';

  try {
    const decoded = jwt.verify(token, jwtSecret) as AdminPayload;
    req.adminUser = decoded;
    return next();
  } catch (err) {
    return res.status(403).json({ error: 'Acesso negado. Token inválido ou expirado.' });
  }
}
