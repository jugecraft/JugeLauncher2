use serde::{Deserialize, Serialize};

pub mod microsoft;
pub mod offline;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AccountType {
    Microsoft,
    Offline,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub uuid: String,
    pub name: String,
    pub access_token: Option<String>,  // Minecraft Access Token
    pub refresh_token: Option<String>, // Microsoft Refresh Token
    pub account_type: AccountType,
    pub skin_url: Option<String>,
    pub cape_url: Option<String>,
    pub expires_at: Option<i64>, // Timestamp
}

impl Account {
    pub fn new_offline(name: &str) -> Self {
        // Generate UUID based on name (v3/v5) or random for verification
        // For offline mode, usually name is enough, but UUID is needed for game arguments
        let uuid = uuid::Uuid::new_v4().to_string();

        Self {
            uuid: uuid.to_string(),
            name: name.to_string(),
            access_token: Some("0".to_string()), // Dummy token
            refresh_token: None,
            account_type: AccountType::Offline,
            skin_url: None,
            cape_url: None,
            expires_at: None,
        }
    }
}
