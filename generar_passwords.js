const bcrypt = require('bcrypt');

async function generarPasswords() {
    const usuarios = [
        { nombre: 'Andrea Naguelquin', password: 'andrea123' },
        { nombre: 'Francisco Mancilla', password: 'francisco123' },
        { nombre: 'Ronny Cisterna', password: 'ronny123' },
        { nombre: 'Patricio Bravo', password: 'patricio123' }
    ];

    console.log('-- HASHES DE CONTRASEÑAS PARA INSERTAR EN USUARIOS --\n');

    for (let i = 0; i < usuarios.length; i++) {
        const user = usuarios[i];
        const hash = await bcrypt.hash(user.password, 10);
        console.log(`-- ${user.nombre}`);
        console.log(`UPDATE usuarios SET password_hash = '${hash}' WHERE empleado_id = ${i + 1};`);
        console.log(`-- Password: ${user.password}\n`);
    }

    console.log('-- COPIAR Y PEGAR ESTOS UPDATES DESPUÉS DE CREAR LA BASE DE DATOS --');
}

generarPasswords().catch(console.error);