pub mod auth;
pub mod game;
pub mod profiles;
pub mod mods;
pub mod java;

use auth::{Account, microsoft};
use profiles::{Profile, ProfileManager};
use mods::{Mod, ModManager};
use java::{JavaRuntime, JavaManager};
use api::AppState;
use std::sync::{Arc, Mutex};
use tauri::Manager;

#[tauri::command]
async fn start_ms_auth() -> Result<microsoft::DeviceCodeResponse, String> {
    let client = reqwest::Client::new();
    microsoft::start_device_flow(&client).await
}

#[tauri::command]
async fn complete_ms_auth(device_code: String) -> Result<Account, String> {
    let client = reqwest::Client::new();
    
    // Poll for token
    let token_res = microsoft::poll_for_token(&client, &device_code).await?;
    
    // If we have token, proceed with login chain
    let xbl_token = microsoft::auth_xbl(&client, &token_res.access_token).await
        .map_err(|e| format!("XBL Auth failed: {}", e))?;
        
    let (xsts_token, uhs) = microsoft::auth_xsts(&client, &xbl_token).await
        .map_err(|e| format!("XSTS Auth failed: {}", e))?;
        
    let account = microsoft::auth_minecraft(&client, &xsts_token, &uhs).await
        .map_err(|e| format!("Minecraft Auth failed: {}", e))?;
        
    Ok(account)
}

#[tauri::command]
async fn install_game(manifest_url: String, app_handle: tauri::AppHandle) -> Result<String, String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let game_mgr = crate::game::GameManager::new(app_dir);
    
    let manifest = game_mgr.install_version(&manifest_url).await?;
    Ok(format!("Installed {}", manifest.id))
}

#[tauri::command]
async fn launch_game_cmd(manifest_id: String, account: Account, app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    
    // Load manifest
    let mut game_manager = game::GameManager::new(app_dir.clone());
    let manifest = game_manager.load_manifest(&manifest_id).map_err(|e| e.to_string())?;

    // We assume the manifest_id passed IS the version_id from the profile
    // Ideally we should lookup the profile by ID if passed, but for now we look up the profile that matches this version 
    // or just use default options if not found.
    // Real implementation: launch_game_cmd(profile_id, account)
    
    // Let's try to find if a profile exists for this version to apply overrides
    let profile_manager = ProfileManager::new(app_dir.clone());
    let profiles = profile_manager.list_profiles();
    let profile = profiles.into_iter().find(|p| p.version_id == manifest_id);

    let (min_mem, max_mem, width, height, java_args, java_path) = if let Some(p) = &profile {
        (p.min_memory, p.max_memory, p.width, p.height, p.java_args.clone(), p.java_path.clone())
    } else {
        (1024, 4096, 854, 480, "-XX:+UseG1GC".to_string(), None)
    };

    let options = game::launcher::LaunchOptions {
        min_memory: min_mem,
        max_memory: max_mem,
        width,
        height,
        java_path: java_path.unwrap_or_else(|| "java".to_string()),
    };
    
    // Update API State
    if let Some(p) = &profile {
        let mut profile_lock = state.current_profile.lock().unwrap();
        *profile_lock = Some(p.clone());
        
        let mod_manager = ModManager::new(app_dir.clone());
        if let Ok(mods) = mod_manager.scan_mods(&p.version_id) {
             let mut mods_lock = state.active_mods.lock().unwrap();
             *mods_lock = mods.into_iter().filter(|m| m.enabled).collect();
        }
    }

    crate::game::launcher::launch_game(&app_dir, &manifest, &account, &options)?;
    Ok(())
}

#[tauri::command]
async fn get_profiles(app_handle: tauri::AppHandle) -> Result<Vec<Profile>, String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let manager = ProfileManager::new(app_dir);
    Ok(manager.list_profiles())
}

#[tauri::command]
async fn create_profile(name: String, version_id: String, app_handle: tauri::AppHandle) -> Result<Profile, String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let mut manager = ProfileManager::new(app_dir);
    Ok(manager.create_profile(name, version_id))
}

#[tauri::command]
async fn update_profile(profile: Profile, app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let mut manager = ProfileManager::new(app_dir);
    manager.update_profile(profile)
}

#[tauri::command]
async fn delete_profile(id: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let mut manager = ProfileManager::new(app_dir);
    manager.delete_profile(&id)
}

#[tauri::command]
async fn get_mods(version_id: String, app_handle: tauri::AppHandle) -> Result<Vec<Mod>, String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let manager = ModManager::new(app_dir);
    manager.scan_mods(&version_id)
}

#[tauri::command]
async fn toggle_mod(version_id: String, filename: String, enable: bool, app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let manager = ModManager::new(app_dir);
    manager.toggle_mod(&version_id, &filename, enable)
}

#[tauri::command]
async fn get_java_runtimes(app_handle: tauri::AppHandle) -> Result<Vec<JavaRuntime>, String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let manager = JavaManager::new(app_dir);
    Ok(manager.detect_system_java())
}

#[tauri::command]
fn login_offline(username: String) -> Account {
    auth::offline::login(&username)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize Logger
    if let Ok(app_data) = directories::ProjectDirs::from("com", "jugelauncher", "app") {
        let log_path = app_data.data_dir().join("logs").join("launcher.log");
        if let Some(parent) = log_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        
        use simplelog::*;
        let _ = CombinedLogger::init(
            vec![
                TermLogger::new(LevelFilter::Info, Config::default(), TerminalMode::Mixed, ColorChoice::Auto),
                WriteLogger::new(LevelFilter::Info, Config::default(), std::fs::File::create(log_path).unwrap_or_else(|_| std::fs::File::create("launcher.log").unwrap())),
            ]
        );
    }

    // Initialize shared state
    let app_state = AppState {
        current_profile: Arc::new(Mutex::new(None)),
        active_mods: Arc::new(Mutex::new(Vec::new())),
    };

    let api_state = app_state.clone();
    
    // Spawn API server
    tauri::async_runtime::spawn(async move {
        api::start_server(api_state).await;
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(app_state) 
        .invoke_handler(tauri::generate_handler![
            start_ms_auth,
            complete_ms_auth,
            login_offline,
            install_game,
            launch_game_cmd,
            get_profiles,
            create_profile,
            update_profile,
            delete_profile,
            get_mods,
            toggle_mod,
            get_java_runtimes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
