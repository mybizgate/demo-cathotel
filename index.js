document.addEventListener('DOMContentLoaded', () => {
  const mark = (name, text) => {
    const item = document.querySelector(`[data-check="${name}"]`);
    item.textContent = text;
    item.classList.add('is-ok');
  };

  mark('js', 'JavaScript loaded');
  const cssLoaded = getComputedStyle(document.documentElement).getPropertyValue('--template-css-loaded').trim() === '1';
  if (cssLoaded) mark('css', 'CSS loaded');
});
