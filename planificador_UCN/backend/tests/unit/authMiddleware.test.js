// planificador_UCN/backend/tests/unit/authMiddleware.test.js
import { autenticarToken } from '../../middleware/authMiddleware.js';
import { generarToken } from '../../config/jwt.js';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Auth Middleware - Unit Tests', () => {
  let mockReq, mockRes, nextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  describe('autenticarToken', () => {
    it('debe rechazar request sin token', () => {
      autenticarToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token no proporcionado' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('debe rechazar token inválido', () => {
      mockReq.headers.authorization = 'Bearer token_invalido';
      
      autenticarToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token inválido o expirado' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('debe aceptar token válido y llamar next()', () => {
      const testUser = { rut: '12345678-9', email: 'test@ucn.cl' };
      const validToken = generarToken(testUser);
      mockReq.headers.authorization = `Bearer ${validToken}`;
      
      autenticarToken(mockReq, mockRes, nextFunction);

      expect(mockReq.usuario).toBeDefined();
      expect(mockReq.usuario.rut).toBe(testUser.rut);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('debe manejar header sin Bearer', () => {
      const validToken = generarToken({ rut: '12345678-9' });
      mockReq.headers.authorization = validToken; // Sin "Bearer "
      
      autenticarToken(mockReq, mockRes, nextFunction);

      // Retorna 401 porque no encuentra el token después del split
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('debe manejar authorization header vacío', () => {
      mockReq.headers.authorization = '';
      
      autenticarToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('debe manejar authorization header solo con Bearer', () => {
      mockReq.headers.authorization = 'Bearer ';
      
      autenticarToken(mockReq, mockRes, nextFunction);

      // Retorna 401 porque el token después del split está vacío
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('debe ser case-sensitive con el header', () => {
      const validToken = generarToken({ rut: '12345678-9' });
      mockReq.headers.Authorization = `Bearer ${validToken}`; // Capital A
      
      autenticarToken(mockReq, mockRes, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Aislamiento - No debe depender de recursos externos', () => {
    it('no debe realizar llamadas a base de datos', () => {
      const validToken = generarToken({ rut: '12345678-9' });
      mockReq.headers.authorization = `Bearer ${validToken}`;
      
      // Si el middleware estuviera haciendo llamadas DB, esto fallaría
      expect(() => {
        autenticarToken(mockReq, mockRes, nextFunction);
      }).not.toThrow();
    });

    it('debe ser síncrono y rápido', () => {
      const validToken = generarToken({ rut: '12345678-9' });
      mockReq.headers.authorization = `Bearer ${validToken}`;
      
      const start = Date.now();
      autenticarToken(mockReq, mockRes, nextFunction);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10); // Menos de 10ms
    });
  });
});