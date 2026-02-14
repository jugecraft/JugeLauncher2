use serde::{Deserialize, Serialize};
use reqwest::Client;
use crate::auth::{Account, AccountType};
use std::fmt;

const CLIENT_ID: &str = "09c31371-2763-4334-824e-73ad0e3f4a58";
const REDIRECT_URI: &str = "http://localhost:8080";
const SCOPE: &str = "XboxLive.signin offline_access";


#[derive(Debug, Serialize, Deserialize)]
pub enum AuthError {
    Network(String),
    Protocol(String),
    Pending,
    Expired,
    Denied,
    Unexpected(String),
}

impl fmt::Display for AuthError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AuthError::Network(e) => write!(f, "Network error: {}", e),
            AuthError::Protocol(e) => write!(f, "Protocol error: {}", e),
            AuthError::Pending => write!(f, "Authorization pending"),
            AuthError::Expired => write!(f, "Authorization expired"),
            AuthError::Denied => write!(f, "Authorization denied"),
            AuthError::Unexpected(e) => write!(f, "Unexpected error: {}", e),
        }
    }
}

impl From<reqwest::Error> for AuthError {
    fn from(err: reqwest::Error) -> Self {
        AuthError::Network(err.to_string())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceCodeResponse {
    pub user_code: String,
    pub device_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: Option<String>,
    pub expires_in: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MicrosoftAccount {
    pub uuid: String,
    pub username: String,
    #[serde(rename = "accessToken")]
    pub access_token: String,
    #[serde(rename = "mcAccessToken")]
    pub mc_access_token: String,
    #[serde(rename = "xboxToken")]
    pub xbox_token: String,
    #[serde(rename = "refreshToken")]
    pub refresh_token: String,
    #[serde(rename = "expiresAt")]
    pub expires_at: i64,
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
}

pub async fn start_device_flow(client: &Client) -> Result<DeviceCodeResponse, AuthError> {
    let params = [
        ("client_id", CLIENT_ID),
        ("scope", SCOPE),
    ];

    let res = client.post("https://login.microsoftonline.com/consumers/oauth2/v2.0/devicecode")
        .header("User-Agent", "JugeLauncher/1.0")
        .form(&params)
        .send()
        .await?;

    if !res.status().is_success() {
        let status = res.status();
        let body = res.text().await.unwrap_or_else(|_| "Unknown error".into());
        return Err(AuthError::Protocol(format!("HTTP {} - {}", status, body)));
    }

    res.json::<DeviceCodeResponse>().await.map_err(|e| AuthError::Protocol(e.to_string()))
}

pub async fn poll_for_token(client: &Client, device_code: &str) -> Result<TokenResponse, AuthError> {
    let params = [
        ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
        ("client_id", CLIENT_ID),
        ("device_code", device_code),
    ];

    let res = client.post("https://login.microsoftonline.com/consumers/oauth2/v2.0/token")
        .header("User-Agent", "JugeLauncher/1.0")
        .form(&params)
        .send()
        .await?;
        
    let status = res.status();
    let text = res.text().await?;
    
    if status == 400 {
        if text.contains("authorization_pending") {
            return Err(AuthError::Pending);
        } else if text.contains("expired_token") {
            return Err(AuthError::Expired);
        } else if text.contains("access_denied") {
            return Err(AuthError::Denied);
        }
    }

    if !status.is_success() {
        return Err(AuthError::Protocol(format!("HTTP {}: {}", status, text)));
    }
    
    serde_json::from_str::<TokenResponse>(&text).map_err(|e| AuthError::Protocol(e.to_string()))
}

pub async fn refresh_microsoft_token(client: &Client, refresh_token: &str) -> Result<TokenResponse, AuthError> {
    let params = [
        ("grant_type", "refresh_token"),
        ("client_id", CLIENT_ID),
        ("refresh_token", refresh_token),
        ("scope", SCOPE),
    ];

    let res = client.post("https://login.microsoftonline.com/consumers/oauth2/v2.0/token")
        .header("User-Agent", "JugeLauncher/1.0")
        .form(&params)
        .send()
        .await?;

    if !res.status().is_success() {
        return Err(AuthError::Protocol(format!("Refresh failed: {}", res.status())));
    }

    res.json::<TokenResponse>().await.map_err(|e| AuthError::Protocol(e.to_string()))
}

pub async fn full_login_chain(client: &Client, ms_token_res: TokenResponse) -> Result<MicrosoftAccount, AuthError> {
    // 1. Xbox Live
    let body = serde_json::json!({
        "Properties": {
            "AuthMethod": "RPS",
            "SiteName": "user.auth.xboxlive.com",
            "RpsTicket": format!("d={}", ms_token_res.access_token)
        },
        "RelyingParty": "http://auth.xboxlive.com",
        "TokenType": "JWT"
    });

    let xbl_res = client.post("https://user.auth.xboxlive.com/user/authenticate")
        .header("User-Agent", "JugeLauncher/1.0")
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&body)
        .send()
        .await?;
        
    let xbl_status = xbl_res.status();
    let xbl_text = xbl_res.text().await.map_err(|e| AuthError::Protocol(format!("XBL Text: {}", e)))?;
    
    if !xbl_status.is_success() {
        return Err(AuthError::Protocol(format!("XBL Auth Failed ({}): {}", xbl_status, xbl_text)));
    }

    let xbl_data: XblResponse = serde_json::from_str(&xbl_text).map_err(|e| AuthError::Protocol(format!("XBL Parse: {} - Body: {}", e, xbl_text)))?;
    let xbl_token = xbl_data.token;

    // 2. XSTS
    let body = serde_json::json!({
        "Properties": {
            "SandboxId": "RETAIL",
            "UserTokens": [xbl_token]
        },
        "RelyingParty": "rp://api.minecraftservices.com/",
        "TokenType": "JWT"
    });

    println!("DEBUG: XBL Token length: {}", xbl_token.len());

    let xsts_res = client.post("https://xsts.auth.xboxlive.com/xsts/authorize")
        .header("User-Agent", "JugeLauncher/1.0")
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&body)
        .send()
        .await?;

    let xsts_status = xsts_res.status();
    let xsts_text = xsts_res.text().await.map_err(|e| AuthError::Protocol(format!("Error de red en XSTS: {}", e)))?;

    if !xsts_status.is_success() {
        let error_json: serde_json::Value = serde_json::from_str(&xsts_text).unwrap_or_default();
        let error_code = error_json["XErr"].as_u64().unwrap_or(0);
        
        let friendly_err = match error_code {
            2148916233 => "Tu cuenta no tiene un perfil de Xbox. Por favor, crea uno en xbox.com.",
            2148916235 => "Tu cuenta no tiene acceso a Xbox Live en esta región.",
            2148916238 => "Tu cuenta es de un menor de edad. Necesitas que un adulto la añada a una familia de Microsoft.",
            _ => "Error en la autorización de Xbox (XSTS).",
        };
        
        return Err(AuthError::Protocol(format!("{} (Código: {})", friendly_err, error_code)));
    }

    let xsts_data: serde_json::Value = serde_json::from_str(&xsts_text).map_err(|e| AuthError::Protocol(format!("Error parsing XSTS: {}", e)))?;
    
    // Debug XSTS structure
    println!("DEBUG: XSTS Response keys: {:?}", xsts_data.as_object().map(|o| o.keys().collect::<Vec<_>>()));

    let xsts_token = xsts_data["Token"].as_str().ok_or(AuthError::Protocol("No XSTS token".into()))?.to_string();
    let uhs = xsts_data["DisplayClaims"]["xui"][0]["uhs"].as_str().ok_or(AuthError::Protocol("No UHS".into()))?.to_string();

    println!("DEBUG: UHS length: {}, XSTS Token length: {}", uhs.len(), xsts_token.len());
    
    // 3. Minecraft
    let identity_token = format!("XBL3.0 x={};{}", uhs, xsts_token);

    let body = serde_json::json!({
        "identityToken": identity_token
    });

    let mc_res = client.post("https://api.minecraftservices.com/authentication/login_with_xbox")
        .header("User-Agent", "JugeLauncher/1.0")
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&body)
        .send()
        .await?;

    let mc_status = mc_res.status();
    let mc_text = mc_res.text().await.map_err(|e| AuthError::Protocol(format!("Error de red en Minecraft: {}", e)))?;

    if !mc_status.is_success() {
        println!("DEBUG: MC Login Error Body: {}", mc_text);
        let error_json: serde_json::Value = serde_json::from_str(&mc_text).unwrap_or_default();
        let error_type = error_json["error"].as_str()
            .or(error_json["errorMessage"].as_str())
            .unwrap_or("");
        
        let friendly_err = if error_type == "NOT_FOUND" {
            "Tu cuenta no parece tener Minecraft comprado."
        } else if error_type == "CONSTRAINT_VIOLATION" {
            "Error de validación (CONSTRAINT_VIOLATION). Revisa que el token XSTS sea para Minecraft."
        } else if error_type.contains("Invalid app registration") {
            "Error: Aplicación no registrada para Minecraft. Revisa los permisos en Azure."
        } else {
            "Error al iniciar sesión en los servicios de Minecraft."
        };
        
        return Err(AuthError::Protocol(format!("{} ({})", friendly_err, error_type)));
    }

    let mc_data: MinecraftLoginResponse = serde_json::from_str(&mc_text).map_err(|e| AuthError::Protocol(format!("Error parsing MC Login: {}", e)))?;

    
    // 4. Profile
    let profile_res = client.get("https://api.minecraftservices.com/minecraft/profile")
        .header("User-Agent", "JugeLauncher/1.0")
        .header("Authorization", format!("Bearer {}", mc_data.access_token))
        .send()
        .await?;

    let profile_status = profile_res.status();
    let profile_text = profile_res.text().await.map_err(|e| AuthError::Protocol(format!("Profile Text: {}", e)))?;

    if !profile_status.is_success() {
        return Err(AuthError::Protocol(format!("Profile Fetch Failed ({}): {}", profile_status, profile_text)));
    }

    let profile: MinecraftProfile = serde_json::from_str(&profile_text).map_err(|e| AuthError::Protocol(format!("Profile Parse: {} - Body: {}", e, profile_text)))?;
    
    Ok(MicrosoftAccount {
        uuid: profile.id,
        username: profile.name,
        access_token: ms_token_res.access_token,
        mc_access_token: mc_data.access_token,
        xbox_token: xsts_token,
        refresh_token: ms_token_res.refresh_token.unwrap_or_default(),
        expires_at: chrono::Utc::now().timestamp() + (mc_data.expires_in as i64),
    })
}

pub async fn upload_skin(token: &str, file_path: &str, variant: &str) -> Result<(), AuthError> {
    let client = Client::new();
    let file_content = std::fs::read(file_path).map_err(|e| AuthError::Unexpected(e.to_string()))?;
    
    let part = reqwest::multipart::Part::bytes(file_content)
        .file_name("skin.png")
        .mime_str("image/png")
        .map_err(|e| AuthError::Unexpected(e.to_string()))?;

    let form = reqwest::multipart::Form::new()
        .part("file", part)
        .text("variant", variant.to_string());

    let res = client.post("https://api.minecraftservices.com/minecraft/profile/skins")
        .header("Authorization", format!("Bearer {}", token))
        .multipart(form)
        .send()
        .await?;

    if res.status().is_success() {
        Ok(())
    } else {
        let text = res.text().await.unwrap_or_default();
        Err(AuthError::Network(format!("Upload failed: {}", text)))
    }
}
