use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::time::Duration;
use tokio::time::sleep;
use crate::auth::{Account, AccountType};

const CLIENT_ID: &str = "YOUR_AZURE_CLIENT_ID"; // Placeholder
const SCOPE: &str = "XboxLive.Signin offline_access";

#[derive(Debug, Deserialize)]
pub struct DeviceCodeResponse {
    pub user_code: String,
    pub device_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: u64,
}

#[derive(Debug, Deserialize)]
struct XblResponse {
    #[serde(rename = "Token")]
    token: String,
    #[serde(rename = "DisplayClaims")]
    display_claims: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct MinecraftLoginResponse {
    pub access_token: String,
    pub expires_in: u64,
}

#[derive(Debug, Deserialize)]
struct MinecraftProfile {
    pub id: String,
    pub name: String,
    pub skins: Vec<Skin>,
    pub capes: Vec<Cape>,
}

#[derive(Debug, Deserialize)]
struct Skin {
    pub url: String,
    pub state: String, // "ACTIVE"
}

#[derive(Debug, Deserialize)]
struct Cape {
    pub url: String,
    pub state: String,
}

pub async fn start_device_flow(client: &Client) -> Result<DeviceCodeResponse, String> {
    let params = [
        ("client_id", CLIENT_ID),
        ("scope", SCOPE),
    ];

    let res = client.post("https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode")
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("Failed to start device flow: {}", res.status()));
    }

    res.json::<DeviceCodeResponse>().await.map_err(|e| e.to_string())
}

pub async fn poll_for_token(client: &Client, device_code: &str) -> Result<TokenResponse, String> {
    let params = [
        ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
        ("client_id", CLIENT_ID),
        ("device_code", device_code),
    ];

    // Simple polling logic would be implemented in the command handler usually, 
    // but here is a single attempt function or we can implement a loop in the command.
    // For this module, we'll provide the verify function.
    
    let res = client.post("https://login.microsoftonline.com/consumers/oauth2/v2.0/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    let text = res.text().await.map_err(|e| e.to_string())?;
    
    // Check for "authorization_pending" error in JSON if status is 400
    if text.contains("authorization_pending") {
        return Err("pending".to_string());
    }
    
    // Attempt parse
    serde_json::from_str::<TokenResponse>(&text).map_err(|_| text)
}

// Xbox Live Auth
pub async fn auth_xbl(client: &Client, ms_access_token: &str) -> Result<String, String> {
    let body = serde_json::json!({
        "Properties": {
            "AuthMethod": "RPS",
            "SiteName": "user.auth.xboxlive.com",
            "RpsTicket": format!("d={}", ms_access_token)
        },
        "RelyingParty": "http://auth.xboxlive.com",
        "TokenType": "JWT"
    });

    let res = client.post("https://user.auth.xboxlive.com/user/authenticate")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    let data: XblResponse = res.json().await.map_err(|e| e.to_string())?;
    Ok(data.token)
}

// XSTS Auth
pub async fn auth_xsts(client: &Client, xbl_token: &str) -> Result<(String, String), String> {
    let body = serde_json::json!({
        "Properties": {
            "SandboxId": "RETAIL",
            "UserTokens": [xbl_token]
        },
        "RelyingParty": "rp://api.minecraftservices.com/",
        "TokenType": "JWT"
    });

    let res = client.post("https://xsts.auth.xboxlive.com/xsts/authorize")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    // We need the uhs (User Hash) from DisplayClaims usually
    let data: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let token = data["Token"].as_str().ok_or("No XSTS token")?.to_string();
    
    // Extract uhs
    let uhs = data["DisplayClaims"]["xui"][0]["uhs"].as_str().ok_or("No UHS found")?.to_string();
    
    Ok((token, uhs))
}

// Minecraft Auth
pub async fn auth_minecraft(client: &Client, xsts_token: &str, uhs: &str) -> Result<Account, String> {
    let body = serde_json::json!({
        "identityToken": format!("XBL3.0 x={};{}", uhs, xsts_token)
    });

    let res = client.post("https://api.minecraftservices.com/launcher/login")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mc_data: MinecraftLoginResponse = res.json().await.map_err(|e| e.to_string())?;
    
    // Get Profile
    let profile_res = client.get("https://api.minecraftservices.com/minecraft/profile")
        .header("Authorization", format!("Bearer {}", mc_data.access_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let profile: MinecraftProfile = profile_res.json().await.map_err(|e| e.to_string())?;
    
    let skin = profile.skins.iter().find(|s| s.state == "ACTIVE").map(|s| s.url.clone());
    let cape = profile.capes.iter().find(|s| s.state == "ACTIVE").map(|s| s.url.clone());
    
    Ok(Account {
        uuid: profile.id,
        name: profile.name,
        access_token: Some(mc_data.access_token),
        refresh_token: None, // Should be passed from MS auth if we want to save it
        account_type: AccountType::Microsoft,
        skin_url: skin,
        cape_url: cape,
        expires_at: Some((chrono::Utc::now().timestamp() as u64 + mc_data.expires_in) as i64),
    })
}
