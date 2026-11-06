(() => {
  const templates = {
    modern: { label: 'Modern', path: '01-modern/index.html' },
    playful: { label: 'Playful', path: '02-playful/index.html' },
    premium: { label: 'Premium', path: '03-premium/index.html' },
  };
  const defaultTemplate = 'modern';
  const storageKey = 'demo-cathotel-template-v1';

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
    openTemplate.href = selected.path;

    if (preview.getAttribute('src') !== selected.path) {
      bar.classList.add('is-loading');
      preview.setAttribute('aria-busy', 'true');
      preview.src = selected.path;
    }
    if (persist) storeTemplate(key);
    if (syncAddress) updateAddress(key);
  };

  preview.addEventListener('load', finishLoading);
  tabs.forEach((tab) => tab.addEventListener('click', () => selectTemplate(tab.dataset.template)));

  const requested = new URLSearchParams(window.location.search).get('template');
  const stored = readStoredTemplate();
  const initial = [requested, stored].find((key) => templates[key]) || defaultTemplate;
  selectTemplate(initial, { persist: false, syncAddress: Boolean(templates[requested]) });
})();
