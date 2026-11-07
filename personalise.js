// Prospect-specific presentation for shared cat-hotel demos.
// ?for= is deliberately URL-scoped: no previous prospect's name leaks through localStorage.
// All service details, prices and photographs remain illustrative until a real client confirms them.
(() => {
  'use strict';
  const SAMPLE = 'Pet Spa & Hotel';
  const params = new URLSearchParams(window.location.search);
  const clean = (value) => String(value || '').replace(/[<>"'\x00-\x1f\x7f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 70);
  const name = clean(params.get('for'));
  window.demoFor = { name, sample: SAMPLE };
  if (!name || name.toLowerCase() === SAMPLE.toLowerCase()) return;

  const shortName = name.replace(/\s+(?:grooming|hotel|boarding|daycare|spa|salon|cat hotel|pet hotel)\b.*$/i, '').trim().slice(0, 36) || name.slice(0, 36);
  const initials = shortName.split(/\s+/).filter((part) => part && !/^(?:and|the|&|dan)$/i.test(part)).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || '🐾';
  const hasGrooming = /groom|spa|salon|dandanan/i.test(name);
  const hasHotel = /hotel|boarding|penginapan|homestay|stay/i.test(name);
  const serviceLine = hasGrooming && hasHotel ? 'Gentle grooming. Cosy cat stays.' : hasGrooming ? 'Gentle grooming, happy little paws.' : 'Cosy stays, cared-for cats.';
  const detailLine = hasGrooming && hasHotel
    ? 'Discover thoughtful grooming, comfortable boarding options and an easy way to enquire — all in one welcoming place for cat parents.'
    : hasGrooming
      ? 'A welcoming home for your grooming services, with beautiful service details and quick WhatsApp enquiries.'
      : 'A welcoming home for cat stays, with clear room details and simple enquiries for pet parents.';

  // Keep the original booking interactions. Replace visible sample branding and encoded WhatsApp greetings.
  const replaceSample = (value) => String(value)
    .split(SAMPLE).join(name)
    .replace(/Kampung Pandan, 55100 Kuala Lumpur/g, 'Location to be confirmed')
    .replace(/Kampung Pandan, Kuala Lumpur/g, 'your neighbourhood')
    .replace(/Kampung Pandan/g, 'your neighbourhood')
    .replace(/certified professional cat groomer/gi, 'cat grooming team')
    .replace(/Certified groomer/g, 'Grooming care')
    .replace(/Certified grooming/g, 'Cat grooming');
  const encoded = encodeURIComponent(SAMPLE);
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue && (node.nodeValue.includes(SAMPLE) || node.nodeValue.includes('Kampung Pandan') || /certified (?:professional cat groomer|groomer|grooming)/i.test(node.nodeValue))) {
        node.nodeValue = replaceSample(node.nodeValue);
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(node.tagName)) return;
    for (const attr of ['aria-label', 'alt', 'title', 'content', 'data-msg', 'placeholder']) {
      const value = node.getAttribute(attr);
      if (value && (value.includes(SAMPLE) || value.includes('Kampung Pandan'))) node.setAttribute(attr, replaceSample(value));
    }
    const href = node.getAttribute('href');
    if (href && href.includes(encoded)) node.setAttribute('href', href.split(encoded).join(encodeURIComponent(name)));
    for (const child of [...node.childNodes]) walk(child);
  };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const setText = (selector, text) => { const node = $(selector); if (node) node.textContent = text; return node; };

  const style = document.createElement('style');
  style.textContent = [
    'body.is-prospect-demo .prospect-logo{display:grid!important;place-items:center!important;flex:none!important;font-family:system-ui,-apple-system,sans-serif!important;font-size:1.05rem!important;font-weight:850!important;letter-spacing:-.06em!important;line-height:1!important;color:#195965!important;}',
    'body.is-prospect-demo .brand-bubble.prospect-logo{font-size:1.25rem!important;color:#fff!important;}',
    'body.is-prospect-demo .brand-mark.prospect-logo{font-size:1.15rem!important;color:#123b48!important;}',
    'body.is-prospect-demo .nav .brand{min-width:0;max-width:350px;white-space:normal!important;font-size:clamp(.88rem,1.3vw,1.16rem);line-height:1.17;}',
    'body.is-prospect-demo .nav .brand>span:last-child{min-width:0;overflow-wrap:anywhere;}',
    'body.is-prospect-demo .site-header .brand{min-width:0;max-width:min(390px,65vw);white-space:normal;overflow-wrap:anywhere;}',
    'body.is-prospect-demo .hero h1{overflow-wrap:break-word;}',
    'body.is-prospect-demo .prospect-signature{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:25px clamp(18px,6vw,70px);background:#103a43;color:#fff;border-block:1px solid rgba(255,255,255,.18);}',
    'body.is-prospect-demo .prospect-signature--playful{background:#342a40;}',
    'body.is-prospect-demo .prospect-signature--modern{background:#193c42;}',
    'body.is-prospect-demo .prospect-signature__left{display:flex;align-items:center;gap:16px;min-width:0;}',
    'body.is-prospect-demo .prospect-signature__mark{display:grid;place-items:center;flex:none;width:54px;height:54px;border:1px solid rgba(255,255,255,.3);border-radius:16px;background:rgba(255,255,255,.13);font:800 1.2rem system-ui,sans-serif;letter-spacing:-.06em;}',
    'body.is-prospect-demo .prospect-signature__title{font:700 clamp(1rem,2vw,1.33rem)/1.25 system-ui,sans-serif;overflow-wrap:anywhere;}',
    'body.is-prospect-demo .prospect-signature__caption{display:block;margin-top:4px;font:500 .79rem/1.4 system-ui,sans-serif;color:rgba(255,255,255,.75);}',
    'body.is-prospect-demo .prospect-signature__right{font:700 .78rem/1.5 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#f5d9aa;text-align:right;flex:none;}',
    'body.is-prospect-demo .prospect-illustrative{font:600 .78rem/1.6 system-ui,sans-serif;color:#526572;letter-spacing:0;text-transform:none;margin-top:12px;max-width:72ch;}',
    'body.is-prospect-demo .sec-head.center .prospect-illustrative{text-align:center;}',
    'body.is-prospect-demo .review-sample-hint{display:block;margin-top:10px;color:#60707b;font-size:.83rem;}',
    '@media(max-width:1000px){body.is-prospect-demo .nav .brand{max-width:290px;}}',
    '@media(max-width:600px){body.is-prospect-demo .nav .brand{max-width:calc(100vw - 175px);font-size:.84rem;}body.is-prospect-demo .prospect-signature{padding:19px 17px;gap:12px;align-items:flex-start;}body.is-prospect-demo .prospect-signature__mark{width:44px;height:44px;border-radius:13px;font-size:1rem;}body.is-prospect-demo .prospect-signature__left{gap:11px;}body.is-prospect-demo .prospect-signature__right{display:none;}body.is-prospect-demo .hero h1{font-size:clamp(2.05rem,9vw,3.4rem);}}',
    '@media(prefers-reduced-motion:reduce){body.is-prospect-demo .prospect-signature *{animation:none!important;}}'
  ].join('\n');
  document.head.appendChild(style);
  document.title = name + ' | Grooming & cat hotel website concept';
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', name + ' — a personalized cat grooming and hotel website preview by Niagova. Content and pricing are illustrative.');
  const robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex,nofollow';
  document.head.appendChild(robots);

  // A lightweight text-only monogram previews the prospect's identity without claiming to be their logo.
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/svg+xml';
  favicon.href = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#195965"/><text x="32" y="42" font-size="24" font-weight="800" font-family="Arial,sans-serif" text-anchor="middle" fill="#fff">' + initials + '</text></svg>');
  document.head.appendChild(favicon);

  const makeLogo = (selector) => {
    const mark = $(selector);
    if (mark) {
      mark.textContent = initials;
      mark.classList.add('prospect-logo');
      mark.setAttribute('aria-label', 'Logo concept for ' + name);
    }
  };
  const signature = (hero, theme) => {
    if (!hero) return;
    const section = document.createElement('aside');
    section.className = 'prospect-signature prospect-signature--' + theme;
    section.setAttribute('aria-label', 'Signature brand concept');
    const left = document.createElement('div');
    left.className = 'prospect-signature__left';
    const mark = document.createElement('span');
    mark.className = 'prospect-signature__mark';
    mark.textContent = initials;
    mark.setAttribute('aria-hidden', 'true');
    const words = document.createElement('div');
    const title = document.createElement('strong');
    title.className = 'prospect-signature__title';
    title.textContent = name;
    const caption = document.createElement('small');
    caption.className = 'prospect-signature__caption';
    caption.textContent = 'Your name. Your story. A website your customers will remember.';
    words.append(title, caption);
    left.append(mark, words);
    const right = document.createElement('span');
    right.className = 'prospect-signature__right';
    right.textContent = serviceLine;
    section.append(left, right);
    hero.insertAdjacentElement('afterend', section);
  };
  const note = (container) => {
    if (!container || container.querySelector('.prospect-illustrative')) return;
    const element = document.createElement('p');
    element.className = 'prospect-illustrative';
    element.textContent = 'Website concept preview — images, prices, packages, reviews and business details are examples. Your actual details will replace them.';
    container.appendChild(element);
  };
  const setHero = (node, suffix) => {
    if (!node) return;
    node.textContent = shortName + '. ';
    const accent = document.createElement('span');
    accent.textContent = suffix;
    node.appendChild(accent);
  };

  const premium = () => {
    makeLogo('.nav .brand .mark');
    setText('.hero .pill', '✦ WELCOME TO ' + name);
    const title = $('.hero h1');
    if (title) {
      title.textContent = shortName + ', ';
      const em = document.createElement('em');
      em.textContent = 'a little more love for every cat.';
      title.appendChild(em);
    }
    setText('.hero .wrap > p', detailLine);
    setText('.hero .cta .wa-link', 'Ask about grooming & stays');
    const other = $('.hero .cta .btn-ghost');
    if (other) { other.href = '#services'; other.textContent = 'Explore our services'; }
    const facts = $$('.hero .facts > span');
    ['Cat grooming', 'Comfortable boarding', 'Simple WhatsApp enquiries', 'A caring experience'].forEach((value, index) => {
      if (facts[index]) {
        for (const child of [...facts[index].childNodes]) if (child.nodeType === Node.TEXT_NODE) child.nodeValue = value;
      }
    });
    const trust = $$('.trust .item');
    [
      ['Made for cat parents', 'Services and stays, clearly presented'],
      ['Gentle grooming', 'A dedicated place to showcase your care'],
      ['Hotel stay options', 'Show rooms, packages and daily routines'],
      ['One-tap enquiries', 'Simple contact and booking journeys']
    ].forEach((pair, index) => {
      if (trust[index]) {
        const label = trust[index].querySelector('b');
        const description = trust[index].querySelector('small');
        if (label) label.textContent = pair[0];
        if (description) description.textContent = pair[1];
      }
    });
    setText('.intro h2', 'A beautiful new home for ' + shortName + '.');
    setText('.intro .lede', name + ' deserves a website that makes your grooming and cat hotel services feel welcoming from the first glance. ' + detailLine);
    setText('.services .sec-head h2', 'Grooming and stays, thoughtfully presented.');
    setText('.services .sec-head .lede', 'Help cat parents understand your services, browse options and make an enquiry in just a few taps.');
    note($('.services .sec-head'));
    const cards = $$('.svc-grid > .svc');
    if (hasGrooming && cards.length > 1) {
      cards[0].classList.remove('featured');
      cards[1].classList.add('featured');
      cards[1].parentElement.insertBefore(cards[1], cards[0]);
      const tag = cards[1].querySelector('.tag');
      if (tag) tag.textContent = 'Signature service';
    }
    const groomTag = $('.svc-grid [data-book="grooming"]');
    if (groomTag) {
      const card = groomTag.closest('.svc');
      const first = card && card.querySelector('li');
      if (first) first.textContent = 'Gentle grooming options for every coat and personality';
    }
    // The reference site used a Google rating, certification and map for a different example business.
    // Do not present them as verified facts about this prospect.
    const rating = $('.reviews .rating-card');
    if (rating) {
      setText('.reviews .rating-card .big', '✦');
      setText('.reviews .rating-card .stars', 'MADE FOR YOUR BRAND');
      setText('.reviews .rating-card small', 'Your real customer reviews can be added once supplied.');
      const google = rating.querySelector('.g');
      if (google) google.hidden = true;
      for (const a of rating.querySelectorAll('a')) {
        a.href = '#book'; a.removeAttribute('target'); a.textContent = 'Try the booking journey';
      }
    }
    for (const paragraph of $$('.reviews p, .steps p')) {
      if (/Kampung Pandan|central Kuala Lumpur|your neighbourhood/i.test(paragraph.textContent)) {
        paragraph.textContent = 'Your confirmed business location and directions can be added here before launch.';
      }
    }
    const location = $('#location');
    if (location) location.hidden = true;
    for (const link of $$('a[href="#location"]')) link.hidden = true;
    const footer = $('footer');
    if (footer) {
      for (const child of footer.querySelectorAll('span')) {
        if (/Kampung Pandan|55100 Kuala Lumpur|your neighbourhood/i.test(child.textContent) && !child.querySelector('a')) child.textContent = 'Website concept preview · Crafted by Niagova';
      }
    }
    note($('.faq .sec-head'));
    signature($('.hero'), 'premium');
  };

  const modern = () => {
    makeLogo('.brand-mark');
    setText('.hero .eyebrow', 'GROOMING & CAT HOTEL');
    setHero($('.hero h1'), serviceLine);
    setText('.hero-lead', name + ' brings grooming and comforting stays together. Discover a website where cat parents can explore services, send an enquiry and feel looked after.');
    setText('.photo-note', 'Little moments of care, beautifully shared.');
    note($('.suites .section-heading'));
    signature($('.hero'), 'modern');
  };

  const playful = () => {
    makeLogo('.brand-bubble');
    setText('.hero .mini-label', 'A happy little place for cat lovers');
    const title = $('.hero h1');
    if (title) {
      title.textContent = 'Hello from ' + shortName + '! ';
      const em = document.createElement('em');
      em.textContent = 'Purrs, pampering & cosy stays.';
      title.appendChild(em);
    }
    setText('.hero-text', detailLine + ' It all starts with a friendly first impression.');
    note($('.services .section-heading'));
    signature($('.hero'), 'playful');
  };

  const init = () => {
    document.body.classList.add('is-prospect-demo');
    walk(document.body);
    if ($('.nav .brand .mark') && $('.rating-card')) premium();
    else if ($('.brand-bubble')) playful();
    else modern();
    // Future text from reservation dialogs and client-side panels must use this business name too.
    const observer = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) walk(node);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
