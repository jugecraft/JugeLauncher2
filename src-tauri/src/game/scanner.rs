use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalVersion {
    pub id: String,
    pub version_type: String,
    pub path: String,
}

pub fn find_minecraft_dir() -> PathBuf {
    #[cfg(target_os = "windows")]
    let path = {
        let mut path = PathBuf::from(std::env::var("APPDATA").unwrap_or_else(|_| "".to_string()));
        path.push(".minecraft");
        path
    };

    #[cfg(target_os = "macos")]
    let path = {
        let mut path = directories::UserDirs::new()
            .map(|dirs| dirs.home_dir().to_path_buf())
            .unwrap_or_else(|| PathBuf::from(""));
        path.push("Library/Application Support/minecraft");
        path
    };

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    let path = {
        let mut path = directories::UserDirs::new()
            .map(|dirs| dirs.home_dir().to_path_buf())
            .unwrap_or_else(|| PathBuf::from(""));
        path.push(".minecraft");
        path
    };

    println!("DEBUG: Minecraft directory found at: {:?}", path);
    path
}

pub fn scan_versions(mc_dir: &Path) -> Vec<LocalVersion> {
    println!("DEBUG: Scanning versions in: {:?}", mc_dir);
    let versions_dir = mc_dir.join("versions");
    if !versions_dir.exists() {
        println!(
            "DEBUG: Versions directory does not exist: {:?}",
            versions_dir
        );
        return Vec::new();
    }

    let mut versions = Vec::new();
    if let Ok(entries) = fs::read_dir(versions_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.is_dir() {
                    let id = entry.file_name().to_string_lossy().to_string();
                    let json_path = path.join(format!("{}.json", id));

                    if json_path.exists() {
                        let version = LocalVersion {
                            id: id.clone(),
                            version_type: "local".to_string(),
                            path: path.to_string_lossy().to_string(),
                        };
                        println!("DEBUG: Found local version: {}", id);
                        versions.push(version);
                    } else {
                        println!("DEBUG: Skipping {}, no JSON found at {:?}", id, json_path);
                    }
                }
            }
        }
    }
    versions
}
