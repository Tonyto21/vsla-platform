const axios = require('axios');
const { db } = require('../models/database');

class ExchangeRateService {
  constructor() {
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY || 'free-api-key';
    this.baseUrl = 'https://api.exchangerate-api.com/v4/latest';
  }

  async getCurrentRate() {
    try {
      // Check cache first (less than 1 hour old)
      const cached = await this.getCachedRate();
      if (cached && this.isRateFresh(cached.fetched_at)) {
        console.log('Using cached exchange rate:', cached.rate);
        return cached.rate;
      }

      // Fetch from API
      console.log('Fetching fresh exchange rate from API...');
      const response = await axios.get(`${this.baseUrl}/USD`);
      const rate = response.data.rates.LRD;
      
      if (!rate) {
        throw new Error('Invalid rate received from API');
      }

      // Cache the rate
      await this.cacheRate(rate);
      console.log('New exchange rate cached:', rate);
      
      return rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error.message);
      // Fallback to cached rate if available
      const cached = await this.getCachedRate();
      if (cached) {
        console.log('Using cached rate as fallback:', cached.rate);
        return cached.rate;
      }
      console.log('Using default fallback rate: 185');
      return 185; // Default fallback rate
    }
  }

  getCachedRate() {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM exchange_rates WHERE base_currency = ? AND target_currency = ? ORDER BY fetched_at DESC LIMIT 1',
        ['USD', 'LRD'],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
  }

  cacheRate(rate) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO exchange_rates (base_currency, target_currency, rate) VALUES (?, ?, ?)',
        ['USD', 'LRD', rate],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  isRateFresh(fetchedAt) {
    const oneHour = 60 * 60 * 1000;
    const isFresh = new Date() - new Date(fetchedAt) < oneHour;
    return isFresh;
  }

  async convertAmount(amount, fromCurrency, toCurrency = 'USD') {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = await this.getCurrentRate();
    if (fromCurrency === 'LRD' && toCurrency === 'USD') {
      return amount / rate;
    } else if (fromCurrency === 'USD' && toCurrency === 'LRD') {
      return amount * rate;
    }
    return amount;
  }

  async formatAmount(amount, currency) {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    return `${currency === 'USD' ? '$' : 'L$'}${formatted}`;
  }
}

module.exports = new ExchangeRateService();