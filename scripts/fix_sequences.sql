-- Fix PostgreSQL sequences after migration
-- Execute this in Supabase SQL Editor

-- Reset empleados sequence to match max ID
SELECT setval('empleados_id_seq', (SELECT COALESCE(MAX(id), 1) FROM empleados));

-- Reset solicitudes_permisos sequence
SELECT setval('solicitudes_permisos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM solicitudes_permisos));

-- Reset usuarios_admin sequence
SELECT setval('usuarios_admin_id_seq', (SELECT COALESCE(MAX(id), 1) FROM usuarios_admin));

-- Reset notificaciones sequence
SELECT setval('notificaciones_id_seq', (SELECT COALESCE(MAX(id), 1) FROM notificaciones));

-- Reset tipos_permisos sequence
SELECT setval('tipos_permisos_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tipos_permisos));

-- Verify sequences
SELECT 'empleados_id_seq' as sequence_name, last_value FROM empleados_id_seq
UNION ALL
SELECT 'solicitudes_permisos_id_seq', last_value FROM solicitudes_permisos_id_seq
UNION ALL
SELECT 'usuarios_admin_id_seq', last_value FROM usuarios_admin_id_seq
UNION ALL
SELECT 'notificaciones_id_seq', last_value FROM notificaciones_id_seq
UNION ALL
SELECT 'tipos_permisos_id_seq', last_value FROM tipos_permisos_id_seq;
