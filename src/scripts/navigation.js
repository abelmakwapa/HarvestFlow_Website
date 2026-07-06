import { lockScroll, unlockScroll } from './scrollLock.js';

function trapFocus(container, event) {
  const focusables = container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function initNavigation({ onModalRequest }) {
  const header = document.getElementById('header');
  const navOverlay = document.getElementById('navOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const navClose = document.getElementById('navClose');

  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (!navOverlay || !menuBtn || !navClose) return { isOpen: () => false, close: () => {}, trap: () => {} };

  let open = false;

  const openNav = () => {
    navOverlay.hidden = false;
    requestAnimationFrame(() => navOverlay.classList.add('open'));
    menuBtn.setAttribute('aria-expanded', 'true');
    open = true;
    lockScroll();
    navClose.focus();
  };

  const closeNav = (callback, restoreFocus = true) => {
    navOverlay.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    open = false;
    unlockScroll();
    window.setTimeout(() => {
      navOverlay.hidden = true;
      if (callback) callback();
    }, 400);
    if (restoreFocus) menuBtn.focus();
  };

  menuBtn.addEventListener('click', openNav);
  navClose.addEventListener('click', () => closeNav());

  navOverlay.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', event => {
      if (link.hasAttribute('data-modal-open')) return;
      closeNav(null, false);
    });
  });

  navOverlay.querySelectorAll('[data-modal-open]').forEach(trigger => {
    trigger.addEventListener('click', event => {
      event.preventDefault();
      closeNav(() => onModalRequest(trigger), false);
    });
  });

  return {
    isOpen: () => open,
    close: () => closeNav(),
    trap: event => trapFocus(navOverlay, event)
  };
}
