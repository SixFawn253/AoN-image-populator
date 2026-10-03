(() => {
const BASE = 'https://app.demiplane.com/nexus/pathfinder2e/creatures/';
function normalize(name) {
  return String(name).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[â€™']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
function candidates(name, remaster) {
  const names = [name];
  if (name.includes(',')) names.push(name.split(',').reverse().join(' '));
  return [...new Set(names.flatMap(n => {
    const slug = normalize(n).replace(/ /g, '-');
    return remaster === false ? [slug, slug + '-rm'] : [slug + '-rm', slug];
  }))].filter(s => /^[a-z0-9-]{1,160}$/.test(s));
}
function sourceSlug(value) {
  const url = new URL(value);
  if (url.origin !== 'https://app.demiplane.com' || url.username || url.password ||
      !/^\/nexus\/pathfinder2e\/creatures\/[a-z0-9-]+\/?$/.test(url.pathname))
    throw new Error('Paste a Demiplane Pathfinder 2e creature page link.');
  return url.pathname.split('/').filter(Boolean).at(-1);
}
function dragonArtworkCandidates(name, remaster) {
  const family = normalize(name).replace(/^(young|adult|ancient) /, '');
  if (!/^[a-z0-9 ]+ dragon$/.test(family)) return [];
  return ['adult', 'young', 'ancient'].flatMap(age => {
    const relatedName = age + ' ' + family;
    return relatedName === normalize(name) ? [] : candidates(relatedName, remaster)
      .map(slug => ({slug, name: relatedName}));
  });
}
function imageURL(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.replace(/^\/?(compendium|elements)\//, '/$1/'), 'https://images.demiplane.com/');
    if (url.protocol !== 'https:' || url.username || url.password ||
        !['images.demiplane.com', 'content.thedemiplane.com'].includes(url.hostname) ||
        !/^\/(compendium|elements)\/pathfinder-2e\//.test(url.pathname)) return null;
    return url.href;
  } catch { return null; }
}
function namedThumbnail(url, name) {
  try {
    const filename = normalize(decodeURIComponent(new URL(url).pathname.split('/').at(-1)));
    return normalize(name).split(' ').every(word => filename.includes(word));
  } catch { return false; }
}

// Parse serialized data only. Never execute scripts downloaded from another site.
function pageObjects(html) {
  const objects = [];
  let stream = '';
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\bid=["']__NEXT_DATA__["']/.test(match[1])) {
      try { objects.push(JSON.parse(match[2])); } catch { /* unsupported data */ }
    }
    const push = match[2].trim().match(/^self\.__next_f\.push\((\[[\s\S]*\])\);?$/);
    if (push) {
      try {
        const data = JSON.parse(push[1]);
        if (data[0] === 1 && typeof data[1] === 'string') stream += data[1];
      } catch { /* unsupported data */ }
    }
  }
  // Flight text records are byte-length-prefixed, not newline-delimited. A
  // creature's JSON can start immediately after a long HTML text record.
  const bytes = new TextEncoder().encode(stream);
  const decoder = new TextDecoder();
  let offset = 0;
  while (offset < bytes.length) {
    const header = decoder.decode(bytes.subarray(offset, offset + 64))
      .match(/^[0-9a-f]+:T([0-9a-f]+),/i);
    if (header) {
      const length = Number.parseInt(header[1], 16);
      if (!Number.isSafeInteger(length) || offset + header[0].length + length > bytes.length) break;
      offset += header[0].length + length;
      continue;
    }
    const end = bytes.indexOf(10, offset);
    const line = decoder.decode(bytes.subarray(offset, end < 0 ? bytes.length : end));
    const record = line.match(/^[0-9a-f]+:([\[{].*)$/i);
    if (record) try { objects.push(JSON.parse(record[1])); } catch { /* non-JSON flight record */ }
    offset = end < 0 ? bytes.length : end + 1;
  }
  return objects;
}

function extractArtwork(html, requestedName, manual = false) {
  const stack = pageObjects(html);
  const wanted = normalize(requestedName);
  while (stack.length) {
    const obj = stack.pop();
    if (!obj || typeof obj !== 'object') continue;
    const version = obj.elementDisplayVersion;
    if (version && typeof version === 'object') {
      if (obj.hasAccess === false || obj.isEntitled === false && obj.allowUnauthenticatedAccess === false) continue;
      const name = version.name;
      const matches = normalize(name) === wanted || normalize(name).split(' ').sort().join(' ') === wanted.split(' ').sort().join(' ');
      if (typeof name === 'string' && (manual || matches)) {
        const image = imageURL(version.element_image);
        if (image && (!image.includes('/thumbnail/') || namedThumbnail(image, name)))
          return {image, name, thumbnail: image.includes('/thumbnail/')};
        const thumbnail = imageURL(version.element_thumbnail);
        // Generic type icons (e.g. undead.jpg) are not a portrait of this creature.
        if (thumbnail && namedThumbnail(thumbnail, name))
          return {image: thumbnail, name, thumbnail: true};
      }
    }
    for (const value of Object.values(obj)) if (value && typeof value === 'object') stack.push(value);
  }
  return null;
}

const DAY = 86400000;
const CACHE_VERSION = 2;
const pending = new Map();
const extension = globalThis.browser ?? globalThis.chrome;
const store = extension.storage.local;

async function fetchArt(slug, name, manual) {
  const source = BASE + slug;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  let response, html;
  try {
    response = await fetch(source, {
      credentials: 'omit', referrerPolicy: 'no-referrer',
      signal: controller.signal, redirect: 'error'
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Demiplane is unavailable (' + response.status + '). Try again later.');
    html = await response.text();
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Demiplane took too long to respond. Try again.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
  if (html.length > 6000000) throw new Error('The Demiplane page is too large to read.');
  const result = extractArtwork(html, name, manual);
  return result ? {...result, source} : null;
}

async function resolve(request, id) {
  const overrideKey = 'source:' + id;
  const cacheKey = 'art:' + id;
  let saved = await store.get([overrideKey, cacheKey]);
  if (request.action === 'set') {
    const slug = sourceSlug(request.source);
    const art = await fetchArt(slug, request.name, true);
    if (!art) throw new Error('No public creature artwork found on that page. Your previous source was kept.');
    await store.set({[overrideKey]: BASE + slug, [cacheKey]: {version: CACHE_VERSION, time: Date.now(), result: art}});
    return art;
  }
  if (request.action === 'reset') {
    await store.remove([overrideKey, cacheKey]);
    saved = {};
  }
  const cached = saved[cacheKey];
  if (request.action === 'get' && cached?.version === CACHE_VERSION && Date.now() - cached.time < (cached.result ? 7 * DAY : 3600000))
    return cached.result;
  const override = saved[overrideKey];
  const slugs = override ? [sourceSlug(override)] : candidates(request.name, request.remaster);
  let result = null;
  for (const slug of slugs) {
    result = await fetchArt(slug, request.name, !!override);
    if (result) break;
  }
  if (!override && (!result || result.thumbnail)) {
    for (const related of dragonArtworkCandidates(request.name, request.remaster)) {
      const art = await fetchArt(related.slug, related.name, false);
      if (art && !art.thumbnail) {
        result = {...art, related: true};
        break;
      }
    }
  }
  await store.set({[cacheKey]: {version: CACHE_VERSION, time: Date.now(), result}});
  // Keep the cache bounded without removing user-selected sources.
  const all = await store.get(null);
  const keys = Object.keys(all).filter(k => k.startsWith('art:')).sort((a,b) => all[b].time - all[a].time);
  if (keys.length > 500) await store.remove(keys.slice(500));
  return result;
}

extension.runtime.onMessage.addListener((request, sender, respond) => {
  if (request?.type !== 'aon-image-populator') return;
  let page;
  try { page = new URL(sender.url); } catch { return; }
  if (sender.id !== extension.runtime.id || page.origin !== 'https://2e.aonprd.com' ||
      !/^\/(Monsters|NPCs)\.aspx$/i.test(page.pathname) ||
      !/^\d+$/.test(page.searchParams.get('ID') || '') ||
      !['get','retry','set','reset'].includes(request.action) ||
      typeof request.name !== 'string' || !request.name.trim() || request.name.length > 180) return;
  const id = page.pathname.toLowerCase() + ':' + page.searchParams.get('ID');
  // Serialize mutations per creature so a slow lookup cannot overwrite a source change.
  const previous = pending.get(id) || Promise.resolve();
  const task = previous.catch(() => {}).then(() => resolve(request, id));
  pending.set(id, task);
  task.then(result => respond({ok: true, result}), error => respond({ok: false,
    error: error.name === 'TimeoutError' ? 'Demiplane took too long to respond. Try again.' : error.message || 'Artwork lookup failed.'
  })).finally(() => { if (pending.get(id) === task) pending.delete(id); });
  return true;
});

})();
