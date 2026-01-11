-- Migration: 0017_market_extended
-- Purpose: Create Extended Market module tables (MVP + Full + Extended features)
-- Context: Replaces localStorage market state with PostgreSQL backend
-- D1 fully deprecated; PostgreSQL only

BEGIN;

-- Drop conflicting tables from previous migrations (0007)
DROP TABLE IF EXISTS user_purchases CASCADE;
DROP TABLE IF EXISTS market_items CASCADE;
DROP TABLE IF EXISTS user_market_purchases CASCADE;
DROP TABLE IF EXISTS user_wallet CASCADE;
DROP TABLE IF EXISTS user_rewards CASCADE;
DROP TABLE IF EXISTS market_transactions CASCADE;
DROP TABLE IF EXISTS market_recommendations CASCADE;

-- Market items catalog
CREATE TABLE market_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cost_coins INT NOT NULL,
  category VARCHAR(100),
  rarity VARCHAR(50), -- common, rare, epic, legendary
  icon_url TEXT,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_items_available ON market_items(available) WHERE available = TRUE;
CREATE INDEX idx_market_items_category ON market_items(category);

-- User wallet (coin balance)
CREATE TABLE user_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_coins INT NOT NULL DEFAULT 0,
  earned_coins INT NOT NULL DEFAULT 0,
  spent_coins INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

CREATE INDEX idx_user_wallet_user_id ON user_wallet(user_id);

-- User rewards (achievements, claimed rewards)
CREATE TABLE user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type VARCHAR(100) NOT NULL, -- milestone, daily_login, goal_completed, etc.
  coins_earned INT NOT NULL DEFAULT 0,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_rewards_claimed ON user_rewards(user_id, claimed);

-- Market purchases (what user owns)
CREATE TABLE user_market_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE RESTRICT,
  quantity INT NOT NULL DEFAULT 1,
  cost_paid_coins INT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, item_id)
);

CREATE INDEX idx_user_market_purchases_user ON user_market_purchases(user_id);
CREATE INDEX idx_user_market_purchases_item ON user_market_purchases(item_id);

-- Transaction history (for analytics, DEC-002 Extended scope)
CREATE TABLE market_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'earn', 'spend', 'refund'
  coins_amount INT NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_market_transactions_user ON market_transactions(user_id, created_at DESC);

-- Market recommendations (DEC-002 Extended scope: sequence-based suggestions)
CREATE TABLE market_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
  score DECIMAL(3, 2), -- 0.0-1.0 confidence
  reason VARCHAR(100), -- 'frequently_purchased', 'matches_goal', 'trending', etc.
  computed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, item_id)
);

CREATE INDEX idx_market_recommendations_user ON market_recommendations(user_id);
CREATE INDEX idx_market_recommendations_score ON market_recommendations(user_id, score DESC);

COMMIT;
