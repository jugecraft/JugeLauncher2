pub mod auth;
pub mod game;
pub mod profiles;
pub mod mods;
pub mod java;
pub mod api;
pub mod settings;

use auth::{Account, microsoft};
use profiles::{Profile, ProfileManager};
use mods::{Mod, ModManager};
use java::{JavaRuntime, JavaManager};
use api::AppState;
use settings::{Settings, SettingsManager};
use std::sync::{Arc, Mutex};
use tauri::Manager;

#[tauri::command]
async fn start_ms_auth() -> Result<microsoft::DeviceCodeResponse, microsoft::AuthError> {
    let client = reqwest::Client::new();
    microsoft::start_device_flow(&client).await
}

#[tauri::command]
async fn complete_ms_auth(device_code: String) -> Result<microsoft::MicrosoftAccount, microsoft::AuthError> {
    let client = reqwest::Client::new();
    
    // Attempt to get token
    let token_res = microsoft::poll_for_token(&client, &device_code).await?;
    
    // Execute full login chain
    microsoft::full_login_chain(&client, token_res).await
}

#[tauri::command]
async fn refresh_ms_token(refresh_token: String) -> Result<microsoft::MicrosoftAccount, microsoft::AuthError> {
    let client = reqwest::Client::new();
    let token_res = microsoft::refresh_microsoft_token(&client, &refresh_token).await?;
    microsoft::full_login_chain(&client, token_res).await
}

#[tauri::command]
async fn install_game(manifest_url: String, app_handle: tauri::AppHandle) -> Result<String, String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    
    // Load settings to get preferred Minecraft dir
    let settings_mgr = crate::settings::SettingsManager::new(app_dir.clone());
    let settings = settings_mgr.load();
    let mc_dir = match settings.minecraft_dir {
        Some(dir) => std::path::PathBuf::from(dir),
        None => game::scanner::find_minecraft_dir(),
    };

    let game_mgr = crate::game::GameManager::new(mc_dir);
    
    // TEMPORARILY DISABLED - install_version uses old manifest format
    return Err("Game installation is temporarily disabled. Please use the official Minecraft launcher to install versions.".to_string());
    // let manifest = game_mgr.install_version(&manifest_url, &app_handle).await?;
    // Ok(format!("Installed {}", manifest.id))
}

#[tauri::command]
async fn launch_game_cmd(manifest_id: String, account: Account, app_handle: tauri::AppHandle, state: tauri::State<'_, AppState>) -> Result<(), String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    
    // Load settings
    let settings_mgr = crate::settings::SettingsManager::new(app_dir.clone());
    let settings = settings_mgr.load();
    let mc_dir = match settings.minecraft_dir {
        Some(dir) => std::path::PathBuf::from(dir),
        None => game::scanner::find_minecraft_dir(),
    };

    // Load manifest
    println!("DEBUG: Loading manifest for {}", manifest_id);
    let mut game_manager = game::GameManager::new(mc_dir.clone());
    let manifest = game_manager.load_manifest(&manifest_id).await.map_err(|e| e.to_string())?;
    println!("DEBUG: Manifest loaded successfully for {}", manifest_id);

    // We assume the manifest_id passed IS the version_id from the profile
    // Ideally we should lookup the profile by ID if passed, but for now we look up the profile that matches this version 
    // or just use default options if not found.
    // Real implementation: launch_game_cmd(profile_id, account)
    
    // Let's try to find if a profile exists for this version to apply overrides
    let profile_manager = ProfileManager::new(app_dir.clone());
    let profiles = profile_manager.list_profiles();
    let profile = profiles.into_iter().find(|p| p.version_id == manifest_id);

    // Load settings
    let settings_mgr = crate::settings::SettingsManager::new(app_dir.clone());
    let settings = settings_mgr.load();

    let (min_mem, max_mem, width, height, _java_args, java_path) = if let Some(p) = &profile {
        (p.min_memory, p.max_memory, p.width, p.height, p.java_args.clone(), p.java_path.clone())
    } else {
        (settings.min_memory, settings.max_memory, settings.width, settings.height, "-XX:+UseG1GC".to_string(), settings.java_path)
    };

    // Determine required Java version and ensure it's available
    let java_manager = crate::java::JavaManager::new(app_dir.clone());
    let required_java_version = crate::java::JavaManager::determine_required_java_version(&manifest_id);
    
    println!("DEBUG: Minecraft {} requires Java {}", manifest_id, required_java_version);
    
    let java_path_final = if let Some(custom_path) = java_path {
        // User has specified a custom Java path, use it
        println!("DEBUG: Using custom Java path: {}", custom_path);
        custom_path
    } else {
        // Auto-detect or download required Java
        println!("DEBUG: Auto-detecting/downloading Java {}...", required_java_version);
        java_manager.ensure_java(required_java_version, app_handle.clone())
            .await
            .map_err(|e| format!("Failed to ensure Java {}: {}", required_java_version, e))?
    };

    let options = crate::game::launcher::LaunchOptions {
        min_memory: min_mem,
        max_memory: max_mem,
        width,
        height,
        java_path: java_path_final,
    };
    
    // Use mc_dir for mods as well if possible
    if let Some(p) = &profile {
        let mut profile_lock = state.current_profile.lock().unwrap();
        *profile_lock = Some(p.clone());
        
        let mod_manager = ModManager::new(app_dir.clone());
        let mods_dir = mc_dir.join("versions").join(&p.version_id).join("mods");
        if let Ok(mods) = mod_manager.scan_mods(&mods_dir) {
             let mut mods_lock = state.active_mods.lock().unwrap();
             *mods_lock = mods.into_iter().filter(|m| m.enabled).collect::<Vec<Mod>>();
        }
    }

    // Extract natives before launch
    // Extract natives before launch
    println!("DEBUG: Extracting natives for {}", manifest_id);
    game_manager.extract_natives(&manifest).map_err(|e| e.to_string())?;
    println!("DEBUG: Natives extracted successfully");

    crate::game::launcher::launch_game(&mc_dir, &manifest, &account, &options, app_handle)?;
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
    let mods_dir = manager.get_mods_dir(&version_id);
    manager.scan_mods(&mods_dir)
}

#[tauri::command]
async fn get_global_mods(app_handle: tauri::AppHandle) -> Result<Vec<Mod>, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let settings_mgr = SettingsManager::new(app_dir.clone());
    let settings = settings_mgr.load();
    
    let mc_dir = match settings.minecraft_dir {
        Some(dir) => std::path::PathBuf::from(dir),
        None => game::scanner::find_minecraft_dir(),
    };
    
    let mods_dir = mc_dir.join("mods");
    let manager = ModManager::new(app_dir);
    manager.scan_mods(&mods_dir)
}

#[tauri::command]
async fn toggle_mod(version_id: String, filename: String, enable: bool, app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let manager = ModManager::new(app_dir);
    let mods_dir = manager.get_mods_dir(&version_id);
    manager.toggle_mod(&mods_dir, &filename, enable)
}

#[tauri::command]
async fn toggle_global_mod(filename: String, enable: bool, app_handle: tauri::AppHandle) -> Result<(), String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let settings_mgr = SettingsManager::new(app_dir.clone());
    let settings = settings_mgr.load();
    
    let mc_dir = match settings.minecraft_dir {
        Some(dir) => std::path::PathBuf::from(dir),
        None => game::scanner::find_minecraft_dir(),
    };
    
    let mods_dir = mc_dir.join("mods");
    let manager = ModManager::new(app_dir);
    manager.toggle_mod(&mods_dir, &filename, enable)
}

#[tauri::command]
async fn get_java_runtimes(app_handle: tauri::AppHandle) -> Result<Vec<JavaRuntime>, String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let manager = JavaManager::new(app_dir);
    Ok(manager.detect_system_java())
}

#[tauri::command]
async fn install_java_cmd(major_version: u32, app_handle: tauri::AppHandle) -> Result<String, String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let manager = crate::java::JavaManager::new(app_dir);
    manager.ensure_java(major_version, app_handle).await
}

#[tauri::command]
async fn get_settings(app_handle: tauri::AppHandle) -> Result<Settings, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let manager = SettingsManager::new(app_dir);
    Ok(manager.load())
}

#[tauri::command]
async fn save_settings(settings: Settings, app_handle: tauri::AppHandle) -> Result<(), String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let manager = SettingsManager::new(app_dir);
    manager.save(&settings)
}

#[tauri::command]
async fn get_local_versions(app_handle: tauri::AppHandle) -> Result<Vec<game::scanner::LocalVersion>, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    let settings_mgr = SettingsManager::new(app_dir.clone());
    let settings = settings_mgr.load();
    
    let mc_dir = match settings.minecraft_dir {
        Some(dir) => std::path::PathBuf::from(dir),
        None => game::scanner::find_minecraft_dir(),
    };
    
    Ok(game::scanner::scan_versions(&mc_dir))
}

#[tauri::command]
fn login_offline(username: String) -> Account {
    auth::offline::login(&username)
}

#[tauri::command]
async fn upload_skin_cmd(token: String, file_path: String, variant: String) -> Result<(), String> {
    crate::auth::microsoft::upload_skin(&token, &file_path, &variant).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn set_offline_skin_cmd(file_path: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    crate::game::skins::set_offline_skin(&app_dir, &file_path)
}

#[tauri::command]
async fn set_offline_cape_cmd(file_path: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri::Manager;
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    crate::game::skins::set_offline_cape(&app_dir, &file_path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize Logger
    if let Some(app_data) = directories::ProjectDirs::from("com", "jugelauncher", "app") {
        let log_path = app_data.data_dir().join("logs").join("launcher.log");
        if let Some(parent) = log_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        
        use simplelog::*;
        let _ = CombinedLogger::init(
            vec![
                TermLogger::new(LevelFilter::Info, Config::default(), TerminalMode::Mixed, ColorChoice::Auto) as Box<dyn SharedLogger>,
                WriteLogger::new(LevelFilter::Info, Config::default(), std::fs::File::create(log_path).unwrap_or_else(|_| std::fs::File::create("launcher.log").unwrap())) as Box<dyn SharedLogger>,
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
        .plugin(tauri_plugin_dialog::init())
        .manage(app_state) 
        .invoke_handler(tauri::generate_handler![
            start_ms_auth,
            complete_ms_auth,
            login_offline,
            install_game,
            launch_game_cmd,
            refresh_ms_token,
            get_profiles,
            create_profile,
            update_profile,
            delete_profile,
            get_mods,
            toggle_mod,
            get_java_runtimes,
            install_java_cmd,
            get_settings,
            save_settings,
            get_local_versions,
            get_global_mods,
            toggle_global_mod,
            upload_skin_cmd,
            set_offline_skin_cmd,
            set_offline_cape_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
