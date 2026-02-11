use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::fs;

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

    pub fn detect_system_java(&self) -> Vec<JavaRuntime> {
        let mut runtimes = Vec::new();
        
        // Simple check for JAVA_HOME
        if let Ok(java_home) = std::env::var("JAVA_HOME") {
            let path = PathBuf::from(java_home).join("bin").join("java.exe"); // Windows assumption for now
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
        // Parse "version 17.0.1" or "openjdk version 17.0.1"
        // This is a naive parser
        if let Some(line) = stderr.lines().next() {
            return Ok(line.to_string());
        }
        
        Ok("Unknown".to_string())
    }

    pub async fn install_java(&self, major_version: u32) -> Result<String, String> {
        // In a real app, this would query Adoptium API
        // For this demo, we will simulate a download or return a placeholder
        // TODO: Implement actual download logic
        
        Err(format!("Auto-download for Java {} not yet configured in this demo. Please install Java manually.", major_version))
    }
}
