// A single toast at the bottom right; a new message replaces the old one.

export function createToast(el) {
  let timer;
  return function toast(text, kind = 'ok') {
    el.textContent = text;
    el.className = `cf-toast is-${kind}`;
    el.hidden = false;
    // next frame so the enter transition runs
    requestAnimationFrame(() => el.classList.add('is-shown'));
    clearTimeout(timer);
    timer = setTimeout(() => {
      el.classList.remove('is-shown');
      setTimeout(() => { el.hidden = true; }, 250);
    }, 5000);
  };
}
