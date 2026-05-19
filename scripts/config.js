const CONFIG = {
  coins: [
    { id: 'bitcoin',      symbol: 'BTC',   name: 'Bitcoin',      color: '#F7931A', cgId: 'bitcoin'      },
    { id: 'tether',       symbol: 'USDT',  name: 'Tether',       color: '#26A17B', cgId: 'tether'       },
    { id: 'binancecoin',  symbol: 'BNB',   name: 'BNB',          color: '#F3BA2F', cgId: 'binancecoin'  },
    { id: 'usd-coin',     symbol: 'USDC',  name: 'USD Coin',     color: '#2775CA', cgId: 'usd-coin'     },
    { id: 'solana',       symbol: 'SOL',   name: 'Solana',       color: '#9945FF', cgId: 'solana'       },
    { id: 'dogecoin',     symbol: 'DOGE',  name: 'Dogecoin',     color: '#C2A633', cgId: 'dogecoin'     },
    { id: 'hyperliquid',  symbol: 'HYPE',  name: 'Hyperliquid',  color: '#00D4FF', cgId: 'hyperliquid'  },
    { id: 'zcash',        symbol: 'ZEC',   name: 'Zcash',        color: '#ECB244', cgId: 'zcash'        },
    { id: 'canto',        symbol: 'CANTO', name: 'Canton/Canto', color: '#06FC99', cgId: 'canto'        },
    { id: 'stellar',      symbol: 'XLM',   name: 'Stellar',      color: '#14B6E7', cgId: 'stellar'      },
  ],

  stablecoins: new Set(['tether', 'usd-coin']),

  DAYS_3Y: 1095,
  DAYS_1M: 30,
  RISK_FREE_RATE_ANNUAL: 0.045,  // 4.5% annual (US 10-yr approx)
  TRADING_DAYS: 365,             // crypto trades 365 days/year
  MONTE_CARLO_SIMS: 6000,

  // Delay between CoinGecko requests (ms) to avoid rate-limiting
  API_DELAY: 1300,
  API_BASE: 'https://api.coingecko.com/api/v3',
};
