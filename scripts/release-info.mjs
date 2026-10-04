
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const repository = 'koushik-stack/After-Glow-84-VSCODE-Extension-Package-';
export const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
export const isMain = url => process.argv[1] && url === pathToFileURL(resolve(process.argv[1])).href;

export function validateVersion(manifest, lock, tag) {
  assert.match(manifest.version, stableVersion, 'version must be a stable major.minor.patch');
  assert.equal(manifest.version, manifest.version.trim(), 'version has no surrounding whitespace');
  assert.equal(lock.version, manifest.version, 'lockfile version matches package.json');
  assert.equal(lock.packages?.['']?.version, manifest.version, 'lockfile root version matches package.json');
  assert.equal(manifest.name, 'afterglow-84', 'expected extension identity');
  if (tag !== undefined) {
    assert.match(tag, /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, 'release tag must be vMAJOR.MINOR.PATCH');
    assert.equal(tag, `v${manifest.version}`, 'tag version matches package.json');
  }
  return {version: manifest.version, filename: `${manifest.name}-${manifest.version}.vsix`, tag};
}

export async function releaseInfo(env = process.env) {
  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'));
  const tag = env.GITHUB_REF_TYPE === 'tag' ? env.GITHUB_REF_NAME : undefined;
  if (env.GITHUB_REF_TYPE === 'tag') assert.ok(tag, 'tag name is required');
  const info = validateVersion(manifest, lock, tag);
  const commit = git('rev-parse', 'HEAD');
  if (env.GITHUB_ACTIONS === 'true') assert.equal(commit, env.GITHUB_SHA, 'checkout is the exact event commit');
  if (tag) {
    assert.equal(git('rev-parse', `refs/tags/${tag}^{commit}`), commit, 'tag resolves to the checked-out commit');
    assert.equal(git('status', '--porcelain', '--untracked-files=all'), '', 'tagged source must be clean and committed');
  }
  const epoch = git('show', '-s', '--format=%ct', commit);
  assert.match(epoch, /^\d+$/, 'commit timestamp is available for reproducible packaging');
  return {...info, commit, epoch, manifest};
}

if (isMain(import.meta.url)) {
  const {manifest, ...info} = await releaseInfo();
  console.log(JSON.stringify(info, null, 2));
}
