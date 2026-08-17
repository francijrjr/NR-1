"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginLimiter = exports.complaintLimiter = exports.generalLimiter = exports.helmetConfig = void 0;
exports.sanitizeInput = sanitizeInput;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));

exports.helmetConfig = (0, helmet_1.default)({
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
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 150,
    message: {
        error: 'Muitas requisições originadas deste IP. Tente novamente após 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
exports.complaintLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        error: 'Limite de denúncias excedido para este IP. Aguarde uma hora para enviar um novo relato.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: 'Múltiplas tentativas de login detectadas. Tente novamente após 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
function sanitizeInput(req, _res, next) {
    const sanitizeValue = (value) => {
        if (typeof value === 'string') {
            return value
                .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
                .replace(/<\/?[^>]+(>|$)/g, '') 
                .trim();
        }
        if (Array.isArray(value)) {
            return value.map(sanitizeValue);
        }
        if (typeof value === 'object' && value !== null) {
            const cleanObj = {};
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    cleanObj[key] = sanitizeValue(value[key]);
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
        req.query = sanitizeValue(req.query);
    }
    if (req.params) {
        req.params = sanitizeValue(req.params);
    }
    next();
}
