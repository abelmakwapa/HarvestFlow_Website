import { initLoader } from './loader.js';
import { initModal } from './modal.js';
import { initNavigation } from './navigation.js';
import { initGsapAnimations } from '../animations/gsap.js';
import { initAnimeInteractions } from '../animations/anime.js';
import { initHeroScene } from '../three/heroScene.js';
import { initDashboardCharts } from '../charts/dashboardCharts.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateDashboardDate() {
  const dashDate = document.getElementById('dashDate');
  if (!dashDate) return;

  const date = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  dashDate.textContent = `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} · ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function initKeyboard(modalApi, navApi) {
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (modalApi.isOpen()) modalApi.close();
      else if (navApi.isOpen()) navApi.close();
    }

    if (event.key === 'Tab') {
      if (modalApi.isOpen()) modalApi.trap(event);
      else if (navApi.isOpen()) navApi.trap(event);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const modalApi = initModal();
  const navApi = initNavigation({ onModalRequest: modalApi.open });

  initKeyboard(modalApi, navApi);
  initLoader({ reduceMotion });
  updateDashboardDate();
  window.setInterval(updateDashboardDate, 30000);

  initGsapAnimations({ reduceMotion });
  initAnimeInteractions({ reduceMotion });
  initHeroScene({ reduceMotion });
  initDashboardCharts({ reduceMotion });
});
