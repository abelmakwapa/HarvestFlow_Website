function fallbackReveals() {
  const revealables = document.querySelectorAll('[data-reveal]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });

    revealables.forEach(element => observer.observe(element));
  } else {
    revealables.forEach(element => element.classList.add('in'));
  }
}

function fallbackCounters() {
  document.querySelectorAll('[data-count]').forEach(element => {
    element.textContent = element.dataset.count;
  });
}

export function initGsapAnimations({ reduceMotion }) {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (reduceMotion || !gsap || !ScrollTrigger) {
    document.querySelectorAll('[data-reveal]').forEach(element => element.classList.add('in'));
    fallbackCounters();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray('[data-reveal]').forEach(element => {
    const delay = parseFloat(getComputedStyle(element).getPropertyValue('--d')) || 0;
    gsap.fromTo(element,
      { autoAlpha: 0, y: 26 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.85,
        delay: delay / 1000,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 86%',
          once: true,
          onEnter: () => element.classList.add('in')
        }
      }
    );
  });

  gsap.to('.hero-watermark', {
    yPercent: -10,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6
    }
  });

  gsap.to('.scene-console', {
    y: -14,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.8
    }
  });

  gsap.utils.toArray('[data-count]').forEach(element => {
    const target = Number.parseInt(element.dataset.count, 10);
    const state = { value: 0 };

    gsap.to(state, {
      value: target,
      duration: 1.4,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: element,
        start: 'top 88%',
        once: true
      },
      onUpdate: () => {
        element.textContent = Math.round(state.value);
      }
    });
  });
}
