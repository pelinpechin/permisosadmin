const bcrypt = require('bcrypt');

async function generarTodasLasPasswords() {
    const usuarios = [
        { id: 1, nombre: 'Ronny Cisterna', username: 'ronny.cisterna', password: 'ronny123' },
        { id: 2, nombre: 'Patricio Bravo', username: 'patricio.bravo', password: 'patricio123' },
        { id: 3, nombre: 'Andrea Naguelquin', username: 'andrea.naguelquin', password: 'andrea123' },
        { id: 4, nombre: 'Francisco Mancilla', username: 'francisco.mancilla', password: 'francisco123' },
        { id: 5, nombre: 'Miguel González', username: 'miguel.gonzalez', password: 'miguel123' },
        { id: 6, nombre: 'Carmen Silva', username: 'carmen.silva', password: 'carmen123' },
        { id: 7, nombre: 'Pedro Hernández', username: 'pedro.hernandez', password: 'pedro123' },
        { id: 8, nombre: 'Ana Martínez', username: 'ana.martinez', password: 'ana123' },
        { id: 9, nombre: 'Luis Morales', username: 'luis.morales', password: 'luis123' },
        { id: 10, nombre: 'Elena Vargas', username: 'elena.vargas', password: 'elena123' },
        { id: 11, nombre: 'Diego Fuentes', username: 'diego.fuentes', password: 'diego123' },
        { id: 12, nombre: 'Patricia Núñez', username: 'patricia.nunez', password: 'patricia123' },
        { id: 13, nombre: 'Ricardo Peña', username: 'ricardo.pena', password: 'ricardo123' },
        { id: 14, nombre: 'Mónica Castillo', username: 'monica.castillo', password: 'monica123' },
        { id: 15, nombre: 'Javier Espinoza', username: 'javier.espinoza', password: 'javier123' },
        { id: 16, nombre: 'Claudia Moreno', username: 'claudia.moreno', password: 'claudia123' },
        { id: 17, nombre: 'Sergio Aguirre', username: 'sergio.aguirre', password: 'sergio123' },
        { id: 18, nombre: 'Francisca Delgado', username: 'francisca.delgado', password: 'francisca123' }
    ];

    console.log('-- =============================================');
    console.log('-- ACTUALIZAR CONTRASEÑAS PARA TODOS LOS USUARIOS');
    console.log('-- =============================================\n');

    for (const user of usuarios) {
        const hash = await bcrypt.hash(user.password, 10);
        console.log(`-- ${user.nombre} (${user.username})`);
        console.log(`UPDATE usuarios SET password_hash = '${hash}' WHERE empleado_id = ${user.id};`);
        console.log('');
    }

    console.log('-- =============================================');
    console.log('-- CREDENCIALES DE ACCESO PARA TODOS:');
    console.log('-- =============================================');
    console.log('| Usuario | Password | Rol |');
    console.log('|---------|----------|-----|');
    usuarios.forEach(user => {
        const rol = user.id <= 3 ? 'Admin/Supervisor' : 
                   [14, 15, 16].includes(user.id) ? 'Supervisor' : 'Empleado';
        console.log(`| ${user.username} | ${user.password} | ${rol} |`);
    });
}

generarTodasLasPasswords().catch(console.error);