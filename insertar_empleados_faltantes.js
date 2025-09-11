const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nbxsjrzsanlcflqpkghv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieHNqcnpzYW5sY2ZscXBrZ2h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDgzOTgsImV4cCI6MjA3MzE4NDM5OH0.flkkZrFGHashSxZPcY2cRYXmRmcftB72bXo4_Q7-lgA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertarEmpleadosClave() {
    try {
        console.log('👥 Insertando empleados clave...\n');
        
        // Verificar empleados existentes
        const { data: existentes, error: existError } = await supabase
            .from('empleados')
            .select('nombre');
            
        if (existError) {
            console.error('❌ Error consultando empleados:', existError);
            return;
        }
        
        console.log(`📊 Empleados actuales en BD: ${existentes.length}`);
        existentes.forEach(emp => console.log(`   - ${emp.nombre}`));
        
        // Empleados clave que necesitamos
        const empleadosClave = [
            {
                rut: '15.582.779-3',
                nombre: 'Naguelquin Garcia Andrea Alejandra',
                cargo: 'ENCARGADO DE TESORERIA',
                supervisor_nombre: 'Ronny Ignacio Cisterna Galaz',
                email: 'andrea.naguelquin@gmail.com',
                es_supervisor: true,
                es_admin: false
            },
            {
                rut: '17.238.098-0',
                nombre: 'Mancilla Vargas Francisco Gerardo',
                cargo: 'ADMINISTRATIVO DE RECAUDACION',
                supervisor_nombre: 'Andrea Alejandra Naguelquin Garcia',
                email: 'fmancilla04@gmail.com',
                es_supervisor: false,
                es_admin: false
            },
            {
                rut: '15.436.531-1',
                nombre: 'Cisterna Galaz Ronny Ignacio',
                cargo: 'ADMINISTRADOR',
                supervisor_nombre: 'Ronny Ignacio Cisterna Galaz',
                email: 'rcisternagalaz@gmail.com',
                es_supervisor: true,
                es_admin: true
            }
        ];
        
        // Insertar empleados que no existen
        for (const emp of empleadosClave) {
            const existe = existentes.find(e => e.nombre.includes(emp.nombre.split(' ')[0]));
            
            if (!existe) {
                console.log(`➕ Insertando: ${emp.nombre}`);
                
                const { data, error } = await supabase
                    .from('empleados')
                    .insert([emp])
                    .select();
                    
                if (error) {
                    console.error(`❌ Error insertando ${emp.nombre}:`, error);
                } else {
                    console.log(`✅ Insertado: ${emp.nombre} (ID: ${data[0].id})`);
                }
            } else {
                console.log(`⚠️ Ya existe: ${emp.nombre}`);
            }
        }
        
        // Verificar resultado final
        const { data: finales, error: finalError } = await supabase
            .from('empleados')
            .select('id, nombre, cargo, supervisor_nombre')
            .order('id');
            
        if (!finalError) {
            console.log(`\n📊 EMPLEADOS FINALES: ${finales.length}`);
            finales.forEach(emp => {
                console.log(`   ${emp.id}. ${emp.nombre} (${emp.cargo})`);
                if (emp.supervisor_nombre) {
                    console.log(`      Supervisor: ${emp.supervisor_nombre}`);
                }
            });
        }
        
        // Insertar usuarios básicos
        console.log('\n🔑 Creando usuarios básicos...');
        
        const usuarios = [
            { empleado_id: null, username: 'andrea.naguelquin', password_hash: '$2b$10$eoTCVr89MPJ8Iq.dyGImbuJpTvpFKu1eGVuMJn5AtdS.K1okMjs4O' },
            { empleado_id: null, username: 'francisco.mancilla', password_hash: '$2b$10$NNPnWWYRIDWbl4esfN4St.8Dh1rEFuO90MKQlXZ2R7JkkldATDpH2' },
            { empleado_id: null, username: 'ronny.cisterna', password_hash: '$2b$10$Z8a8Is4C8Hd3Y.k483n4aeUViIyfz687kXgoDqE4wu09HYf4kMyR6' },
            { empleado_id: null, username: 'nelson.bravo', password_hash: '$2b$10$ZRHzPEUhQNSCQy0vU4kXvuMJI1sQ2o10duCM3XBznpp0J407/5Atk2' }
        ];
        
        // Asignar empleado_id basándose en nombres
        for (const usuario of usuarios) {
            let nombreBuscar = '';
            if (usuario.username.includes('andrea')) nombreBuscar = 'Andrea';
            else if (usuario.username.includes('francisco')) nombreBuscar = 'Francisco';
            else if (usuario.username.includes('ronny')) nombreBuscar = 'Ronny';
            else if (usuario.username.includes('nelson')) nombreBuscar = 'Nelson';
            
            const empleado = finales.find(e => e.nombre.includes(nombreBuscar));
            if (empleado) {
                usuario.empleado_id = empleado.id;
                
                // Verificar si ya existe
                const { data: existeUsuario } = await supabase
                    .from('usuarios')
                    .select('id')
                    .eq('username', usuario.username)
                    .single();
                    
                if (!existeUsuario) {
                    const { error: userError } = await supabase
                        .from('usuarios')
                        .insert([{
                            empleado_id: usuario.empleado_id,
                            username: usuario.username,
                            password_hash: usuario.password_hash
                        }]);
                        
                    if (userError) {
                        console.error(`❌ Error creando usuario ${usuario.username}:`, userError);
                    } else {
                        console.log(`✅ Usuario creado: ${usuario.username}`);
                    }
                } else {
                    console.log(`⚠️ Usuario ya existe: ${usuario.username}`);
                }
            }
        }
        
        // Crear solicitud de prueba de Francisco
        console.log('\n📋 Creando solicitud de prueba...');
        const francisco = finales.find(e => e.nombre.includes('Francisco'));
        if (francisco) {
            const { data: existeSolicitud } = await supabase
                .from('solicitudes_permisos')
                .select('id')
                .eq('empleado_id', francisco.id)
                .single();
                
            if (!existeSolicitud) {
                const { error: solError } = await supabase
                    .from('solicitudes_permisos')
                    .insert([{
                        empleado_id: francisco.id,
                        tipo_permiso_id: 1,
                        fecha_desde: '2025-01-20',
                        fecha_hasta: '2025-01-20',
                        motivo: 'Cita médica familiar',
                        estado: 'PENDIENTE'
                    }]);
                    
                if (solError) {
                    console.error('❌ Error creando solicitud:', solError);
                } else {
                    console.log('✅ Solicitud de prueba creada para Francisco');
                }
            } else {
                console.log('⚠️ Solicitud de prueba ya existe');
            }
        }
        
        console.log('\n🎉 ¡CONFIGURACIÓN COMPLETA!');
        
    } catch (error) {
        console.error('💥 Error:', error);
    }
}

insertarEmpleadosClave();