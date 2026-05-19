// ─── State ───────────────────────────────────────────────────────────────────

const state = {
  priceData: {},   // { coinId: { dates: [], prices: [] } }
  charts: {},
  activeReturnsId: 'bitcoin',
  activeSection: 'base100',
};

// ─── Data fetching ───────────────────────────────────────────────────────────

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchCoinData(coin) {
  const url = `${CONFIG.API_BASE}/coins/${coin.cgId}/market_chart?vs_currency=usd&days=${CONFIG.DAYS_3Y}&interval=daily`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const dates  = json.prices.map(p => new Date(p[0]));
    const prices = json.prices.map(p => p[1]);
    return { id: coin.id, dates, prices };
  } catch (e) {
    console.warn(`Failed to fetch ${coin.name}:`, e.message);
    return null;
  }
}

async function loadAllData() {
  const total = CONFIG.coins.length;
  for (let i = 0; i < total; i++) {
    const coin = CONFIG.coins[i];
    updateProgress(i, total, coin.name);
    const data = await fetchCoinData(coin);
    if (data) state.priceData[coin.id] = data;
    if (i < total - 1) await delay(CONFIG.API_DELAY);
  }
  updateProgress(total, total, 'Done');
}

// ─── Progress / Loading UI ───────────────────────────────────────────────────

function updateProgress(step, total, label) {
  const pct = Math.round((step / total) * 100);
  document.getElementById('loading-bar').style.width = pct + '%';
  document.getElementById('loading-label').textContent = label === 'Done'
    ? 'Building charts…'
    : `Fetching ${label} (${step + 1}/${total})`;
}

function hideLoader() {
  const overlay = document.getElementById('loading-overlay');
  overlay.style.opacity = '0';
  setTimeout(() => overlay.style.display = 'none', 600);
}

// ─── Navigation ─────────────────────────────────────────────────────────────

function initNav() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const sec = tab.dataset.section;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(sec).classList.add('active');
      state.activeSection = sec;
    });
  });
}

// ─── Section 1 — Base-100 Performance ───────────────────────────────────────

function buildBase100Chart() {
  const datasets = [];

  CONFIG.coins.forEach(coin => {
    const d = state.priceData[coin.id];
    if (!d) return;
    const norm = normalizeBase100(d.prices);
    datasets.push({
      label: coin.symbol,
      data: d.dates.map((dt, i) => ({ x: dt, y: +norm[i].toFixed(2) })),
      borderColor: coin.color,
      backgroundColor: coin.color + '18',
      borderWidth: 1.8,
      pointRadius: 0,
      tension: 0.2,
      fill: false,
    });
  });

  const ctx = document.getElementById('base100Chart').getContext('2d');
  state.charts.base100 = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#cbd5e1', boxWidth: 12, font: { size: 11 } },
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#94a3b8',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}`,
          },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: { unit: 'month', displayFormats: { month: 'MMM yy' } },
          grid: { color: '#1e293b' },
          ticks: { color: '#64748b', maxRotation: 0, autoSkipPadding: 20 },
        },
        y: {
          grid: { color: '#1e293b' },
          ticks: {
            color: '#64748b',
            callback: v => v.toLocaleString(),
          },
          title: { display: true, text: 'Index (Base = 100)', color: '#64748b' },
        },
      },
    },
  });
}

function buildBase100Stats() {
  const tbody = document.querySelector('#stats3y tbody');
  tbody.innerHTML = '';

  CONFIG.coins.forEach(coin => {
    const d = state.priceData[coin.id];
    if (!d) return;
    const s = coinSummary(d.prices, coin.name);
    const tr = document.createElement('tr');
    const sign = v => v >= 0 ? 'pos' : 'neg';

    tr.innerHTML = `
      <td><span class="dot" style="background:${coin.color}"></span>${coin.symbol}</td>
      <td class="${sign(s.totalReturn)}">${s.totalReturn >= 0 ? '+' : ''}${s.totalReturn.toFixed(1)}%</td>
      <td>${s.annVol.toFixed(1)}%</td>
      <td class="${sign(s.sharpe)}">${s.sharpe.toFixed(2)}</td>
      <td class="neg">-${s.mdd.toFixed(1)}%</td>
      <td>$${s.high.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
      <td>$${s.low.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── Section 2 — Daily Returns ───────────────────────────────────────────────

function buildReturnsCoinSelector() {
  const sel = document.getElementById('returns-coin-select');
  CONFIG.coins.forEach(coin => {
    if (!state.priceData[coin.id]) return;
    const opt = document.createElement('option');
    opt.value = coin.id;
    opt.textContent = `${coin.symbol} — ${coin.name}`;
    sel.appendChild(opt);
  });
  sel.value = state.activeReturnsId;
  sel.addEventListener('change', e => {
    state.activeReturnsId = e.target.value;
    updateReturnsChart();
  });
  updateReturnsChart();
}

function updateReturnsChart() {
  const coin = CONFIG.coins.find(c => c.id === state.activeReturnsId);
  const d = state.priceData[coin.id];
  if (!d) return;

  const ret = dailyReturns(d.prices).map(r => r * 100);
  const retDates = d.dates.slice(1);
  const vol = rollingVolatility(ret.map(r => r / 100), 30, 365);

  const barData = retDates.map((dt, i) => ({ x: dt, y: +ret[i].toFixed(3) }));
  const volData = retDates.map((dt, i) => ({ x: dt, y: vol[i] !== null ? +vol[i].toFixed(2) : null }));

  const barColors = ret.map(r => r >= 0 ? '#22c55e99' : '#ef444499');
  const borderColors = ret.map(r => r >= 0 ? '#22c55e' : '#ef4444');

  if (state.charts.returns) {
    const ch = state.charts.returns;
    ch.data.datasets[0].data = barData;
    ch.data.datasets[0].backgroundColor = barColors;
    ch.data.datasets[0].borderColor = borderColors;
    ch.data.datasets[1].data = volData;
    ch.update('none');
  } else {
    const ctx = document.getElementById('returnsChart').getContext('2d');
    state.charts.returns = new Chart(ctx, {
      type: 'bar',
      data: {
        datasets: [
          {
            label: 'Daily Return (%)',
            data: barData,
            backgroundColor: barColors,
            borderColor: borderColors,
            borderWidth: 0.5,
            barThickness: 'flex',
            yAxisID: 'yRet',
          },
          {
            label: 'Rolling 30d Volatility (% ann.)',
            data: volData,
            type: 'line',
            borderColor: coin.color,
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            yAxisID: 'yVol',
            fill: false,
          },
        ],
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#cbd5e1', font: { size: 11 } } },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#94a3b8',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            type: 'time',
            time: { unit: 'month', displayFormats: { month: 'MMM yy' } },
            grid: { color: '#1e293b' },
            ticks: { color: '#64748b', maxRotation: 0, autoSkipPadding: 20 },
          },
          yRet: {
            position: 'left',
            grid: { color: '#1e293b' },
            ticks: { color: '#64748b', callback: v => v + '%' },
            title: { display: true, text: 'Daily Return (%)', color: '#64748b' },
          },
          yVol: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#64748b', callback: v => v + '%' },
            title: { display: true, text: 'Ann. Volatility (%)', color: '#64748b' },
          },
        },
      },
    });
  }

  // Update stats cards
  const s = coinSummary(d.prices, coin.name);
  document.getElementById('ret-mean').textContent = (mean(ret) >= 0 ? '+' : '') + mean(ret).toFixed(3) + '%';
  document.getElementById('ret-std').textContent  = stdDev(ret).toFixed(3) + '%';
  document.getElementById('ret-skew').textContent = skewness(ret).toFixed(3);
  document.getElementById('ret-kurt').textContent = kurtosis(ret).toFixed(3);
  document.getElementById('ret-vol').textContent  = s.annVol.toFixed(1) + '%';
  document.getElementById('ret-mdd').textContent  = '-' + s.mdd.toFixed(1) + '%';
}

// ─── Section 3 — Portfolio Optimisation ─────────────────────────────────────

function buildOptimisation() {
  const result = monteCarloOptimise(CONFIG.coins, state.priceData, CONFIG.MONTE_CARLO_SIMS);

  // Scatter: efficient frontier
  const minS = Math.min(...result.portfolios.map(p => p.sharpe));
  const maxS = Math.max(...result.portfolios.map(p => p.sharpe));

  function sharpeColor(s) {
    const t = Math.max(0, Math.min(1, (s - minS) / (maxS - minS)));
    const r = Math.round(50 + t * 150);
    const g = Math.round(100 + t * 100);
    const b = Math.round(200 - t * 150);
    return `rgba(${r},${g},${b},0.55)`;
  }

  const scatterCtx = document.getElementById('frontierChart').getContext('2d');
  state.charts.frontier = new Chart(scatterCtx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Simulated Portfolio',
          data: result.portfolios.map(p => ({ x: p.x, y: p.y })),
          backgroundColor: result.portfolios.map(p => sharpeColor(p.sharpe)),
          pointRadius: 2.5,
          pointHoverRadius: 4,
        },
        {
          label: '★ Max Sharpe',
          data: [{ x: result.maxSharpe.annStd * 100, y: result.maxSharpe.annReturn * 100 }],
          backgroundColor: '#f59e0b',
          borderColor: '#fbbf24',
          borderWidth: 2,
          pointRadius: 10,
          pointStyle: 'star',
        },
        {
          label: '● Min Variance',
          data: [{ x: result.minVar.annStd * 100, y: result.minVar.annReturn * 100 }],
          backgroundColor: '#06b6d4',
          borderColor: '#22d3ee',
          borderWidth: 2,
          pointRadius: 8,
        },
      ],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#cbd5e1', font: { size: 11 } } },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#94a3b8',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` Risk: ${ctx.parsed.x.toFixed(1)}%  Return: ${ctx.parsed.y.toFixed(1)}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: '#1e293b' },
          ticks: { color: '#64748b', callback: v => v + '%' },
          title: { display: true, text: 'Annual Risk (σ %)', color: '#64748b' },
        },
        y: {
          grid: { color: '#1e293b' },
          ticks: { color: '#64748b', callback: v => v + '%' },
          title: { display: true, text: 'Annual Return (%)', color: '#64748b' },
        },
      },
    },
  });

  // Doughnut: max Sharpe weights
  const eligible = result.eligible;
  const donutCtx = document.getElementById('weightsChart').getContext('2d');
  state.charts.weights = new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: eligible.map(c => `${c.symbol} (${(result.maxSharpe.weights[eligible.indexOf(c)] * 100).toFixed(1)}%)`),
      datasets: [{
        data: eligible.map(c => +(result.maxSharpe.weights[eligible.indexOf(c)] * 100).toFixed(2)),
        backgroundColor: eligible.map(c => c.color),
        borderColor: '#0f172a',
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#cbd5e1', font: { size: 11 }, padding: 12 } },
        tooltip: {
          backgroundColor: '#1e293b',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
        },
      },
      cutout: '62%',
    },
  });

  // Stats
  const ms = result.maxSharpe, mv = result.minVar;
  document.getElementById('opt-ms-ret').textContent  = (ms.annReturn * 100).toFixed(1) + '%';
  document.getElementById('opt-ms-std').textContent  = (ms.annStd    * 100).toFixed(1) + '%';
  document.getElementById('opt-ms-shr').textContent  = ms.sharpe.toFixed(2);
  document.getElementById('opt-mv-ret').textContent  = (mv.annReturn * 100).toFixed(1) + '%';
  document.getElementById('opt-mv-std').textContent  = (mv.annStd    * 100).toFixed(1) + '%';
  document.getElementById('opt-mv-shr').textContent  = mv.sharpe.toFixed(2);

  // Weights table
  const tbody = document.querySelector('#weights-table tbody');
  tbody.innerHTML = '';
  eligible.forEach((coin, i) => {
    const msW = result.maxSharpe.weights[i] * 100;
    const mvW = result.minVar.weights[i] * 100;
    if (msW < 0.1 && mvW < 0.1) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="dot" style="background:${coin.color}"></span>${coin.symbol}</td>
      <td>${msW.toFixed(1)}%</td>
      <td>${mvW.toFixed(1)}%</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── Section 4 — Last Month ──────────────────────────────────────────────────

function buildLastMonth() {
  const datasets = [];
  CONFIG.coins.forEach(coin => {
    const d = state.priceData[coin.id];
    if (!d || d.prices.length < CONFIG.DAYS_1M) return;
    const slice = d.prices.slice(-CONFIG.DAYS_1M);
    const dates  = d.dates.slice(-CONFIG.DAYS_1M);
    const norm   = normalizeBase100(slice);
    datasets.push({
      label: coin.symbol,
      data: dates.map((dt, i) => ({ x: dt, y: +norm[i].toFixed(2) })),
      borderColor: coin.color,
      backgroundColor: coin.color + '18',
      borderWidth: 2,
      pointRadius: 2,
      tension: 0.3,
      fill: false,
    });
  });

  const ctx = document.getElementById('lastMonthChart').getContext('2d');
  state.charts.lastMonth = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { color: '#cbd5e1', boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#94a3b8',
          bodyColor: '#e2e8f0',
          borderColor: '#334155',
          borderWidth: 1,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}` },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: { unit: 'day', displayFormats: { day: 'MMM d' } },
          grid: { color: '#1e293b' },
          ticks: { color: '#64748b', maxRotation: 0, autoSkipPadding: 15 },
        },
        y: {
          grid: { color: '#1e293b' },
          ticks: { color: '#64748b', callback: v => v.toLocaleString() },
          title: { display: true, text: 'Index (Base = 100 at T−30)', color: '#64748b' },
        },
      },
    },
  });

  // Stats table
  const tbody = document.querySelector('#stats1m tbody');
  tbody.innerHTML = '';
  CONFIG.coins.forEach(coin => {
    const d = state.priceData[coin.id];
    if (!d || d.prices.length < CONFIG.DAYS_1M) return;
    const slice = d.prices.slice(-CONFIG.DAYS_1M);
    const s     = coinSummary(slice, coin.name);
    const ret30 = (slice[slice.length - 1] / slice[0] - 1) * 100;
    const vol30 = stdDev(dailyReturns(slice)) * Math.sqrt(365) * 100;
    const mdd30 = maxDrawdown(slice) * 100;
    const sign  = v => v >= 0 ? 'pos' : 'neg';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="dot" style="background:${coin.color}"></span>${coin.symbol}</td>
      <td class="${sign(ret30)}">${ret30 >= 0 ? '+' : ''}${ret30.toFixed(1)}%</td>
      <td>${vol30.toFixed(1)}%</td>
      <td class="neg">-${mdd30.toFixed(1)}%</td>
      <td>$${Math.max(...slice).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
      <td>$${Math.min(...slice).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main() {
  initNav();
  await loadAllData();
  buildBase100Chart();
  buildBase100Stats();
  buildReturnsCoinSelector();
  buildOptimisation();
  buildLastMonth();
  hideLoader();
}

document.addEventListener('DOMContentLoaded', main);
