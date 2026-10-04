import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';
import { validateVersion } from './release-info.mjs';
import { expectedContents, verifyContents } from './package-release.mjs';
import { publishRelease, releaseNotes, sha256 } from './publish-release.mjs';

test('release tags are stable versions that exactly match both lockfile versions', () => {
  const manifest = {name: 'afterglow-84', version: '0.6.0'};
  const lock = {version: '0.6.0', packages: {'': {version: '0.6.0'}}};
  assert.equal(validateVersion(manifest, lock, 'v0.6.0').filename, 'afterglow-84-0.6.0.vsix');
  for (const tag of ['0.6.0', 'v0.6', 'v00.6.0', 'v0.6.0-beta.1', 'v0.6.0+build', 'v0.7.0', 'v0.6.0\n', 'v0.6.0/other', 'v0.6.0;echo unsafe']) {
    assert.throws(() => validateVersion(manifest, lock, tag), undefined, tag);
  }
  assert.throws(() => validateVersion(manifest, {...lock, version: '0.5.0'}, 'v0.6.0'));
  assert.throws(() => validateVersion(manifest, {...lock, packages: {'': {version: '0.5.0'}}}, 'v0.6.0'));
  assert.throws(() => validateVersion({...manifest, version: '0.6.0\n'}, {version: '0.6.0\n', packages: {'': {version: '0.6.0\n'}}}));
});

test('archive verification rejects missing themes, changed payloads and extra files', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const expected = await expectedContents(manifest);
  const valid = new Map([...expected, ['[Content_Types].xml', Buffer.from('<Types/>')], ['extension.vsixmanifest', Buffer.from(`<Identity Version="${manifest.version}" Publisher="${manifest.publisher}"/>`)]]);
  assert.equal(verifyContents(valid, expected, manifest).themes, 7);
  const missing = new Map(valid);
  missing.delete('extension/themes/afterglow-84-midnight-mocha-color-theme.json');
  assert.throws(() => verifyContents(missing, expected, manifest));
  const stale = new Map(valid);
  stale.set('extension/themes/afterglow-84-midnight-mocha-color-theme.json', Buffer.from('{}'));
  assert.throws(() => verifyContents(stale, expected, manifest));
  for (const path of ['extension/.github/workflows/ci-release.yml', 'extension/old.vsix', 'extension/scripts/runtime.js']) {
    assert.throws(() => verifyContents(new Map([...valid, [path, Buffer.from('unexpected')]]), expected, manifest));
  }
});

function fixture({existing, assets, tagCommits, uploadFails = false, badUpload = false} = {}) {
  const bytes = Buffer.from('verified VSIX payload');
  const info = {tag: 'v0.6.0', version: '0.6.0', filename: 'afterglow-84-0.6.0.vsix', commit: 'a'.repeat(40), sha256: sha256(bytes)};
  const notes = releaseNotes('# Changelog\n\n## 0.6.0\n\n- Midnight Mocha.\n\n## 0.5.0\n\n- Earlier release.\n', info);
  const calls = [];
  const matching = {id: 1, tag_name: info.tag, target_commitish: info.commit, body: notes, draft: existing !== 'published', prerelease: false, html_url: 'https://github.com/owner/repo/releases/tag/v0.6.0'};
  const goodAsset = {name: info.filename, size: bytes.length, digest: `sha256:${info.sha256}`, state: 'uploaded'};
  let release = existing ? matching : undefined;
  let uploaded = assets === 'matching' ? [goodAsset] : assets || [];
  const api = {
    async tagCommit() { calls.push('tag'); return tagCommits?.length ? tagCommits.shift() : info.commit; },
    async findReleases() { calls.push('find'); return release ? [release] : []; },
    async createRelease(body) { calls.push('create'); release = {...matching, ...body}; return release; },
    async assets() { calls.push('assets'); return uploaded; },
    async upload() { calls.push('upload'); if (uploadFails) throw new Error('upload failed'); uploaded = [{...goodAsset, ...(badUpload ? {digest: 'sha256:wrong'} : {})}]; },
    async publish() { calls.push('publish'); release = {...release, draft: false}; },
    async release() { return release; }
  };
  return {api, info, bytes, notes, calls, matching, goodAsset};
}

test('new release is drafted, uploaded once, verified, then published', async () => {
  const f = fixture();
  const result = await publishRelease(f.api, f.info, f.bytes, f.notes);
  assert.equal(result.sha256, f.info.sha256);
  assert.equal(f.calls.filter(call => call === 'upload').length, 1);
  assert.ok(f.calls.indexOf('create') < f.calls.indexOf('upload'));
  assert.ok(f.calls.indexOf('upload') < f.calls.indexOf('publish'));
  assert.match(f.notes, /SHA-256: `[a-f0-9]{64}`/);
  assert.ok(!f.notes.includes('Earlier release'));
});

test('matching published release is an idempotent rerun with no writes', async () => {
  const f = fixture({existing: 'published', assets: 'matching'});
  assert.equal((await publishRelease(f.api, f.info, f.bytes, f.notes)).alreadyPublished, true);
  assert.ok(f.calls.every(call => !['create', 'upload', 'publish'].includes(call)));
});

for (const assets of [[], 'matching']) test(`matching interrupted draft resumes safely (${JSON.stringify(assets)})`, async () => {
  const f = fixture({existing: 'draft', assets});
  await publishRelease(f.api, f.info, f.bytes, f.notes);
  assert.ok(!f.calls.includes('create'));
  assert.equal(f.calls.filter(call => call === 'upload').length, assets === 'matching' ? 0 : 1);
  assert.ok(f.calls.includes('publish'));
});

test('different checksum, wrong filename or extra release asset stops all writes', async () => {
  for (const kind of ['checksum', 'filename', 'extra']) {
    const f = fixture({existing: 'published'});
    const asset = {...f.goodAsset};
    if (kind === 'checksum') asset.digest = 'sha256:different';
    if (kind === 'filename') asset.name = 'unwanted.zip';
    f.api.assets = async () => kind === 'extra' ? [asset, {...asset, name: 'source.zip'}] : [asset];
    await assert.rejects(() => publishRelease(f.api, f.info, f.bytes, f.notes));
    assert.ok(!f.calls.some(call => ['create', 'upload', 'publish'].includes(call)));
  }
});

test('missing asset on an already published release is not silently repaired', async () => {
  const f = fixture({existing: 'published'});
  await assert.rejects(() => publishRelease(f.api, f.info, f.bytes, f.notes), /already published release/);
  assert.ok(!f.calls.includes('upload'));
});

test('foreign release provenance and duplicate releases require manual review', async () => {
  for (const duplicate of [false, true]) {
    const f = fixture({existing: 'published', assets: 'matching'});
    f.api.findReleases = async () => duplicate ? [f.matching, f.matching] : [{...f.matching, body: 'Unrelated manual release'}];
    await assert.rejects(() => publishRelease(f.api, f.info, f.bytes, f.notes), /manual review/);
    assert.ok(!f.calls.some(call => ['create', 'upload', 'publish'].includes(call)));
  }
});

test('failed or corrupt upload leaves the release unpublished', async () => {
  for (const option of [{uploadFails: true}, {badUpload: true}]) {
    const f = fixture(option);
    await assert.rejects(() => publishRelease(f.api, f.info, f.bytes, f.notes));
    assert.ok(!f.calls.includes('publish'));
  }
});

test('moved tag or replaced artifact blocks publication', async () => {
  const wrongTag = fixture({tagCommits: ['b'.repeat(40)]});
  await assert.rejects(() => publishRelease(wrongTag.api, wrongTag.info, wrongTag.bytes, wrongTag.notes), /remote tag moved/);
  assert.ok(!wrongTag.calls.includes('create'));
  const movedAfterUpload = fixture({tagCommits: ['a'.repeat(40), 'b'.repeat(40)]});
  await assert.rejects(() => publishRelease(movedAfterUpload.api, movedAfterUpload.info, movedAfterUpload.bytes, movedAfterUpload.notes), /remote tag moved/);
  assert.ok(!movedAfterUpload.calls.includes('publish'));
  const tampered = fixture();
  await assert.rejects(() => publishRelease(tampered.api, tampered.info, Buffer.from('replaced'), tampered.notes), /artifact checksum/);
  assert.equal(tampered.calls.length, 0);
});

test('workflow gates publication on all platforms and grants write only to release', async () => {
  const workflow = yaml.load(await readFile(new URL('../.github/workflows/ci-release.yml', import.meta.url), 'utf8'));
  assert.deepEqual(workflow.on.pull_request.branches, ['main']);
  assert.deepEqual(workflow.on.push.branches, ['main']);
  assert.deepEqual(workflow.on.push.tags, ['v*']);
  assert.deepEqual(workflow.permissions, {contents: 'read'});
  assert.deepEqual(workflow.jobs.validate.strategy.matrix.os, ['ubuntu-latest', 'windows-latest', 'macos-latest']);
  assert.equal(workflow.jobs.validate.strategy['fail-fast'], false);
  assert.equal(workflow.jobs.build.needs, 'validate');
  assert.deepEqual(workflow.jobs.release.needs, ['validate', 'build']);
  assert.deepEqual(workflow.jobs.release.permissions, {contents: 'write'});
  for (const name of ['validate', 'build']) assert.equal(workflow.jobs[name].permissions?.contents ?? workflow.permissions.contents, 'read');
  for (const job of Object.values(workflow.jobs)) {
    assert.ok(!job['continue-on-error']);
    for (const step of job.steps) {
      assert.ok(!step['continue-on-error']);
      if (step.uses) assert.match(step.uses, /^actions\/[\w-]+@[a-f0-9]{40}$/, 'actions are pinned to commits');
      if (step.uses?.startsWith('actions/checkout@')) {
        assert.equal(step.with.ref, '${{ github.sha }}');
        assert.equal(step.with['persist-credentials'], false);
      }
    }
  }
  const runs = workflow.jobs.validate.steps.map(step => step.run);
  for (const required of ['npm ci', 'npm run validate', 'npm test', 'npm run package:check']) assert.ok(runs.includes(required));
  const upload = workflow.jobs.build.steps.find(step => step.uses?.startsWith('actions/upload-artifact@'));
  assert.equal(upload.with.path, '${{ steps.package.outputs.path }}');
  assert.ok(!upload.with.path.includes('*'), 'no release artifact globs');
  const download = workflow.jobs.release.steps.find(step => step.uses?.startsWith('actions/download-artifact@'));
  assert.equal(download.with['artifact-ids'], '${{ needs.build.outputs.artifact-id }}');
  const publish = workflow.jobs.release.steps.find(step => step.run === 'node scripts/publish-release.mjs');
  assert.equal(publish.env.GITHUB_TOKEN, '${{ github.token }}');
});
