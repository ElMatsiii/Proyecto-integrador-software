import { generarToken, verificarToken } from '../../config/jwt.js';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('JWT Service - Unit Tests', () => {
  let testUser;

  beforeEach(() => {
    testUser = {
      rut: '12345678-9',
      email: 'test@ucn.cl'
    };
  });

  describe('generarToken', () => {
    it('debe generar un token válido con datos de usuario', () => {
      const token = generarToken(testUser);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    it('debe incluir los datos del usuario en el token', () => {
      const token = generarToken(testUser);
      const decoded = verificarToken(token);
      
      expect(decoded.rut).toBe(testUser.rut);
      expect(decoded.email).toBe(testUser.email);
    });

    it('debe generar tokens diferentes para llamadas diferentes', async () => {
      const token1 = generarToken(testUser);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const token2 = generarToken(testUser);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verificarToken', () => {
    it('debe verificar correctamente un token válido', () => {
      const token = generarToken(testUser);
      const decoded = verificarToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded.rut).toBe(testUser.rut);
    });

    it('debe retornar null para un token inválido', () => {
      const invalidToken = 'token.invalido.aqui';
      const result = verificarToken(invalidToken);
      
      expect(result).toBeNull();
    });

    it('debe retornar null para un token expirado', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyMzkwMjJ9.invalid';
      const result = verificarToken(expiredToken);
      
      expect(result).toBeNull();
    });

    it('debe manejar tokens malformados', () => {
      const malformedTokens = [
        '',
        null,
        undefined,
        'not-a-token',
        'only.two.parts'
      ];

      malformedTokens.forEach(token => {
        const result = verificarToken(token);
        expect(result).toBeNull();
      });
    });
  });

  describe('Casos límite', () => {
    it('debe manejar usuarios con datos mínimos', () => {
      const minimalUser = { rut: '1-9' };
      const token = generarToken(minimalUser);
      const decoded = verificarToken(token);
      
      expect(decoded.rut).toBe('1-9');
    });

    it('debe manejar usuarios con caracteres especiales', () => {
      const specialUser = {
        rut: '12.345.678-9',
        email: 'test+special@ucn.cl'
      };
      const token = generarToken(specialUser);
      const decoded = verificarToken(token);
      
      expect(decoded.rut).toBe(specialUser.rut);
      expect(decoded.email).toBe(specialUser.email);
    });
  });
});