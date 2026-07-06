SET SESSION group_concat_max_len = 10000000;

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
                    -- Détection de la Clé Primaire
                    LEFT JOIN (
                        SELECT kcu.TABLE_SCHEMA, kcu.TABLE_NAME, kcu.COLUMN_NAME
                        FROM information_schema.key_column_usage kcu
                        WHERE kcu.CONSTRAINT_NAME = 'PRIMARY'
                    ) pk ON c.TABLE_SCHEMA = pk.TABLE_SCHEMA AND c.TABLE_NAME = pk.TABLE_NAME AND c.COLUMN_NAME = pk.COLUMN_NAME
                    -- Détection des contraintes Unique (hors clé primaire)
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
    ']}' -- Laissé vide, géré côté C# ou via interface
) AS CHAR) AS metadata_json_to_import;