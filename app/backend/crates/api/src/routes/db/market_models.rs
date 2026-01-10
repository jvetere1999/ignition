/// Market models for Extended scope (MVP + Full + Extended features)
/// Replaces localStorage market state with PostgreSQL-backed system

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MarketItem {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub cost_coins: i32,
    pub category: Option<String>,
    pub rarity: Option<String>, // common, rare, epic, legendary
    pub icon_url: Option<String>,
    pub available: bool,
    pub available_from: Option<DateTime<Utc>>,
    pub available_until: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserWallet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub total_coins: i32,
    pub earned_coins: i32,
    pub spent_coins: i32,
    pub updated_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserReward {
    pub id: Uuid,
    pub user_id: Uuid,
    pub reward_type: String,
    pub coins_earned: i32,
    pub claimed: bool,
    pub claimed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UserMarketPurchase {
    pub id: Uuid,
    pub user_id: Uuid,
    pub item_id: Uuid,
    pub quantity: i32,
    pub cost_paid_coins: i32,
    pub purchased_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MarketTransaction {
    pub id: Uuid,
    pub user_id: Uuid,
    pub transaction_type: String, // earn, spend, refund
    pub coins_amount: i32,
    pub reason: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct MarketRecommendation {
    pub id: Uuid,
    pub user_id: Uuid,
    pub item_id: Uuid,
    pub score: Option<f32>, // 0.0-1.0
    pub reason: Option<String>,
    pub computed_at: DateTime<Utc>,
}

// Request/Response DTOs

#[derive(Debug, Deserialize)]
pub struct PurchaseRequest {
    pub item_id: Uuid,
    pub quantity: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct WalletResponse {
    pub total_coins: i32,
    pub earned_coins: i32,
    pub spent_coins: i32,
}

#[derive(Debug, Serialize)]
pub struct InventoryResponse {
    pub purchases: Vec<UserMarketPurchase>,
    pub total_items: usize,
}

#[derive(Debug, Serialize)]
pub struct MarketResponse {
    pub items: Vec<MarketItem>,
    pub recommendations: Vec<MarketRecommendation>,
}
