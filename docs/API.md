# JugeClient Communication API

This document describes the protocol for communication between JugeLauncher and the active JugeClient instance.

## Overview

The launcher communicates with the client via:
1.  **Launch Arguments**: Initial configuration passed at startup.
2.  **IPC (WebSocket/HTTP)**: Runtime communication (Planned).

## Launch Arguments

The launcher passes the following arguments to the Minecraft process:

| Argument | Description | Example |
|---|---|---|
| `--accessToken` | valid session token | `eyJ...` |
| `--uuid` | Player UUID | `1234...` |
| `--username` | Player Name | `Steve` |
| `--version` | Version ID | `1.19.4-juge` |
| `--gameDir` | Game Root Directory | `C:/.../.jugelauncher` |
| `--assetsDir` | Assets Directory | `C:/.../assets` |
| `--assetIndex` | Asset Index ID | `1.19` |
| `--width` | Window Width | `854` |
| `--height` | Window Height | `480` |

## Runtime API (Planned)

The launcher will start a local WebSocket server on a random port and pass it via `--ipcPort <port>`.

### Commands (Client -> Launcher)

#### `Handshake`
Authenticate the client connection.
```json
{ "op": "handshake", "version": "1.0" }
```

#### `UpdateStatus`
Client updates its status (e.g., "In Menu", "In Game").
```json
{ "op": "status", "state": "idle" }
```

### Commands (Launcher -> Client)

#### `ReloadSettings`
Instruct client to reload configuration.
```json
{ "op": "reload_settings" }
```

#### `EnableModule`
Enable a specific mod/module.
```json
{ "op": "module", "id": "fps_boost", "enabled": true }
```
