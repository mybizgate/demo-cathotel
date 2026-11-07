(() => {
  'use strict';
  const templates = {
    modern: { label: 'Modern', path: '01-modern/index.html' },
    playful: { label: 'Playful', path: '02-playful/index.html' },
    premium: { label: 'Elegant', path: '03-premium/index.html' },
  };
  const storageKey = 'demo-cathotel-template-v1';
  const params = new URLSearchParams(window.location.search);
  // URL-scoped personalization avoids exposing the previous prospect's identity on a shared device.
  const forName = String(params.get('for') || '').replace(/[<>"'\x00-\x1f\x7f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 70);
  const isProspect = Boolean(forName);
  const defaultTemplate = isProspect ? 'premium' : 'modern';
  const withFor = (path) => {
    if (!isProspect) return path;
    const url = new URL(path, window.location.href);
    url.searchParams.set('for', forName);
    return url.pathname.replace(/^\//, '') + url.search;
  };
  const bar = document.querySelector('.showcase-bar');
  const preview = document.querySelector('#templatePreview');
  const previewStatus = document.querySelector('#previewStatus');
  const openTemplate = document.querySelector('#openTemplate');
  const prospectBar = document.querySelector('#prospectBar');
  const prospectContact = document.querySelector('#prospectContact');
  const tabs = [...document.querySelectorAll('[data-template]')];
  const readStoredTemplate = () => {
    try { return window.localStorage.getItem(storageKey); } catch { return null; }
  };
  const storeTemplate = (key) => {
    if (isProspect) return;
    try { window.localStorage.setItem(storageKey, key); } catch { /* storage is optional */ }
  };
  const updateAddress = (key) => {
    const url = new URL(window.location.href);
    if (key === defaultTemplate) url.searchParams.delete('template');
    else url.searchParams.set('template', key);
    window.history.replaceState({}, '', url);
  };
  const updateContact = () => {
    if (!prospectContact || !isProspect) return;
    const msg = 'Hai Niagova, saya dari ' + forName + '. Saya dah lihat website demo yang disediakan untuk bisnes saya. Saya berminat nak bincang untuk jadikan website ini milik saya: ' + window.location.href;
    prospectContact.href = 'https://wa.me/601158121239?text=' + encodeURIComponent(msg);
    prospectContact.setAttribute('aria-label', 'Discuss this website concept for ' + forName + ' on WhatsApp');
  };
  const finishLoading = () => {
    bar.classList.remove('is-loading');
    preview.removeAttribute('aria-busy');
  };
  const selectTemplate = (key, { persist = true, syncAddress = true } = {}) => {
    const selected = templates[key] || templates[defaultTemplate];
    key = templates[key] ? key : defaultTemplate;
    tabs.forEach((tab) => tab.setAttribute('aria-pressed', String(tab.dataset.template === key)));
    preview.title = isProspect ? forName + ' — ' + selected.label + ' website design preview' : selected.label + ' cat hotel website template preview';
    previewStatus.textContent = 'Previewing ' + selected.label;
    openTemplate.href = withFor(selected.path);
    if (syncAddress) updateAddress(key);
    updateContact();
    const next = withFor(selected.path);
    if (preview.getAttribute('src') !== next) {
      bar.classList.add('is-loading');
      preview.setAttribute('aria-busy', 'true');
      preview.src = next;
    }
    if (persist) storeTemplate(key);
  };

  preview.addEventListener('load', finishLoading);
  if (isProspect) {
    document.body.classList.add('is-personalised');
    prospectBar.hidden = false;
    const initials = forName.replace(/\s+(?:grooming|hotel|spa|boarding)\b.*$/i, '').trim()
      .split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join('');
    document.querySelector('#prospectName').textContent = forName;
    document.querySelector('#prospectMonogram').textContent = initials || '🐾';
    document.title = forName + ' — a website concept by Niagova';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = 'An exclusive mobile-first cat grooming and hotel website preview for ' + forName + ', designed by Niagova.';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex,nofollow';
    document.head.appendChild(robots);
  }
  tabs.forEach((tab) => tab.addEventListener('click', () => selectTemplate(tab.dataset.template)));
  const requested = params.get('template');
  const stored = isProspect ? null : readStoredTemplate();
  const initial = [requested, stored].find((key) => Object.hasOwn(templates, key)) || defaultTemplate;
  selectTemplate(initial, { persist: false, syncAddress: false });
})();
