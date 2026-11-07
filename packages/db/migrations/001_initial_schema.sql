-- Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Raw ingest stream table. Stores data from RSS/APIs before being processed
CREATE TABLE raw_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id VARCHAR(64) NOT NULL,
    source_name VARCHAR(128) NOT NULL,
    url_hash CHAR(64) UNIQUE NOT NULL,
    canonical_url TEXT NOT NULL,
    title TEXT NOT NULL,
    summary_raw TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    cluster_id UUID,
    embedding VECTOR(768)
);

-- Canonical entities registry (Knowledge Graph Nodes / Living Dossier)
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL CHECK (
        category IN (
            'person',
            'govt_branch',
            'govt_agency',
            'location',
            'private_company',
            'genre',
            'topic'
        )
    ),
    -- Header & Portrait
    title_role VARCHAR(255) NOT NULL DEFAULT '',
    avatar_url TEXT,
    avatar_pos VARCHAR(64) NOT NULL DEFAULT 'center',

    -- Structural Context Warning Banner
    context_banner_title VARCHAR(255),
    context_banner_body TEXT,
    context_banner_severity VARCHAR(32) NOT NULL DEFAULT 'warning' CHECK (
        context_banner_severity IN ('warning', 'info', 'critical')
    ),
    context_banner_active BOOLEAN NOT NULL DEFAULT false,

    -- Modular Living Dossier Blocks (SDUI)
    profile_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- General Metadata & Timestamps
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events and story decks table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'in_review', 'published', 'archived')
    ),
    deck_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    article_markdown TEXT NOT NULL DEFAULT '',
    sdui_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attach foreign key constraints back to raw_articles
ALTER TABLE raw_articles
    ADD CONSTRAINT fk_raw_articles_cluster
    FOREIGN KEY (cluster_id) REFERENCES events(id) ON DELETE SET NULL;

-- Event-to-entity junction table (Many-to-Many)
CREATE TABLE event_entities (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, entity_id)
);

-- Indexes for fast querying

-- Fast lookup for raw article by cluster
CREATE INDEX idx_raw_articles_cluster_id ON raw_articles(cluster_id);
CREATE INDEX idx_raw_articles_published_at ON raw_articles(published_at DESC);

-- HNSW Vector Index: Fast nearest-neighbor search for semantic clustering (VECTOR 768)
CREATE INDEX idx_raw_articles_embedding_hnsw 
ON raw_articles 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- Trigram Index on Entity Names: Powers instant search autocomplete
CREATE INDEX idx_entities_name_trgm ON entities USING gin (name gin_trgm_ops);
CREATE INDEX idx_entities_category ON entities(category);
CREATE INDEX idx_entities_banner_active ON entities(context_banner_active) WHERE context_banner_active = true;

-- Junction table index for reverse lookup (finding all events tagged with an entity)
CREATE INDEX idx_event_entities_entity_id ON event_entities(entity_id);