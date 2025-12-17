# Planificador de Malla Curricular UCN

Sistema web para la planificación y visualización de mallas curriculares de la Universidad Católica del Norte.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Testing](#testing)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)

## Descripción

El Planificador UCN es una aplicación web fullstack que permite a los estudiantes:
- Visualizar su malla curricular
- Consultar su avance académico
- Crear proyecciones de planificación (manual y automática)
- Guardar y gestionar múltiples versiones de proyecciones

Incluye un panel administrativo para análisis de demanda de ramos por periodo y carrera.

## Características

### Para Estudiantes
- **Autenticación**: Login con credenciales institucionales UCN
- **Dashboard**: Vista general del progreso académico
- **Malla Curricular**: Visualización interactiva organizada por semestres
- **Resumen Académico**: Estadísticas detalladas de avance
- **Proyección Manual**: Planificación semestre por semestre con validación de prerrequisitos
- **Proyección Automática**: Generación inteligente basada en prerrequisitos y límite de créditos
- **Gestión de Versiones**: Guardar, visualizar y eliminar proyecciones
- **Modo Oscuro**: Tema claro/oscuro con preferencia del sistema

### Para Administradores
- **Dashboard Administrativo**: Estadísticas generales del sistema
- **Análisis de Demanda**: Visualización de ramos más demandados por periodo
- **Filtros Avanzados**: Por periodo académico y carrera

## Tecnologías

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 5.1.0
- **Base de Datos**: PostgreSQL (Neon)
- **Autenticación**: JWT (jsonwebtoken 9.0.2)
- **Seguridad**: bcryptjs 3.0.2
- **Testing**: Jest 29.7.0, Supertest 6.3.3

### Frontend
- **JavaScript**: Vanilla JS (ES6+)
- **CSS**: Custom CSS con variables CSS
- **Módulos**: ES Modules nativos
- **Arquitectura**: MVC pattern

### Infraestructura
- **Base de Datos**: Neon PostgreSQL (serverless)
- **APIs Externas**: 
  - API Hawaii UCN (mallas)
  - API Puclaro UCN (avance académico)

## Requisitos Previos

### Software Necesario
- **Node.js**: 18.x o superior ([Descargar](https://nodejs.org/))
- **npm**: 9.x o superior (incluido con Node.js)
- **PostgreSQL**: 14.x o superior (solo para desarrollo local con tests)
- **Git**: Para clonar el repositorio

### Verificar Instalación
```bash
node --version  # Debe mostrar v18.x.x o superior
npm --version   # Debe mostrar 9.x.x o superior
psql --version  # Debe mostrar 14.x o superior
```

## Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/ElMatsiii/Proyecto-integrador-software.git
cd Proyecto-integrador-software/planificador_UCN
```

### 2. Instalar Dependencias del Backend
```bash
cd backend
npm install
```

Esto instalará todas las dependencias listadas en `package.json`:
- **Producción**: express, pg, jsonwebtoken, bcryptjs, cors, dotenv, axios
- **Desarrollo**: jest, @jest/globals, supertest, cross-env

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido:

```env
# Base de Datos (Neon PostgreSQL)
DATABASE_URL='postgresql://usuario:password@host.neon.tech/database?sslmode=require'

# Seguridad
JWT_SECRET=tu-clave-secreta-segura-aqui

# Entorno
NODE_ENV=production
PORT=3000
```

**Nota**: El proyecto usa Neon PostgreSQL por defecto. Si prefieres usar PostgreSQL local:

```env
DATABASE_URL='postgresql://postgres:password@localhost:5432/planificador_ucn'
```

### 4. Inicializar la Base de Datos

**Con Neon PostgreSQL** (producción):
```bash
cd backend
node init-neon.js
```

**Con PostgreSQL Local** (desarrollo):
```bash
# Crear base de datos
createdb planificador_ucn

# Ejecutar schema
psql -d planificador_ucn -f db/init.sql
```

Este comando:
- Crea todas las tablas necesarias
- Configura índices y vistas
- Inserta usuario administrador por defecto:
  - Email: `admin@ucn.cl`
  - Password: `admin123`

### 5. Verificar la Instalación

```bash
# Verificar conexión a base de datos
node -e "import('./db/conexion.js').then(() => console.log('Conexión exitosa'))"

# Iniciar servidor
npm start
```

Si todo está correcto, deberías ver:
```
========================================
Servidor activo en: http://localhost:3000
========================================
Conectado a Neon PostgreSQL
Neon conectado exitosamente: [timestamp]
```

## Configuración

### Estructura de Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `DATABASE_URL` | URL de conexión PostgreSQL | - |
| `JWT_SECRET` | Clave secreta para tokens JWT | `clave-super-segura-ucn` |
| `NODE_ENV` | Entorno de ejecución | `production` |
| `PORT` | Puerto del servidor | `3000` |

### Configuración del Frontend

El archivo `frontend/config/config.js` contiene:

```javascript
export const CONFIG = {
  API_URL: "http://localhost:3000/api",
  UNIVERSITY: "Universidad Católica del Norte",
};
```

Para producción, actualiza `API_URL` con tu dominio.

## Ejecución

### Desarrollo

**Backend**:
```bash
cd backend
npm start
```

**Frontend**:
```bash
# Opción 1: Servidor Node.js incluido (recomendado)
# Ya está configurado en el backend, solo navega a:
# http://localhost:3000

# Opción 2: Live Server (VS Code)
# Instala la extensión "Live Server"
# Click derecho en frontend/html/index.html > Open with Live Server
```

### Producción

Para despliegue en producción:

1. **Configurar variables de entorno** en tu servidor
2. **Inicializar base de datos** con `init-neon.js`
3. **Iniciar aplicación**:
```bash
NODE_ENV=production npm start
```

## Testing

El proyecto incluye una suite completa de tests unitarios, de integración y end-to-end.

### Configuración Inicial de Tests

**Opción 1: Script Automático** (Linux/Mac):
```bash
cd backend
chmod +x ../setup-tests.sh
../setup-tests.sh
```

**Opción 2: Manual**:
```bash
cd backend

# 1. Instalar dependencias de testing
npm install --save-dev jest@^29.7.0 @jest/globals@^29.7.0 supertest@^6.3.3

# 2. Crear base de datos de prueba
createdb -U postgres planificador_test

# 3. Ejecutar schema
psql -U postgres -d planificador_test -f db/init.sql

# 4. Crear archivo .env.test
cat > .env.test << EOF
NODE_ENV=test
DATABASE_URL='postgresql://postgres:password@localhost:5432/planificador_test'
JWT_SECRET=test-secret-key
PORT=3001
EOF
```

### Ejecutar Tests

```bash
cd backend

# Todos los tests
npm test

# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e

# Con cobertura
npm run test:coverage

# Modo watch (desarrollo)
npm run test:watch
```

### Estructura de Tests

```
backend/tests/
├── unit/                    # Tests unitarios
│   ├── jwt.test.js         # Generación y verificación de tokens
│   └── authMiddleware.test.js  # Middleware de autenticación
├── integration/             # Tests de integración
│   ├── login.test.js       # Flujo completo de login
│   └── proyecciones.test.js    # CRUD de proyecciones
└── e2e/                     # Tests end-to-end (futuro)
```

### Cobertura de Tests

Objetivo de cobertura configurado:
- **Branches**: 70%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

Ver reporte de cobertura:
```bash
npm run test:coverage
# Abre: backend/coverage/lcov-report/index.html
```

### Tests del Frontend

```bash
cd frontend
npm test  # Ejecuta utils.test.js
```

## Estructura del Proyecto

```
planificador_UCN/
├── backend/
│   ├── config/              # Configuración (JWT, etc.)
│   ├── db/                  # Base de datos
│   │   ├── conexion.js      # Pool de conexiones PostgreSQL
│   │   └── init.sql         # Schema de la base de datos
│   ├── middleware/          # Middlewares Express
│   │   ├── authMiddleware.js    # Autenticación JWT
│   │   └── adminMiddleware.js   # Autorización admin
│   ├── routes/              # Endpoints de la API
│   │   ├── loginRoutes.js   # Autenticación
│   │   ├── mallaRoutes.js   # Mallas curriculares
│   │   ├── avanceRoutes.js  # Avance académico
│   │   ├── proyeccionesRoutes.js  # Proyecciones
│   │   └── adminRoutes.js   # Panel admin
│   ├── tests/               # Suite de tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── .env                 # Variables de entorno (no incluido)
│   ├── package.json         # Dependencias y scripts
│   ├── proxy.js             # Servidor principal
│   ├── init-neon.js         # Script de inicialización DB
│   └── reset-neon.js        # Script de reset DB
│
└── frontend/
    ├── config/              # Configuración frontend
    │   └── config.js        # API URLs
    ├── css/                 # Estilos
    │   ├── base.css         # Estilos base y variables
    │   ├── layout.css       # Layout y navegación
    │   ├── components.css   # Componentes reutilizables
    │   ├── critical-theme.css  # Carga crítica de tema
    │   └── [específicos].css   # Estilos por página
    ├── html/                # Páginas HTML
    │   ├── index.html       # Login
    │   ├── inicio.html      # Dashboard estudiante
    │   ├── malla.html       # Malla curricular
    │   ├── resumen.html     # Resumen académico
    │   ├── proyecciones.html    # Proyecciones
    │   ├── versiones.html   # Gestión de versiones
    │   ├── perfil.html      # Perfil usuario
    │   └── admin-dashboard.html  # Panel admin
    ├── js/
    │   ├── core/            # Funcionalidad核心
    │   │   ├── theme-initializer.js  # Inicialización de tema
    │   │   └── darkModeController.js # Control modo oscuro
    │   ├── modules/         # Controladores por página
    │   │   ├── loginController.js
    │   │   ├── inicioController.js
    │   │   ├── mallaController.js
    │   │   ├── resumenController.js
    │   │   ├── proyeccionController.js
    │   │   ├── versionesController.js
    │   │   └── perfilController.js
    │   ├── services/        # Servicios compartidos
    │   │   ├── apiService.js    # Cliente API
    │   │   ├── storageService.js    # SessionStorage
    │   │   └── utils.js     # Utilidades
    │   └── main.js          # Punto de entrada
    └── tests/               # Tests frontend
        └── utils.test.js
```

## API Endpoints

### Autenticación

#### Login Estudiante
```http
POST /api/login
Content-Type: application/json

{
  "email": "estudiante@ucn.cl",
  "password": "password"
}

Response 200:
{
  "token": "eyJhbGc...",
  "rut": "12345678-9",
  "nombre": "Juan Pérez",
  "carreras": [
    {
      "codigo": "ICI",
      "nombre": "Ingeniería Civil en Computación",
      "catalogo": "2020"
    }
  ]
}
```

#### Login Administrador
```http
POST /api/admin/login
Content-Type: application/json

{
  "usuario": "admin@ucn.cl",
  "password": "admin123"
}

Response 200:
{
  "token": "eyJhbGc...",
  "admin": {
    "id": 1,
    "email": "admin@ucn.cl",
    "nombre": "Administrador UCN"
  }
}
```

### Mallas y Avance (Requieren autenticación)

#### Obtener Malla Curricular
```http
GET /api/malla?codigo=ICI&catalogo=2020
Authorization: Bearer {token}

Response 200:
[
  {
    "codigo": "MAT001",
    "asignatura": "Cálculo I",
    "creditos": 6,
    "nivel": 1,
    "prereq": ""
  },
  ...
]
```

#### Obtener Avance Académico
```http
GET /api/avance?rut=12345678-9&codcarrera=ICI
Authorization: Bearer {token}

Response 200:
[
  {
    "course": "MAT001",
    "course_name": "Cálculo I",
    "period": "202310",
    "status": "APROBADO",
    "credits": 6
  },
  ...
]
```

### Proyecciones (Requieren autenticación)

#### Crear Proyección
```http
POST /api/proyecciones
Authorization: Bearer {token}
Content-Type: application/json

{
  "codigo_carrera": "ICI",
  "tipo": "manual",
  "nombre": "Proyección 2025",
  "total_creditos": 180,
  "total_ramos": 30,
  "semestres_proyectados": 6,
  "fecha_egreso_estimada": "Diciembre 2026",
  "periodo_proyectado": "2025-2",
  "datos_completos": {
    "ramos": [...],
    "plan": [...]
  }
}

Response 200:
{
  "success": true,
  "proyeccion": { ... },
  "mensaje": "Proyección guardada correctamente"
}
```

#### Listar Proyecciones
```http
GET /api/proyecciones?codigo_carrera=ICI
Authorization: Bearer {token}

Response 200:
[
  {
    "id": 1,
    "tipo": "manual",
    "nombre": "Proyección 2025",
    "fecha_creacion": "2025-01-15T10:30:00.000Z",
    "total_creditos": 180,
    "total_ramos": 30,
    "semestres_proyectados": 6,
    "fecha_egreso_estimada": "Diciembre 2026",
    "periodo_proyectado": "2025-2",
    "datos_completos": { ... }
  },
  ...
]
```

#### Obtener Proyección Específica
```http
GET /api/proyecciones/:id
Authorization: Bearer {token}

Response 200:
{
  "id": 1,
  "tipo": "manual",
  "nombre": "Proyección 2025",
  ...
}
```

#### Eliminar Proyección
```http
DELETE /api/proyecciones/:id
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "mensaje": "Proyección eliminada correctamente"
}
```

### Administración (Requieren token de admin)

#### Obtener Estadísticas
```http
GET /api/admin/estadisticas
Authorization: Bearer {admin_token}

Response 200:
{
  "total_proyecciones": 150,
  "total_estudiantes": 45,
  "proyecciones_por_carrera": [...],
  "ramos_mas_demandados": [...]
}
```

#### Obtener Demanda de Ramos
```http
GET /api/admin/demanda-ramos?periodo=2025-1&codigo_carrera=ICI
Authorization: Bearer {admin_token}

Response 200:
[
  {
    "codigo_ramo": "MAT001",
    "nombre_ramo": "Cálculo I",
    "codigo_carrera": "ICI",
    "periodo_ramo": "2025-1",
    "cantidad_estudiantes": 35,
    "creditos_totales": 210,
    "creditos_promedio": 6
  },
  ...
]
```

#### Obtener Periodos Disponibles
```http
GET /api/admin/periodos-disponibles
Authorization: Bearer {admin_token}

Response 200:
["2025-2", "2025-1", "2024-2", "2024-1"]
```

### Códigos de Estado HTTP

- `200 OK`: Operación exitosa
- `201 Created`: Recurso creado exitosamente
- `400 Bad Request`: Parámetros inválidos o faltantes
- `401 Unauthorized`: Token no proporcionado
- `403 Forbidden`: Token inválido o permisos insuficientes
- `404 Not Found`: Recurso no encontrado
- `500 Internal Server Error`: Error del servidor

## Base de Datos

### Schema Principal

**Tabla: usuarios**
```sql
rut TEXT PRIMARY KEY
email TEXT NOT NULL UNIQUE
nombre TEXT
fecha_login TIMESTAMP NOT NULL DEFAULT NOW()
```

**Tabla: carreras**
```sql
id SERIAL PRIMARY KEY
codigo TEXT NOT NULL
nombre TEXT NOT NULL
catalogo TEXT
rut_usuario TEXT NOT NULL REFERENCES usuarios(rut)
UNIQUE(rut_usuario, codigo)
```

**Tabla: proyecciones**
```sql
id SERIAL PRIMARY KEY
rut_usuario TEXT NOT NULL REFERENCES usuarios(rut)
codigo_carrera TEXT NOT NULL
tipo TEXT NOT NULL CHECK (tipo IN ('manual', 'automatica'))
nombre TEXT NOT NULL
fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
total_creditos INT
total_ramos INT
semestres_proyectados INT
fecha_egreso_estimada TEXT
datos_completos JSONB NOT NULL
es_favorita BOOLEAN DEFAULT FALSE
periodo_proyectado TEXT
```

**Tabla: administradores**
```sql
id SERIAL PRIMARY KEY
email TEXT NOT NULL UNIQUE
password_hash TEXT NOT NULL
nombre TEXT NOT NULL
fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
ultimo_acceso TIMESTAMP
```

### Scripts de Gestión

```bash
# Inicializar base de datos
node backend/init-neon.js

# Resetear base de datos (CUIDADO: elimina todos los datos)
node backend/reset-neon.js

# Verificar usuarios
node backend/verificar-usuarios.js
```

## Seguridad

### Implementaciones de Seguridad

1. **Autenticación JWT**
   - Tokens con expiración de 2 horas
   - Validación en cada request protegido
   - Almacenamiento seguro en sessionStorage

2. **Contraseñas**
   - Hashing con bcrypt (10 rounds)
   - No se almacenan contraseñas en texto plano
   - Validación en servidor

3. **Base de Datos**
   - Conexiones SSL requeridas (Neon)
   - Prepared statements para prevenir SQL injection
   - Validación de tipos con CHECK constraints

4. **CORS**
   - Configurado para permitir solo orígenes necesarios
   - Headers de seguridad configurados

### Mejores Prácticas

- **No commitear** archivos `.env`
- **Cambiar** credenciales por defecto en producción
- **Rotar** JWT_SECRET regularmente
- **Actualizar** dependencias periódicamente:
  ```bash
  npm audit
  npm audit fix
  ```

## Troubleshooting

### Problemas Comunes

#### 1. Error de conexión a base de datos
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solución**:
- Verifica que PostgreSQL está corriendo
- Revisa las credenciales en `.env`
- Confirma el puerto correcto (5432 por defecto)

#### 2. Tests fallan con timeout
```
Timeout - Async callback was not invoked within the 5000ms timeout
```
**Solución**:
```bash
# Aumentar timeout en jest.config.js o:
npm test -- --testTimeout=10000
```

#### 3. "MODULE_NOT_FOUND"
```
Error: Cannot find module 'express'
```
**Solución**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### 4. Puerto en uso
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solución**:
```bash
# Encontrar proceso
lsof -i :3000
# Matar proceso
kill -9 [PID]
```

#### 5. CORS Error en Frontend
```
Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:5500' has been blocked by CORS policy
```
**Solución**:
- Verifica que el backend tiene CORS habilitado
- Confirma que `API_URL` en `config.js` es correcta
- Backend debe estar corriendo

## Autores
- Daniela Infante (Scrum Master) 
- Maximiliano Pizarro (Product Owner)
- Maximo Sazo (Developer) 

**Equipo Planificador UCN**
- GitHub: [ElMatsiii](https://github.com/ElMatsiii)
- Repositorio: [Proyecto-integrador-software](https://github.com/ElMatsiii/Proyecto-integrador-software)
