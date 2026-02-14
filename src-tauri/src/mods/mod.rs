use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

mod metadata;
use metadata::read_metadata;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mod {
    pub name: String,
    pub filename: String,
    pub path: String,
    pub enabled: bool,
    pub size: u64,
    pub sha256: Option<String>,
    pub version: Option<String>,
    pub game_version: Option<String>,
    pub description: Option<String>,
    pub authors: Option<Vec<String>>,
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

    pub fn scan_mods(&self, dir: &Path) -> Result<Vec<Mod>, String> {
        if !dir.exists() {
            fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            return Ok(Vec::new());
        }

        let mut mods = Vec::new();
        let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;

        for entry in entries {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_file() {
                let filename = entry.file_name().to_string_lossy().to_string();
                let enabled = filename.ends_with(".jar");

                if enabled || filename.ends_with(".jar.disabled") {
                    let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                    let mut name = if enabled {
                        filename.trim_end_matches(".jar").to_string()
                    } else {
                        filename.trim_end_matches(".jar.disabled").to_string()
                    };

                    // Read metadata
                    let meta = read_metadata(&path);
                    if let Some(meta_name) = meta.name {
                        name = meta_name;
                    }

                    mods.push(Mod {
                        name,
                        filename: filename.clone(),
                        path: path.to_string_lossy().to_string(),
                        enabled,
                        size,
                        sha256: None,
                        version: meta.version,
                        game_version: meta.game_version,
                        description: meta.description,
                        authors: meta.authors,
                    });
                }
            }
        }

        mods.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(mods)
    }

    pub fn toggle_mod(&self, dir: &Path, filename: &str, enable: bool) -> Result<(), String> {
        let current_path = dir.join(filename);

        if !current_path.exists() {
            return Err("Mod file not found".to_string());
        }

        let new_filename = if enable {
            filename.trim_end_matches(".disabled").to_string()
        } else {
            if filename.ends_with(".disabled") {
                return Ok(());
            }
            format!("{}.disabled", filename)
        };

        let new_path = dir.join(new_filename);
        fs::rename(current_path, new_path).map_err(|e| e.to_string())?;

        Ok(())
    }
}
