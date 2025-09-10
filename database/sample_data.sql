-- Datos de ejemplo para probar el sistema
-- Ejecutar DESPUÉS del esquema principal

-- Insertar empleados de ejemplo
INSERT INTO empleados (numero, nombre, rut, cargo, negociacion_colectiva) VALUES
(1001, 'Juan Carlos Pérez González', '12345678-9', 'Desarrollador Senior', TRUE),
(1002, 'María Elena Rodríguez Silva', '98765432-1', 'Analista de Sistemas', FALSE),
(1003, 'Carlos Alberto Muñoz Torres', '11111111-1', 'Gerente de Proyecto', TRUE),
(1004, 'Ana Sofía Contreras López', '22222222-2', 'Diseñadora UX/UI', FALSE),
(1005, 'Roberto José Morales Castro', '33333333-3', 'Administrador de Base de Datos', TRUE)
ON CONFLICT (numero) DO NOTHING;

-- Insertar algunas solicitudes de ejemplo
INSERT INTO solicitudes_permisos (empleado_id, tipo_permiso_id, fecha_solicitud, fecha_desde, fecha_hasta, motivo, estado) VALUES
(1, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day', 'Cita médica familiar', 'PENDIENTE'),
(2, 2, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '2 days', 'Trámite bancario urgente', 'APROBADO'),
(1, 10, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE - INTERVAL '3 days', 'Celebración cumpleaños', 'APROBADO'),
(3, 3, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '3 days', 'Asunto personal importante', 'PENDIENTE'),
(4, 1, CURRENT_DATE - INTERVAL '1 week', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days', 'Consulta médica', 'RECHAZADO')
ON CONFLICT DO NOTHING;

-- Actualizar algunas solicitudes con detalles de aprobación/rechazo
UPDATE solicitudes_permisos 
SET fecha_aprobacion = CURRENT_TIMESTAMP - INTERVAL '1 day', 
    aprobado_por = 1
WHERE estado = 'APROBADO' AND fecha_aprobacion IS NULL;

UPDATE solicitudes_permisos 
SET rechazado_motivo = 'Falta de personal en el área durante esa fecha'
WHERE estado = 'RECHAZADO' AND rechazado_motivo IS NULL;