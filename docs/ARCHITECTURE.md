# System Architecture

JugeLauncher uses a hybrid architecture leveraging **Tauri** to bridge a high-performance **Rust** backend with a modern **React** frontend.

## Diagram

```mermaid
graph TD
    UI[React Frontend] <-->|Tauri IPC| Core[Rust Core]
    Core --> Auth[Authentication Module]
    Core --> Game[Game Engine]
    Core --> Profiles[Profile Manager]
    Core --> Mods[Mod Manager]
    Core --> API[Local API Server]
    
    Game --> Downloader
    Game --> JVM[Java Runtime]
    
    API --> Client[JugeClient (Minecraft)]
```

## Modules

### Core (`src-tauri/src/lib.rs`)
Central command dispatcher and state manager.

### Profile Manager (`src-tauri/src/profiles`)
Handles CRUD operations for user profiles, storing them in `profiles.json`.

### Game Engine (`src-tauri/src/game`)
Parses manifests, verifies assets (SHA256), and constructs the complex Java command line arguments required to launch Minecraft.

### Mod Manager (`src-tauri/src/mods`)
Scans the filesystem for `.jar` files and toggles them by renaming to `.disabled`.

### Local API (`src-tauri/src/api`)
A Warp-based HTTP server running on `localhost` to provide real-time data to the running game client.
