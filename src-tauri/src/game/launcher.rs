use crate::auth::Account;
use crate::game::Manifest;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::Emitter;

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
    options: &LaunchOptions,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let version_dir = base_dir.join("versions").join(&manifest.id);
    let lib_dir = base_dir.join("libraries");
    let native_dir = version_dir.join("natives");

    println!("DEBUG: Launching {} from {:?}", manifest.id, base_dir);
    println!("DEBUG: Version dir: {:?}", version_dir);

    // 1. Build Classpath using new library resolution
    let game_manager = crate::game::GameManager::new(base_dir.to_path_buf());
    let lib_paths = game_manager.get_library_paths(manifest);

    let mut classpath = Vec::new();

    // Add main jar (use 'jar' field if specified, otherwise use manifest id)
    let jar_name = manifest.jar.as_ref().unwrap_or(&manifest.id);
    let main_jar = base_dir
        .join("versions")
        .join(jar_name)
        .join(format!("{}.jar", jar_name));
    classpath.push(main_jar);

    // Add all libraries
    for lib_path in lib_paths {
        if lib_path.exists() {
            classpath.push(lib_path);
        } else {
            println!("WARN: Library not found: {:?}", lib_path);
        }
    }

    let cp_sep = if cfg!(target_os = "windows") {
        ";"
    } else {
        ":"
    };
    let cp_str = classpath
        .iter()
        .map(|p| p.to_string_lossy())
        .collect::<Vec<_>>()
        .join(cp_sep);

    // 2. Resolve Java Path
    let java = PathBuf::from(&options.java_path);

    // Ensure directories exist
    let _ = std::fs::create_dir_all(&version_dir);
    let _ = std::fs::create_dir_all(&lib_dir);
    let _ = std::fs::create_dir_all(&native_dir);

    // 3. Build Arguments
    let mut cmd = Command::new(java);
    cmd.current_dir(base_dir); // Set working directory

    // JVM Args
    cmd.arg(format!("-Xms{}M", options.min_memory));
    cmd.arg(format!("-Xmx{}M", options.max_memory));
    cmd.arg(format!(
        "-Djava.library.path={}",
        native_dir.to_string_lossy()
    ));
    cmd.arg("-cp").arg(cp_str);

    // Add custom JVM args from manifest if available
    if let Some(arguments) = &manifest.arguments {
        if let Some(jvm_args) = &arguments.jvm {
            for arg in jvm_args {
                match arg {
                    crate::game::ArgumentValue::String(s) => {
                        cmd.arg(s);
                    }
                    _ => {
                        // Skip complex conditional arguments
                    }
                }
            }
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
            .replace(
                "${assets_root}",
                base_dir.join("assets").to_string_lossy().as_ref(),
            )
            .replace(
                "${game_assets}",
                base_dir.join("assets").to_string_lossy().as_ref(),
            )
            .replace(
                "${assets_index_name}",
                manifest.assets.as_deref().unwrap_or("legacy"),
            )
            .replace("${auth_uuid}", &account.uuid)
            .replace(
                "${auth_access_token}",
                account.access_token.as_deref().unwrap_or("0"),
            )
            .replace(
                "${user_type}",
                if account.account_type == crate::auth::AccountType::Microsoft {
                    "msa"
                } else {
                    "mojang"
                },
            )
            .replace("${user_properties}", "{}")
            .replace("${version_type}", "release")
    };

    // Build game arguments
    // Try minecraft_arguments first (old format like Forge 1.8.9)
    if let Some(mc_args) = &manifest.minecraft_arguments {
        // Old format: space-separated string
        for arg in mc_args.split_whitespace() {
            cmd.arg(replace_args(arg));
        }
    } else if let Some(arguments) = &manifest.arguments {
        // New format: array of strings/objects
        if let Some(game_args) = &arguments.game {
            for arg in game_args {
                match arg {
                    crate::game::ArgumentValue::String(s) => {
                        cmd.arg(replace_args(s));
                    }
                    _ => {
                        // Skip complex conditional arguments for now
                    }
                }
            }
        }
    } else {
        // Fallback: add standard args manually
        cmd.arg("--username").arg(&account.name);
        cmd.arg("--version").arg(&manifest.id);
        cmd.arg("--gameDir").arg(base_dir);
        cmd.arg("--assetsDir").arg(base_dir.join("assets"));
        cmd.arg("--assetIndex")
            .arg(manifest.assets.as_deref().unwrap_or("legacy"));
        cmd.arg("--uuid").arg(&account.uuid);
        cmd.arg("--accessToken")
            .arg(account.access_token.as_deref().unwrap_or("0"));
        cmd.arg("--userType").arg(
            if account.account_type == crate::auth::AccountType::Microsoft {
                "msa"
            } else {
                "mojang"
            },
        );
    }

    cmd.arg("--width").arg(options.width.to_string());
    cmd.arg("--height").arg(options.height.to_string());

    println!(
        "DEBUG: Command arguments: {:?}",
        cmd.get_args().collect::<Vec<_>>()
    );

    // Spawn
    let mut child = cmd
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            println!("DEBUG: Failed to spawn Java: {}", e);
            format!("Failed to spawn Java: {}", e)
        })?;

    println!("DEBUG: Process spawned with PID: {:?}", child.id());

    // Stream logs
    let stdout = child.stdout.take().unwrap();
    let stderr = child.stderr.take().unwrap();

    let app_clone = app.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(l) = line {
                let _ = app_clone.emit("game_log", l);
            }
        }
    });

    let app_clone = app.clone();
    std::thread::spawn(move || {
        let reader = BufReader::new(stderr);
        for line in reader.lines() {
            if let Ok(l) = line {
                let _ = app_clone.emit("game_log", format!("[ERROR] {}", l));
            }
        }
    });

    Ok(())
}
