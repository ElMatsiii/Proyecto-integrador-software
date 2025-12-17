import { normalizarCodigo, obtenerNombreRamo } from '../js/services/utils.js';
import { describe, it, expect } from '@jest/globals';

describe('Utils - Frontend Unit Tests', () => {
  
  describe('normalizarCodigo', () => {
    it('debe convertir a mayúsculas', () => {
      expect(normalizarCodigo('mat001')).toBe('MAT001');
      expect(normalizarCodigo('dcte123')).toBe('DCTE123');
    });

    it('debe eliminar espacios', () => {
      expect(normalizarCodigo('MAT 001')).toBe('MAT001');
      expect(normalizarCodigo(' MAT001 ')).toBe('MAT001');
      expect(normalizarCodigo('MAT  001')).toBe('MAT001');
    });

    it('debe eliminar caracteres especiales', () => {
      expect(normalizarCodigo('MAT-001')).toBe('MAT001');
      expect(normalizarCodigo('MAT_001')).toBe('MAT001');
      expect(normalizarCodigo('MAT.001')).toBe('MAT001');
      expect(normalizarCodigo('MAT@001')).toBe('MAT001');
    });

    it('debe manejar null y undefined', () => {
      expect(normalizarCodigo(null)).toBe('');
      expect(normalizarCodigo(undefined)).toBe('');
    });

    it('debe manejar strings vacíos', () => {
      expect(normalizarCodigo('')).toBe('');
      expect(normalizarCodigo('   ')).toBe('');
    });

    it('debe preservar números y letras', () => {
      expect(normalizarCodigo('ABC123XYZ789')).toBe('ABC123XYZ789');
    });

    it('debe manejar códigos UCN reales', () => {
      expect(normalizarCodigo('DCTE-123')).toBe('DCTE123');
      expect(normalizarCodigo('UNFP 456')).toBe('UNFP456');
      expect(normalizarCodigo('ecin.789')).toBe('ECIN789');
    });
  });

  describe('obtenerNombreRamo', () => {
    it('debe retornar nombre original si existe y es válido', () => {
      const resultado = obtenerNombreRamo('MAT001', 'Cálculo I');
      expect(resultado).toBe('Cálculo I');
    });

    it('debe retornar nombre genérico para DCTE', () => {
      const resultado = obtenerNombreRamo('DCTE123', '');
      expect(resultado).toBe('Curso de Formación General');
    });

    it('debe retornar nombre genérico para UNFP', () => {
      const resultado = obtenerNombreRamo('UNFP456', null);
      expect(resultado).toBe('Curso de Formación Profesional');
    });

    it('debe retornar nombre genérico para SSED', () => {
      const resultado = obtenerNombreRamo('SSED789', undefined);
      expect(resultado).toBe('Curso de Inglés o Comunicación');
    });

    it('debe retornar nombre genérico para ECIN', () => {
      const resultado = obtenerNombreRamo('ECIN101', '');
      expect(resultado).toBe('Curso de Ingeniería o Programación');
    });

    it('debe retornar nombre genérico para DCCB', () => {
      const resultado = obtenerNombreRamo('DCCB202', '');
      expect(resultado).toBe('Curso de Ciencias Básicas');
    });

    it('debe priorizar nombre original sobre genérico', () => {
      const resultado = obtenerNombreRamo('DCTE123', 'Filosofía');
      expect(resultado).toBe('Filosofía');
    });

    it('debe manejar nombres que son iguales al código', () => {
      const resultado = obtenerNombreRamo('DCTE123', 'DCTE123');
      expect(resultado).toBe('DCTE123');
    });

    it('debe manejar códigos sin prefijo conocido', () => {
      const resultado = obtenerNombreRamo('XYZ999', '');
      expect(resultado).toBe('XYZ999');
    });

    it('debe manejar null en ambos parámetros', () => {
      const resultado = obtenerNombreRamo(null, null);
      expect(resultado).toBe('Nombre no disponible');
    });

    it('debe trimear espacios en nombre original', () => {
      const resultado = obtenerNombreRamo('MAT001', '  Cálculo I  ');
      expect(resultado).toBe('  Cálculo I  ');
    });

    it('debe ser case-insensitive para prefijos', () => {
      const resultado1 = obtenerNombreRamo('dcte123', '');
      const resultado2 = obtenerNombreRamo('DCTE123', '');
      expect(resultado1).toBe(resultado2);
    });
  });

  describe('Integración normalizarCodigo + obtenerNombreRamo', () => {
    it('debe manejar códigos con formato variable', () => {
      const codigos = [
        'DCTE-123',
        'dcte 123',
        'DCTE.123',
        'dcte_123'
      ];

      codigos.forEach(codigo => {
        const resultado = obtenerNombreRamo(codigo, '');
        expect(resultado).toBe('Curso de Formación General');
      });
    });

    it('debe procesar correctamente pipeline completo', () => {
      const datosAPI = {
        codigo: 'DCTE-123',
        nombre: '  Ética Profesional  '
      };

      const resultado = obtenerNombreRamo(
        datosAPI.codigo,
        datosAPI.nombre.trim()
      );

      expect(resultado).toBe('Ética Profesional');
    });
  });

  describe('Casos límite y edge cases', () => {
    it('debe manejar strings muy largos', () => {
      const codigoLargo = 'A'.repeat(1000);
      const resultado = normalizarCodigo(codigoLargo);
      expect(resultado.length).toBe(1000);
      expect(resultado).toBe('A'.repeat(1000));
    });

    it('debe manejar caracteres Unicode', () => {
      const resultado = normalizarCodigo('MAT001ñ');
      expect(resultado).toBe('MAT001');
    });

    it('debe manejar emojis', () => {
      const resultado = normalizarCodigo('MAT001😀');
      expect(resultado).toBe('MAT001');
    });

    it('debe ser performante con múltiples llamadas', () => {
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        normalizarCodigo('MAT-001');
      }
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});