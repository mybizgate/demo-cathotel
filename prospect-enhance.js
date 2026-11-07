// Optional enhancements for personalised prospect previews.
// Never changes behaviour of the generic, unpersonalised showcase.
(() => {
  'use strict';
  const name = window.demoFor && window.demoFor.name;
  if (!name) return;
  const cleanName = String(name).slice(0,70);
  const apply = () => {
    document.querySelectorAll('a[href*="wa.me/"]').forEach((a) => {
      if (!a.dataset.prospectLink && !a.hasAttribute('data-msg')) return;
      const original = a.getAttribute('data-msg') || 'Hi, I would like to learn more about grooming and boarding.';
      const message = original.replace(/Pet Spa & Hotel/g, cleanName);
      const match = a.href.match(/wa\.me\/(\d+)/);
      if (!match) return;
      a.href = 'https://wa.me/' + match[1] + '?text=' + encodeURIComponent(message + '\n\n(This message is from a Niagova website concept preview.)');
      a.rel = 'noopener noreferrer';
      a.target = '_blank';
    });
    // Explicitly flag any sample ratings displayed in templates, never present them as verified.
    for (const node of document.querySelectorAll('.review-stars, .review-card .stars, .photo-sticker .stars, .rating-card .stars')) {
      if (!node.dataset.sampleMarked) {
        node.dataset.sampleMarked = 'true';
        node.title = 'Illustrative sample, not a verified rating for this business';
      }
    }
  };
  document.addEventListener('click', (event) => {
    const a = event.target.closest('a[href*="wa.me/"]');
    if (a) {
      a.dataset.prospectLink = 'true';
      apply();
    }
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, { once: true });
  else apply();
})();
