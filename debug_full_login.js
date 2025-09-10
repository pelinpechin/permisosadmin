const db = require('./database/db_config');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_super_secreta_permisos_admin_chile_2025';

async function testFullLoginFlow() {
    try {
        console.log('=== DEBUG: Prueba completa del flujo de login ===');
        
        // Test con diferentes RUTs
        const testRuts = [
            "18.208.947-8", // Guillermo David Barria Uribe
            "10.078.481-5", // Manuel Antonio Bahamonde Subiabre 
            "16.353.637-4"  // Manuel Alejandro Cisternas Williams
        ];
        
        for (const testRut of testRuts) {
            console.log(`\n🧪 === PROBANDO CON RUT: ${testRut} ===`);
            
            // 1. Buscar empleado en la BD (simulando auth.js)
            console.log('🔍 1. Buscando empleado en la base de datos...');
            let empleado = await db.get(
                'SELECT * FROM empleados WHERE rut = ? AND activo = 1',
                [testRut]
            );
            
            if (!empleado) {
                console.log('🔍 No encontrado con RUT directo, intentando normalización...');
                const rutLimpio = testRut.replace(/[\.-]/g, '');
                empleado = await db.get(
                    'SELECT * FROM empleados WHERE REPLACE(REPLACE(rut, ".", ""), "-", "") = ? AND activo = 1',
                    [rutLimpio]
                );
            }
            
            if (!empleado) {
                console.log('❌ Empleado no encontrado');
                continue;
            }
            
            console.log(`✅ Empleado encontrado: ${empleado.nombre} (ID: ${empleado.id})`);
            
            // 2. Generar token JWT (simulando auth.js)
            console.log('🔑 2. Generando token JWT...');
            const tokenData = {
                id: empleado.id,
                rut: empleado.rut,
                nombre: empleado.nombre,
                cargo: empleado.cargo,
                type: 'empleado'
            };
            
            const token = jwt.sign(tokenData, JWT_SECRET, { expiresIn: '4h' });
            console.log(`✅ Token generado para ID: ${tokenData.id}, Nombre: ${tokenData.nombre}`);
            
            // 3. Verificar token
            console.log('🔓 3. Verificando token...');
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log(`✅ Token verificado - ID: ${decoded.id}, Nombre: ${decoded.nombre}`);
            
            // 4. Simular consulta del dashboard (simulando dashboard.js)
            console.log('📊 4. Consultando información para dashboard...');
            const infoEmpleado = await db.get(`
                SELECT 
                    nombre, rut, cargo, fecha_nacimiento,
                    uso_primer_semestre, uso_segundo_semestre,
                    sin_goce, beneficio_licencia, licencias_total,
                    atrasos, atrasos_justificados, no_marcaciones
                FROM empleados
                WHERE id = ? AND activo = 1
            `, [decoded.id]);
            
            if (infoEmpleado) {
                console.log(`✅ Dashboard data - Nombre: ${infoEmpleado.nombre}, RUT: ${infoEmpleado.rut}`);
            } else {
                console.log('❌ No se pudo obtener información para el dashboard');
            }
            
            console.log('---');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error en test de login completo:', error);
        process.exit(1);
    }
}

testFullLoginFlow();