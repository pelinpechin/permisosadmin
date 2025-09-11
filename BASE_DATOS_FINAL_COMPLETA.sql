-- ============================================================================
-- NUEVA BASE DE DATOS COMPLETA PARA SISTEMA DE PERMISOS
-- CON TODOS LOS 119 EMPLEADOS REALES DEL PROYECTO
-- ============================================================================

-- 1. TABLA DE TIPOS DE PERMISOS
CREATE TABLE tipos_permisos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(5) NOT NULL UNIQUE, -- T, AM, PM, S
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color_hex VARCHAR(7) DEFAULT '#007bff',
    dias_permitidos_anio INTEGER DEFAULT 0,
    es_con_goce BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE EMPLEADOS (ESTRUCTURA SIMPLIFICADA)
CREATE TABLE empleados (
    id SERIAL PRIMARY KEY,
    rut VARCHAR(12) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    cargo VARCHAR(100),
    supervisor_nombre VARCHAR(200), -- Nombre del supervisor (temporal)
    supervisor_id INTEGER, -- FK que se actualizará después
    email VARCHAR(100),
    es_supervisor BOOLEAN DEFAULT false,
    es_admin BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE USUARIOS/CREDENCIALES
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE SOLICITUDES DE PERMISOS (SIMPLIFICADA)
CREATE TABLE solicitudes_permisos (
    id SERIAL PRIMARY KEY,
    empleado_id INTEGER NOT NULL REFERENCES empleados(id),
    tipo_permiso_id INTEGER NOT NULL REFERENCES tipos_permisos(id),
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE NOT NULL,
    motivo TEXT NOT NULL,
    observaciones TEXT,
    
    -- Estados simples: PENDIENTE, APROBADO, RECHAZADO
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    
    -- Aprobación
    aprobado_por_id INTEGER REFERENCES empleados(id),
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    comentario_aprobacion TEXT,
    
    -- Rechazo
    rechazado_por_id INTEGER REFERENCES empleados(id),
    fecha_rechazo TIMESTAMP WITH TIME ZONE,
    motivo_rechazo TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INSERTAR TIPOS DE PERMISOS
INSERT INTO tipos_permisos (codigo, nombre, descripcion, color_hex, dias_permitidos_anio, es_con_goce) VALUES
('T', 'Permiso Jornada Completa', 'Permiso por día completo con goce de sueldo', '#28a745', 15, true),
('AM', 'Permiso Primera Media Jornada', 'Permiso de medio día en la mañana', '#ffc107', 30, true),
('PM', 'Permiso Segunda Media Jornada', 'Permiso de medio día en la tarde', '#fd7e14', 30, true),
('S', 'Permiso Sin Goce de Sueldo', 'Permiso sin goce de sueldo', '#6c757d', 0, false);

-- 6. INSERTAR TODOS LOS 119 EMPLEADOS REALES
INSERT INTO empleados (rut, nombre, cargo, supervisor_nombre, email, es_supervisor, es_admin) VALUES
('18.208.947-8', 'Barria Uribe Guillermo David', 'ASISTENTE DE RECURSOS HUMANOS', 'Miguel Angel Rodriguez Cabrera', 'guibarri23@gmail.com', true, false),
('15.382.085-6', 'Solis Ruiz Maria Jose', 'EDUCADORA DE PARVULOS', 'Luz Eliana Barria Altamirano', 'majosolis@gmail.com', false, false),
('16.651.662-5', 'Cardenas Cardenas Teresa Del Carmen', 'EDUCADORA DE PARVULOS', 'Luz Eliana Barria Altamirano', 'terecardcard@hotmail.com', false, false),
('16.856.834-7', 'Cancino Vasquez Alex Manuel', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'alexcancinov14@gmail.com', false, false),
('17.852.035-0', 'Canio Vera Natalia Belen', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'ncanio@liceoexperimental.cl', false, false),
('19.254.439-4', 'Barria Galindo Romina Fernanda', 'DOCENTE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'rominabarria.fernanda@gmail.com', true, false),
('7.234.072-8', 'Neira Johnston Ana Maria', 'DOCENTE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'aneiraj@yahoo.com', false, false),
('8.198.188-4', 'Villegas Muñoz Silvia Alejandra', 'ENCARGADO DE RELACIONES LABORALES', 'Ronny Ignacio Cisterna Galaz', 'silvia.villegasmunoz@gmail.com', false, false),
('8.219.744-3', 'Rodriguez Paredes Ninfa Margarita', 'TECNICO EN PARVULOS', 'Luz Eliana Barria Altamirano', 'nrodriguez@liceoexperimental.cl', true, false),
('8.618.404-4', 'Quinchen Reyes Gloria Del Carmen', 'AUXILIAR DE ASEO', 'Francisco Alberto Gonzalez Cabello', 'gloriaquinchen@gmail.com', false, false),
('8.706.268-6', 'Fajardo Cuiñas Jessica Ester', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'fajardo.jessy@gmail.com', false, false),
('9.222.042-7', 'Contreras Zambrano Ruth Gabriela', 'EDUCADORA DIFERENCIAL', 'Jorge Andres Vasquez Almonacid', 'ruth2162@gmail.com', false, false),
('9.267.550-5', 'Hernandez Miranda Viviana Lisette', 'ASISTENTE SOCIAL', 'Ivan Alejandro Figueroa Delgado', 'viviher_78@hotmail.com', false, false),
('9.348.634-k', 'Andrade Ojeda Deice Janet', 'TECNICO EN PARVULOS', 'Luz Eliana Barria Altamirano', 'dandrade@liceoexperimental.cl', false, false),
('9.531.692-1', 'Alarcon Reyes Andrea Virginia', 'SECRETARIA DE DIRECCION', 'Nelson Patricio Bravo Jorquera', 'avar.alarcon@gmail.com', false, false),
('10.078.481-5', 'Bahamonde Subiabre Manuel Antonio', 'AUXILIAR DE MANTENCION', 'Francisco Alberto Gonzalez Cabello', 'bompemanuba@gmail.com', false, false),
('10.103.786-k', 'Cortez Avendaño Maricela Ines', 'ASISTENTE DE AULA', 'Jorge Andres Vasquez Almonacid', 'maincav75@hotmail.com', false, false),
('10.426.479-4', 'Molina Araya Marlen Del Carmen', 'DOCENTE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'molina.marlen@gmail.com', false, false),
('10.504.013-k', 'Perez Ramirez Fredy Armando', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'fredyfis@icloud.com', false, false),
('10.614.752-3', 'Mansilla Mansilla Maribel Del Carmen', 'ORIENTADOR(A)', 'Nelson Patricio Bravo Jorquera', 'mirabel1970@gmail.com', false, false),
('10.663.373-8', 'Saldivia Canihuante Jose Mario', 'AUXILIAR DE MANTENCION', 'Francisco Alberto Gonzalez Cabello', 'jose.saldivia@hotmail.com', false, false),
('10.968.495-3', 'Barrientos Diaz Patricia Judith', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'patyjbd@hotmail.com', false, false),
('11.939.898-3', 'Navea Ramos Paola Alejandra', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'panrmusic@hotmail.com', false, false),
('12.107.733-7', 'Toro Ojeda Josue Ban Eliab', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'josueobedeliab@gmail.com', false, false),
('12.327.339-7', 'Vidal Romero Angela Maria', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'angelavr36@gmail.com', false, false),
('12.716.664-1', 'Mercado Vargas Monica Cecilia', 'DOCENTE DE REEMPLAZO', 'Jorge Andres Vasquez Almonacid', 'LASVIOLETAS28@GMAIL.COM', false, false),
('12.937.354-7', 'Cardenas Diaz Paola Lorena', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'paolita262@hotmail.com', false, false),
('13.427.054-3', 'Bascuñan Cardenas Denisse Eliana', 'DOCENTE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'dbascunan@liceoexperimental.cl', false, false),
('13.480.402-5', 'Carreño Barrueto Margarita Evelyn', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'carrenobarruetomargarita@gmail.com', false, false),
('13.543.250-4', 'Hinojosa Zepeda Francisco Manuel', 'JEFE DE UTP', 'Nelson Patricio Bravo Jorquera', 'franciscohinojosa2003@yahoo.es', true, false),
('13.738.879-0', 'Hijerra Vargas Maria Ariela', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'hijerraariela@gmail.com', false, false),
('13.741.165-2', 'Ibarra Valdes Nelda Ines', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'nelda1979@hotmail.com', false, false),
('13.884.847-7', 'Diaz Bustos Miguel Angel', 'DOCENTE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'miguel.diazbustos@gmail.com', false, false),
('14.228.918-0', 'Venegas Cerpa Jacqueline Helvecia', 'TECNICO EN PARVULOS', 'Luz Eliana Barria Altamirano', 'jvenegascerpa@gmail.com', false, false),
('14.606.388-8', 'Araneda Torres Carlos Esteban', 'ASISTENTE DE UTP DE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'c.araneda.t@hotmail.com', false, false),
('15.306.990-5', 'Acuña Paillamán Ingrid Antonieta', 'DOCENTE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'ingacu@gmail.com', false, false),
('15.307.189-6', 'Santana Gallardo Viviana Margarita', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'vsantana@liceoexperimental.cl', false, false),
('15.309.499-3', 'Nuñez Mancilla Paola Alejandra', 'EDUCADORA DE PARVULOS', 'Luz Eliana Barria Altamirano', 'pnunez.educadora@gmail.com', false, false),
('15.309.686-4', 'Bahamonde Vargas Yasna Margarita', 'CONTADOR EEFF', 'Ronny Ignacio Cisterna Galaz', 'yasna.bahamonde@gmail.com', false, false),
('15.310.478-6', 'Vasquez Almonacid Jorge Andres', 'JEFE DE UTP', 'Nelson Patricio Bravo Jorquera', 'jvasquez@liceoexperimental.cl', true, false),
('15.310.529-4', 'Ilnao Barrientos Marta Del Carmen', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'martailnao@hotmail.com', false, false),
('15.310.843-9', 'Bravo Jorquera Nelson Patricio', 'DIRECTOR', 'Nelson Patricio Bravo Jorquera', 'pbravo83@gmail.com', true, true),
('15.382.851-2', 'Oyarzo Hidalgo Celso Antonio', 'MONITOR DE ACLES', 'Priscila Lisette Lemus Barria', 'coyarzo@liceoexperimental.cl', false, false),
('15.436.531-1', 'Cisterna Galaz Ronny Ignacio', 'ADMINISTRADOR', 'Ronny Ignacio Cisterna Galaz', 'rcisternagalaz@gmail.com', true, true),
('15.580.571-4', 'Marquez Rodriguez Andrea Tamara', 'ASISTENTE DE AULA', 'Jorge Andres Vasquez Almonacid', 'atmarquezr@gmail.com', false, false),
('15.582.779-3', 'Naguelquin Garcia Andrea Alejandra', 'ENCARGADO DE TESORERIA', 'Ronny Ignacio Cisterna Galaz', 'andrea.naguelquin@gmail.com', true, false),
('15.583.135-9', 'Hechenleitner Tapia Katherine Marcela', 'ENCARGADA DE CENTRAL DE APUNTES Y ESTAFETA', 'Jorge Andres Vasquez Almonacid', 'kahechenleitner84@gmail.com', false, false),
('15.905.484-5', 'Valdes Carcamo Janet Beatriz', 'ENCARGADA DEL CRA', 'Jorge Andres Vasquez Almonacid', 'jvaldes@liceoexperimental.cl', false, false),
('15.911.612-3', 'Vargas Vergara Catherine Alejandra', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'cvargas@liceoexperimental.cl', false, false),
('16.008.205-4', 'Subiabre Salviat Luis Alejandro', 'ENCARGADO DE INFORMATICA', 'Nelson Patricio Bravo Jorquera', 'luis.subiabre@gmail.com', false, false),
('16.065.801-0', 'Barrientos Barcena Alejandra Violeta', 'TECNICO EN PARVULOS', 'Luz Eliana Barria Altamirano', 'alejandrabtos.b85@gmail.com', false, false),
('16.163.028-4', 'Paredes Chavez Paulina Andrea', 'PROFESIONAL DE APOYO DE CONVIVENCIA ESCOLAR', 'Ivan Alejandro Figueroa Delgado', 'pparedes.ch@gmail.com', false, false),
('16.163.452-2', 'Zamorano Cayuno Araceli Alejandra', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'arkmaid858@hotmail.com', false, false),
('19.168.639-k', 'Contreras Vergara Camila Valentina', 'DOCENTE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'camila10710@gmail.com', false, false),
('16.236.711-0', 'Almonacid Soza Elizabeth De Las Mercedes', 'ASISTENTE DE AULA', 'Jorge Andres Vasquez Almonacid', 'mercedes.also09@gmail.com', false, false),
('16.341.626-3', 'Aranguiz Aranguiz Samy Letricia', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'samy.aranguiz@gmail.com', false, false),
('16.353.637-4', 'Cisternas Williams Manuel Alejandro', 'INSPECTOR GENERAL', 'Nelson Patricio Bravo Jorquera', 'profesorcisternas@gmail.com', true, false),
('16.362.359-5', 'Diaz Saldivia Milton Alexis', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'alexismilton.diaz@gmail.com', false, false),
('16.363.652-2', 'Barria Altamirano Luz Eliana', 'COORDINADOR DE ED. PARVULARIA', 'Jorge Andres Vasquez Almonacid', 'luzeliba@yahoo.com', true, false),
('16.557.347-1', 'Fariña Santos Rodrigo Omar', 'TENS', 'Manuel Alejandro Cisternas Williams', 'rodrigo.tens2012@gmail.com', false, false),
('16.576.174-k', 'Rivas Diaz Alejandra Andrea', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'janarivas@gmail.com', false, false),
('16.652.018-5', 'Pardo Bustamante Carolina Angelica', 'DOCENTE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'cpardo@liceoexperimental.cl', false, false),
('16.652.029-0', 'Ovando Carrasco Mario Javier', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'mario.ovandocarrasco@gmail.com', false, false),
('16.651.634-k', 'Figueroa Delgado Ivan Alejandro', 'ENCARGADO DE CONVIVENCIA ESCOLAR', 'Nelson Patricio Bravo Jorquera', 'ialfid@gmail.com', true, false),
('16.965.226-0', 'Gomez Venegas Luis Miguel', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'prof.luisgomezvenegas@gmail.com', false, false),
('16.966.450-1', 'Guidipani Troncoso Tatiana Andrea', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'tatianaguidipanitroncoso@gmail.com', false, false),
('17.238.098-0', 'Mancilla Vargas Francisco Gerardo', 'ADMINISTRATIVO DE RECAUDACION', 'Andrea Alejandra Naguelquin Garcia', 'fmancilla04@gmail.com', false, false),
('17.238.994-5', 'Ortega Leiva Carlos Antonio', 'AUXILIAR DE MANTENCION', 'Francisco Alberto Gonzalez Cabello', 'cortega@liceoexperimental.cl', false, false),
('17.482.402-9', 'Vergara Prieto Carolina Valeska', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'cvergara@liceoexperimental.cl', false, false),
('17.788.453-7', 'Cardenas Alvarado Carola Andrea', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'ccardenasalvarado19@gmail.com', false, false),
('17.857.437-k', 'Lara Quezada Cecilia Marisol', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'cecilia91laraq@gmail.com', false, false),
('18.282.415-1', 'Rodriguez Cabrera Miguel Angel', 'ENCARGADO DE REMUNERACIONES', 'Ronny Ignacio Cisterna Galaz', 'mrodriguez@liceoexperimental.cl', true, false),
('18.471.939-8', 'Ramirez Coñocar Carolina Vanesa', 'ASISTENTE DE AULA', 'Jorge Andres Vasquez Almonacid', 'carolina.2927@hotmail.com', false, false),
('18.550.885-4', 'Gonzalez Hernandez Jonathan Enrique', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'jonathan_gh17@hotmail.cl', false, false),
('18.551.319-k', 'Espinoza Pacheco Pablo Sebastian', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'pablo.espinoza8220@gmail.com', false, false),
('18.551.696-2', 'Soto Aguilar Camila Alejandra', 'DOCENTE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'camilasotoaguilar@gmail.com', false, false),
('19.253.268-k', 'Bahamonde Galli Romina Alejandra', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'romina.alejandra_@hotmail.com', false, false),
('19.254.297-9', 'Lemus Barria Priscila Lisette', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'pri171097@gmail.com', true, false),
('19.345.804-1', 'Ortiz Santana Hector Eduardo', 'AUXILIAR DE MANTENCION', 'Francisco Alberto Gonzalez Cabello', 'hortiz@liceoexperimental.cl', false, false),
('19.694.935-6', 'Garrett Venegas Victoria Charon', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'victoria.garrettvenegas@gmail.com', false, false),
('19.988.666-5', 'Barria Barria Paula Belen', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'barria.paula98@gmail.com', false, false),
('20.295.226-7', 'Figueroa Almonacid Franco Alexander', 'DOCENTE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'francofigue00@gmail.com', false, false),
('22.780.448-3', 'Lopez Laboratornuovo Andrea Mariana', 'ASISTENTE DE UTP DE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'amarianalopez@hotmail.com', false, false),
('24.673.198-5', 'Sanchez  Silvia', 'BIBLIOTECOLOGA', 'Jorge Andres Vasquez Almonacid', 'ssanchezunm@gmail.com', false, false),
('25.962.014-7', 'Vera Nava Samantha Isabel', 'RECEPCIONISTA', 'Manuel Alejandro Cisternas Williams', 'samanthaveraj@gmail.com', false, false),
('6.793.999-9', 'Godoy Velasquez Filomena Del Carmen', 'SECRETARIA DE DIRECCION', 'Nelson Patricio Bravo Jorquera', 'filomena_godoy@yahoo.com', false, false),
('7.399.075-0', 'Alvarado Sapunar Maria Cecilia', 'ASISTENTE DE UTP DE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'mcalvarado@liceoexperimental.cl', false, false),
('7.402.228-6', 'Oyarzun Miranda Mavis Leonor', 'ORIENTADOR(A)', 'Nelson Patricio Bravo Jorquera', 'mavisoyarzun@gmail.com', false, false),
('8.326.891-3', 'Oyarzun Torres Helda De Lourdes', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'heldilla4@gmail.com', false, false),
('9.015.079-0', 'Velasquez Diaz Sandra Patricia', 'AUXILIAR DE ASEO', 'Francisco Alberto Gonzalez Cabello', 'sanpatricia1564@gmail.com', false, false),
('9.093.324-8', 'Gonzalez Cabello Francisco Alberto', 'ENCARGADO DE LOGISTICA', 'Ronny Ignacio Cisterna Galaz', 'gelido2006@gmail.com', true, false),
('9.359.117-8', 'Reyes Meza Elizabeth Del Carmen', 'AUXILIAR DE ASEO', 'Francisco Alberto Gonzalez Cabello', 'ereyesmeza63@gmail.com', false, false),
('9.999.579-3', 'Trujillo Emilqueo Jorge Enrique', 'ASISTENTE DE UTP DE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'jortru16@gmail.com', false, false);

-- CONTINÚA EN EL SIGUIENTE COMENTARIO...

-- =============================================
-- IMPORTANTE: DESPUÉS DE CREAR LA BASE DE DATOS:
-- =============================================

-- 1. Actualizar las FK supervisor_id basándose en supervisor_nombre
-- 2. Insertar usuarios con contraseñas reales
-- 3. Insertar solicitud de prueba de Francisco
-- 4. Crear índices y configurar seguridad

-- Ver archivo: "INSTRUCCIONES_NUEVA_BD.md" para pasos completos