# Addons & Mods System

## Overview
The Mod Manager allows users to enable or disable mods per version. It does not delete files but renames them, preserving data.

## File Structure
```
JugeLauncher/
  app_data/
    versions/
      {version_id}/
        mods/
          optifine.jar
          sodium.jar.disabled
```

## Logic
- **Enabled**: Ends with `.jar`.
- **Disabled**: Ends with `.jar.disabled`.
- **Toggling**: The backend simply renames the file.
- **Safety**: The Game Engine only adds `.jar` files to the classpath/mod directory argument.

## API Commands
- `get_mods(version_id)`: Returns a list of all files in the mods directory.
- `toggle_mod(version_id, filename, enable)`: Renames the specific file.
