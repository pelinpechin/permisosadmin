const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Solo inicializar si las credenciales están configuradas
let supabase = null;
let supabaseAdmin = null;

if (supabaseUrl && supabaseKey) {
    // Cliente público (para operaciones normales)
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // Cliente con service role (para operaciones administrativas)
    supabaseAdmin = supabaseServiceKey ?
        createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }) : null;

    console.log('✅ Cliente Supabase inicializado correctamente');
} else {
    console.log('ℹ️ Supabase no configurado (usando DB alternativa)');
}

// Funciones de utilidad para mantener compatibilidad con el código existente

/**
 * Ejecutar una consulta SELECT
 * @param {string} sql - Query SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Array>} Resultados de la consulta
 */
async function query(sql, params = []) {
    if (!supabase) {
        throw new Error('Supabase no está configurado. Verifique DB_TYPE en variables de entorno.');
    }

    try {
        console.log('🔍 Ejecutando query:', sql.substring(0, 100) + '...');
        
        // Debug específico para DELETE
        if (sql.includes('DELETE')) {
            console.log('🔍 DELETE query completo:', sql);
            console.log('🔍 Parámetros DELETE:', params);
        }
        
        // Buscar empleado por RUT (directo o normalizado)
        if (sql.includes('FROM empleados WHERE rut = ?') || sql.includes('REPLACE(REPLACE(rut') && sql.includes('empleados')) {
            const rutBuscado = params[0];
            console.log('🔍 Buscando empleado con RUT:', rutBuscado);
            
            // Primero intentar búsqueda directa
            let { data: empleadoDirecto, error: errorDirecto } = await supabase
                .from('empleados')
                .select('*')
                .eq('rut', rutBuscado)
                .eq('activo', true)
                .maybeSingle();
            
            if (empleadoDirecto) {
                console.log('✅ Empleado encontrado con RUT directo:', empleadoDirecto.nombre);
                return [empleadoDirecto];
            }
            
            // Si no se encuentra directamente, intentar normalización
            const rutNormalizado = rutBuscado.replace(/[.\-]/g, '');
            console.log('🔍 Intentando RUT normalizado:', rutNormalizado);
            
            // Buscar todos los empleados activos para normalización
            const { data: empleados, error: errorEmpleados } = await supabase
                .from('empleados')
                .select('*')
                .eq('activo', true);
            
            if (errorEmpleados) throw errorEmpleados;
            
            // Filtrar por RUT normalizado
            const empleado = empleados.find(emp => {
                const rutEmpNormalizado = emp.rut.replace(/[.\-]/g, '');
                const coincide = rutEmpNormalizado === rutNormalizado;
                if (coincide) {
                    console.log('✅ Coincidencia encontrada:', emp.nombre, 'RUT:', emp.rut);
                }
                return coincide;
            });
            
            if (!empleado) {
                console.log('❌ No se encontró empleado con RUT:', rutBuscado);
            }
            
            return empleado ? [empleado] : [];
        }
        
        // Dashboard empleado por ID
        if (sql.includes('SELECT') && sql.includes('FROM empleados') && sql.includes('WHERE id = ?')) {
            const empleadoId = params[0];
            const { data, error } = await supabase
                .from('empleados')
                .select('*')
                .eq('id', empleadoId)
                .eq('activo', true)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data ? [data] : [];
        }
        
        // Estadísticas generales del dashboard admin
        if (sql.includes('total_empleados') && sql.includes('solicitudes_pendientes')) {
            console.log('📊 Procesando consulta de estadísticas generales...');
            
            // Obtener estadísticas de empleados
            const { data: empleados, error: errorEmpleados } = await supabase
                .from('empleados')
                .select('id', { count: 'exact' })
                .eq('activo', true);
            
            // Obtener solicitudes pendientes
            const { data: pendientes, error: errorPendientes } = await supabase
                .from('solicitudes_permisos')
                .select('id', { count: 'exact' })
                .eq('estado', 'PENDIENTE');
            
            // Obtener solicitudes de hoy
            const hoy = new Date().toISOString().split('T')[0];
            const { data: solicitudesHoy, error: errorHoy } = await supabase
                .from('solicitudes_permisos')
                .select('id', { count: 'exact' })
                .gte('created_at', hoy + 'T00:00:00')
                .lt('created_at', hoy + 'T23:59:59');
            
            // Obtener aprobadas este mes
            const fechaActual = new Date();
            const mesActual = fechaActual.toISOString().substring(0, 7); // YYYY-MM
            const siguienteMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1);
            const finMes = siguienteMes.toISOString().split('T')[0]; // YYYY-MM-DD del siguiente mes
            const { data: aprobadasMes, error: errorMes } = await supabase
                .from('solicitudes_permisos')
                .select('id', { count: 'exact' })
                .eq('estado', 'APROBADO')
                .gte('fecha_desde', mesActual + '-01')
                .lt('fecha_desde', finMes);
            
            if (errorEmpleados || errorPendientes || errorHoy || errorMes) {
                throw errorEmpleados || errorPendientes || errorHoy || errorMes;
            }
            
            return [{
                total_empleados: empleados?.length || 0,
                solicitudes_pendientes: pendientes?.length || 0, 
                solicitudes_hoy: solicitudesHoy?.length || 0,
                aprobadas_mes_actual: aprobadasMes?.length || 0
            }];
        }
        
        // Solicitudes por estado (dashboard admin)
        if (sql.includes('GROUP BY estado') && sql.includes('solicitudes_permisos')) {
            console.log('📊 Procesando consulta de solicitudes por estado...');
            const añoActual = new Date().getFullYear();
            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .select('estado')
                .gte('created_at', `${añoActual}-01-01T00:00:00`)
                .lt('created_at', `${añoActual + 1}-01-01T00:00:00`);
            
            if (error) throw error;
            
            // Contar por estado
            const estadoCount = {};
            data.forEach(item => {
                estadoCount[item.estado] = (estadoCount[item.estado] || 0) + 1;
            });
            
            return Object.entries(estadoCount).map(([estado, cantidad]) => ({ estado, cantidad }));
        }
        
        // Tipos de permisos más solicitados (dashboard admin)
        if (sql.includes('tipos_permisos tp') && sql.includes('LEFT JOIN') && sql.includes('cantidad')) {
            console.log('📊 Procesando consulta de tipos de permisos populares...');
            
            const añoActual = new Date().getFullYear();
            
            // Obtener tipos de permisos activos
            const { data: tipos, error: errorTipos } = await supabase
                .from('tipos_permisos')
                .select('id, nombre, codigo, color_hex')
                .eq('activo', true);
            
            if (errorTipos) throw errorTipos;
            
            // Obtener solicitudes del año actual
            const { data: solicitudes, error: errorSolicitudes } = await supabase
                .from('solicitudes_permisos')
                .select('tipo_permiso_id')
                .gte('created_at', `${añoActual}-01-01T00:00:00`)
                .lt('created_at', `${añoActual + 1}-01-01T00:00:00`);
            
            if (errorSolicitudes) throw errorSolicitudes;
            
            // Contar por tipo
            const tipoCount = {};
            solicitudes.forEach(item => {
                tipoCount[item.tipo_permiso_id] = (tipoCount[item.tipo_permiso_id] || 0) + 1;
            });
            
            // Combinar con tipos de permisos
            const result = tipos.map(tipo => ({
                nombre: tipo.nombre,
                codigo: tipo.codigo,
                color_hex: tipo.color_hex,
                cantidad: tipoCount[tipo.id] || 0
            })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
            
            return result;
        }
        
        // Solicitudes por mes (dashboard admin)
        if (sql.includes('strftime') && sql.includes('GROUP BY') && sql.includes('mes')) {
            console.log('📊 Procesando consulta de solicitudes por mes...');
            
            const hace12Meses = new Date();
            hace12Meses.setMonth(hace12Meses.getMonth() - 12);
            
            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .select('created_at, estado')
                .gte('created_at', hace12Meses.toISOString());
            
            if (error) throw error;
            
            // Agrupar por mes
            const mesesData = {};
            data.forEach(item => {
                const mes = item.created_at.substring(0, 7); // YYYY-MM
                if (!mesesData[mes]) {
                    mesesData[mes] = { mes, total: 0, aprobadas: 0, rechazadas: 0 };
                }
                mesesData[mes].total++;
                if (item.estado === 'APROBADO') mesesData[mes].aprobadas++;
                if (item.estado === 'RECHAZADO') mesesData[mes].rechazadas++;
            });
            
            return Object.values(mesesData).sort((a, b) => b.mes.localeCompare(a.mes));
        }
        
        // Empleados con más solicitudes (dashboard admin)
        if (sql.includes('empleados e') && sql.includes('total_solicitudes') && sql.includes('LEFT JOIN solicitudes_permisos')) {
            console.log('📊 Procesando consulta de empleados activos con solicitudes...');
            
            const añoActual = new Date().getFullYear();
            
            // Obtener empleados activos
            const { data: empleados, error: errorEmpleados } = await supabase
                .from('empleados')
                .select('id, nombre, cargo')
                .eq('activo', true);
            
            if (errorEmpleados) throw errorEmpleados;
            
            // Obtener solicitudes del año actual
            const { data: solicitudes, error: errorSolicitudes } = await supabase
                .from('solicitudes_permisos')
                .select('empleado_id, estado')
                .gte('created_at', `${añoActual}-01-01T00:00:00`)
                .lt('created_at', `${añoActual + 1}-01-01T00:00:00`);
            
            if (errorSolicitudes) throw errorSolicitudes;
            
            // Contar solicitudes por empleado
            const empleadoStats = {};
            solicitudes.forEach(item => {
                const id = item.empleado_id;
                if (!empleadoStats[id]) {
                    empleadoStats[id] = { total_solicitudes: 0, aprobadas: 0 };
                }
                empleadoStats[id].total_solicitudes++;
                if (item.estado === 'APROBADO') empleadoStats[id].aprobadas++;
            });
            
            // Combinar con datos de empleados
            const result = empleados
                .filter(emp => empleadoStats[emp.id] && empleadoStats[emp.id].total_solicitudes > 0)
                .map(emp => ({
                    nombre: emp.nombre,
                    cargo: emp.cargo,
                    total_solicitudes: empleadoStats[emp.id].total_solicitudes,
                    aprobadas: empleadoStats[emp.id].aprobadas
                }))
                .sort((a, b) => b.total_solicitudes - a.total_solicitudes)
                .slice(0, 10);
            
            return result;
        }
        
        // Solicitudes recientes (dashboard admin)
        if (sql.includes('solicitudes_recientes') || (sql.includes('sp.id') && sql.includes('ORDER BY sp.created_at DESC') && sql.includes('LIMIT 5'))) {
            console.log('📊 Procesando consulta de solicitudes recientes...');
            
            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .select(`
                    id,
                    estado,
                    fecha_desde,
                    created_at,
                    empleados!inner(nombre),
                    tipos_permisos!inner(nombre, color_hex)
                `)
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (error) throw error;
            
            return data.map(item => ({
                id: item.id,
                estado: item.estado,
                fecha_desde: item.fecha_desde,
                created_at: item.created_at,
                empleado_nombre: item.empleados.nombre,
                tipo_permiso: item.tipos_permisos.nombre,
                color_hex: item.tipos_permisos.color_hex
            }));
        }
        
        // Notificaciones por empleado
        if (sql.includes('FROM notificaciones') && sql.includes('empleado_id = ?')) {
            const empleadoId = params[0];
            const leida = params[1];
            const limit = params[2] || 10;
            const offset = params[3] || 0;
            
            let query = supabase
                .from('notificaciones')
                .select('*')
                .eq('empleado_id', empleadoId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
                
            if (leida !== undefined) {
                query = query.eq('leida', leida);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }
        
        // Query del calendario equipo (con campos que no existen)
        if (sql.includes('e.supervisor_id') && sql.includes('e.es_supervisor') && sql.includes('tp.afecta_sueldo')) {
            console.log('📅 Query calendario equipo detectada');

            // Construir query sin los campos que no existen
            let dbQuery = supabase
                .from('solicitudes_permisos')
                .select(`
                    *,
                    empleados!inner(id, nombre, rut, cargo, supervisor),
                    tipos_permisos!inner(nombre, codigo, afecta_sueldo)
                `)
                .eq('estado', 'APROBADO');

            // Filtros de año/mes
            if (params.length >= 2) {
                const year = params[0];
                const month = params[1];
                if (year && month) {
                    const startDate = `${year}-${month}-01`;
                    const endDate = `${year}-${month}-31`;
                    dbQuery = dbQuery.gte('fecha_desde', startDate).lte('fecha_desde', endDate);
                }
            }

            // Filtro por empleado (si hay un tercer parámetro)
            if (params.length === 3 && params[2]) {
                dbQuery = dbQuery.eq('empleado_id', params[2]);
            }

            dbQuery = dbQuery.order('fecha_desde', { ascending: true });

            const { data, error } = await dbQuery;

            if (error) {
                console.error('Error en query calendario:', error);
                throw error;
            }

            // Transformar datos para compatibilidad
            const transformedData = (data || []).map(item => ({
                ...item,
                empleado_nombre: item.empleados?.nombre,
                empleado_rut: item.empleados?.rut,
                empleado_cargo: item.empleados?.cargo,
                supervisor_id: null, // No existe en schema
                es_supervisor: false, // Campo calculado
                tipo_nombre: item.tipos_permisos?.nombre,
                tipo_codigo: item.tipos_permisos?.codigo,
                afecta_sueldo: item.tipos_permisos?.afecta_sueldo,
                medio_dia: 0, // No existe en schema
                periodo_medio_dia: null // No existe en schema
            }));

            console.log(`✅ Query calendario exitosa: ${transformedData.length} permisos`);
            return transformedData;
        }

        // Query específica para es_supervisor (campo calculado)
        if (sql.includes('SELECT es_supervisor FROM empleados WHERE id = ?')) {
            const empleadoId = params[0];

            // Obtener empleado y verificar si otros empleados lo tienen como supervisor
            const { data: empleado, error: errorEmpleado } = await supabase
                .from('empleados')
                .select('nombre, visualizacion, autorizacion')
                .eq('id', empleadoId)
                .eq('activo', true)
                .single();

            if (errorEmpleado && errorEmpleado.code !== 'PGRST116') throw errorEmpleado;
            if (!empleado) return [];

            // Buscar si hay empleados que tienen a este como supervisor
            const { data: subordinados, error: errorSub } = await supabase
                .from('empleados')
                .select('id')
                .or(`supervisor.eq.${empleado.nombre},visualizacion.eq.${empleado.nombre},autorizacion.eq.${empleado.nombre}`)
                .eq('activo', true);

            if (errorSub) throw errorSub;

            // Es supervisor si tiene subordinados
            return [{
                es_supervisor: subordinados && subordinados.length > 0
            }];
        }

        // Todas las consultas de empleados
        if (sql.includes('SELECT') && sql.includes('FROM empleados')) {
            let dbQuery = supabase.from('empleados').select('*');

            // Si no tiene WHERE específico, agregar activo = true
            if (!sql.includes('WHERE')) {
                dbQuery = dbQuery.eq('activo', true);
            }

            // Si tiene LIMIT
            if (sql.includes('LIMIT')) {
                const limitMatch = sql.match(/LIMIT (\d+)/);
                if (limitMatch) {
                    const limit = parseInt(limitMatch[1]);
                    dbQuery = dbQuery.limit(limit);
                }
            }

            const { data, error } = await dbQuery;
            if (error) throw error;
            return data;
        }
        
        // Tipos de permisos
        if (sql.includes('SELECT * FROM tipos_permisos')) {
            const { data, error } = await supabase
                .from('tipos_permisos')
                .select('*')
                .eq('activo', true)
                .order('codigo');
            
            if (error) throw error;
            return data;
        }
        
        // Obtener ID de tipo de permiso por código
        if (sql.includes('SELECT id FROM tipos_permisos WHERE codigo = ?')) {
            const codigo = params[0];
            const { data, error } = await supabase
                .from('tipos_permisos')
                .select('id')
                .eq('codigo', codigo)
                .eq('activo', true)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return data ? [data] : [];
        }
        
        // Solicitudes con JOIN específico para historial
        if (sql.includes('SELECT sp.*, tp.codigo as tipo_permiso_codigo, tp.nombre as tipo_permiso_nombre')) {
            console.log('🔍 JOIN query detectado para historial');
            const empleadoId = params[0];
            
            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .select(`
                    *,
                    tipos_permisos!inner(codigo, nombre)
                `)
                .eq('empleado_id', empleadoId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error en JOIN query:', error);
                throw error;
            }
            
            // Transformar datos para compatibilidad
            const transformedData = data.map(row => ({
                ...row,
                tipo_permiso_codigo: row.tipos_permisos.codigo,
                tipo_permiso_nombre: row.tipos_permisos.nombre
            }));
            
            console.log('✅ JOIN query exitoso:', transformedData.length, 'resultados');
            return transformedData;
        }
        
        // Solicitudes recientes para dashboard (con LEFT JOIN tipos_permisos)
        if (sql.includes('SELECT sp.*, tp.nombre as tipo_nombre') && sql.includes('LEFT JOIN tipos_permisos tp') && sql.includes('LIMIT 5')) {
            console.log('🔍 Solicitudes recientes con LEFT JOIN detectado');
            const empleadoId = params[0];
            
            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .select(`
                    *,
                    tipos_permisos(nombre)
                `)
                .eq('empleado_id', empleadoId)
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (error) {
                console.error('Error en solicitudes recientes:', error);
                throw error;
            }
            
            // Transformar datos para compatibilidad con la estructura esperada
            const transformedData = (data || []).map(row => ({
                ...row,
                tipo_nombre: row.tipos_permisos?.nombre || null
            }));
            
            console.log('✅ Solicitudes recientes exitoso:', transformedData.length, 'resultados');
            return transformedData;
        }
        
        // Consulta compleja con JOIN para subordinados (múltiples tablas)
        if (sql.includes('SELECT sp.*') && sql.includes('LEFT JOIN empleados e ON') && sql.includes('LEFT JOIN tipos_permisos tp ON')) {
            console.log('🔍 Consulta compleja JOIN para subordinados detectada');
            
            // Extraer los IDs de empleados del IN clause
            const inClauseMatch = sql.match(/sp\.empleado_id IN \(([^)]+)\)/);
            if (!inClauseMatch) {
                console.log('❌ No se pudo extraer la cláusula IN');
                return [];
            }
            
            // Los primeros parámetros son los IDs de empleados
            const numIds = (inClauseMatch[1].match(/\?/g) || []).length;
            const empleadoIds = params.slice(0, numIds);
            const estados = params.slice(numIds);
            
            console.log('👥 Empleados IDs:', empleadoIds);
            console.log('📋 Estados:', estados);
            
            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .select(`
                    *,
                    empleados(nombre, rut, cargo),
                    tipos_permisos(codigo, nombre, descripcion, color_hex)
                `)
                .in('empleado_id', empleadoIds)
                .in('estado', estados)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Error en consulta compleja:', error);
                throw error;
            }
            
            // Transformar para compatibilidad
            const transformedData = (data || []).map(row => ({
                ...row,
                empleado_nombre: row.empleados?.nombre,
                empleado_rut: row.empleados?.rut,
                empleado_cargo: row.empleados?.cargo,
                tipo_codigo: row.tipos_permisos?.codigo,
                tipo_nombre: row.tipos_permisos?.nombre,
                tipo_descripcion: row.tipos_permisos?.descripcion,
                tipo_color: row.tipos_permisos?.color_hex
            }));
            
            console.log('✅ Consulta compleja exitosa:', transformedData.length, 'resultados');
            return transformedData;
        }
        
        // Solicitudes con joins
        if (sql.includes('SELECT * FROM solicitudes_permisos')) {
            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .select(`
                    *,
                    empleado:empleados(*),
                    tipo_permiso:tipos_permisos(*)
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        }
        
        // Consultas generales de usuarios_admin
        if (sql.includes('FROM usuarios_admin')) {
            if (sql.includes('username = ?')) {
                // Login admin específico
                const username = params[0];
                const { data, error } = await supabase
                    .from('usuarios_admin')
                    .select('*')
                    .eq('username', username)
                    .eq('activo', true)
                    .single();
                
                if (error && error.code !== 'PGRST116') throw error;
                return data ? [data] : [];
            } else {
                // Obtener todos los usuarios admin
                const { data, error } = await supabase
                    .from('usuarios_admin')
                    .select('*')
                    .eq('activo', true)
                    .order('id');
                
                if (error) throw error;
                return data || [];
            }
        }
        
        // Query para /admin/todas con LEFT JOIN (solicitudes_permisos con joins)
        if (sql.includes('SELECT sp.*') && sql.includes('LEFT JOIN empleados e ON sp.empleado_id = e.id') &&
            sql.includes('LEFT JOIN tipos_permisos tp ON sp.tipo_permiso_id = tp.id') &&
            sql.includes('LEFT JOIN usuarios_admin ua ON sp.aprobado_por = ua.id')) {

            console.log('📊 Query compleja /admin/todas detectada');

            // Construir query con filtros
            let dbQuery = supabase
                .from('solicitudes_permisos')
                .select(`
                    *,
                    empleados!inner(nombre, rut, cargo),
                    tipos_permisos!inner(codigo, nombre, descripcion, color_hex),
                    usuarios_admin(nombre)
                `)
                .order('created_at', { ascending: false });

            // Aplicar filtros según parámetros
            // El SQL puede incluir WHERE con diferentes condiciones
            if (sql.includes('sp.estado = ?')) {
                const estadoParam = params.find(p => typeof p === 'string' && ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO'].includes(p));
                if (estadoParam) {
                    dbQuery = dbQuery.eq('estado', estadoParam);
                }
            }

            const { data, error } = await dbQuery;

            if (error) {
                console.error('Error en query /admin/todas:', error);
                throw error;
            }

            // Transformar datos para compatibilidad
            const transformedData = (data || []).map(item => ({
                ...item,
                empleado_nombre: item.empleados?.nombre,
                empleado_rut: item.empleados?.rut,
                empleado_cargo: item.empleados?.cargo,
                tipo_codigo: item.tipos_permisos?.codigo,
                tipo_nombre: item.tipos_permisos?.nombre,
                tipo_descripcion: item.tipos_permisos?.descripcion,
                tipo_color: item.tipos_permisos?.color_hex,
                aprobado_por_nombre: item.usuarios_admin?.nombre
            }));

            console.log(`✅ Query /admin/todas exitosa: ${transformedData.length} resultados`);
            return transformedData;
        }

        // Consultas complejas con JOIN para solicitudes_permisos
        if (sql.includes('JOIN empleados e ON') && sql.includes('JOIN tipos_permisos')) {
            if (sql.includes('WHERE sp.id = ?')) {
                // Detalle de solicitud específica
                const solicitudId = params[0];
                const { data, error } = await supabase
                    .from('solicitudes_permisos')
                    .select(`
                        *,
                        empleados(nombre, rut, cargo, supervisor),
                        tipos_permisos(codigo, nombre, color_hex, descripcion),
                        usuarios_admin(nombre)
                    `)
                    .eq('id', solicitudId)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                // Transformar para compatibilidad
                if (data) {
                    const transformed = {
                        ...data,
                        empleado_nombre: data.empleados?.nombre,
                        empleado_rut: data.empleados?.rut,
                        empleado_cargo: data.empleados?.cargo,
                        empleado_supervisor: data.empleados?.supervisor,
                        tipo_codigo: data.tipos_permisos?.codigo,
                        tipo_nombre: data.tipos_permisos?.nombre,
                        tipo_color: data.tipos_permisos?.color_hex,
                        tipo_descripcion: data.tipos_permisos?.descripcion,
                        aprobado_por_nombre: data.usuarios_admin?.nombre
                    };
                    return [transformed];
                }
                return [];
            }

            // Solicitudes con filtros
            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .select(`
                    *,
                    empleados(nombre, rut, cargo, supervisor),
                    tipos_permisos(codigo, nombre, color_hex, descripcion)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data.map(item => ({
                ...item,
                empleado_nombre: item.empleados?.nombre,
                empleado_rut: item.empleados?.rut,
                empleado_cargo: item.empleados?.cargo,
                empleado_supervisor: item.empleados?.supervisor,
                tipo_codigo: item.tipos_permisos?.codigo,
                tipo_nombre: item.tipos_permisos?.nombre,
                tipo_color: item.tipos_permisos?.color_hex,
                tipo_descripcion: item.tipos_permisos?.descripcion
            }));
        }
        
        // Consultas de estadísticas (COUNT)
        if (sql.includes('COUNT(') && sql.includes('empleado_id = ?')) {
            const empleadoId = params[0];
            let query = supabase
                .from('solicitudes_permisos')
                .select('*', { count: 'exact', head: true })
                .eq('empleado_id', empleadoId);
                
            const { count, error } = await query;
            if (error) throw error;
            
            // Para estadísticas detalladas, hacer queries separados
            const pendientes = await supabase
                .from('solicitudes_permisos')
                .select('*', { count: 'exact', head: true })
                .eq('empleado_id', empleadoId)
                .eq('estado', 'PENDIENTE');
                
            const aprobadas = await supabase
                .from('solicitudes_permisos')
                .select('*', { count: 'exact', head: true })
                .eq('empleado_id', empleadoId)
                .eq('estado', 'APROBADO');
                
            const rechazadas = await supabase
                .from('solicitudes_permisos')
                .select('*', { count: 'exact', head: true })
                .eq('empleado_id', empleadoId)
                .eq('estado', 'RECHAZADO');
                
            const canceladas = await supabase
                .from('solicitudes_permisos')
                .select('*', { count: 'exact', head: true })
                .eq('empleado_id', empleadoId)
                .eq('estado', 'CANCELADO');
            
            return [{
                total: count || 0,
                pendientes: pendientes.count || 0,
                aprobadas: aprobadas.count || 0,
                rechazadas: rechazadas.count || 0,
                canceladas: canceladas.count || 0
            }];
        }
        
        // DELETE FROM solicitudes_permisos
        console.log('🔍 Verificando DELETE - SQL recibido:', sql);
        console.log('🔍 ¿Contiene DELETE FROM solicitudes_permisos?', sql.includes('DELETE FROM solicitudes_permisos'));
        
        if (sql.includes('DELETE FROM solicitudes_permisos')) {
            console.log('🗑️ DELETE solicitudes_permisos recibido en query()');
            console.log('🗑️ Parámetros:', params);
            
            // Parámetros: [id, empleado_id]
            const id = params[0];
            const empleadoId = params[1];
            
            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .delete()
                .eq('id', id)
                .eq('empleado_id', empleadoId)
                .select();
            
            if (error) {
                console.error('🗑️ Error en DELETE:', error);
                throw error;
            }
            
            console.log('🗑️ DELETE exitoso:', data);
            return data; // Return the deleted records
        }
        
        // Para otros casos
        console.warn('⚠️ Query no implementada aún:', sql);
        return [];
        
    } catch (error) {
        console.error('❌ Error en query:', error);
        throw error;
    }
}

/**
 * Obtener un solo registro
 * @param {string} sql - Query SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Object>} Primer resultado de la consulta
 */
async function get(sql, params = []) {
    const results = await query(sql, params);
    return results[0] || null;
}

/**
 * Ejecutar una consulta INSERT/UPDATE/DELETE
 * @param {string} sql - Query SQL
 * @param {Array} params - Parámetros de la consulta
 * @returns {Promise<Object>} Resultado de la operación
 */
async function run(sql, params = []) {
    if (!supabase) {
        throw new Error('Supabase no está configurado. Verifique DB_TYPE en variables de entorno.');
    }

    try {
        console.log('📝 Ejecutando operación:', sql.substring(0, 100) + '...');
        
        // INSERT INTO empleados
        if (sql.includes('INSERT INTO empleados')) {
            console.log('📝 INSERT empleados - SQL:', sql);
            console.log('📝 INSERT empleados - Params:', params);

            // Parse column names from SQL
            const columnsMatch = sql.match(/INSERT INTO empleados\s*\(([^)]+)\)/);
            if (!columnsMatch) {
                throw new Error('No se pudieron extraer las columnas del INSERT');
            }

            const columnNames = columnsMatch[1].split(',').map(col => col.trim());
            console.log('📝 Columnas detectadas:', columnNames);

            // Build object from column names and params
            const empleadoData = {};
            columnNames.forEach((col, index) => {
                // Exclude auto-generated fields
                if (params[index] !== undefined && col !== 'created_at' && col !== 'updated_at') {
                    empleadoData[col] = params[index];
                }
            });

            console.log('📝 Datos a insertar:', empleadoData);

            const { data, error } = await supabase
                .from('empleados')
                .insert(empleadoData)
                .select();

            if (error) {
                console.error('📝 Error en INSERT empleados:', error);
                throw error;
            }

            console.log('✅ Empleado creado exitosamente, ID:', data[0]?.id);
            return { lastID: data[0]?.id, changes: 1 };
        }
        
        // UPDATE empleados - full employee update (from admin)
        if (sql.includes('UPDATE empleados SET') && sql.includes('numero = COALESCE')) {
            console.log('📝 UPDATE empleados completo detectado');
            console.log('📝 Parámetros:', params);

            // Build update object from params
            // Parameters order: numero, nombre, rut, fecha_nacimiento, cargo, negociacion_colectiva,
            // visualizacion, autorizacion, uso_primer_semestre, uso_segundo_semestre,
            // sin_goce, beneficio_licencia, licencias_total, atrasos, atrasos_justificados,
            // no_marcaciones, activo, id (last one)
            const updateData = {};
            const fieldNames = [
                'numero', 'nombre', 'rut', 'fecha_nacimiento', 'cargo', 'negociacion_colectiva',
                'visualizacion', 'autorizacion', 'uso_primer_semestre', 'uso_segundo_semestre',
                'sin_goce', 'beneficio_licencia', 'licencias_total', 'atrasos',
                'atrasos_justificados', 'no_marcaciones', 'activo'
            ];

            fieldNames.forEach((field, index) => {
                // Only include non-null values (COALESCE behavior)
                if (params[index] !== null && params[index] !== undefined) {
                    updateData[field] = params[index];
                }
            });

            const employeeId = params[params.length - 1]; // Last parameter is the ID

            console.log('📝 Datos a actualizar:', updateData);
            console.log('📝 ID empleado:', employeeId);

            const { data, error } = await supabase
                .from('empleados')
                .update(updateData)
                .eq('id', employeeId)
                .select();

            if (error) {
                console.error('📝 Error en UPDATE empleados:', error);
                throw error;
            }

            console.log('✅ Empleado actualizado exitosamente');
            return { changes: data.length };
        }

        // UPDATE empleados - contraseñas, tokens, etc.
        if (sql.includes('UPDATE empleados')) {
            let updateData = {};
            let whereId = null;

            console.log('Parseando UPDATE empleados:', sql);
            console.log('Parámetros:', params);
            
            // Parsing mejorado para diferentes tipos de UPDATE
            if (sql.includes('password_hash') && sql.includes('token_verificacion')) {
                // Crear contraseña
                updateData = {
                    password_hash: params[0],
                    token_verificacion: params[1],
                    email_verificado: false,
                    primer_login: true
                };
                whereId = params[2];
            } else if (sql.includes('email_verificado') && sql.includes('token_verificacion = NULL')) {
                // Verificar email
                updateData = {
                    email_verificado: true,
                    token_verificacion: null
                };
                whereId = params[0];
            } else if (sql.includes('fecha_ultimo_login')) {
                // Login
                updateData = {
                    fecha_ultimo_login: params[0],
                    primer_login: false
                };
                whereId = params[1];
            } else {
                // Intentar parsing genérico
                console.warn('UPDATE empleados no reconocido, intentando parsing genérico');
                
                // Para el nuevo formato de crear contraseña (sin email verification)
                if (params.length === 2) {
                    updateData = {
                        password_hash: params[0],
                        email_verificado: true,
                        primer_login: true
                    };
                    whereId = params[1];
                    console.log('Parsed nuevo formato crear contraseña:', { updateData, whereId });
                }
                // Para el formato viejo de crear contraseña (con email verification)
                else if (params.length >= 5) {
                    updateData = {
                        password_hash: params[0],
                        token_verificacion: params[1],
                        email_verificado: params[2] === 1 || params[2] === true,
                        primer_login: params[3] === 1 || params[3] === true
                    };
                    whereId = params[4];
                }
            }
            
            if (whereId && Object.keys(updateData).length > 0) {
                console.log('Actualizando empleado ID:', whereId, 'con data:', updateData);
                
                const { data, error } = await supabase
                    .from('empleados')
                    .update(updateData)
                    .eq('id', whereId)
                    .select();
                
                if (error) {
                    console.error('Error en UPDATE empleados:', error);
                    throw error;
                }
                
                console.log('UPDATE exitoso:', data);
                return { changes: data.length };
            } else {
                console.warn('No se pudo parsear UPDATE empleados o falta whereId');
                return { changes: 0 };
            }
        }
        
        // INSERT INTO solicitudes_permisos
        if (sql.includes('INSERT INTO solicitudes_permisos')) {
            console.log('🔥 INSERT solicitudes_permisos recibido');
            console.log('🔥 Parámetros:', params);
            
            // Nuevo formato: empleado_id, tipo_permiso_id, fecha_solicitud, fecha_desde, motivo, observaciones, estado
            const solicitudData = {
                empleado_id: params[0],
                tipo_permiso_id: params[1],     // ID del tipo de permiso, no código
                fecha_solicitud: params[2],
                fecha_desde: params[3],         // Fecha desde es requerida
                motivo: params[4],              
                observaciones: params[5],
                estado: params[6]               // 'PENDIENTE'
            };
            
            console.log('🔥 Datos a insertar:', solicitudData);
            
            const { data, error } = await supabase
                .from('solicitudes_permisos')
                .insert(solicitudData)
                .select();
            
            if (error) {
                console.error('🔥 Error en INSERT:', error);
                throw error;
            }
            
            console.log('🔥 INSERT exitoso:', data);
            return { lastID: data[0]?.id, changes: 1 };
        }
        
        // UPDATE solicitudes_permisos
        if (sql.includes('UPDATE solicitudes_permisos')) {
            if (sql.includes('estado =') && sql.includes('observaciones =')) {
                // Admin update with estado and observaciones
                const estado = params[0];
                const observaciones = params[1];
                const id = params[2];
                
                const updateData = { estado };
                if (observaciones !== null) {
                    updateData.observaciones = observaciones;
                }
                
                const { data, error } = await supabase
                    .from('solicitudes_permisos')
                    .update(updateData)
                    .eq('id', id)
                    .select();
                
                if (error) throw error;
                return { changes: data.length };
            } else if (sql.includes('visto_por_supervisor') && sql.includes('fecha_visto_supervisor')) {
                // Supervisor approval update
                const id = params[0];
                
                const updateData = {
                    estado: 'APROBADO_SUPERVISOR',
                    visto_por_supervisor: true,
                    fecha_visto_supervisor: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                const { data, error } = await supabase
                    .from('solicitudes_permisos')
                    .update(updateData)
                    .eq('id', id)
                    .eq('estado', 'PENDIENTE')
                    .select();
                
                if (error) throw error;
                return { changes: data.length };
            } else if (sql.includes('aprobado_por') && sql.includes('fecha_aprobacion')) {
                // Authority final approval
                const supervisorId = params[0];
                const id = params[1];
                
                const updateData = {
                    estado: 'APROBADO',
                    fecha_aprobacion: new Date().toISOString(),
                    aprobado_por: supervisorId,
                    updated_at: new Date().toISOString()
                };
                
                const { data, error } = await supabase
                    .from('solicitudes_permisos')
                    .update(updateData)
                    .eq('id', id)
                    .in('estado', ['PENDIENTE', 'APROBADO_SUPERVISOR'])
                    .select();
                
                if (error) throw error;
                return { changes: data.length };
            } else if (sql.includes('estado =')) {
                // Simple estado update
                const estado = params[0];
                const id = params[1];
                
                const { data, error } = await supabase
                    .from('solicitudes_permisos')
                    .update({ estado })
                    .eq('id', id)
                    .select();
                
                if (error) throw error;
                return { changes: data.length };
            }
        }
        
        // UPDATE empleados - for updating usage counters
        if (sql.includes('UPDATE empleados')) {
            if (sql.includes('uso_primer_semestre') || sql.includes('uso_segundo_semestre')) {
                console.log('📊 Actualizando contador de uso de empleado...');
                
                // Extract campo and values from SQL
                const incremento = params[0];
                const empleado_id = params[1];
                
                // Determine which field to update
                let updateField = '';
                if (sql.includes('uso_primer_semestre')) {
                    updateField = 'uso_primer_semestre';
                } else if (sql.includes('uso_segundo_semestre')) {
                    updateField = 'uso_segundo_semestre';
                }
                
                if (updateField) {
                    // First get current value
                    const { data: currentData, error: getCurrentError } = await supabase
                        .from('empleados')
                        .select(updateField)
                        .eq('id', empleado_id)
                        .single();
                    
                    if (getCurrentError) throw getCurrentError;
                    
                    const currentValue = currentData[updateField] || 0;
                    const newValue = currentValue + incremento;
                    
                    console.log(`📊 Actualizando ${updateField}: ${currentValue} + ${incremento} = ${newValue}`);
                    
                    // Update with new value
                    const updateData = {};
                    updateData[updateField] = newValue;
                    
                    const { data, error } = await supabase
                        .from('empleados')
                        .update(updateData)
                        .eq('id', empleado_id)
                        .select();
                    
                    if (error) throw error;
                    console.log(`✅ Contador empleado actualizado: ${updateField} = ${newValue}`);
                    return { changes: data.length };
                }
            }
        }
        
        
        // INSERT INTO notificaciones
        if (sql.includes('INSERT INTO notificaciones')) {
            const notificacionData = {
                admin_id: params[0],
                solicitud_id: params[1],
                titulo: params[2],
                mensaje: params[3],
                tipo: params[4]
            };
            
            const { data, error } = await supabase
                .from('notificaciones')
                .insert(notificacionData)
                .select();
            
            if (error) throw error;
            return { lastID: data[0]?.id, changes: 1 };
        }
        
        // Operaciones DDL (CREATE TABLE, ALTER TABLE, CREATE INDEX, CREATE POLICY)
        if (sql.includes('CREATE TABLE') || sql.includes('ALTER TABLE') || 
            sql.includes('CREATE INDEX') || sql.includes('CREATE POLICY') ||
            sql.includes('ENABLE ROW LEVEL SECURITY')) {
            console.log('✅ DDL ejecutado (usando RPC de Supabase)');
            
            try {
                // Usar RPC para ejecutar DDL directamente
                const { data, error } = await supabase.rpc('exec_sql', { 
                    sql_query: sql 
                });
                
                if (error && !error.message.includes('already exists')) {
                    console.warn('DDL warning:', error.message);
                }
                
                return { changes: 1 };
            } catch (e) {
                // Si falla RPC, ignorar (tablas probablemente ya existen)
                console.log('DDL info: Comando DDL completado (posiblemente ya existe)');
                return { changes: 1 };
            }
        }
        
        // INSERT INTO notificaciones para empleados
        if (sql.includes('INSERT INTO notificaciones') && !sql.includes('notificaciones_admin')) {
            console.log('📧 INSERT notificación empleado:', params);
            console.log('📧 SQL original:', sql);
            
            // El SQL esperado es: INSERT INTO notificaciones (empleado_id, tipo, titulo, mensaje, leida, created_at)
            // Los parámetros vienen como: [empleado_id, tipo, titulo, mensaje]
            const notificacionData = {
                empleado_id: params[0],
                tipo: params[1],
                titulo: params[2],
                mensaje: params[3],
                leida: false
            };
            
            console.log('📧 Datos de notificación a insertar:', notificacionData);
            
            const { data, error } = await supabase
                .from('notificaciones')
                .insert(notificacionData)
                .select();
            
            if (error) {
                console.error('📧 Error insertando notificación:', error);
                throw error;
            }
            
            console.log('📧 Notificación creada exitosamente:', data);
            return { lastID: data[0]?.id, changes: 1 };
        }
        
        // INSERT INTO notificaciones_admin
        if (sql.includes('INSERT INTO notificaciones_admin')) {
            console.log('📧 INSERT notificación admin:', params);
            
            const notificacionData = {
                admin_id: params[0],
                solicitud_id: params[1],
                tipo: params[2],
                titulo: params[3],
                mensaje: params[4],
                leida: false
            };
            
            const { data, error } = await supabase
                .from('notificaciones_admin')
                .insert(notificacionData)
                .select();
            
            if (error) throw error;
            return { lastID: data[0]?.id, changes: 1 };
        }
        
        console.warn('⚠️ Operación no implementada aún:', sql);
        return { changes: 0 };
        
    } catch (error) {
        console.error('❌ Error en operación:', error);
        throw error;
    }
}

/**
 * Funciones específicas de Supabase para operaciones más complejas
 */

// Obtener todos los empleados activos
async function getEmpleados() {
    const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .eq('activo', true)
        .order('nombre');
    
    if (error) throw error;
    return data;
}

// Obtener empleado por RUT
async function getEmpleadoPorRut(rut) {
    const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .eq('rut', rut)
        .eq('activo', true)
        .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
}

// Obtener empleado por ID
async function getEmpleadoPorId(id) {
    const { data, error } = await supabase
        .from('empleados')
        .select('*')
        .eq('id', id)
        .eq('activo', true)
        .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
}

// Obtener tipos de permisos
async function getTiposPermisos() {
    const { data, error } = await supabase
        .from('tipos_permisos')
        .select('*')
        .eq('activo', true)
        .order('codigo');
    
    if (error) throw error;
    return data;
}

// Crear nueva solicitud de permiso
async function crearSolicitudPermiso(solicitud) {
    const { data, error } = await supabase
        .from('solicitudes_permisos')
        .insert(solicitud)
        .select(`
            *,
            empleado:empleados(*),
            tipo_permiso:tipos_permisos(*)
        `);
    
    if (error) throw error;
    return data[0];
}

// Obtener solicitudes de un empleado
async function getSolicitudesPorEmpleado(empleadoId) {
    const { data, error } = await supabase
        .from('solicitudes_permisos')
        .select(`
            *,
            empleado:empleados(*),
            tipo_permiso:tipos_permisos(*)
        `)
        .eq('empleado_id', empleadoId)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
}

// Actualizar estado de solicitud
async function actualizarEstadoSolicitud(id, estado, aprobadoPor = null, motivoRechazo = null) {
    const updateData = {
        estado,
        updated_at: new Date().toISOString()
    };
    
    if (estado === 'APROBADO') {
        updateData.fecha_aprobacion = new Date().toISOString();
        updateData.aprobado_por = aprobadoPor;
    } else if (estado === 'RECHAZADO') {
        updateData.rechazado_motivo = motivoRechazo;
    }
    
    const { data, error } = await supabase
        .from('solicitudes_permisos')
        .update(updateData)
        .eq('id', id)
        .select(`
            *,
            empleado:empleados(*),
            tipo_permiso:tipos_permisos(*)
        `);
    
    if (error) throw error;
    return data[0];
}

// Verificar conexión
async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('tipos_permisos')
            .select('*')
            .limit(1);
        
        if (error) throw error;
        console.log('✅ Conexión a Supabase exitosa');
        return true;
    } catch (error) {
        console.error('❌ Error conectando a Supabase:', error);
        return false;
    }
}

module.exports = {
    supabase,
    supabaseAdmin,
    query,
    get,
    run,
    getEmpleados,
    getEmpleadoPorRut,
    getEmpleadoPorId,
    getTiposPermisos,
    crearSolicitudPermiso,
    getSolicitudesPorEmpleado,
    actualizarEstadoSolicitud,
    testConnection
};