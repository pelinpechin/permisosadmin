📊 Procesando empleados desde CSV...

📋 Headers encontrados: Colaborador - Nombre Completo;Colaborador - N�mero de Documento;Colaborador - Email Personal;Colaborador - Fecha de Nacimiento;Trabajo - Fecha Ingreso Compa��a;Trabajo - Fecha T�rmino Trabajo;Trabajo - Horas Semanales;Trabajo - Nombre Supervisor;Trabajo - Cargo
👥 TOTAL EMPLEADOS PROCESADOS: 119

-- =============================================
-- INSERTAR TODOS LOS EMPLEADOS REALES
-- =============================================

INSERT INTO empleados (rut, nombre, cargo, supervisor_nombre, email, es_supervisor, es_admin) VALUES
('18.208.947-8', 'Barria Uribe Guillermo David', 'ASISTENTE DE RECURSOS HUMANOS', 'Miguel Angel Rodriguez Cabrera', 'guibarri23@gmail.com', true, false),
('15.382.085-6', 'Solis Ruiz Maria Jose', 'EDUCADORA DE PARVULOS', 'Luz Eliana Barria Altamirano', 'majosolis@gmail.com', false, false),
('16.651.662-5', 'Cardenas Cardenas Teresa Del Carmen', 'EDUCADORA DE PARVULOS', 'Luz Eliana Barria Altamirano', 'terecardcard@hotmail.com', false, false),
('16.856.834-7', 'Cancino Vasquez Alex Manuel', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'alexcancinov14@gmail.com', false, false),
('17.852.035-0', 'Canio Vera Natalia Belen', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'ncanio@liceoexperimental.cl', false, false),
('19.254.439-4', 'Barria Galindo Romina Fernanda', 'DOCENTE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'rominabarria.fernanda@gmail.com', true, false),
('7.234.072-8', 'Neira Johnston Ana Maria', 'DOCENTE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'aneiraj@yahoo.com', false, false),
('8.198.188-4', 'Villegas Mu�oz Silvia Alejandra', 'ENCARGADO DE RELACIONES LABORALES', 'Ronny Ignacio Cisterna Galaz', 'silvia.villegasmunoz@gmail.com', false, false),
('8.219.744-3', 'Rodriguez Paredes Ninfa Margarita', 'TECNICO EN PARVULOS', 'Luz Eliana Barria Altamirano', 'nrodriguez@liceoexperimental.cl', true, false),
('8.618.404-4', 'Quinchen Reyes Gloria Del Carmen', 'AUXILIAR DE ASEO', 'Francisco Alberto Gonzalez Cabello', 'gloriaquinchen@gmail.com', false, false),
('8.706.268-6', 'Fajardo Cui�as Jessica Ester', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'fajardo.jessy@gmail.com', false, false),
('9.222.042-7', 'Contreras Zambrano Ruth Gabriela', 'EDUCADORA DIFERENCIAL', 'Jorge Andres Vasquez Almonacid', 'ruth2162@gmail.com', false, false),
('9.267.550-5', 'Hernandez Miranda Viviana Lisette', 'ASISTENTE SOCIAL', 'Ivan Alejandro Figueroa Delgado', 'viviher_78@hotmail.com', false, false),
('9.348.634-k', 'Andrade Ojeda Deice Janet', 'TECNICO EN PARVULOS', 'Luz Eliana Barria Altamirano', 'dandrade@liceoexperimental.cl', false, false),
('9.531.692-1', 'Alarcon Reyes Andrea Virginia', 'SECRETARIA DE DIRECCION', 'Nelson Patricio Bravo Jorquera', 'avar.alarcon@gmail.com', false, false),
('10.078.481-5', 'Bahamonde Subiabre Manuel Antonio', 'AUXILIAR DE MANTENCION', 'Francisco Alberto Gonzalez Cabello', 'bompemanuba@gmail.com', false, false),
('10.103.786-k', 'Cortez Avenda�o Maricela Ines', 'ASISTENTE DE AULA', 'Jorge Andres Vasquez Almonacid', 'maincav75@hotmail.com', false, false),
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
('13.427.054-3', 'Bascu�an Cardenas Denisse Eliana', 'DOCENTE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'dbascunan@liceoexperimental.cl', false, false),
('13.480.402-5', 'Carre�o Barrueto Margarita Evelyn', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'carrenobarruetomargarita@gmail.com', false, false),
('13.543.250-4', 'Hinojosa Zepeda Francisco Manuel', 'JEFE DE UTP', 'Nelson Patricio Bravo Jorquera', 'franciscohinojosa2003@yahoo.es', true, false),
('13.738.879-0', 'Hijerra Vargas Maria Ariela', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'hijerraariela@gmail.com', false, false),
('13.741.165-2', 'Ibarra Valdes Nelda Ines', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'nelda1979@hotmail.com', false, false),
('13.884.847-7', 'Diaz Bustos Miguel Angel', 'DOCENTE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'miguel.diazbustos@gmail.com', false, false),
('14.228.918-0', 'Venegas Cerpa Jacqueline Helvecia', 'TECNICO EN PARVULOS', 'Luz Eliana Barria Altamirano', 'jvenegascerpa@gmail.com', false, false),
('14.606.388-8', 'Araneda Torres Carlos Esteban', 'ASISTENTE DE UTP DE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'c.araneda.t@hotmail.com', false, false),
('15.306.990-5', 'Acu�a Paillam�n Ingrid Antonieta', 'DOCENTE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'ingacu@gmail.com', false, false),
('15.307.189-6', 'Santana Gallardo Viviana Margarita', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'vsantana@liceoexperimental.cl', false, false),
('15.309.499-3', 'Nu�ez Mancilla Paola Alejandra', 'EDUCADORA DE PARVULOS', 'Luz Eliana Barria Altamirano', 'pnunez.educadora@gmail.com', false, false),
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
('16.236.711-0', 'Almonacid Soza Elizabeth De Las Mercedes', 'ASISTENTE DE AULA', 'Jorge Andres Vasquez Almonacid', 'mercedes.also09@gmail.com', true, false),
('16.341.626-3', 'Aranguiz Aranguiz Samy Letricia', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'samy.aranguiz@gmail.com', false, false),
('16.353.637-4', 'Cisternas Williams Manuel Alejandro', 'INSPECTOR GENERAL', 'Nelson Patricio Bravo Jorquera', 'profesorcisternas@gmail.com', true, false),
('16.362.359-5', 'Diaz Saldivia Milton Alexis', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'alexismilton.diaz@gmail.com', false, false),
('16.363.652-2', 'Barria Altamirano Luz Eliana', 'COORDINADOR DE ED. PARVULARIA', 'Jorge Andres Vasquez Almonacid', 'luzeliba@yahoo.com', true, false),
('16.557.347-1', 'Fari�a Santos Rodrigo Omar', 'TENS', 'Manuel Alejandro Cisternas Williams', 'rodrigo.tens2012@gmail.com', false, false),
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
('18.471.939-8', 'Ramirez Co�ocar Carolina Vanesa', 'ASISTENTE DE AULA', 'Jorge Andres Vasquez Almonacid', 'carolina.2927@hotmail.com', false, false),
('18.550.885-4', 'Gonzalez Hernandez Jonathan Enrique', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'jonathan_gh17@hotmail.cl', true, false),
('18.551.319-k', 'Espinoza Pacheco Pablo Sebastian', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'pablo.espinoza8220@gmail.com', false, false),
('18.551.696-2', 'Soto Aguilar Camila Alejandra', 'DOCENTE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'camilasotoaguilar@gmail.com', false, false),
('19.253.268-k', 'Bahamonde Galli Romina Alejandra', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'romina.alejandra_@hotmail.com', false, false),
('19.254.297-9', 'Lemus Barria Priscila Lisette', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'pri171097@gmail.com', true, false),
('19.345.804-1', 'Ortiz Santana Hector Eduardo', 'AUXILIAR DE MANTENCION', 'Francisco Alberto Gonzalez Cabello', 'hortiz@liceoexperimental.cl', false, false),
('19.694.935-6', 'Garrett Venegas Victoria Charon', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'victoria.garrettvenegas@gmail.com', false, false),
('19.988.666-5', 'Barria Barria Paula Belen', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'barria.paula98@gmail.com', true, false),
('20.295.226-7', 'Figueroa Almonacid Franco Alexander', 'DOCENTE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'francofigue00@gmail.com', true, false),
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
('9.999.579-3', 'Trujillo Emilqueo Jorge Enrique', 'ASISTENTE DE UTP DE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'jortru16@gmail.com', false, false),
('15.310.801-3', 'Oyarzun Asencio Jonathan Enrique', 'MONITOR DE ACLES', 'Priscila Lisette Lemus Barria', 'jonathanoyarzun@hotmail.com', false, false),
('10.923.124-k', 'Lopez Estefo Monica Marcela', 'MONITOR DE ACLES', 'Priscila Lisette Lemus Barria', 'monica.lopez@umag.cl', false, false),
('17.910.201-3', 'Hernandez Saez Daniel Alejandro', 'MONITOR DE ACLES', 'Priscila Lisette Lemus Barria', 'daniel.hernandez@umag.cl', false, false),
('18.550.255-4', 'Marquez Castillo Valeska Nicole', 'MONITOR DE ACLES', 'Priscila Lisette Lemus Barria', 'valeska.marquez.31@gmail.com', false, false),
('19.424.334-0', 'Guidipani Troncoso Juan Carlos', 'MONITOR DE ACLES', 'Priscila Lisette Lemus Barria', 'jc.guidipani@gmail.com', false, false),
('15.309.131-5', 'Martinez Diaz Paulina Constanza', 'MONITOR DE ACLES', 'Priscila Lisette Lemus Barria', NULL, false, false),
('21.728.156-3', 'Contreras Olave Gustavo Andres', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'g.contrerasolave@gmail.com', false, false),
('18.549.895-6', 'Videla Sandoval Claudia Andrea', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'cvidelasandoval@gmail.com', false, false),
('13.919.270-2', 'Delgado Alow Paola Arlette', 'DOCENTE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'delgadoalow@gmail.com', true, false),
('16.943.349-6', 'Mi�o Bustos Yessica Andrea', 'PROFESOR JEFE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'profesorayessicamb@gmail.com', false, false),
('19.663.689-7', 'Guerra Fernandez Arielle Myttzie', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'PSICO.ARIELLE@GMAIL.COM', false, false),
('17.693.838-2', 'Mansilla Vega Carmen Gloria', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'carmen.mansillavega@gmail.com', false, false),
('15.905.446-2', 'Roman Bahamonde Fernanda Andrea', 'DOCENTE ED. BASICA', 'Jorge Andres Vasquez Almonacid', 'fernanda.roman.bde@gmail.com', false, false),
('15.581.459-4', 'Vera Osorio Karina Andrea', 'AUXILIAR DE ASEO', 'Francisco Alberto Gonzalez Cabello', 'karinaverao@gmail.com', false, false),
('13.124.048-1', 'Gallardo Cardenas Elizabeth Macarena', 'AUXILIAR DE ASEO', 'Francisco Alberto Gonzalez Cabello', 'gallardomacarena@gmail.com', false, false),
('17.237.722-k', 'Peranchiguay Sanchez Mayra Andrea', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'mperanchiguay@gmail.com', false, false),
('11.653.413-4', 'Ahumada Dotte Ricardo Patricio', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'rahumadad63@gmail.com', false, false),
('15.309.045-9', 'Castelblanco Chiguay Maria Angelica', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'maryangelca88@gmail.com', false, false),
('10.991.590-4', 'Saldivia Canobra Maria Cristina', 'DOCENTE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'cristy.saldivia@gmail.com', false, false),
('19.253.968-4', 'Morales Mu�oz Angela Camila Constanza', 'DOCENTE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'angelacamilamorales96@gmail.com', false, false),
('20.181.204-6', 'La Paz Sanchez Katherine Johana', 'AUXILIAR DE ASEO', 'Francisco Alberto Gonzalez Cabello', 'katylapaz803@gmail.com', true, false),
('15.288.286-6', 'Barria Barria Jenny Alejandra', 'AUXILIAR DE ASEO', 'Francisco Alberto Gonzalez Cabello', 'alejandragatha1@gmail.com', true, false),
('17.639.465-k', 'Vargas Quintui Maria Jose', 'PROFESOR JEFE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'MARIA.VARGAS270591@GMAIL.COM', false, false),
('17.588.000-3', 'Aburto Faundes Miguel Andres', 'DOCENTE ED. MEDIA', 'Francisco Manuel Hinojosa Zepeda', 'aburto.miguel.23@gmail.com', false, false),
('18.642.761-0', 'Barrientos Villarroel Gisela Andrea', 'INSPECTOR ADMINISTRATIVO', 'Manuel Alejandro Cisternas Williams', 'giliandreabavi@gmail.com', false, false),
('19.166.456-6', 'Diaz Gonzalez Camila Yoseth', 'DOCENTE DE REEMPLAZO', 'Francisco Manuel Hinojosa Zepeda', 'camilayoseth.diaz@gmail.com', false, false);

-- =============================================
-- CREAR USUARIOS PARA TODOS LOS EMPLEADOS
-- =============================================

INSERT INTO usuarios (empleado_id, username, password_hash) VALUES
(1, 'barria.uribe.guillermo.david', '$2b$10$placeholder'),
(2, 'solis.ruiz.maria.jose', '$2b$10$placeholder'),
(3, 'cardenas.cardenas.teresa.del.carmen', '$2b$10$placeholder'),
(4, 'cancino.vasquez.alex.manuel', '$2b$10$placeholder'),
(5, 'canio.vera.natalia.belen', '$2b$10$placeholder'),
(6, 'barria.galindo.romina.fernanda', '$2b$10$placeholder'),
(7, 'neira.johnston.ana.maria', '$2b$10$placeholder'),
(8, 'villegas.muoz.silvia.alejandra', '$2b$10$placeholder'),
(9, 'rodriguez.paredes.ninfa.margarita', '$2b$10$placeholder'),
(10, 'quinchen.reyes.gloria.del.carmen', '$2b$10$placeholder'),
(11, 'fajardo.cuias.jessica.ester', '$2b$10$placeholder'),
(12, 'contreras.zambrano.ruth.gabriela', '$2b$10$placeholder'),
(13, 'hernandez.miranda.viviana.lisette', '$2b$10$placeholder'),
(14, 'andrade.ojeda.deice.janet', '$2b$10$placeholder'),
(15, 'alarcon.reyes.andrea.virginia', '$2b$10$placeholder'),
(16, 'bahamonde.subiabre.manuel.antonio', '$2b$10$placeholder'),
(17, 'cortez.avendao.maricela.ines', '$2b$10$placeholder'),
(18, 'molina.araya.marlen.del.carmen', '$2b$10$placeholder'),
(19, 'perez.ramirez.fredy.armando', '$2b$10$placeholder'),
(20, 'mansilla.mansilla.maribel.del.carmen', '$2b$10$placeholder'),
(21, 'saldivia.canihuante.jose.mario', '$2b$10$placeholder'),
(22, 'barrientos.diaz.patricia.judith', '$2b$10$placeholder'),
(23, 'navea.ramos.paola.alejandra', '$2b$10$placeholder'),
(24, 'toro.ojeda.josue.ban.eliab', '$2b$10$placeholder'),
(25, 'vidal.romero.angela.maria', '$2b$10$placeholder'),
(26, 'mercado.vargas.monica.cecilia', '$2b$10$placeholder'),
(27, 'cardenas.diaz.paola.lorena', '$2b$10$placeholder'),
(28, 'bascuan.cardenas.denisse.eliana', '$2b$10$placeholder'),
(29, 'carreo.barrueto.margarita.evelyn', '$2b$10$placeholder'),
(30, 'hinojosa.zepeda.francisco.manuel', '$2b$10$placeholder'),
(31, 'hijerra.vargas.maria.ariela', '$2b$10$placeholder'),
(32, 'ibarra.valdes.nelda.ines', '$2b$10$placeholder'),
(33, 'diaz.bustos.miguel.angel', '$2b$10$placeholder'),
(34, 'venegas.cerpa.jacqueline.helvecia', '$2b$10$placeholder'),
(35, 'araneda.torres.carlos.esteban', '$2b$10$placeholder'),
(36, 'acua.paillamn.ingrid.antonieta', '$2b$10$placeholder'),
(37, 'santana.gallardo.viviana.margarita', '$2b$10$placeholder'),
(38, 'nuez.mancilla.paola.alejandra', '$2b$10$placeholder'),
(39, 'bahamonde.vargas.yasna.margarita', '$2b$10$placeholder'),
(40, 'vasquez.almonacid.jorge.andres', '$2b$10$placeholder'),
(41, 'ilnao.barrientos.marta.del.carmen', '$2b$10$placeholder'),
(42, 'bravo.jorquera.nelson.patricio', '$2b$10$placeholder'),
(43, 'oyarzo.hidalgo.celso.antonio', '$2b$10$placeholder'),
(44, 'cisterna.galaz.ronny.ignacio', '$2b$10$placeholder'),
(45, 'marquez.rodriguez.andrea.tamara', '$2b$10$placeholder'),
(46, 'naguelquin.garcia.andrea.alejandra', '$2b$10$placeholder'),
(47, 'hechenleitner.tapia.katherine.marcela', '$2b$10$placeholder'),
(48, 'valdes.carcamo.janet.beatriz', '$2b$10$placeholder'),
(49, 'vargas.vergara.catherine.alejandra', '$2b$10$placeholder'),
(50, 'subiabre.salviat.luis.alejandro', '$2b$10$placeholder'),
(51, 'barrientos.barcena.alejandra.violeta', '$2b$10$placeholder'),
(52, 'paredes.chavez.paulina.andrea', '$2b$10$placeholder'),
(53, 'zamorano.cayuno.araceli.alejandra', '$2b$10$placeholder'),
(54, 'contreras.vergara.camila.valentina', '$2b$10$placeholder'),
(55, 'almonacid.soza.elizabeth.de.las.mercedes', '$2b$10$placeholder'),
(56, 'aranguiz.aranguiz.samy.letricia', '$2b$10$placeholder'),
(57, 'cisternas.williams.manuel.alejandro', '$2b$10$placeholder'),
(58, 'diaz.saldivia.milton.alexis', '$2b$10$placeholder'),
(59, 'barria.altamirano.luz.eliana', '$2b$10$placeholder'),
(60, 'faria.santos.rodrigo.omar', '$2b$10$placeholder'),
(61, 'rivas.diaz.alejandra.andrea', '$2b$10$placeholder'),
(62, 'pardo.bustamante.carolina.angelica', '$2b$10$placeholder'),
(63, 'ovando.carrasco.mario.javier', '$2b$10$placeholder'),
(64, 'figueroa.delgado.ivan.alejandro', '$2b$10$placeholder'),
(65, 'gomez.venegas.luis.miguel', '$2b$10$placeholder'),
(66, 'guidipani.troncoso.tatiana.andrea', '$2b$10$placeholder'),
(67, 'mancilla.vargas.francisco.gerardo', '$2b$10$placeholder'),
(68, 'ortega.leiva.carlos.antonio', '$2b$10$placeholder'),
(69, 'vergara.prieto.carolina.valeska', '$2b$10$placeholder'),
(70, 'cardenas.alvarado.carola.andrea', '$2b$10$placeholder'),
(71, 'lara.quezada.cecilia.marisol', '$2b$10$placeholder'),
(72, 'rodriguez.cabrera.miguel.angel', '$2b$10$placeholder'),
(73, 'ramirez.coocar.carolina.vanesa', '$2b$10$placeholder'),
(74, 'gonzalez.hernandez.jonathan.enrique', '$2b$10$placeholder'),
(75, 'espinoza.pacheco.pablo.sebastian', '$2b$10$placeholder'),
(76, 'soto.aguilar.camila.alejandra', '$2b$10$placeholder'),
(77, 'bahamonde.galli.romina.alejandra', '$2b$10$placeholder'),
(78, 'lemus.barria.priscila.lisette', '$2b$10$placeholder'),
(79, 'ortiz.santana.hector.eduardo', '$2b$10$placeholder'),
(80, 'garrett.venegas.victoria.charon', '$2b$10$placeholder'),
(81, 'barria.barria.paula.belen', '$2b$10$placeholder'),
(82, 'figueroa.almonacid.franco.alexander', '$2b$10$placeholder'),
(83, 'lopez.laboratornuovo.andrea.mariana', '$2b$10$placeholder'),
(84, 'sanchez.silvia', '$2b$10$placeholder'),
(85, 'vera.nava.samantha.isabel', '$2b$10$placeholder'),
(86, 'godoy.velasquez.filomena.del.carmen', '$2b$10$placeholder'),
(87, 'alvarado.sapunar.maria.cecilia', '$2b$10$placeholder'),
(88, 'oyarzun.miranda.mavis.leonor', '$2b$10$placeholder'),
(89, 'oyarzun.torres.helda.de.lourdes', '$2b$10$placeholder'),
(90, 'velasquez.diaz.sandra.patricia', '$2b$10$placeholder'),
(91, 'gonzalez.cabello.francisco.alberto', '$2b$10$placeholder'),
(92, 'reyes.meza.elizabeth.del.carmen', '$2b$10$placeholder'),
(93, 'trujillo.emilqueo.jorge.enrique', '$2b$10$placeholder'),
(94, 'oyarzun.asencio.jonathan.enrique', '$2b$10$placeholder'),
(95, 'lopez.estefo.monica.marcela', '$2b$10$placeholder'),
(96, 'hernandez.saez.daniel.alejandro', '$2b$10$placeholder'),
(97, 'marquez.castillo.valeska.nicole', '$2b$10$placeholder'),
(98, 'guidipani.troncoso.juan.carlos', '$2b$10$placeholder'),
(99, 'martinez.diaz.paulina.constanza', '$2b$10$placeholder'),
(100, 'contreras.olave.gustavo.andres', '$2b$10$placeholder'),
(101, 'videla.sandoval.claudia.andrea', '$2b$10$placeholder'),
(102, 'delgado.alow.paola.arlette', '$2b$10$placeholder'),
(103, 'mio.bustos.yessica.andrea', '$2b$10$placeholder'),
(104, 'guerra.fernandez.arielle.myttzie', '$2b$10$placeholder'),
(105, 'mansilla.vega.carmen.gloria', '$2b$10$placeholder'),
(106, 'roman.bahamonde.fernanda.andrea', '$2b$10$placeholder'),
(107, 'vera.osorio.karina.andrea', '$2b$10$placeholder'),
(108, 'gallardo.cardenas.elizabeth.macarena', '$2b$10$placeholder'),
(109, 'peranchiguay.sanchez.mayra.andrea', '$2b$10$placeholder'),
(110, 'ahumada.dotte.ricardo.patricio', '$2b$10$placeholder'),
(111, 'castelblanco.chiguay.maria.angelica', '$2b$10$placeholder'),
(112, 'saldivia.canobra.maria.cristina', '$2b$10$placeholder'),
(113, 'morales.muoz.angela.camila.constanza', '$2b$10$placeholder'),
(114, 'la.paz.sanchez.katherine.johana', '$2b$10$placeholder'),
(115, 'barria.barria.jenny.alejandra', '$2b$10$placeholder'),
(116, 'vargas.quintui.maria.jose', '$2b$10$placeholder'),
(117, 'aburto.faundes.miguel.andres', '$2b$10$placeholder'),
(118, 'barrientos.villarroel.gisela.andrea', '$2b$10$placeholder'),
(119, 'diaz.gonzalez.camila.yoseth', '$2b$10$placeholder');

-- =============================================
-- CREDENCIALES DE ACCESO
-- =============================================
| Usuario | Password | Cargo |
|---------|----------|-------|
| barria.uribe.guillermo.david | barria123 | ASISTENTE DE RECURSOS HUMANOS |
| solis.ruiz.maria.jose | solis123 | EDUCADORA DE PARVULOS |
| cardenas.cardenas.teresa.del.carmen | cardenas123 | EDUCADORA DE PARVULOS |
| cancino.vasquez.alex.manuel | cancino123 | PROFESOR JEFE ED. MEDIA |
| canio.vera.natalia.belen | canio123 | PROFESOR JEFE ED. BASICA |
| barria.galindo.romina.fernanda | barria123 | DOCENTE ED. BASICA |
| neira.johnston.ana.maria | neira123 | DOCENTE ED. MEDIA |
| villegas.muoz.silvia.alejandra | villegas123 | ENCARGADO DE RELACIONES LABORALES |
| rodriguez.paredes.ninfa.margarita | rodriguez123 | TECNICO EN PARVULOS |
| quinchen.reyes.gloria.del.carmen | quinchen123 | AUXILIAR DE ASEO |
| fajardo.cuias.jessica.ester | fajardo123 | PROFESOR JEFE ED. MEDIA |
| contreras.zambrano.ruth.gabriela | contreras123 | EDUCADORA DIFERENCIAL |
| hernandez.miranda.viviana.lisette | hernandez123 | ASISTENTE SOCIAL |
| andrade.ojeda.deice.janet | andrade123 | TECNICO EN PARVULOS |
| alarcon.reyes.andrea.virginia | alarcon123 | SECRETARIA DE DIRECCION |
| bahamonde.subiabre.manuel.antonio | bahamonde123 | AUXILIAR DE MANTENCION |
| cortez.avendao.maricela.ines | cortez123 | ASISTENTE DE AULA |
| molina.araya.marlen.del.carmen | molina123 | DOCENTE ED. BASICA |
| perez.ramirez.fredy.armando | perez123 | PROFESOR JEFE ED. BASICA |
| mansilla.mansilla.maribel.del.carmen | mansilla123 | ORIENTADOR(A) |
| ... | ... | ... |
| Total: 119 empleados | | |

-- =============================================
-- EMPLEADOS CLAVE DEL SISTEMA
-- =============================================
✅ ANDREA: Naguelquin Garcia Andrea Alejandra (15.582.779-3) - ENCARGADO DE TESORERIA
   Supervisor: Ronny Ignacio Cisterna Galaz
✅ FRANCISCO: Mancilla Vargas Francisco Gerardo (17.238.098-0) - ADMINISTRATIVO DE RECAUDACION
   Supervisor: Andrea Alejandra Naguelquin Garcia
✅ RONNY: Cisterna Galaz Ronny Ignacio (15.436.531-1) - ADMINISTRADOR
✅ PATRICIO: Bravo Jorquera Nelson Patricio (15.310.843-9) - DIRECTOR

-- SOLICITUD DE PRUEBA DE FRANCISCO:
INSERT INTO solicitudes_permisos (empleado_id, tipo_permiso_id, fecha_desde, fecha_hasta, motivo, estado) VALUES
(67, 1, '2025-01-20', '2025-01-20', 'Cita médica familiar', 'PENDIENTE');
