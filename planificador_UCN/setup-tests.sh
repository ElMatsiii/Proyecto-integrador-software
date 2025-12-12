#!/bin/bash
# planificador_UCN/setup-tests.sh
# Script para configurar el entorno de testing

echo "🧪 Configurando entorno de testing para Planificador UCN"
echo "========================================================="

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Node.js
echo -e "\n${BLUE}[1/7]${NC} Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js no encontrado. Por favor instálalo primero.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node --version) encontrado"

# 2. Verificar PostgreSQL
echo -e "\n${BLUE}[2/7]${NC} Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL no encontrado. Por favor instálalo primero.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} PostgreSQL encontrado"

# 3. Instalar dependencias de producción
echo -e "\n${BLUE}[3/7]${NC} Instalando dependencias de producción..."
cd backend
npm install

# 4. Instalar dependencias de desarrollo (testing)
echo -e "\n${BLUE}[4/7]${NC} Instalando dependencias de testing..."
npm install --save-dev jest@^29.7.0 @jest/globals@^29.7.0 supertest@^6.3.3

# 5. Crear estructura de carpetas de tests
echo -e "\n${BLUE}[5/7]${NC} Creando estructura de carpetas..."
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p coverage
echo -e "${GREEN}✓${NC} Carpetas creadas"

# 6. Crear base de datos de prueba
echo -e "\n${BLUE}[6/7]${NC} Configurando base de datos de prueba..."
echo "Creando base de datos 'planificador_test'..."

# Intentar crear la base de datos
PGPASSWORD=postgres psql -U postgres -h localhost -p 5433 -c "DROP DATABASE IF EXISTS planificador_test;" 2>/dev/null
PGPASSWORD=postgres psql -U postgres -h localhost -p 5433 -c "CREATE DATABASE planificador_test;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Base de datos creada"
    
    # Ejecutar schema
    echo "Ejecutando schema en base de datos de prueba..."
    PGPASSWORD=postgres psql -U postgres -h localhost -p 5433 -d planificador_test -f db/init.sql 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Schema ejecutado"
    else
        echo -e "${YELLOW}⚠${NC} No se pudo ejecutar el schema. Verifica la ruta de init.sql"
    fi
else
    echo -e "${YELLOW}⚠${NC} No se pudo crear la base de datos. Verifica tu configuración de PostgreSQL"
    echo "    Usuario: postgres"
    echo "    Puerto: 5433"
    echo "    Puedes crear la BD manualmente con:"
    echo "    createdb -U postgres -p 5433 planificador_test"
fi

# 7. Crear archivo .env.test
echo -e "\n${BLUE}[7/7]${NC} Creando archivo .env.test..."
cat > .env.test << EOF
# Configuración para tests
NODE_ENV=test
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=planificador_test
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
JWT_SECRET=test-secret-key-do-not-use-in-production
EOF
echo -e "${GREEN}✓${NC} Archivo .env.test creado"

# Resumen
echo -e "\n${GREEN}========================================================="
echo "✅ Setup completado!"
echo "=========================================================${NC}"
echo ""
echo "Comandos disponibles:"
echo "  npm test                  - Ejecutar todos los tests"
echo "  npm run test:unit         - Ejecutar tests unitarios"
echo "  npm run test:integration  - Ejecutar tests de integración"
echo "  npm run test:coverage     - Ejecutar tests con cobertura"
echo "  npm run test:watch        - Ejecutar tests en modo watch"
echo ""
echo "Archivos de test ubicados en:"
echo "  📁 backend/tests/unit/          - Tests unitarios"
echo "  📁 backend/tests/integration/   - Tests de integración"
echo "  📁 backend/tests/e2e/           - Tests end-to-end"
echo ""
echo "Para comenzar, ejecuta: npm test"
echo ""

# Ejecutar un test de prueba
echo -e "${BLUE}Ejecutando test de verificación...${NC}"
npm test -- --passWithNoTests

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Todo configurado correctamente!${NC}"
else
    echo -e "\n${YELLOW}⚠ Hubo algunos problemas. Revisa los mensajes anteriores.${NC}"
fi

cd ..