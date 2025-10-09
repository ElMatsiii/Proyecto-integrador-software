/**
 * Servicio de API para integración con endpoints externos de la UCN
 * Maneja login, mallas curriculares y avance académico
 */

class ApiService {
    constructor() {
        // URLs base de las APIs
        this.LOGIN_URL = 'https://puclaro.ucn.cl/eross/avance/login.php';
        this.MALLA_URL = 'https://losvilos.ucn.cl/hawaii/api/mallas';
        this.AVANCE_URL = 'https://puclaro.ucn.cl/eross/avance/avance.php';
        
        // Token de autenticación para la API de mallas (debes obtenerlo)
        this.HAWAII_AUTH_TOKEN = 'jf400fejof13f'; // Reemplazar con token real
        
        // Cache para almacenar datos temporalmente
        this.cache = {
            userData: null,
            mallas: {},
            avances: {}
        };
    }

    /**
     * Realiza login con email y contraseña
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Promise<Object>} Datos del usuario y carreras
     */
    async login(email, password) {
        try {
            const url = `${this.LOGIN_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            // Validar si hay error en la respuesta
            if (data.error) {
                throw new Error(data.error);
            }

            // Guardar datos en cache
            this.cache.userData = data;
            
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtiene la malla curricular de una carrera específica
     * @param {string} codigoCarrera - Código de la carrera
     * @param {string} catalogo - Catálogo de la carrera
     * @returns {Promise<Object>} Lista de asignaturas de la malla
     */
    async getMallaCurricular(codigoCarrera, catalogo) {
        try {
            const cacheKey = `${codigoCarrera}-${catalogo}`;
            
            // Verificar cache primero
            if (this.cache.mallas[cacheKey]) {
                return {
                    success: true,
                    data: this.cache.mallas[cacheKey]
                };
            }

            const url = `${this.MALLA_URL}?${codigoCarrera}-${catalogo}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-HAWAII-AUTH': this.HAWAII_AUTH_TOKEN
                },
                redirect: 'follow'
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            // Validar respuesta
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Malla curricular no encontrada');
            }

            // Guardar en cache
            this.cache.mallas[cacheKey] = data;
            
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Error obteniendo malla curricular:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtiene el avance curricular de un estudiante
     * @param {string} rut - RUT del estudiante
     * @param {string} codigoCarrera - Código de la carrera
     * @returns {Promise<Object>} Lista de cursos aprobados/reprobados
     */
    async getAvanceCurricular(rut, codigoCarrera) {
        try {
            const cacheKey = `${rut}-${codigoCarrera}`;
            
            // Verificar cache primero
            if (this.cache.avances[cacheKey]) {
                return {
                    success: true,
                    data: this.cache.avances[cacheKey]
                };
            }

            const url = `${this.AVANCE_URL}?rut=${encodeURIComponent(rut)}&codcarrera=${encodeURIComponent(codigoCarrera)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                redirect: 'follow'
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            
            // Validar respuesta
            if (data.error) {
                throw new Error(data.error);
            }

            // Guardar en cache
            this.cache.avances[cacheKey] = data;
            
            return {
                success: true,
                data: data
            };
        } catch (error) {
            console.error('Error obteniendo avance curricular:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtiene datos completos del estudiante (login + malla + avance)
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @param {string} codigoCarrera - Código de la carrera a consultar
     * @param {string} catalogo - Catálogo de la carrera
     * @returns {Promise<Object>} Datos completos del estudiante
     */
    async getDatosCompletosEstudiante(email, password, codigoCarrera, catalogo) {
        try {
            // 1. Login
            const loginResult = await this.login(email, password);
            if (!loginResult.success) {
                return loginResult;
            }

            const userData = loginResult.data;
            const rut = userData.rut;

            // 2. Obtener malla curricular
            const mallaResult = await this.getMallaCurricular(codigoCarrera, catalogo);
            if (!mallaResult.success) {
                return {
                    success: false,
                    error: `Error obteniendo malla curricular: ${mallaResult.error}`
                };
            }

            // 3. Obtener avance curricular
            const avanceResult = await this.getAvanceCurricular(rut, codigoCarrera);
            if (!avanceResult.success) {
                return {
                    success: false,
                    error: `Error obteniendo avance curricular: ${avanceResult.error}`
                };
            }

            return {
                success: true,
                data: {
                    usuario: userData,
                    malla: mallaResult.data,
                    avance: avanceResult.data
                }
            };
        } catch (error) {
            console.error('Error obteniendo datos completos:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Procesa el avance curricular para generar estadísticas
     * @param {Array} avance - Lista de cursos del avance
     * @param {Array} malla - Lista de asignaturas de la malla
     * @returns {Object} Estadísticas procesadas
     */
    procesarEstadisticas(avance, malla) {
        const aprobados = avance.filter(curso => curso.status === 'APROBADO');
        const reprobados = avance.filter(curso => curso.status === 'REPROBADO');
        const enProceso = avance.filter(curso => curso.status === 'EN_PROCESO');
        
        // Calcular créditos totales de la malla
        const creditosTotales = malla.reduce((total, asignatura) => total + asignatura.creditos, 0);
        
        // Calcular créditos aprobados
        const cursosAprobados = aprobados.map(curso => 
            malla.find(asignatura => asignatura.codigo === curso.course)
        ).filter(Boolean);
        
        const creditosAprobados = cursosAprobados.reduce((total, curso) => total + curso.creditos, 0);
        
        // Calcular promedio (simulado - necesitarías datos de notas)
        const promedioSimulado = 5.8; // Esto debería venir de otra API
        
        return {
            creditosAprobados,
            creditosTotales,
            porcentajeAvance: Math.round((creditosAprobados / creditosTotales) * 100),
            cursosAprobados: aprobados.length,
            cursosReprobados: reprobados.length,
            cursosEnProceso: enProceso.length,
            totalCursos: avance.length,
            promedio: promedioSimulado,
            cursosAprobadosDetalle: cursosAprobados
        };
    }

    /**
     * Limpia el cache
     */
    clearCache() {
        this.cache = {
            userData: null,
            mallas: {},
            avances: {}
        };
    }

    /**
     * Obtiene datos del usuario del cache
     */
    getUserData() {
        return this.cache.userData;
    }
}

// Crear instancia global del servicio
window.apiService = new ApiService();
