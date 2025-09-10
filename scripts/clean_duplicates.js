const db = require('../database/db_config');
require('dotenv').config();

async function cleanDuplicatesByRUT() {
    console.log('🧹 Iniciando limpieza de empleados duplicados por RUT...\n');
    
    try {
        // Buscar empleados duplicados por RUT
        const duplicates = await db.query(`
            SELECT 
                REPLACE(REPLACE(rut, ".", ""), "-", "") as rut_clean,
                COUNT(*) as count,
                GROUP_CONCAT(id) as ids,
                GROUP_CONCAT(nombre) as nombres
            FROM empleados 
            WHERE activo = 1
            GROUP BY REPLACE(REPLACE(rut, ".", ""), "-", "")
            HAVING COUNT(*) > 1
            ORDER BY count DESC
        `);

        if (duplicates.length === 0) {
            console.log('✅ No se encontraron empleados duplicados por RUT');
            return;
        }

        console.log(`📋 Encontrados ${duplicates.length} RUTs con duplicados:`);
        
        let totalProcessed = 0;
        let totalMerged = 0;
        let totalDeleted = 0;

        for (const dup of duplicates) {
            const ids = dup.ids.split(',').map(id => parseInt(id));
            const nombres = dup.nombres.split(',');
            
            console.log(`\\n🔍 RUT: ${dup.rut_clean} (${dup.count} registros)`);
            console.log(`   IDs: ${ids.join(', ')}`);
            console.log(`   Nombres: ${nombres.join(' | ')}`);

            // Obtener detalles completos de todos los duplicados
            const employees = await db.query(
                `SELECT * FROM empleados WHERE id IN (${ids.map(() => '?').join(',')}) ORDER BY created_at DESC`,
                ids
            );

            // El más reciente será el principal (primero en el orden DESC)
            const mainEmployee = employees[0];
            const duplicatedEmployees = employees.slice(1);

            console.log(`   📌 Principal: ID ${mainEmployee.id} - ${mainEmployee.nombre}`);
            console.log(`   🗑️  Duplicados: ${duplicatedEmployees.map(e => `ID ${e.id}`).join(', ')}`);

            // Combinar datos: tomar el más completo
            const mergedData = {
                numero: mainEmployee.numero || duplicatedEmployees.find(e => e.numero)?.numero,
                nombre: mainEmployee.nombre || duplicatedEmployees.find(e => e.nombre)?.nombre,
                rut: mainEmployee.rut || duplicatedEmployees.find(e => e.rut)?.rut,
                email: mainEmployee.email || duplicatedEmployees.find(e => e.email)?.email,
                fecha_nacimiento: mainEmployee.fecha_nacimiento || duplicatedEmployees.find(e => e.fecha_nacimiento)?.fecha_nacimiento,
                fecha_ingreso: mainEmployee.fecha_ingreso || duplicatedEmployees.find(e => e.fecha_ingreso)?.fecha_ingreso,
                cargo: mainEmployee.cargo || duplicatedEmployees.find(e => e.cargo)?.cargo,
                supervisor: mainEmployee.supervisor || duplicatedEmployees.find(e => e.supervisor)?.supervisor,
                autorizacion: mainEmployee.autorizacion || duplicatedEmployees.find(e => e.autorizacion)?.autorizacion,
                
                // Para datos numéricos, tomar el mayor valor
                uso_primer_semestre: Math.max(
                    mainEmployee.uso_primer_semestre || 0,
                    ...duplicatedEmployees.map(e => e.uso_primer_semestre || 0)
                ),
                uso_segundo_semestre: Math.max(
                    mainEmployee.uso_segundo_semestre || 0,
                    ...duplicatedEmployees.map(e => e.uso_segundo_semestre || 0)
                ),
                sin_goce: Math.max(
                    mainEmployee.sin_goce || 0,
                    ...duplicatedEmployees.map(e => e.sin_goce || 0)
                ),
                licencias_total: Math.max(
                    mainEmployee.licencias_total || 0,
                    ...duplicatedEmployees.map(e => e.licencias_total || 0)
                ),
                atrasos: Math.max(
                    mainEmployee.atrasos || 0,
                    ...duplicatedEmployees.map(e => e.atrasos || 0)
                ),
                no_marcaciones: Math.max(
                    mainEmployee.no_marcaciones || 0,
                    ...duplicatedEmployees.map(e => e.no_marcaciones || 0)
                ),

                // Mantener credenciales del principal
                password_hash: mainEmployee.password_hash,
                email_verificado: mainEmployee.email_verificado,
                fecha_ultimo_login: mainEmployee.fecha_ultimo_login,
                primer_login: mainEmployee.primer_login
            };

            // Actualizar empleado principal con datos combinados
            await db.run(`
                UPDATE empleados SET
                    numero = ?, nombre = ?, email = ?, fecha_nacimiento = ?, fecha_ingreso = ?,
                    cargo = ?, supervisor = ?, autorizacion = ?,
                    uso_primer_semestre = ?, uso_segundo_semestre = ?, sin_goce = ?,
                    licencias_total = ?, atrasos = ?, no_marcaciones = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [
                mergedData.numero, mergedData.nombre, mergedData.email, 
                mergedData.fecha_nacimiento, mergedData.fecha_ingreso,
                mergedData.cargo, mergedData.supervisor, mergedData.autorizacion,
                mergedData.uso_primer_semestre, mergedData.uso_segundo_semestre, mergedData.sin_goce,
                mergedData.licencias_total, mergedData.atrasos, mergedData.no_marcaciones,
                mainEmployee.id
            ]);

            console.log(`   ✅ Datos combinados en ID ${mainEmployee.id}`);

            // Eliminar empleados duplicados
            for (const dupEmp of duplicatedEmployees) {
                await db.run('UPDATE empleados SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [dupEmp.id]);
                console.log(`   🗑️  Desactivado ID ${dupEmp.id}`);
                totalDeleted++;
            }

            totalProcessed++;
            totalMerged++;
        }

        console.log('\\n📊 Resumen de limpieza:');
        console.log(`  🔍 RUTs procesados: ${totalProcessed}`);
        console.log(`  ✅ Registros combinados: ${totalMerged}`);
        console.log(`  🗑️  Registros desactivados: ${totalDeleted}`);
        console.log('\\n✅ Limpieza completada exitosamente!');

        // Mostrar estadísticas finales
        const activeEmployees = await db.query('SELECT COUNT(*) as count FROM empleados WHERE activo = 1');
        console.log(`\\n📈 Total empleados activos: ${activeEmployees[0].count}`);
        
    } catch (error) {
        console.error('❌ Error en limpieza:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    cleanDuplicatesByRUT();
}

module.exports = { cleanDuplicatesByRUT };