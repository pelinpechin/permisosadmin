const fs = require('fs');
const bcrypt = require('bcrypt');

function procesarEmpleadosCSV() {
    try {
        console.log('📊 Procesando empleados desde CSV...\n');
        
        const csvContent = fs.readFileSync('base.csv', 'utf-8');
        const lines = csvContent.split('\n');
        
        // Buscar la línea de headers (línea 6)
        const headerLine = lines[5]; // 0-indexed, línea 6 del archivo
        console.log('📋 Headers encontrados:', headerLine);
        
        // Procesar empleados desde línea 7 hasta 125 (índices 6 a 124)
        const empleados = [];
        
        for (let i = 6; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line === '') continue;
            
            const cols = line.split(';');
            if (cols.length >= 9) {
                const empleado = {
                    nombre: cols[0],
                    rut: cols[1],
                    email: cols[2],
                    fechaNac: cols[3],
                    fechaIngreso: cols[4],
                    fechaTermino: cols[5] || null,
                    horasSemanales: cols[6],
                    supervisor: cols[7],
                    cargo: cols[8]
                };
                empleados.push(empleado);
            }
        }
        
        console.log(`👥 TOTAL EMPLEADOS PROCESADOS: ${empleados.length}\n`);
        
        // Generar SQL para insertar empleados
        console.log('-- =============================================');
        console.log('-- INSERTAR TODOS LOS EMPLEADOS REALES');
        console.log('-- =============================================\n');
        
        console.log('INSERT INTO empleados (rut, nombre, cargo, supervisor_nombre, email, es_supervisor, es_admin) VALUES');
        
        const sqlInserts = empleados.map((emp, index) => {
            // Determinar si es supervisor (aparece en la columna supervisor de otros)
            const esSupervisor = empleados.some(e => 
                e.supervisor && e.supervisor.toLowerCase().includes(emp.nombre.toLowerCase().split(' ')[0])
            );
            
            // Determinar si es admin (cargos específicos)
            const esAdmin = emp.cargo && (
                emp.cargo.includes('DIRECTOR') ||
                emp.cargo.includes('ADMINISTRADOR') ||
                emp.cargo.includes('GERENTE') ||
                emp.nombre.includes('Ronny') ||
                emp.nombre.includes('Nelson Patricio')
            );
            
            const nombre = emp.nombre.replace(/'/g, "''");
            const cargo = emp.cargo ? emp.cargo.replace(/'/g, "''") : 'EMPLEADO';
            const supervisor = emp.supervisor ? emp.supervisor.replace(/'/g, "''") : null;
            const email = emp.email || null;
            
            return `('${emp.rut}', '${nombre}', '${cargo}', ${supervisor ? `'${supervisor}'` : 'NULL'}, ${email ? `'${email}'` : 'NULL'}, ${esSupervisor}, ${esAdmin})`;
        });
        
        // Mostrar en grupos de 10 para no sobrecargar
        sqlInserts.forEach((sql, index) => {
            if (index === sqlInserts.length - 1) {
                console.log(sql + ';'); // Último elemento con punto y coma
            } else {
                console.log(sql + ',');
            }
        });
        
        console.log('\n-- =============================================');
        console.log('-- CREAR USUARIOS PARA TODOS LOS EMPLEADOS');
        console.log('-- =============================================\n');
        
        console.log('INSERT INTO usuarios (empleado_id, username, password_hash) VALUES');
        
        const usuariosSQL = empleados.map((emp, index) => {
            const username = emp.nombre.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
                .replace(/\s+/g, '.')
                .replace(/[^a-z0-9.]/g, '');
            
            return `(${index + 1}, '${username}', '$2b$10$placeholder')`;
        });
        
        usuariosSQL.forEach((sql, index) => {
            if (index === usuariosSQL.length - 1) {
                console.log(sql + ';');
            } else {
                console.log(sql + ',');
            }
        });
        
        console.log('\n-- =============================================');
        console.log('-- CREDENCIALES DE ACCESO');
        console.log('-- =============================================');
        console.log('| Usuario | Password | Cargo |');
        console.log('|---------|----------|-------|');
        
        empleados.slice(0, 20).forEach((emp, index) => { // Mostrar solo los primeros 20
            const username = emp.nombre.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '.')
                .replace(/[^a-z0-9.]/g, '');
            const password = username.split('.')[0] + '123';
            console.log(`| ${username} | ${password} | ${emp.cargo} |`);
        });
        
        console.log('| ... | ... | ... |');
        console.log(`| Total: ${empleados.length} empleados | | |`);
        
        // Buscar Andrea y Francisco específicamente
        console.log('\n-- =============================================');
        console.log('-- EMPLEADOS CLAVE DEL SISTEMA');
        console.log('-- =============================================');
        
        const andrea = empleados.find(e => e.nombre.includes('Andrea') && e.nombre.includes('Naguelquin'));
        const francisco = empleados.find(e => e.nombre.includes('Francisco') && e.nombre.includes('Mancilla'));
        const ronny = empleados.find(e => e.nombre.includes('Ronny') && e.nombre.includes('Cisterna'));
        const patricio = empleados.find(e => e.nombre.includes('Nelson Patricio') && e.nombre.includes('Bravo'));
        
        if (andrea) {
            console.log(`✅ ANDREA: ${andrea.nombre} (${andrea.rut}) - ${andrea.cargo}`);
            console.log(`   Supervisor: ${andrea.supervisor || 'N/A'}`);
        }
        
        if (francisco) {
            console.log(`✅ FRANCISCO: ${francisco.nombre} (${francisco.rut}) - ${francisco.cargo}`);
            console.log(`   Supervisor: ${francisco.supervisor || 'N/A'}`);
        }
        
        if (ronny) {
            console.log(`✅ RONNY: ${ronny.nombre} (${ronny.rut}) - ${ronny.cargo}`);
        }
        
        if (patricio) {
            console.log(`✅ PATRICIO: ${patricio.nombre} (${patricio.rut}) - ${patricio.cargo}`);
        }
        
        // Generar solicitud de prueba de Francisco
        if (francisco) {
            const franciscoIndex = empleados.indexOf(francisco) + 1;
            console.log('\n-- SOLICITUD DE PRUEBA DE FRANCISCO:');
            console.log(`INSERT INTO solicitudes_permisos (empleado_id, tipo_permiso_id, fecha_desde, fecha_hasta, motivo, estado) VALUES`);
            console.log(`(${franciscoIndex}, 1, '2025-01-20', '2025-01-20', 'Cita médica familiar', 'PENDIENTE');`);
        }
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

procesarEmpleadosCSV();