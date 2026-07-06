const colors = {
  ink: '#111111',
  green: '#0F6E56',
  deepGreen: '#084D3A',
  leaf: '#1A8A6C',
  amber: '#D4830A',
  wheat: '#F1C453',
  sky: '#1A73E8',
  red: '#C5221F',
  canvas: '#FAFAF8',
  grid: 'rgba(17, 17, 17, .13)'
};

function chartOptions(reduceMotion, extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: reduceMotion ? false : { duration: 900, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: colors.ink,
        borderColor: colors.ink,
        borderWidth: 2,
        titleFont: { family: 'JetBrains Mono', size: 11, weight: '700' },
        bodyFont: { family: 'Inter', size: 12 },
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#5F6368', font: { family: 'JetBrains Mono', size: 10, weight: '700' } },
        border: { color: colors.ink, width: 2 }
      },
      y: {
        beginAtZero: true,
        grid: { color: colors.grid },
        ticks: { color: '#5F6368', font: { family: 'JetBrains Mono', size: 10, weight: '700' } },
        border: { color: colors.ink, width: 2 }
      }
    },
    ...extra
  };
}

function createChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas || !window.Chart) return null;
  return new window.Chart(canvas, config);
}

function drawFallbackChart(id, values, palette = [colors.green, colors.amber, colors.sky]) {
  const canvas = document.getElementById(id);
  if (!canvas) return;

  const context = canvas.getContext('2d');
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
    const barHeight = (height - 10) * (value / max);
    const x = gap + index * (barWidth + gap);
    const y = height - barHeight;
    context.fillStyle = palette[index % palette.length];
    context.strokeStyle = colors.ink;
    context.lineWidth = 2;
    context.fillRect(x, y, barWidth, barHeight);
    context.strokeRect(x, y, barWidth, barHeight);
  });
}

export function initDashboardCharts({ reduceMotion }) {
  if (!window.Chart) {
    drawFallbackChart('harvestProgressChart', [2, 4, 8, 11, 13, 16, 18]);
    drawFallbackChart('yieldByBlockChart', [2.4, 3.2, 2, 4.1, 2.9, 1.6]);
    drawFallbackChart('qualityDistributionChart', [68, 24, 8]);
    drawFallbackChart('shipmentReadinessChart', [6, 1, 1]);
    drawFallbackChart('inventoryStatusChart', [128, 36, 14]);
    return;
  }

  createChart('harvestProgressChart', {
    type: 'line',
    data: {
      labels: ['06', '07', '08', '09', '10', '11', '12'],
      datasets: [{
        data: [2.1, 4.4, 7.9, 10.8, 13.2, 16.1, 18.4],
        borderColor: colors.green,
        backgroundColor: 'rgba(15, 110, 86, .12)',
        fill: true,
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.35
      }]
    },
    options: chartOptions(reduceMotion, {
      scales: {
        x: { display: false },
        y: { display: false }
      }
    })
  });

  createChart('yieldByBlockChart', {
    type: 'bar',
    data: {
      labels: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'],
      datasets: [{
        data: [2.4, 3.2, 2.0, 4.1, 2.9, 1.6],
        backgroundColor: [colors.leaf, colors.leaf, colors.leaf, colors.amber, colors.leaf, colors.leaf],
        borderColor: colors.ink,
        borderWidth: 2,
        borderRadius: 0
      }]
    },
    options: chartOptions(reduceMotion)
  });

  createChart('qualityDistributionChart', {
    type: 'doughnut',
    data: {
      labels: ['Grade A', 'Grade B', 'QC hold'],
      datasets: [{
        data: [68, 24, 8],
        backgroundColor: [colors.green, colors.wheat, colors.amber],
        borderColor: colors.ink,
        borderWidth: 2,
        hoverOffset: 0
      }]
    },
    options: chartOptions(reduceMotion, {
      cutout: '58%',
      scales: {},
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: colors.ink, displayColors: false }
      }
    })
  });

  createChart('shipmentReadinessChart', {
    type: 'bar',
    data: {
      labels: ['Ready', 'Packing', 'Scheduled'],
      datasets: [{
        data: [6, 1, 1],
        backgroundColor: [colors.green, colors.amber, colors.sky],
        borderColor: colors.ink,
        borderWidth: 2,
        borderRadius: 0
      }]
    },
    options: chartOptions(reduceMotion, {
      indexAxis: 'y',
      scales: {
        x: { display: false, max: 8 },
        y: {
          grid: { display: false },
          ticks: { color: '#5F6368', font: { family: 'JetBrains Mono', size: 10, weight: '700' } },
          border: { display: false }
        }
      }
    })
  });

  createChart('inventoryStatusChart', {
    type: 'doughnut',
    data: {
      labels: ['Cold store', 'Staged', 'Open'],
      datasets: [{
        data: [128, 36, 14],
        backgroundColor: [colors.green, colors.amber, '#E6F4EA'],
        borderColor: colors.ink,
        borderWidth: 2,
        hoverOffset: 0
      }]
    },
    options: chartOptions(reduceMotion, {
      cutout: '62%',
      scales: {},
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: colors.ink, displayColors: false }
      }
    })
  });
}
