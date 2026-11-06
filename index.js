(() => {
  const templates = {
    modern: { label: 'Modern', path: '01-modern/index.html' },
    playful: { label: 'Playful', path: '02-playful/index.html' },
    premium: { label: 'Premium', path: '03-premium/index.html' },
  };
  const defaultTemplate = 'modern';
  const storageKey = 'demo-cathotel-template-v1';
  // Personalised demo: ?for=Business+Name is kept in this browser and shown on every template.
  const forKey = 'demo-cathotel-for';
  const cleanName = (v) => String(v || '').replace(/[<>"]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const readFor = () => { try { return window.localStorage.getItem(forKey) || ''; } catch { return ''; } };
  const writeFor = (v) => { try { v ? window.localStorage.setItem(forKey, v) : window.localStorage.removeItem(forKey); } catch { /* storage blocked */ } };
  const startParams = new URLSearchParams(window.location.search);
  if (startParams.has('for')) writeFor(cleanName(startParams.get('for')));
  const forName = readFor();
  const withFor = (path) => (forName ? `${path}?for=${encodeURIComponent(forName)}` : path);

  const bar = document.querySelector('.showcase-bar');
  const preview = document.querySelector('#templatePreview');
  const previewStatus = document.querySelector('#previewStatus');
  const openTemplate = document.querySelector('#openTemplate');
  const tabs = [...document.querySelectorAll('[data-template]')];

  const readStoredTemplate = () => {
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null; // The switcher still works when storage is blocked.
    }
  };

  const storeTemplate = (key) => {
    try {
      window.localStorage.setItem(storageKey, key);
    } catch {
      // Same as above: remembering the choice is optional.
    }
  };

  // ?template=playful makes a specific template shareable as a link.
  const updateAddress = (key) => {
    const url = new URL(window.location.href);
    if (key === defaultTemplate) url.searchParams.delete('template');
    else url.searchParams.set('template', key);
    window.history.replaceState({}, '', url);
  };

  const finishLoading = () => {
    bar.classList.remove('is-loading');
    preview.removeAttribute('aria-busy');
  };

  const selectTemplate = (key, { persist = true, syncAddress = true } = {}) => {
    const selected = templates[key];
    tabs.forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.template === key)));
    preview.title = `${selected.label} cat hotel website template preview`;
    previewStatus.textContent = `Previewing ${selected.label}`;
    openTemplate.href = withFor(selected.path);

    if (preview.getAttribute('src') !== withFor(selected.path)) {
      bar.classList.add('is-loading');
      preview.setAttribute('aria-busy', 'true');
      preview.src = withFor(selected.path);
    }
    if (persist) storeTemplate(key);
    if (syncAddress) updateAddress(key);
  };

  preview.addEventListener('load', finishLoading);
  if (forName) {
    const title = document.querySelector('.showcase-title strong');
    if (title) title.textContent = `Demo for ${forName}`;
    document.title = `${forName}: website demo by Niagova`;
    const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex'; document.head.append(robots); // one-off links stay out of Google
  }
  tabs.forEach((tab) => tab.addEventListener('click', () => selectTemplate(tab.dataset.template)));

  const requested = new URLSearchParams(window.location.search).get('template');
  const stored = readStoredTemplate();
  const initial = [requested, stored].find((key) => templates[key]) || defaultTemplate;
  selectTemplate(initial, { persist: false, syncAddress: Boolean(templates[requested]) });
})();
