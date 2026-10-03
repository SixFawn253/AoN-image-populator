(() => {
  const extension = globalThis.browser ?? globalThis.chrome;
  if (!/^\d+$/.test(new URL(location.href).searchParams.get('ID') || '') || document.getElementById('aon-image-populator')) return;
  const heading = [...document.querySelectorAll('h1.monster-statblock-name, h1.title')]
    .find(h => /Creature\s+[−–-]?\d+/i.test(h.textContent));
  if (!heading) return;
  const name = heading.querySelector('a[href*="ID="]')?.textContent.trim() ||
    heading.textContent.replace(/Creature\s+[−–-]?\d+.*/i, '').trim();
  const pageText = heading.parentElement.textContent;
  const remaster = /There is a Legacy version/i.test(pageText) ? true :
    /There is a Remastered version|\bLegacy Content\b/i.test(pageText) ? false : undefined;
  const host = document.createElement('aside');
  host.id = 'aon-image-populator';
  host.setAttribute('aria-label', 'Creature artwork from Demiplane');
  heading.after(host);
  const root = host.attachShadow({mode: 'open'});
  // All markup here is static; third-party data is assigned via textContent and validated URLs.
  root.innerHTML = `
    <style>
      :host{font:12px/1.5 system-ui,sans-serif;color:inherit;text-align:center}
      *{box-sizing:border-box} [hidden]{display:none!important}
      figure{margin:0} img{display:block;max-width:100%;width:auto;height:auto;max-height:340px;margin:auto;object-fit:contain}
      a{color:inherit;text-decoration:underline} button,summary{cursor:pointer}
      button,input{font:inherit} button{color:inherit;background:transparent;border:1px solid #8888;border-radius:4px;padding:3px 7px}
      button:disabled{opacity:.5;cursor:wait} button:hover{background:#8882}
      :focus-visible{outline:2px solid #b89958;outline-offset:3px}
      figcaption{margin:5px 0;opacity:.85} p{margin:6px 0}
      details{text-align:left;margin-top:7px} summary{text-align:center;opacity:.8}
      form{padding:9px 0} label{display:block} input{width:100%;margin:5px 0 8px;padding:6px;color:#171717;background:#fff;border:1px solid #888;border-radius:4px}
      .buttons{display:flex;flex-wrap:wrap;gap:6px} #status{overflow-wrap:anywhere} #credit{font-size:10px;opacity:.65}
    </style>
    <figure hidden><a id="art-link" target="_blank" rel="noopener noreferrer" title="Open artwork"><img referrerpolicy="no-referrer"></a>
      <figcaption><a id="source" target="_blank" rel="noopener noreferrer">View on Demiplane</a><span id="thumb" hidden> · thumbnail</span></figcaption></figure>
    <p id="status" role="status" aria-live="polite">Finding creature artwork…</p>
    <details><summary>Artwork settings</summary><form>
      <label for="url">Change source: Demiplane creature link</label>
      <input id="url" type="url" placeholder="https://app.demiplane.com/nexus/…" required>
      <div class="buttons"><button type="submit">Save source</button><button id="reset" type="button">Automatic</button><button id="retry" type="button">Retry</button></div>
      <p><a href="https://app.demiplane.com/nexus/pathfinder2e/creatures" target="_blank" rel="noopener noreferrer">Browse Demiplane creatures</a></p>
    </form></details><p id="credit" hidden>Artwork belongs to its respective owners.</p>`;
  const get = id => root.getElementById(id);
  const figure = root.querySelector('figure');
  const img = root.querySelector('img');
  let generation = 0;
  async function load(action, source) {
    const current = ++generation;
    root.querySelectorAll('button').forEach(b => b.disabled = true);
    get('status').textContent = 'Finding creature artwork…';
    try {
      const response = await extension.runtime.sendMessage({type:'aon-image-populator',action,name,remaster,source});
      if (current !== generation) return;
      if (!response?.ok) throw new Error(response?.error || 'Reload this AoN page after updating the extension.');
      const result = response.result;
      if (!result) {
        figure.hidden = true;
        get('credit').hidden = true;
        get('status').textContent = 'No matching public artwork found. Choose a source in Artwork settings.';
        return;
      }
      get('url').value = result.source;
      get('source').href = result.source;
      get('source').textContent = result.related ? result.name + ' artwork on Demiplane' : 'View on Demiplane';
      get('art-link').href = result.image;
      get('thumb').hidden = !result.thumbnail;
      img.alt = result.name + ' — creature artwork';
      img.onload = () => {
        if (current !== generation) return;
        figure.hidden = false; get('credit').hidden = false; get('status').textContent = '';
      };
      img.onerror = () => {
        if (current !== generation) return;
        figure.hidden = true; get('credit').hidden = true;
        get('status').textContent = 'The image could not load. Try Retry, or open the creature on Demiplane.';
      };
      img.src = result.image;
      if (img.complete && img.naturalWidth) img.onload();
    } catch (error) { get('status').textContent = error.message; }
    finally { if (current === generation) root.querySelectorAll('button').forEach(b => b.disabled = false); }
  }
  root.querySelector('form').addEventListener('submit', e => {e.preventDefault(); load('set',get('url').value.trim());});
  get('reset').addEventListener('click', () => load('reset'));
  get('retry').addEventListener('click', () => load('retry'));
  load('get');
})();
