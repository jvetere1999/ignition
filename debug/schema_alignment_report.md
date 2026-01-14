# Schema Alignment Report

## schema.json vs migrations/0001_schema.sql
- Schema tables: 83
- Migration tables: 84

### Missing tables in migration
- none

### Extra tables in migration
- schema_version

### Missing columns (schema has, migration lacks)
- none

### Extra columns (migration has, schema lacks)
- none

## migrations_old tables missing from active migration
- analysis_frame_chunks
- user_learn_srs
- user_market_purchases

## Backend SQL references not in schema.json (likely)
- user_market_purchases
