-- Rollback: 0017_market_extended

BEGIN;

DROP INDEX IF EXISTS idx_market_recommendations_score;
DROP INDEX IF EXISTS idx_market_recommendations_user;
DROP TABLE IF EXISTS market_recommendations;

DROP INDEX IF EXISTS idx_market_transactions_user;
DROP TABLE IF EXISTS market_transactions;

DROP INDEX IF EXISTS idx_user_market_purchases_item;
DROP INDEX IF EXISTS idx_user_market_purchases_user;
DROP TABLE IF EXISTS user_market_purchases;

DROP INDEX IF EXISTS idx_user_rewards_user;
DROP TABLE IF EXISTS user_rewards;

DROP INDEX IF EXISTS idx_user_wallet_user_id;
DROP TABLE IF EXISTS user_wallet;

DROP INDEX IF EXISTS idx_market_items_category;
DROP INDEX IF EXISTS idx_market_items_available;
DROP TABLE IF EXISTS market_items;

COMMIT;
