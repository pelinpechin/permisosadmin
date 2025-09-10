const { supabase } = require('./database/db_config');

async function verificarSubordinados() {
  console.log('🔍 Verificando subordinados de Miguel Rodriguez...');
  
  try {
    // Buscar empleados que tienen a Miguel como supervisor
    const { data: subordinados, error } = await supabase
      .from('empleados')
      .select('id, nombre, rut, cargo, supervisor')
      .eq('supervisor', 'RODRIGUEZ CABRERA MIGUEL ANGEL');
      
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    console.log(`👥 Subordinados de Miguel: ${subordinados?.length || 0}`);
    subordinados?.forEach(emp => {
      console.log(`   - ${emp.nombre} (RUT: ${emp.rut}) - ${emp.cargo}`);
    });
    
    // También verificar por otros campos posibles
    const { data: porVisualizacion } = await supabase
      .from('empleados')
      .select('id, nombre, rut, cargo, visualizacion')
      .eq('visualizacion', 'RODRIGUEZ CABRERA MIGUEL ANGEL');
      
    if (porVisualizacion && porVisualizacion.length > 0) {
      console.log(`\n📊 Por campo visualización: ${porVisualizacion.length}`);
      porVisualizacion.forEach(emp => {
        console.log(`   - ${emp.nombre} (RUT: ${emp.rut})`);
      });
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

verificarSubordinados();