# Profile System

Profiles allow users to maintain separate configurations for different game versions or mod packs.

## JSON Structure
`profiles.json`:
```json
{
  "uuid-1234": {
    "id": "uuid-1234",
    "name": "Survival 1.19",
    "version_id": "1.19.4-forge",
    "min_memory": 2048,
    "max_memory": 8192,
    "width": 1920,
    "height": 1080,
    "java_path": "C:\\Program Files\\Java\\jdk-17\\bin\\java.exe",
    "java_args": "-XX:+UseG1GC",
    "created_at": 1678886400
  }
}
```

## Logic
When launching:
1.  Frontend sends `launch_game_cmd` with the profile version.
2.  Backend looks up the Profile by version ID (or Profile ID in future refactor).
3.  Backend applies `min_memory`, `max_memory`, and `java_path` overrides to the launch command.
