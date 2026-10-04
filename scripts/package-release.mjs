import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { appendFile, mkdir, mkdtemp, readFile, readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { relative, resolve } from 'node:path';
import yauzl from 'yauzl';
import { exactFile } from './validate-family.mjs';
import { isMain, releaseInfo, root } from './release-info.mjs';

export async function readVsix(path) {
  const zip = await new Promise((accept, reject) => yauzl.open(path, {lazyEntries: true}, (error, archive) => error ? reject(error) : accept(archive)));
  const entries = new Map();
  await new Promise((accept, reject) => {
    zip.on('error', reject);
    zip.on('end', accept);
    zip.on('entry', entry => {
      try {
        assert.ok(!entry.fileName.endsWith('/'), 'VSIX contains file entries only');
        assert.ok(!entries.has(entry.fileName), `duplicate archive entry: ${entry.fileName}`);
        assert.ok(entry.uncompressedSize <= 10 * 1024 * 1024, 'theme package entry is reasonably sized');
      } catch (error) { zip.close(); reject(error); return; }
      zip.openReadStream(entry, (error, stream) => {
        if (error) { reject(error); return; }
        const chunks = [];
        stream.on('error', reject);
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => { entries.set(entry.fileName, Buffer.concat(chunks)); zip.readEntry(); });
      });
    });
    zip.readEntry();
  });
  return entries;
}

export async function expectedContents(manifest) {
  assert.ok(manifest.contributes.themes.some(theme => theme.path === './themes/afterglow-84-midnight-mocha-color-theme.json'), 'Midnight Mocha is registered');
  const paths = new Map([
    ['extension/package.json', 'package.json'], ['extension/readme.md', 'README.md'],
    ['extension/changelog.md', 'CHANGELOG.md'], ['extension/LICENSE.txt', 'LICENSE'],
    ['extension/assets/icon.png', manifest.icon],
    ...manifest.contributes.themes.map(theme => [`extension/${theme.path.replace(/^\.\//, '')}`, theme.path]),
    ...(await readdir(resolve(root, 'assets/screenshots'))).map(name => [`extension/assets/screenshots/${name}`, `assets/screenshots/${name}`])
  ]);
  const expected = new Map();
  for (const [entry, path] of paths) {
    assert.ok(await exactFile(root, path), `exact, safe source path: ${path}`);
    expected.set(entry, await readFile(resolve(root, path)));
  }
  return expected;
}

export function verifyContents(entries, expected, manifest) {
  assert.deepEqual([...entries.keys()].sort(), [...expected.keys(), '[Content_Types].xml', 'extension.vsixmanifest'].sort(), 'exact package contents; no workflows, scripts, dependencies or nested archives');
  for (const [entry, bytes] of expected) assert.ok(entries.get(entry).equals(bytes), `${entry} matches tagged source`);
  const packaged = JSON.parse(entries.get('extension/package.json'));
  assert.deepEqual(packaged, manifest, 'packaged manifest matches source');
  for (const key of ['main', 'browser', 'activationEvents', 'dependencies', 'os', 'cpu', 'telemetry']) assert.ok(!(key in packaged), `declarative universal package: ${key}`);
  assert.deepEqual(Object.keys(packaged.contributes), ['themes'], 'only color themes are contributed');
  for (const contribution of packaged.contributes.themes) {
    const entry = `extension/${contribution.path.replace(/^\.\//, '')}`;
    assert.equal(JSON.parse(entries.get(entry)).name, contribution.label, `registered theme is present: ${contribution.label}`);
  }
  const metadata = entries.get('extension.vsixmanifest').toString('utf8');
  assert.ok(metadata.includes(`Version="${manifest.version}"`), 'VSIX version matches manifest');
  assert.ok(metadata.includes(`Publisher="${manifest.publisher}"`), 'VSIX publisher matches manifest');
  assert.ok(!metadata.includes('TargetPlatform='), 'universal VSIX has no OS/CPU restriction');
  return {files: entries.size, themes: packaged.contributes.themes.length};
}

export async function packageRelease() {
  const info = await releaseInfo();
  const staging = resolve(root, '.release');
  await mkdir(staging, {recursive: true});
  // Every invocation gets a new empty directory. No cleanup can delete user files,
  // and a stale archive from an earlier run can never satisfy this build.
  const output = await mkdtemp(resolve(staging, 'build-'));
  assert.equal((await readdir(output)).length, 0, 'package output starts empty');
  const path = resolve(output, info.filename);
  const command = info.manifest.scripts.package;
  assert.equal(command, 'vsce package --allow-missing-repository --no-rewrite-relative-links', 'use the reviewed existing packaging command');
  const require = createRequire(import.meta.url);
  execFileSync(process.execPath, [require.resolve('@vscode/vsce/vsce'), ...command.split(' ').slice(1), '--out', path], {
    cwd: root, stdio: 'inherit', env: {...process.env, SOURCE_DATE_EPOCH: info.epoch, TZ: 'UTC'}
  });
  assert.deepEqual(await readdir(output), [info.filename], 'exactly one newly generated VSIX');
  const coverage = verifyContents(await readVsix(path), await expectedContents(info.manifest), info.manifest);
  const sha256 = createHash('sha256').update(await readFile(path)).digest('hex');
  const result = {path: relative(root, path).split('\\').join('/'), filename: info.filename, version: info.version, commit: info.commit, sha256, ...coverage};
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, Object.entries(result).map(([key, value]) => `${key}=${value}\n`).join(''));
  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (isMain(import.meta.url)) await packageRelease();
