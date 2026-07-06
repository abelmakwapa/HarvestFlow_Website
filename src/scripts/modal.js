import { lockScroll, unlockScroll } from './scrollLock.js';

function trapFocus(container, event) {
  const focusables = container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
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

export function initModal() {
  const backdrop = document.getElementById('modalBackdrop');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modalClose');
  const form = document.getElementById('demoForm');
  const submitBtn = document.getElementById('submitBtn');
  const submitLabel = document.getElementById('submitLabel');
  const successClose = document.getElementById('successClose');

  if (!backdrop || !modal || !form || !submitBtn || !submitLabel) {
    return { open: () => {}, close: () => {}, isOpen: () => false, trap: () => {} };
  }

  let openState = false;
  let lastTrigger = null;

  const open = trigger => {
    lastTrigger = trigger || null;
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('open'));
    openState = true;
    lockScroll();
    window.setTimeout(() => {
      const target = modal.classList.contains('success') ? successClose : document.getElementById('f-name');
      target?.focus();
    }, 80);
  };

  const close = () => {
    backdrop.classList.remove('open');
    openState = false;
    unlockScroll();
    window.setTimeout(() => {
      backdrop.hidden = true;
      if (modal.classList.contains('success')) {
        modal.classList.remove('success');
        form.reset();
        submitLabel.textContent = 'Send request';
        submitBtn.disabled = false;
      }
    }, 380);
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  };

  document.querySelectorAll('[data-modal-open]').forEach(trigger => {
    if (trigger.closest('#navOverlay')) return;
    trigger.addEventListener('click', event => {
      event.preventDefault();
      open(trigger);
    });
  });

  modalClose?.addEventListener('click', close);
  successClose?.addEventListener('click', close);
  backdrop.addEventListener('mousedown', event => {
    if (event.target === backdrop) close();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    submitBtn.disabled = true;
    submitLabel.textContent = 'Sending...';
    window.setTimeout(() => {
      modal.classList.add('success');
      successClose?.focus();
    }, 650);
  });

  return {
    open,
    close,
    isOpen: () => openState,
    trap: event => trapFocus(modal, event)
  };
}
