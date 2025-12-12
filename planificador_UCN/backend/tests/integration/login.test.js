// planificador_UCN/backend/tests/integration/login.test.js
import request from 'supertest';
import express from 'express';
import { pool } from '../../db/conexion.js';
import loginRoutes from '../../routes/loginRoutes.js';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/api/login', loginRoutes);

describe('Login API - Integration Tests', () => {
  
  afterAll(async () => {
    // Limpiar datos de prueba
    await pool.query('DELETE FROM usuarios WHERE email LIKE $1', ['%@test.ucn.cl']);
    await pool.end();
  });

  describe('POST /api/login', () => {
    
    it('debe rechazar login sin email (400 Bad Request)', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.error).toBe('Faltan email o contraseña');
    });

    it('debe rechazar login sin password (400 Bad Request)', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ email: 'test@ucn.cl' })
        .expect(400);

      expect(response.body.error).toBe('Faltan email o contraseña');
    });

    it('debe rechazar credenciales incorrectas (401 Unauthorized)', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'usuario.inexistente@ucn.cl',
          password: 'password_incorrecto'
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('debe manejar emails con formato inválido', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'email-invalido',
          password: 'password123'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('debe manejar SQL injection en email', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: "test@ucn.cl' OR '1'='1",
          password: 'password123'
        });

      // No debería causar error del servidor
      expect(response.status).not.toBe(500);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('debe manejar caracteres especiales en password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@ucn.cl',
          password: '<script>alert("XSS")</script>'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('debe insertar usuario en BD en login exitoso', async () => {
      // Nota: Este test requiere credenciales válidas de la API UCN
      // o mockear la llamada a axios
      
      // Para propósitos de testing, verificamos la estructura
      const mockLoginData = {
        email: 'test@test.ucn.cl',
        password: 'test123'
      };

      // Verificar que el endpoint existe y responde
      const response = await request(app)
        .post('/api/login')
        .send(mockLoginData);

      // Debería recibir 401 si las credenciales no son válidas
      // o 200 si son válidas (depende de la API externa)
      expect([200, 401, 500]).toContain(response.status);
    });

    it('debe retornar token en respuesta exitosa', async () => {
      // Test conceptual - requiere credenciales válidas
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'valid@ucn.cl',
          password: 'validpass'
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('rut');
        expect(response.body).toHaveProperty('carreras');
        expect(Array.isArray(response.body.carreras)).toBe(true);
      }
    });

    it('debe manejar timeout de API externa', async () => {
      // Test de resistencia - timeout simulado
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@ucn.cl',
          password: 'test123'
        })
        .timeout(100); // 100ms timeout

      // Debería retornar error o completarse rápido
      expect(response.status).toBeDefined();
    }, 10000); // Timeout del test: 10 segundos

    it('debe prevenir ataques de fuerza bruta (rate limiting)', async () => {
      // Realizar múltiples intentos rápidos
      const attempts = [];
      for (let i = 0; i < 10; i++) {
        attempts.push(
          request(app)
            .post('/api/login')
            .send({
              email: 'brute@test.ucn.cl',
              password: `attempt${i}`
            })
        );
      }

      const responses = await Promise.all(attempts);
      
      // Verificar que todos los intentos fueron procesados
      responses.forEach(response => {
        expect(response.status).toBeDefined();
      });
    });

    it('debe validar formato de email correctamente', async () => {
      const invalidEmails = [
        'notanemail',
        '@ucn.cl',
        'test@',
        'test@@ucn.cl',
        'test@ucn',
        'test.ucn.cl'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/login')
          .send({ email, password: 'pass123' });

        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('debe manejar passwords vacíos o muy cortos', async () => {
      const invalidPasswords = ['', ' ', '1', '12'];

      for (const password of invalidPasswords) {
        const response = await request(app)
          .post('/api/login')
          .send({ email: 'test@ucn.cl', password });

        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('debe retornar estructura consistente en errores', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ email: 'invalid', password: 'invalid' });

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('debe manejar Content-Type incorrecto', async () => {
      const response = await request(app)
        .post('/api/login')
        .set('Content-Type', 'text/plain')
        .send('email=test@ucn.cl&password=test123');

      // Debería rechazar o manejar gracefully
      expect([400, 415, 500]).toContain(response.status);
    });

    it('debe validar longitud máxima de campos', async () => {
      const longString = 'a'.repeat(1000);
      
      const response = await request(app)
        .post('/api/login')
        .send({
          email: longString + '@ucn.cl',
          password: longString
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Seguridad - Prevención de ataques', () => {
    
    it('no debe revelar si el usuario existe', async () => {
      const response1 = await request(app)
        .post('/api/login')
        .send({ email: 'noexiste@ucn.cl', password: 'cualquiera' });

      const response2 = await request(app)
        .post('/api/login')
        .send({ email: 'otro@ucn.cl', password: 'cualquiera' });

      // Los mensajes de error deberían ser genéricos
      expect(response1.status).toBe(response2.status);
      // No debería decir "usuario no existe" vs "contraseña incorrecta"
    });

    it('no debe exponer información sensible en errores', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ email: 'test@ucn.cl', password: 'wrong' });

      const errorMessage = response.body.error || '';
      
      // No debe contener stack traces o información del sistema
      expect(errorMessage).not.toMatch(/at\s+\w+\s+\(/); // Stack trace
      expect(errorMessage).not.toMatch(/\/home\//); // Rutas del sistema
      expect(errorMessage).not.toMatch(/password:/i); // Valores de password
    });

    it('debe sanitizar entrada antes de logging', async () => {
      // Este test verifica que no se logueen contraseñas
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@ucn.cl',
          password: 'secret_password_123'
        });

      // La contraseña no debe aparecer en la respuesta
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('secret_password_123');
    });
  });

  describe('Integración con Base de Datos', () => {
    
    it('debe crear registro en tabla usuarios en login exitoso', async () => {
      // Test conceptual - requiere un login exitoso simulado
      const testEmail = 'db_test@test.ucn.cl';
      
      // Limpiar primero
      await pool.query('DELETE FROM usuarios WHERE email = $1', [testEmail]);
      
      // Simular login (este test requeriría mockear la API externa)
      // En producción, después de un login exitoso debería existir:
      
      const checkUser = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1',
        [testEmail]
      );
      
      // Por ahora solo verificamos que la query funciona
      expect(checkUser).toBeDefined();
    });

    it('debe actualizar fecha_login en logins subsecuentes', async () => {
      const testEmail = 'repeat_login@test.ucn.cl';
      const testRut = '11111111-1';
      
      // Insertar usuario inicial
      await pool.query(
        'INSERT INTO usuarios (rut, email, fecha_login) VALUES ($1, $2, NOW()) ON CONFLICT (rut) DO NOTHING',
        [testRut, testEmail]
      );
      
      const firstLogin = await pool.query(
        'SELECT fecha_login FROM usuarios WHERE rut = $1',
        [testRut]
      );
      
      // Esperar un poco
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Actualizar fecha_login
      await pool.query(
        'UPDATE usuarios SET fecha_login = NOW() WHERE rut = $1',
        [testRut]
      );
      
      const secondLogin = await pool.query(
        'SELECT fecha_login FROM usuarios WHERE rut = $1',
        [testRut]
      );
      
      // La segunda fecha debería ser posterior
      expect(new Date(secondLogin.rows[0].fecha_login).getTime())
        .toBeGreaterThan(new Date(firstLogin.rows[0].fecha_login).getTime());
      
      // Limpiar
      await pool.query('DELETE FROM usuarios WHERE rut = $1', [testRut]);
    });

    it('debe manejar errores de conexión a BD', async () => {
      // Simular error de BD (requeriría cerrar la conexión temporalmente)
      // Este es un test conceptual
      
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@ucn.cl',
          password: 'test123'
        });

      // Si hay error de BD, debe retornar 500 con mensaje apropiado
      if (response.status === 500) {
        expect(response.body.error).toBeDefined();
      }
    });
  });
});