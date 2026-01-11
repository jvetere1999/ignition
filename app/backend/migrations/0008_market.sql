-- Migration 0008: Market
-- Tables: market_items, user_purchases, market_transactions, user_rewards, market_recommendations

-- =============================================================================
-- MARKET_ITEMS
-- =============================================================================
CREATE TABLE market_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    cost_coins INTEGER NOT NULL,
    rarity TEXT NOT NULL DEFAULT 'common',
    icon TEXT,
    icon_url TEXT,
    image_url TEXT,
    is_global BOOLEAN NOT NULL DEFAULT true,
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_consumable BOOLEAN NOT NULL DEFAULT false,
    uses_per_purchase INTEGER DEFAULT 1,
    total_stock INTEGER,
    remaining_stock INTEGER,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    created_by_user_id UUID REFERENCES users(id),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX market_items_category_idx ON market_items(category);
CREATE INDEX market_items_available_idx ON market_items(is_available, is_active);
CREATE INDEX market_items_rarity_idx ON market_items(rarity);

CREATE TRIGGER update_market_items_updated_at
    BEFORE UPDATE ON market_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed some market items
INSERT INTO market_items (key, name, description, category, cost_coins, rarity, icon, sort_order) VALUES
    ('theme_dark', 'Dark Theme', 'A sleek dark theme for night owls', 'theme', 100, 'common', 'moon', 1),
    ('theme_nature', 'Nature Theme', 'Calming natural colors', 'theme', 150, 'common', 'leaf', 2),
    ('avatar_ninja', 'Ninja Avatar', 'A stealthy ninja avatar', 'avatar', 200, 'rare', 'ninja', 3),
    ('avatar_wizard', 'Wizard Avatar', 'A mystical wizard avatar', 'avatar', 200, 'rare', 'wand', 4),
    ('boost_xp_2x', '2x XP Boost (1 hour)', 'Double XP for one hour', 'boost', 500, 'epic', 'zap', 5),
    ('boost_coins_2x', '2x Coins Boost (1 hour)', 'Double coins for one hour', 'boost', 500, 'epic', 'coins', 6),
    ('badge_early_adopter', 'Early Adopter Badge', 'Show you were here from the start', 'badge', 1000, 'legendary', 'star', 7);

-- =============================================================================
-- USER_PURCHASES (Merged from user_purchases + user_market_purchases)
-- =============================================================================
CREATE TABLE user_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES market_items(id),
    cost_coins INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    redeemed_at TIMESTAMPTZ,
    uses_remaining INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    refunded_at TIMESTAMPTZ,
    refund_reason TEXT
);

CREATE INDEX user_purchases_user_idx ON user_purchases(user_id);
CREATE INDEX user_purchases_item_idx ON user_purchases(item_id);
CREATE INDEX user_purchases_status_idx ON user_purchases(user_id, status);

-- =============================================================================
-- MARKET_TRANSACTIONS
-- =============================================================================
CREATE TABLE market_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL,
    coins_amount INTEGER NOT NULL,
    item_id UUID REFERENCES market_items(id),
    purchase_id UUID REFERENCES user_purchases(id),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX market_transactions_user_idx ON market_transactions(user_id);
CREATE INDEX market_transactions_type_idx ON market_transactions(transaction_type);
CREATE INDEX market_transactions_created_idx ON market_transactions(created_at DESC);

-- =============================================================================
-- USER_REWARDS
-- =============================================================================
CREATE TABLE user_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL,
    source_id UUID,
    coins_earned INTEGER NOT NULL DEFAULT 0,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    claimed BOOLEAN NOT NULL DEFAULT false,
    claimed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_rewards_user_idx ON user_rewards(user_id);
CREATE INDEX user_rewards_claimed_idx ON user_rewards(user_id, claimed);
CREATE INDEX user_rewards_type_idx ON user_rewards(reward_type);

-- =============================================================================
-- MARKET_RECOMMENDATIONS
-- =============================================================================
CREATE TABLE market_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES market_items(id) ON DELETE CASCADE,
    score REAL NOT NULL,
    reason TEXT,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX market_recommendations_user_idx ON market_recommendations(user_id);
CREATE INDEX market_recommendations_score_idx ON market_recommendations(user_id, score DESC);
