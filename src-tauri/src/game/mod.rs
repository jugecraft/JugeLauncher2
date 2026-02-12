pub mod manifest;
pub mod downloader;

pub use manifest::Manifest;

use std::path::PathBuf;

pub struct GameManager {
    pub base_dir: PathBuf,
}

impl GameManager {
    pub fn new(base_dir: PathBuf) -> Self {
        Self { base_dir }
    }
    
    pub async fn install_version(&self, manifest_url: &str) -> Result<Manifest, String> {
        let client = reqwest::Client::new();
        
        // 1. Fetch Manifest
        let res = client.get(manifest_url).send().await.map_err(|e| e.to_string())?;
        let manifest: Manifest = res.json().await.map_err(|e| e.to_string())?;
        
        let version_dir = self.base_dir.join("versions").join(&manifest.id);
        let lib_dir = self.base_dir.join("libraries");
        
        // 2. Download Minecraft Client
        let client_jar = version_dir.join(format!("{}.jar", manifest.id));
        downloader::download_file(&client, &manifest.download_urls.minecraft, &client_jar, Some(&manifest.sha256)).await?;
        
        // 3. Download Libraries (Parallelize ideally, but sequential for now)
        for lib_url in &manifest.download_urls.libraries {
            // Simple filename extraction
            let filename = lib_url.split('/').last().unwrap_or("library.jar");
            let lib_path = lib_dir.join(filename); // In reality, should follow maven path structure
            downloader::download_file(&client, lib_url, &lib_path, None).await?;
        }
        
        // 4. Download Forge if needed
        if let Some(forge_url) = &manifest.download_urls.forge {
            let forge_installer = version_dir.join("forge-installer.jar");
            downloader::download_file(&client, forge_url, &forge_installer, None).await?;
            
            // TODO: Run Forge Installer
            // logic::run_forge_installer(&forge_installer, &self.base_dir);
        }
        
        // 5. Save Manifest
        let manifest_path = version_dir.join("manifest.json");
        let manifest_json = serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?;
        tokio::fs::write(manifest_path, manifest_json).await.map_err(|e| e.to_string())?;
        
        Ok(manifest)
    }

    pub async fn load_manifest(&self, id: &str) -> Result<Manifest, String> {
        let path = self.base_dir.join("versions").join(id).join("manifest.json");
        let content = tokio::fs::read_to_string(path).await.map_err(|e| e.to_string())?;
        let manifest: Manifest = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(manifest)
    }
}
