use serde::Deserialize;
use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::path::Path;
use zip::ZipArchive;

#[derive(Debug, Clone)]
pub struct ModMetadata {
    pub name: Option<String>,
    pub version: Option<String>,
    pub game_version: Option<String>,
    pub description: Option<String>,
    pub authors: Option<Vec<String>>,
}

impl Default for ModMetadata {
    fn default() -> Self {
        Self {
            name: None,
            version: None,
            game_version: None,
            description: None,
            authors: None,
        }
    }
}

// Fabric JSON struct
#[derive(Deserialize)]
struct FabricModJson {
    name: Option<String>,
    version: Option<String>,
    description: Option<String>,
    authors: Option<Vec<String>>,
    depends: Option<HashMap<String, String>>,
}

// Forge TOML struct (1.13+)
#[derive(Deserialize)]
struct ModsToml {
    mods: Option<Vec<ModsTomlEntry>>,
    // Dependencies are handled differently in TOML, simplistic check for now
}

#[derive(Deserialize)]
struct ModsTomlEntry {
    displayName: Option<String>,
    version: Option<String>,
    description: Option<String>,
    authors: Option<String>,
}

// Forge/Legacy mcmod.info struct (1.12-)
#[derive(Deserialize)]
struct McModInfoEntry {
    name: Option<String>,
    version: Option<String>,
    mcversion: Option<String>,
    description: Option<String>,
    authorList: Option<Vec<String>>,
}

pub fn read_metadata(path: &Path) -> ModMetadata {
    let file = match File::open(path) {
        Ok(f) => f,
        Err(_) => return ModMetadata::default(),
    };

    let mut archive = match ZipArchive::new(file) {
        Ok(a) => a,
        Err(_) => return ModMetadata::default(),
    };

    // Try Fabric
    if let Ok(mut file) = archive.by_name("fabric.mod.json") {
        let mut content = String::new();
        if file.read_to_string(&mut content).is_ok() {
            if let Ok(json) = serde_json::from_str::<FabricModJson>(&content) {
                let game_version = json
                    .depends
                    .as_ref()
                    .and_then(|d| d.get("minecraft").cloned());

                return ModMetadata {
                    name: json.name,
                    version: json.version,
                    game_version,
                    description: json.description,
                    authors: json.authors,
                };
            }
        }
    }

    // Try newer Forge (mods.toml)
    if let Ok(mut file) = archive.by_name("META-INF/mods.toml") {
        let mut content = String::new();
        if file.read_to_string(&mut content).is_ok() {
            if let Ok(toml) = toml::from_str::<ModsToml>(&content) {
                if let Some(mods) = toml.mods {
                    if let Some(first) = mods.first() {
                        return ModMetadata {
                            name: first.displayName.clone(),
                            version: first.version.clone(),
                            game_version: None, // Harder to get from TOML without deep parsing dependencies
                            description: first.description.clone(),
                            authors: first.authors.clone().map(|s| vec![s]),
                        };
                    }
                }
            }
        }
    }

    // Try legacy Forge (mcmod.info)
    if let Ok(mut file) = archive.by_name("mcmod.info") {
        let mut content = String::new();
        if file.read_to_string(&mut content).is_ok() {
            // mcmod.info can be a list or object. Usually list.
            if let Ok(list) = serde_json::from_str::<Vec<McModInfoEntry>>(&content) {
                if let Some(first) = list.first() {
                    return ModMetadata {
                        name: first.name.clone(),
                        version: first.version.clone(),
                        game_version: first.mcversion.clone(),
                        description: first.description.clone(),
                        authors: first.authorList.clone(),
                    };
                }
            }
            // Also try object if list fails? Some old mods have weird JSON.
        }
    }

    ModMetadata::default()
}
