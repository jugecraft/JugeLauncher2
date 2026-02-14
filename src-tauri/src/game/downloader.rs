use std::path::Path;
use std::fs::{self, File};
use std::io::{self, Write};
use sha2::{Sha256, Digest};
use reqwest::Client;
use tokio::io::AsyncWriteExt;

pub async fn download_file(client: &Client, url: &str, path: &Path, expected_sha256: Option<&str>, app_handle: &tauri::AppHandle) -> Result<(), String> {
    use tauri::Emitter;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // Check match... (simplified for brevity, keeping logic)
    if path.exists() {
        if let Some(hash) = expected_sha256 {
            if let Ok(existing_hash) = compute_sha256(path) {
                if existing_hash == hash { return Ok(()); }
            }
        }
    }

    let mut res = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("Failed to download {}: {}", url, res.status()));
    }
    
    let total_size = res.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;

    let mut file = tokio::fs::File::create(path).await.map_err(|e| e.to_string())?;
    
    while let Some(chunk) = res.chunk().await.map_err(|e| e.to_string())? {
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;
        
        // Emit progress
        if total_size > 0 {
             let _ = app_handle.emit("download_progress", serde_json::json!({
                 "file": path.file_name().unwrap_or_default().to_string_lossy(),
                 "total": total_size,
                 "downloaded": downloaded,
                 "percent": (downloaded as f64 / total_size as f64) * 100.0
             }));
        }
    }

    // Verify hash ...
    if let Some(hash) = expected_sha256 {
        let actual_hash = compute_sha256(path)?; 
        if actual_hash != *hash { 
             return Err(format!("Hash mismatch for {}: expected {}, got {}", url, hash, actual_hash));
        }
    }

    Ok(())
}

fn compute_sha256(path: &Path) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    io::copy(&mut file, &mut hasher).map_err(|e| e.to_string())?;
    let hash = hasher.finalize();
    Ok(hex::encode(hash))
}
