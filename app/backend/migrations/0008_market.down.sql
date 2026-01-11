-- Down migration for 0008_market.sql

DROP TRIGGER IF EXISTS update_market_items_updated_at ON market_items;

DROP TABLE IF EXISTS market_recommendations;
DROP TABLE IF EXISTS user_rewards;
DROP TABLE IF EXISTS market_transactions;
DROP TABLE IF EXISTS user_purchases;
DROP TABLE IF EXISTS market_items;
