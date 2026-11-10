/**
 * STACKLY GAMING STORE - CHARTS SCRIPT (charts.js)
 * High-performance, lightweight pure Vanilla JavaScript SVG charts
 * Supports: Bar Charts, Line Graphs, Area Charts, and Donut/Pie Charts with tooltips
 */

const StacklyCharts = {
  // 1. Create a pure SVG Bar Chart
  createBarChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = options.width || container.clientWidth || 500;
    const height = options.height || 220;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map(d => d.value), 1) * 1.15;
    const barWidth = Math.max(14, (chartW / data.length) * 0.55);
    const step = chartW / data.length;

    let barsSvg = '';
    let labelsSvg = '';
    let gridSvg = '';

    // Horizontal grid lines
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (chartH / gridSteps) * i;
      const val = Math.round(maxVal - (maxVal / gridSteps) * i);
      gridSvg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3,3" />`;
      gridSvg += `<text x="${padding.left - 8}" y="${y + 4}" fill="#606C74" font-size="10" text-anchor="end" font-family="'Plus Jakarta Sans', sans-serif">${options.prefix || ''}${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}</text>`;
    }

    data.forEach((d, i) => {
      const barH = (d.value / maxVal) * chartH;
      const x = padding.left + i * step + (step - barWidth) / 2;
      const y = padding.top + chartH - barH;
      const color = d.color || options.barColor || '#00FF87';

      barsSvg += `
        <rect class="chart-bar" x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${color}" opacity="0.9">
          <title>${d.label}: ${options.prefix || ''}${d.value.toLocaleString()}</title>
        </rect>
      `;

      labelsSvg += `
        <text x="${x + barWidth / 2}" y="${height - 12}" fill="#929EA8" font-size="11" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">${d.label}</text>
      `;
    });

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        ${gridSvg}
        ${barsSvg}
        ${labelsSvg}
      </svg>
    `;
  },

  // 2. Create a pure SVG Line / Area Chart
  createLineChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = options.width || container.clientWidth || 500;
    const height = options.height || 220;
    const padding = { top: 20, right: 25, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map(d => d.value), 1) * 1.15;
    const step = chartW / (data.length - 1);
    const lineColor = options.lineColor || '#00FF87';
    const areaId = 'grad-' + Math.random().toString(36).substr(2, 6);

    let points = [];
    let labelsSvg = '';
    let gridSvg = '';

    // Horizontal grid
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (chartH / gridSteps) * i;
      const val = Math.round(maxVal - (maxVal / gridSteps) * i);
      gridSvg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3,3" />`;
      gridSvg += `<text x="${padding.left - 8}" y="${y + 4}" fill="#606C74" font-size="10" text-anchor="end">${options.prefix || ''}${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}</text>`;
    }

    data.forEach((d, i) => {
      const x = padding.left + i * step;
      const y = padding.top + chartH - (d.value / maxVal) * chartH;
      points.push({ x, y, val: d.value, label: d.label });

      labelsSvg += `
        <text x="${x}" y="${height - 12}" fill="#929EA8" font-size="11" text-anchor="middle">${d.label}</text>
      `;
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    let dotsSvg = '';
    points.forEach(p => {
      dotsSvg += `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="${lineColor}" stroke="#07090A" stroke-width="2">
          <title>${p.label}: ${options.prefix || ''}${p.val.toLocaleString()}</title>
        </circle>
      `;
    });

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        <defs>
          <linearGradient id="${areaId}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.25" />
            <stop offset="100%" stop-color="${lineColor}" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        ${gridSvg}
        <path d="${areaD}" fill="url(#${areaId})" />
        <path d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        ${dotsSvg}
        ${labelsSvg}
      </svg>
    `;
  },

  // 3. Create a pure SVG Donut / Pie Chart
  createDonutChart(containerId, data, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const size = options.size || 200;
    const center = size / 2;
    const radius = size * 0.38;
    const strokeWidth = options.strokeWidth || 28;
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    const circumference = 2 * Math.PI * radius;

    let accumulatedAngle = 0;
    let pathsSvg = '';
    let legendsHtml = '';

    data.forEach(d => {
      const sliceRatio = d.value / total;
      const strokeDashoffset = circumference * (1 - sliceRatio);
      const rotation = (accumulatedAngle / total) * 360 - 90;

      pathsSvg += `
        <circle cx="${center}" cy="${center}" r="${radius}" fill="none"
          stroke="${d.color}" stroke-width="${strokeWidth}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${strokeDashoffset}"
          transform="rotate(${rotation} ${center} ${center})"
          opacity="0.95">
          <title>${d.label}: ${d.value} (${Math.round(sliceRatio * 100)}%)</title>
        </circle>
      `;

      legendsHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.82rem; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="width: 10px; height: 10px; border-radius: 2px; background-color: ${d.color}; display: inline-block;"></span>
            <span style="color: #929EA8;">${d.label}</span>
          </div>
          <span style="color: #FFF; font-weight: 700;">${Math.round(sliceRatio * 100)}%</span>
        </div>
      `;

      accumulatedAngle += d.value;
    });

    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-around; flex-wrap: wrap; gap: 1.5rem;">
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <svg width="${size}" height="${size}">
            ${pathsSvg}
          </svg>
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
            <span style="font-family: 'Chakra Petch', sans-serif; font-size: 1.35rem; font-weight: 700; color: #FFF;">${options.centerText || total}</span>
            <span style="font-size: 0.72rem; color: #8F9BA3; text-transform: uppercase;">${options.centerLabel || 'Total'}</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.6rem; min-width: 150px;">
          ${legendsHtml}
        </div>
      </div>
    `;
  }
};

