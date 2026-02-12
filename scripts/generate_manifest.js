const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Utility to generate a JugeLauncher manifest.json from a local directory.
 * Usage: node scripts/generate_manifest.js <version_id> <folder_path> <base_url>
 */

function getFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha1');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

function generateManifest(versionId, folderPath, baseUrl) {
    const versionPath = path.resolve(folderPath);
    const clientPath = path.join(versionPath, 'client.jar');

    if (!fs.existsSync(clientPath)) {
        console.error(`Error: client.jar not found in ${versionPath}`);
        return;
    }

    const manifest = {
        id: versionId,
        type: 'release',
        mainClass: 'net.minecraft.client.main.Main',
        minecraftArguments: '--username ${auth_player_name} --version ${version_name} --gameDir ${game_dir} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}',
        libraries: [],
        downloads: {
            client: {
                sha1: getFileHash(clientPath),
                size: fs.statSync(clientPath).size,
                url: `${baseUrl}/client.jar`
            }
        }
    };

    // Scan libraries folder if exists
    const libPath = path.join(versionPath, 'libraries');
    if (fs.existsSync(libPath)) {
        const files = fs.readdirSync(libPath);
        files.forEach(file => {
            if (file.endsWith('.jar')) {
                const fullPath = path.join(libPath, file);
                manifest.libraries.push({
                    name: `local:${file.replace('.jar', '')}:1.0.0`,
                    url: `${baseUrl}/libraries/${file}`,
                    sha1: getFileHash(fullPath),
                    size: fs.statSync(fullPath).size
                });
            }
        });
    }

    console.log(JSON.stringify(manifest, null, 2));
    fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
    console.log('\nSUCCESS: manifest.json generated in current directory.');
}

const args = process.argv.slice(2);
if (args.length < 3) {
    console.log('Usage: node scripts/generate_manifest.js <version_id> <folder_path> <base_url>');
} else {
    generateManifest(args[0], args[1], args[2]);
}
