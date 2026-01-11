-- Migration 0012: Reference (Audio Analysis)
-- Tables: reference_tracks, track_analyses, track_annotations, track_regions,
--         analysis_frame_manifests, analysis_frame_data, analysis_events,
--         listening_prompt_templates, listening_prompt_presets
-- Note: analysis_frame_chunks REMOVED per DEC-012

-- =============================================================================
-- REFERENCE_TRACKS
-- =============================================================================
CREATE TABLE reference_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    genre TEXT,
    bpm REAL,
    key TEXT,
    duration_seconds REAL,
    r2_key TEXT NOT NULL,
    waveform_r2_key TEXT,
    thumbnail_r2_key TEXT,
    file_format TEXT,
    sample_rate INTEGER,
    bit_depth INTEGER,
    channels INTEGER,
    is_reference BOOLEAN NOT NULL DEFAULT true,
    is_user_upload BOOLEAN NOT NULL DEFAULT false,
    source TEXT,
    source_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX reference_tracks_user_idx ON reference_tracks(user_id);
CREATE INDEX reference_tracks_genre_idx ON reference_tracks(genre);
CREATE INDEX reference_tracks_is_reference_idx ON reference_tracks(is_reference);

-- =============================================================================
-- TRACK_ANALYSES
-- =============================================================================
CREATE TABLE track_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES reference_tracks(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    parameters JSONB,
    results JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX track_analyses_track_idx ON track_analyses(track_id);
CREATE INDEX track_analyses_status_idx ON track_analyses(status);
CREATE INDEX track_analyses_type_idx ON track_analyses(analysis_type);

-- =============================================================================
-- TRACK_ANNOTATIONS
-- =============================================================================
CREATE TABLE track_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES reference_tracks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time_seconds REAL NOT NULL,
    end_time_seconds REAL,
    annotation_type TEXT NOT NULL,
    title TEXT,
    content TEXT,
    color TEXT,
    tags TEXT[],
    is_private BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX track_annotations_track_idx ON track_annotations(track_id);
CREATE INDEX track_annotations_user_idx ON track_annotations(user_id);
CREATE INDEX track_annotations_type_idx ON track_annotations(annotation_type);

-- =============================================================================
-- TRACK_REGIONS
-- =============================================================================
CREATE TABLE track_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES reference_tracks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_time_seconds REAL NOT NULL,
    end_time_seconds REAL NOT NULL,
    color TEXT,
    region_type TEXT,
    notes TEXT,
    loop_count INTEGER NOT NULL DEFAULT 0,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX track_regions_track_idx ON track_regions(track_id);
CREATE INDEX track_regions_user_idx ON track_regions(user_id);

-- =============================================================================
-- ANALYSIS_FRAME_MANIFESTS
-- =============================================================================
CREATE TABLE analysis_frame_manifests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES reference_tracks(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,
    frame_rate REAL NOT NULL,
    total_frames INTEGER NOT NULL,
    feature_names TEXT[] NOT NULL,
    feature_dimensions INTEGER[] NOT NULL,
    storage_format TEXT NOT NULL DEFAULT 'msgpack',
    r2_key TEXT NOT NULL,
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(track_id, analysis_type)
);

CREATE INDEX analysis_frame_manifests_track_idx ON analysis_frame_manifests(track_id);

-- =============================================================================
-- ANALYSIS_FRAME_DATA
-- =============================================================================
-- Stores computed frame data for fast access (small analyses inline, large via R2)
CREATE TABLE analysis_frame_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manifest_id UUID NOT NULL REFERENCES analysis_frame_manifests(id) ON DELETE CASCADE,
    frame_index INTEGER NOT NULL,
    timestamp_seconds REAL NOT NULL,
    features JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(manifest_id, frame_index)
);

CREATE INDEX analysis_frame_data_manifest_idx ON analysis_frame_data(manifest_id);
CREATE INDEX analysis_frame_data_timestamp_idx ON analysis_frame_data(timestamp_seconds);

-- =============================================================================
-- ANALYSIS_EVENTS
-- =============================================================================
CREATE TABLE analysis_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES reference_tracks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    timestamp_seconds REAL NOT NULL,
    duration_seconds REAL,
    confidence REAL,
    value JSONB,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX analysis_events_track_idx ON analysis_events(track_id);
CREATE INDEX analysis_events_type_idx ON analysis_events(event_type);
CREATE INDEX analysis_events_timestamp_idx ON analysis_events(timestamp_seconds);

-- =============================================================================
-- LISTENING_PROMPT_TEMPLATES
-- =============================================================================
CREATE TABLE listening_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    prompts JSONB NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed some default templates
INSERT INTO listening_prompt_templates (key, name, description, category, prompts, difficulty, is_system) VALUES
    ('basic_elements', 'Basic Elements', 'Identify fundamental musical elements', 'fundamentals', 
     '["What instruments do you hear?", "Can you identify the key or mode?", "What is the approximate tempo?", "Describe the overall mood or energy."]'::jsonb,
     'beginner', true),
    ('production_analysis', 'Production Analysis', 'Analyze production techniques', 'production',
     '["How is the stereo field used?", "Describe the reverb characteristics.", "What compression techniques do you notice?", "How are frequencies balanced?"]'::jsonb,
     'intermediate', true),
    ('arrangement_study', 'Arrangement Study', 'Study song arrangement and structure', 'arrangement',
     '["Map out the song structure (intro, verse, chorus, etc.)", "How do instruments enter and exit?", "What creates tension and release?", "Identify the climax of the song."]'::jsonb,
     'intermediate', true);

-- =============================================================================
-- LISTENING_PROMPT_PRESETS
-- =============================================================================
CREATE TABLE listening_prompt_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_ids UUID[],
    custom_prompts JSONB,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX listening_prompt_presets_user_idx ON listening_prompt_presets(user_id);
