# Schema Generator Tool

Single source of truth for database schema management.

## Files

- **schema.json** - Schema definition (v2.0.0)
- **generate_all.py** - Main generator script
- **add_timestamp_defaults.py** - Utility to add NOW() defaults to timestamp fields
- **add_updated_at_defaults.py** - Utility to add NOW() defaults to updated_at fields
- **build_schema.py** - Legacy schema builder
- **generate_from_schema.py** - Legacy schema generator
- **validate_schema.py** - Schema validation utility

## Usage

From repo root:

```bash
cd tools/schema-generator
python3 generate_all.py
```

Generates:
- `../../app/backend/migrations/0001_schema.sql` - PostgreSQL schema
- `../../app/backend/migrations/0002_seeds.sql` - Seed data
- `../../app/backend/crates/api/src/db/generated.rs` - Rust types
- `../../app/frontend/src/lib/generated_types.ts` - TypeScript types

## Schema Conventions

- All `created_at`/`updated_at`/`granted_at`/`started_at`/`completed_at`/`earned_at` fields default to `NOW()`
- All `id` fields are UUID with `gen_random_uuid()` default
- Composite unique constraints for all `ON CONFLICT` operations
- Snake_case in database, camelCase in TypeScript, PascalCase for Rust types

## After Schema Changes

1. Edit `schema.json`
2. Run `python3 generate_all.py`
3. **Stop Fly machines**: `flyctl machines stop <id> --app ignition-api`
4. **Wipe Neon database** (if migration 0001 changed)
5. Deploy: `cd ../../app/backend && flyctl deploy --app ignition-api`
