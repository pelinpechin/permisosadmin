const fs = require('fs');
const path = require('path');
const db = require('../database/db_config');
require('dotenv').config();

async function migrateTablas() {
    console.log('📊 Iniciando migración desde tablas.csv...\n');
    
    try {
        // Leer archivo CSV
        const csvPath = path.join(__dirname, '..', 'tablas.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        const lines = csvContent.split('\n');
        
        console.log(`📄 Total de líneas en CSV: ${lines.length}`);
        
        let processed = 0;
        let updated = 0;
        let created = 0;
        
        // Procesar líneas (saltar headers)
        for (let i = 4; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('w;') || line.startsWith(';;;;;')) continue;
            
            // Separar por punto y coma
            const columns = line.split(';');
            
            if (columns.length < 8) continue;
            
            const numero = columns[1]?.trim();
            const nombre = columns[2]?.trim();
            const rut = columns[3]?.trim();
            const fechaNacimiento = columns[4]?.trim();
            const cargo = columns[5]?.trim();
            const negColectiva = columns[6]?.trim() === 'SI';
            const supervisor = columns[7]?.trim();
            const autorizador = columns[8]?.trim();
            
            // Datos de permisos
            const uso1Semestre = parseFloat(columns[9]) || 0;
            const uso2Semestre = parseFloat(columns[10]) || 0;
            const sinGoce = parseFloat(columns[11]) || 0;
            const benLicencia = parseFloat(columns[12]) || 0;
            const licenciasTotal = parseFloat(columns[13]) || 0;
            const atrasos = parseFloat(columns[14]) || 0;
            const atrasosJustificados = parseFloat(columns[15]) || 0;
            const noMarcaciones = parseFloat(columns[16]) || 0;
            
            if (!numero || !nombre || !rut) continue;
            
            console.log(`Procesando: ${numero} - ${nombre} (${rut})`);
            
            try {
                // Formatear fecha de nacimiento
                let fechaNacimientoFormatted = null;
                if (fechaNacimiento) {
                    const dateParts = fechaNacimiento.split('-');
                    if (dateParts.length === 3) {
                        fechaNacimientoFormatted = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
                    }
                }
                
                // Buscar si existe el empleado
                const existingEmployee = await db.query(
                    'SELECT id FROM empleados WHERE REPLACE(REPLACE(rut, ".", ""), "-", "") = ?',
                    [rut.replace(/\./g, '').replace(/-/g, '')]
                );
                
                if (existingEmployee.length > 0) {
                    // Actualizar empleado existente
                    await db.run(`
                        UPDATE empleados SET
                            numero = ?,
                            nombre = ?,
                            fecha_nacimiento = ?,
                            cargo = ?,
                            negociacion_colectiva = ?,
                            supervisor = ?,
                            autorizacion = ?,
                            uso_primer_semestre = ?,
                            uso_segundo_semestre = ?,
                            sin_goce = ?,
                            beneficio_licencia = ?,
                            licencias_total = ?,
                            atrasos = ?,
                            atrasos_justificados = ?,
                            no_marcaciones = ?,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `, [
                        parseInt(numero),
                        nombre,
                        fechaNacimientoFormatted,
                        cargo,
                        negColectiva,
                        supervisor,
                        autorizador,
                        uso1Semestre,
                        uso2Semestre,
                        sinGoce,
                        benLicencia,
                        licenciasTotal,
                        atrasos,
                        atrasosJustificados,
                        noMarcaciones,
                        existingEmployee[0].id
                    ]);
                    
                    updated++;
                    console.log(`  ✅ Actualizado: ${nombre}`);
                } else {
                    // Crear nuevo empleado
                    await db.run(`
                        INSERT INTO empleados (
                            numero, nombre, rut, fecha_nacimiento, cargo,
                            negociacion_colectiva, supervisor, autorizacion,
                            uso_primer_semestre, uso_segundo_semestre, sin_goce,
                            beneficio_licencia, licencias_total, atrasos,
                            atrasos_justificados, no_marcaciones,
                            activo, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    `, [
                        parseInt(numero),
                        nombre,
                        rut,
                        fechaNacimientoFormatted,
                        cargo,
                        negColectiva,
                        supervisor,
                        autorizador,
                        uso1Semestre,
                        uso2Semestre,
                        sinGoce,
                        benLicencia,
                        licenciasTotal,
                        atrasos,
                        atrasosJustificados,
                        noMarcaciones
                    ]);
                    
                    created++;
                    console.log(`  ✅ Creado: ${nombre}`);
                }
                
                processed++;
                
            } catch (error) {
                console.error(`  ❌ Error procesando ${nombre}:`, error.message);
            }
        }
        
        console.log('\n📊 Resumen de migración:');
        console.log(`  📝 Empleados procesados: ${processed}`);
        console.log(`  ✅ Empleados actualizados: ${updated}`);
        console.log(`  🆕 Empleados creados: ${created}`);
        console.log('\n✅ Migración completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error en migración:', error);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    migrateTablas();
}

module.exports = { migrateTablas };