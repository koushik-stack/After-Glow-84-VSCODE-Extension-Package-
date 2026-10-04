import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { appendFile, lstat, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isMain, releaseInfo, repository, root } from './release-info.mjs';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const record = info => ({version: info.version, commit: info.commit, filename: info.filename, sha256: info.sha256});

export function releaseNotes(changelog, info) {
  const heading = `## ${info.version}`;
  const lines = changelog.split(/\r?\n/);
  const start = lines.findIndex(line => line === heading);
  assert.ok(start >= 0, 'changelog has an entry for the released version');
  const next = lines.findIndex((line, index) => index > start && line.startsWith('## '));
  const changes = lines.slice(start + 1, next < 0 ? undefined : next).join('\n').trim();
  assert.ok(changes, 'release changelog is not empty');
  return `${changes}\n\nPackaged from commit \`${info.commit}\` after Linux, Windows and macOS validation.\n\nUploaded asset: \`${info.filename}\`\n\nSHA-256: \`${info.sha256}\`\n\n<!-- afterglow-release ${JSON.stringify(record(info))} -->\n`;
}

export function verifyRelease(release, info) {
  assert.equal(release.tag_name, info.tag, 'release uses the expected tag');
  assert.equal(release.target_commitish, info.commit, 'release targets the exact tested commit');
  assert.equal(release.prerelease, false, 'stable version is not a prerelease');
  const markers = [...(release.body || '').matchAll(/<!-- afterglow-release (.*?) -->/g)];
  assert.equal(markers.length, 1, 'release must have one provenance record; manual review required otherwise');
  assert.deepEqual(JSON.parse(markers[0][1]), record(info), 'existing release differs from this build; refusing to overwrite');
  assert.ok(release.body.includes(`SHA-256: \`${info.sha256}\``), 'checksum appears directly in the visible release notes');
}

export function verifyAssets(assets, info, bytes) {
  assert.equal(assets.length, 1, 'release must have exactly one uploaded asset');
  const [asset] = assets;
  assert.equal(asset.name, info.filename, 'release asset has the expected VSIX filename');
  assert.equal(asset.state, 'uploaded', 'asset upload is complete');
  assert.equal(asset.size, bytes.length, 'uploaded VSIX size matches the build');
  assert.equal(asset.digest, `sha256:${info.sha256}`, 'GitHub asset checksum differs; refusing to overwrite');
}

// Dependency-injected API makes failure, rerun and partial-upload behavior testable
// without creating releases. This function never creates, moves or deletes tags.
export async function publishRelease(api, info, bytes, notes) {
  assert.equal(sha256(bytes), info.sha256, 'downloaded build artifact checksum matches build output');
  const checkTag = async () => assert.equal(await api.tagCommit(info.tag), info.commit, 'remote tag moved or points to a different commit');
  await checkTag();
  const matches = await api.findReleases(info.tag);
  assert.ok(matches.length <= 1, 'duplicate releases for this tag require manual review');
  let release = matches[0];
  if (!release) {
    release = await api.createRelease({tag_name: info.tag, target_commitish: info.commit, name: `Afterglow ’84 ${info.tag}`, body: notes, draft: true, prerelease: false, generate_release_notes: false});
    assert.equal(release.draft, true, 'new release remains a draft until the upload is verified');
  }
  verifyRelease(release, info);
  let assets = await api.assets(release.id);
  const alreadyPublished = release.draft === false;
  if (assets.length === 0) {
    assert.equal(release.draft, true, 'refusing to modify an already published release with missing assets');
    await api.upload(release, info.filename, bytes);
    assets = await api.assets(release.id);
  }
  verifyAssets(assets, info, bytes);
  await checkTag();
  if (release.draft) await api.publish(release.id);
  release = await api.release(release.id);
  verifyRelease(release, info);
  assert.equal(release.draft, false, 'release is published');
  verifyAssets(await api.assets(release.id), info, bytes);
  await checkTag();
  return {url: release.html_url, filename: info.filename, version: info.version, sha256: info.sha256, commit: info.commit, alreadyPublished};
}

export function githubApi(token) {
  const base = `https://api.github.com/repos/${repository}`;
  async function request(method, url, body, binary = false) {
    const destination = new URL(url);
    assert.ok(destination.protocol === 'https:' && ['api.github.com', 'uploads.github.com'].includes(destination.hostname), 'GitHub-only API destination');
    assert.ok(!destination.username && !destination.password && !destination.port, 'no unexpected API credentials or port');
    assert.ok(destination.pathname.startsWith(`/repos/${repository}/`), 'only the existing repository can be modified');
    let response;
    try {
      response = await fetch(url, {method, redirect: 'error', signal: AbortSignal.timeout(60000), headers: {
        Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'afterglow-vsix-release',
        ...(body === undefined ? {} : {'Content-Type': binary ? 'application/octet-stream' : 'application/json'})
      }, body: body === undefined ? undefined : binary ? body : JSON.stringify(body)});
    } catch { throw new Error(`GitHub request failed: ${method} ${destination.pathname}`); }
    // Never log request headers, credentials or arbitrary API response bodies.
    assert.ok(response.ok, `GitHub returned HTTP ${response.status}: ${method} ${destination.pathname}`);
    return response.json();
  }
  return {
    async tagCommit(tag) {
      let {object} = await request('GET', `${base}/git/ref/tags/${encodeURIComponent(tag)}`);
      for (let depth = 0; object.type === 'tag' && depth < 10; depth++) {
        assert.match(object.sha, /^[a-f0-9]{40}$/);
        ({object} = await request('GET', `${base}/git/tags/${object.sha}`));
      }
      assert.equal(object.type, 'commit', 'release tag resolves to a commit');
      return object.sha;
    },
    async findReleases(tag) {
      const matches = [];
      for (let page = 1; ; page++) {
        const releases = await request('GET', `${base}/releases?per_page=100&page=${page}`);
        matches.push(...releases.filter(release => release.tag_name === tag));
        if (releases.length < 100) return matches;
      }
    },
    createRelease: body => request('POST', `${base}/releases`, body),
    release: id => request('GET', `${base}/releases/${id}`),
    assets: id => request('GET', `${base}/releases/${id}/assets?per_page=100`),
    upload(release, filename, bytes) {
      const upload = new URL(release.upload_url.split('{')[0]);
      assert.equal(upload.origin, 'https://uploads.github.com', 'official asset upload host');
      assert.equal(upload.pathname, `/repos/${repository}/releases/${release.id}/assets`, 'upload belongs to this release');
      upload.search = new URLSearchParams({name: filename}).toString();
      return request('POST', upload.toString(), bytes, true);
    },
    publish: id => request('PATCH', `${base}/releases/${id}`, {draft: false, make_latest: 'legacy'})
  };
}

if (isMain(import.meta.url)) {
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'publish only through the validated GitHub Actions workflow');
  assert.equal(process.env.GITHUB_EVENT_NAME, 'push', 'release requires a tag push');
  assert.equal(process.env.GITHUB_REF_TYPE, 'tag', 'release requires an existing version tag');
  assert.equal(process.env.GITHUB_REPOSITORY, repository, 'publish only to the existing repository');
  assert.ok(process.env.GITHUB_TOKEN, 'the release job requires the built-in GITHUB_TOKEN');
  const source = await releaseInfo();
  assert.equal(process.env.RELEASE_FILENAME, source.filename);
  assert.equal(process.env.RELEASE_VERSION, source.version);
  assert.equal(process.env.RELEASE_COMMIT, source.commit);
  assert.match(process.env.RELEASE_SHA256 || '', /^[a-f0-9]{64}$/);
  const info = {...source, sha256: process.env.RELEASE_SHA256};
  const directory = resolve(root, '.release/publish');
  assert.deepEqual(await readdir(directory), [info.filename], 'downloaded artifact contains only the expected VSIX');
  const path = resolve(directory, info.filename);
  assert.ok((await lstat(path)).isFile(), 'release asset is a regular file, not a link');
  const bytes = await readFile(path);
  const notes = releaseNotes(await readFile(resolve(root, 'CHANGELOG.md'), 'utf8'), info);
  const result = await publishRelease(githubApi(process.env.GITHUB_TOKEN), info, bytes, notes);
  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `Release: ${result.url}\n\nAsset: \`${result.filename}\`\n\nSHA-256: \`${result.sha256}\`\n`);
}
