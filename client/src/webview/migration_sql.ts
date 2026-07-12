import { DBType } from './migration'

export const sqlSchema: Record<DBType, string> = {
	'mysql': `SET SESSION group_concat_max_len = 10000000;

SELECT CAST(CONCAT(
    '{"name":"', DATABASE(), 
    '","databaseType":"mysql',
    '","tables":[',
    IFNULL((
        SELECT GROUP_CONCAT(
            CONCAT(
                '{"id":"', t.TABLE_NAME,
                '","name":"', t.TABLE_NAME,'"',
                ',"fields":[',
                IFNULL((
                    SELECT GROUP_CONCAT(
                        CONCAT(
                            '{"id":"', c.TABLE_NAME, '.', c.COLUMN_NAME,
                            '","name":"', REPLACE(c.COLUMN_NAME, '"', '\"'),
                            '","type":{"id":"', LOWER(c.DATA_TYPE), '","name":"', LOWER(c.DATA_TYPE), '"}',
                            ',"primaryKey":', IF(pk.COLUMN_NAME IS NOT NULL, 'true', 'false'),
                            ',"unique":', IF(uk.COLUMN_NAME IS NOT NULL, 'true', 'false'),
                            ',"nullable":', IF(c.IS_NULLABLE = 'YES', 'true', 'false'),
                            '}'
                        )
                        ORDER BY c.ORDINAL_POSITION
                    )
                    FROM information_schema.columns c
                    LEFT JOIN (
                        SELECT kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.COLUMN_NAME
                        FROM information_schema.key_column_usage kcu
                        WHERE kcu.CONSTRAINT_NAME = 'PRIMARY'
                    ) pk ON c.TABLE_SCHEMA = pk.TABLE_SCHEMA AND c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
                    LEFT JOIN (
                        SELECT DISTINCT kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.COLUMN_NAME
                        FROM information_schema.key_column_usage kcu
                        JOIN information_schema.table_constraints tc 
                          ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME 
                         AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA
                        WHERE tc.CONSTRAINT_TYPE = 'UNIQUE'
                    ) uk ON c.TABLE_SCHEMA = uk.TABLE_SCHEMA AND c.TABLE_NAME = uk.TABLE_NAME AND c.COLUMN_NAME = uk.COLUMN_NAME
                    
                    WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA AND c.TABLE_NAME = t.TABLE_NAME
                ), ''),
                ']}'
            )
        )
        FROM information_schema.tables t
        WHERE t.TABLE_SCHEMA = DATABASE() AND t.TABLE_TYPE = 'BASE TABLE'
    ), ''),
    '],"relationships":[',
    IFNULL((
        SELECT GROUP_CONCAT(
            CONCAT(
                '{"id":"', UUID(),
                '","name":"', kcu.CONSTRAINT_NAME,
                '","sourceTableId":"', kcu.TABLE_NAME,
                '","targetTableId":"', kcu.REFERENCED_TABLE_NAME,
                '","sourceFieldId":"', kcu.TABLE_NAME, '.', kcu.COLUMN_NAME,
                '","targetFieldId":"', kcu.REFERENCED_TABLE_NAME, '.', kcu.REFERENCED_COLUMN_NAME,
                '"}'
            )
        )
        FROM information_schema.key_column_usage kcu
        WHERE kcu.TABLE_SCHEMA = DATABASE() 
          AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
    ), ''),
    ']}'
) AS CHAR) AS metadata_json_to_import;`,
	'mssql': `SELECT 
    NEWID() AS [id],
    DB_NAME() AS [name],
    'mssql' AS [databaseType],
    
    (
        SELECT 
            t.name AS [name],
            
            (
                SELECT 
                    t.name + '.' + c.name AS [id],
                    c.name AS [name],
                    
                    JSON_QUERY((
                        SELECT LOWER(tp.name) AS [id], LOWER(tp.name) AS [name]
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS [type],
                    
                    CAST(CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS [primaryKey],
                    CAST(CASE WHEN uk.column_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS [unique],
                    CAST(CASE WHEN c.is_nullable = 1 THEN 1 ELSE 0 END AS BIT) AS [nullable]
                
                FROM sys.columns c
                INNER JOIN sys.types tp ON c.user_type_id = tp.user_type_id
                
                LEFT JOIN (
                    SELECT ic.object_id, ic.column_id
                    FROM sys.index_columns ic
                    INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
                    WHERE i.is_primary_key = 1
                ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
                
                LEFT JOIN (
                    SELECT DISTINCT ic.object_id, ic.column_id
                    FROM sys.index_columns ic
                    INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
                    WHERE i.is_unique = 1 AND i.is_primary_key = 0
                ) uk ON c.object_id = uk.object_id AND c.column_id = uk.column_id
                
                WHERE c.object_id = t.object_id
                ORDER BY c.column_id
                FOR JSON PATH
            ) AS [fields]
            
        FROM sys.tables t
        WHERE t.is_ms_shipped = 0
        FOR JSON PATH
    ) AS [tables],

    JSON_QUERY(ISNULL((
        SELECT 
            NEWID() AS [id],
            fk.name AS [name],
            tp.name AS [sourceTableId],
            rp.name AS [targetTableId],
            tp.name + '.' + cp.name AS [sourceFieldId],
            rp.name + '.' + rc.name AS [targetFieldId]
        FROM sys.foreign_keys fk
        INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
        INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
        INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
        INNER JOIN sys.tables rp ON fkc.referenced_object_id = rp.object_id
        INNER JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
        FOR JSON PATH
    ), '[]')) AS [relationships]

FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;`,
	'postgresql': `SELECT json_build_object(
    'name', current_database(),
    'databaseType', 'postgresql',
    'tables', COALESCE((
        SELECT json_agg(
            json_build_object(
                'id', t.table_name,
                'name', t.table_name,
                'fields', COALESCE((
                    SELECT json_agg(
                        json_build_object(
                            'id', c.table_name || '.' || c.column_name,
                            'name', c.column_name,
                            'type', json_build_object(
                                'id', lower(c.data_type),
                                'name', lower(c.data_type)
                            ),
                            'primaryKey', CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END,
                            'unique', CASE WHEN uk.column_name IS NOT NULL THEN true ELSE false END,
                            'nullable', CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END
                        )
                        ORDER BY c.ordinal_position
                    )
                    FROM information_schema.columns c
                    
                    LEFT JOIN (
                        SELECT kcu.table_schema, kcu.table_name, kcu.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu 
                          ON tc.constraint_name = kcu.constraint_name 
                         AND tc.table_schema = kcu.table_schema
                        WHERE tc.constraint_type = 'PRIMARY KEY'
                    ) pk ON c.table_schema = pk.table_schema 
                        AND c.table_name = pk.table_name 
                        AND c.column_name = pk.column_name
                    
                    LEFT JOIN (
                        SELECT DISTINCT kcu.table_schema, kcu.table_name, kcu.column_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu 
                          ON tc.constraint_name = kcu.constraint_name 
                         AND tc.table_schema = kcu.table_schema
                        WHERE tc.constraint_type = 'UNIQUE'
                    ) uk ON c.table_schema = uk.table_schema 
                        AND c.table_name = uk.table_name 
                        AND c.column_name = uk.column_name
                    
                    WHERE c.table_schema = t.table_schema 
                      AND c.table_name = t.table_name
                ), '[]'::json)
            )
        )
        FROM information_schema.tables t
        WHERE t.table_schema = current_schema() 
          AND t.table_type = 'BASE TABLE'
    ), '[]'::json),
    
    'relationships', COALESCE((
        SELECT json_agg(
            json_build_object(
                'id', gen_random_uuid(),
                'name', tc.constraint_name,
                'sourceTableId', kcu.table_name,
                'targetTableId', ccu.table_name,
                'sourceFieldId', kcu.table_name || '.' || kcu.column_name,
                'targetFieldId', ccu.table_name || '.' || ccu.column_name
            )
        )
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name 
         AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu 
          ON tc.constraint_name = ccu.constraint_name 
         AND tc.table_schema = ccu.table_schema
        WHERE tc.table_schema = current_schema() 
          AND tc.constraint_type = 'FOREIGN KEY'
    ), '[]'::json)

) AS metadata_json_to_import;`,
	'sqlite': `WITH 

all_columns AS (
    SELECT 
        m.name AS table_name,
        p.name AS column_name,
        LOWER(p.type) AS data_type,
        p.[notnull] AS is_notnull,
        p.pk AS is_pk,
        EXISTS (
            SELECT 1 
            FROM pragma_index_list(m.name) il
            JOIN pragma_index_info(il.name) ii ON ii.name = p.name
            WHERE il.[unique] = 1 AND il.origin <> 'pk'
        ) AS is_unique,
        p.cid AS ordinal_position
    FROM sqlite_schema m
    JOIN pragma_table_info(m.name) p
    WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%'
),

json_fields AS (
    SELECT 
        table_name,
        json_group_array(
            json_object(
                'id', table_name || '.' || column_name,
                'name', column_name,
                'type', json_object('id', data_type, 'name', data_type),
                'primaryKey', CASE WHEN is_pk > 0 THEN json('true') ELSE json('false') END,
                'unique', CASE WHEN is_unique = 1 THEN json('true') ELSE json('false') END,
                'nullable', CASE WHEN is_notnull = 0 THEN json('true') ELSE json('false') END
            )
        ) AS fields_json
    FROM all_columns
    GROUP BY table_name
    ORDER BY ordinal_position
),

json_tables AS (
    SELECT 
        json_group_array(
            json_object(
                'id', table_name,
                'name', table_name,
                'fields', json(fields_json)
            )
        ) AS tables_json
    FROM json_fields
),

json_relationships AS (
    SELECT 
        json_group_array(
            json_object(
                'id', lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))),
                'name', m.name || '_fk_' || fk.[to],
                'sourceTableId', m.name,
                'targetTableId', fk.[table],
                'sourceFieldId', m.name || '.' || fk.[from],
                'targetFieldId', fk.[table] || '.' || fk.[to]
            )
        ) AS relationships_json
    FROM sqlite_schema m
    JOIN pragma_foreign_key_list(m.name) fk
    WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%'
)

SELECT 
    json_object(
        'id', lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))),
        'name', 'main',
        'databaseType', 'sqlite',
        'tables', json(COALESCE((SELECT tables_json FROM json_tables), '[]')),
        'relationships', json(COALESCE((SELECT relationships_json FROM json_relationships), '[]'))
    ) AS metadata_json_to_import;`,
}
