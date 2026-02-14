use std::fs;
use std::path::PathBuf;

// Simple implementation to copy a skin file to a local "skins" directory.
// This allows the Launcher to show the skin for "Offline" accounts locally.
// For in-game visibility, this file would need to be loaded by a mod (like SkinRestorer).

pub fn set_offline_skin(app_dir: &PathBuf, skin_path: &str) -> Result<(), String> {
    let skins_dir = app_dir.join("skins");
    if !skins_dir.exists() {
        fs::create_dir_all(&skins_dir).map_err(|e| e.to_string())?;
    }

    // We iterate over extensions or just assume png.
    // We save it as "offline_skin.png" for simplicity in this MVP.
    let target = skins_dir.join("offline_skin.png");

    fs::copy(skin_path, target).map_err(|e| e.to_string())?;

    Ok(())
}

pub fn set_offline_cape(app_dir: &PathBuf, cape_path: &str) -> Result<(), String> {
    let skins_dir = app_dir.join("skins");
    if !skins_dir.exists() {
        fs::create_dir_all(&skins_dir).map_err(|e| e.to_string())?;
    }
    let target = skins_dir.join("offline_cape.png");
    fs::copy(cape_path, target).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_offline_skin_path(app_dir: &PathBuf) -> Option<PathBuf> {
    let path = app_dir.join("skins").join("offline_skin.png");
    if path.exists() {
        Some(path)
    } else {
        None
    }
}
