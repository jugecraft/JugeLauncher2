# JugeLauncher v1.0.0

The ultimate, production-ready Minecraft Launcher built with **Tauri (Rust)** and **React**.

## Features

- **🛡️ Secure Authentication**: Microsoft (OAuth2) and Offline support.
- **🚀 Advanced Game Engine**: High-performance, low-latency launching with SHA256 assets verification.
- **📦 Mod Manager**: Enable/Disable mods per version without deleting files. (New in v1.0.0)
- **⚙️ Profile System**: Create unlimited profiles with custom Java args, resolution, and memory settings. (New in v1.0.0)
- **☕ Auto-Java**: Automatically detects and uses the correct Java runtime. (New in v1.0.0)
- **🔄 Auto-Updater**: Seamless background updates. (New in v1.0.0)
- **🔌 Client API**: Local WebSocket/REST API for mod integration. (New in v1.0.0)

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Profile System](docs/PROFILES.md)
- [Addons & Mods](docs/ADDONS_SYSTEM.md)
- [JugeClient API](docs/API_LAUNCHER_CLIENT.md)
- [Release Guide](docs/RELEASE_GUIDE.md)

## Hosting Game Versions on GitHub

You can host your Minecraft versions and modpacks directly on GitHub without a custom server:

1.  **Manifest**: Upload your `manifest.json` to a folder like `/versions/` in your repository.
2.  **URLs**: In the `manifest.json`, use the "Raw" URL for files (e.g., `https://raw.githubusercontent.com/.../file.jar`).
3.  **Large Files**: For files larger than 100MB, use **GitHub Releases** and put the download link in the manifest.

The launcher is pre-configured to look at:
`https://raw.githubusercontent.com/jugecraft/JugeLauncher2/main/versions/manifest.json`

## Development Setup
- **Version Management**: Automated download of Vanilla, Forge, and Libraries using a custom manifest system.
- **Security**: SHA256 integrity checks for all downloads.
- **Performance**: High-performance Rust backend for launching and monitoring the game.

## Prerequisites

- **Node.js**: v16+
- **Rust**: Latest stable (install via [rustup.rs](https://rustup.rs))
- **Visual Studio C++ Build Tools** (Windows only)

## getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your/jugelauncher.git
    cd jugelauncher
    ```

2.  **Install Frontend Dependencies**
    ```bash
    npm install
    ```

3.  **Run in Development Mode**
    ```bash
    npm run tauri dev
    ```

## Building for Production

To create a release build (creates installer/executable):

```bash
npm run tauri build
```

The output will be in `src-tauri/target/release/bundle/`.

## Testing the Launcher

### 1. Verification Server
To test the installation process, start the example manifest server:

```bash
cd examples
python server.py
```
This serves a manifest at `http://localhost:8000/manifest.json`.

2.  **In the Launcher**:
    - Login (use Offline for quick test, or Microsoft).
    - Go to Dashboard.
    - Click "Install / Update".
    - Click "Play".

## Architecture

- **Backend (Rust)**:
    - `auth`: Handles Microsoft/Offline authentication.
    - `game`: Manages downloading, parsing manifests, and launching the JVM.
    - `installer`: (Planned) Logic for running Forge installers.
- **Frontend (React)**:
    - Vite-based build system.
    - Tailored Glassmorphism CSS in `src/index.css`.
    - `tauri-apps/api` for communication.

## Security

- All downloads are verified against SHA256 hashes provided in the manifest.
- Tokens are stored in memory (for this demo) but should be secured using OS keystore in production.
