use std::path::Path;
use std::fs::{self, File};
use std::io::{self, Write};
use sha2::{Sha256, Digest};
use reqwest::Client;
use tokio::io::AsyncWriteExt;

pub async fn download_file(client: &Client, url: &str, path: &Path, expected_sha256: Option<&str>) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    // Check if file exists and hash matches
    if path.exists() {
        if let Some(hash) = expected_sha256 {
            let existing_hash = compute_sha256(path).map_err(|e| e.to_string())?;
            if existing_hash == hash {
                return Ok(()); // Skip download
            }
        }
    }

    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("Failed to download {}: {}", url, res.status()));
    }

    let mut file = tokio::fs::File::create(path).await.map_err(|e| e.to_string())?;
    
    while let Some(chunk) = res.chunk().await.map_err(|e| e.to_string())? {
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;
    }

    // Verify hash after download
    if let Some(hash) = expected_sha256 {
        let actual_hash = compute_sha256(path)?; // Corrected error handling
        if actual_hash != *hash { // Corrected deref
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
