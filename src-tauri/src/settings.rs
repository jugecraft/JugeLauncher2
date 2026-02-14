use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub minecraft_dir: Option<String>,
    pub min_memory: u32,
    pub max_memory: u32,
    pub width: u32,
    pub height: u32,
    pub full_screen: bool,
    pub java_path: Option<String>,
    pub theme: String,
    pub language: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            minecraft_dir: None,
            min_memory: 1024,
            max_memory: 4096,
            width: 854,
            height: 480,
            full_screen: false,
            java_path: None,
            theme: "dark".to_string(),
            language: "en".to_string(),
        }
    }
}

pub struct SettingsManager {
    pub base_dir: PathBuf,
}

impl SettingsManager {
    pub fn new(base_dir: PathBuf) -> Self {
        Self { base_dir }
    }

    pub fn get_file_path(&self) -> PathBuf {
        self.base_dir.join("settings.json")
    }

    pub fn load(&self) -> Settings {
        let path = self.get_file_path();
        if !path.exists() {
            return Settings::default();
        }

        match fs::read_to_string(path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_else(|_| Settings::default()),
            Err(_) => Settings::default(),
        }
    }

    pub fn save(&self, settings: &Settings) -> Result<(), String> {
        let path = self.get_file_path();
        let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;

        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        fs::write(path, content).map_err(|e| e.to_string())
    }
}
