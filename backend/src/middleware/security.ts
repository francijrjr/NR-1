import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// 1. Helmet com CSP configurado
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  }
});

// 2. Rate Limiter Geral (DoS)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: {
    error: 'Muitas requisições originadas deste IP. Tente novamente após 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 3. Rate Limiter para novas denúncias (anti-spam)
export const complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: 'Limite de denúncias excedido para este IP. Aguarde uma hora para enviar um novo relato.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 4. Rate Limiter para Login Admin (força bruta)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Múltiplas tentativas de login detectadas. Tente novamente após 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 5. Sanitizador recursivo de XSS
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  const sanitizeValue = (value: unknown): unknown => {
    if (typeof value === 'string') {
      return value
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '') // Remove scripts
        .replace(/<\/?[^>]+(>|$)/g, '')                     // Remove todas as tags HTML
        .trim();
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (typeof value === 'object' && value !== null) {
      const cleanObj: Record<string, unknown> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          cleanObj[key] = sanitizeValue((value as Record<string, unknown>)[key]);
        }
      }
      return cleanObj;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query) as typeof req.query;
  }
  if (req.params) {
    req.params = sanitizeValue(req.params) as typeof req.params;
  }
  next();
}
