use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::fs;
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JavaRuntime {
    pub version: String,
    pub path: String,
    pub architecture: String,
}

pub struct JavaManager {
    pub base_dir: PathBuf,
}

impl JavaManager {
    pub fn new(base_dir: PathBuf) -> Self {
        Self { base_dir }
    }

    pub fn get_java_dir(&self) -> PathBuf {
        self.base_dir.join("runtimes").join("java")
    }

    /// Determine required Java version based on Minecraft version
    pub fn determine_required_java_version(minecraft_version: &str) -> u32 {
        // Parse version string (e.g., "1.8.9", "1.16.5", "1.20.1")
        let parts: Vec<&str> = minecraft_version.split('.').collect();
        
        if parts.len() < 2 {
            return 17; // Default to Java 17 for unknown versions
        }

        let major = parts[0].parse::<u32>().unwrap_or(1);
        let minor = parts[1].parse::<u32>().unwrap_or(0);

        // Version mapping
        if major == 1 {
            match minor {
                0..=16 => 8,   // MC 1.0 - 1.16.x requires Java 8
                17..=19 => 17, // MC 1.17 - 1.19.x requires Java 17
                _ => 21,       // MC 1.20+ requires Java 21
            }
        } else {
            21 // Future versions default to Java 21
        }
    }

    pub fn detect_system_java(&self) -> Vec<JavaRuntime> {
        let mut runtimes = Vec::new();
        
        // Check JAVA_HOME
        if let Ok(java_home) = std::env::var("JAVA_HOME") {
            let path = PathBuf::from(java_home).join("bin").join("java.exe");
            if path.exists() {
                 if let Ok(version) = self.get_java_version(&path) {
                     runtimes.push(JavaRuntime {
                         version,
                         path: path.to_string_lossy().to_string(),
                         architecture: "unknown".to_string(),
                     });
                 }
            }
        }
        
        // Check local runtimes
        let local_dir = self.get_java_dir();
        if local_dir.exists() {
             if let Ok(entries) = fs::read_dir(local_dir) {
                 for entry in entries.flatten() {
                      let path = entry.path().join("bin").join("java.exe");
                      if path.exists() {
                          if let Ok(version) = self.get_java_version(&path) {
                             runtimes.push(JavaRuntime {
                                 version,
                                 path: path.to_string_lossy().to_string(),
                                 architecture: "x64".to_string(),
                             });
                          }
                      }
                 }
             }
        }

        runtimes
    }

    fn get_java_version(&self, path: &Path) -> Result<String, String> {
        let output = Command::new(path)
            .arg("-version")
            .output()
            .map_err(|e| e.to_string())?;
            
        let stderr = String::from_utf8_lossy(&output.stderr);
        if let Some(line) = stderr.lines().next() {
            return Ok(line.to_string());
        }
        
        Ok("Unknown".to_string())
    }

    /// Find or download the required Java version
    pub async fn ensure_java(&self, major_version: u32, app: tauri::AppHandle) -> Result<String, String> {
        println!("DEBUG: Ensuring Java {} is available", major_version);
        
        // Check if we already have this version locally
        let local_java = self.find_local_java(major_version);
        if let Some(path) = local_java {
            println!("DEBUG: Found existing Java {}: {}", major_version, path);
            return Ok(path);
        }

        // Download it
        println!("DEBUG: Java {} not found, downloading...", major_version);
        self.download_java_runtime(major_version, app).await
    }

    fn find_local_java(&self, major_version: u32) -> Option<String> {
        let java_dir = self.get_java_dir();
        let version_dir = java_dir.join(format!("jdk-{}", major_version));
        let java_exe = version_dir.join("bin").join("java.exe");
        
        if java_exe.exists() {
            return Some(java_exe.to_string_lossy().to_string());
        }
        
        None
    }

    pub async fn download_java_runtime(&self, major_version: u32, app: tauri::AppHandle) -> Result<String, String> {
        // Adoptium API endpoint
        let url = format!(
            "https://api.adoptium.net/v3/binary/latest/{}/ga/windows/x64/jre/hotspot/normal/eclipse",
            major_version
        );

        println!("DEBUG: Downloading Java {} from Adoptium...", major_version);
        let _ = app.emit("download_progress", serde_json::json!({
            "file": format!("Java {}", major_version),
            "percent": 0
        }));

        // Download the file
        let client = reqwest::Client::new();
        let response = client.get(&url)
            .send()
            .await
            .map_err(|e| format!("Failed to download Java: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to download Java {}: HTTP {}", major_version, response.status()));
        }

        let total_size = response.content_length().unwrap_or(0);
        let bytes = response.bytes().await.map_err(|e| e.to_string())?;

        let _ = app.emit("download_progress", serde_json::json!({
            "file": format!("Java {}", major_version),
            "percent": 100
        }));

        // Save to temp file
        let temp_dir = std::env::temp_dir();
        let zip_path = temp_dir.join(format!("java-{}.zip", major_version));
        fs::write(&zip_path, &bytes).map_err(|e| e.to_string())?;

        println!("DEBUG: Downloaded {} bytes to {:?}", bytes.len(), zip_path);

        // Extract
        let java_dir = self.get_java_dir();
        fs::create_dir_all(&java_dir).map_err(|e| e.to_string())?;

        let extract_dir = java_dir.join(format!("jdk-{}", major_version));
        self.extract_zip(&zip_path, &extract_dir)?;

        // Clean up
        let _ = fs::remove_file(&zip_path);

        // Find the java.exe in the extracted directory
        let java_exe = self.find_java_exe_in_dir(&extract_dir)?;
        
        println!("DEBUG: Java {} installed at: {}", major_version, java_exe);
        Ok(java_exe)
    }

    fn extract_zip(&self, zip_path: &Path, target_dir: &Path) -> Result<(), String> {
        println!("DEBUG: Extracting {:?} to {:?}", zip_path, target_dir);
        
        let file = fs::File::open(zip_path).map_err(|e| e.to_string())?;
        let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
            let outpath = match file.enclosed_name() {
                Some(path) => target_dir.join(path),
                None => continue,
            };

            if file.name().ends_with('/') {
                fs::create_dir_all(&outpath).map_err(|e| e.to_string())?;
            } else {
                if let Some(p) = outpath.parent() {
                    fs::create_dir_all(p).map_err(|e| e.to_string())?;
                }
                let mut outfile = fs::File::create(&outpath).map_err(|e| e.to_string())?;
                std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
            }
        }

        Ok(())
    }

    fn find_java_exe_in_dir(&self, dir: &Path) -> Result<String, String> {
        // The extracted archive might have a nested structure like jdk-8.0.xxx/
        // We need to find bin/java.exe recursively
        for entry in walkdir::WalkDir::new(dir).max_depth(3) {
            if let Ok(entry) = entry {
                let path = entry.path();
                if path.file_name().and_then(|n| n.to_str()) == Some("java.exe") {
                    if path.parent().and_then(|p| p.file_name()).and_then(|n| n.to_str()) == Some("bin") {
                        return Ok(path.to_string_lossy().to_string());
                    }
                }
            }
        }
        
        Err("Could not find java.exe in extracted directory".to_string())
    }
}
