-- Down migration for 0012_reference.sql

DROP TABLE IF EXISTS listening_prompt_presets;
DROP TABLE IF EXISTS listening_prompt_templates;
DROP TABLE IF EXISTS analysis_events;
DROP TABLE IF EXISTS analysis_frame_data;
DROP TABLE IF EXISTS analysis_frame_manifests;
DROP TABLE IF EXISTS track_regions;
DROP TABLE IF EXISTS track_annotations;
DROP TABLE IF EXISTS track_analyses;
DROP TABLE IF EXISTS reference_tracks;
