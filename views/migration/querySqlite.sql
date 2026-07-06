WITH 
-- 1. Récupération des colonnes, clés primaires et contraintes uniques
all_columns AS (
    SELECT 
        m.name AS table_name,
        p.name AS column_name,
        LOWER(p.type) AS data_type,
        p.[notnull] AS is_notnull,
        p.pk AS is_pk,
        -- Détection de l'unicité (via l'index de la table)
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

-- 2. Formatage des champs au format JSON par table
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

-- 3. Construction du JSON pour chaque table
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

-- 4. Récupération et formatage des clés étrangères (Relationships)
json_relationships AS (
    SELECT 
        json_group_array(
            json_object(
                -- SQLite n'a pas de fonction UUID native, on génère une string pseudo-aléatoire basée sur du contenu hexadécimal
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

-- 5. Assemblage final du document metadata
SELECT 
    json_object(
        'id', lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(6))),
        'name', 'main', -- SQLite n'a pas de concept de nom de base dynamique stocké (souvent un fichier ou :memory:)
        'databaseType', 'sqlite',
        'tables', json(COALESCE((SELECT tables_json FROM json_tables), '[]')),
        'relationships', json(COALESCE((SELECT relationships_json FROM json_relationships), '[]'))
    ) AS metadata_json_to_import;