CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";      -- pgvector for semantic clustering
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- Trigram matching for fast search autocomplete