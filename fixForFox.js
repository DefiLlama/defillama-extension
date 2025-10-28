import fs from 'fs'
import cp from 'child_process'

// firefox does not support "service_worker" in manifest.json, so we need to replace it with "background.scripts"

const manifest = JSON.parse(fs.readFileSync('./dist/manifest.json'))

manifest.background.scripts = [manifest.background.service_worker]
manifest.browser_specific_settings = {
	gecko: {
		id: 'addon-defillama@llama.fi',
		strict_min_version: '111.0'
	},
	gecko_android: {
		id: 'addon-defillama-android@llama.fi',
		strict_min_version: '111.0'
	}
}
delete manifest.background.service_worker

fs.writeFileSync('./dist/manifest.json', JSON.stringify(manifest, null, 2))
cp.execSync('rm -rf web-ext-artifacts')
cp.execSync('npx web-ext build --source-dir dist --overwrite-dest')
