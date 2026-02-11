# JugeClient Integration API

The launcher runs a local HTTP server to provide context to the running game client.

**Base URL**: `http://127.0.0.1:12345`

## Endpoints

### `GET /info`
Returns launcher metadata.
```json
{
  "name": "JugeLauncher",
  "version": "1.0.0",
  "status": "running"
}
```

### `GET /profile`
Returns the currently active profile used to launch the game.
```json
{
  "id": "...",
  "name": "My Profile",
  "min_memory": 4096,
  ...
}
```

### `GET /mods`
Returns a list of active mods for the current session.
```json
[
  { "name": "Sodium", "filename": "sodium.jar", "enabled": true, "size": 12344 }
]
```

## Implementation Details
The server is started in `src-tauri/src/lib.rs` on a separate asynchronous task. It shares state with the main application via `Arc<Mutex<AppState>>`.
