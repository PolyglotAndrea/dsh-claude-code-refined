"""Build a distributable plugin and macOS installer ZIP from this checkout."""

from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import tarfile
import zipfile

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'package.json').read_text())
name, version = manifest['name'], manifest['version']
release = root / 'dist' / f'Claude-Code-Refined-{version}'
release.mkdir(parents=True, exist_ok=True)
package = release / f'{name}-{version}.tgz'
installer = (root / 'scripts/install.command').read_text()
assert package.name in installer, 'Update the installer package version first'

# npm's prepack hook builds the current source before creating the tarball.
subprocess.run(['npm', 'pack', '--pack-destination', str(release)], cwd=root, check=True)
with tarfile.open(package) as archive:
    assert json.load(archive.extractfile('package/package.json'))['version'] == version
    assert archive.extractfile('package/lib/client.js').read() == (root / 'lib/client.js').read_bytes()
    assert all('.debug' not in entry.name and 'node_modules' not in entry.name
               for entry in archive.getmembers())

files = [package]
for source, destination in [
    ('scripts/install.command', '安装.command'),
    ('scripts/uninstall.command', '恢复原主题.command'),
    ('README.md', '使用说明.md'),
    ('LICENSE', 'LICENSE'),
]:
    output = release / destination
    shutil.copyfile(root / source, output)
    output.chmod(0o755 if output.suffix == '.command' else 0o644)
    files.append(output)

# Include recorded verification evidence, never manufacture a fresh test result.
evidence = root / 'docs' / f'verification-{version}.json'
if evidence.exists():
    output = release / '验证结果.json'
    shutil.copyfile(evidence, output)
    files.append(output)

checksum = release / 'SHA256SUMS.txt'
checksum.write_text(f'{hashlib.sha256(package.read_bytes()).hexdigest()}  {package.name}\n')
files.append(checksum)
output = root / 'dist' / f'Claude-Code-Refined-{version}.zip'
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(files):
        archive.write(file, file.relative_to(release.parent))
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    for entry in archive.infolist():
        if entry.filename.endswith('.command'):
            assert (entry.external_attr >> 16) & 0o111
print(f'Created {output} ({output.stat().st_size:,} bytes)')
