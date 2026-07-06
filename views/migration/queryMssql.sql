SELECT 
    NEWID() AS [id],
    DB_NAME() AS [name],
    'mssql' AS [databaseType],
    
    -- 1. Tableau des TABLES
    (
        SELECT 
            t.name AS [name],
            
            -- 1.1 Sous-tableau des COLONNES (fields)
            (
                SELECT 
                    t.name + '.' + c.name AS [id],
                    c.name AS [name],
                    
                    -- JSON_QUERY force SQL Server à traiter cela comme un objet JSON, pas un string
                    JSON_QUERY((
                        SELECT LOWER(tp.name) AS [id], LOWER(tp.name) AS [name]
                        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    )) AS [type],
                    
                    -- Utilisation de bits (0/1) pour forcer le type booléen en JSON
                    CAST(CASE WHEN pk.column_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS [primaryKey],
                    CAST(CASE WHEN uk.column_id IS NOT NULL THEN 1 ELSE 0 END AS BIT) AS [unique],
                    CAST(CASE WHEN c.is_nullable = 1 THEN 1 ELSE 0 END AS BIT) AS [nullable]
                
                FROM sys.columns c
                INNER JOIN sys.types tp ON c.user_type_id = tp.user_type_id
                
                -- Check de la Clé Primaire
                LEFT JOIN (
                    SELECT ic.object_id, ic.column_id
                    FROM sys.index_columns ic
                    INNER JOIN sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
                    WHERE i.is_primary_key = 1
                ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
                
                -- Check des contraintes Uniques (Index uniques non-PK)
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
        WHERE t.is_ms_shipped = 0 -- Exclure les tables systèmes
        FOR JSON PATH
    ) AS [tables],

    -- 2. Tableau des RELATIONS (Clés étrangères)
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

FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;