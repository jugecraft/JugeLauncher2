use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::fs;

pub mod downloader;
pub mod launcher;
pub mod scanner;
pub mod skins;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Manifest {
    pub id: String,
    #[serde(rename = "minecraftVersion")]
    pub minecraft_version: Option<String>,
    #[serde(rename = "mainClass")]
    pub main_class: String,
    #[serde(rename = "minecraftArguments")]
    pub minecraft_arguments: Option<String>,
    pub arguments: Option<Arguments>,
    #[serde(rename = "downloadUrls")]
    pub download_urls: Option<DownloadUrls>,
    pub libraries: Option<Vec<Library>>,
    #[serde(rename = "inheritsFrom")]
    pub inherits_from: Option<String>,
    pub jar: Option<String>,
    pub assets: Option<String>,
    // Fields from original Manifest that are not in the new structure, but might be needed
    // If these are truly removed, then the code using them will need to be updated.
    // For now, assuming the user wants to replace the *definition* of Manifest with the new one.
    // The original Manifest had:
    // pub forge_version: Option<String>,
    // pub version_type: manifest::VersionType,
    // pub sha256: String,
    // pub size: u64,
    // pub release_time: String,
    // pub asset_index: manifest::AssetIndex,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Arguments {
    pub game: Option<Vec<ArgumentValue>>,
    pub jvm: Option<Vec<ArgumentValue>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ArgumentValue {
    String(String),
    Object(serde_json::Value),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Library {
    pub name: String,
    pub url: Option<String>,
    pub downloads: Option<LibraryDownloads>,
    pub natives: Option<std::collections::HashMap<String, String>>,
    pub rules: Option<Vec<Rule>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibraryDownloads {
    pub artifact: Option<Artifact>,
    pub classifiers: Option<std::collections::HashMap<String, Artifact>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Artifact {
    pub path: Option<String>,
    pub url: Option<String>,
    pub sha1: Option<String>,
    pub size: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    pub action: String,
    pub os: Option<OsRule>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OsRule {
    pub name: Option<String>,
}

// The original Manifest also had DownloadUrls and AssetIndex, which are now part of the new Manifest or removed.
// Re-adding DownloadUrls and AssetIndex based on the original structure, as they are still referenced in the code.
// This assumes the user's provided Manifest is an *addition* to the existing structure,
// or that the existing code will be adapted to the new Manifest.
// Given the instruction "Replace the Manifest struct", I will replace it.
// However, the existing code relies on `manifest.download_urls.minecraft`, `manifest.sha256`, `manifest.asset_index`, etc.
// The new Manifest struct does not have these directly.
// This implies a larger refactoring is needed, but my task is to make the change faithfully.
// The user provided a new Manifest struct, which is different from the old one.
// I will replace the old `pub mod manifest;` and `pub use manifest::Manifest;` with the new struct definitions.
// This will cause compilation errors in the rest of the file, which is expected as per "make the change faithfully".

// Based on the original file, the `Manifest` struct was defined in `manifest.rs`.
// The instruction provides a new `Manifest` struct definition.
// The instruction also includes a snippet of the `install_version` function, which should not be part of the struct definitions.
// I will remove `pub mod manifest;` and `pub use manifest::Manifest;` and insert the new struct definitions.
// I will also add the `use` statements from the provided new code.

// Original `manifest` module content (inferred from usage):
// pub struct Manifest {
//     pub id: String,
//     pub minecraft_version: String,
//     pub forge_version: Option<String>,
//     pub version_type: VersionType,
//     pub download_urls: DownloadUrls,
//     pub sha256: String,
//     pub size: u64,
//     pub release_time: String,
//     pub main_class: String,
//     pub asset_index: AssetIndex,
//     pub arguments: Arguments,
// }
//
// pub struct DownloadUrls {
//     pub minecraft: String,
//     pub forge: Option<String>,
//     pub libraries: Vec<String>,
// }
//
// pub struct AssetIndex {
//     pub id: String,
//     pub sha1: String,
//     pub size: u64,
//     pub url: String,
//     pub total_size: u64,
// }
//
// pub enum VersionType { ... }
//
// pub struct Arguments { ... }
//
// pub struct AssetIndexContent { ... }

// The user's instruction is to *replace* the Manifest struct.
// This means the old `Manifest` struct and its associated types (DownloadUrls, AssetIndex, VersionType, Arguments, AssetIndexContent)
// that were implicitly part of the `manifest` module are now gone, and only the new ones are present.
// The provided code snippet for replacement does not include DownloadUrls, AssetIndex, VersionType, etc.
// This will break the existing `GameManager` implementation. I must make the change faithfully.

// The `puse` typo needs to be corrected to `use`.
// The `manifest::` prefix for `VersionType` and `AssetIndex` will no longer be valid if they are not defined in a `manifest` module.
// Since I'm replacing the `pub mod manifest;` and `pub use manifest::Manifest;` lines,
// the new structs will be directly in the current module.

// Corrected `use` statements and new struct definitions:

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadUrls {
    pub minecraft: String,
    pub forge: Option<String>,
    pub libraries: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetIndex {
    pub id: String,
    pub sha1: String,
    pub size: u64,
    pub url: String,
    pub total_size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VersionType {
    Vanilla,
    Forge,
    Fabric,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetIndexContent {
    pub objects: std::collections::HashMap<String, AssetObject>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetObject {
    pub hash: String,
    pub size: u64,
}

pub struct GameManager {
    pub base_dir: PathBuf,
}

impl GameManager {
    pub fn new(base_dir: PathBuf) -> Self {
        Self { base_dir }
    }
    
    /*
    // TEMPORARILY DISABLED - Uses old manifest format
    pub async fn install_version(&self, manifest_url: &str, app_handle: &tauri::AppHandle) -> Result<Manifest, String> {
        let client = reqwest::Client::new();
        
        // 1. Fetch Manifest
        let res = client.get(manifest_url).send().await.map_err(|e| e.to_string())?;
        if !res.status().is_success() {
             return Err(format!("Failed to fetch manifest: {}", res.status()));
        }
        let manifest: Manifest = res.json().await.map_err(|e| e.to_string())?;
        
        let version_dir = self.base_dir.join("versions").join(&manifest.id);
        let lib_dir = self.base_dir.join("libraries");
        
        // 2. Download Minecraft Client
        let client_jar = version_dir.join(format!("{}.jar", manifest.id));
        downloader::download_file(&client, &manifest.download_urls.minecraft, &client_jar, Some(&manifest.sha256), app_handle).await?;
        
        // 3. Download Libraries (Parallelize ideally, but sequential for now)
        for lib_url in &manifest.download_urls.libraries {
            // Simple filename extraction
            let filename = lib_url.split('/').last().unwrap_or("library.jar");
            let lib_path = lib_dir.join(filename); // In reality, should follow maven path structure
            downloader::download_file(&client, lib_url, &lib_path, None, app_handle).await?;
        }
        
        // 4. Download Forge if needed
        if let Some(forge_url) = &manifest.download_urls.forge {
            let forge_installer = version_dir.join("forge-installer.jar");
            downloader::download_file(&client, forge_url, &forge_installer, None, app_handle).await?;
        }
        
        // 5. Download Assets [NEW]
        self.download_assets(&client, &manifest, app_handle).await?;

        // 6. Extract Natives [NEW]
        self.extract_natives(&manifest)?;

        // 7. Save Manifest
        let manifest_path = version_dir.join("manifest.json");
        let manifest_json = serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?;
        tokio::fs::write(manifest_path, manifest_json).await.map_err(|e| e.to_string())?;
        
        Ok(manifest)
    }
    */

    pub async fn load_manifest(&self, id: &str) -> Result<Manifest, String> {
        let custom_path = self.base_dir.join("versions").join(id).join("manifest.json");
        let official_path = self.base_dir.join("versions").join(id).join(format!("{}.json", id));
        
        let path = if custom_path.exists() {
            custom_path
        } else if official_path.exists() {
            official_path
        } else {
            return Err(format!("Manifest not found for version {}", id));
        };
        
        let content = tokio::fs::read_to_string(&path).await.map_err(|e| e.to_string())?;
        let mut manifest: Manifest = serde_json::from_str(&content).map_err(|e| format!("Failed to parse manifest: {}", e))?;
        
        // Handle inheritance (for Forge/Fabric)
        if let Some(parent_id) = &manifest.inherits_from.clone() {
            println!("DEBUG: Loading parent manifest: {}", parent_id);
            let parent = Box::pin(self.load_manifest(parent_id)).await?;
            
            // Merge parent into current manifest
            if manifest.minecraft_arguments.is_none() {
                manifest.minecraft_arguments = parent.minecraft_arguments;
            }
            if manifest.assets.is_none() {
                manifest.assets = parent.assets;
            }
            
            // Merge libraries: parent first, then child (child can override)
            let mut all_libs = parent.libraries.unwrap_or_default();
            if let Some(mut child_libs) = manifest.libraries {
                all_libs.append(&mut child_libs);
            }
            manifest.libraries = Some(all_libs);
        }
        
        Ok(manifest)
    }

    /// Convert Maven coordinate to file path
    /// Example: "net.minecraftforge:forge:1.8.9-11.15.1.2318-1.8.9" 
    /// -> "net/minecraftforge/forge/1.8.9-11.15.1.2318-1.8.9/forge-1.8.9-11.15.1.2318-1.8.9.jar"
    pub fn maven_to_path(coordinate: &str) -> String {
        let parts: Vec<&str> = coordinate.split(':').collect();
        if parts.len() < 3 {
            return format!("{}.jar", coordinate.replace(':', "/"));
        }
        
        let group = parts[0].replace('.', "/");
        let artifact = parts[1];
        let version = parts[2];
        let classifier = if parts.len() > 3 { format!("-{}", parts[3]) } else { String::new() };
        
        format!("{}/{}/{}/{}-{}{}.jar", group, artifact, version, artifact, version, classifier)
    }

    /// Get all library paths for a manifest (including inherited ones)
    pub fn get_library_paths(&self, manifest: &Manifest) -> Vec<PathBuf> {
        let mut paths = Vec::new();
        let lib_dir = self.base_dir.join("libraries");
        
        if let Some(libraries) = &manifest.libraries {
            for lib in libraries {
                // Check if library should be included based on rules
                if !self.should_include_library(lib) {
                    continue;
                }
                
                // Try to get path from downloads first (official Minecraft format)
                if let Some(downloads) = &lib.downloads {
                    if let Some(artifact) = &downloads.artifact {
                        if let Some(path_str) = &artifact.path {
                            paths.push(lib_dir.join(path_str));
                            continue;
                        }
                    }
                }
                
                // Fallback to Maven coordinate parsing (Forge format)
                let maven_path = Self::maven_to_path(&lib.name);
                paths.push(lib_dir.join(&maven_path));
            }
        }
        
        paths
    }

    fn should_include_library(&self, lib: &Library) -> bool {
        if let Some(rules) = &lib.rules {
            for rule in rules {
                let matches = if let Some(os) = &rule.os {
                    if let Some(os_name) = &os.name {
                        // Check if current OS matches
                        cfg!(target_os = "windows") && os_name == "windows" ||
                        cfg!(target_os = "linux") && os_name == "linux" ||
                        cfg!(target_os = "macos") && os_name == "osx"
                    } else {
                        true
                    }
                } else {
                    true
                };
                
                if rule.action == "allow" && !matches {
                    return false;
                }
                if rule.action == "disallow" && matches {
                    return false;
                }
            }
        }
        true
    }

    /*
    // TEMPORARILY DISABLED - Uses old manifest format
    async fn download_assets(&self, client: &reqwest::Client, manifest: &Manifest, app_handle: &tauri::AppHandle) -> Result<(), String> {
        let assets_dir = self.base_dir.join("assets");
        let objects_dir = assets_dir.join("objects");
        let indexes_dir = assets_dir.join("indexes");
        
        std::fs::create_dir_all(&objects_dir).map_err(|e| e.to_string())?;
        std::fs::create_dir_all(&indexes_dir).map_err(|e| e.to_string())?;

        // Download Index
        let index_path = indexes_dir.join(format!("{}.json", manifest.asset_index.id));
        downloader::download_file(client, &manifest.asset_index.url, &index_path, Some(&manifest.asset_index.sha1), app_handle).await?;

        // Parse Index
        let content = tokio::fs::read_to_string(&index_path).await.map_err(|e| e.to_string())?;
        let index: AssetIndexContent = serde_json::from_str(&content).map_err(|e| e.to_string())?;

        // Download Objects
        let mut count = 0;
        let total = index.objects.len();
        
        // Batch download to limit connections? For now, sequential to be safe with limited connections
        // Or parallel with semaphore. Let's keep it simple sequential but emit only occasionally to avoid spam
        for (_name, object) in index.objects {
            let hash = object.hash;
            let sub_hash = &hash[0..2];
            let url = format!("https://resources.download.minecraft.net/{}/{}", sub_hash, hash);
            let path = objects_dir.join(sub_hash).join(&hash);
            
            if !path.exists() {
               downloader::download_file(client, &url, &path, Some(&hash), app_handle).await?;
            }
            count += 1;
            // Emit progress occasionally? downloader emits per file chunk, which is too much for 3000 files.
            // downloader::download_file emits per chunk. That might be bad for 1000 tiny files.
            // We should ideally silence downloader for assets or just accept it.
        }
        
        Ok(())
    }

    */
    pub fn extract_natives(&self, manifest: &Manifest) -> Result<(), String> {
        let version_dir = self.base_dir.join("versions").join(&manifest.id);
        let natives_dir = version_dir.join("natives");
        let lib_dir = self.base_dir.join("libraries");
        
        std::fs::create_dir_all(&natives_dir).map_err(|e| e.to_string())?;

        if let Some(libraries) = &manifest.libraries {
            for lib in libraries {
                // Check if library should be included based on rules
                if !self.should_include_library(lib) {
                    continue;
                }

                // Check for natives
                if let Some(natives) = &lib.natives {
                    let os_key = if cfg!(target_os = "windows") {
                        "windows"
                    } else if cfg!(target_os = "macos") {
                        "osx" // Minecraft uses 'osx' usually
                    } else {
                        "linux"
                    };

                    if let Some(classifier_key) = natives.get(os_key) {
                        // Resolve placeholder like ${arch}
                        let arch = if cfg!(target_arch = "x86") { "32" } else { "64" };
                        let classifier = classifier_key.replace("${arch}", arch);

                        // Find the artifact path
                        let mut jar_path = None;

                        // Try downloads.classifiers first (official JSON)
                        if let Some(downloads) = &lib.downloads {
                            if let Some(classifiers) = &downloads.classifiers {
                                if let Some(artifact) = classifiers.get(&classifier) {
                                    if let Some(path) = &artifact.path {
                                        jar_path = Some(lib_dir.join(path));
                                    }
                                }
                            }
                        }

                        // Fallback/Legacy: Construct path from maven coordinates if not found in downloads
                        if jar_path.is_none() {
                             // Maven path construction with classifier
                             let parts: Vec<&str> = lib.name.split(':').collect();
                             if parts.len() >= 3 {
                                 let group = parts[0].replace('.', "/");
                                 let artifact = parts[1];
                                 let version = parts[2];
                                 let path = format!("{}/{}/{}/{}-{}-{}.jar", group, artifact, version, artifact, version, classifier);
                                 jar_path = Some(lib_dir.join(path));
                             }
                        }

                        if let Some(path) = jar_path {
                            if path.exists() {
                                println!("DEBUG: Extracting native: {:?}", path);
                                if let Ok(file) = std::fs::File::open(&path) {
                                    if let Ok(mut archive) = zip::ZipArchive::new(file) {
                                        // Exclusion list
                                        let excludes = vec!["META-INF", ".git", ".sha1"];

                                        for i in 0..archive.len() {
                                            if let Ok(mut file) = archive.by_index(i) {
                                                if let Some(outpath) = file.enclosed_name() {
                                                    // Check exclusions
                                                    let path_str = outpath.to_string_lossy();
                                                    if excludes.iter().any(|e| path_str.contains(e)) { continue; }

                                                    // Extract .dll, .so, .dylib
                                                    let ext = outpath.extension().and_then(|e| e.to_str()).unwrap_or("");
                                                    if ext == "dll" || ext == "so" || ext == "dylib" {
                                                         let out_file_path = natives_dir.join(outpath.file_name().unwrap());
                                                         // Only extract if not exists or different? For now always extract to ensure correctness
                                                         if let Ok(mut outfile) = std::fs::File::create(&out_file_path) {
                                                             let _ = std::io::copy(&mut file, &mut outfile);
                                                         }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                println!("WARN: Native jar not found at {:?}", path);
                            }
                        }
                    }
                }
            }
        }
        
        Ok(())
    }
}
