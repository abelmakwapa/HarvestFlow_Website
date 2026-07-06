/* ============================================================
   DASHBOARD CHARTS — Chart.js styled for the pixel operations UI
   Hard ink borders, mono labels, agricultural palette, stepped
   lines, square tooltips. Colors are read from the CSS tokens so
   the charts always match the design system. Draws pixel-bar
   canvas fallbacks when Chart.js (CDN) is unavailable.
   ============================================================ */

const MONO = "'JetBrains Mono', monospace";
const GRID = 'rgba(22,22,15,.12)';

function tokens() {
  const css = getComputedStyle(document.documentElement);
  const get = (name, fallback) => (css.getPropertyValue(name).trim() || fallback);
  return {
    ink: get('--ink', '#16160F'),
    green: get('--green', '#0F6E56'),
    greenDeep: get('--green-deep', '#0A4535'),
    sage: get('--sage', '#2E9E6E'),
    gold: get('--gold', '#D4830A'),
    wheat: get('--gold-2', '#F1C453'),
    blue: get('--blue', '#2563A8'),
    red: get('--red', '#C5221F'),
    track: get('--paper-3', '#E1D6BC'),
    muted: get('--muted', '#59584C')
  };
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function monoTicks(c, extra = {}) {
  return { color: c.muted, font: { family: MONO, size: 10, weight: 700 }, ...extra };
}

function pixelTooltip(c, labelCallback) {
  return {
    backgroundColor: c.ink,
    titleColor: c.wheat,
    bodyColor: '#FFFFFF',
    titleFont: { family: MONO, size: 10, weight: 700 },
    bodyFont: { family: MONO, size: 11, weight: 700 },
    cornerRadius: 0,
    caretSize: 0,
    padding: 10,
    displayColors: false,
    borderColor: c.wheat,
    borderWidth: 2,
    ...(labelCallback ? { callbacks: { label: labelCallback } } : {})
  };
}

/* ---------- canvas fallback: segmented pixel bars ---------- */
function drawFallbackChart(id, values, palette, c) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  canvas.width = width;
  canvas.height = height;

  const max = Math.max(...values, 1);
  const gap = 8;
  const barWidth = Math.max(8, (width - gap * (values.length + 1)) / values.length);

  context.clearRect(0, 0, width, height);
  values.forEach((value, index) => {
    const barHeight = Math.max(4, (height - 8) * (value / max));
    const x = gap + index * (barWidth + gap);
    const y = height - barHeight;
    context.fillStyle = c.track;
    context.fillRect(x, 4, barWidth, height - 8);
    context.fillStyle = palette[index % palette.length];
    context.fillRect(x, y, barWidth, barHeight);
    // segment ticks for the pixel-bar look
    context.strokeStyle = 'rgba(0,0,0,.22)';
    context.lineWidth = 1;
    for (let sx = x + 5; sx < x + barWidth - 2; sx += 6) {
      context.beginPath();
      context.moveTo(sx + 0.5, y + 1);
      context.lineTo(sx + 0.5, height - 1);
      context.stroke();
    }
    context.strokeStyle = c.ink;
    context.lineWidth = 2;
    context.strokeRect(x, y, barWidth, barHeight);
  });
}

function createChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas || !window.Chart) return null;
  return new window.Chart(canvas, config);
}

export function initDashboardCharts({ reduceMotion }) {
  const c = tokens();

  if (!window.Chart) {
    drawFallbackChart('harvestProgressChart', [2, 4, 8, 11, 13, 16, 18], [c.green], c);
    drawFallbackChart('yieldByBlockChart', [2.4, 3.2, 2, 4.1, 2.9, 1.6], [c.sage, c.sage, c.sage, c.gold, c.sage, c.sage], c);
    drawFallbackChart('qualityDistributionChart', [68, 24, 8], [c.green, c.wheat, c.red], c);
    drawFallbackChart('shipmentReadinessChart', [6, 1, 1], [c.green, c.gold, c.blue], c);
    drawFallbackChart('inventoryStatusChart', [128, 36, 14], [c.green, c.gold, c.track], c);
    return;
  }

  const Chart = window.Chart;
  Chart.defaults.font.family = MONO;
  Chart.defaults.color = c.muted;

  const base = () => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: reduceMotion ? false : { duration: 650, easing: 'easeOutQuart' }
  });

  // Harvest overview — stepped sparkline (tonnes picked through the day)
  createChart('harvestProgressChart', {
    type: 'line',
    data: {
      labels: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
      datasets: [{
        data: [2.1, 4.4, 7.9, 10.8, 13.2, 16.1, 18.4],
        borderColor: c.green,
        backgroundColor: hexToRgba(c.green, 0.16),
        fill: true,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 3,
        stepped: true
      }]
    },
    options: {
      ...base(),
      scales: { x: { display: false }, y: { display: false } },
      plugins: {
        legend: { display: false },
        tooltip: pixelTooltip(c, ctx => ` ${ctx.parsed.y} t picked`)
      }
    }
  });

  // Block performance — yield by block, B4 flagged in amber
  createChart('yieldByBlockChart', {
    type: 'bar',
    data: {
      labels: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'],
      datasets: [{
        data: [2.4, 3.2, 2.0, 4.1, 2.9, 1.6],
        backgroundColor: [c.sage, c.sage, c.sage, c.gold, c.sage, c.sage],
        borderColor: c.ink,
        borderWidth: 2,
        borderSkipped: false,
        barPercentage: 0.78,
        categoryPercentage: 0.85
      }]
    },
    options: {
      ...base(),
      scales: {
        x: {
          grid: { display: false },
          ticks: monoTicks(c),
          border: { color: c.ink, width: 2 }
        },
        y: {
          beginAtZero: true,
          grid: { color: GRID },
          ticks: monoTicks(c, { callback: value => `${value}t` }),
          border: { color: c.ink, width: 2 }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: pixelTooltip(c, ctx => ` ${ctx.parsed.y} t harvested`)
      }
    }
  });

  // QC exceptions — grade distribution, holds in alert red
  createChart('qualityDistributionChart', {
    type: 'doughnut',
    data: {
      labels: ['Grade A', 'Grade B', 'QC hold'],
      datasets: [{
        data: [68, 24, 8],
        backgroundColor: [c.green, c.wheat, c.red],
        borderColor: c.ink,
        borderWidth: 2,
        hoverOffset: 0
      }]
    },
    options: {
      ...base(),
      cutout: '56%',
      plugins: {
        legend: { display: false },
        tooltip: pixelTooltip(c, ctx => ` ${ctx.label} · ${ctx.parsed}%`)
      }
    }
  });

  // Shipment queue — order readiness
  createChart('shipmentReadinessChart', {
    type: 'bar',
    data: {
      labels: ['Ready', 'Packing', 'Sched.'],
      datasets: [{
        data: [6, 1, 1],
        backgroundColor: [c.green, c.gold, c.blue],
        borderColor: c.ink,
        borderWidth: 2,
        borderSkipped: false,
        barPercentage: 0.72
      }]
    },
    options: {
      ...base(),
      indexAxis: 'y',
      scales: {
        x: { display: false, max: 8 },
        y: {
          grid: { display: false },
          ticks: monoTicks(c),
          border: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: pixelTooltip(c, ctx => ` ${ctx.parsed.x} of 8 orders`)
      }
    }
  });

  // Inventory by status — cold store / staged / open capacity
  createChart('inventoryStatusChart', {
    type: 'doughnut',
    data: {
      labels: ['Cold store', 'Staged', 'Open'],
      datasets: [{
        data: [128, 36, 14],
        backgroundColor: [c.green, c.gold, c.track],
        borderColor: c.ink,
        borderWidth: 2,
        hoverOffset: 0
      }]
    },
    options: {
      ...base(),
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: pixelTooltip(c, ctx => ` ${ctx.label} · ${ctx.parsed} pallets`)
      }
    }
  });
}
