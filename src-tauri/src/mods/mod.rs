use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::fs;
use sha2::{Sha256, Digest};
use std::io;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mod {
    pub name: String,
    pub filename: String,
    pub path: String,
    pub enabled: bool,
    pub size: u64,
    pub sha256: Option<String>,
}

pub struct ModManager {
    pub base_dir: PathBuf,
}

impl ModManager {
    pub fn new(base_dir: PathBuf) -> Self {
        Self { base_dir }
    }

    pub fn get_mods_dir(&self, version_id: &str) -> PathBuf {
        self.base_dir.join("versions").join(version_id).join("mods")
    }

    pub fn scan_mods(&self, version_id: &str) -> Result<Vec<Mod>, String> {
        let mods_dir = self.get_mods_dir(version_id);
        if !mods_dir.exists() {
            fs::create_dir_all(&mods_dir).map_err(|e| e.to_string())?;
            return Ok(Vec::new());
        }

        let mut mods = Vec::new();
        let entries = fs::read_dir(&mods_dir).map_err(|e| e.to_string())?;

        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_file() {
                let filename = entry.file_name().to_string_lossy().to_string();
                let enabled = filename.ends_with(".jar");
                
                // Check if it's a mod file (either .jar or .jar.disabled)
                if enabled || filename.ends_with(".jar.disabled") {
                    let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                    
                    // Simple name extraction
                    let name = if enabled {
                        filename.trim_end_matches(".jar").to_string()
                    } else {
                        filename.trim_end_matches(".jar.disabled").to_string()
                    };

                    mods.push(Mod {
                        name,
                        filename: filename.clone(),
                        path: path.to_string_lossy().to_string(),
                        enabled,
                        size,
                        sha256: None, // Expensive to calc on every scan, maybe load from cache
                    });
                }
            }
        }
        
        mods.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(mods)
    }

    pub fn toggle_mod(&self, version_id: &str, filename: &str, enable: bool) -> Result<(), String> {
        let mods_dir = self.get_mods_dir(version_id);
        let current_path = mods_dir.join(filename);
        
        if !current_path.exists() {
            return Err("Mod file not found".to_string());
        }

        // Logic: 
        // If enabling: remove .disabled from end
        // If disabling: add .disabled to end
        
        let new_filename = if enable {
            filename.trim_end_matches(".disabled").to_string()
        } else {
            if filename.ends_with(".disabled") {
                return Ok(()); // Already disabled
            }
            format!("{}.disabled", filename)
        };
        
        let new_path = mods_dir.join(new_filename);
        fs::rename(current_path, new_path).map_err(|e| e.to_string())?;
        
        Ok(())
    }
}
