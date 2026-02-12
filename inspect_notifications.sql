
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'notifications';

SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(c.oid)
FROM
    pg_constraint c
JOIN
    pg_namespace n ON n.oid = c.connamespace
WHERE
    conrelid = 'notifications'::regclass;
