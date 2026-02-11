# Release Guide

## Versioning
We follow [Semantic Versioning](https://semver.org/).
- **Major (1.0.0)**: Breaking changes.
- **Minor (0.1.0)**: New features.
- **Patch (0.0.1)**: Bug fixes.

## Release Process

1.  **Update Version**:
    Update `package.json` and `src-tauri/tauri.conf.json` to the new version number.

2.  **Commit & Tag**:
    ```bash
    git commit -am "chore: bump version to 1.0.0"
    git tag v1.0.0
    git push origin main --tags
    ```

3.  **CI/CD**:
    GitHub Actions will automatically trigger:
    - Build for Windows, Linux, macOS.
    - Sign artifacts.
    - Create a GitHub Release.
    - Upload `latest.json` for the auto-updater.

4.  **Verification**:
    Download the installer from GitHub Releases and verify functionality.
