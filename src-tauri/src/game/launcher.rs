use std::process::{Command, Stdio};
use std::path::{Path, PathBuf};
use crate::auth::Account;
use crate::game::Manifest;

pub struct LaunchOptions {
    pub min_memory: u32,
    pub max_memory: u32,
    pub java_path: String, // Changed to String to make it easier
    pub width: u32,
    pub height: u32,
}

pub fn launch_game(
    base_dir: &Path,
    manifest: &Manifest,
    account: &Account,
    options: &LaunchOptions
) -> Result<(), String> {
    let version_dir = base_dir.join("versions").join(&manifest.id);
    let lib_dir = base_dir.join("libraries");
    let native_dir = version_dir.join("natives");
    
    // ... (classpath building same as before) ...
    // 1. Build Classpath
    let mut classpath = Vec::new();
    classpath.push(version_dir.join(format!("{}.jar", manifest.id)));
    for lib_url in &manifest.download_urls.libraries {
        let filename = lib_url.split('/').last().unwrap_or("library.jar");
        classpath.push(lib_dir.join(filename));
    }
    
    let cp_sep = if cfg!(target_os = "windows") { ";" } else { ":" };
    let cp_str = classpath.iter().map(|p| p.to_string_lossy()).collect::<Vec<_>>().join(cp_sep);
    
    // 2. Resolve Java Path
    let java = PathBuf::from(&options.java_path);

    // 3. Build Arguments
    let mut cmd = Command::new(java);
    
    // JVM Args
    cmd.arg(format!("-Xms{}M", options.min_memory));
    cmd.arg(format!("-Xmx{}M", options.max_memory));
    cmd.arg(format!("-Djava.library.path={}", native_dir.to_string_lossy()));
    cmd.arg("-cp").arg(cp_str);
    
    // Add custom JVM args from manifest if needed (simplified)
    for arg in &manifest.arguments.jvm {
        if let Some(s) = arg.as_str() {
            cmd.arg(s);
        }
    }
    
    // Main Class
    cmd.arg(&manifest.main_class);
    
    // Game Args
    // Helper closure to replace placeholders
    let replace_args = |s: &str| -> String {
        s.replace("${auth_player_name}", &account.name)
         .replace("${version_name}", &manifest.id)
         .replace("${game_directory}", base_dir.to_string_lossy().as_ref())
         .replace("${assets_root}", base_dir.join("assets").to_string_lossy().as_ref())
         .replace("${assets_index_name}", &manifest.asset_index.id)
         .replace("${auth_uuid}", &account.uuid)
         .replace("${auth_access_token}", account.access_token.as_deref().unwrap_or("0"))
         .replace("${user_type}", if account.account_type == crate::auth::AccountType::Microsoft { "msa" } else { "mojang" })
    };

    // Add game args from manifest
    for arg in &manifest.arguments.game {
        if let Some(s) = arg.as_str() {
            cmd.arg(replace_args(s));
        }
    }
    
    // Fallback/Standard args if manifest args are empty or complex object format not handled
    if manifest.arguments.game.is_empty() {
        cmd.arg("--username").arg(&account.name);
        cmd.arg("--version").arg(&manifest.id);
        cmd.arg("--gameDir").arg(base_dir);
        cmd.arg("--assetsDir").arg(base_dir.join("assets"));
        cmd.arg("--assetIndex").arg(&manifest.asset_index.id);
        cmd.arg("--uuid").arg(&account.uuid);
        cmd.arg("--accessToken").arg(account.access_token.as_deref().unwrap_or("0"));
        cmd.arg("--userType").arg(if account.account_type == crate::auth::AccountType::Microsoft { "msa" } else { "mojang" });
    }

    cmd.arg("--width").arg(options.width.to_string());
    cmd.arg("--height").arg(options.height.to_string());
    
    // Spawn
    let mut child = cmd.stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn Java: {}", e))?;
        
    // In a real launcher, we stream stdout/stderr to frontend via events.
    // For now, let's just detach or wait.
    
    Ok(())
}
