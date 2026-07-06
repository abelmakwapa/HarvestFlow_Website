export function initAnimeInteractions({ reduceMotion }) {
  const anime = window.anime;
  if (reduceMotion || !anime) return;

  document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('pointerdown', () => {
      anime.remove(button);
      anime({
        targets: button,
        translateX: [0, 2, 0],
        translateY: [0, 2, 0],
        duration: 180,
        easing: 'easeOutQuad'
      });
    });
  });

  anime({
    targets: '.live-dot',
    scale: [1, 1.38, 1],
    opacity: [1, 0.72, 1],
    duration: 1800,
    easing: 'easeInOutSine',
    loop: true
  });

  const badges = document.querySelectorAll('.flag, .chip, .tile-head .badge');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      anime({
        targets: entry.target,
        translateY: [6, 0],
        opacity: [0, 1],
        duration: 420,
        easing: 'easeOutCubic'
      });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  badges.forEach(badge => observer.observe(badge));
}
