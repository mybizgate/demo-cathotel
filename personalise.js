// Personalised demo: the showcase stores the prospect's business name in this browser, and every
// template swaps the sample name for it, including the page title and the WhatsApp messages.
// Nothing is sent anywhere. Open the demo with ?for=Business+Name to set the name; ?for= clears it.
(() => {
  const SAMPLE = 'Pet Spa & Hotel';
  const KEY = 'demo-cathotel-for';
  const read = () => { try { return window.localStorage.getItem(KEY) || ''; } catch { return ''; } };
  const write = (v) => { try { v ? window.localStorage.setItem(KEY, v) : window.localStorage.removeItem(KEY); } catch { /* storage blocked */ } };
  const clean = (v) => String(v || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);

  // The showcase page sets the name; a template opened directly also honours ?for=.
  const params = new URLSearchParams(window.location.search);
  if (params.has('for')) write(clean(params.get('for')));
  const name = read();
  window.demoFor = { name, sample: SAMPLE, key: KEY };
  if (!name || name === SAMPLE) return;

  const swap = (s) => s.split(SAMPLE).join(name);
  const encSample = encodeURIComponent(SAMPLE);
  const walk = (node) => {
    if (node.nodeType === 3) { if (node.nodeValue.includes(SAMPLE)) node.nodeValue = swap(node.nodeValue); return; }
    if (node.nodeType !== 1 || node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
    for (const attr of ['aria-label', 'alt', 'title', 'content', 'data-msg', 'placeholder']) {
      const v = node.getAttribute(attr);
      if (v && v.includes(SAMPLE)) node.setAttribute(attr, swap(v));
    }
    const href = node.getAttribute('href');
    if (href && href.includes(encSample)) node.setAttribute('href', href.split(encSample).join(encodeURIComponent(name)));
    for (const child of [...node.childNodes]) walk(child);
  };
  const apply = () => { document.title = swap(document.title); walk(document.body); };
  if (document.body) apply(); else document.addEventListener('DOMContentLoaded', apply, { once: true });
  // Content the template renders later (booking sheets, confirmations) is personalised as it appears.
  const mo = new MutationObserver((list) => { for (const m of list) for (const n of m.addedNodes) walk(n); });
  document.addEventListener('DOMContentLoaded', () => mo.observe(document.body, { childList: true, subtree: true }), { once: true });
  if (document.body) mo.observe(document.body, { childList: true, subtree: true });
})();
