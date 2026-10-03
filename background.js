import {BASE, candidates, sourceSlug, extractArtwork} from './core.mjs';
const DAY = 86400000;
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
    await store.set({[overrideKey]: BASE + slug, [cacheKey]: {time: Date.now(), result: art}});
    return art;
  }
  if (request.action === 'reset') {
    await store.remove([overrideKey, cacheKey]);
    saved = {};
  }
  const cached = saved[cacheKey];
  if (request.action === 'get' && cached && Date.now() - cached.time < (cached.result ? 7 * DAY : 3600000))
    return cached.result;
  const override = saved[overrideKey];
  const slugs = override ? [sourceSlug(override)] : candidates(request.name, request.remaster);
  let result = null;
  for (const slug of slugs) {
    result = await fetchArt(slug, request.name, !!override);
    if (result) break;
  }
  await store.set({[cacheKey]: {time: Date.now(), result}});
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
