CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS search_text TEXT GENERATED ALWAYS AS (
    LOWER(COALESCE(name, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_entities_search_text_trgm 
  ON entities USING GIN (search_text gin_trgm_ops);

CREATE OR REPLACE FUNCTION search_entities(
  search_query TEXT,
  result_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  category VARCHAR(50),
  description TEXT,
  value DECIMAL(15, 2),
  created_at TIMESTAMP,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.category,
    e.description,
    e.value,
    e.created_at,
    SIMILARITY(e.search_text, LOWER(search_query)) as similarity_score
  FROM entities e
  WHERE 
    e.search_text % LOWER(search_query)
    OR e.search_text LIKE '%' || LOWER(search_query) || '%'
  ORDER BY 
    SIMILARITY(e.search_text, LOWER(search_query)) DESC,
    e.name ASC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
