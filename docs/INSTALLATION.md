# Installation Guide

## System Requirements

- **OS**: Windows 10/11, macOS 12+, or Linux (Ubuntu 20.04+ recommended).
- **RAM**: 4GB minimum.
- **Disk**: 500MB + Game files.

## For Users

1.  Download the latest installer from the [Releases Page](https://github.com/your-org/jugelauncher/releases).
2.  Run the installer (`.exe`, `.dmg`, or `.AppImage`).
3.  Follow the on-screen instructions.

## For Developers

### Prerequisites
- Node.js v18+
- Rust (Stable)
- Tauri CLI (`cargo install tauri-cli`)

### Setup
```bash
git clone https://github.com/your-org/jugelauncher.git
cd jugelauncher
npm install
```

### Dev Mode
```bash
npm run tauri dev
```

### Build
```bash
npm run tauri build
```
