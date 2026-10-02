export const BASE = 'https://app.demiplane.com/nexus/pathfinder2e/creatures/';
export function normalize(name) {
  return String(name).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
export function candidates(name, remaster) {
  const names = [name];
  if (name.includes(',')) names.push(name.split(',').reverse().join(' '));
  return [...new Set(names.flatMap(n => {
    const slug = normalize(n).replace(/ /g, '-');
    return remaster === false ? [slug, slug + '-rm'] : [slug + '-rm', slug];
  }))].filter(s => /^[a-z0-9-]{1,160}$/.test(s));
}
export function sourceSlug(value) {
  const url = new URL(value);
  if (url.origin !== 'https://app.demiplane.com' || url.username || url.password ||
      !/^\/nexus\/pathfinder2e\/creatures\/[a-z0-9-]+\/?$/.test(url.pathname))
    throw new Error('Paste a Demiplane Pathfinder 2e creature page link.');
  return url.pathname.split('/').filter(Boolean).at(-1);
}
export function imageURL(value) {
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
export function pageObjects(html) {
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
  for (const line of stream.split('\n')) {
    const record = line.match(/^[0-9a-f]+:([\[{].*)$/i);
    if (record) try { objects.push(JSON.parse(record[1])); } catch { /* non-JSON flight record */ }
  }
  return objects;
}

export function extractArtwork(html, requestedName, manual = false) {
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
