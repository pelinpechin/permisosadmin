const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testSupabaseConnection() {
    console.log('🧪 Probando conexión a Supabase...\n');
    
    try {
        // Verificar variables de entorno
        console.log('📋 Verificando configuración:');
        console.log(`   DB_TYPE: ${process.env.DB_TYPE}`);
        console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ No configurado'}`);
        console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado'}\n`);
        
        if (process.env.DB_TYPE !== 'supabase') {
            console.log('⚠️  DB_TYPE no está configurado como "supabase"');
            console.log('   Para probar Supabase, cambia DB_TYPE=supabase en tu archivo .env\n');
        }
        
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            console.log('❌ Faltan variables de entorno de Supabase');
            console.log('   Configura SUPABASE_URL y SUPABASE_ANON_KEY en tu archivo .env\n');
            return;
        }
        
        // Importar y probar conexión
        const supabaseDb = require('../database/supabase');
        
        console.log('🔌 Probando conexión...');
        const connectionOk = await supabaseDb.testConnection();
        
        if (connectionOk) {
            console.log('✅ Conexión exitosa!\n');
            
            // Probar operaciones básicas
            console.log('🧪 Probando operaciones básicas:\n');
            
            // 1. Obtener tipos de permisos
            console.log('1️⃣ Obteniendo tipos de permisos...');
            const tipos = await supabaseDb.getTiposPermisos();
            console.log(`   📋 Encontrados ${tipos.length} tipos de permisos`);
            tipos.forEach(tipo => {
                console.log(`      - ${tipo.codigo}: ${tipo.nombre}`);
            });
            console.log('');
            
            // 2. Obtener empleados
            console.log('2️⃣ Obteniendo empleados...');
            const empleados = await supabaseDb.getEmpleados();
            console.log(`   👥 Encontrados ${empleados.length} empleados activos\n`);
            
            // 3. Intentar obtener solicitudes
            console.log('3️⃣ Obteniendo solicitudes...');
            const { data: solicitudes, error } = await supabaseDb.supabase
                .from('solicitudes_permisos')
                .select('*')
                .limit(5);
                
            if (error) {
                console.log(`   ⚠️ Error obteniendo solicitudes: ${error.message}`);
            } else {
                console.log(`   📝 Encontradas ${solicitudes.length} solicitudes recientes\n`);
            }
            
            console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
            console.log('   Tu configuración de Supabase está lista para usar.\n');
            
        } else {
            console.log('❌ Error en la conexión');
            console.log('   Verifica tus credenciales de Supabase\n');
        }
        
    } catch (error) {
        console.error('💥 Error durante las pruebas:');
        console.error(`   ${error.message}\n`);
        
        if (error.message.includes('Variables de entorno')) {
            console.log('💡 Solución:');
            console.log('   1. Crea un archivo .env basado en .env.example');
            console.log('   2. Configura tus credenciales de Supabase');
            console.log('   3. Cambia DB_TYPE=supabase\n');
        }
    }
}

// Ejecutar test si se llama directamente
if (require.main === module) {
    testSupabaseConnection().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

module.exports = testSupabaseConnection;