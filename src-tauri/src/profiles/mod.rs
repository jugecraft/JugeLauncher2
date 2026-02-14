use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub version_id: String,
    pub java_args: String,
    pub java_path: Option<String>,
    pub min_memory: u32,
    pub max_memory: u32,
    pub width: u32,
    pub height: u32,
    #[serde(default)]
    pub enabled_mods: Vec<String>,
    pub created_at: i64,
}

impl Default for Profile {
    fn default() -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            name: "Default Profile".to_string(),
            version_id: "1.19.4".to_string(),
            java_args: "-XX:+UseG1GC".to_string(),
            java_path: None,
            min_memory: 1024,
            max_memory: 4096,
            width: 854,
            height: 480,
            enabled_mods: Vec::new(),
            created_at: chrono::Utc::now().timestamp(),
        }
    }
}

pub struct ProfileManager {
    pub profiles: HashMap<String, Profile>,
    pub base_dir: PathBuf,
}

impl ProfileManager {
    pub fn new(base_dir: PathBuf) -> Self {
        let mut manager = Self {
            profiles: HashMap::new(),
            base_dir,
        };
        let _ = manager.load();
        manager
    }

    fn get_file_path(&self) -> PathBuf {
        self.base_dir.join("profiles.json")
    }

    pub fn load(&mut self) -> Result<(), String> {
        let path = self.get_file_path();
        if !path.exists() {
            // Create default if not exists
            let default_profile = Profile::default();
            self.profiles
                .insert(default_profile.id.clone(), default_profile);
            return self.save();
        }

        let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
        self.profiles = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn save(&self) -> Result<(), String> {
        let path = self.get_file_path();
        let content = serde_json::to_string_pretty(&self.profiles).map_err(|e| e.to_string())?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        fs::write(path, content).map_err(|e| e.to_string())
    }

    pub fn create_profile(&mut self, name: String, version_id: String) -> Profile {
        let mut profile = Profile::default();
        profile.name = name;
        profile.version_id = version_id;
        self.profiles.insert(profile.id.clone(), profile.clone());
        let _ = self.save();
        profile
    }

    pub fn update_profile(&mut self, profile: Profile) -> Result<(), String> {
        if self.profiles.contains_key(&profile.id) {
            self.profiles.insert(profile.id.clone(), profile);
            self.save()
        } else {
            Err("Profile not found".to_string())
        }
    }

    pub fn delete_profile(&mut self, id: &str) -> Result<(), String> {
        self.profiles.remove(id);
        self.save()
    }

    pub fn list_profiles(&self) -> Vec<Profile> {
        let mut list: Vec<Profile> = self.profiles.values().cloned().collect();
        list.sort_by_key(|p| p.created_at);
        list
    }
}
