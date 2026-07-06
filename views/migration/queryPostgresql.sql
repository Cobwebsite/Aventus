SELECT json_build_object(
    'name', current_database(),
    'databaseType', 'postgresql',
    'tables', COALESCE((
        -- 1. Récupération des tables
        SELECT json_agg(
            json_build_object(
                'id', t.table_name,
                'name', t.table_name,
                'fields', COALESCE((
                    -- 2. Récupération des colonnes pour chaque table
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
                    
                    -- Détection Clé Primaire
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
                    
                    -- Détection Contrainte Unique (hors PK)
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
        -- 3. Récupération des Clés Étrangères (Relationships)
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

) AS metadata_json_to_import;