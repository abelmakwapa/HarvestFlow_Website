import { lockScroll, unlockScroll } from './scrollLock.js';

export function initLoader({ reduceMotion }) {
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loaderFill');
  const count = document.getElementById('loaderCount');
  const body = document.body;

  if (!loader || !fill || !count) {
    body.classList.add('ready');
    return;
  }

  lockScroll();

  const finish = () => {
    loader.classList.add('done');
    body.classList.add('ready');
    unlockScroll();
    window.setTimeout(() => loader.remove(), reduceMotion ? 0 : 900);
  };

  if (reduceMotion) {
    fill.style.width = '100%';
    count.textContent = '100';
    finish();
    return;
  }

  if (window.gsap) {
    const progress = { value: 0 };
    window.gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to(progress, {
        value: 100,
        duration: 1.25,
        onUpdate: () => {
          const current = Math.round(progress.value);
          fill.style.width = `${current}%`;
          count.textContent = String(current).padStart(3, '0');
        }
      })
      .to('.loader-center', { y: -10, opacity: 0, duration: 0.36 }, '+=0.08')
      .add(finish);
    return;
  }

  const start = performance.now();
  const duration = 1400;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const p = Math.round(ease(t) * 100);
    fill.style.width = `${p}%`;
    count.textContent = String(p).padStart(3, '0');
    if (t < 1) requestAnimationFrame(tick);
    else window.setTimeout(finish, 180);
  }

  requestAnimationFrame(tick);
}
