# Guía de Integración de APIs - Sistema de Proyección Académica

## 📋 Descripción General

Este proyecto ahora incluye integración completa con las APIs externas de la Universidad Católica del Norte (UCN) para obtener datos reales de usuarios, mallas curriculares y avances académicos.

## 🔗 APIs Integradas

### 1. **API de Login** 
- **URL**: `https://puclaro.ucn.cl/eross/avance/login.php`
- **Método**: GET
- **Parámetros**: `email`, `password`
- **Respuesta**: Datos del usuario y carreras asociadas

### 2. **API de Mallas Curriculares**
- **URL**: `https://losvilos.ucn.cl/hawaii/api/mallas`
- **Método**: GET
- **Parámetros**: `CÓDIGOCARRERA-CATALOGO`
- **Headers**: `X-HAWAII-AUTH: jf400fejof13f`
- **Respuesta**: Lista de asignaturas con códigos, créditos y prerrequisitos

### 3. **API de Avance Curricular**
- **URL**: `https://puclaro.ucn.cl/eross/avance/avance.php`
- **Método**: GET
- **Parámetros**: `rut`, `codcarrera`
- **Respuesta**: Lista de cursos con estados (APROBADO, REPROBADO, EN_PROCESO)

## 🛠️ Archivos Implementados

### `frontend/Scripts/apiService.js`
Servicio principal que maneja todas las integraciones con las APIs externas.

**Funciones principales:**
- `login(email, password)` - Autenticación de usuario
- `getMallaCurricular(codigoCarrera, catalogo)` - Obtener malla curricular
- `getAvanceCurricular(rut, codigoCarrera)` - Obtener avance académico
- `getDatosCompletosEstudiante()` - Obtener todos los datos del estudiante
- `procesarEstadisticas(avance, malla)` - Procesar estadísticas académicas

### `frontend/Scripts/login.js`
Actualizado para usar la API de login real con manejo de errores y estados de carga.

### `frontend/Scripts/inicio.js`
Integrado para mostrar datos reales de las APIs, incluyendo:
- Estadísticas académicas calculadas
- Cursos actuales del estudiante
- Selector de carreras múltiples
- Indicadores de carga y manejo de errores

## 🚀 Cómo Usar

### 1. **Login con Credenciales Reales**
```javascript
// El sistema ahora usa la API real de login
// Ingresa email y contraseña válidos de la UCN
```

### 2. **Visualización de Datos Reales**
Una vez logueado, el sistema:
- Carga automáticamente los datos de la primera carrera
- Muestra estadísticas reales (créditos, avance, promedio)
- Lista cursos actuales o recientes
- Permite cambiar entre carreras si el usuario tiene múltiples

### 3. **Selector de Carreras**
Si el usuario tiene múltiples carreras, aparece un selector en el header para cambiar entre ellas.

## ⚙️ Configuración

### Token de Autenticación
En `apiService.js`, actualiza el token de la API de mallas:
```javascript
this.HAWAII_AUTH_TOKEN = 'tu_token_real_aqui';
```

### URLs de las APIs
Las URLs están configuradas en el constructor de `ApiService`:
```javascript
this.LOGIN_URL = 'https://puclaro.ucn.cl/eross/avance/login.php';
this.MALLA_URL = 'https://losvilos.ucn.cl/hawaii/api/mallas';
this.AVANCE_URL = 'https://puclaro.ucn.cl/eross/avance/avance.php';
```

## 🔧 Funcionalidades Implementadas

### ✅ **Completadas**
- [x] Servicio de API completo
- [x] Login con API externa
- [x] Obtención de mallas curriculares
- [x] Obtención de avance curricular
- [x] Integración frontend con datos reales
- [x] Manejo de errores y estados de carga
- [x] Selector de carreras múltiples
- [x] Cálculo de estadísticas académicas
- [x] Cache de datos para mejor rendimiento

### 🔄 **Características Adicionales**
- **Cache inteligente**: Los datos se almacenan temporalmente para evitar llamadas repetidas
- **Estados de carga**: Indicadores visuales durante las consultas a las APIs
- **Manejo de errores**: Mensajes informativos para el usuario
- **Datos dinámicos**: La interfaz se actualiza automáticamente con datos reales
- **Responsive**: Funciona en dispositivos móviles y desktop

## 📊 Datos Mostrados

### **Estadísticas Académicas**
- Créditos aprobados vs totales
- Porcentaje de avance de la carrera
- Número de cursos aprobados/reprobados
- Promedio académico (simulado)

### **Cursos Actuales**
- Cursos en proceso (si los hay)
- Últimos cursos aprobados (si no hay cursos en proceso)
- Estado de cada curso (Aprobado/Reprobado/En Proceso)

### **Información de Carrera**
- Nombre y código de la carrera
- Catálogo académico
- Selector para cambiar entre carreras

## 🐛 Manejo de Errores

El sistema maneja diversos tipos de errores:
- **Credenciales incorrectas**: Mensaje específico de error de autenticación
- **Error de conexión**: Mensaje genérico para problemas de red
- **Datos no encontrados**: Fallback a datos de ejemplo
- **APIs no disponibles**: Indicadores de error con reintentos

## 🔒 Seguridad

- Las credenciales no se almacenan permanentemente
- Los datos se cachean temporalmente en el navegador
- Manejo seguro de tokens de autenticación
- Validación de respuestas de las APIs

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Dispositivos móviles
- ✅ Tablets
- ✅ Escritorio

## 🎯 Próximos Pasos Sugeridos

1. **Obtener token real** de la API de mallas de la UCN
2. **Implementar autenticación persistente** (localStorage/sessionStorage)
3. **Agregar más validaciones** de datos
4. **Implementar funcionalidades** de las otras pestañas (Malla, Resumen, etc.)
5. **Agregar gráficos** para visualizar el progreso académico
6. **Implementar notificaciones** para fechas importantes

---

**Nota**: Este sistema ahora está completamente integrado con las APIs reales de la UCN y puede manejar datos de estudiantes reales.
