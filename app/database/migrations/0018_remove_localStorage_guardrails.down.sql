-- Rollback: 0018_remove_localStorage_guardrails

BEGIN;

DELETE FROM feature_flags WHERE flag_name = 'DISABLE_MASS_LOCAL_PERSISTENCE';

COMMIT;
