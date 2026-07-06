const html = document.documentElement;
let locks = 0;

export function lockScroll() {
  locks += 1;
  html.classList.add('locked');
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (!locks) html.classList.remove('locked');
}
