use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    pub id: String,
    #[serde(rename = "minecraftVersion")]
    pub minecraft_version: String,
    #[serde(rename = "forgeVersion")]
    pub forge_version: Option<String>,
    #[serde(rename = "type")]
    pub version_type: VersionType,
    #[serde(rename = "downloadUrls")]
    pub download_urls: DownloadUrls,
    pub sha256: String,
    pub size: u64,
    #[serde(rename = "releaseTime")]
    pub release_time: String,
    #[serde(rename = "mainClass")]
    pub main_class: String,
    #[serde(rename = "assetIndex")]
    pub asset_index: AssetIndex,
    #[serde(rename = "arguments")]
    pub arguments: Arguments,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetIndex {
    pub id: String,
    pub sha1: String,
    pub size: u64,
    pub url: String,
    #[serde(rename = "totalSize")]
    pub total_size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Arguments {
    #[serde(default)]
    pub game: Vec<serde_json::Value>, // Can be string or object with rules
    #[serde(default)]
    pub jvm: Vec<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum VersionType {
    Vanilla,
    Forge,
    Fabric,
    VanillaClientForge,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadUrls {
    pub minecraft: String, // URL to client.jar
    pub forge: Option<String>, // URL to forge-installer or universal
    #[serde(default)]
    pub libraries: Vec<String>, // URLs to libraries
}
