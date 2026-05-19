// ─── Basic statistics ───────────────────────────────────────────────────────

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr) {
  const m = mean(arr);
  return arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
}

function stdDev(arr) {
  return Math.sqrt(variance(arr));
}

function skewness(arr) {
  const m = mean(arr);
  const s = stdDev(arr);
  return arr.reduce((sum, x) => sum + ((x - m) / s) ** 3, 0) / arr.length;
}

function kurtosis(arr) {
  const m = mean(arr);
  const s = stdDev(arr);
  return arr.reduce((sum, x) => sum + ((x - m) / s) ** 4, 0) / arr.length - 3;
}

// ─── Returns ────────────────────────────────────────────────────────────────

function dailyReturns(prices) {
  const r = [];
  for (let i = 1; i < prices.length; i++) {
    r.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return r;
}

function normalizeBase100(prices) {
  const base = prices[0];
  return prices.map(p => (p / base) * 100);
}

// Rolling n-period standard deviation (annualised, crypto = 365 trading days)
function rollingVolatility(returns, window = 30, annualFactor = 365) {
  const vol = new Array(window - 1).fill(null);
  for (let i = window - 1; i < returns.length; i++) {
    const slice = returns.slice(i - window + 1, i + 1);
    vol.push(stdDev(slice) * Math.sqrt(annualFactor) * 100);
  }
  return vol;
}

function maxDrawdown(prices) {
  let peak = -Infinity, maxDD = 0;
  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (peak - p) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

// ─── Covariance matrix ──────────────────────────────────────────────────────

function covarianceMatrix(returnsMatrix) {
  const n = returnsMatrix.length;
  const T = returnsMatrix[0].length;
  const means = returnsMatrix.map(mean);
  const cov = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let s = 0;
      for (let t = 0; t < T; t++) {
        s += (returnsMatrix[i][t] - means[i]) * (returnsMatrix[j][t] - means[j]);
      }
      cov[i][j] = cov[j][i] = s / (T - 1);
    }
  }
  return cov;
}

// ─── Portfolio statistics ────────────────────────────────────────────────────

function portfolioStats(weights, dailyMeans, cov, rfDaily) {
  const n = weights.length;
  let dailyReturn = 0;
  for (let i = 0; i < n; i++) dailyReturn += weights[i] * dailyMeans[i];

  let dailyVar = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      dailyVar += weights[i] * weights[j] * cov[i][j];
    }
  }

  const annReturn = dailyReturn * 365;
  const annStd = Math.sqrt(dailyVar) * Math.sqrt(365);
  const sharpe = (annReturn - rfDaily * 365) / annStd;
  return { annReturn, annStd, sharpe };
}

function randomWeights(n) {
  const w = Array.from({ length: n }, () => -Math.log(Math.random())); // Dirichlet-like
  const s = w.reduce((a, b) => a + b, 0);
  return w.map(x => x / s);
}

// ─── Monte Carlo portfolio optimisation ─────────────────────────────────────

function monteCarloOptimise(coins, priceData, nSims = 6000) {
  // Filter out stablecoins and coins with insufficient data
  const eligible = coins.filter(
    c => !CONFIG.stablecoins.has(c.id) && priceData[c.id] && priceData[c.id].prices.length > 60
  );

  // Align all return series to the same dates (shortest series wins)
  const allReturns = eligible.map(c => dailyReturns(priceData[c.id].prices));
  const minLen = Math.min(...allReturns.map(r => r.length));
  const aligned = allReturns.map(r => r.slice(r.length - minLen));

  const rfDaily = CONFIG.RISK_FREE_RATE_ANNUAL / 365;
  const cov = covarianceMatrix(aligned);
  const dailyMeans = aligned.map(mean);

  let maxSharpe = -Infinity, minStd = Infinity;
  let maxSharpeW = null, minStdW = null;
  const portfolios = [];

  for (let i = 0; i < nSims; i++) {
    const w = randomWeights(eligible.length);
    const { annReturn, annStd, sharpe } = portfolioStats(w, dailyMeans, cov, rfDaily);
    if (isNaN(sharpe) || !isFinite(sharpe)) continue;
    portfolios.push({ x: annStd * 100, y: annReturn * 100, sharpe, weights: w });
    if (sharpe > maxSharpe) { maxSharpe = sharpe; maxSharpeW = [...w]; }
    if (annStd < minStd)    { minStd = annStd;   minStdW  = [...w]; }
  }

  const msStats = portfolioStats(maxSharpeW, dailyMeans, cov, rfDaily);
  const mvStats = portfolioStats(minStdW, dailyMeans, cov, rfDaily);

  return {
    eligible,
    portfolios,
    maxSharpe: { weights: maxSharpeW, ...msStats },
    minVar:    { weights: minStdW,    ...mvStats },
  };
}

// ─── Summary stats for a coin ────────────────────────────────────────────────

function coinSummary(prices, label) {
  const ret = dailyReturns(prices);
  const totalReturn = (prices[prices.length - 1] / prices[0] - 1) * 100;
  const annVol = stdDev(ret) * Math.sqrt(365) * 100;
  const rfD = CONFIG.RISK_FREE_RATE_ANNUAL / 365;
  const annRet = mean(ret) * 365 * 100;
  const sharpe = (mean(ret) - rfD) / stdDev(ret) * Math.sqrt(365);
  const mdd = maxDrawdown(prices) * 100;

  return { label, totalReturn, annVol, annRet, sharpe, mdd,
           skew: skewness(ret), kurt: kurtosis(ret),
           high: Math.max(...prices), low: Math.min(...prices) };
}
